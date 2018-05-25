<template>
    <!--限时抢购-->
   <div class="paid-act-item" :class="{ 'act-end' : isActEnd }" @click="doClick()">
       <div :style="{ backgroundImage : 'url('+(actData.imageUrl || global.defaultServiceItemImgUrl )+')' }"></div>
       <div>
           <div class="paid-act-item-name">
               <div><div>{{ actData.name }}</div><div v-show="actData.usePeriod && (actData.usePeriod.match(/(\d)/g).length != 7 || actData.endTime)">限时用</div></div>
               <div v-show="!isActEnd"><span v-if="actData.canPaidCount>0">剩余{{ actData.canPaidCount - actData.paidCount }}份</span><span v-else>不限份数</span></div>
           </div>
           <div class="paid-act-item-price">
               <span>{{ actData.amountFen / 100 }}</span>元<span v-show="actData.credits>0">（或<b>{{ actData.credits }}</b>积分）</span>
           </div>
           <div class="paid-act-item-time">
               <span :class="{ 'no-del' : isActEnd }">{{ isActEnd ? '活动已结束，欢迎下次抢购！' : '原价：'+actData.price+'元' }}</span>
               <Counter v-if="!isActEnd" type="paid-service" :start="actData.startDate" :end="actData.endDate" @statusChange="doStatusChange"></Counter>
           </div>
           <div class="paid-act-item-btn">{{ isActEnd ? '抢光了' : '马上抢' }}</div>
       </div>
   </div>
</template>

<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import Counter from '../components/counter'

    export default {
        components: {
            Counter
        },
        data () {
            return {
                isActEnd: false,
                global: Global.data,
                techId: ''
            }
        },
        props: {
            actData: {
                type: Object,
                required: true
            }
        },
        created () {
            var that = this
            var actData = that.actData

            that.techId = that.global.currPage.query.techId
            if (that.techId) {
                Util.sessionStorage('saleTechId', that.techId)
            }
            // 判断活动是否已经结束
            that.isActEnd = (actData.canPaidCount > 0 && actData.canPaidCount - actData.paidCount == 0) || ((+new Date()) - new Date(actData.endDate.replace(/-/g, '/')).getTime() >= 0)
        },
        methods: {
            doClick () {
                var that = this
                if (!that.isActEnd) {
                    that.$router.push({name: 'robProjectDetail', query: {robProjectId: that.actData.id, techId: that.techId}})
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
