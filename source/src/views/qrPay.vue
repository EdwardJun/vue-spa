<style lang="sass">
    @import '../sass/page/qrPay.scss';
</style>
<template>
    <div class="page" id="qrpay-page">
        <div class="club-info">
            <div>
                <div :style="{ backgroundImage : 'url('+(logoImgUrl || global.defaultClubLogo )+')' }"></div>
                <p>{{ clubName }}</p>
            </div>
        </div>
        <div class="money-info">
            <div>消费金额</div>
            <div>
                <span>￥</span>
                <div>
                    <input type="number" pattern="[0-9]*" v-model="payMoney" @focus="onFocusOfInput()" @blur="onBlurOfInput()" @input="onInputOfPayMoney()"/>
                    <span v-show="showInputTip">请询问服务员后输入</span>
                    <i @click="doClickClearBtn()"></i></div>
            </div>
        </div>
        <div class="pay-btn" :class="payBtnStatusCls" @click="doClickPayBtn()">{{ payBtnText }}</div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                logoImgUrl: '',
                clubName: '',
                payBtnStatusCls: 'disabled',
                payBtnText: '确认支付',
                showInputTip: true,
                payMoney: '',

                openId: Util.localStorage('_qrpay_user_open_id') || '',
                clubId: '',
                payAuthCode: '',
                paramData: '',
                oldMoney: '',
                payRequestObj: null
            }
        },
        created () {
            var that = this
            var global = that.global
            var pageParams = global.currPage.query

            document.title = '支付'
            that.clubId = pageParams.clubId || global.clubId
            if (!that.clubId) {
                Util.tipShow(global.visitError)
                that.$router.back()
            } else {
                that.payAuthCode = pageParams.payAuthCode || global.authCode
                var param = Util.localStorage('con-qrpay-param')
                if (param) {
                    that.paramData = JSON.parse(param)
                }

                if (global.userAgent.isWX) {
                    if (!that.openId || that.openId.length < 10) {
                        if (((+new Date()) - (pageParams['_t'] || 0) > 2400) || !that.payAuthCode) {
                            Global.getOauthCode('9358', 'confirm-qrpay', 'base')
                        } else {
                            Global.getOpenId({
                                authCode: that.payAuthCode, state: 'confirm-qrpay'
                            }).then(function (res) {
                                that.openId = res
                                Util.localStorage('_qrpay_user_open_id', res)
                                that.init()
                            }, function (error) {
                                Util.tipShow(error || '未能获取OpenId！')
                            })
                        }
                    }
                } else {
                    that.init()
                }
            }
        },
        methods: {
            init () {
                var that = this
                var global = that.global
                that.$http.get('../api/v2/club/{clubId}/clubName', {params: {clubId: that.clubId}}).then(function (res) {
                    res = res.body
                    if (res.name) {
                        that.logoImgUrl = res.logo
                        that.clubName = res.name
                    }
                    if (that.paramData) {
                        Util.removeLocalStorage('con-recharge-param')
                        that.payMoney = that.paramData.amount
                        that.payBtnStatusCls = ''
                        that.doClickPayBtn()
                    }
                    global.loading = false
                })
            },
            doClickClearBtn () {
                var that = this
                that.payMoney = ''
                that.oldMoney = ''
                that.showInputTip = true
            },
            onFocusOfInput () {
                this.showInputTip = false
            },
            onBlurOfInput () {
                var that = this
                if (that.payMoney == '') {
                    that.showInputTip = true
                }
            },
            onInputOfPayMoney () {
                var that = this
                if (that.payMoney == '') {
                    if (that.oldMoney.length > 1) {
                        that.payMoney = that.oldMoney
                    } else {
                        that.oldMoney = ''
                        that.payBtnStatusCls = 'disabled'
                    }
                } else {
                    that.payMoney = that.payMoney + ''
                    var tmp = that.payMoney.match(/\./g)
                    if (tmp && tmp.length > 1) {
                        that.payMoney = that.payMoney.slice(0, -1)
                    }
                    if (!/^([1-9][0-9]*)$/g.test(that.payMoney)) {
                        that.payMoney = that.oldMoney
                    } else {
                        that.oldMoney = that.payMoney
                    }
                    that.payBtnStatusCls = ''
                }
            },
            doClickPayBtn () {
                var that = this
                var global = that.global
                if (!global.userAgent.isWX) {
                    return Util.tipShow('只能通过微信进行支付！')
                }
                if (that.payBtnStatusCls != 'disabled') {
                    if (that.payBtnStatusCls == 'processing') {
                        Util.tipShow('正在处理中，请稍候...')
                    } else {
                        that.payBtnStatusCls = 'processing'
                        that.payBtnText = '支付...'
                        var paramData = {
                            businessChannel: 'link',
                            amount: parseFloat(that.payMoney),
                            clubId: that.clubId || '',
                            tradeChannel: 'wx',
                            openId: that.openId
                        }
                        that.$http.post('../api/v2/wx/pay/consume/save', paramData).then(function (res) {
                            res = res.body
                            if (res.statusCode == 200) {
                                paramData.payToken = res.respData.token
                                that.payRequestObj = JSON.parse(res.respData.payInfo)
                                Global.wxJsBridgeReady(() => {
                                    that.onBridgeReady(paramData)
                                })
                            } else if (res.statusCode == '935801') {
                                Util.localStorage('con-qrpay-param', JSON.stringify(paramData))
                                Global.getOauthCode('9358', 'confirm-qrpay', 'base')
                            } else {
                                that.payBtnStatusCls = ''
                                that.payBtnText = '确认支付'
                                Util.tipShow(res.msg || '支付失败！')
                            }
                        }, function () {
                            that.payBtnStatusCls = ''
                            that.payBtnText = '确认支付'
                            Util.tipShow('支付失败！')
                        })
                    }
                }
            },
            onBridgeReady (paramData) {
                var that = this
                var payRequestObj = that.payRequestObj
                WeixinJSBridge.invoke('getBrandWCPayRequest', {
                    appId: payRequestObj.appId,
                    timeStamp: payRequestObj.timeStamp + '',
                    nonceStr: payRequestObj.nonceStr,
                    package: payRequestObj.package,
                    signType: payRequestObj.signType,
                    paySign: payRequestObj.paySign
                }, function (res) {
                    that.payBtnStatusCls = ''
                    that.payBtnText = '确认支付'
                    if (res.err_msg.indexOf('ok') >= 0) { // 支付成功之后
                        Util.tipShow('支付成功！')
                        that.$router.push({
                            name: 'qrPayComplete',
                            query: {clubId: paramData.clubId, money: paramData.amount, payToken: paramData.payToken}
                        })
                    } else {
                        Util.tipShow('未能成功支付！')
                    }
                })
            }
        }
    }
</script>
