<template>
   <div class="paid-act-item one-yuan" :class="{ 'started' : statusStr == 'started', 'completed': statusStr == 'completed' }" @click="doClick()">
       <div :style="{ backgroundImage : 'url('+(actData.imageUrl || global.defaultServiceItemImgUrl )+')' }"></div>
       <div>
           <div class="one-yuan-act-name clear-fix"><div>{{ actData.actName }}<span>(第{{ actData.currentPeriod }}期)</span></div><span :class="statusStr">{{ statusStr == 'started' ? '剩余'+actData.canPaidCount+'份' : ( actData.status == 'end' ? '待开奖' : '未开始' )}}</span></div>
           <div class="paid-act-item-price"><span>{{ actData.unitPrice }}</span>元<label>原价：{{ actData.actPrice }}元</label></div>
           <div class="one-yuan-act-status">
               <div class="progress"><label>开奖进度：</label><span>{{ progress }}%</span><div><div :style="{ width: progress +'%' }"></div></div></div>
               <span>已揭晓</span>
               <Counter v-if="drawTime" :start="drawTime" :end="drawTime" type="one-yuan" :tip-text="tipText" @statusChange="doStatusChange"></Counter>
           </div>
           <div class="paid-act-item-btn">一元抢</div>
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
                statusStr: '',
                progress: 0,
                tipText: {'notStarted': '距开奖：', 'started': '距结束：', 'over': '已结束'},
                drawTime: ''
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

            if (!actData.startDate) {
                actData.startDate = Util.dateFormat(new Date(actData.startTime))
            }
            if (!actData.endDate) {
                actData.endDate = Util.dateFormat(new Date(actData.endTime))
            }
            if (actData.status == 'online' && ((+new Date()) - new Date(actData.startDate.replace(/-/g, '/'))) > 0) {
                that.statusStr = 'started'
            } else if (actData.status == 'complete') {
                that.statusStr = 'completed'
            }
            that.progress = ((actData.paidCount / actData.totalPaidCount) * 100).toFixed(0)

            var completeTime = new Date(actData.completeTime)
            var todayDrawTime = new Date()
            if (completeTime - new Date(Util.dateFormat(todayDrawTime, 'yyyy/MM/dd 21:00:00')) > 0) {
                todayDrawTime.setDate(todayDrawTime.getDate() + 1)
            }
            that.drawTime = Util.dateFormat(todayDrawTime, 'yyyy/MM/dd 21:45:00')
        },
        methods: {
            doClick () {
                var that = this
                that.$router.push({name: 'oneYuanDetail', query: {oneYuanId: that.actData.id}})
            },
            /**
             * 监听计数器的状态改变
             * @param currStatus
             */
            doStatusChange (currStatus) {
                var that = this
                if (currStatus == 'over') {
                    that.statusStr = 'completed'
                }
            }
        }
    }
</script>
