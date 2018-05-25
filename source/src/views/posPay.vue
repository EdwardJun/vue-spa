<style lang="sass">
    @import '../sass/page/posPay.scss';
</style>
<template>
    <div class="page" id="pos-pay-page">
        <div class="top-wrap">
            <router-link class="club-info" tag="div" :to="{ path: '/' + clubId + '/home' }"><div :style="{ 'background-image': 'url(' + global.clubLogoUrl + ')' }"></div><span>{{ global.clubName }}</span></router-link>
            <ul class="consume-list" v-for="(consume, index) in consumeList" :key="index" v-show="consumeList.length>0">
                <li>
                    <div class="room-info">{{ consume.roomTypeName }}：<b>{{ consume.roomName }}</b><span>客单号：<b>{{ consume.userIdentify }}</b></span></div>
                    <ul>
                        <li class="consume-item-info" v-for="item in consume.itemList" :key="item.$index">
                            <div class="service-item-info">{{ item.itemName }} * {{ item.itemCount }}<span>￥{{ item.itemCount * item.itemAmount | MoneyFormatter}}</span></div>
                            <div class="tech-item-info" v-for="employee in item.employeeList" :key="employee.$index" v-show="employee.employeeNo">技师：[{{ employee.employeeNo }}]<span>{{ employee.bellName }}</span></div>
                        </li>
                    </ul>
                </li>
            </ul>
            <div class="item">消费<span>{{ consumeAmount | MoneyFormatter }} 元</span></div>
            <div class="item">减免<span>-{{ discount | MoneyFormatter }} 元</span></div>
            <div class="item" v-show="isNativeOrder">已付<span>{{ paidAmount | MoneyFormatter }} 元</span></div>
            <div class="item" v-show="isNativeOrder">待付<span>{{ (consumeAmount - discount - paidAmount) | MoneyFormatter }} 元</span></div>
            <div class="item pay">{{ isNativeOrder ? '本次支付' : '应付' }}<span>￥{{ amount | MoneyFormatter }}</span></div>
        </div>
        <div class="pay-btn" @click="doPay()" :class="{ alipay: global.userAgent.isAliPay }">{{ inProcessing ? '支付中...' : (global.userAgent.isAliPay ? '支付宝支付' : '微信支付') }}</div>
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
                paramData: null,
                payAuthCode: '',
                openId: '',
                inProcessing: false,
                isNativeOrder: false, // 是否是内网系统订单
                consumeList: [], // 消费列表

                // 页面参数
                clubId: '',
                techId: '',
                consumeAmount: 0, // 消费的数额（分）
                orderId: '', // 订单ID
                discount: 0, // 用券的折扣数额（分）
                amount: 0, // 支付的数额
                paidAmount: 0, // 已付
                payNo: '' // 支付号，生成预支付要传到后台
            }
        },
        created () {
            let that = this
            let global = that.global
            let query = global.currPage.query

            that.clubId = query.clubId || global.clubId
            that.techId = query.techId
            that.consumeAmount = query.total
            that.isNativeOrder = !!query.batchNo // 有批次号表明是内网买单
            that.orderId = query.batchNo || query.orderId
            that.discount = query.discount || 0
            that.payNo = query.payNo || ''

            if (!that.clubId || !that.techId || (!that.consumeAmount && !that.isNativeOrder) || !that.orderId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            } else if (isNaN(that.consumeAmount) && !that.isNativeOrder) {
                Util.tipShow('页面参数不正确！')
                return that.$router.back()
            } else {
                that.paramData = Util.localStorage('pos-pay-param')
                that.payAuthCode = query.code || global.authCode

                if (global.userAgent.isWX && that.paramData && that.payAuthCode) { // 获取openId
                    Global.getOpenId({authCode: that.payAuthCode}).then(function (res) {
                        that.openId = res.openid
                        that.init()
                    })
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
                let query = global.currPage.query
                that.consumeAmount = that.consumeAmount - 0
                that.discount = that.discount - 0
                if (query.amount) {
                    that.amount = query.amount - 0
                } else {
                    that.amount = that.consumeAmount - that.discount
                }
                if (that.isNativeOrder) { // 内网订单
                    that.$http.get('../api/v2/club/native/batch/detail', {params: {batchNo: that.orderId, clubId: that.clubId}}).then((res) => {
                        res = res.body
                        if (res.statusCode == 200) {
                            res = res.respData
                            that.consumeList = res.details
                            that.consumeAmount = res.originalAmount
                            that.discount = res.discountAmount
                            that.paidAmount = res.paidAmount
                            // that.amount = res.payAmount
                        } else {
                            Util.tipShow(res.msg || '查询订单详情失败！')
                        }
                        global.loading = false
                        setTimeout(() => { that.doPay() }, 1000)
                    })
                } else {
                    global.loading = false
                    setTimeout(() => { that.doPay() }, 1000)
                }

                // 调scan/paycode接口
                that.$http.post('../api/v2/clubvisit/scan/paycode', {
                    clubId: global.clubId, userId: global.userId, techId: that.techId
                })

                // 更新订单状态
                that.$http.get('../api/v2/club/order/id/status/update', {params: {orderId: that.orderId}})
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
                that.$http.post('../api/v2/wx/pay/fast_pay/save', {
                    payNo: that.payNo,
                    amount: that.amount,
                    clubId: that.clubId,
                    techId: that.techId,
                    bizId: that.orderId,
                    consumeAmount: that.consumeAmount
                }).then(function (res) {
                    res = res.body
                    if (res.respData) {
                        if (res.respData.payAmount == 0) {
                            that.orderId = res.respData.bizId
                            return that.afterPay(true)
                        } else {
                            var respData = JSON.parse(res.respData)
                            that.orderId = respData.bizId
                        }
                    }
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
                    // 输入金额为0的处理
                    if (res.respData.payAmount == 0) {
                        that.afterPay(true)
                    }
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
                    // 输入金额为0的处理
                    if (res.respData.payAmount == 0) {
                        that.afterPay(true)
                    }
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
                    Util.localStorage('pos-pay-param', that.money)
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
            afterPay (payFlag) {
                var that = this
                Util.tipShow('支付成功！')
                that.getPrize()
                // that.$router.push({name: 'posPaySuccess', query: {amount: that.amount}})
            },
            getPrize () {
                var that = this
                that.$http.get('../api/v2/user/fastpay/package/received', {params: {
                    orderId: that.orderId
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        if (res.respData) {
                            that.$router.push({name: 'fastPaySuccess', query: {orderId: that.orderId}})
                        } else {
                            that.$router.push({name: 'home'})
                        }
                    }
                }, function () {
                    Util.tipShow('请求失败！')
                })
            }
        }
    }
</script>
