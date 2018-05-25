<style lang="sass">
    @import '../sass/components/clock.scss';
</style>
<template>
    <div class="clock-wrap">
        <span>{{ tipText[status] || '' }}</span>
        <b v-show="!showMilliSecond">{{ day }}</b>
        <label v-show="!showMilliSecond">天</label>
        <b>{{ hour }}</b>
        <label>:</label>
        <b>{{ min }}</b>
        <label>:</label>
        <b>{{ sec }}</b>
        <label v-show="showMilliSecond && status !='over'">:</label>
        <b v-show="showMilliSecond && status !='over'">{{ milliSec }}</b>
    </div>
</template>

<script>
    export default {
        data () {
            return {
                surplusTotalMilliSecond: 0, // 剩余的总毫秒数
                secondTimer: null, // 每秒走一次
                milliSecondTimer: null, // 每10毫秒走一次
                showMilliSecond: false,
                day: 0,
                hour: '00',
                min: '00',
                sec: '00',
                milliSec: '00',
                tipText: {'notStarted': '距开始还剩：', 'started': '距结束还剩：', 'over': '已结束：'},
                status: '' // 当前的状态
            }
        },
        watch: {
            status (curVal) { // 监控状态的改变
                if (curVal != '') {
                    this.$emit('status-change', curVal)
                }
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
            }
        },
        computed: {
            startTime () { // 开始时间
                return new Date(this.start.replace(/-/g, '/')).getTime()
            },
            endTime () { // 结束时间
                return new Date(this.end.replace(/-/g, '/')).getTime()
            }
        },
        created () {
            var that = this
            that.doInit()
        },
        methods: {
            doInit () {
                var that = this
                that.status = that.getStatus()
                if (that.status != 'over') {
                    var timeArr = that.getFormatTime(that.surplusTotalMilliSecond)
                    // console.log('Array', JSON.stringify(timeArr))
                    if (timeArr[0] == 0) { // 启动毫秒计时
                        that.showMilliSecond = true
                        that.doMilliSecondCounter()
                    } else {
                        that.showMilliSecond = false
                        if (that.milliSecondTimer) {
                            clearTimeout(that.milliSecondTimer)
                        }
                    }
                    that.update(timeArr)
                    that.surplusTotalMilliSecond -= timeArr[7]
                    setTimeout(function () {
                        that.doSecondCounter()
                    }, timeArr[7])
                } else {
                    that.clearTimer()
                }
            },
            getStatus () { // 获取当前的状态
                var that = this
                var currTime = (+new Date())
                if (currTime < that.startTime) {
                    that.surplusTotalMilliSecond = that.startTime - currTime
                    return 'notStarted' // 未开始
                } else if (currTime < that.endTime) {
                    that.surplusTotalMilliSecond = that.endTime - currTime
                    return 'started' // 已开始
                } else {
                    return 'over' // 已结束
                }
            },
            getFormatTime (totalTime) {
                var floor = Math.floor
                var milliSec = totalTime % 1000
                var second = totalTime / 1000
                var sec = floor(second % 60)
                var min = floor(second / 60 % 60)
                var hour = floor(second / 3600 % 24)
                var day = floor(second / 3600 / 24)
                return [day, floor(hour / 10), hour % 10, floor(min / 10), min % 10, floor(sec / 10), sec % 10, milliSec]
            },
            update (timeArr) {
                var that = this
                that.day = timeArr[0]
                that.hour = timeArr[1] + '' + timeArr[2]
                that.min = timeArr[3] + '' + timeArr[4]
                that.sec = timeArr[5] + '' + timeArr[6]
                that.milliSec = '99'
            },
            doMilliSecondCounter () {
                var that = this
                var milliSec = that.milliSec - 0
                that.milliSecondTimer = setTimeout(function () {
                    if (milliSec == 0) {
                        if (that.getStatus() != 'over') {
                            that.milliSec = '99'
                            that.doMilliSecondCounter()
                        } else {
                            that.clearTimer()
                        }
                    } else {
                        milliSec = milliSec - 1
                        that.milliSec = milliSec < 10 ? '0' + milliSec : milliSec
                        that.doMilliSecondCounter()
                    }
                }, 10)
            },
            doSecondCounter () {
                var that = this
                that.secondTimer = setTimeout(function () {
                    that.surplusTotalMilliSecond -= 1000
                    if (that.surplusTotalMilliSecond < 0) {
                        that.doInit()
                    } else {
                        that.update(that.getFormatTime(that.surplusTotalMilliSecond))
                        that.doSecondCounter()
                    }
                }, 1000)
            },
            clearTimer () {
                var that = this
                if (that.secondTimer) {
                    clearTimeout(that.secondTimer)
                }
                if (that.milliSecondTimer) {
                    clearTimeout(that.milliSecondTimer)
                }
            }
        },
        beforeDestroy () {
            this.clearTimer()
        }
    }
</script>
