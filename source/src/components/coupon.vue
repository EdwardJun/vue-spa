<template>
    <div v-if="couponData" class="item" :class="{ expire : couponData.isExpire }" @click="doViewDetail()">
        <div v-if="couponData" class="item-container"  :class="{ expire : couponData.isExpire }" @click="doViewDetail()">
            <div class="coupon-left" :class="couponData.couponType" v-show="couponData.couponType!='gift'">
                <div>
                    <span v-show="couponData.couponType!='discount'">￥</span>
                    <span :data-id="couponData.consumeMoneyFen.length" :style="{fontSize: fontSize}">{{ couponData.couponType == 'service_item' ? couponData.consumeMoneyFen / 100 : (couponData.couponType != 'discount' ? couponData.actValueFen/100 : couponData.actValueFen/10000) }}</span>
                    <span v-show="couponData.couponType=='discount'">&nbsp;&nbsp;折</span>
                </div>
                <div>{{couponData.couponTypeName}}</div>
            </div>

            <div class="coupon-left" :class="couponData.couponType" v-show="couponData.couponType=='gift'" :style="{ 'background-image': 'url('+(couponData.actLogoUrl ? couponData.actLogoUrl:global.defaultServiceItemImgUrl)+')' }">
                <!-- <div v-show="couponData.couponType!='gift'">
                    <span v-show="couponData.couponType!='discount'">￥</span>
                    <span>{{ couponData.amount / 100 }}</span>
                </div>
                <div v-show="couponData.couponType!='gift'">{{ couponData.couponTypeName }}</div> -->
            </div>

            <div class="coupon-right">
                <ul><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>
                <div :class="couponData.couponType+'1'">
                    <div>{{ couponData.actTitle }}</div>
                    <div v-show="couponData.couponType=='paid'">抵{{ couponData.actValueFen/100 }}元</div>
                    <div v-show="couponData.couponType=='money'">{{ couponData.consumeMoneyFen=='0' ? '直减'+couponData.actValueFen/100+'元':'满'+(couponData.consumeMoneyFen / 100)+'元可用'}}</div>
                    <div v-show="couponData.couponType=='cash'">{{ couponData.consumeMoneyFen=='0' ? '直减'+couponData.actValueFen/100+'元':'满'+(couponData.consumeMoneyFen / 100)+'元可用'}}</div>
                    <div v-show="couponData.couponType=='discount'">{{couponData.consumeMoneyFen=='0'? '打'+(couponData.actValueFen/10000)+'折':'满'+(couponData.consumeMoneyFen / 100)+'元可用' }}</div>
                    <div v-show="couponData.couponType=='coupon'">原价{{ couponData.consumeMoneyFen }}元</div>
                    <div v-show="couponData.couponType=='gift' || couponData.couponType=='service_item'">{{ couponData.actSubTitle }}</div>
                    <!--券有效期：<span>{{ couponData.useEndDate=='' || couponData.useEndDate==null ? '长期有效' : '客人购买后'+(day==0?'立即':day+'天')+'天有效' }}-->
                    <div>{{ period }}</div>
                </div>
                <span class="item-circle" v-show="couponData.couponStatus!='1'">
                    <i>{{ couponData.couponStatusDescription }}</i>
                </span>
            </div>
        </div>

        <!--<div>{{ couponData.actTitle }}</div>
        <div>{{ couponData.useType == 'money' ? ( couponData.actValueFen/100+'元现金券') : '' }}<div v-html="couponData.consumeMoneyFenDescription"></div></div>
        <div>券有效期：{{ couponData.couponPeriod }}</div>
        <div>{{ couponData.useTypeName }}</div>
        <span v-if="couponData.isExpire">{{ couponData.couponStatusDescription }}</span>
        <span v-if="!couponData.isExpire && couponData.couponType == 'paid'" :class="couponData.couponStatusClass">{{ couponData.couponStatusDescription }}</span>
        <div v-show="couponData.couponType== 'redpack'">分享获得更多优惠机会</div>-->
    </div>
</template>

<script>
    import Global from '../libs/global'
    import eventHub from '../libs/hub'

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
                eventHub.$emit('jump-view-coupon')
                that.$router.push({name: 'paidCouponDetail', query: {userActId: couponData.userActId}})
                // if (couponData.couponType == 'paid') {
                    // that.$router.push({name: 'paidCouponDetail', query: {userActId: couponData.userActId}})
                // } else {
                    // that.$router.push({name: 'couponDetail', query: {userActId: couponData.userActId, couponType: couponData.couponType}})
                // }
            }
        },
        computed: {
            startTime () { // 开始时间
                var useStartDate = this.couponData.useStartDate
                if (useStartDate) {
                    return new Date(useStartDate.replace(/-/g, '/')).getTime()
                } else {
                    return ''
                }
            },
            endTime () { // 结束时间
                var useEndDate = this.couponData.useEndDate
                if (useEndDate) {
                    return new Date(useEndDate.replace(/-/g, '/')).getTime()
                } else {
                    return ''
                }
            },
            period () {
                var that = this
                var couponPeriod = that.couponData.couponPeriod
                var labelArr = couponPeriod.split(' 至 ')
                if (labelArr.length == 2) {
                    if (labelArr[0].length == 19) {
                        labelArr[0] = labelArr[0].substr(0, 16)
                    }
                    if (labelArr[1].length == 19) {
                        labelArr[1] = labelArr[1].substr(0, 16)
                    }
                    return labelArr[0] + ' 至 ' + labelArr[1]
                } else {
                    return couponPeriod
                }
            },
            fontSize () {
                switch (this.couponData.consumeMoneyFen.length) {
                case 3:
                    return '1.66rem'
                case 4:
                    return '1.44rem'
                case 5:
                    return '1.2rem'
                case 6:
                    return '1rem'
                }
            }
        },
        created: function () {
            this.day = Math.floor((this.endTime - this.startTime) / 1000 / 60 / 60 / 24)
        }
    }
</script>
