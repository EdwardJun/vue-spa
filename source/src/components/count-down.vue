<style scoped>
    .count-down {
      vertical-align: middle;
    }
</style>
<template>
    <span class="count-down">{{time}}</span>
</template>

<script>
    export default{
        data () {
            return {
                time: '--:--:--',
                flag: false
            }
        },
        props: {
            startTime: {
                type: String
            },
            endNum: {
                type: String
            }
        },
        mounted () {
            let time = setInterval(() => {
                if (this.flag == true) {
                    this.time = '订单超时'
                    clearInterval(time)
                    this.$emit('timeover', true)
                    return false
                }
                this.timeDown()
            }, 500)
        },
        methods: {
            timeDown () {
                let endTime = new Date(this.startTime.replace(/-/g, '/'))
                let modifyTime = new Date()
                let leftTime = parseInt((endTime.getTime() - modifyTime.getTime()) / 1000) + parseInt(this.endNum)
                let h = this.formate(parseInt(leftTime / (60 * 60) % 24))
                let m = this.formate(parseInt(leftTime / 60 % 60))
                let s = this.formate(parseInt(leftTime % 60))
                if (leftTime <= 0) {
                    this.flag = true
                    return false
                }
                this.time = `${h}:${m}:${s}`
            },
            formate (time) {  // 格式化，补零
                if (time >= 10) {
                    return time
                } else {
                    return `0${time}`
                }
            }
        }
    }
</script>
