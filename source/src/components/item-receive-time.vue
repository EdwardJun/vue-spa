<template>
    <div>
        <span></span> <span>剩余</span> <span><i>{{ hour }}</i>:<i>{{ min }}</i>:<i>{{ sec }}</i></span>
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
        watch: {
            'expireTime' () {
                let that = this
                if (that.expireTime && that.modifyTime) {
                    let expireTime = new Date(that.expireTime.replace(/-/g, '/'))
                    let modifyTime = new Date(that.modifyTime.replace(/-/g, '/'))
                    var time = expireTime.getTime() - modifyTime.getTime()
                    if (time > 0) {
                        that.startCount(time)
                    } else {
                        that.doExpireTime()
                    }
                }
            }
        },
        props: {
            expireTime: {
                type: String,
                required: true,
                default: ''
            },
            modifyTime: {
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
        methods: {
            startCount (initTotal) {
                let that = this
                that.currCountTime = initTotal
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
            doExpireTime () {
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
            }
        }
    }
</script>
