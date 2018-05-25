<style lang="sass">
    @import '../sass/page/memberChargePay.scss';
</style>
<template>
    <div class="page" id="member-charge-page">
        <div class="member-info">
            <div>{{userName}}<span>{{cardTypeName}}</span></div>
            <div>{{cardNo | CodeFormatter}}</div>
        </div>
        <div class="top-wrap">
            <router-link class="club-info" tag="div" :to="{ path: '/' + clubId + '/home' }"><div :style="{ 'background-image': 'url(' + global.clubLogoUrl + ')' }"></div><span>{{ global.clubName }}</span></router-link>
            <div class="item">充值<span>{{amount | MoneyFormatter}} 元</span></div>
            <div class="item" v-for="(item,index) in giveList">{{index == 0 ? '赠送' : ''}}
                <span v-if="item.type == 0">{{item.name}}积分</span>
                <span v-else-if="item.type == 4">{{item.name}}元现金</span>
                <span v-else>{{item.name}} * {{item.itemCount}}</span>
            </div>
            <div class="item pay">应付<span>￥{{amount | MoneyFormatter}}</span></div>
            <div class="item tech">营销人员<span>{{techName}}<span v-if="techNo">[{{techNo}}]</span></span></div>
        </div>
        <div class="pay-btn-wrap">
            <div class="pay-btn" @click="doPay()" :class="{ alipay: global.userAgent.isAliPay }">{{ inProcessing ? '支付中...' : (global.userAgent.isAliPay ? '支付宝支付' : '微信支付') }}</div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import MoneyFormatter from '../filters/money-formatter'
    import CodeFormatter from '../filters/code-formatter'

    export default {
        filters: {
            MoneyFormatter: MoneyFormatter,
            CodeFormatter: CodeFormatter
        },
        data () {
            return {
                global: Global.data,
                paramData: null,
                payAuthCode: '',
                openId: '',
                inProcessing: false,

                // 页面参数
                clubId: '',
                techId: '',
                techName: '',
                techNo: '',
                cardNo: '----',
                userName: '-',
                cardTypeName: '-',
                amount: 0, // 需要支付的数额（分）
                packageId: '', // 套餐ID
                giveList: [], // 套餐赠送列表
                orderId: '' // 扫码订单id
            }
        },
        created () {
            let that = this
            let global = that.global
            let query = global.currPage.query

            that.clubId = query.clubId || global.clubId
            that.techId = query.techId
            that.amount = query.amount // 支付的金额
            that.packageId = query.packageId // 套餐ID
            that.orderId = query.orderId // 订单ID

            if (!that.clubId || !that.amount) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            } else {
                that.paramData = Util.localStorage('member-charge-pay-param')
                that.payAuthCode = query.code || global.authCode

                if (global.userAgent.isWX) { // 获取openId
                    if (that.paramData && that.payAuthCode) {
                        Global.getOpenId({authCode: that.payAuthCode}).then(function (res) {
                            that.openId = res.openid
                            that.init()
                        })
                    } else {
                        that.init()
                    }
                } else {
                    that.init()
                }
            }
        },
        methods: {
            /**
             * 页面初始化
             * @return
             */
            init () {
                let that = this
                let global = that.global
                that.amount = that.amount - 0

                if (that.orderId) { // 更新订单状态
                    that.$http.get('../api/v2/club/order/id/status/update', {params: {orderId: that.orderId}})
                }

                // 获取技师、套餐信息
                that.$http.get('../api/v2/club/member/package/get', {params: {orderId: that.orderId}}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        if (res.techInfo) {
                            that.techName = res.techInfo.techName
                            that.techNo = res.techInfo.techNo
                        }
                        if (res.packageInfo) {
                            that.giveList = res.packageInfo.packageItems || []
                        }
                        that.cardNo = res.cardNo
                        that.cardTypeName = res.memberTypeName
                        that.userName = res.userName
                        global.loading = false

                        if (that.paramData) {
                            that.doPay()
                        }
                    }
                })
            },

            /**
             * 支付处理
             */
            doPay () {
                let that = this
                let global = that.global
                var ua = global.userAgent

                if (!ua.isWX && !ua.isAliPay) {
                    return Util.tipShow('请在微信或者支付宝中打开！')
                }
                if (that.inProcessing) {
                    return Util.tipShow('支付中，请稍候...')
                }
                that.inProcessing = true
                that.$http.post('../api/v2/wx/pay/recharge/save', {
                    amount: that.amount,
                    clubId: that.clubId,
                    techId: that.techId || '',
                    packageId: that.packageId || '',
                    bizId: that.orderId || ''
                }).then(function (res) {
                    res = res.body
                    if (ua.isWX) {
                        that.doInvokeWxPay(res)
                    } else if (ua.isAliPay) {
                        that.doInvokeAliPay(res)
                    }
                }, function () {
                    that.inProcessing = false
                    Util.tipShow('支付请求失败！')
                })
            },
            // 支付宝支付
            doInvokeAliPay (res) {
                var that = this
                var global = that.global
                if (res.statusCode == 200) {
                    var payInfo = JSON.parse(res.respData)
                    Global.alipayJsBridgeReady(() => {
                        AlipayJSBridge.call('tradePay', {
                            tradeNO: payInfo.tradeNO
                        }, function (result) {
                            that.inProcessing = false
                            if (global.debugMode) {
                                alert('支付宝支付结果：' + JSON.stringify(result))
                            }
                            if (result.resultCode == '9000') {
                                that.afterPay()
                            } else if (result.resultCode == '8000') {
                                Util.tipShow('正在处理中！')
                            } else if (result.resultCode == '4000') {
                                Util.tipShow('支付失败！')
                            } else if (result.resultCode == '6001' || result.resultCode == '99') {
                                Util.tipShow('您取消了支付！')
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
            // 微信支付
            doInvokeWxPay (res) {
                var that = this
                if (res.statusCode == 200) {
                    var payInfo = JSON.parse(res.respData)
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
                                if (global.debugMode) {
                                    // console.log(JSON.stringify(payRes))
                                }
                                if (payRes.err_msg && payRes.err_msg.indexOf('ok') >= 0) { // 支付成功之后
                                    that.afterPay()
                                } else {
                                    Util.tipShow('未能成功支付！')
                                }
                            })
                    })
                } else if (res.statusCode == 935801) {
                    Util.localStorage('member-charge-pay-param', that.money)
                    Global.getOauthCode('9358', 'fast-pay', 'base')
                } else {
                    that.inProcessing = false
                    Util.tipShow(res.msg || '支付失败！')
                    if (res.respData == 'PHONE_NOT_EXISTS') { // 需要绑定手机
                        Global.bindTelPhone()
                    }
                }
            },
            // 支付成功之后
            afterPay () {
                var that = this
                var global = that.global
                Util.tipShow('支付成功！')
                if (!global.isFollowed) {
                    that.$router.push({name: 'follow9358'}) // 跳转到关注页面
                } else {
                    that.$router.push({name: 'home'})
                }
            }
        }
    }
</script>
