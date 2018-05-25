<style lang="sass">
    @import '../sass/components/group-buy-act.scss';
</style>
<template>
    <!--拼团活动-->
   <div class="group-buy-act-wrap" @click="doClick()">
       <div :style="{ backgroundImage : 'url('+(actData.itemImageUrl || global.defaultServiceItemImgUrl )+')' }"></div>
       <div>
           <div>{{ actData.name }}<span>({{ actData.personalCount }}人团)</span></div>
           <div>{{ actData.price | MoneyFormatter }}<span>元</span><span>原价：{{ actData.itemPrice | MoneyFormatter }}元</span></div>
           <div v-if="startTime && endTime" :class="{ 'act-time': isActEnd }">
                <span v-if="isActEnd">活动已结束，欢迎下次抢购！</span>
                <Counter v-else type="paid-service" :start="startTime" :end="endTime" @statusChange="doStatusChange"></Counter>
            </div>
            <div v-else class="act-time">活动时间不限</div>
       </div>
       <div>
           <div>已拼{{ actData.openCount }}团</div>
           <div v-show="!isActEnd">马上拼</div>
       </div>
   </div>
</template>

<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import MoneyFormatter from '../filters/money-formatter'
    import Counter from './counter'
    
    export default {
        components: {
            Counter
        },
        filters: {
            MoneyFormatter
        },
        data () {
            return {
                global: Global.data,
                isActEnd: false,
                techId: '',
                startTime: null,
                endTime: null
            }
        },
        props: {
            actData: {
                type: Object,
                required: true
            }
        },
        created () {
            let that = this
            that.techId = that.global.currPage.query.techId
            if (that.techId) {
                Util.sessionStorage('saleTechId', that.techId)
            }
            let actData = that.actData
            if (actData.startTime && actData.endTime) {
                that.startTime = Util.dateFormat(new Date(actData.startTime))
                that.endTime = Util.dateFormat(new Date(actData.endTime))
                // 判断活动是否已经结束
                that.isActEnd = ((+new Date()) - new Date(actData.endTime).getTime() >= 0)
            }
        },
        methods: {
            doClick () {
                var that = this
                if (!that.isActEnd) {
                    that.$router.push({name: 'groupBuyActDetail', query: {id: that.actData.id, techId: that.techId}})
                } else {
                    Util.tipShow('活动已结束！')
                }
            },
            /**
             * 监听计数器的状态改变
             * @param currStatus
             */
            doStatusChange (currStatus) {
                if (currStatus == 'over') {
                    this.isActEnd = true
                }
            }
        }
    }
</script>
