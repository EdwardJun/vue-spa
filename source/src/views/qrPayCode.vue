<style lang="sass">
    @import '../sass/page/qrPayCode.scss';
</style>
<template>
    <div class="page" id="qrpay-code-page">
        <div class="qrcode-wrap">
            <div>
                <div><img :src="qrCodeImgSrc"/></div>
                <div :class="{ processing : isProcessing }" @click="refreshCode()"><span>{{ timeStr }}</span></div>
            </div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import 'jr-qrcode'

    export default {
        data () {
            return {
                global: Global.data,
                isDirect: false,
                isProcessing: false,
                timer: 0,
                timeStr: '每分钟自动更换',
                qrCodeImgSrc: null
            }
        },
        created () {
            var that = this
            var global = that.global
            var pageParams = global.currPage.query
            document.title = '付款二维码'
            if (pageParams.isDirect != undefined) that.isDirect = true
            that.refreshCode()
            global.loading = false
        },
        methods: {
            refreshCode () {
                var that = this
                if (that.isProcessing) {
                    return Util.tipShow('正在请求二维码！')
                }
                that.isProcessing = true
                that.$http.get('../api/v2/financial/account/pay/qrcode').then(function (res) {
                    res = res.body
                    that.isProcessing = false
                    if (res.statusCode == 200) {
                        res = res.respData
                        if (that.timer) clearTimeout(that.timer)
                        that.qrCodeImgSrc = jrQrcode.getQrBase64(res.qrcode, {padding: 0})
                        if (res.period > 0) {
                            that.timer = setTimeout(that.refreshCode, res.period * 1000)
                            var timeStr = that.formatSec(res.period)
                            if (timeStr == '1分钟') {
                                that.timeStr = '每分钟自动更换'
                            } else {
                                that.timeStr = '每' + timeStr + '自动更换'
                            }
                        } else {
                            that.timeStr = '无限期，不自动刷新'
                        }
                    } else {
                        Util.tipShow(res.msg || '请求二维码失败')
                        if (that.timer) {
                            clearTimeout(that.timer)
                        }
                        that.qrCodeImgSrc = '.static/images/common/loading_page.png'
                    }
                })
            },
            formatSec (sec) {
                var str = ''
                var tmp1
                var tmp2
                var floor = Math.floor
                tmp1 = sec % 60
                if (tmp1) {
                    str += tmp1 + '秒'
                }
                tmp2 = floor(sec / 60)
                if (tmp2 >= 60) {
                    tmp1 = tmp2 % 60
                    if (tmp1) {
                        str = tmp1 + '分钟' + str
                    }
                    tmp2 = floor(tmp2 / 60)
                    if (tmp2 >= 24) {
                        tmp1 = tmp2 % 24
                        if (tmp1) {
                            str = tmp1 + '小时' + str
                        }
                        tmp2 = floor(tmp2 / 24)
                        str = tmp2 + '天' + str
                    } else {
                        str = tmp2 + '小时' + str
                    }
                } else {
                    str = tmp2 + '分钟' + str
                }
                return str
            }
        },
        beforeDestroy () {
            if (this.timer) {
                clearTimeout(this.timer)
            }
        }
    }
</script>
