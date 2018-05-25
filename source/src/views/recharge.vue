<style lang="sass">
    @import '../sass/page/recharge.scss';
</style>
<template>
    <div class="page" id="recharge-page">
        <div class="recharge-area">
            <div>充值金额</div>
            <div>
                <span>￥</span>
                <div><input type="text" pattern="[0-9]*" v-model="money" maxlength="4" @input="doInputOfMoney()"/></div>
            </div>
            <div>注：充值金额可用于会所消费。</div>
        </div>
        <div class="submit-button" :class="submitStatusCls" @click="doClickSubmitBtn()">{{ submitText }}</div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                submitStatusCls: 'disabled',
                submitText: '确认支付',
                accountId: '',
                oldMoney: '',
                money: '',
                payAuthCode: '',
                clubId: '',
                openId: '',
                paramData: null,
                payRequestObj: null
            }
        },
        created () {
            var that = this
            var global = that.global
            var params = global.currPage.query

            document.title = '充值'
            if (Global.checkAccess('recharge')) {
                that.accountId = params.accountId
                that.payAuthCode = params.code || global.authCode
                that.clubId = params.clubId || global.clubId
                var rechargeParam = Util.localStorage('con-recharge-param')
                if (rechargeParam) {
                    that.paramData = JSON.parse(rechargeParam)
                }
                if (that.paramData && that.payAuthCode) {
                    Global.getOpenId({
                        authCode: that.payAuthCode,
                        state: 'confirm-recharge'
                    }).then(function (res) {
                        that.openId = res
                        that.init()
                    }, function (error) {
                        Util.tipShow(error)
                        that.$router.back()
                    })
                } else {
                    that.init()
                }
            } else {
                Util.tipShow('当前会所未开放此功能！')
                that.$router.back()
            }
        },
        methods: {
            init () {
                var that = this
                that.global.loading = false
                if (that.paramData) {
                    Util.removeLocalStorage('con-recharge-param')
                    that.money = that.paramData.amount
                    that.submitStatusCls = ''
                    that.doClickSubmitBtn()
                }
            },
            doInputOfMoney () {
                var that = this
                if (that.money == '') {
                    if (that.oldMoney.length > 1) {
                        that.money = that.oldMoney
                        that.submitStatusCls = ''
                    } else {
                        that.oldMoney = ''
                        that.submitStatusCls = 'disabled'
                    }
                } else {
                    var tmp = that.money.match(/\./g)
                    if (tmp && that.money.match(/\./g).length > 1) {
                        that.money = that.money.slice(0, -1)
                    }
                    if (!/^([1-9][0-9]*)$/g.test(that.money)) {
                        that.money = that.oldMoney
                        if (that.oldMoney != '') {
                            that.submitStatusCls = ''
                        }
                    } else {
                        if (that.money != 0) {
                            that.oldMoney = that.money
                            that.submitStatusCls = ''
                        } else {
                            that.submitStatusCls = 'disabled'
                        }
                    }
                }
            },
            doClickSubmitBtn () {
                var that = this
                var global = that.global
                if (!global.userAgent.isWX) {
                    return Util.tipShow('请在微信中打开！')
                }
                if (that.submitStatusCls == 'disabled') {
                    return
                }
                if (that.submitStatusCls == 'processing') {
                    return Util.tipShow('正在处理中，请稍候...')
                }
                that.submitStatusCls = 'processing'
                that.submitText = '支付...'
                var paramData = {
                    businessChannel: 'link',
                    accountId: that.accountId,
                    amount: that.money,
                    clubId: that.clubId || '',
                    tradeChannel: 'wx',
                    openId: that.openId
                }
                that.$http.post('../api/v2/wx/pay/recharge/save', paramData).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.payRequestObj = JSON.parse(res.respData)
                        Global.wxJsBridgeReady(() => {
                            that.onBridgeReady()
                        })
                    } else if (res.statusCode == '935801') {
                        Util.localStorage('con-recharge-param', JSON.stringify(paramData))
                        Global.getOauthCode('9358', 'confirm-recharge', 'base')
                    } else {
                        that.submitStatusCls = ''
                        that.submitText = '确认支付'
                        Util.tipShow(res.msg || '充值失败！')
                    }
                }, function () {
                    that.submitStatusCls = ''
                    that.submitText = '确认支付'
                    Util.tipShow('充值失败！')
                })
            },
            onBridgeReady () {
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
                    that.submitStatusCls = ''
                    that.submitText = '确认支付'
                    if (res.err_msg.indexOf('ok') >= 0) { // 支付成功之后
                        Util.tipShow('支付成功！')
                        that.$router.push({name: 'accountDetail', query: {accountId: that.accountId}})
                    } else {
                        Util.tipShow('未能成功支付！')
                    }
                })
            }
        }
    }
</script>
