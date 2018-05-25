<template>
    <div>
        <div><i class="item-icon"></i> <span>剩余</span></div>
        <div> <i class="hours">{{ hour }}</i><i class="colon">:</i><i class="minutes">{{ min }}</i><i class="colon">:</i><i class="seconds">{{ sec }}</i></div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    export default {
        data () {
            return {
                global: Global.data,
                hour: '00',
                min: '00',
                sec: '00',
                currCountTime: 0
            }
        },
        props: {
            modifyTime: {
                type: String,
                required: true,
                default: ''
            },
            expireTime: {
                type: String,
                required: true,
                default: ''
            },
            recordId: {
                type: String,
                required: true,
                default: ''
            }
        },
        created () {
            let that = this
            if (that.modifyTime && that.expireTime) {
                let currentDate = new Date(that.modifyTime.replace(/-/g, '/'))
                let expireTime = new Date(that.expireTime.replace(/-/g, '/'))
                var time = expireTime.getTime() - currentDate.getTime()
                if (time > 0) {
                    that.startCount(time)
                } else {
                    that.doExpireTime()
                }
            } else {
                return 0
            }
        },
        methods: {
            startCount (initTotal) {
                let that = this
                that.currCountTime = initTotal
                // that.currCountTime = 5000
                that.formatTime(that.currCountTime)
                that.doCount()
            },
            doCount () {
                let that = this
                setTimeout(function () {
                    that.currCountTime -= 1000
                    if (that.currCountTime < 1000) {
                        that.currCountTime = 0
                        that.doExpireTime()
                    } else {
                        that.doCount()
                    }
                    that.formatTime(that.currCountTime)
                }, 1000)
            },
            formatTime (millSecond) {
                let that = this
                let floor = Math.floor
                let second = millSecond / 1000
                let sec = floor(second % 60)
                let min = floor(second / 60 % 60)
                let hour = floor(second / 3600)

                that.hour = hour < 10 ? '0' + hour : hour
                that.min = min < 10 ? '0' + min : min
                that.sec = sec < 10 ? '0' + sec : sec
            },
          /**
           * 次卡赠送过期
           * @returns {*}
           */
            doExpireTime () {
                // console.log('次卡赠送过期')
                var that = this
                if (!that.recordId) {
                    Util.tipShow(global.visitError)
                    return that.$router.back()
                }
                that.$http.get('../api/v2/user/item_card/expire/give/record', {params: {
                    recordId: that.recordId
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode != 200) {
                        Util.tipShow(res.msg)
                    }
                })
            }
        }
    }
</script>
