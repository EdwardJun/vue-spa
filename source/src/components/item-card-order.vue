<template>
  <li v-if="orderData" :class="{ disabled : orderData.status != 1 }" @click="pay()">
    <div :style="{ 'background-image': 'url('+(orderData.imageUrl || global.defaultServiceItemImgUrl)+')' }" :class="orderData.cardType"><span v-if="orderData.cardType=='item_card' && orderData.isGived==1">好友赠送</span></div>
    <div>{{ orderData.name }}</div>
    <div v-if="orderData.cardType != 'credit_gift'">总价：<span>{{ orderData.amount | MoneyFormatter }}</span>元</div>
    <div v-else>总价：<span>{{ orderData.credits }}</span>积分</div>
    <div>{{ orderData.useEndTime ? "有效期至：" + orderData.useEndTime.slice(0, -3) : "长期有效" }}<span v-if="orderData.status==1">剩余 <b>{{ orderData.totalCount - orderData.usedCount }}</b>/{{ orderData.totalCount }}</span></div>
    <div>{{ statusObj[orderData.status] }}</div>
  </li>
</template>

<script>
    import Global from '../libs/global'
    import MoneyFormatter from '../filters/money-formatter'
    import eventHub from '../libs/hub'

    export default {
        filters: {
            MoneyFormatter: MoneyFormatter
        },
        data () {
            return {
                global: Global.data,
                statusObj: {0: '待付款', 1: '使用', 2: '已过期', 3: '用完啦~'}
            }
        },
        props: {
            orderData: {
                type: Object,
                required: true
            }
        },
        methods: {
            doViewDetail () {
                var that = this
                var orderData = that.orderData
                eventHub.$emit('jump-view-item-card-order')
                that.$router.push({name: 'itemCardOrderDetail', query: {id: orderData.id, clubId: orderData.clubId}})
            },
            pay () {
                if (this.orderData.status == 0) {
                    this.$router.push({
                        name: 'payInstead',
                        query: {order: this.orderData.id, type: 2}
                    })
                } else {
                    this.doViewDetail()
                }
            }
        }
    }
</script>
