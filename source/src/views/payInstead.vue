<style lang="sass">
    @import '../sass/page/payInstead.scss';
</style>
<template>
    <div class="page-payInstead">
        <div class="container">
            <div class="main">
                <router-link :to="{ path: '/'+clubId+'/home' }" tag="div" v-if="payType == 2" class="router-title">
                    <div class="club-name">
                        <div class="log"><img :src="clubLogo"></div>
                        <p class="name">{{clubName}}</p>
                        <i class="icon-arrow-right"></i>
                    </div>
                </router-link>
                <div class="title" v-if="payType < 2 ">
                    <div class="avatar"><img :src="avatarUrl"></div>
                    <p class="name" v-if="payType == 0">{{userName}} 发给朋友的代付邀请</p>
                    <p class="name" v-if="payType == 1">{{userName}} 请您付款</p>
                </div>
                <div class="card-wrap">
                    <div class="wrap">
                        <p class="card-logo"></p>
                        <p class="msg">{{payType == '2'? '金额' : '代付金额'}}</p>
                        <div class="price">￥{{itemPrice}}</div>
                    </div>
                </div>
                <div class="explain">
                    <div class="title">代付说明</div>
                    <div class="text">
                        <p>代付发起后30分钟内无人付款,订单将自动取消</p>
                        <p>如果订单申请退款,已支付金额将原路退还代付人</p>
                        <p class="mark">付款前请您务必与好友再次确认,避免遇到诈骗行为</p>
                    </div>
                </div>
                <div class="project" v-if="payType == 2">
                    <div class="title">已选项目</div>
                    <div class="wrap">
                        <div class="item">
                            <div class="img-box" :class="[itemType === 'item_card' ? 'item_card' : 'item_package']">
                                <img :src="itemUrl">
                                <span class="type">{{itemType === 'item_card' ? "次卡" : "套餐"}}</span>
                            </div>
                            <div class="msg">
                                <div class="name">{{itemName}}</div>
                                <div class="price">￥<b>{{itemPrice}}</b> <span
                                    class="old-price">{{`${itemOldPrice} 元`}}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="confirm-logout pop-modal" :class="{ active : cancelMask }">
            <div class="center-wrap">
                <div>确定取消订单？</div>
                <div><a @click="maskBtn('cancel')">取消</a><a @click="maskBtn('ok')">确定</a></div>
            </div>
        </div>
        <div class="footer">
            <p @click="btn" :class="payType == 1 ? 'green' : ''" v-if="payType < 2 && orderStatus == '0' ">
                {{btnName}}</p>
            <p class="btn-unable" v-if="orderStatus != '0' ">支付成功</p>
            <div class="menu" v-if="payType == 2">
                <div class="detail">
                    <p class="price">合计： ￥<span>{{itemPrice}}</span></p>
                    <p class="time" v-if="payStatus"><i class="icon-clock"></i> 倒计时：
                        <count-down @timeover="timeStatus" :startTime="startTime" :endNum="endNum"></count-down>
                    </p>
                    <p class="time" v-if="!payStatus">已超时</p>
                </div>
                <div class="cancel" @click="cancel">取消订单</div>
                <div class="submit" @click="pay" v-if="payStatus">去支付</div>
                <div class="submit btn-unable" @click="timeStatus(true)" v-if="!payStatus">已失效</div>
            </div>
        </div>
        <Share :share-url="shareUrl"></Share>
    </div>
</template>

<script>
    import Global from '../libs/global'
    import countDown from '../components/count-down'
    import Util from '../libs/util'
    import eventHub from '../libs/hub'
    import Share from '../components/share'

    const global = Global.data
    export default {
        components: {
            'count-down': countDown, Share
        },
        data () {
            return {
                global: Global.data,
                clubId: '',
                techId: '',
                userName: '',
                userHeader: '',
                avatarUrl: '',
                payType: '', // 支付类型  0 为默认代付页面  1 为代付者页面 2 订单详情
                payStatus: true,
                itemPlanId: '', // 套餐id
                btnName: '',
                payRequestObj: null,
                shareUrl: '', // 分享链接
                cancelMask: false, // 弹窗
                orderStatus: '',
                qrcodeId: '',
                qrcodeType: '',
                timer: {},

                //        套餐信息
                clubName: '',
                clubLogo: '',
                cardType: '',
                itemName: '',
                itemUrl: '',
                itemType: '',
                itemPrice: '',
                itemOldPrice: '',
                endNum: ''  // 倒计时时间
            }
        },
        created () {
            let query = global.currPage.query
            this.endNum = '1800'
            this.userHeader = global.userHeader
            this.orderId = query.order
            this.clubId = query.clubId || global.clubId
            this.payType = query.type
            let ss = Util.sessionStorage
            this.qrcodeType = ss('qrcodeType') || ''
            this.qrcodeId = ss('qrcodeId') || ''
            this.techId = query.techId || ''
            document.title = this.payType == '2' ? '订单详情' : '代付详情'
            this.timer = setInterval(() => {
                this.init()
            }, 5000)
            this.init()
        },
        methods: {
            init () {
                this.$http.get('../api/v2/club/item_card/order/detail', {
                    params: {
                        orderId: this.orderId
                    }
                }).then((res) => {
                    res = res.body
                    // club信息
                    if (res.statusCode == 200) {
                        let item = res.respData.order
                        this.userName = item.userName
                        this.clubName = item.clubName
                        this.clubLogo = item.clubImageUrl
                        this.orderStatus = item.status
                        this.avatarUrl = item.avatarUrl || global.defaultHeader
                        // 套餐信息
                        this.itemType = item.cardType
                        this.itemName = item.itemName
                        this.itemUrl = item.imageUrl
                        this.startTime = item.createTime
                        this.itemPrice = item.amount / 100
                        this.itemOldPrice = item.amount / 100
                        if (this.orderStatus != '0') {
                            clearInterval(this.timer)
                            this.$router.push({name: 'itemCardOrders'})
                        }
                        this.shareUrl = this.global.prefixPathname + '#/' + this.clubId + '/payInstead?order=' + this.orderId + '&type=1&techId=' + this.techId
                        Global.shareConfig({
                            title: `${this.userName}的代付`,
                            desc: '帮忙买下单吧！',
                            link: this.shareUrl,
                            imgUrl: this.clubLogo || '',
                            success () {
                                eventHub.$emit('change-share-pop', false)
                                Util.tipShow('分享成功！')
                                this.timer = setInterval(() => {
                                    this.init()
                                }, 5000)
                            }
                        })
                        if (this.payType == 0) {
                            // console.log('发送给朋友')
                            this.btnName = '发送给朋友'
                        }
                        if (this.payType == 1) {
                            // console.log('微信支付')
                            this.btnName = '微信支付'
                        } else {
                            // console.log('订单详情页')
                        }
                        global.loading = false
                    } else {
                        Util.tipShow(res.msg)
                        global.loading = false
                    }
                })
            },
            btn () {
                if (this.payType == 0) {    // 分享
                    eventHub.$emit('change-share-pop', true)
                } else {                     // 支付
                    this.pay()
                }
            },
            maskBtn (type) { // 点击确认退出弹窗中的按钮
                if (type == 'cancel') { // cancel
                    this.cancelMask = false
                } else { // OK
                    this.$http.post('../api/v2/wx/pay/item/order/cancel', {orderId: this.orderId})
                        .then((res) => {
                            res = res.body
                            if (res.statusCode == 200) {
                                this.cancelMask = false
                                Util.tipShow(res.msg || '取消订单成功！！')
                                history.back()
                            } else {
                                Util.tipShow(res.msg || '请求失败，请重试！')
                            }
                        })
                }
            },
            cancel () {
                this.cancelMask = true
            },
            timeStatus (status) {
                if (status) {
                    this.payStatus = false
                    Util.tipShow('订单已失效')
                }
            },
            pay () {
                var that = this
                if (that.payStatus) {
                    that.$http.post('../api/v2/wx/pay/item/pay', {
                        orderId: that.orderId
                    }).then((res) => {
                        res = res.body
                        if (res.statusCode == 200) {
                            that.payRequestObj = JSON.parse(res.respData)
                            Global.wxJsBridgeReady(() => {
                                that.wxPay()
                            })
                        } else if (res.statusCode == 935801) {
                            Util.localStorage('item-card-pay-param', that.currActiveIndex)
                            Global.getOauthCode('9358', 'item-card-pay', 'base')
                        } else {
                            Util.tipShow(res.msg || '支付失败！')
                        }
                    }, () => {
                        Util.tipShow('支付请求失败！')
                    })
                } else {
                    Util.tipShow('订单超时')
                }
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
            }
        },
        beforeDestroy () {
            clearTimeout(this.timer)
        }
    }
</script>
