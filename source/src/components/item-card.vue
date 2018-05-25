<template>
    <li v-if="cardData" class="itemCard" :class="{ sellOut: cardData.statusName=='已售完', expired: cardData.statusName=='已过期' }" @click="doViewDetail()">
        <div :style="{ 'background-image': 'url('+(cardData.imageUrl || global.defaultServiceItemImgUrl)+')'}"><div>{{ cardData.name }}</div></div>
        <div v-if="type=='item_card'"><b>{{ price }}</b>元/<span class="unit_name">{{ cardData.unitName || 次 }}</span><span class="tip">{{ tip }}</span></div>
        <div v-if="type=='item_package'"><b>{{ Math.round(plan.actAmount) / 100 }}</b>元<span class="tip">{{ tip }}</span></div>
        <div v-if="type=='credit_gift'"><b>{{ plan.credits }}</b>积分</div>
        <div>{{ originPrice }}<div v-show="progress">{{ progress }}%<div :style="{ left: progress +'%' }"></div></div></div>
        <div v-show="tag" :class="type"></div>
    </li>
</template>

<script>
    import Global from '../libs/global'

    export default {
        data () {
            return {
                global: Global.data
            }
        },
        props: {
            tag: {
                type: Boolean,
                required: true
            },
            cardData: {
                type: Object,
                required: true
            },
            techId: {
                type: String,
                default: ''
            }
        },
        computed: {
            type () { // 次卡类型
                return this.cardData.cardType
            },
            plan () {
                var cardData = this.cardData
                for (var k = 0; k < cardData.itemCardPlans.length; k++) {
                    if (cardData.itemCardPlans[k].optimal == 'Y') {
                        return cardData.itemCardPlans[k]
                    }
                }
            },
            price () { // 价格
                var that = this
                if (that.type == 'item_card') {
                    var plan = that.plan
                    var price = plan.actAmount / 100 / (plan.giveCount + plan.paidCount)
                    if (price > 1.001) {
                        price = price.toFixed(2)
                    } else {
                        if (price < 0.01) {
                            price = 0.01
                        }
                        price = price.toFixed(2)
                    }
                    return price
                } else {
                    return 0
                }
            },
            progress () { // 计算购买进度
                var cardData = this.cardData
                if (cardData.totalCount != 0 && cardData.paidCount > cardData.totalCount * 0.49) {
                    return (cardData.paidCount / cardData.totalCount).toFixed(2) * 100
                } else {
                    return 0
                }
            },
            tip () {
                var that = this
                var cardData = that.cardData
                var type = that.type
                var plan = that.plan
                if (type == 'item_card') {
                    return cardData.type == 1 ? '买' + plan.paidCount + '送' + plan.giveCount : '直减' + parseInt((plan.originalAmount - plan.actAmount)) / 100 + '元'
                } else if (type == 'item_package') {
                    if (cardData.type == 3) {
                        var totalPaidCount = 0
                        var totalGiveCount = 0
                        var item
                        for (var j = 0; j < cardData.itemCardPlans.length; j++) {
                            item = cardData.itemCardPlans[j]
                            totalPaidCount += item.paidCount
                            totalGiveCount += item.giveCount
                        }
                        return '买' + totalPaidCount + '送' + totalGiveCount
                    } else {
                        return '直减' + parseInt((plan.originalAmount - plan.actAmount)) / 100 + '元'
                    }
                }
            },
            originPrice () {
                var type = this.type
                var plan = this.plan
                if (type == 'item_card') {
                    return (plan.itemAmount / 100).toFixed(2) + '元/次'
                } else {
                    return (plan.originalAmount / 100).toFixed(2) + '元'
                }
            }
        },
        methods: {
            doViewDetail () {
                var that = this
                var type = that.type
                var cardData = that.cardData
                that.$router.push({ name: type == 'item_card' ? 'itemCardDetail' : 'itemPackageDetail', query: { id: cardData.id, type: type, techId: that.techId } })
            }
        }
    }
</script>
