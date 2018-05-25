<!--聊天窗口预约时间弹窗-->
<style lang="sass">
    @import '../sass/components/order-time-pop.scss';
</style>
<template>
    <div class="pop-modal order-time-pop" :class="{ active : show }" @click="doChange(false)">
        <div class="center-wrap" @click="doClickWrap($event)">
            <div>选择到店时间：<span>{{ appointTime }}</span></div>
            <div class="time-selector-wrap">
                <div @touchstart="doStart($event,0)" @touchmove="doMove($event,0)" @touchend="doEnd($event,0)">
                    <div>
                        <div :style="{transform: 'translate3d(0,' + trans[0].y + 'px,0)', transition: 'transform ' + trans[0].delay + 'ms ease-out' }">
                            <div v-for="(dateObj,index) in dateList" :class="{active: trans[0].index == index}">{{ dateObj.date }}</div>
                        </div>
                    </div>
                    <div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                </div>
                <div @touchstart="doStart($event,1)" @touchmove="doMove($event,1)" @touchend="doEnd($event,1)">
                    <div>
                        <div :style="{transform: 'translate3d(0,' + trans[1].y + 'px,0)', transition: 'transform ' + trans[1].delay + 'ms ease-out'}">
                            <div v-for="(timeObj,index) in currTimes" :class="{active: trans[1].index == index}">{{ timeObj.hour }}</div>
                        </div>
                    </div>
                    <div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                </div>
                <div @touchstart="doStart($event,2)" @touchmove="doMove($event,2)" @touchend="doEnd($event,2)">
                    <div>
                        <div :style="{transform: 'translate3d(0,' + trans[2].y + 'px,0)', transition: 'transform ' + trans[2].delay + 'ms ease-out'}">
                            <div v-for="(min,index) in currMins" :class="{active: trans[2].index == index}">{{ min }}</div>
                        </div>
                    </div>
                    <div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                </div>
            </div>
            <div><div @click="doClose()">时间暂定</div><div @click="doConfirm()">确定</div></div>
        </div>
    </div>
</template>

<script>
    import Vue from 'vue'
    import eventHub from '../libs/hub'
    import Global from '../libs/global'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                show: false,
                appointTime: '---', // 到店时间
                itemLineHeight: 0,
                dateList: [],
                currTimes: [],
                currMins: [],
                trans: [{ delay: 300, y: 0, index: 0 }, { delay: 300, y: 0, index: 0 }, { delay: 300, y: 0, index: 0 }],
                deltHArr: [],
                deltYArr: [1, 1, 1],
                startTouchY: 0,
                touchTime: 0,
                currDeltY: 0
            }
        },
        props: {
            clubId: {
                type: String,
                required: true
            }
        },
        mounted () {
            let that = this
            let global = that.global
            that.itemLineHeight = 80 / 36 * global.winScale * 16 // px单位

            // 获取预约时间
            that.$http.get('../api/v2/club/order/times/get', {
                params: { clubId: that.clubId }
            }).then(res => {
                res = res.body
                if (res.statusCode == 200) {
                    that.doHandlerTimes(res.respData || [])
                    that.$nextTick(() => {
                        that.init()
                    })
                }
            })
            eventHub.$on('change-order-time-pop', this.doChange)
        },
        methods: {
            init () {
                let that = this
                let itemLineHeight = that.itemLineHeight
                let deltYArr = that.deltYArr
                let deltHArr = that.deltHArr
                let dateList = that.dateList
                let trans = that.trans

                that.startTouchY = 0
                that.touchTime = 0
                that.currDeltY = 0

                if (dateList.length > 0) {
                    that.currTimes = dateList[0].times
                    if (that.currTimes.length > 0) {
                        that.currMins = that.currTimes[0].mins
                    }
                }
                trans.forEach((item, index) => {
                    deltHArr[index] = itemLineHeight
                    deltYArr[index] = 1
                    item.y = deltYArr[index] * itemLineHeight
                    item.index = 0
                    item.delay = 300
                    Vue.set(trans, index, item)
                })
                that.setAppointTime()
            },
            doClose () {
                let that = this
                eventHub.$emit('do-start-servicer-order', '') // 发起客服预约
                that.show = false
                that.init()
            },
            // 点击确定按钮
            doConfirm () {
                let that = this
                if (that.appointTime != '---') {
                    eventHub.$emit('do-start-servicer-order', that.appointTime) // 发起客服预约
                    that.show = false
                    that.init()
                } else {
                    Util.tipShow('请您选择预约时间！')
                }
            },
            doChange (type) {
                this.show = type
            },
            doClickWrap (e) {
                e.stopPropagation()
            },
            /**
             * do touch Start
             * @param  {[type]} e
             * @param  {[type]} index
             * @return
             */
            doStart (e, index) {
                let that = this
                e.preventDefault()
                that.startTouchY = e.touches[0].clientY
                that.touchTime = (+new Date())
                that.currDeltY = that.deltYArr[index] * that.deltHArr[index]

                let tranObj = that.trans[index]
                tranObj.delay = 0
                Vue.set(that.trans, index, tranObj)
            },
            /**
             * do touch move
             * @param  {[type]} e
             * @param  {[type]} index
             * @return
             */
            doMove (e, index) {
                let that = this
                e.preventDefault()
                that.currDeltY = that.deltYArr[index] * that.deltHArr[index] + e.touches[0].clientY - that.startTouchY
                let tranObj = that.trans[index]
                tranObj.y = that.currDeltY
                Vue.set(that.trans, index, tranObj)
                that.touchTime = (+new Date())
            },
            /**
             * do touch end
             * @param  {[type]} e
             * @param  {[type]} index
             * @return
             */
            doEnd (e, index) {
                let that = this
                e.preventDefault()

                let n = that.deltYArr[index] * that.deltHArr[index] + e.changedTouches[0].clientY - that.startTouchY
                that.touchTime = (+new Date()) - that.touchTime
                if (that.touchTime <= 0) {
                    that.touchTime = 1
                }
                that.currDeltY = Math.round((n + (n - that.currDeltY) / that.touchTime * 100) / that.deltHArr[index]) * (that.deltHArr[index] * 1000) / 1000
                that.touchTime = null
                if (that.currDeltY > that.deltHArr[index]) {
                    that.currDeltY = that.deltHArr[index]
                } else {
                    let len = (index == 0 ? that.dateList.length : (index == 1 ? that.currTimes.length : that.currMins.length))
                    let tempH = -(len - 2) * (that.deltHArr[index] * 1000) / 1000
                    if (that.currDeltY < tempH) {
                        that.currDeltY = tempH
                    }
                }
                let tranObj = that.trans[index]
                tranObj.y = that.currDeltY
                tranObj.delay = 300
                Vue.set(that.trans, index, tranObj)
                that.deltYArr[index] = Math.round((that.currDeltY * 100) / (that.deltHArr[index] * 100))
                that.doEndHandler(index)
            },

            /**
             * touch结束的处理
             * @param  {[type]} index
             * @return {[type]}
             */
            doEndHandler (index) {
                let that = this
                let n = -that.deltYArr[index] + 1
                let trans = that.trans
                let tranObj = trans[index]
                if (tranObj.index != n && that.dateList.length != 0) {
                    tranObj.index = n
                    Vue.set(trans, index, tranObj)
                    if (index == 0) { // 调整小时列
                        that.currTimes = that.dateList[n].times
                        that.deltYArr[1] = 1
                        let tranObjOfHour = trans[1]
                        tranObjOfHour.index = 0
                        tranObjOfHour.delay = 300
                        tranObjOfHour.y = that.deltYArr[1] * that.deltHArr[1]
                        Vue.set(trans, 1, tranObjOfHour)
                    }
                    if (index < 2) { // 调整分钟列
                        that.currMins = that.currTimes[0].mins
                        that.deltYArr[2] = 1
                        let tranObjOfMin = trans[2]
                        tranObjOfMin.index = 0
                        tranObjOfMin.delay = 300
                        tranObjOfMin.y = that.deltYArr[2] * that.deltHArr[2]
                        Vue.set(trans, 2, tranObjOfMin)
                    }
                    that.setAppointTime()
                }
            },
            /**
             * 设置时间
             * @return
             */
            setAppointTime () {
                let that = this
                let trans = that.trans
                let dateList = that.dateList

                // 当前选择的时间
                if (dateList.length > 0) {
                    let currSelectedTime = dateList[trans[0].index].dateValue + ' ' + that.currTimes[trans[1].index].hour.slice(0, -1) + ':' + that.currMins[trans[2].index].slice(0, -1)
                    // console.log('currSelectedTime：' + currSelectedTime)
                    that.appointTime = currSelectedTime
                }
            },

            /**
             * 处理时间表
             * @return
             */
            doHandlerTimes (timeDataArr) {
                if (timeDataArr.length == 0) {
                    return
                }

                let dateList = []
                let oneDayTime = 24 * 60 * 60 * 1000
                let timeData
                let dateObj
                let currDate = new Date()
                let thisDate
                let thisDateStr
                let weekObj = { 0: '日', 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六' }
                let list
                let j
                let timeMapObj
                let hour
                let min
                let tempTime
                let mapIndex
                for (let i = 0; i < timeDataArr.length; i++) {
                    timeData = timeDataArr[i]
                    dateObj = {times: []}
                    thisDate = new Date(currDate.getTime() + (timeData.id - 0) * oneDayTime)
                    thisDateStr = Util.dateFormat(thisDate, 'yyyy-MM-dd')
                    dateObj.dateValue = thisDateStr
                    dateObj.date = Util.dateFormat(thisDate, 'MM月dd日 ') + '周' + weekObj[thisDate.getDay()]

                    // 处理时分
                    list = timeData.time
                    timeMapObj = {}
                    for (j = 0; j < list.length; j++) {
                        tempTime = list[j]
                        if (tempTime.status == 'Y') {
                            tempTime = tempTime.timeStr.split(':')
                            hour = tempTime[0]
                            min = tempTime[1]
                            mapIndex = timeMapObj[hour]
                            if (mapIndex == undefined) {
                                mapIndex = timeMapObj[hour] = dateObj.times.length
                                dateObj.times.push({
                                    hour: hour + '时',
                                    mins: []
                                })
                            }
                            dateObj.times[mapIndex].mins.push(min + '分')
                        }
                    }

                    dateList.push(dateObj)
                }
                this.dateList = dateList
            }
        },
        beforeDestroy () {
            eventHub.$off('change-order-time-pop', this.doChange)
        }
    }
</script>
