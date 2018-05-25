<style lang="sass">
    @import '../sass/page/inviteActivityGifts.scss';
</style>
<template>
    <div class="page" id="invite-activity-gifts-page">
        <div class="top-wrap">
            <router-link class="club-info" :to="{ path: '/' + clubId + '/home' }" tag="div">
                <div :style="{ 'background-image': 'url('+global.clubLogoUrl+')' }"></div>
                <span class="club-name">{{ global.clubName }}</span>
            </router-link>
            <div class="coupon-wrap">
                <canvas ref="couponBgCanvas" width="680" height="307"></canvas>
                <div><b>{{ consumeMoneyDescription }}</b><span>{{ useTypeName }}</span></div>
                <div style="display:none">{{ consumeMoneyDescription }}</div>
                <div>领取时间：<span>{{ getDate }}</span></div>
                <div>券有效期：<span>{{ couponPeriod }}</span></div>
            </div>
        </div>
        <div class="code-wrap" :class="{ used: isCouponSettled }">
            <div>电子票号（使用时请出示二维码，或者优惠码）</div>
            <img :src="qrCodeImgSrc" v-if="qrCodeImgSrc"/>
            <div>{{ couponNo }}</div>
            <div v-show="isCouponSettled">使用时间：<span>{{ modifyDate }}</span></div>
        </div>
        <div class="desc-wrap">
            <div>使用说明：</div>
            <div v-html="actContent"></div>
        </div>
        <!--邀请按钮-->
        <div class="invite-btn"><router-link tag="div" :to="{ name: 'inviteActivity' }">邀好友，赢取更多福利</router-link></div>
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
                clubId: '',
                userActId: '',
                useTypeName: '-',
                consumeMoneyDescription: '-',
                couponPeriod: '-',
                getDate: '-',
                qrCodeImgSrc: '',
                actContent: '--',
                couponNo: '----',
                modifyDate: '',
                isCouponSettled: false // 是否已使用
            }
        },
        created () {
            let that = this
            let global = that.global
            let query = global.currPage.query
            that.clubId = query.clubId || global.clubId
            that.userActId = query.userActId
            document.title = '我的礼品'
            if (!that.userActId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }

            // 请求数据
            that.$http.post('../api/v2/club/userredpacket/' + that.userActId, {userType: 'paid'}).then(function (res) {
                res = res.body
                var errorInfo = '未能获取礼品信息！'
                if (res.statusCode == 200) {
                    res = res.respData
                    let giftContent = res.userAct
                    if (giftContent) {
                        that.useTypeName = giftContent.useTypeName
                        if (giftContent.couponType == 'service_item') {
                            that.consumeMoneyDescription = giftContent.actTitle
                        } else if (giftContent.useType == 'gift') {
                            that.consumeMoneyDescription = giftContent.actTitle
                        } else {
                            that.consumeMoneyDescription = giftContent.consumeMoneyDescription
                        }
                        that.couponPeriod = giftContent.couponPeriod
                        that.isCouponSettled = giftContent.couponSettled == 'Y'
                        that.getDate = giftContent.getDate + (that.isCouponSettled ? '（已使用）' : '')
                        that.modifyDate = giftContent.modifyDate
                        that.actContent = decodeURIComponent(giftContent.actContent.replace(/↵/g, '<p>'))
                        that.qrCodeImgSrc = jrQrcode.getQrBase64(giftContent.couponNo, {padding: 0})
                        that.couponNo = Util.spaceFormat(giftContent.couponNo)

                        // 绘制优惠券背景
                        that.drawCouponBg('./static/images/invite_act_bg.png')
                        global.loading = false
                    } else {
                        Util.tipShow(errorInfo)
                        return that.$router.back()
                    }
                } else {
                    Util.tipShow(res.msg || errorInfo)
                    return that.$router.back()
                }
            })
        },
        methods: {
            /**
             * 绘制优惠券的背景
             * @param bgImgUrl：背景图url
             */
            drawCouponBg (bgImgUrl) {
                let that = this
                let ctx = that.$refs.couponBgCanvas.getContext('2d')
                let allW = 680
                let allH = 307
                let top = 11
                let left = 15
                let right = allW - left
                let pi = Math.PI
                let centerX = allW / 2
                ctx.save()
                ctx.beginPath()
                ctx.moveTo(left, top)
                ctx.lineTo(right, top)
                ctx.lineTo(right, top + 29)
                ctx.arc(right, top + 39, 10, pi * 1.5, pi * 0.5, true)
                ctx.lineTo(right, allH - 20)
                ctx.arcTo(right, allH, right - 20, allH, 20)
                ctx.lineTo(centerX + 20, allH)
                ctx.arc(centerX, allH, 20, 0, pi, true)
                ctx.lineTo(left + 20, allH)
                ctx.arcTo(left, allH, left, allH - 20, 20)
                ctx.lineTo(left, top + 49)
                ctx.arc(left, top + 39, 10, 0.5 * pi, 1.5 * pi, true)
                ctx.lineTo(left, top)
                ctx.closePath()
                ctx.clip()

                var img = new Image()
                img.onload = function () {
                    ctx.drawImage(img, left, top, right, allH - top)

                    // 绘制虚线条
                    var dottedLeft = left + 10
                    var dottedTop = top + 39
                    var dottedLen = 8
                    ctx.strokeStyle = 'rgba(0,0,0,0.6)'
                    ctx.lineWidth = 1

                    ctx.beginPath()
                    while (dottedLeft < right - 10) {
                        ctx.moveTo(dottedLeft, dottedTop)
                        ctx.lineTo(dottedLeft + dottedLen, dottedTop)
                        dottedLeft = dottedLeft + dottedLen * 1.5
                    }
                    ctx.closePath()
                    ctx.stroke()
                    ctx.restore()

                    // 绘制顶部线条
                    ctx.lineWidth = 6
                    ctx.strokeStyle = '#c6cfff'
                    ctx.beginPath()
                    ctx.moveTo(16, 26)
                    ctx.arc(16, 14, 12, 0.5 * pi, 1.5 * pi)
                    ctx.lineTo(allW - 16, 2)
                    ctx.arc(allW - 16, 14, 12, 1.5 * pi, 0.5 * pi)
                    ctx.stroke()
                }
                img.src = bgImgUrl
            }
        }
    }
</script>
