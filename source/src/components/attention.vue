<style lang="sass">
    @import '../sass/components/attention.scss';
</style>
<template>
    <div class="attention-wrap" v-if="global.pageMode=='club'">
        <div v-show="showGzText">长按二维码关注"小摩豆"</div>
        <div><img v-if="clubQrCodeImg" :src="clubQrCodeImg"/></div>
        <div v-show="!showGzText">点技师、约项目，就上小摩豆</div>
        <div>
            <div class="list"><span>1</span>保存二维码到相册</div>
            <div class="arrow"></div>
            <div class="list"><span>2</span>微信打开扫一扫</div>
            <div class="arrow"></div>
            <div class="list"><span>3</span>点击右上角从相册选取二维码</div>
            <div class="arrow"></div>
            <div class="list"><span>4</span>点击关注</div>
        </div>
        <div v-show="!showGzText">或微信查找公众号"小摩豆"</div>
    </div>
</template>

<script>
    import Global from '../libs/global'

    export default {
        data () {
            return {
                global: Global.data,
                getClubQrCodeImgUrl: '../api/v1/qrcode/club/home',
                showGzText: false,
                clubQrCodeImg: '', // 关注公众号二维码图片
                getCodeImgMaxCount: 5
            }
        },
        created () {
            var that = this
            var global = that.global
            that.getClubQrCodeImg() // 获取二维码图片
            if (global.pageMode == 'club' && global.userAgent.isWX) {
                that.showGzText = true
            }
        },
        methods: {
            getClubQrCodeImg () {
                var that = this
                var global = that.global
                if (global.pageMode == 'club') {
                    that.getCodeImgMaxCount--
                    that.$http.get(that.getClubQrCodeImgUrl, {params: {clubId: global.clubId}}).then(function (res) {
                        res = res.body
                        if (res.statusCode == 200) {
                            if (res.respData == 'N') {
                                if (that.getCodeImgMaxCount != 0) {
                                    that.getClubQrCodeImg()
                                }
                            } else {
                                that.clubQrCodeImg = res.respData.url
                            }
                        }
                    })
                }
            }
        }
    }
</script>
