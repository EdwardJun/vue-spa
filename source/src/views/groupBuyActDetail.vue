<!--拼团活动详情-->
<style lang="sass">
    @import '../sass/page/groupBuyActDetail.scss';
</style>
<template>
    <div class="page" id="group-buy-act-detail-page">
        <div class="top-wrap" :style="{ 'background-image': 'url('+actImageUrl+')' }">
            <router-link class="club-info" tag="div" :to="{ path: '/' + clubId + '/home'}" v-if="!needHide">
                <div :style="{ 'background-image': 'url(' + ( clubLogoUrl || global.defaultClubLogo ) +')' }"></div>
                <span class="club-name">{{ clubName }}</span>
            </router-link>
        </div>
        <div class="act-price-wrap">
            <div>
                <span>￥</span>
                <strong>{{ actPrice | MoneyFilter }}</strong>/{{ itemUnit }}<span>￥{{ itemPrice | MoneyFilter }}/{{ itemUnit }}</span>
            </div>
            <div><span v-if="!needHide">【{{ personalCount }}人团】</span>{{ actName }}</div>
        </div>

        <div class="act-info-wrap">
            <div class="act-name">
                <div>{{ needHide ? '' : '拼团' }}项目：</div>
                <div>{{ itemName }}</div>
            </div>
            <div class="act-time" v-if="actEndTime && !isOver">
                <div>距结束还剩</div>
                <div><span v-show="actEndTimeStr.day>0">{{ actEndTimeStr.day }}</span>{{ actEndTimeStr.day ? '天' : '' }}<span>{{ actEndTimeStr.hour }}</span>时<span>{{ actEndTimeStr.min }}</span>分<span v-show="!actEndTimeStr.day">{{ actEndTimeStr.sec }}</span>{{ !actEndTimeStr.day ? '秒' : '' }}</div>
            </div>
            <div class="act-time over" v-if="actEndTime && isOver">活动已结束！</div>
        </div>
        <div class="act-slogan" v-if="!needHide">
            <div>单打独斗，不如拼团抢购~</div>
            <div>不成团退款</div>
        </div>
        <div class="group-list-wrap" v-show="openGroupList.length" v-if="!needHide">
            <div><span>{{ openGroupList.length }}</span>个团正在进行</div>
            <div>
                <div class="group-item" v-for="(group, index) in openGroupList" v-show="index<3" :key="group.id">
                    <div :style="{ 'background-image': 'url('+(group.avatarUrl || global.defaultHeader)+')' }"></div>
                    <div>{{ group.userName }}</div>
                    <div>
                        <div>还差<span>{{ group.personalCount - group.obtainedCount }}</span>人</div>
                        <div v-show="group.timeStr">剩余<span>{{ group.timeStr }}</span></div>
                    </div>
                    <div @click="doJoinGroup(group)" :class="{ 'disabled': group.personalCount - group.obtainedCount <=0 }">参团</div>
                </div>
            </div>
            <div v-show="openGroupList.length>3" @click="doShowModal('showAllGroupsModal')">查看全部</div>
        </div>
        <div class="club-pos">
            <div>{{ clubName }}</div>
            <div>
                <router-link :to="{ name: 'map', query: { clubId: clubId } }" tag="div">{{ clubAddress }}<span>({{ clubDist }})</span></router-link>
                <div @click="doPopClubTel()"></div>
            </div>
        </div>
        <div class="item-wrap">
            <div class="wrap-title">项目详情</div>
            <div class="item-detail-wrap">
                <div :style="{ 'background-image': 'url('+(itemImageUrl || global.defaultServiceItemImgUrl)+')' }"></div>
                <div>
                    <div>{{ itemName }}</div>
                    <div>{{ itemPrice | MoneyFilter }}元/{{ itemUnit }}<span v-if="itemPlusPrice">加钟</span><span v-if="itemPlusPrice">{{ itemPlusPrice | MoneyFilter }}元/{{ itemPlusUnit }}</span></div>
                </div>
            </div>
            <div class="item-desc-wrap" v-show="itemDesc" v-html="itemDesc"></div>
        </div>
        <div class="desc-wrap">
            <div class="wrap-title">活动详情</div>
            <h3>可用时段</h3>
            <div class="desc-item">使用日期：{{ usePeriodStr }}</div>
            <div class="desc-item">{{ usePeriodTimeStr }}可用</div>
            <h3>活动说明</h3>
            <ul v-if="descArr.length">
                <li v-for="item in descArr" v-show="item">{{ item }}</li>
            </ul>
            <ul v-else><li>暂无说明。</li></ul>
        </div>
        <div class="btn-wrap">
            <div @click="doClickOpenGroup" class="btn-right">
                <div>￥{{ actPrice | MoneyFilter }}<span>￥{{ itemPrice | MoneyFilter }}</span></div>
                <div>我要{{ needHide ? '购买' : '开团' }}</div>
            </div>
        </div>

        <!--pop group list-->
        <div class="pop-modal all-groups-pop" :class="{ active: showAllGroupsModal }">
            <div class="center-wrap">
                <div>正在拼团</div>
                <div>
                    <div class="pop-group-item" v-for="(group, index) in openGroupList" :key="group.id">
                        <div :style="{ 'background-image': 'url('+(group.avatarUrl || global.defaultHeader)+')' }"></div>
                        <div>
                            <div>{{ group.userName }}</div>
                            <div v-show="group.timeStr">剩余<span>{{ group.timeStr }}</span></div>
                        </div>
                        <div>还差<span>{{ group.personalCount - group.obtainedCount }}</span>人</div>
                        <div @click="doJoinGroup(group)" :class="{ 'disabled': group.personalCount - group.obtainedCount <=0 }">参团</div>
                    </div>
                </div>
                <div @click="doCloseModal('showAllGroupsModal')">&times;</div>
            </div>
        </div>

        <!--活动结束弹窗-->
        <div class="pop-modal act-over-pop" :class="{ active: showActOverModal }" @click="doCloseModal('showActOverModal')">
            <div class="center-wrap" @click="doClickModalWrap($event)">
                <div>活动已结束！</div>
                <router-link tag="div" :to="{ name: 'groupBuyActFinished', query: {id: actId, clubId: clubId}}">确定</router-link>
            </div>
        </div>

        <!--活动已满员弹窗-->
        <div class="pop-modal act-complete-pop" :class="{ active: showActCompleteModal }" @click="doCloseModal('showActCompleteModal')">
            <div class="center-wrap" @click="doClickModalWrap($event)">
                <div>该{{ needHide ? '' : '拼团' }}活动已满员！请重新选择</div>
                <div @click="doCloseModal('showActCompleteModal')">确定</div>
            </div>
        </div>

        <!--发起、参与拼团弹窗-->
        <div class="pop-modal act-launch-pop" :class="{ active: showPayModal }" @click="doCloseModal('showPayModal')">
            <div @click="doClickModalWrap($event)">
                <div class="info-title">{{ payType== 'join' ? '参与' : '发起' }}{{ needHide ? '' : '拼团' }}<div @click="doCloseModal('showPayModal')"></div></div>
                <div class="act-info">
                    <div class="act-info-name"><label>{{ needHide ? '' : '拼团' }}活动：</label><span>{{ actName }}</span></div>
                    <div class="act-info-price"><label>{{ needHide ? '价格' : '拼团价' }}</label><span>¥{{ actPrice | MoneyFilter }}</span></div>
                    <div class="act-info-count"><label>{{ needHide ? '' : '拼团' }}份数：</label><span @click="doStepCount(-1)" :class="{ active: count != 1 }"></span><input type="text" maxlength="4" v-model="count" @input="doInputCount" /><span @click="doStepCount(1)" :class="{ active: count != personalCount - currJoinGroupObtainedCount }"></span></div>
                    <div class="act-info-tech"><label>营销人员：</label><span>{{ techId ? techName + (techNum ? '[' + techNum+']' : '') : '未选择' }}</span><a @click="doShowModal('isShowTechSelectorPop')">{{ techId ? '重新选择' : '请选择' }}</a></div>
                </div>
                <div class="pop-btn"><div @click="doClickPayBtn()">{{ inProcessing ? '正在支付' : '确认支付' }} ¥{{ (count * actPrice) | MoneyFilter }}</div></div>
            </div>
        </div>
        <TechSelector :tech-id="techId" :is-show="isShowTechSelectorPop" @commit="doCommitSelector" @close="doCloseModal('isShowTechSelectorPop')"></TechSelector>

    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import eventHub from '../libs/hub'
    import MoneyFilter from '../filters/money-formatter'
    import TechSelector from '../components/tech-selector'

    export default {
        filters: {
            MoneyFilter
        },
        components: {
            TechSelector
        },
        data () {
            return {
                global: Global.data,
                clubId: '',
                clubLogoUrl: '',
                clubName: '',
                actId: '', // 活动ID
                isOver: false, // 活动是否结束
                payType: 'join', // launch--发起  join--参与
                showPayModal: false, // 控制支付弹窗的显示
                showActCompleteModal: false, // 控制活动已满员弹窗
                showActOverModal: false, // 控制活动已结束弹窗
                itemImageUrl: '', // 项目图
                actImageUrl: '',
                actName: '', // 活动名称
                itemId: '',
                itemName: '', // 项目名称
                itemPrice: 0, // 项目价格
                itemUnit: '',
                itemPlusPrice: 0, // 加钟价格
                itemPlusUnit: '', // 加钟单位
                itemDesc: '', // 项目描述
                actPrice: 0,
                personalCount: '-', // 多少人团
                openGroupList: [], // 正在的拼团
                showAllGroupsModal: false, // 控制所有拼团的显示
                actTimer: null, // 活动结束定时器
                groupTimer: null, // 定时器
                actEndTime: 0, // 活动结束时间
                actEndTimeStr: {
                    day: 0,
                    hour: 0,
                    min: 0,
                    sec: 0
                },
                clubAddress: '', // 会所地址
                clubDist: '定位中...',
                descArr: [], // 活动说明
                payPrice: 0, // 支付金额
                count: 1, // 份数
                openGroupId: '', // 参团GroupId
                techId: '', // 技师ID
                inProcessing: false, // 支付进行中
                isShowTechSelectorPop: false,
                techAvatar: '',
                techNum: '',
                techName: '',
                usePeriodStr: '不限',
                usePeriodTimeStr: '',
                currJoinGroupObtainedCount: 0 // 当前参与的团的已有人数
            }
        },
        computed: {
            needHide () {
                return this.clubId == '602057981877559296'
            }
        },
        created () {
            let that = this
            let global = that.global
            let query = global.currPage.query
            that.actId = query.id
            that.clubId = query.clubId || global.clubId
            if (!that.actId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            that.techId = query.techId
            if (that.techId) {
                Util.sessionStorage('saleTechId', that.techId)
            } else {
                that.techId = Util.sessionStorage('saleTechId') || ''
            }
            that.$http.get('../api/v2/user/group/buy/activity/detail', {params: {
                activityId: that.actId
            }}).then(res => {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    if (res.status != 1) { // 非上线状态
                        return that.$router.push({name: 'groupBuyActFinished', query: {id: that.actId, clubId: that.clubId}})
                    }
                    that.itemImageUrl = res.itemImageUrl
                    that.actName = res.name
                    that.actImageUrl = res.imageUrl
                    that.itemId = res.itemId
                    that.itemName = res.itemName
                    that.itemPrice = res.itemPrice
                    that.itemUnit = res.itemUnit
                    that.actPrice = res.price
                    if (res.usePeriod) {
                        that.usePeriodStr = '拼团成功起' + res.usePeriod + '天有效'
                    } else if (res.useStartTime && res.useEndTime) {
                        that.usePeriodStr = res.useStartTime.slice(0, -3) + ' 至 ' + res.useEndTime.slice(0, -3)
                    }
                    if (res.useDay) {
                        if (res.useDay.match(/(\d)/g).length == 7) {
                            res.useDay = '170'
                        }
                        that.usePeriodTimeStr = (res.useDay || '').replace(/(\d)/g, function () {
                            return ['周日', '周一', '周二', '周三', '周四', '周五', '周六', '至'][arguments[1]]
                        }) + ' ' + ((res.beginAt && (res.beginAt != res.endAt)) ? (res.beginAt + ':00 - ' + res.endAt + ':00') : '')
                        that.usePeriodTimeStr = that.usePeriodTimeStr.replace(/,/g, '，')
                    } else if (res.customUseTime) {
                        that.usePeriodTimeStr = Util.getCustomActTime(res.customUseTime)
                    }

                    if (res.openGroupList && res.openGroupList.length) { // 正在进行中的拼团
                        that.doComputedGroupTime(res.openGroupList)
                        that.groupTimer = setInterval(() => {
                            that.doComputedGroupTime()
                        }, 1000)
                    }
                    if (res.endTime) { // 活动结束倒计时
                        that.actEndTime = res.endTime
                        that.doComputedActTime()
                        that.actTimer = setInterval(() => {
                            that.doComputedActTime()
                        }, that.actEndTimeStr.day ? 60 * 1000 : 1000)
                    }
                    that.personalCount = res.personalCount
                    let descArr = []
                    if (res.description) {
                        descArr = res.description.split('\n')
                        that.descArr = descArr
                    }
                    global.loading = false
                    that.getClubAddress()
                    that.getClubDist()
                    that.initShareConfig()
                    that.queryItemDetail()
                    // 统计接口
                    that.$http.post('../api/v2/user/group/buy/update/click/count', {
                        activityId: that.actId,
                        originShareUserId: query.techId || query.userId || '',
                        shareUserId: query.userId || query.techId || ''
                    })
                } else {
                    Util.tipShow(res.msg || '获取活动详情失败！')
                    return that.$router.back()
                }
            })
            if (global.pageMode != 'club') {
                that.$http.get('../api/v2/club/' + that.clubId + '/clubName').then(res => {
                    res = res.body
                    that.clubLogoUrl = res.logo
                    that.clubName = res.name
                    global.clubTelephone = res.telephone ? res.telephone.split(',') : []
                })
            } else {
                that.clubLogoUrl = global.clubLogoUrl
                that.clubName = global.clubName
            }
        },
        methods: {
            // 查询项目详情
            queryItemDetail () {
                let that = this
                that.$http.get('../api/v2/project/item', {params: {itemId: that.itemId}}).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.itemDesc = res.description
                        if (res.priceList && res.priceList[0] && res.priceList[0].itemList && res.priceList[0].itemList[1]) {
                            let priceObj = res.priceList[0].itemList[1]
                            that.itemPlusPrice = priceObj.price
                            that.itemPlusUnit = priceObj.amount + priceObj.unitName
                        }
                    }
                })
            },
            // 设置分享
            initShareConfig () {
                let that = this
                let global = that.global
                // 设置分享
                if (global.userAgent.isWX) {
                    Global.shareConfig({
                        title: that.actName,
                        desc: '没有大动作，哪敢惊动你！' + that.itemName + '，原价' + ((that.itemPrice / 100).toFixed(2)) + '，现仅需' + ((that.actPrice / 100).toFixed(2)) + '元，立刻点击参与！',
                        link: global.prefixPathname + '?#/' + that.clubId + '/groupBuyActDetail?id=' + that.actId + '&techId=' + (that.techId || '') + '&userId=' + global.userId,
                        imgUrl: that.itemImageUrl,
                        success () {
                            that.$http.post('../api/v2/user/group/buy/update/share/count', {
                                activityId: that.actId, shareUserId: global.userId
                            })
                        }
                    }, 'groupBuyAct-' + that.actId)
                }
            },
            // 关闭弹窗
            doCloseModal (type) {
                this[type] = false
            },
            // 显示弹窗
            doShowModal (type) {
                this[type] = true
            },
            // 其他区域关闭弹窗
            doClickModalWrap (e) {
                e.stopPropagation()
            },
            // 开团
            doClickOpenGroup () {
                let that = this
                if (that.isOver) {
                    that.showActOverModal = true
                    return
                }
                that.payType = 'launch'
                that.showPayModal = true
                that.openGroupId = ''
                that.currJoinGroupObtainedCount = 0
            },
            // 参团
            doJoinGroup (group) {
                let that = this
                if (that.isOver) {
                    that.showActOverModal = true
                    return
                }
                if (group.personalCount - group.obtainedCount > 0) {
                    that.payType = 'join'
                    that.showPayModal = true
                    that.openGroupId = group.id
                    that.currJoinGroupObtainedCount = group.obtainedCount
                } else {
                    that.showActCompleteModal = true
                }
            },
            doClickPayBtn () {
                let that = this
                let global = that.global
                let ua = global.userAgent
                let query = global.currPage.query
                if (!that.count) {
                    return Util.tipShow('请输入购买份数！')
                }
                if (parseInt(that.count) == 0) {
                    return Util.tipShow('购买份数需大于0！')
                }
                if (!ua.isWX) {
                    return Util.tipShow('请在微信中打开！')
                }
                if (!(parseFloat(that.count * that.actPrice) < 500000)) {
                    return Util.tipShow('支付金额请不要超过5000元！')
                }
                if (that.inProcessing) {
                    return Util.tipShow('支付中，请稍候...')
                }
                that.inProcessing = true
                that.$http.post('../api/v2/wx/pay/group_buy/save', {
                    activityId: that.actId,
                    clubId: that.clubId,
                    count: that.count - 0,
                    openGroupId: that.openGroupId,
                    techId: that.techId,
                    originShareUserId: query.techId || query.userId || '',
                    shareUserId: query.userId || query.techId || ''
                }).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        if (ua.isWX) {
                            that.doInvokeWxPay(res)
                        } else if (ua.isAliPay) {
                            that.doInvokeAliPay(res)
                        }
                    } else {
                        that.inProcessing = false
                        Util.tipShow(res.msg || '支付请求失败！')
                        if (res.respData == 'PHONE_NOT_EXISTS') { // 弹出绑定手机号码
                            Global.bindTelPhone()
                        }
                    }
                }, () => {
                    that.inProcessing = false
                    Util.tipShow('支付请求失败！')
                })
            },
            doInvokeWxPay (res) {
                let that = this
                if (res.statusCode == 200) { // 输入金额为0的处理
                    let payInfo = JSON.parse(res.respData)
                    Global.wxJsBridgeReady(() => {
                        WeixinJSBridge.invoke(
                            'getBrandWCPayRequest', {
                                appId: payInfo.appId,
                                timeStamp: payInfo.timeStamp + '',
                                nonceStr: payInfo.nonceStr,
                                package: payInfo.package,
                                signType: payInfo.signType,
                                paySign: payInfo.paySign
                            },
                            function (payRes) {
                                that.inProcessing = false
                                if (payRes.err_msg && payRes.err_msg.indexOf('ok') >= 0) { // 支付成功之后
                                    that.afterPay(payInfo.bizId)
                                } else {
                                    Util.tipShow('未能成功支付！')
                                    that.$http.post('../api/v2/wx/pay/activity/payment/cancel', {
                                        payId: payInfo.payId
                                    })
                                }
                            })
                    })
                } else if (res.statusCode == 935801) {
                    Global.getOauthCode('9358', 'group-buy', 'base')
                } else {
                    that.inProcessing = false
                    Util.tipShow(res.msg || '支付失败！')
                }
            },
            doInvokeAliPay (res) {
                let that = this
                let global = that.global
                if (res.statusCode == 200) {
                    let payInfo = JSON.parse(res.respData)
                    Global.alipayJsBridgeReady(() => {
                        AlipayJSBridge.call('tradePay', {
                            tradeNO: payInfo.tradeNO
                        }, function (result) {
                            that.inProcessing = false
                            if (global.debugMode) {
                                alert('支付宝支付结果：' + JSON.stringify(result))
                            }
                            if (result.resultCode == '9000') {
                                that.afterPay(payInfo.bizId)
                            } else if (result.resultCode == '8000') {
                                Util.tipShow('正在处理中！')
                            } else if (result.resultCode == '4000') {
                                Util.tipShow('支付失败！')
                            } else if (result.resultCode == '6001' || result.resultCode == '99') {
                                Util.tipShow('您取消了支付！')
                                that.$http.post('../api/v2/wx/pay/activity/payment/cancel', {
                                    payId: payInfo.payId
                                })
                            } else if (result.resultCode == '6002') {
                                Util.tipShow('网络连接出错！')
                            }
                        })
                    })
                } else {
                    that.inProcessing = false
                    Util.tipShow(res.msg || '支付失败！')
                }
            },
            afterPay (bizId) {
                let that = this
                let params = { id: that.actId, type: that.payType, count: that.count, clubId: that.clubId, orderId: bizId, techId: that.techId }
                that.$router.push({name: 'groupBuyActJoinSuccess', query: params}) // 跳转到成功页面
            },
            // 拼团剩余时间的计算
            doComputedGroupTime (list) {
                let that = this
                list = list || that.openGroupList
                let res = []
                let day = 0
                let hour = 0
                let min = 0
                let sec = 0
                let delt = 0
                let num = 0
                const floor = Math.floor
                const paddingTime = Util.paddingTime
                list.forEach(item => {
                    if (item.endTime) {
                        delt = item.endTime - (+new Date())
                        if (delt >= 0) {
                            item.isOver = false
                            num = delt / 1000
                            sec = floor(num % 60)
                            min = floor(num / 60 % 60)
                            hour = floor(num / 3600 % 24)
                            day = floor(num / 3600 / 24)
                            if (day == 0) {
                                item.timeStr = paddingTime(hour) + ':' + paddingTime(min) + ':' + paddingTime(sec)
                            } else {
                                item.timeStr = day + '天 ' + paddingTime(hour) + ':' + paddingTime(min) + ':' + paddingTime(sec)
                            }
                            res.push(item)
                        }
                    } else {
                        item.timeStr = ''
                        res.push(item)
                    }
                })
                that.openGroupList = res
            },
            // 活动时间倒计时
            doComputedActTime () {
                let that = this
                let actEndTime = that.actEndTime
                let obj = that.actEndTimeStr
                let delt = 0
                let num = 0
                const floor = Math.floor
                delt = actEndTime - (+new Date())
                const paddingTime = Util.paddingTime
                if (delt > 0) {
                    num = delt / 1000
                    obj.sec = paddingTime(floor(num % 60))
                    obj.min = paddingTime(floor(num / 60 % 60))
                    obj.hour = paddingTime(floor(num / 3600 % 24))
                    obj.day = floor(num / 3600 / 24)
                } else {
                    that.isOver = true // 活动已结束
                    clearInterval(that.actTimer)
                    that.showActOverModal = true
                }
            },
            // 获取会所地址
            getClubAddress () {
                let that = this
                that.$http.get('../api/v2/club/club_map', {params: {clubId: that.clubId}}).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.clubAddress = res.respData.address
                    }
                })
            },
            // 获取会所距离
            getClubDist () {
                let that = this
                let global = that.global
                that.$http.get('../api/v1/position/club/distance', {
                    params: {
                        clubId: that.clubId,
                        lat: global.currLaty || '',
                        lon: global.currLngx || ''
                    }
                }).then((res) => {
                    res = res.body
                    if (res.statusCode == 200) {
                        let dist = ''
                        if (res.respData && res.respData.distance) {
                            dist = res.respData.distance
                            if (dist / 1000 > 1) {
                                dist = (dist / 1000).toFixed(1) + ' km'
                            } else {
                                dist = dist.toFixed(0) + ' m'
                            }
                        } else {
                            dist = '定位失败'
                        }
                        that.clubDist = dist
                    }
                })
            },
            doPopClubTel () {
                let that = this
                if (that.global.clubTelephone.length == 0) {
                    Util.tipShow('暂无会所电话！')
                } else {
                    eventHub.$emit('change-tel-detail', true)
                }
            },
            doInputCount () {
                let that = this
                let val = that.count
                if (/\D/.test(val)) {
                    val = val.replace(/\D/g, '')
                }
                that.count = val
            },
            // 选择技师回调
            doCommitSelector (data) {
                let that = this
                that.techId = data.techId
                that.techAvatar = data.techAvatar
                that.techNum = data.techNum
                that.techName = data.techName
            },
            doStepCount (num) {
                let that = this
                if (!that.count) {
                    that.count = 0
                }
                that.count = (that.count - 0) + num
                let max = that.personalCount - that.currJoinGroupObtainedCount
                if (that.count <= 0) {
                    that.count = 1
                } else if (that.count > max) {
                    that.count = max
                }
            }
        },
        beforeDestroy () {
            let that = this
            if (that.groupTimer) {
                clearInterval(that.groupTimer)
            }
            if (that.actTimer) {
                clearInterval(that.actTimer)
            }
        }
    }
</script>