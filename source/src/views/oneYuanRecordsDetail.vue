<style lang="sass">
    @import '../sass/page/oneYuanRecordsDetail.scss';
</style>
<template>
    <div class="page" id="one-yuan-records-detail-page">
        <router-link :to="{ path: '/'+clubId+'/home' }" class="club-title right-arrow-item" tag="div"><div :style="{ 'background-image': 'url('+(userAct.clubImageUrl || global.defaultClubLogo)+')' }"></div><div>{{ userAct.clubName }}</div></router-link>

        <div class="project-info">
            <div :style="{ 'background-image': 'url('+(serviceItemImg || global.defaultServiceItemImgUrl)+')' }"></div>
            <div>
                <div>
                    <div>{{ userAct.actTitle }}</div>
                    <div>一元抢购</div>
                </div>
                <div>原价：<span>{{ userAct.actValue }}元</span></div>
                <div>幸运号码：<span>{{ ticketNo }}</span></div>
            </div>
        </div>

        <div class="qr-info">
            <div>电子票号（使用时请出示二维码，或者优惠码）</div>
            <img alt="二维码" :src="qrCodeImgSrc" v-if="qrCodeImgSrc"/>
            <span>{{ userAct.couponNo | CodeFormatter }}</span>
        </div>

        <div class="explain-item">
            <div class="exp-item-header">活动说明</div>
            <div class="exp-item-plain">使用时间：<span>{{ userAct.couponPeriod }}</span></div>
            <div class="exp-item-plain" v-show="userAct.useTimePeriod">使用时段：<span>{{ userAct.useTimePeriod }}</span></div>
            <div class="exp-item-ul" v-html="userAct.actContent"></div>
        </div>

        <div class="explain-item">
            <div class="exp-item-header">项目说明</div>
            <div class="exp-item-ul" v-html="userAct.actDescription"></div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import CodeFormatter from '../filters/code-formatter'
    import 'jr-qrcode'

    export default {
        filters: {
            CodeFormatter: CodeFormatter
        },
        data () {
            return {
                global: Global.data,
                clubId: '',
                serviceItemImg: '',
                ticketNo: '',
                userAct: {},
                qrCodeImgSrc: ''
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            var clubId = query.clubId || global.clubId || ''
            var userOneYuanId = query.userOneYuanId || ''

            document.title = '优惠券详情'
            if (!clubId || !userOneYuanId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            that.clubId = clubId
            that.$http.get('../api/v2/club/one_yuan/draw/user_one_yuan/view', {params: {
                clubId: clubId,
                userOneYuanId: userOneYuanId
            }}).then(function (res) {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    that.ticketNo = res.ticketNo
                    that.serviceItemImg = res.imageUrl

                    var userAct = res.userAct
                    that.qrCodeImgSrc = jrQrcode.getQrBase64(userAct.couponNo, {padding: 0})
                    that.userAct = userAct
                    global.loading = false
                } else {
                    Util.tipShow(res.msg || global.loadError)
                    that.$router.back()
                }
            }, function () {
                Util.tipShow(global.loadError)
                that.$router.back()
            })
        }
    }
</script>
