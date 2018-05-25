<template>
    <div class="item">
        <div v-if="couponData" class="item-container"  :class="{ expire : couponData.isExpire }" @click="doViewDetail()">
            <div class="coupon-left">
                <div><span>￥</span><span>{{ couponData.actValue }}</span></div><div>{{couponData.useTypeName}}</div>
            </div>
            <div class="coupon-right">
                <ul><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>
                <div>
                    <div>{{ couponData.actTitle }}</div>
                    <div>抵{{ couponData.consumeMoney }}元</div>
                    <div>{{couponData.couponPeriod}}</div>
                </div>
                <span class="item-circle" v-show="couponData.couponStatus!='1'">
                    <i>{{ couponData.couponStatusDescription }}</i>
                </span>
            </div>
        </div>
    </div>
</template>

<script>
    import Global from '../libs/global'

    export default {
        data () {
            return {
                global: Global.data,
                day: 0
            }
        },
        props: {
            couponData: {
                type: Object,
                required: true
            }
        },
        methods: {
            doViewDetail () {
                let that = this
                let couponData = that.couponData
                // eventHub.$emit('jump-view-oClockCoupon')
                that.$router.push({name: 'paidCouponDetail', query: {userActId: couponData.userActId, couponType: couponData.couponType}})
            }
        },
        computed: {
            startTime () { // 开始时间
                return new Date(this.couponData.useStartDate.replace(/-/g, '/')).getTime()
            },
            endTime () { // 结束时间
                return new Date(this.couponData.useEndDate.replace(/-/g, '/')).getTime()
            }
        },
        created () {
            this.day = Math.floor((this.endTime - this.startTime) / 1000 / 60 / 60 / 24)
        }
    }
</script>
