<!--个人中心-拼团记录详情-->
<style lang="sass">
    @import '../sass/page/groupBuyRecordDetail.scss';
</style>
<template>
    <div class="page" id="group-buy-record-detail-page">
        <router-link class="club-title" :to="{ path: '/'+clubId+'/home' }" tag="div">
            <div :style="{ backgroundImage : 'url('+(clubLogoUrl || global.defaultClubLogo )+')' }"></div>
            <span>{{ clubName }}</span>
        </router-link>
        <div class="top-wrap">
            <h3>{{ activityName }}</h3>
            <div><label>拼团价：</label><strong>{{ price | MoneyFilter }}</strong><span>元</span></div>
            <div><label>有效时间：</label><span>{{ couponPeriod }}</span></div>
            <div><label>参团时间：</label><span>{{ createTime }}</span></div>
            <div><label>成团时间：</label><span>{{ completeTime }}</span></div>
            <div><label>使用时段：</label><span>{{ useDay }}</span></div>
            <div>{{ verifyStatus }}</div>
        </div>
        <div class="code-wrap">
            <h3>电子票号<span>（使用时请出示二维码，或者优惠券）</span></h3>
            <img :src="qrCodeImgSrc" alt="二维码"/>
            <div>{{ qrCode }}</div>
        </div>
        <div class="desc-wrap">
            <div class="wrap-title">活动说明</div>
            <!-- <h3>活动说明</h3> -->
            <ul v-if="descArr.length">
                <li v-for="item in descArr">{{ item }}</li>
            </ul>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import 'jr-qrcode'
    import Util from '../libs/util'
    import MoneyFilter from '../filters/money-formatter'

    export default {
        filters: {
            MoneyFilter
        },
        data () {
            return {
                global: Global.data,
                qrCodeImgSrc: null,
                qrCode: '',
                joinId: '', // 参团ID
                activityName: '',
                price: 0,
                couponPeriod: '',
                createTime: 0,
                completeTime: 0,
                useDay: '',
                verifyStatus: '',
                descArr: [],
                clubLogoUrl: '',
                clubId: '',
                clubName: ''
            }
        },
        created () {
            let that = this
            let global = that.global
            let query = global.currPage.query
            that.joinId = query.id
            if (!query.id) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            if (global.pageMode == 'club') {
                that.clubId = global.clubId
                that.clubName = global.clubName
                that.clubLogoUrl = global.clubLogoUrl
            }
            that.$http.get('../api/v2/user/group/buy/coupon/detail', {params: {
                id: that.joinId
            }}).then(res => {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    if (!res.couponNo) {
                        Util.tipShow('系统未成功生成券！')
                        return that.$router.back()
                    }
                    that.activityName = res.activityName
                    that.price = res.price
                    that.couponPeriod = res.couponPeriod
                    that.createTime = res.createTime
                    that.completeTime = res.completeTime
                    that.clubId = res.clubId

                    let descArr = []
                    if (res.actDescription) {
                        descArr = res.actDescription.split('\n')
                        that.descArr = descArr
                    }
                    that.qrCode = Util.spaceFormat(res.couponNo)
                    that.qrCodeImgSrc = jrQrcode.getQrBase64(res.couponNo, {padding: 0})
                    that.verifyStatus = res.verifyStatus
                    if (res.useDay) {
                        if (res.useDay.match(/(\d)/g).length == 7) {
                            res.useDay = '170'
                        }
                        that.useDay = (res.useDay || '').replace(/(\d)/g, function () {
                            return ['周日', '周一', '周二', '周三', '周四', '周五', '周六', '至'][arguments[1]]
                        }) + ' ' + ((res.beginAt && res.beginAt != res.endAt) ? (res.beginAt + ':00 - ' + res.endAt + ':00') : '')
                        that.useDay = that.useDay.replace(/,/g, '，')
                    } else if (res.customUseTime) {
                        that.useDay = Util.getCustomActTime(res.customUseTime)
                    }
                    global.loading = false

                    that.$http.get('../api/v2/club/' + that.clubId + '/clubName').then(res => {
                        res = res.body
                        that.clubLogoUrl = res.logo
                        that.clubName = res.name
                    })
                } else {
                    Util.tipShow(res.msg || '获取优惠券详情失败！')
                    return that.$router.back()
                }
            })
        }
    }
</script>