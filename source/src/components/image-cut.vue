<style scoped>
    div.image-cut-container {
        position: relative;
        background: #000;
    }

    div.image-cut-container > canvas:nth-of-type(2) {
        display: none;
        position: absolute;
        background: #000;
    }

    div.image-cut-container > div.flip-btn {
        position: absolute;
        height: 2.08rem;
        width: 6.324rem;
        left: 50%;
        margin-left: -3.167rem;
        line-height: 2.08rem;
        border-radius: 1.1rem;
        font-size: 0.9rem;
        color: #666;
        text-align: center;
        background-color: #ccc
    }
</style>
<template>
    <div class="image-cut-container" :style="{ width : allW+'px', height : allH+'px' }" @touchstart="doTouchStartHandler($event)" @touchmove="doTouchMoveHandler($event)" @mousewheel="doMouseWheelHandler($event)">
        <canvas :width="allW" :height="allH" :style="{ width : allW+'px', height : allH+'px' }"></canvas>
        <canvas :style="{ top : vT+'px', left : vL+'px',width : vW+'px', height : vH+'px' }"></canvas>
        <div class="flip-btn" :style="{ top : (vT+vH+15)+'px'}" @click="doRotateImg()">翻转</div>
    </div>
</template>
<script>
    import eventHub from '../libs/hub'

    export default {
        props: ['allWProp', 'allHProp', 'vWProp', 'vHProp'],
        data () {
            return {
                img: null, // 图片源
                imgX: 0, // 图片当前坐标
                imgY: 0,
                imgW: 0, // 图片当前大小
                imgH: 0,
                imgWN: 0, // 图片原始大小
                imgHN: 0,
                _$: null, // 操作容器
                _$$: null, // 导出容器
                $: null, // 操作容器内容符
                $$: null, // 导出容器内容符
                vL: 0, // 可视区域左上右下坐标
                vT: 0,
                vR: 0,
                vB: 0,
                _vT_add_vB: 0,
                _vL_add_vR: 0,
                _vL_mes_1: 0,
                _vT_mes_1: 0,
                _vW_add_2: 0,
                _vH_add_2: 0,
                rotateBtn: null,
                currRotateStep: 0,
                touchType: 0,
                pM: null,
                pZ: null
            }
        },
        computed: {
            allW () {
                return this.allWProp
            },
            allH () {
                return this.allHProp
            },
            vW () {
                return this.vWProp
            },
            vH () {
                return this.vHProp
            }
        },
        created () {
            eventHub.$on('get-base64', this.doGetBase64)
        },
        mounted () {
            var that = this
            that.vW = that.vW < that.allW ? that.vW : that.allW
            that.vH = that.vH < that.allH ? that.vH : that.allH
            that.vL = (that.allW - that.vW) / 2
            that.vT = (that.allH - that.vH) / 2
            that.vR = that.vL + that.vW
            that.vB = that.vT + that.vH
            that._vT_add_vB = that.vT + that.vB
            that._vL_add_vR = that.vL + that.vR
            that._vL_mes_1 = that.vL - 1
            that._vT_mes_1 = that.vT - 1
            that._vW_add_2 = that.vW + 2
            that._vH_add_2 = that.vH + 2

            that._$ = that.$el.children[0]
            that.$ = that._$.getContext('2d')
            that._$$ = that.$el.children[1]
            that.$$ = that._$$.getContext('2d')
            that.rotateBtn = that.$el.querySelector('div.flip-btn')

            that.drawMask()
            if (window._fileReader) {
                that.putImageUrl(window._fileReader.result)
            }
        },
        methods: {
            doGetBase64 (option) {
                var that = this
                var imgData = that.getImageBase64(option.width, option.height)
                eventHub.$emit('put-base64', imgData)
            },
            doTouchStartHandler (e) {
                var that = this
                if (e.target != that.rotateBtn) {
                    e.preventDefault()
                    that.pM = [e.targetTouches[0].clientX, e.targetTouches[0].clientY]
                    that.touchType = 1
                    if (e.targetTouches.length == 2) { // 缩放
                        that.pZ = that.getZ(that.pM[0] - e.targetTouches[1].clientX, that.pM[1] - e.targetTouches[1].clientY)
                        that.touchType = 2
                    }
                }
            },
            doTouchMoveHandler (e) {
                var that = this
                if (e.target != that.rotateBtn) {
                    e.preventDefault()
                    var p = [e.targetTouches[0].clientX, e.targetTouches[0].clientY]
                    if (that.touchType == 1 && e.targetTouches.length == 1) {
                        that.imgX += p[0] - that.pM[0]
                        that.imgY += p[1] - that.pM[1]
                        that.pM = p
                        // 移动位置修正
                        if (that.imgW > that.vW) {
                            if (that.imgX > that.vL) that.imgX = that.vL
                            else if (that.imgX + that.imgW < that.vR) that.imgX = that.vR - that.imgW
                        } else {
                            that.imgX = (that._vL_add_vR - that.imgW) / 2
                        }

                        if (that.imgH > that.vH) {
                            if (that.imgY > that.vT) that.imgY = that.vT
                            else if (that.imgY + that.imgH < that.vB) that.imgY = that.vB - that.imgH
                        } else {
                            that.imgY = (that._vT_add_vB - that.imgH) / 2
                        }
                    } else if (that.touchType == 2 && e.targetTouches.length == 2) {
                        var z = that.getZ(p[0] - e.targetTouches[1].clientX, p[1] - e.targetTouches[1].clientY)
                        var zAdd = z / that.pZ
                        var w = that.imgW * zAdd
                        var h = that.imgH * zAdd

                        if (w > that.vW || h > that.vH) { // 缩放大小限制
                            that.imgX -= (w - that.imgW) / that.imgW * (that.allW / 2 - that.imgX)
                            that.imgY -= (h - that.imgH) / that.imgH * (that.allH / 2 - that.imgY)
                            that.imgW = w
                            that.imgH = h
                            that.pZ = z
                        }
                    }
                    that.draw()
                }
            },
            doMouseWheelHandler (e) {
                e.preventDefault()
                var that = this
                if (e.wheelDelta > 0) {
                    that.imgW *= 1.05
                    that.imgH *= 1.05
                } else if (e.wheelDelta < 0) {
                    that.imgW /= 1.05
                    that.imgH /= 1.05
                }
                that.draw()
            },
            doRotateImg () {
                var that = this
                that.currRotateStep = (that.currRotateStep == 3 ? 0 : that.currRotateStep + 1)
                that.draw()
            },
            getZ (a, b) {
                return Math.sqrt(a * a + b * b)
            },
            drawMask () {
                var that = this
                var $ = that.$
                $.fillStyle = 'rgba(0,0,0,0.7)'
                $.fillRect(0, 0, that.allW, that.vT) // 上下
                $.fillRect(0, that.vB, that.allW, that.vT)
                $.fillRect(0, that.vT, that.vL, that.vH) // 左右
                $.fillRect(that.vR, that.vT, that.vL, that.vH) // 左右
                $.strokeStyle = 'rgba(225,255,225,1)' // 可视
                $.strokeRect(that._vL_mes_1, that._vT_mes_1, that._vW_add_2, that._vH_add_2)
            },
            draw () {
                var that = this
                var cx = that.imgX + that.imgW / 2
                var cy = that.imgY + that.imgH / 2
                var $ = that.$
                $.clearRect(0, 0, that.allW, that.allH)
                $.save()
                $.translate(cx, cy)
                $.rotate(90 * that.currRotateStep * Math.PI / 180)
                $.translate(-cx, -cy)
                $.drawImage(that.img, that.imgX, that.imgY, that.imgW, that.imgH)
                $.restore()
                that.drawMask()
            },
            initImg () {
                var that = this
                that.imgW = that.imgWN = that.img.width
                that.imgH = that.imgHN = that.img.height
                var z = 1 / Math.min(that.imgW / that.vW, that.imgH / that.vH)
                that.imgW *= z
                that.imgH *= z
                that.imgX = (that._vL_add_vR - that.imgW) / 2
                that.imgY = (that._vT_add_vB - that.imgH) / 2
                that.draw()
            },
            putImageFromImg (imgTag) {
                if (imgTag == null || typeof imgTag != 'object' || imgTag.tagName.toLowerCase() != 'img') return false
                this.img = imgTag
                this.initImg()
            },
            putImageUrl (url) {
                var that = this
                if (url == null || url == '') return false
                that.img = new Image()
                that.img.onload = function () {
                    that.initImg()
                }
                that.img.src = url
            },
            getImageBase64 (rw, rh) {
                var that = this
                var _$$ = that._$$
                _$$.style.display = 'block'
                var zW = rw / that.vW
                var zH = rh / that.vH
                _$$.width = rw
                _$$.height = rh

                var px = (that.imgX - that.vL) * zW
                var py = (that.imgY - that.vT) * zH
                var ow = that.imgW * zW
                var oh = that.imgH * zH
                var cx = px + ow / 2
                var cy = py + oh / 2
                var $$ = that.$$

                $$.save()
                $$.translate(cx, cy)
                $$.rotate(90 * that.currRotateStep * Math.PI / 180)
                $$.translate(-cx, -cy)
                $$.drawImage(that.img, px, py, ow, oh)
                $$.restore()
                return $$.canvas.toDataURL('image/png')
            }
        },
        beforeDestroy () {
            eventHub.$off('get-base64', this.doGetBase64)
        }
    }
</script>