<style lang="sass">
    @import '../sass/page/itemPackageDetail.scss';
</style>
<template>
    <div class="item-package-detail-page-wrap">
        <div class="page" id="item-package-detail-page" :class="{'padding-more': actData.statusName == '已售完' || actData.statusName == '已过期'}">
            <div class="banner" :style="{ 'background-image': 'url('+actData.bannerImg+')' }">
                <router-link :to="{ path: '/'+clubId+'/home' }" tag="div"><div :style="{ 'background-image': 'url('+clubLogo+')' }"></div><span>{{ clubName }}</span></router-link>
            </div>

            <!--套餐-->
            <div class="package-wrap" v-if="cardType == 'item_package'">
                <div>{{ actData.name }}</div>
                <ul class="paid">
                    <li v-for="plan in paidPlans" :key="plan.id"><div>{{ plan.itemName }}</div><div>{{ (plan.itemAmount/100).toFixed(2) }}元 * {{ plan.itemUnit }}</div><div>{{ plan.giveCount + plan.paidCount }}</div></li>
                </ul>
                <ul class="give" v-if="givePlans.length>0">
                    <li v-for="plan in givePlans"><div>{{ plan.itemName }}</div><div>{{ (plan.itemAmount/100).toFixed(2) }}元 * {{ plan.itemUnit }}</div><div>{{ plan.giveCount + plan.paidCount }}</div></li>
                </ul>
                <div>
                    <span>特价&nbsp;&nbsp;¥&nbsp;<b>{{ actData.actAmount }}</b></span>
                    <span>原价<span>¥&nbsp;{{ actData.originalAmount }}</span></span>
                </div>
            </div>

            <!--积分礼品-->
            <div class="integral-wrap" v-if="cardType == 'credit_gift'">
                <div>{{ actData.name }}</div>
                <ul>
                    <li v-for="(plan,index) in creditPlans" :key="index"><div>{{ plan.itemName }}</div><div>{{ (plan.itemAmount/100).toFixed(2) }}元 * {{ plan.itemUnit }}</div><div>{{ plan.paidCount }}</div></li>
                </ul>
                <div>
                    <span><b>{{ actData.credits }}</b>积分</span>
                    <span>原价&nbsp;<span>¥{{ actData.originalAmount }}</span></span>
                </div>
            </div>

            <!--购买须知-->
            <div class="item-wrap pay">
                <div class="item-title">购买须知</div>
                <div class="strong">有效期</div>
                <div>自购买之日起<strong>{{ actData.period }}内</strong></div>
                <div class="strong">补充说明</div>
                <div v-html="actData.description.replace(/\n/g,'<p>')"></div>
            </div>

            <!--相关项目-->
            <div class="item-wrap service" v-show="serviceItems.length>0">
                <div class="item-title">相关项目</div>
                <router-link tag="div" :to="{name: 'serviceItem', query: {id: item.id}}" class="service-item" v-for="item in serviceItems" :key="item.id">
                    <div :style="{'background-image':'url('+(item.imageUrl || global.defaultServiceItemImgUrl)+')'}"></div>
                    <div>{{ item.name }}</div>
                    <div>{{ item.price }}元/{{ item.duration }}{{ item.durationUnit }}<template v-if="item.pricePlus"><span>加钟</span>{{ item.pricePlus }}元/{{ item.durationPlus }}{{ item.durationUnitPlus }}</template></div>
                </router-link>
            </div>
        </div>
        <div class="submit-button footer" :class="{ sellOut: actData.statusName == '已售完' , expired: actData.statusName == '已过期', processing: inProcessing }" @click="doClickConfirmBtn()">{{ isNotPay ? '逛商城、找优惠' : payBtnText + (inProcessing ? '中...' : '') }}</div>

        <!--技师选择窗口-->
        <div class="tech-selector pop-modal" v-if="!techId" :class="{ active: showTechSelectorPop }">
            <div class="center-wrap">
                <div>选择销售人员</div>
                <input placeholder="请输入编号或昵称" maxlength="40" v-model="techSearchText" @input="refreshTechList()"/>
                <h4>或选择</h4>
                <div>
                    <div class="tech-wrap" v-for="tech in techSearchRes" :key="tech.techId" :class="{ active: currSelectedTechId==tech.techId }" @click="doSelectTech(tech.techId, tech.techName)">
                        <div :style="{ 'background-image': 'url('+(tech.avatarUrl || global.defaultHeader)+')' }"></div>
                        <div v-html="tech.techNameStr"></div>
                        <div v-if="tech.techNo" v-html="tech.techNoStr"></div>
                    </div>
                </div>
                <div><div @click="doCancelTechSelectorPop()">取消</div><div @click="doConfirmTechSelectorPop()">确定</div></div>
            </div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import MoneyFormatter from '../filters/money-formatter'

    export default {
        filters: {
            MoneyFormatter: MoneyFormatter
        },
        data () {
            return {
                global: Global.data,
                cardId: '',
                cardType: '', // 次卡类型
                clubId: '',
                techId: '',
                payBtnText: '购买',
                qrcodeId: '',
                qrcodeType: '',

                clubName: '',
                clubLogo: '',
                actData: {
                    bannerImg: '',
                    name: '',
                    period: '',
                    description: '',
                    statusName: '',
                    type: 1,
                    actAmount: 0,
                    originalAmount: 0,
                    credits: 0
                },
                isNotPay: false,

                givePlans: [],
                paidPlans: [],
                creditPlans: [],

                paramData: null,
                payAuthCode: '',
                openId: '',
                inProcessing: false,
                payRequestObj: null,

                serviceItems: [], // 相关项目

                // 技师选择弹窗处理
                techSearchText: '', // 搜索Input
                showTechSelectorPop: false, // 是否激活弹窗
                techList: [], // 所有可选的技师
                currSelectedTechId: '', // 当前在列表上选择的技师ID
                techSearchRes: [] // 过滤条件所的技师列表
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            var ss = Util.sessionStorage

            that.clubId = query.clubId || global.clubId || ''
            that.cardId = query.id
            that.cardType = query.type
            that.qrcodeType = ss('qrcodeType') || ''
            that.qrcodeId = ss('qrcodeId') || ''
            that.techId = query.techId || ss('itemPackageTechId')
            if (that.techId) {
                ss('itemPackageTechId', that.techId)
            }

            if (/id=/.test(that.cardType)) {
                var splitArr = that.cardType.split('id=')
                that.cardType = splitArr[0]
                that.cardId = splitArr[1]
                that.$router.replace({name: 'itemPackageDetail', query: {type: that.cardType, id: that.cardId}})
            }

            if (!that.clubId || !that.cardId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }

            if (that.cardType == 'item_package') {
                document.title = '超值套餐'
                that.payBtnText = '购买'

                that.paramData = Util.localStorage('item-package-pay-param')
                that.payAuthCode = query.code || global.authCode

                if (global.userAgent.isWX && that.paramData && that.payAuthCode) { // 获取openId
                    Global.getOpenId({authCode: that.payAuthCode}).then(function (res) {
                        that.openId = res.openid
                        that.init()
                    })
                } else {
                    that.init()
                }
            } else {
                document.title = '积分礼品'
                that.payBtnText = '兑换'
                that.init()
            }
        },
        methods: {
            init () {
                var that = this
                var global = that.global

                // 缓存techId
                if (that.techId) {
                    Util.sessionStorage('itemPackageTechId', that.techId)
                } else {
                    that.techId = Util.sessionStorage('itemPackageTechId') || ''
                }

                // 请求次卡数据
                that.$http.get('../api/v2/club/item_card/activity/detail', {params: {
                    activityId: that.cardId,
                    clubId: that.clubId
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        var actData = res.activity
                        var thisActData = that.actData
                        var plans = actData.itemCardPlans
                        var periodObj = {'Y': '年', 'M': '月', 'D': '日'}
                        var giveCount = 0
                        var paidCount = 0

                        that.clubName = res.clubName
                        that.clubLogo = res.clubImageUrl || global.defaultClubLogo
                        thisActData.bannerImg = actData.imageUrl
                        thisActData.name = actData.name
                        thisActData.type = actData.type
                        thisActData.period = actData.period.replace(/(Y|M|D)/g, function () {
                            if (periodObj[arguments[0]]) {
                                return periodObj[arguments[0]]
                            }
                            return arguments[0]
                        })
                        thisActData.description = actData.description || '无'
                        thisActData.statusName = actData.statusName
                        that.isNotPay = (actData.statusName == '已售完' || actData.statusName == '已过期')
                        that.serviceItems = res.items || []
                        var serviceItemUnits = {}
                        that.serviceItems.forEach((s) => {
                            serviceItemUnits[s.id] = {
                                unit: s.duration + s.durationUnit
                            }
                        })
                        var unitObj
                        plans.forEach((p) => {
                            unitObj = serviceItemUnits[p.itemId]
                            if (unitObj) {
                                p.itemUnit = unitObj.unit
                            }
                        })
                        if (that.cardType == 'item_package') { // 套餐
                            thisActData.actAmount = (plans[0].actAmount / 100).toFixed(2)
                            thisActData.originalAmount = (plans[0].originalAmount / 100).toFixed(2)

                            plans.forEach(function (plan) {
                                if (plan.giveCount > 0) {
                                    that.givePlans.push(plan)
                                    giveCount++
                                } else {
                                    that.paidPlans.push(plan)
                                    paidCount++
                                }
                            })
                        } else { // 积分
                            thisActData.credits = plans[0].credits
                            thisActData.originalAmount = (plans[0].originalAmount / 100).toFixed(2)
                            that.creditPlans = plans
                        }

                        global.loading = false
                        that.$http.post('../api/v2/club/share/view/count/update', {actId: that.cardId, techCode: '', techId: that.techId, clubId: that.clubId, type: that.cardType}) // 更新用户查看数

                        // 分享配置
                        if (global.userAgent.isWX) {
                            var shareDesc = ''
                            if (that.cardType == 'item_package') {
                                shareDesc = '特价' + (plans[0].actAmount / 100).toFixed(2) + '元（' + (actData.type == 3 ? '买' + paidCount + '送' + giveCount : '直减' + ((plans[0].originalAmount - plans[0].actAmount) / 100).toFixed(2) + '元') + '），原价' + (plans[0].originalAmount / 100).toFixed(2) + '元'
                            } else {
                                shareDesc = plans[0].credits + '积分可换，原价' + (plans[0].originalAmount / 100).toFixed(2) + '元'
                            }
                            Global.shareConfig({
                                title: actData.name,
                                desc: shareDesc,
                                link: global.prefixPathname + '#/' + that.clubId + '/itemPackageDetail?type=' + that.cardType + '&id=' + that.cardId + (that.techId ? '&techId=' + that.techId : ''),
                                imgUrl: that.clubLogo
                            }, 'itemCardDetail')
                        }

                        // 次卡类型为套餐的时候，查询技师列表
                        if (!that.techId && that.cardType == 'item_package') {
                            that.$http.get('../api/v2/club/select/tech/list', {params: {clubId: that.clubId}}).then(function (techRes) {
                                techRes = techRes.body
                                if (techRes.statusCode == 200) {
                                    that.techList = techRes.respData || []
                                }
                            })
                        }

                        /* if (that.paramData) {
                            that.doClickConfirmBtn()
                        } */
                    } else {
                        Util.tipShow(res.msg || '查询次卡详情失败！')
                        return that.$router.back()
                    }
                }, function () {
                    Util.tipShow('查询次卡详情失败！')
                    return that.$router.back()
                })
            },

            /**
             * 点击底部的购买或者兑换按钮
             */
            doClickConfirmBtn () {
                var that = this
                var global = that.global
                if (that.isNotPay) {
                    return that.$router.push({name: 'discountMall'})
                }
                if (!global.userTel) {
                    return Global.bindTelPhone()
                }
                if (that.cardType == 'credit_gift') {
                    if (that.inProcessing) {
                        return Util.tipShow('兑换中，请稍候...')
                    }
                    that.doExchange()
                } else {
                    that.$router.push({name: 'payDetail', query: {id: that.cardId, num: 0, clubId: that.clubId, techId: that.techId}})
                }
            },

            /**
             * 积分兑换操作
             */
            doExchange () {
                var that = this
                that.inProcessing = true
                that.$http.post('../api/v2/club/item_card/credit_gift/save', {activityId: that.cardId}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        this.$http.post('../api/v1/scan/code/stat', {
                            clubId: this.clubId,
                            qrcodeId: this.qrcodeId || '',
                            qrcodeType: this.qrcodeType,
                            statType: 'item_card',  // 购买次卡&套餐
                            techId: this.techId
                        }).then(function (res) {
                            Util.tipShow('兑换成功！')
                            that.$router.push({name: 'itemCardOrders', query: {tab: 2}})
                        })
                    } else {
                        that.inProcessing = false
                        if (res.statusCode == 400 && res.respData == 'PHONE_NOT_EXISTS') {
                            Util.tipShow('请您先绑定手机号！')
                            Global.bindTelPhone(true)
                        } else {
                            Util.tipShow(res.msg || '未能成功兑换！')
                        }
                    }
                })
            },

            /**
             * 支付操作
             */
            doPay (selectTechId) {
                var that = this
                that.inProcessing = true
                that.$http.post('../api/v2/wx/pay/item_package/save', {
                    clubId: that.clubId,
                    techId: that.techId || selectTechId,
                    activityId: that.cardId
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.payRequestObj = JSON.parse(res.respData)
                        Global.wxJsBridgeReady(() => {
                            that.onBridgeReady()
                        })
                    } else if (res.statusCode == 935801) {
                        Util.localStorage('item-package-pay-param', true)
                        Global.getOauthCode('9358', 'item-package-pay', 'base')
                    } else {
                        that.inProcessing = false
                        Util.tipShow(res.msg || '支付失败！')
                    }
                }, function () {
                    that.inProcessing = false
                    Util.tipShow('支付请求失败！')
                })
            },
            onBridgeReady () {
                var that = this
                var payRequestObj = that.payRequestObj
                WeixinJSBridge.invoke(
                        'getBrandWCPayRequest', {
                            appId: payRequestObj.appId,
                            timeStamp: payRequestObj.timeStamp + '',
                            nonceStr: payRequestObj.nonceStr,
                            package: payRequestObj.package,
                            signType: payRequestObj.signType,
                            paySign: payRequestObj.paySign
                        },
                        function (res) {
                            that.inProcessing = false
                            if (res.err_msg && res.err_msg.indexOf('ok') >= 0) { // 支付成功之后
                                Util.tipShow('支付成功！')
                                that.$router.push({name: 'itemCardOrders', query: {tab: 1}})
                            } else {
                                Util.tipShow('未能成功支付！')
                                that.$http.post('../api/v2/wx/pay/activity/payment/cancel', {payId: payRequestObj.payId})
                            }
                        })
            },

            /**
             * 在技师选择弹窗 点击取消
             */
            doCancelTechSelectorPop () {
                var that = this
                that.showTechSelectorPop = false
                that.doPay('')
            },

            /**
             * 在技师选择弹窗点击确定
             */
            doConfirmTechSelectorPop () {
                var that = this
                if (that.currSelectedTechId) {
                    that.doPay(that.currSelectedTechId)
                    that.showTechSelectorPop = false
                } else {
                    Util.tipShow('没有选择技师或者楼面！')
                }
            },

            /**
             * 依据输入刷新技师列表
             */
            refreshTechList () {
                var that = this
                var global = that.global
                var techList = that.techList
                var k = 0
                var searchRes = []
                var techItem
                var searchText = that.techSearchText.trim()
                var reg = new RegExp(searchText, 'g')
                for (; k < techList.length; k++) {
                    techItem = techList[k]
                    if (!techItem.techName) {
                        techItem.techName = global.defaultTechName
                    }
                    if (!searchText) {
                        techItem.techNameStr = techItem.techName
                        techItem.techNoStr = techItem.techNo
                        searchRes.push(techItem)
                    } else if (techItem.techName.indexOf(searchText) >= 0 || (techItem.techNo && techItem.techNo.indexOf(searchText) >= 0)) {
                        techItem.techNameStr = techItem.techName.replace(reg, '<strong>' + searchText + '</strong>')
                        if (techItem.techNo) {
                            techItem.techNoStr = techItem.techNo.replace(reg, '<strong>' + searchText + '</strong>')
                        }
                        searchRes.push(techItem)
                    }
                }
                if (searchRes.length == 1) {
                    that.currSelectedTechId = searchRes[0].techId
                }
                that.techSearchRes = searchRes
            },

            /**
             * 在列表上选择技师
             * @param techId
             */
            doSelectTech (techId, techName) {
                var that = this
                that.techSearchText = techName
                that.currSelectedTechId = techId
            }
        }
    }
</script>
