<style lang="sass">
    @import '../sass/page/fastPayCouponsList.scss';
</style>
<template>
    <div class="page" id="fastPay-couponsList-page">
        <div class="top-wrap"  v-show="availableActList.length>0">
            <div class="item-title">
                <div></div>
                <div>可用优惠券 ( <span>{{ availableActList.length }}</span> ) 张</div>
            </div>
            <!--可用优惠券-->
            <div class="coupons" @click="doSelectCoupon(coupon.couponNo, coupon)" v-for="coupon in availableActList">
                <div :class="{selected : selecteItemId==coupon.couponNo}"></div>
                <div class="item-coupon">
                    <div class="item-container">
                        <div class="item-data1">
                            <div class="coupon-left" :class="coupon.couponType" v-show="coupon.couponType!='gift'">
                                <div v-show="coupon.couponType!='gift'">
                                    <span v-show="coupon.couponType!='discount'">￥</span>
                                    <span v-show="coupon.couponType!='service_item'">{{coupon.couponType=='discount'?(coupon.actValueFen/10000):coupon.actValueFen/100}}</span>
                                    <span v-show="coupon.couponType=='service_item'">{{coupon.actValueFen/100}}</span>
                                    <span v-show="coupon.couponType=='discount'">&nbsp;&nbsp;折</span>
                                </div>
                                <div>{{ coupon.couponTypeName }}</div>
                            </div>
                            <div class="coupon-left" :class="coupon.couponType" v-show="coupon.couponType=='gift'" :style="{ 'background-image': 'url('+(coupon.actLogoUrl ? coupon.actLogoUrl:global.defaultServiceItemImgUrl)+')' }">
                                <div v-show="coupon.couponType!='gift'">
                                    <span v-show="coupon.couponType!='discount'">￥</span><span>{{ coupon.actValue }}</span>
                                </div>
                                <div v-show="coupon.couponType!='gift'">{{ coupon.couponTypeName }}</div>
                            </div>
                            <div class="coupon-right">
                                <ul><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>
                                <div :class="coupon.couponType+'1'" class="item-count">
                                    <div>{{ coupon.actTitle }}</div>
                                    <!--<div>原价{{ coupon.consumeMoney }}元</div>-->
                                    <div v-show="coupon.couponType=='paid'">抵{{ coupon.actValueFen/100 }}元</div>
                                    <div v-show="coupon.couponType=='cash'">{{ coupon.consumeMoneyFen==0 ? '直减'+(coupon.actValueFen / 100)+'元' : '满'+(coupon.consumeMoneyFen / 100)+'元可用' }}</div>
                                    <div v-show="coupon.couponType=='money'">{{ coupon.consumeMoneyFen==0 ? '直减'+(coupon.actValueFen / 100)+'元' : '满'+(coupon.consumeMoneyFen / 100)+'元可用' }}</div>
                                    <div v-show="coupon.couponType=='cash'&&coupon.oriAmount<=0"></div>
                                    <div v-show="coupon.couponType=='discount'">{{ coupon.consumeMoneyFen==0 ? '打'+(coupon.actValueFen / 10000)+'折' : '满'+(coupon.consumeMoneyFen / 100)+'元可用' }}</div>
                                    <div v-show="coupon.couponType=='coupon'">原价{{ coupon.consumeMoneyFen / 100 }}元</div>
                                    <div v-show="coupon.couponType=='gift'">{{ coupon.actSubTitle }}</div>
                                    <div v-show="coupon.couponType=='service_item'">{{ coupon.actSubTitle }}</div>
                                    <div>{{ coupon.couponPeriod }}</div>
                                    <!--<div v-show="coupon.period == ''">券有效期：<span v-if="coupon.useStartTime">{{ coupon.useStartTime }}-{{coupon.useEndTime}}</span> <span v-else>长期有效</span></div>-->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="bottom-wrap"  v-show="unavailableActList.length>0">
            <div class="item-title">
                <div></div>
                <div>不可用优惠券 ( <span>{{ unavailableActList.length }}</span> ) 张</div>
            </div>
            <div class="coupons" v-for="coupon in unavailableActList">
                <div :class="{selected : true}">{{ coupon.unAvailableReason }}</div>
                <div class="item-coupon">
                    <div class="item-container">
                        <div class="item-data1">
                            <div class="coupon-left gift">
                                <div v-show="coupon.couponType!='gift'">
                                    <span v-show="coupon.couponType!='discount'">￥</span>
                                    <span v-show="coupon.couponType!='service_item'">{{coupon.couponType=='discount'?(coupon.actValueFen/10000):coupon.actValueFen/100}}</span>
                                    <span v-show="coupon.couponType=='service_item'">{{coupon.actValueFen/100}}</span>
                                    <span v-show="coupon.couponType=='discount'">&nbsp;&nbsp;折</span>
                                </div>
                                <!--<div><span v-show="coupon.couponType!='discount'">￥</span><span>{{ coupon.couponType=='discount'?(coupon.actValue/100):coupon.actValue }}</span><span v-show="coupon.couponType=='discount'">&nbsp;&nbsp;折</span></div>-->
                                <div>{{ coupon.couponTypeName }}</div>
                            </div>
                            <div class="coupon-left" :class="coupon.couponType" v-show="coupon.couponType=='gift'" :style="{ 'background-image': 'url('+(coupon.actLogoUrl ? coupon.actLogoUrl:global.defaultServiceItemImgUrl)+')' }">
                                <div v-show="coupon.couponType!='gift'">
                                    <span v-show="coupon.couponType!='discount'">￥</span>
                                    <span>{{ coupon.actValue }}</span>
                                </div>
                                <div v-show="coupon.couponType!='gift'">{{ coupon.couponTypeName }}</div>
                            </div>
                            <div class="coupon-right">
                                <ul><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>
                                <div class="item-count">
                                    <div>{{ coupon.actTitle }}</div>
                                    <!--<div>原价20元</div>-->
                                    <div v-show="coupon.couponType=='paid'">抵{{ coupon.actValueFen / 100 }}元</div>
                                    <div v-show="coupon.couponType=='cash'">{{ coupon.consumeMoneyFen==0 ? '直减'+(coupon.actValueFen / 100)+'元' : '满'+(coupon.consumeMoneyFen / 100)+'元可用' }}</div>
                                    <div v-show="coupon.couponType=='money'">{{ coupon.consumeMoneyFen==0 ? '直减'+(coupon.actValueFen / 100)+'元' : '满'+(coupon.consumeMoneyFen / 100)+'元可用' }}</div>
                                    <div v-show="coupon.couponType=='cash'&&coupon.oriAmount<=0"></div>
                                    <div v-show="coupon.couponType=='discount'">{{ coupon.consumeMoneyFen==0 ? '打'+(coupon.actValueFen / 10000)+'折' : '满'+(coupon.consumeMoneyFen / 100)+'元可用' }}</div>
                                    <div v-show="coupon.couponType=='coupon'">原价{{ coupon.consumeMoneyFen }}元</div>
                                    <div v-show="coupon.couponType=='gift'">{{ coupon.subTitle }}</div>
                                    <div v-show="coupon.couponType=='service_item'">{{ coupon.actSubTitle }}</div>
                                    <div>{{ coupon.couponPeriod }}</div>
                                    <!--<div v-show="coupon.period == ''">券有效期：<span v-if="coupon.useStartTime">{{ coupon.useStartTime }}-{{coupon.useEndTime}}</span> <span v-else>长期有效</span></div>-->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="item"></div>
        <div class="item-footer" @click="doClickAccom()"><div>完成</div></div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                selectedCouponId: '', // 当前选择的优惠券
                techId: '',
                roomId: '',
                orderId: '',
                batchNo: '',
                payId: '',
                selecteItemId: '',
                tag: '',
                coupon: null,
                availableActList: [], // 可用优惠券
                unavailableActList: [] // 不可用优惠券
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            if (query.money == undefined) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            } else {
                that.money = query.money
                that.techId = query.techId
                that.roomId = query.roomId
                that.orderId = query.orderId
                that.batchNo = query.batchNo
                that.payId = query.payId
                that.tag = query.tag
                that.init()
            }
            that.global.loading = false
        },
        methods: {
            init () {
                var that = this
                that.$http.get('../api/v2/user/fastpay/coupon/list', {params: {
                    consumeAmount: parseInt(that.money * 1000) / 10,
                    clubId: that.global.clubId
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.availableActList = res.availableActList // 可用优惠券
                        that.unavailableActList = res.unavailableActList // 不可用优惠券
                    }
                })

                let itemId = Util.sessionStorage('item_itemId')
                let coupon = Util.sessionStorage('item_coupon')
                if (itemId) {
                    that.selecteItemId = itemId
                    that.coupon = JSON.parse(coupon)
                }
            },
            doSelectCoupon (itemId, coupon) {
                var that = this
                Util.removeSessionStorage('item_itemId')
                Util.removeSessionStorage('item_coupon')
                if (that.selecteItemId == itemId) {
                    that.selecteItemId = ''
                    that.coupon = null
                } else {
                    that.selecteItemId = itemId
                    that.coupon = coupon
                }
            },
            doClickAccom () {
                let that = this
                Util.sessionStorage('item_coupon', JSON.stringify(that.coupon))
                Util.sessionStorage('item_itemId', that.selecteItemId)
                if (that.tag == 'techCashier') {
                    that.$router.replace({name: 'fastPayCashier', query: {techId: that.techId}})
                } else if (that.tag == 'roomCashier') {
                    that.$router.replace({name: 'fastPayCashier', query: {roomId: that.roomId}})
                } else if (that.tag == 'orderCashier') {
                    that.$router.replace({name: 'fastPayCashier', query: {orderId: that.orderId}})
                } else if (that.tag == 'batchNoCashier') {
                    that.$router.replace({name: 'fastPayCashier', query: {batchNo: that.batchNo, payId: that.payId}})
                } else if (that.techId) {
                    that.$router.replace({name: 'fastPay', query: {techId: that.techId}})
                } else {
                    that.$router.replace({name: 'fastClubPay'})
                }
            }
        }
    }
</script>