<style lang="sass">
    @import '../sass/page/payDetail.scss';
</style>
<template>
    <div class="page-paydetail">
        <router-link :to="{ path: '/'+clubId+'/home' }" tag="div">
            <div class="club-name">
                <div class="log"><img :src="clubLogo"></div>
                <p class="name">{{clubName}}</p>
                <i class="icon-arrow-right"></i>
            </div>
        </router-link>

        <header class="header">
            <span class="pay-total">应付金额：</span><span class="total-price">￥<b>{{this.itemPrice}}</b></span>
        </header>

        <div class="project">
            <div class="title">已选项目</div>
            <div class="wrap">
                <div class="item">
                    <div class="img-box" :class="[itemType === 'item_card' ? 'item_card' : 'item_package']">
                        <img :src="itemUrl">
                        <span class="type">{{itemType === 'item_card' ? "次卡" : "套餐"}}</span>
                    </div>
                    <div class="msg">
                        <div class="name">{{itemName}}</div>
                        <div class="price">￥<b>{{itemPrice}}</b> <span class="old-price">{{`${itemOldPrice} 元`}}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="sales">
            <div class="title">营销人员</div>
            <div class="wrap">
                <div class="item" @click="techListShow()">
                    <div class="avatar"><img :src="techAvatar || global.defaultHeader"></div>
                    <p class="name">{{ techName || '可选' }}<span class="code" v-if="techNum">{{ techNum }}</span></p>
                    <div class="right">
                        <span class="edit">修改</span>
                        <i class="icon-arrow-right"></i>
                    </div>
                </div>
            </div>
        </div>

        <div class="pay-menu">
            <div class="title">支付方式<i class="icon-ask" @click="ruleShow"></i></div>
            <div class="wrap">
                <p class="wechat" @click="submit">微信支付</p>
                <p class="other" @click="router">找人代付</p>
            </div>
        </div>

        <!--代付规则-->
        <div class="rule-wrap" v-if="ruleMask">
            <div class="wrap">
                <div class="title">
                    找人代付
                    <i class="icon-close-outline" @click="ruleHide"></i>
                </div>
                <div class="content">
                    <h1>1、找人代付</h1>
                    <p>用户可将此订单发送给指定的一位好友，
                        让好友帮忙支付改笔订单</p>
                    <h1>2、如何找人代付</h1>
                    <p><i class="img-1"></i>勾选找人代付</p>
                    <p><i class="img-2"></i>分享给指定的一位好友</p>
                    <p><i class="img-3"></i>好友支付</p>
                    <p><i class="img-4"></i>购买成功</p>
                    <h1>3、代付规则</h1>
                    <p class="dotted">代付发起后30分钟内无人付款，订单将自动取消；</p>
                    <p class="dotted">付款前请您务必与好友再次确认，避免遇到诈骗行为。</p>
                </div>
            </div>
        </div>

        <TechSelector :tech-id="techId" :is-show="isShowTechSelectorPop" @commit="doCommitSelector" @close="doCloseSelector()"></TechSelector>
    </div>
</template>

<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import TechSelector from '../components/tech-selector'

    const global = Global.data
    export default {
        components: {
            TechSelector
        },
        data () {
            return {
                global: Global.data,
                clubName: '',
                clubLogo: '',
                cardId: '',
                clubId: '',
                item_num: '',
                qrcodeType: '',
                qrcodeId: '',
                itemName: '',
                itemType: '',
                itemUrl: '',
                itemPlanId: '',  // 次卡ID
                activityId: '',  // 套餐ID
                itemPrice: '',
                itemOldPrice: '',
                eventMask: false,
                ruleMask: false,
                orderId: '',      // 订单号
                payRequestObj: null,
                techId: '', // 当前选择的技师
                techAvatar: '',
                techNum: '', // 技师编号
                techName: '',
                isShowTechSelectorPop: false // 控制是否显示选择营销人员弹窗
            }
        },
        created () {
            const query = global.currPage.query
            let that = this

            that.clubId = query.clubId || global.clubId
            that.cardId = query.id
            that.item_num = query.num
            that.techId = query.techId
            let ss = Util.sessionStorage
            that.qrcodeType = ss('qrcodeType') || ''
            that.qrcodeId = ss('qrcodeId') || ''

            if (that.techId) {
                Util.sessionStorage('saleTechId', that.techId)
            } else {
                that.techId = Util.sessionStorage('saleTechId') || ''
            }
            // 查询订单详情
            this.$http.get('../api/v2/club/item_card/activity/detail', {
                params: {
                    activityId: this.cardId, clubId: this.clubId
                }
            }).then((res) => {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    let items = res.activity
                    let plans = items.itemCardPlans
                    this.clubName = res.clubName
                    this.clubLogo = res.clubImageUrl || global.defaultClubLogo
                    this.itemName = items.name
                    this.itemType = items.cardType
                    this.itemUrl = items.smallImageUrl
                    this.activityId = (items.cardType == 'item_package' ? items.id : '')   // 套餐
                    this.itemPlanId = (items.cardType == 'item_package' ? '' : plans[this.item_num].id) // 次卡
                    this.itemPrice = plans[this.item_num].actAmount / 100
                    this.techAmount = plans[this.item_num].techAmount / 100
                    this.itemOldPrice = plans[this.item_num].originalAmount / 100
                }
                global.loading = false
            })
        },
        methods: {
            submit () { //  微信支付"
                let global = this.global
                if (this.isNotPay) {
                    return this.$router.push({name: 'discountMall'})
                }
                if (!global.userTel) {
                    return Global.bindTelPhone()
                }
                if (!global.userAgent.isWX) {
                    return Util.tipShow('请在微信中打开！')
                }
                this.$http.post('../api/v2/wx/pay/item/order/save', {
                    clubId: this.clubId,
                    itemPlanId: this.itemPlanId,
                    activityId: this.activityId,
                    techId: this.techId
                }).then((res) => {
                    res = res.body
                    if (res.statusCode == 200) {
                        this.orderId = res.respData
                        this.pay()
                    } else {
                        return Util.tipShow(res.msg || '生成订单失败')
                    }
                })
            },
            // 订单支付
            pay () {
                var that = this
                that.$http.post('../api/v2/wx/pay/item/pay', {
                    orderId: that.orderId
                }).then((res) => {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.orderId = res.respData
                        that.payRequestObj = JSON.parse(res.respData)
                        Global.wxJsBridgeReady(() => {
                            that.wxPay()
                        })
                    } else if (res.statusCode == 935801) {
                        Util.localStorage('item-card-pay-param', this.currActiveIndex)
                        Global.getOauthCode('9358', 'item-card-pay', 'base')
                    } else {
                        Util.tipShow(res.msg || '支付失败！')
                    }
                }, () => {
                    Util.tipShow('支付请求失败！')
                })
            },
            // 微信支付
            wxPay () {
                let payRequestObj = this.payRequestObj
                WeixinJSBridge.invoke(
                    'getBrandWCPayRequest', {
                        appId: payRequestObj.appId,
                        timeStamp: payRequestObj.timeStamp + '',
                        nonceStr: payRequestObj.nonceStr,
                        package: payRequestObj.package,
                        signType: payRequestObj.signType,
                        paySign: payRequestObj.paySign
                    },
                    (res) => {
                        this.inProcessing = false
                        if (res.err_msg && res.err_msg.indexOf('ok') >= 0) { // 支付成功之后
                            Util.tipShow('支付成功！')
                            this.$http.post('../api/v1/scan/code/stat', {
                                clubId: this.clubId,
                                qrcodeId: this.qrcodeId || '',
                                qrcodeType: this.qrcodeType,
                                statType: 'item_card',  // 购买次卡&套餐
                                techId: this.techId
                            }).then(function (res) {
                                res = res.body
                                this.$router.push({name: 'itemCardOrders'})
                            })
                        } else {
                            Util.tipShow('未能成功支付！')
                            this.$http.post('../api/v2/wx/pay/activity/payment/cancel', {payId: payRequestObj.payId})
                        }
                    })
            },
            // 找人代付
            router () {
                this.$http.post('../api/v2/wx/pay/item/order/save', {
                    clubId: this.clubId,
                    itemPlanId: this.itemPlanId,
                    activityId: this.activityId,
                    techId: this.techId
                }).then((res) => {
                    res = res.body
                    if (res.statusCode == 200) {
                        this.orderId = res.respData
                        this.$router.push({
                            name: 'payInstead',
                            query: {order: this.orderId, type: 0, clubId: this.clubId, techId: this.techId}
                        })
                    } else {
                        return Util.tipShow(res.msg || '生成订单失败')
                    }
                })
            },
            //  规则
            ruleShow () {
                this.ruleMask = true
            },
            ruleHide () {
                this.ruleMask = false
            },
            techListShow () {
                this.isShowTechSelectorPop = true
            },
            doCommitSelector (data) {
                let that = this
                that.techId = data.techId
                that.techAvatar = data.techAvatar
                that.techNum = data.techNum
                that.techName = data.techName
            },
            doCloseSelector () {
                this.isShowTechSelectorPop = false
            }
        }
    }
</script>
