<style lang="sass">
    @import '../sass/page/fastPayCashier.scss';
</style>
<template>
    <div class="page" id="fast-pay-cashier-page" :style="{height: initHeight + 'px'}">
        <div class="top-hint" v-if="unpaidCount>0">您有{{ unpaidCount }}笔订单未支付，点击<a @click="doPayConfirm()">查看详情</a></div>
        <div class="top-club-wrap" v-if="!techId">
            <div class="plow">
                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>
        
        <div class="top-wrap" v-if="techId">
            <div class="header"  :style="{ 'background-image' : 'url('+techHeader+')'}"></div>
            <div class="name">{{ techName }}<span v-if="techNo">{{ techNo }}</span></div>
        </div>

        <div class="center-wrap" v-if="orderList.length != 0">
            <div class="all" :class="{selected: isCheckAll}">
                <span class="check" @click="doClickIsCheckAll(orderList)"></span>全选 <span>已选（<i>{{selected}}</i>）</span>
            </div>
            <div class="content"  v-for="order in orderList" :class="{selected: order.isCheck}">
                <div @click="doClickIsCheck(order, index)" class="check"></div>
                <div class="title">
                    <div class="name">{{order.roomTypeName}}：<span>{{ order.roomName }}</span></div>
                    <div class="name num">手牌号：<span>{{ order.userIdentify }}</span></div>
                </div>
                <div class="items" v-for="item in order.itemList">
                    <div class="detail">
                        <div class="name">{{item.itemName}} * {{item.itemCount}} <span>￥{{item.itemAmount / 100}}</span></div>
                        <div class="price" v-for="tech in item.employeeList">技师：[{{tech.employeeNo}}] <span> {{item.itemBellName}}</span></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="bottom-wrap">
            <div class="btm-top">
                <div class="discount item" v-show="fastPayDiscount && !global.userAgent.isAliPay">
                    <div @click="doClickPayCouponsList()" v-if="!couponOrderType">优惠券
                        <span v-if="itemCoupon">1张已选</span>
                        <span v-else>{{availableActCount}}张可用</span>
                    </div>
                </div>
                <div class="way item" @click="doClickPaymentMethod()" v-if="memberInfo">
                    <div>付款方式
                        <span v-show="global.userAgent.isWX && selectedIndex==1">微信支付</span>
                        <span v-show="global.userAgent.isAliPay && selectedIndex==2">支付宝支付</span>
                        <span v-show="selectedIndex==3">会员卡支付</span>
                    </div>
                </div>
                <div class="pay" :class="{active: priceDetail}" @click="doClickPriceDetail()">
                    <div>
                        应付金额<span>￥{{ getPayMent }}</span>
                    </div>
                </div>
            </div>
            <div class="sale" v-if="priceDetail">
                <div class="money">订单金额： <span>￥{{ totalPrice }}</span></div>
                <div class="appoint" >预约抵扣： <span>-￥{{ order ? order.downPayment : '0'}}</span></div>
                <div class="coupon" >用券抵扣： <span>-￥{{discountMoney}}</span></div>
                <!-- v-if="memberDiscoumtMoney>0" （{{ memberInfo.discount }}折）-->
                 <!--v-if="memberInfo"-->
                <div class="menber">会员优惠： <span>-￥{{memberDiscoumtMoney}}</span></div>
            </div>
        </div>

        <div class="btn-wrap"><a @click="doConfirm()" >{{ inProcessing ? '支付中...' : '支付' }}</a></div>
        
        <div class="pop-modal payment-method" v-if="memberInfo" :class="{active: isShowPay}" >
            <div>
                <div>
                    <div class="item-title">请选择支付方式</div>
                    <div class="item-method">
                        <div @click="doSelectPay(1)">微信支付 <div :class="{selected : selectedIndex==1}"></div></div>
                        <div @click="doSelectPay(2)" v-show="global.userAgent.isAliPay">支付宝支付 <div :class="{selected : selectedIndex==2}"></div></div>
                        <div @click="doSelectPay(3)" >会员卡 <span>(余额：<span>{{availableMoney}}</span>元)</span> <div :class="{selected : selectedIndex==3}"></div></div>
                    </div>
                </div>
                <div @click="doClickPayMethod()"><a>确定</a></div>
            </div>
        </div>

        <div class="pop-modal modalTip"  :class="{active: isShowTip}">
            <div>
                <div class="title">提示</div>
                <div class="content">本次消费有{{ selected }}笔订单，确认合并进行支付吗？</div>
                <div class="btn"><span @click="doCancel('merge')">取消</span> <span @click="doPay()">确认</span></div>
            </div>
        </div>

        <div class="pop-modal modalTip"  :class="{active: isShowPayTip}" v-if="techId">
            <div>
                <div class="title">提示</div>
                <div class="contentPay">您有{{ unpaidCount }}笔订单未支付，是否前往查看？</div>
                <div class="btn"><span @click="doCancel('pay')">取消</span> <span @click="doPayConfirm()">确认</span></div>
            </div>
        </div>

        <div class="pop-modal modalTip"  :class="{active: isShowFailPayTip}">
            <div>
                <div class="title">提示</div>
                <div class="contentPay">{{ payFailMsg }}</div>
                <div class="btn"><span @click="doCancel('giveUp')">放弃支付</span> <span @click="doPayConfirm('continue')">继续支付</span></div>
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
                techId: '',
                roomId: '',
                orderId: '',
                orderIds: '', // 内网订单ID
                clubId: '',
                techName: '',
                techNo: '',
                techHeader: '',
                selectedIndex: 1,
                mTop: 0,
                inProcessing: false,
                priceDetail: false,
                isShowPay: false,
                isShowTip: false,
                fastPayDiscount: false,
                isShowPayTip: false,
                isShowFailPayTip: false,
                payFailMsg: '支付失败',
                unpaidCount: 0, // 未支付订单数
                initHeight: 0,
                order: null, // 预约抵扣
                discountMoney: 0, // 用券抵扣
                availableActCount: 0,
                isCheckAll: true,
                fastPayCheck: true,
                selected: 1,
                totalPrice: 0,
                currTotalPrice: 0,
                availableMoney: 0,
                memberDiscoumtMoney: '',
                tag: '',
                batchNo: '',
                orderList: [],
                memberInfo: {},
                detailList: [], // 未支付项目
                batchDetailList: [], // 合并支付单详情
                payId: '', // 未支付订单支付id
                couponOrderType: false, // 未支付订单已经抵扣过优惠券不能再次选择
                itemCoupon: null
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            var ua = global.userAgent
            that.initHeight = global.winHeight
            if (!(query.techId || query.roomId || query.orderId || query.batchNo)) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            } else {
                if (!Global.checkAccess('fastPayCashier')) {
                    return that.$router.replace({name: 'fastPayError', query: {info: encodeURIComponent('在线买单功能已关闭！')}})
                }
                that.techId = query.techId
                that.roomId = query.roomId
                that.orderId = query.orderId
                that.paramData = Util.localStorage('fast-pay-cashier-param')
                that.payAuthCode = query.code
                that.batchNo = query.batchNo
                that.payId = query.payId
                if (ua.isWX && that.paramData && that.payAuthCode) { // 获取openId
                    Global.getOpenId({authCode: that.payAuthCode}).then(function (res) {
                        that.openId = res.openid
                        that.init()
                    })
                } else {
                    that.init()
                }
            }
        },
        computed: {
            getPayMent () {
                let that = this
                var currMoney = 0
                if (that.itemCoupon && that.fastPayDiscount) {
                    if (that.order) {
                        currMoney = that.toDecimal2(that.totalPrice - that.order.downPayment - that.discountMoney)
                    } else {
                        currMoney = that.toDecimal2(that.totalPrice - that.discountMoney)
                    }
                } else if (that.order) { // 预约抵扣
                    if (that.discountMoney) {
                        currMoney = that.toDecimal2(that.totalPrice - that.order.downPayment - that.discountMoney)
                    } else {
                        currMoney = that.toDecimal2(that.totalPrice - that.order.downPayment)
                    }
                } else if ((that.itemCoupon && that.batchNo) || (that.couponOrderType && that.batchNo)) {
                    currMoney = that.batchDetailList.payAmount / 100
                } else {
                    currMoney = that.totalPrice
                }
                that.currTotalPrice = currMoney
                if (that.selectedIndex == 3 && that.availableMoney && that.memberInfo.discount < 10) {
                    var currDiscount = that.toDecimal2(currMoney * (that.memberInfo.discount / 10))
                    that.memberDiscoumtMoney = that.toDecimal2(currMoney - currDiscount) // 会员卡打折优惠价格
                    currMoney = that.toDecimal2(currMoney - that.memberDiscoumtMoney)
                }
                if (currMoney <= 0.001 || !currMoney) {
                    currMoney = 0
                }
                if (that.currTotalPrice <= 0.001 || !that.currTotalPrice) {
                    that.currTotalPrice = 0
                }
                if (that.memberDiscoumtMoney <= 0.001) {
                    that.memberDiscoumtMoney = 0
                }
                return currMoney * 100 / 100
            }
        },
        methods: {
            init () {
                var that = this
                var global = that.global
                if (global.userAgent.isWX) {
                    that.selectedIndex = 1
                } else if (global.userAgent.isAliPay) {
                    that.selectedIndex = 2
                }
                // 获取技师信息
                if (that.techId) {
                    that.$http.get('../api/v2/club/fastpay/tech/get', {params: {techId: that.techId}}).then(function (res) {
                        res = res.body
                        if (res.statusCode == 200) {
                            res = res.respData
                            that.clubId = res.clubId
                            that.techName = res.techName
                            that.techNo = res.techNo
                            that.techHeader = res.avatarUrl || global.defaultHeader
                            that.mTop = global.winHeight / (16 * global.winScale) - 24.4444
                            global.fullPage = true
                            global.loading = false

                            if (that.paramData) {
                                that.totalPrice = that.paramData
                                that.doPay()
                            }
                        } else {
                            var errorInfo = res.msg || '未能获取到技师信息！'
                            Util.tipShow(errorInfo)
                            that.$router.replace({name: 'fastPayError', query: {info: encodeURIComponent(errorInfo)}})
                        }
                    })
                } else {
                    global.loading = false
                }
                let orderList = Util.sessionStorage('item_orderList')
                let isCheckAll = Util.sessionStorage('isCheckAll')
                if (orderList) {
                    that.orderList = JSON.parse(orderList)
                    that.isCheckAll = JSON.parse(isCheckAll)
                    that.selected = that.orderList.length
                    Util.removeSessionStorage('item_orderList')
                    Util.removeSessionStorage('isCheckAll')
                }
                let itemCoupon = Util.sessionStorage('item_coupon')
                if (itemCoupon) {
                    that.itemCoupon = JSON.parse(itemCoupon)
                    that.selectCouponFlag = true
                    Util.removeSessionStorage('item_coupon')
                }
                let cacheSelectedIndex = Util.sessionStorage('selected_index')
                if (cacheSelectedIndex) {
                    that.selectedIndex = cacheSelectedIndex
                    Util.removeSessionStorage('selected_index')
                }
                // 调scan/paycode接口
                that.$http.post('../api/v2/clubvisit/scan/paycode', {
                    clubId: global.clubId, userId: global.userId, techId: that.techId
                })
                if (orderList) {
                    that.getTotalPrice()
                    that.getPayCouponsList()
                    that.onCalcMoney()
                    that.getUnpaidCount(false)
                } else {
                    if (that.batchNo) { // notFastPayList待付款页面跳转
                        that.getPayList()
                    } else if (that.orderId || that.roomId) { // fastClubPayCashier页面跳转
                        that.getOrderNormal()
                    } else {
                        that.getOrderNormal()
                    }
                    that.getUnpaidCount(true)
                    that.getPayMemberAccount()
                }
            },
            doClickPriceDetail () {
                var that = this
                if (that.priceDetail) {
                    that.priceDetail = false
                } else {
                    that.priceDetail = true
                }
            },
            doClickPaymentMethod () {
                var that = this
                that.isShowPay = true
            },
            doSelectPay (index) {
                this.selectedIndex = index
                if (index != 3) {
                    this.memberDiscoumtMoney = 0
                }
            },
            doClickIsCheck (order, index) {
                var that = this
                if (that.batchNo) {
                    return
                }
                order.isCheck = !order.isCheck
                if (!order.isCheck) { // 未选中
                    that.selected--
                    that.isCheckAll = false
                } else {
                    that.selected++
                }
                for (var k = 0; k < that.orderList.length; k++) {
                    if (that.orderList[k].isCheck) {
                        that.isCheckAll = true
                    } else {
                        that.isCheckAll = false
                        break
                    }
                }
                that.getTotalPrice()
                that.getPayCouponsList()
            },
            doClickIsCheckAll (orderList) {
                var that = this
                if (that.batchNo) {
                    return
                }
                that.isCheckAll = !this.isCheckAll
                if (that.isCheckAll) {
                    orderList.forEach(function (item) {
                        item.isCheck = true
                    })
                    that.selected = orderList.length
                } else {
                    orderList.forEach(function (item) {
                        item.isCheck = false
                    })
                    that.selected = 0
                }
                that.getTotalPrice()
                that.getPayCouponsList()
            },
            doClickPayMethod () {
                var that = this
                if (that.selectedIndex == 3) {
                    if (that.memberInfo.amount / 100 < that.getPayMent) {
                        return Util.tipShow('会员卡余额不足，请选择其他支付方式')
                    }
                    if (!that.fastPayDiscount) {
                        that.itemCoupon = null
                        Util.removeSessionStorage('item_itemId')
                    }
                    that.getMemberPaySwitch()
                } else {
                    that.fastPayCheck = true
                    that.getPayCouponsList()
                }
                that.isShowPay = false
            },
            /**
             * 跳转优惠券选择页面
             */
            doClickPayCouponsList () {
                var that = this
                if (that.availableActCount > 0) {
                    Util.sessionStorage('item_coupon', JSON.stringify(that.itemCoupon))
                    Util.sessionStorage('item_orderList', JSON.stringify(that.orderList))
                    Util.sessionStorage('isCheckAll', JSON.stringify(that.isCheckAll))
                    if (that.techId) {
                        that.$router.push({name: 'fastPayCouponsList', query: {techId: that.techId, money: that.totalPrice, tag: 'techCashier'}})
                    } else if (that.roomId) {
                        that.$router.push({name: 'fastPayCouponsList', query: {roomId: that.roomId, money: that.totalPrice, tag: 'roomCashier'}})
                    } else if (that.orderId) {
                        that.$router.push({name: 'fastPayCouponsList', query: {orderId: that.orderId, money: that.totalPrice, tag: 'orderCashier'}})
                    } else if (that.batchNo) {
                        that.$router.push({name: 'fastPayCouponsList', query: {batchNo: that.batchNo, money: that.totalPrice, tag: 'batchNoCashier', payId: that.payId}})
                    }
                }
            },
            /**
             * 预约抵扣 可用优惠券数
             */
            getPayCouponsList () {
                var that = this
                that.$http.get('../api/v2/user/fastpay/discount/info', {params: {
                    consumeAmount: parseInt(that.totalPrice * 1000) / 10,
                    clubId: that.global.clubId
                }}).then(function (res) {
                    res = res.body
                    if (!that.order.downPayment) {
                        that.order = res.order
                    }
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.order = res.order
                        if (that.fastPayCheck) {
                            that.fastPayDiscount = res.fastPayDiscount // 有优惠券可用 true
                        }
                        that.availableActCount = res.availableActCount
                        that.getPayMemberAccount() // 获取当前帐号会员卡
                    }
                })
            },
            /**
             * 未结账订单列表
             */
            getOrderNormal () {
                var that = this
                that.$http.get('../api/v2/club/native/order/normal/list', {params: {
                    clubId: that.global.clubId,
                    orderId: that.orderId,
                    roomId: that.roomId,
                    techId: that.techId
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        res.forEach(function (item, index) {
                            item.isCheck = true
                        })
                        that.orderList = res
                        that.selected = res.length
                        that.getTotalPrice()
                        that.getPayCouponsList()
                        that.onCalcMoney()
                    }
                })
            },
            /**
             * 获取当前帐号会员卡
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
                            that.availableMoney = (res.amount / 100).toFixed(2) // 会员余额
                            // 会员卡折扣
                            if (res.discount / 100 >= 10) {
                                that.memberInfo.isVip = false
                            } else {
                                that.memberInfo.isVip = true
                            }
                            that.memberInfo.discount = (res.discount / 100).toFixed(2).replace(/0*$/g, '').replace(/\.$/g, '') // 会员折扣
                            // that.getMemberPaySwitch()
                        }
                    }
                })
            },
            /**
             * 会员卡是否可以用优惠券
             */
            getMemberPaySwitch () {
                var that = this
                that.$http.get('../api/v2/user/fastpay/member/coupon/switch', {params: {
                    clubId: that.global.clubId
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.fastPayDiscount = res.respData // false 会员卡不可使用优惠券
                        that.fastPayCheck = res.respData
                        if (!that.fastPayDiscount) {
                            // that.itemCoupon = null
                            // Util.removeSessionStorage('item_itemId')
                            that.discountMoney = 0
                        }
                    }
                })
            },
            /**
             * 当前选中总价
             */
            getTotalPrice () {
                var that = this
                var order = that.orderList
                var itemList
                var orderIds = ''
                that.totalPrice = 0
                for (var i = 0; i < order.length; i++) {
                    itemList = order[i].itemList
                    if (that.orderList[i].isCheck) {
                        if (orderIds) {
                            orderIds += ',' + order[i].id
                        } else {
                            orderIds += order[i].id
                        }
                        for (var j = 0; j < itemList.length; j++) {
                            that.totalPrice += itemList[j].itemAmount * itemList[j].itemCount / 100
                            that.totalPrice = that.totalPrice * 100 / 100
                        }
                    } else {
                        var orderArr = that.orderIds.split(',')
                        for (var n = 0; n < orderArr.length; n++) {
                            if (itemList.id == orderArr[n]) {
                                orderArr.splice(n, 1)
                            }
                        }
                        that.orderIds = orderIds
                    }
                }
                that.orderIds = orderIds
                that.onCalcMoney()
            },
            /**
             * 用券抵扣
             */
            onCalcMoney () {
                var that = this
                if (that.itemCoupon) {
                    if (that.itemCoupon.couponType == 'cash' || that.itemCoupon.couponType == 'money') {
                        that.discountMoney = that.itemCoupon.actValue
                        if (that.totalPrice < that.itemCoupon.consumeMoney) {
                            that.itemCoupon = null
                            Util.removeSessionStorage('item_itemId')
                            that.discountMoney = 0
                            return Util.tipShow('所选优惠券未达可用消费金额，请重新选择！')
                        }
                    } else if (that.itemCoupon.couponType == 'coupon') {
                        that.discountMoney = that.itemCoupon.consumeMoney - that.itemCoupon.actValue
                    } else if (that.itemCoupon.couponType == 'discount') {
                        that.discountMoney = that.toDecimal2(that.totalPrice - that.totalPrice * (that.itemCoupon.actValue / 1000)) // 此处的折扣保留两位小树 | MoneyFormatter
                    } else { // service_item paid
                        that.discountMoney = that.itemCoupon.consumeMoney
                    }
                }
            },
            toDecimal2 (num) {
                if (num) {
                    var currNum = num.toFixed(3)
                    var currStr = currNum.toString()
                    currStr = currStr.substr(0, currStr.length - 1)
                    return currStr
                }
                return num
            },
            doConfirm () {
                var that = this
                if (that.selected > 1) {
                    that.isShowTip = true
                } else {
                    that.doPay()
                }
            },
            doCancel (type) {
                var that = this
                if (type == 'merge') {
                    that.isShowTip = false
                } else if (type == 'pay') {
                    that.isShowPayTip = false
                } else if (type == 'giveUp') {
                    Util.tipShow('您已取消支付！')
                    that.$router.replace({name: 'notFastPayList'})
                }
            },
            doPay () {
                var that = this
                var global = that.global
                var ua = global.userAgent
                var thisTotalPrice = that.totalPrice
                var couponNo = ''
                var orderNo = ''
                var url = ''
                var payWay = ''
                if (that.itemCoupon) {
                    couponNo = that.itemCoupon.couponNo
                }
                if (that.order) {
                    orderNo = couponNo ? ',' + that.order.orderNo : that.order.orderNo
                }
                if (that.selectedIndex == 3) {
                    if (that.memberInfo.amount / 100 < that.getPayMent) {
                        return Util.tipShow('会员卡余额不足，请选择其他支付方式')
                    }
                    // 会员卡支付 抵扣掉优惠券 付费预约之后的价格大于0才能使用会员卡进行支付
                    if (that.currTotalPrice > 0.001) { // 会员卡支付
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
                if (!thisTotalPrice) {
                    return Util.tipShow('请选择消费金额！')
                }
                if (parseFloat(thisTotalPrice) < 0.001) {
                    return Util.tipShow('买单金额不能为0！')
                }
                if (!(parseFloat(thisTotalPrice) < 5000.001)) {
                    return Util.tipShow('单笔支付请不要超过5000元！')
                }
                that.inProcessing = true
                var paramObj = {
                    amount: parseInt(that.currTotalPrice * 1000) / 10,
                    consumeAmount: parseInt(thisTotalPrice * 1000) / 10,
                    clubId: that.global.clubId,
                    techId: that.techId || '',
                    orderIds: that.orderIds,
                    verifyCodes: couponNo + orderNo
                }
                if (payWay == 'member') {
                    paramObj.id = that.payId || ''
                } else {
                    paramObj.bizId = that.payId || ''
                }
                that.$http.post(url, paramObj).then(function (res) {
                    res = res.body
                    if (res.respData) {
                        if (payWay == 'member') {
                            that.orderId = res.respData.bizId
                        } else {
                            if (res.respData.payAmount == 0) {
                                that.orderId = res.respData.bizId
                                that.afterPay(true)
                            } else {
                                var respData = JSON.parse(res.respData)
                                that.orderId = respData.bizId
                            }
                        }
                    }
                    if (that.selectedIndex == 3) { // 会员卡支付
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
                    } else {
                        that.inProcessing = false
                        that.isShowFailPayTip = true
                        that.payFailMsg = res.msg || '支付失败！'
                    }
                }, function (res) {
                    that.inProcessing = false
                    // Util.tipShow('支付请求失败！')
                    that.isShowFailPayTip = true
                    that.payFailMsg = res.msg || '支付失败！'
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
                    // alert(JSON.stringify(payInfo))
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
                                    that.afterPay(false)
                                } else {
                                    Util.tipShow('您已取消支付！')
                                    that.$router.replace({name: 'notFastPayList'})
                                }
                            })
                    })
                } else if (res.statusCode == 935801) {
                    Util.localStorage('fast-pay-cashier-param', that.totalPrice)
                    Global.getOauthCode('9358', 'fast-pay', 'base')
                } else {
                    that.inProcessing = false
                    that.isShowFailPayTip = true
                    that.payFailMsg = res.msg || '支付失败！'
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
                                that.afterPay(false)
                            } else if (result.resultCode == '8000') {
                                Util.tipShow('正在处理中！')
                            } else if (result.resultCode == '4000') {
                                // Util.tipShow('支付失败！')
                                that.isShowFailPayTip = true
                                that.payFailMsg = res.msg || '支付失败！'
                            } else if (result.resultCode == '6001' || result.resultCode == '99') {
                                Util.tipShow('您取消了支付！')
                                that.$router.replace({name: 'notFastPayList'})
                            } else if (result.resultCode == '6002') {
                                Util.tipShow('网络连接出错！')
                            }
                        })
                    })
                } else {
                    that.inProcessing = false
                    // Util.tipShow(res.msg || '支付失败！')
                    that.isShowFailPayTip = true
                    that.payFailMsg = res.msg || '支付失败！'
                }
            },
            // 支付成功之后
            afterPay (payFlag) {
                var that = this
                that.$http.post('../api/v1/scan/code/stat', {
                    clubId: that.clubId,
                    qrcodeType: 'tech_qrcode', // 员工工牌
                    statType: 'fast_paid',  // 在线支付
                    techId: that.techId
                })
                if (payFlag) {
                    that.inProcessing = false
                    Util.tipShow('提交成功，请等待会所确认！')
                } else {
                    Util.tipShow('支付成功！')
                }
                that.getPrize()
                // that.$router.push({name: 'comment', query: {techId: that.techId, type: 'tech', from: 'fastPay'}})
            },
            getPrize () {
                var that = this
                that.$http.get('../api/v2/user/fastpay/package/received', {params: {
                    orderId: that.orderId
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        if (res.respData) {
                            that.$router.push({name: 'fastPaySuccess', query: {orderId: that.orderId, techId: that.techId}})
                        } else {
                            that.$router.push({name: 'home'})
                        }
                    }
                }, function () {
                    Util.tipShow('请求失败！')
                })
            },
            /**
             * 合并支付单未支付数量
             */
            getUnpaidCount (type) {
                var that = this
                that.$http.get('../api/v2/club/native/fast_pay/unpaid/count', {params: {
                    clubId: that.global.clubId
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        if (res.unpaidCount > 0) {
                            that.isShowPayTip = type
                        }
                        that.unpaidCount = res.unpaidCount
                    }
                }, function () {
                    Util.tipShow('请求失败！')
                })
            },
            /**
             * 跳转未支付列表
             */
            doPayConfirm (type) {
                var that = this
                if (type == 'continue') {
                    that.isShowFailPayTip = false
                } else {
                    that.$router.push({name: 'notFastPayList'})
                }
            },
            /**
             * 未支付订单支付详情
             */
            getPayList () {
                var that = this
                that.$http.get('../api/v2/club/native/batch/detail', {params: {
                    clubId: that.global.clubId,
                    batchNo: that.batchNo
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData || []
                        that.batchDetailList = res || []
                        var details = res.details || []
                        details.forEach(function (item) {
                            item.isCheck = true
                        })
                        var paidOrderAmount = 0
                        var couponAmount = 0
                        var memberAmount = 0
                        res.orderDiscountList.forEach(function (order) {
                            if (order.type == 'paid_order') { // 预约抵扣
                                paidOrderAmount += order.amount
                            } else if (order.type == 'coupon') { // 用券抵扣
                                couponAmount += order.amount
                                that.couponOrderType = true
                            } else if (order.type == 'member') {
                                memberAmount += order.amount
                            }
                        })
                        that.order = {downPayment: ''}
                        that.order.downPayment = paidOrderAmount / 100
                        that.discountMoney = couponAmount / 100
                        that.memberDiscoumtMoney = memberAmount / 100
                        that.selected = details.length
                        that.orderList = details
                        that.getTotalPrice()
                        that.getPayCouponsList()
                    }
                }, function (res) {
                    Util.tipShow('请求失败！')
                })
            }
        },
        beforeDestroy () {
            var that = this
            Util.sessionStorage('selected_index', that.selectedIndex)
        }
    }
</script>