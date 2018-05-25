

<style lang="sass">
    @import '../sass/page/fastClubPay.scss';
</style>
<template>
    <div class="page" id="fast-club-pay-page" :style="{height: initHeight + 'px'}">
        <div class="top-wrap">
            <div class="header" :style="{ 'background-image' : 'url('+ global.clubLogoUrl +')'}"></div>
            <div class="name">{{ global.clubName }}</div>
        </div>
        <div class="center-wrap">
            <div>消费金额：</div>
            <input placeholder="请输入消费总金额" type="number" maxlength="5" v-model="money" @input="onInputMoney()" @focus="onFocusMoneyInput()" @blur="onBlurMoneyInput()"/>
        </div>

        <div class="item-content">
            <div class="center-discount item" v-if="order">
                <div>预约抵扣金额<span>-￥{{ order.downPayment }}</span></div>
            </div>

            <div class="center-discount1 item" :class="{active: !order}" v-show="fastPayDiscount && !global.userAgent.isAliPay">
                <div @click="doClickPayCouponsList()" >优惠券
                    <span v-show="!itemCoupon" :class="{active:availableActCount==0}">{{ availableActCount }} 张可用</span>
                    <div v-show="itemCoupon">优惠金额 ￥ {{ discountMoney }}</div>
                </div>
            </div>

            <div class="center-member item" @click="doClickPaymentMethod()"  v-if="memberInfo">
                <div>付款方式
                    <span v-show="global.userAgent.isWX && selectedIndex==1">微信支付</span>
                    <span v-show="global.userAgent.isAliPay && selectedIndex==2">支付宝支付</span>
                    <span v-show="selectedIndex==3">会员卡支付</span>
                </div>
            </div>

            <div class="center-discount item" v-if="memberInfo && memberInfo.isVip && selectedIndex==3">
                <div>会员优惠金额<span>-￥{{ memberDiscoumtMoney }}（{{ memberInfo.discount }}折）</span></div>
            </div>
        </div>

        <div class="center-pay">应付金额
            <span>￥{{ getPayMent }}</span>
        </div>
        <div class="bottom-wrap"><a @click="doConfirm()" :class="[{ processing: inProcessing }, {selected: money==''}, {disabled:true}]">{{ inProcessing ? '支付中...' : '支付' }}</a></div>

        <div class="pop-modal payment-method" :class="{active: isShowPay}">
            <div>
                <div>
                    <div class="item-title">请选择支付方式</div>
                    <div class="item-method">
                        <div @click="doSelectPay(1)"  v-show="global.userAgent.isWX">微信支付 <div :class="{selected : selectedIndex==1}"></div></div>
                        <div @click="doSelectPay(2)"  v-show="global.userAgent.isAliPay">支付宝支付 <div :class="{selected : selectedIndex==2}"></div></div>
                        <div @click="doSelectPay(3)">会员卡 <span>(余额：<span>{{ availableMoney }}</span>元)</span> <div :class="{selected : selectedIndex==3}"></div></div>
                    </div>
                </div>
                <div @click="doClickPayMethod()"><a>确定</a></div>
            </div>
        </div>

    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                money: '',
                clubId: '',
                orderId: '',
                paramData: null,
                payAuthCode: '',
                openId: '',
                inProcessing: false,
                itemCoupon: null,
                selectCouponFlag: false,
                discountMoney: '',
                order: null,
                fastPayDiscount: false,
                availableActCount: 0,
                isShowPay: false,
                fastPayCheck: true,

                memberInfo: {},
                selectedIndex: 0,
                currMoney: 0,
                memberDiscoumtMoney: '',
                memberCouponSwitch: false,
                availableMoney: '',
                initHeight: 0
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            var ua = global.userAgent
            that.clubId = query.clubId || global.clubId
            that.paramData = Util.localStorage('fast-club-pay-param')
            that.payAuthCode = query.code
            that.initHeight = global.winHeight

            if (ua.isWX && that.paramData && that.payAuthCode) { // 获取openId
                Global.getOpenId({authCode: that.payAuthCode}).then(function (res) {
                    that.openId = res.openid
                    that.global.loading = false
                    that.init()
                })
            } else {
                that.global.loading = false
                that.init()
            }
        },
        computed: {
            getPayMent () {
                let that = this
                var currMoney = 0
                if (!that.money) {
                    return
                }
                if (that.itemCoupon && that.fastPayDiscount) {
                    if (that.order) {
                        currMoney = that.toDecimal2(that.money - that.order.downPayment - that.discountMoney)
                    } else {
                        currMoney = that.toDecimal2(that.money - that.discountMoney)
                    }
                } else if (that.order) {
                    currMoney = that.toDecimal2(that.money - that.order.downPayment)
                } else {
                    currMoney = that.money
                }

                that.currMoney = currMoney
                if (that.selectedIndex == 3 && that.availableMoney && that.memberInfo.discount < 10) {
                    var currDiscount = that.toDecimal2(currMoney * (that.memberInfo.discount / 10))
                    that.memberDiscoumtMoney = that.toDecimal2(currMoney - currDiscount)
                    currMoney = that.toDecimal2(currMoney - that.memberDiscoumtMoney)
                }
                if (currMoney <= 0.001 || !currMoney) {
                    currMoney = 0
                }
                if (that.currMoney <= 0.001 || !that.currMoney) {
                    that.currMoney = 0
                }
                if (that.memberDiscoumtMoney <= 0.001) {
                    that.memberDiscoumtMoney = 0
                }
                return currMoney
            }
        },
        methods: {
            init () {
                var that = this
                var global = that.global
                that.global.loading = false

                if (global.userAgent.isWX) {
                    that.selectedIndex = 1
                } else if (global.userAgent.isAliPay) {
                    that.selectedIndex = 2
                }
                // 是否开通内网功能
                that.$http.get('../api/v2/club/fastpay/tech/get', {params: {clubId: global.clubId}}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        if (res.nativeSystem) {
                            that.$router.replace({name: 'fastClubPayCashier'})
                        }
                    }
                })
                let itemCoupon = Util.sessionStorage('item_coupon')
                let itemMoney = Util.sessionStorage('item_money')
                if (itemCoupon) {
                    that.itemCoupon = JSON.parse(itemCoupon)
                    that.selectCouponFlag = true
                    Util.removeSessionStorage('item_coupon')
                }
                if (itemMoney) {
                    that.money = itemMoney
                    Util.removeSessionStorage('item_money')
                }
                let cacheSelectedIndex = Util.sessionStorage('selected_index')
                if (cacheSelectedIndex) {
                    that.selectedIndex = cacheSelectedIndex
                    Util.removeSessionStorage('selected_index')
                }

                // 调scan/paycode接口
                that.$http.post('../api/v2/clubvisit/scan/paycode', {
                    clubId: global.clubId, userId: global.userId, techId: ''
                })
                that.getPayCouponsList(that.money)
                that.getPayMemberAccount()
                that.onCalcMoney()
            },
            onCalcMoney () {
                var that = this
                if (that.itemCoupon) {
                    if (that.itemCoupon.couponType == 'cash' || that.itemCoupon.couponType == 'money') {
                        that.discountMoney = that.itemCoupon.actValueFen / 100
                        if (that.money < that.itemCoupon.consumeMoneyFen / 100) {
                            that.selectCouponFlag = false
                            that.itemCoupon = null
                            Util.removeSessionStorage('item_itemId')
                            return Util.tipShow('所选优惠券未达可用消费金额，请重新选择！')
                        }
                    } else if (that.itemCoupon.couponType == 'discount') {
                        that.discountMoney = that.toDecimal2(that.money - that.money * (that.itemCoupon.actValueFen / 100000)) // 此处的折扣保留两位小树 | MoneyFormatter
                    } else if (that.itemCoupon.couponType == 'service_item') {
                        that.discountMoney = that.itemCoupon.actValueFen / 100
                    } else if (that.itemCoupon.couponType == 'paid') {
                        that.discountMoney = that.itemCoupon.actValueFen / 100
                    } else if (that.itemCoupon.couponType == 'coupon') {
                        that.discountMoney = that.itemCoupon.consumeMoneyFen / 100 - that.itemCoupon.actValueFen / 100
                    }
                }
            },
            doClickPayCouponsList () {
                var that = this
                if (that.availableActCount > 0) {
                    Util.sessionStorage('item_money', that.money)
                    Util.sessionStorage('item_coupon', JSON.stringify(that.itemCoupon))
                    that.$router.push({name: 'fastPayCouponsList', query: {money: that.money}})
                }
            },
            doConfirm () {
                var that = this
                var global = that.global
                var thisMoney = that.money
                var ua = global.userAgent
                var couponNo = ''
                var orderNo = ''
                var url = ''
                var payWay
                if (that.itemCoupon) {
                    couponNo = that.itemCoupon.couponNo + ','
                }
                if (that.order) {
                    orderNo = that.order.orderNo
                }

                if (that.selectedIndex == 3) {
                    if (that.memberInfo.amount / 100 < that.getPayMent) {
                        return Util.tipShow('会员卡余额不足，请选择其他支付方式')
                    }
                    // 会员卡支付 抵扣掉优惠券 付费预约之后的价格大于0才能使用会员卡进行支付
                    if (that.currMoney > 0.001) { // 会员卡支付
                        url = '../api/v2/user/fastpay/member/save'
                        payWay = 'member'
                    } else {
                        url = '../api/v2/wx/pay/fast_pay/save'
                        if (!ua.isWX && !ua.isAliPay) {
                            return Util.tipShow('请在微信或者支付宝中打开！')
                        }
                    }
                } else {
                    url = '../api/v2/wx/pay/fast_pay/save'
                    if (!ua.isWX && !ua.isAliPay) {
                        return Util.tipShow('请在微信或者支付宝中打开！')
                    }
                }

                if (that.inProcessing) {
                    return Util.tipShow('支付中，请稍候...')
                }
                if (!thisMoney) {
                    return Util.tipShow('请输入消费金额！')
                }
                if (parseFloat(thisMoney) < 0.001) {
                    return Util.tipShow('买单金额不能为0！')
                }
                if (!(parseFloat(thisMoney) < 5000.001)) {
                    return Util.tipShow('单笔支付请不要超过5000元！')
                }
                that.inProcessing = true
                that.$http.post(url, {
                    amount: parseInt(that.currMoney * 1000) / 10, // -
                    consumeAmount: parseInt(thisMoney * 1000) / 10,
                    clubId: that.clubId,
                    techId: '',
                    verifyCodes: couponNo + orderNo
                }).then(function (res) {
                    res = res.body
                    if (res.respData) {
                        if (payWay == 'member') {
                            that.orderId = res.respData.bizId
                            return that.afterPay(true)
                        } else {
                            if (res.respData.payAmount == 0) {
                                that.orderId = res.respData.bizId
                            } else {
                                var respData = JSON.parse(res.respData)
                                that.orderId = respData.bizId
                            }
                        }
                    }
                    if (that.selectedIndex == 3) {
                        if (res.statusCode == 200) {
                            that.afterPay(true)
                        } else {
                            that.inProcessing = false
                            Util.tipShow(res.msg || '支付失败！')
                        }
                    } else if (ua.isWX) {
                        that.doInvokeWxPay(res)
                    } else if (ua.isAliPay) {
                        that.doInvokeAliPay(res)
                    }
                }, function () {
                    that.inProcessing = false
                    Util.tipShow('支付请求失败！')
                })
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
                                if (payRes.err_msg && payRes.err_msg.indexOf('ok') >= 0) { // 支付成功之后
                                    that.afterPay()
                                } else {
                                    Util.tipShow('未能成功支付！')
                                }
                            })
                    })
                } else if (res.statusCode == 935801) {
                    Util.localStorage('fast-pay-param', that.money)
                    Global.getOauthCode('9358', 'fast-pay', 'base')
                } else {
                    that.inProcessing = false
                    Util.tipShow(res.msg || '支付失败！')
                }
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
            // 二维码统计
            afterPay (payFlag) {
                var that = this
                that.$http.post('../api/v1/scan/code/stat', {
                    clubId: that.clubId,
                    qrcodeType: 'cash_qrcode', // 收银水牌
                    statType: 'fast_paid',  // 在线支付
                    techId: ''
                })
                if (payFlag) {
                    that.inProcessing = false
                    Util.tipShow('提交成功，请等待会所确认！')
                } else {
                    Util.tipShow('支付成功！')
                }
                that.getPrize()
                // that.$router.push({name: 'home'})
            },
            getPrize () {
                var that = this
                that.$router.push({name: 'fastPaySuccess', query: {orderId: that.orderId}})
            },
            // 输入框获取焦点时
            onFocusMoneyInput () {
                var that = this
                that.topPage = true
                that.mTop += 3
            },
            // 输入框失去焦点时
            onBlurMoneyInput () {
                var that = this
                that.topPage = false
                that.mTop -= 3
            },
            // 金额输入限制
            onInputMoney () {
                var that = this
                var val = that.money
                if (val.length == 1) {
                    if (/\D/.test(val)) {
                        val = ''
                    }
                } else {
                    val = val.replace(/[^\d.]/g, '')
                    var dotIndex = 0
                    val = val.replace(/\./g, function () {
                        if (dotIndex == 0) {
                            dotIndex = arguments[1]
                            return '.'
                        } else {
                            return ''
                        }
                    })
                    if (dotIndex > 0) {
                        val = val.substring(0, dotIndex + 3)
                    }
                }
                if (val) {
                    val = val.substr(0, 7)
                }
                that.money = val
                that.onCalcMoney()
                that.getPayCouponsList(that.money)
            },
            getPayCouponsList (money) {
                var that = this
                that.$http.get('../api/v2/user/fastpay/discount/info', {params: {
                    consumeAmount: parseInt(money * 1000) / 10,
                    clubId: that.global.clubId
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.order = res.order
                        if (that.fastPayCheck) {
                            that.fastPayDiscount = res.fastPayDiscount // 有优惠券可用 true
                        }
                        that.availableActCount = res.availableActCount
                    }
                })
            },
            /**
             * 获取会员卡买单用券开关状态
             */
            getMemberPaySwitch () {
                var that = this
                that.$http.get('../api/v2/user/fastpay/member/coupon/switch', {params: {
                    clubId: that.global.clubId
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.fastPayDiscount = res.respData
                        that.fastPayCheck = res.respData
                    }
                })
            },
            /**
             * 获取当前帐号的会员卡
             */
            getPayMemberAccount () {
                var that = this
                that.$http.get('../api/v2/financial/club/account', {params: {
                    clubId: that.global.clubId
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData.info
                        that.memberInfo = res
                        if (res) {
                            that.availableMoney = (res.amount / 100).toFixed(2)
                            if (res.discount / 100 >= 10) {
                                that.memberInfo.isVip = false
                            } else {
                                that.memberInfo.isVip = true
                            }
                            that.memberInfo.discount = (res.discount / 100).toFixed(2).replace(/0*$/g, '').replace(/\.$/g, '')
                            that.getMemberPaySwitch()
                        }
                    }
                })
            },
            doClickPaymentMethod () {
                var that = this
                that.isShowPay = true
            },
            doSelectPay (index) {
                this.selectedIndex = index
            },
            doClickPayMethod () {
                var that = this
                if (that.selectedIndex == 3) {
                    if (that.memberInfo.amount / 100 < that.getPayMent) {
                        return Util.tipShow('会员卡余额不足，请选择其他支付方式')
                    }
                    that.getMemberPaySwitch()
                    if (!that.fastPayDiscount) { // 会员买单不可用优惠券时
                        that.itemCoupon = null
                        Util.removeSessionStorage('item_itemId')
                    }
                } else {
                    that.getPayCouponsList(that.money)
                }
                this.isShowPay = false
            },
            toDecimal2 (num) {
                if (num) {
                    var currNum = num.toFixed(3)
                    var currStr = currNum.toString()
                    currStr = currStr.substr(0, currStr.length - 1)
                    return currStr
                }
                return num
            }
        },
        beforeDestroy () {
            var that = this
            Util.sessionStorage('selected_index', that.selectedIndex)
        }
    }
</script>