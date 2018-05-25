<template>
    <div class="counter-wrap act">
        <label>{{ type=='clock' ? '距离下钟' : tipText[status] }}</label>
        <template v-if="status !='over' ">
            <span v-show="showDay">{{ times[0] }}{{ times[1] }}</span>
            <label v-show="showDay">天</label>
            <span>{{ times[2] }}{{ times[3] }}</span>
            <label>{{ type=='clock' ? ':' : '时' }}</label>
            <span>{{ times[4] }}{{ times[5] }}</span>
            <label>{{ type=='clock' ? ':' : '分' }}</label>
            <span v-show="showSecond">{{ times[6] }}{{ times[7] }}</span>
            <label v-show="showSecond">秒</label>
        </template>
        <label v-else>活动已结束，欢迎下次抢购！</label>
    </div>
</template>

<script>
    export default {
        data () {
            return {
                times: [0, 0, 0, 0, 0, 0, 0, 0],
                surplusMillSecond: 0, // 剩余的毫秒数
                timer: null,
                showSecond: false,
                showDay: true
            }
        },
        props: {
            start: {
                type: String,
                required: true
            },
            end: {
                type: String,
                required: true
            },
            tipText: {
                type: Object,
                default () {
                    return {'notStarted': '距开始：', 'started': '距结束：', 'over': '已结束'}
                }
            },
            type: {
                type: String,
                default: 'act'
            }
        },
        computed: {
            status () {
                var currStatus = this.getStatus()
                this.$emit('status-change', currStatus)
                return currStatus
            },
            startTime () {
                return new Date(this.start.replace(/-/g, '/')).getTime()
            },
            endTime () {
                return new Date(this.end.replace(/-/g, '/')).getTime()
            }
        },
        mounted () {
            var that = this
            if (that.status != 'over') {
                that.$nextTick(() => {
                    that.times = that.getFormatTime(that.surplusMillSecond)
                    that.doCount()
                })
            }
        },
        methods: {
            getStatus () {
                var that = this
                var currTime = (+new Date())
                if (currTime < that.startTime) {
                    that.surplusMillSecond = that.startTime - currTime
                    return 'notStarted' // 未开始
                } else if (currTime < that.endTime) {
                    that.surplusMillSecond = that.endTime - currTime
                    return 'started' // 已开始
                } else {
                    return 'over' // 已结束
                }
            },
            getFormatTime (millSecond) {
                var that = this
                var floor = Math.floor
                var second = millSecond / 1000
                var sec = floor(second % 60)
                var min = floor(second / 60 % 60)
                var hour = floor(second / 3600 % 24)
                var day = floor(second / 3600 / 24)
                if (day == 0) {
                    that.showDay = false
                    that.showSecond = true
                } else {
                    that.showDay = true
                    that.showSecond = false
                }
                return [floor(day / 10), day % 10, floor(hour / 10), hour % 10, floor(min / 10), min % 10, floor(sec / 10), sec % 10]
            },
            doCount () {
                var that = this
                that.timer = setTimeout(() => {
                    that.surplusMillSecond -= 1000
                    if (that.surplusMillSecond == 0) {
                        that.status = that.getStatus()
                        this.$emit('status-change', that.status)
                    }
                    that.times = that.getFormatTime(that.surplusMillSecond)
                    that.doCount()
                }, 1000)
            }
        },
        beforeDestroy () {
            if (this.timer) {
                clearTimeout(this.timer)
            }
        }
    }
</script>