<!--转盘抽奖页面 中奖之后弹窗的分隔-->
<template>
    <canvas width="615" height="44" class="split-line"></canvas>
</template>
<script>
    export default {
        props: {
            type: {
                type: String,
                required: true
            }
        },
        mounted () {
            var that = this
            that.$nextTick(function () {
                var ctx = that.$el.getContext('2d')
                var pi = Math.PI

                ctx.fillStyle = that.type == 'red' ? '#f66' : '#fff'
                ctx.moveTo(0, 3)
                ctx.arc(0, 22, 19, -pi / 2, pi / 2)
                ctx.lineTo(0, 41)
                ctx.lineTo(615, 41)
                ctx.arc(615, 22, 19, pi / 2, pi * 1.5)
                ctx.lineTo(615, 3)
                ctx.lineTo(0, 3)
                ctx.fill()

                ctx.beginPath()
                ctx.lineWidth = 3
                ctx.strokeStyle = that.type == 'red' ? '#f66' : '#fff'
                ctx.moveTo(0, 2)
                ctx.lineTo(615, 2)
                ctx.closePath()
                ctx.stroke()

                ctx.beginPath()
                ctx.moveTo(0, 42)
                ctx.lineTo(615, 42)
                ctx.closePath()
                ctx.stroke()

                ctx.moveTo(40, 22)
                ctx.strokeStyle = '#555'
                ctx.lineWidth = 1
                ctx.lineCap = 'round'
                var currX = 40
                while (currX < 615 - 40) {
                    ctx.beginPath()
                    ctx.moveTo(currX, 22)
                    ctx.lineTo(currX + 3, 22)
                    ctx.closePath()
                    ctx.stroke()
                    currX = currX + 10
                }
            })
        }
    }
</script>