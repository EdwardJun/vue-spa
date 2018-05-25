<style lang="sass">
    @import '../sass/page/confirmOrder.scss';
</style>
<template>
    <div class="page" id="confirm-order-page" :class="{pBottom: isCanAppoint}" :style="{'min-height': global.winHeight+'px'}">
        <div class="tech-info">
            <div :style="{ 'background-image': 'url(' + (tech.avatarUrl || global.defaultHeader) + '),url(' + global.defaultHeader + ')' }" @click="doClickTechHeader()"><div v-if="tech.id" :class="tech.status">{{ tech.status == 'free' ? '闲' : '忙' }}</div></div>
            <div>
                <div>{{ tech.name }}<span v-show="tech.serialNo">[<span>{{ tech.serialNo }}</span>]</span></div>
                <div>{{ tech.description || '这个技师很懒，没有填写个人简介...' }}</div>
            </div>
        </div>
        <div class="item service-item-info">
            <div :class="{ active: serviceItemList.length > 0 }" @click="doShowServiceItemPicker()">预约项目：<span>{{ serviceItem.name }}</span></div>
            <div>项目价格：<span v-if="serviceItem.id">{{ serviceItem.price | itemPriceFormatter(serviceItem.duration, serviceItem.durationUnit) }}</span><span v-else>待定</span></div>
        </div>
        <div class="arrive-info">
            <div>到店日期<div></div></div>
            <div @click="doShowTimePicker()"><span>到店时间：</span><span :class="{ active: isCanAppoint }">{{ isCanAppoint ? currAppointTimeStr : '无可预约时间' }}</span></div>
            <div v-show="showItemDurationList">项目时长：</div>
            <div v-show="showItemDurationList"><span v-for="(item,index) in itemDurationList" :class="{ cancel: item.isCancel, disabled: item.isDisabled, active: item.isActive}" @click="doSelectItemDuration(item)" :key="index">{{ item.timeStr }}</span></div>
        </div>

        <div class="contact-info item">
            <div>联系人：<input maxlength="5" v-model="contactName"/></div>
            <div>手机号码：<span>{{ global.userTel }}</span></div>
        </div>

        <div class="appoint-info item" v-show="isPayAppointment && downPayment>0">
            <div>预约现金：<span :class="{ del : oldOrderId }">￥{{ downPayment }}元</span></div>
            <div v-if="appointType=='paid_full'">支付金额可在结账时抵扣{{ serviceItem.name }}消费，过期不退。</div>
            <div v-else>此定金可在结账时抵扣{{ serviceItem.name }}消费</div>
        </div>

        <div class="tip-info" v-html="tipStr" v-show="isPayAppointment && downPayment>0"></div>
        <div class="submit-button footer" v-show="isCanAppoint" :class="{ active: currAppointTime.time, processing: inSubmit, disabled: inSubmit }" @click="doConfirmOrder()">{{ inSubmit ? '预约中...' : '确认预约' }}</div>

        <div class="pop-modal time-picker-modal" :class="{ active: isShowTimePicker }">
            <div class="center-wrap">
                <div>选择到店时间<span @click="doCloseTimePicker()">&times;</span></div>
                <div class="day-list">
                    <div :class="{ active: index == selectedTimeTab }" v-for="(item,index) in fDates" @click="doSwitchTimeTab(index)" :key="index">{{ item.dateStr }}</div>
                </div>
                <div class="time-list" v-for="(timeList, index) in timesData" :class="{ active: index == selectedTimeTab }" :key="index">
                    <div v-for="(time, tindex) in timeList.time" :class="{ disabled: time.status === 'N' || (time.status == 'Y' && !time.tmpFlag), active: time==currPickerTime }" @click="doPickTime(time, index)" :key="tindex">
                        <span :style="{ display: (time.status=='Y' && !time.tmpFlag ? 'block' : '') }">{{ time.timeStr }}</span>
                        <span v-show="!(time.status=='Y' && !time.tmpFlag)">&#45;&#45;:&#45;&#45;</span>
                    </div>
                </div>
                <div class="selected-time">到店时间：<span v-if="currPickerTime.time">{{ currPickerDateStr }}{{ currPickerTime.timeStr }}</span><span v-else>--:--</span></div>
                <div class="confirm-button" :class="{ disabled: !currPickerTime.time }" @click="doConfirmOfTime()">确认预约</div>
            </div>
        </div>

        <div class="pop-modal service-picker-modal" :class="{ active: isShowServicePicker }">
            <div class="center-wrap">
                <div>选择服务项目<span @click="doCloseServiceItemPicker()">&times;</span></div>
                <div class="service-list">
                    <div class="service-item" v-for="(item,index) in serviceItemList" :class="{ active: currPickedItem == item }" @click="doPickerServiceItem(item)" :key="index">
                        <div></div>
                        <div :style="{ 'background-image': 'url(' + (item.imageUrl || global.defaultServiceItemImgUrl) + ')' }"></div>
                        <div>
                            <div>{{ item.name }}</div>
                            <div>
                                <div>{{ item.price1 | itemPriceFormatter(item.duration1,item.durationUnit) }}</div>
                                <div v-show="item.price2"><span>加钟</span> {{ item.price2 | itemPriceFormatter(item.duration2,item.durationUnitPlus) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="selected-service">预约项目：<span>{{ currPickedItem.id ? currPickedItem.name : '未选择项目' }}</span></div>
                <div class="confirm-button" @click="doConfirmOfPickerItem()">确认预约</div>
            </div>
        </div>
    </div>
</template>
<script>
    import Vue from 'vue'
    import Global from '../libs/global'
    import eventHub from '../libs/hub'
    import im from '../libs/im'
    import Util from '../libs/util'
    import ItemPriceFormatter from '../filters/item-price-formatter'

    export default {
        data () {
            return {
                global: Global.data,
                techId: '',
                itemId: '',
                clubId: '',
                oldOrderId: '',
                oldDownPayment: '',
                oldOrderCustomerName: '',
                downPayment: 0,
                initDownPayment: 0,
                isPayAppointment: false, // 是否付费预约
                appointType: '',
                tipStr: '温馨提示：订单生成后过期未到将作废。',
                isCanAppoint: true, // 是否可以预约

                tech: {}, // 技师信息
                serviceItem: {}, // 服务项目信息
                contactName: '',

                days: ['今天', '明天', '后天'],
                weeks: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
                allTimes: [],
                fDates: [],
                timesData: [],
                selectedTimeTab: 0, // 当前选择的时间Tab
                serviceDuration: 0,
                serviceItemList: [],
                currAppointTime: {},
                currAppointTimeStr: '--:--',
                currPickerTime: {}, // 在时间窗口上选择的时间
                currPickerDateStr: '',
                isShowTimePicker: false, // 是否弹出时间选择窗口

                telephone: '',

                itemDurationList: [], // 项目时长列
                showItemDurationList: true, // 是否显示项目时长选择区域
                isShowServicePicker: false, // 是否弹出服务项目选择窗口
                currPickedItem: {}, // 当前在窗口选择的项目

                inSubmit: false, // 是否正在提交
                paramData: null,
                isCrossInner: false, // 是否对接内网
                selectTimeId: '', // 内网会用到此值
                qrcodeId: '', // 二维码ID
                qrcodeType: '' // 二维码类型

            }
        },
        filters: {
            itemPriceFormatter: ItemPriceFormatter
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            var authCode = query.code || global.authCode

            document.title = '确认订单'
            that.techId = query.techId
            that.itemId = query.itemId
            that.clubId = query.clubId || global.clubId
            that.oldOrderId = query.orderId
            that.oldDownPayment = query.downPayment
            that.oldOrderCustomerName = query.customerName
            that.paramData = Util.localStorage('con-order-param') || null
            if (that.paramData) {
                that.paramData = JSON.parse(that.paramData)
            }

            if (that.paramData && authCode && global.userAgent.isWX) {
                Global.getOpenId({authCode: authCode}).then(function () {
                    that.initPage()
                })
            } else {
                that.initPage()
            }
        },
        methods: {
            /**
             * 页面初始化
             */
            initPage () {
                var that = this
                var global = that.global
                var ss = Util.sessionStorage
                that.qrcodeId = ss('qrcodeId') || ''
                that.qrcodeType = ss('qrcodeType')
                // console.log(`qrcodeId=${that.qrcodeId}`)
                // console.log(`qrcodeType=${that.qrcodeType}`)
                var k
                if ((!that.techId && !that.itemId) || !that.clubId) {
                    Util.tipShow(global.visitError)
                    return that.$router.back()
                }

                // init duration list
                var durations = ['45分钟', '1小时', '1.5小时', '2小时']
                var durationTimes = [45, 60, 90, 120]
                var durationList = []
                for (k = 0; k < 4; k++) {
                    durationList.push({
                        timeStr: durations[k],
                        time: durationTimes[k],
                        isCancel: true,
                        isDisabled: k == 3,
                        isActive: k == 1
                    })
                }
                that.itemDurationList = durationList

                that.$http.get('../api/v2/club/order/appoint/view', {params: {
                    clubId: that.clubId, techId: that.techId || '', itemId: that.itemId || ''
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.isCrossInner = res.hasInnerProvider === 'true'
                        that.initDownPayment = that.downPayment = res.downPayment || 0
                        that.isPayAppointment = that.isCrossInner || /^(paid|paid_full)$/.test(res.appointType)
                        that.appointType = res.appointType
                        if (res.tech) {
                            res.tech.chatId = res.emchatId || ''
                            that.tech = res.tech
                        } else {
                            that.tech = {
                                id: '',
                                avatarUrl: '',
                                name: '技师待定',
                                description: '到店选择技师'
                            }
                        }
                        if (res.appointDescription) {
                            that.tipStr = res.appointDescription
                        }
                        if (res.item) {
                            if (that.appointType == 'paid_full') {
                                that.downPayment = res.item.price
                            }
                            that.serviceItem = res.item
                            that.showItemDurationList = false
                        } else {
                            that.serviceItem = {
                                id: '',
                                name: '到店选择'
                            }
                            that.showItemDurationList = true
                        }
                        if (that.oldOrderId) {
                            that.downPayment = that.oldDownPayment
                            that.contactName = that.oldOrderCustomerName
                            that.showItemDurationList = false
                        }

                        // 预约时间的处理
                        var isActive = false
                        var timesData = []
                        var fObj
                        var fDates = []
                        var today
                        var timeObj
                        var allTimes = []

                        if (that.isCrossInner) { // 对接内网 如果已无可预约时间，则隐藏"确认预约"按钮，及不再弹出时间选择窗
                            if (res.time.length <= 0) {
                                that.isCanAppoint = false // 不可预约
                            } else {
                                that.isCanAppoint = true
                                var tmpDays = {}
                                var tmpDate = new Date()
                                for (k = 0; k < 3; k++) {
                                    tmpDays[Util.dateFormat(that.getDateObj(tmpDate, (k == 0 ? 0 : 1)).currDate, 'yyyy-MM-dd')] = that.days[k]
                                }
                                that.days = tmpDays
                                for (k = 0; k < res.time.length; k++) {
                                    timeObj = res.time[k]
                                    if (timeObj.time && timeObj.time.length > 0) {
                                        isActive = true
                                    }
                                    timesData[timeObj.id] = timeObj
                                    timeObj.time.tmpFlag = (timeObj.time.status != 'Y')
                                    timeObj.time.status = 'Y'
                                    allTimes.push(timeObj.time)
                                }
                                that.allTimes = allTimes

                                today = new Date(res.today)
                                today = Util.dateFormat(today, 'yyyy-MM-dd') == timesData[0].day ? today : new Date(timesData[0].day.replace(/-/g, '/'))
                                for (k = 1; k <= res.time.length; k++) {
                                    fObj = that.getDateObj(today, (k == 1 ? 0 : 1))
                                    fObj.dateStr = that.days[res.time[k - 1].day] + fObj.month + '月' + fObj.day + '日'
                                    fObj.dayIndex = k + 2 - res.time.length
                                    fDates.push(fObj)
                                }
                                that.fDates = fDates
                                that.timesData = timesData
                            }
                        } else {
                            for (k = 0; k < res.time.length; k++) {
                                timeObj = res.time[k]
                                if (timeObj.time && timeObj.time.length > 0) {
                                    isActive = true
                                }
                                timeObj.time.sort(function (a, b) {
                                    return a.time - b.time
                                })
                                timesData[timeObj.id] = timeObj
                                Array.prototype.push.apply(allTimes, timeObj.time)
                            }

                            var tmpDuration = 45
                            var dt
                            if (that.itemId) {
                                var serviceItem = res.item
                                var durationUnit = serviceItem.durationUnit
                                var duration = serviceItem.duration

                                if (/次/g.test(durationUnit)) {
                                    tmpDuration = Number(duration) * 60
                                } else if (/天/g.test(durationUnit)) {
                                    tmpDuration = Number(duration) * 24 * 60
                                } else if (/时/g.test(durationUnit)) {
                                    tmpDuration = Number(duration) * 60
                                } else {
                                    tmpDuration = Number(duration)
                                }
                                that.serviceDuration = tmpDuration
                            }
                            dt = Math.ceil(tmpDuration / 30)
                            var tmpTs
                            var flag
                            var currTime = (+new Date())
                            var zeroTime = new Date()
                            zeroTime.setHours(8, 0, 0, 0)
                            zeroTime = zeroTime.getTime()
                            for (k = 0; k < allTimes.length; k++) {
                                timeObj = allTimes[k]
                                if (timeObj.day == 0 && zeroTime + timeObj.time < currTime) {
                                    timeObj.tmpFlag = false
                                } else if (timeObj.status == 'N') {
                                    timeObj.tmpFlag = false
                                } else if (k + 1 < allTimes.length) {
                                    tmpTs = allTimes.slice(k + 1, k + dt)
                                    flag = tmpTs.every(function (obj) {
                                        return obj.status != 'N'
                                    })
                                    timeObj.tmpFlag = flag
                                } else {
                                    timeObj.tmpFlag = true
                                }
                                timesData[~~(k / 48)]['time'][k % 48].tmpFlag = timeObj.tmpFlag
                            }
                            today = new Date(res.today)

                            for (k = 1; k < 4; k++) {
                                fObj = that.getDateObj(today, (k == 1 ? 0 : 1))
                                fObj.dateStr = that.days[k - 1] + fObj.month + '月' + fObj.day + '日'
                                fObj.dayIndex = k + 2 - res.time.length
                                fDates.push(fObj)
                            }
                            that.fDates = fDates
                            that.timesData = timesData
                            that.allTimes = allTimes
                        }

                        if (!isActive) {
                            that.isCanAppoint = false
                        }
                        var contactName = Util.localStorage('customerName')
                        if (contactName && !that.oldOrderId) {
                            that.contactName = contactName
                        }
                        that.queryServiceItemData()
                        // console.dir(allTimes)

                        // has param data handler
                        if (that.paramData) {
                            Util.removeLocalStorage('con-order-param')
                            var paramData = that.paramData
                            var paramDuration = {45: 1, 60: 2, 90: 3, 120: 4}[paramData.serviceDuration]
                            if (paramDuration) {
                                durationList = that.itemDurationList
                                for (k = 0; k < durationList.length; k++) {
                                    durationList[k].isCancel = false
                                    durationList[k].isActive = (k == paramDuration - 1)
                                    that.refreshItemDurationList(durationList[k], k)
                                }
                            }
                            that.currAppointTimeStr = paramData.arriveTime
                            that.contactName = paramData.username
                            that.doPay(paramData.dateDay, paramData.dateTime, paramData.downPayment, paramData.serviceDuration)
                        }
                        global.loading = false
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                        return that.$router.back()
                    }
                }, function () {
                    Util.tipShow(global.loadError)
                    return that.$router.back()
                })

                // 查询会所的预约类型
                that.$http.get('../api/v2/club/technician/{techId}/section/bottom', {params: {techId: that.techId || ''}}).then(function (appointRes) {
                    appointRes = appointRes.body
                    if (appointRes.statusCode == 200) {
                        appointRes = appointRes.respData
                        that.telephone = appointRes.telephone ? appointRes.telephone.split(',') : []
                        that.appointType = appointRes.appointType
                    }
                })
            },

            /**
             * 点击确认预约按钮
             */
            doConfirmOrder () {
                var that = this
                var durationList = that.itemDurationList
                var selectedDuration
                var k
                var global = that.global
                var currAppointTime = that.currAppointTime
                if (!global.userTel) {
                    return eventHub.$emit('pop-bind-phone')
                }
                if (that.contactName) {
                    Util.localStorage('customerName', that.contactName)
                }
                if (that.inSubmit) {
                    return
                }
                if (!that.serviceItem.id && that.appointType == 'paid_full') {
                    return Util.tipShow('请选择预约项目！')
                } else if (that.appointType != 'phone') {
                    if (!that.isCanAppoint) {
                        return Util.tipShow('当前无可预约时间！')
                    }
                    if (!that.currAppointTime.time) {
                        return Util.tipShow('请选择到店时间！')
                    }
                    if (!that.contactName) {
                        return Util.tipShow('请输入联系人姓名！')
                    }
                    that.inSubmit = true
                }
                if (!that.serviceItem.id) { // 没有选择服务项目的情况
                    for (k = 0; k < durationList.length; k++) {
                        if (durationList[k].isActive) {
                            selectedDuration = durationList[k]
                            break
                        }
                    }
                    that.serviceDuration = (selectedDuration.isDisabled ? 0 : selectedDuration.time)
                }
                if (!that.oldOrderId) {
                    if (!that.serviceItem.id && that.serviceDuration == 0) {
                        that.inSubmit = false
                        return Util.tipShow('无项目时长，请更改到店时间！')
                    }

                    // 付费预约的情况
                    if (that.isPayAppointment && that.downPayment > 0) {
                        if (!global.userAgent.isWX) {
                            that.inSubmit = false
                            if (Global.checkAccess('confirmOrder')) {
                                return Util.tipShow('请您打开微信登录\'小摩豆\'公众号！')
                            } else {
                                return Util.tipShow('会所未开通付费预约权限！')
                            }
                        }

                        if (!global.isLogin) { // 未登录
                            that.inSubmit = false
                            Util.tipShow('请您先登录！')
                            return Global.login(that.$router)
                        } else {
                            that.doPay(currAppointTime.date.dayIndex, currAppointTime.time.timeStr, that.downPayment, that.serviceDuration)
                        }
                    } else { // 非付费预约
                        that.$http.post('../api/v2/club/order/appoint', {
                            username: that.contactName,
                            dateDay: currAppointTime.date.dayIndex,
                            dateTime: currAppointTime.time.timeStr,
                            clubId: that.clubId,
                            techId: that.techId || '',
                            itemId: that.itemId || '',
                            orderType: that.appointType,
                            downPayment: 0,
                            serviceDuration: that.serviceDuration,
                            timeId: that.selectTimeId
                        }).then(function (res) {
                            res = res.body
                            that.inSubmit = false
                            if (res.statusCode == 200) {
                                Util.tipShow('预约成功！')
                                // 二维码统计
                                that.$http.post('../api/v1/scan/code/stat', {
                                    clubId: that.clubId,
                                    qrcodeId: that.qrcodeId || '',
                                    qrcodeType: that.qrcodeType,
                                    statType: 'appoint'  // 预约
                                }).then((res) => {
                                    res = res.body
                                    // console.log(res)
                                })
                                that.sendMessage(res.respData)
                            } else {
                                Util.tipShow(res.msg || '预约请求失败！')
                            }
                        }, function () {
                            Util.tipShow('预约请求失败！')
                            that.inSubmit = false
                        })
                    }
                } else { // has oldOrderId
                    that.$http.get('../api/v2/club/order/update_time', {params: {
                        clubId: that.clubId,
                        dateDay: currAppointTime.date.dayIndex,
                        dateTime: currAppointTime.time.timeStr,
                        orderId: that.oldOrderId,
                        timeId: that.selectTimeId
                    }}).then(function (res) {
                        res = res.body
                        that.inSubmit = false
                        if (res.statusCode == 200) {
                            Util.tipShow('预约成功！')
                            that.sendMessage(that.oldOrderId)
                        } else {
                            Util.tipShow(res.msg || '预约请求失败！')
                        }
                    }, function () {
                        Util.tipShow('预约请求失败！')
                        that.inSubmit = false
                    })
                }
            },

            /**
             * 微信支付
             */
            doPay (dateDay, dateTime, downPayment, serviceDuration) {
                var that = this
                var paramData = {
                    businessChannel: 'link',
                    clubId: that.clubId || '',
                    dateDay: dateDay || 0,
                    dateTime: dateTime,
                    // downPayment: downPayment,
                    itemId: that.itemId || '',
                    orderType: that.appointType,
                    serviceDuration: serviceDuration,
                    techId: that.techId || '',
                    tradeChannel: 'wx',
                    username: that.contactName,
                    timeId: that.selectTimeId // 内网对接所需的timeId
                }
                var errorInfo = '付费预约失败！'

                that.$http.post('../api/v2/wx/pay/paid_order', paramData).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        var payInfo = JSON.parse(res.respData)
                        Global.wxJsBridgeReady(() => {
                            WeixinJSBridge.invoke('getBrandWCPayRequest', {
                                appId: payInfo.appId,
                                timeStamp: payInfo.timeStamp + '',
                                nonceStr: payInfo.nonceStr,
                                package: payInfo.package,
                                signType: payInfo.signType,
                                paySign: payInfo.paySign
                            }, function (payRes) {
                                that.inSubmit = false
                                if (payRes.err_msg.indexOf('ok') >= 0) { // 支付成功之后
                                    Util.tipShow('支付成功！')
                                    that.sendMessage(payInfo.bizId)
                                    // 二维码统计
                                    that.$http.post('../api/v1/scan/code/stat', {
                                        clubId: that.clubId,
                                        qrcodeId: that.qrcodeId || '',
                                        qrcodeType: that.qrcodeType,
                                        statType: 'appoint'  // 预约
                                    })
                                } else {
                                    Util.tipShow('未能成功支付！')
                                    if (that.isCrossInner) {
                                        that.$http.get('../api/v2/wx/pay/delete_order', {params: {orderId: payInfo.bizId}})
                                    } else {
                                        that.$router.push({name: 'order'})
                                    }
                                }
                            })
                        })
                    } else if (res.statusCode == 935801) {
                        paramData.arriveTime = that.currAppointTimeStr
                        Util.localStorage('con-order-param', JSON.stringify(paramData))
                        Global.getOauthCode('9358', 'confirm-order', 'base')
                    } else {
                        Util.tipShow(res.msg || errorInfo)
                        that.inSubmit = false
                    }
                }, function () {
                    Util.tipShow(errorInfo)
                    that.inSubmit = false
                })
            },

            /**
             * 弹出服务项目选择窗口
             */
            doShowServiceItemPicker () {
                var that = this
                if (that.serviceItemList.length > 0) {
                    that.isShowServicePicker = true
                }
            },

            /**
             * 关闭服务项目选择窗口
             */
            doCloseServiceItemPicker () {
                this.isShowServicePicker = false
            },

            /**
             * 预约时有项目，初始化currPickedItem
             */
            initCurrPickedItem () {
                var that = this
                var serviceItemList = that.serviceItemList
                var k
                if (that.itemId) {
                    for (k = 0; k < serviceItemList.length; k++) {
                        if (serviceItemList[k].id == that.itemId) {
                            that.currPickedItem = serviceItemList[k]
                        }
                    }
                }
            },

            /**
             * 点击服务项目列表的某一项
             */
            doPickerServiceItem (item) {
                var that = this
                if (that.appointType == 'paid_full' && item == that.currPickedItem) {
                    return
                }
                if (item == that.currPickedItem) { // 清除选择
                    that.serviceItem = that.currPickedItem = {
                        id: '', name: '到店选择'
                    }
                } else {
                    that.currPickedItem = item
                }
            },

            /**
             * 点击服务项目选择窗口上的“确认预约”按钮
             */
            doConfirmOfPickerItem () {
                var that = this
                var serviceItem = that.serviceItem
                var currPickedItem = that.currPickedItem

                that.itemId = serviceItem.id = currPickedItem.id
                serviceItem.name = currPickedItem.name
                serviceItem.price = currPickedItem.price1 || '待定'
                serviceItem.duration = currPickedItem.duration1
                serviceItem.durationUnit = currPickedItem.durationUnit
                if (that.appointType == 'paid_full') {
                    that.downPayment = currPickedItem.price1 || that.initDownPayment
                }
                that.showItemDurationList = !that.itemId
                that.isShowServicePicker = false
            },

            /**
             * 查询服务项目
             */
            queryServiceItemData () {
                var that = this
                // 查询服务项目，若已选择技师，则查询技师可服务的项目，否则查询所有服务项目
                if (that.techId) {
                    that.$http.get('../api/v1/profile/tech/getServiceItemByTech', {params: {techId: that.techId}}).then(function (res) {
                        res = res.body
                        if (res.statusCode == 200) {
                            that.serviceItemList = res.respData || []
                            that.initCurrPickedItem()
                        } else {
                            Util.tipShow(res.msg || '查询技师服务项目失败！')
                        }
                    })
                } else {
                    that.$http.get('../api/v2/club/{clubId}/categoryService', {params: {clubId: that.clubId}}).then(function (res) {
                        res = res.body
                        if (res.length) {
                            var list = []
                            var i = 0
                            for (; i < res.length; i++) {
                                list = list.concat(res[i].serviceItems)
                            }
                            that.serviceItemList = list
                            that.initCurrPickedItem()
                        }
                    })
                }
            },

            /**
             * 点击技师头像的处理
             */
            doClickTechHeader () {
                var that = this
                var tech = that.tech
                if (tech.id) {
                    that.$router.push({name: 'chat', query: {techId: tech.id, clubId: that.clubId}})
                }
            },

            /**
             * 获取日期信息对象
             */
            getDateObj (date, add) {
                if (add) {
                    date.setDate(date.getDate() + add)
                }
                return {
                    currDate: date,
                    date: date.getTime(),
                    year: date.getFullYear(),
                    month: date.getMonth() + 1,
                    day: date.getDate(),
                    week: date.getDay()
                }
            },

            /**
             *  弹出时间选择窗口
             */
            doShowTimePicker () {
                var that = this
                if (that.isCanAppoint) {
                    that.isShowTimePicker = true
                }
            },

            /**
             *  关闭时间选择窗口
             */
            doCloseTimePicker () {
                this.isShowTimePicker = false
            },

            /**
             *  切换时间选择窗口中的tab
             */
            doSwitchTimeTab (index) {
                var that = this
                if (that.selectedTimeTab != index) {
                    that.selectedTimeTab = index
                    that.currPickerTime = {time: '', timeStr: ''}
                }
            },

            /**
             *  在时间窗口上选择时间
             */
            doPickTime (time, index) {
                var that = this
                if (time.status == 'N' || (time.status == 'Y' && !time.tmpFlag)) {
                    return
                }
                that.currPickerTime = time
                var dateObj = that.fDates[index]
                that.currPickerDateStr = dateObj.month + '月' + dateObj.day + '日 ' + that.weeks[dateObj.week] + ' '
            },

            /**
             *  在时间窗口上点击“确定预约”
             */
            doConfirmOfTime () {
                var that = this
                var currPickerTime = that.currPickerTime
                var tabIndex = that.selectedTimeTab
                if (currPickerTime.time) {
                    that.selectTimeId = currPickerTime.timeId || ''
                    var dateObj = that.fDates[tabIndex]
                    that.currAppointTimeStr = dateObj.month + '月' + dateObj.day + '日 ' + that.weeks[dateObj.week] + ' ' + currPickerTime.timeStr
                    that.currAppointTime = { // 当前确定的预约时间
                        date: dateObj,
                        time: currPickerTime
                    }

                    // 判断时长是否可选，未选服务项目时
                    if (!that.serviceItem.id) {
                        var k
                        var durationItem
                        var list = that.itemDurationList
                        for (k = 0; k < list.length; k++) {
                            durationItem = list[k]
                            durationItem.isCancel = false
                            durationItem.isDisabled = false
                        }

                        var timeIndex = tabIndex * 48 + that.timesData[tabIndex].time.indexOf(currPickerTime)
                        var dt
                        var tempArr
                        var flag
                        var i

                        list.every(function (durationItem, k) {
                            dt = Math.ceil(durationItem.time / 30)
                            tempArr = that.allTimes.slice(timeIndex + 1, timeIndex + dt)
                            flag = tempArr.every(function (obj) {
                                return obj.status !== 'N'
                            })
                            if (!flag) {
                                for (i = k; i < list.length; i++) {
                                    list[i].isDisabled = true
                                    if (i == 1) {
                                        list[0].isActive = true
                                    } else {
                                        list[1].isActive = true
                                    }
                                }
                                return false
                            }
                            return true
                        })

                        for (k = 0; k < list.length; k++) {
                            durationItem = list[k]
                            that.refreshItemDurationList(durationItem, k)
                        }
                    }
                    that.isShowTimePicker = false
                }
            },

            /**
             *  选择项目时长
             */
            doSelectItemDuration (item) {
                var that = this
                if (item.isCancel || item.isDisabled) {
                    return
                }
                var list = that.itemDurationList
                for (var k = 0; k < list.length; k++) {
                    list[k].isActive = (list[k] == item)
                    that.refreshItemDurationList(list[k], k)
                }
            },

            /**
             *  刷新项目时长选择区域的显示
             */
            refreshItemDurationList (item, index) {
                var that = this
                var list = that.itemDurationList
                index = index || list.indexOf(item)
                Vue.set(list, index, item)
            },

            /**
             *  发送预约消息
             */
            sendMessage (bizId) {
                let that = this
                if (!that.techId || !that.tech.chatId || that.isCrossInner) {
                    that.$router.push({ name: 'orderDetail', query: { id: bizId, tag: 'submit' } })
                } else {
                    let tech = that.tech
                    im.doSendAppointTechMessage({ // 发送预约消息
                        to: tech.chatId,
                        data: {
                            appointTime: that.currAppointTimeStr,
                            serviceItemName: that.serviceItem.name,
                            orderId: bizId
                        }
                    })
                    if (that.isPayAppointment && that.downPayment > 0) {
                        that.$router.push({ name: 'order' })
                    } else {
                        that.$router.push({ name: 'orderDetail', query: { id: bizId, tag: 'submit' } }) // 订单详情页面
                    }
                }
            }
        }
    }
</script>
