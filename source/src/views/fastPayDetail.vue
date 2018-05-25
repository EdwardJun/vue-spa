<style lang="sass">
    @import '../sass/page/fastPayDetail.scss';
</style>
<template>
    <div class="page" id="fast-pay-detail-page">
        <div class="item-detail" v-if="orderData">
            <div class="item-top" v-if="orderData.details">
                <div class="title">{{ orderData.batchNo }} <span>{{ orderData.createTime }}</span></div>
                <div class="name" v-if="orderData.details[0].itemList">
                    <div v-for="item in orderData.details[0].itemList">{{ item.itemName }} * {{ item.itemCount }}<span>￥{{ item.itemAmount / 100 }}</span></div>
                </div>
            </div>
            <div class="item-bottom">
                <div>订单金额<span>￥{{ orderData.originalAmount / 100 }}</span></div>
                <div>优惠减免<span>￥{{ orderData.discountAmount / 100 }}</span></div>
                <div>用券抵扣<span>-￥{{ orderData.discountCoupon / 100 }}</span></div>
                <div>实付金额<span>￥{{ orderData.payAmount / 100 }}</span></div>
                <div>{{ orderData.payChannelName }}支付<span>￥{{ orderData.payAmount / 100 }}</span></div>
            </div>
        </div>

        <div class="item-phone" v-if="couponList.length>0 || credits" v-show="!isShow">
            <span>恭喜你！本次获得赠送礼品！</span>
            <input placeholder="请输入手机号" v-model="tel" type="tel" maxlength="11" v-tel-input/>
            <div @click="getGiftInfo">马上领取</div>
        </div>
        <div class="coupons-area" v-if="couponList.length>0 || credits" v-show="!isShow">
            <div class="item-title">礼包内容：</div>
            
            <div class="item-content" v-if="couponList.length>0" v-for="(coupon, cindex) in couponList" :key="cindex">
                <div class="item-container">
                    <div class="coupon-left" :class="coupon.couponType" v-show="coupon.couponType!='gift'">
                        <div v-show="coupon.couponType!='gift'"><span v-show="coupon.couponType!='discount'">￥</span>
                            <span>{{ coupon.couponType!='discount'?coupon.amount:coupon.amount/100 }}</span>
                            <span v-show="coupon.couponType=='discount'">&nbsp;&nbsp;折</span>
                        </div>
                        <div v-show="coupon.couponType!='gift'">{{coupon.couponTypeName}}</div>
                    </div>
                    <div class="coupon-left" :class="coupon.couponType" v-show="coupon.couponType=='gift'" :style="{ 'background-image': 'url('+(coupon.actLogoUrl ? coupon.actLogoUrl:global.defaultServiceItemImgUrl)+')' }"></div>

                    <div class="coupon-right">
                        <ul><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>
                        <div :class="coupon.couponType+'1'">
                            <div>{{ coupon.title }}</div>
                            <div v-show="coupon.couponType=='paid'">抵{{ coupon.amount / 100 }}元</div>
                            <div v-show="coupon.couponType=='money'">{{ coupon.oriAmount=='0' ? '直减'+coupon.amount / 100+'元':'满'+(coupon.oriAmount / 100)+'元可用'}}</div>
                            <div v-show="coupon.couponType=='cash'">{{ coupon.oriAmount=='0' ? '直减'+coupon.amount / 100+'元':'满'+(coupon.oriAmount / 100)+'元可用'}}</div>
                            <div v-show="coupon.couponType=='discount'">{{coupon.oriAmount=='0'? '打'+(coupon.amount / 10000)+'折':'满'+(coupon.oriAmount / 100)+'元可用' }}</div>
                            <div v-show="coupon.couponType=='coupon'">原价{{ coupon.oriAmount }}元</div>
                            <div v-show="coupon.couponType=='gift' || coupon.couponType=='service_item'">{{ coupon.subTitle }}</div>
                            <div>{{ coupon.couponPeriod }}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="item-integral" v-if="credits">
                <div>+{{ credits }} <span>积分</span></div>
            </div>
        </div>
        <!-- 领取成功-->
        <div class="item-get" v-if="isShow">
            <div></div>
            <div>领取成功</div>
            <div>礼品已发放至{{ userPhone }}</div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import TelInput from '../directives/tel-input'
    import Util from '../libs/util'

    export default {
        directives: {
            'tel-input': TelInput
        },
        data () {
            return {
                global: Global.data,
                tel: '',
                isShow: false,
                orderId: '',
                couponList: [],
                credits: 0,
                userPhone: '',
                orderData: {}
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            that.orderId = query.orderId

            if (query.orderId == undefined) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }

            let isShow = Util.sessionStorage('successShow')
            if (isShow) {
                that.isShow = isShow
                Util.removeSessionStorage('successShow')
            }
            let userPhone = Util.sessionStorage('userPhone')
            if (userPhone) {
                that.userPhone = userPhone
                Util.removeSessionStorage('userPhone')
            }
            that.getOrderDetail()
            that.queryCheckInfo()
        },
        methods: {
            getOrderDetail () {
                var that = this
                that.$http.get('../api/v2/user/fastpay/order/detail', {params: {
                    orderId: that.orderId
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.orderData = res
                        var orderDiscountList = res.orderDiscountList
                        var discountAmount = 0
                        var discountCoupon = 0
                        for (var i = 0; i < orderDiscountList.length; i++) {
                            discountAmount += orderDiscountList[i].amount
                            if (orderDiscountList[i].type == 'coupon') {
                                discountCoupon += orderDiscountList[i].amount
                            }
                        }
                        that.orderData.discountAmount = discountAmount // 优惠减免
                        that.orderData.discountCoupon = discountCoupon // 用券抵扣
                        that.global.loading = false
                    }
                })
            },
            /**
             * 检查是否可领取
             */
            queryCheckInfo () {
                var that = this
                that.$http.post('../api/v2/user/fastpay/package/order/package', {
                    orderId: that.orderId
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.couponList = res.couponList // 未绑定手机号
                        that.credits = res.credits // 积分
                    }
                })
            },
            /**
             * 领取奖品信息
             */
            getGiftInfo () {
                var that = this
                if (!that.tel) {
                    return Util.tipShow('请输入手机号！')
                }
                that.$http.post('../api/v2/user/fastpay/package/receive/package', {
                    orderId: that.orderId,
                    phoneNum: that.tel
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.isShow = true
                        that.userPhone = res.userPhone
                        Util.sessionStorage('successShow', that.isShow)
                        Util.sessionStorage('userPhone', that.userPhone)
                    } else {
                        Util.tipShow(res.msg || '领取失败！')
                    }
                })
            }
        },
        beforeDestroy () {
            Util.removeSessionStorage('successShow')
        }
    }
</script>