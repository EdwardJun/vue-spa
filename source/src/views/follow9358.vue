<style lang="sass">
    @import '../sass/page/follow9358.scss';
</style>
<template>
    <div class="page" id="follow9358-page">
        <div class="top">
            <router-link tag="div" :to="{ name: 'home' }" class="club-title right-arrow-item">
                <div :style="{ 'background-image': 'url('+(global.clubLogoUrl || global.defaultClubLogo)+')' }"></div>
                <div>{{ global.clubName }}</div>
            </router-link>
        </div>
        <swiper class="tip-swipe" :options="swiperOption">
            <swiper-slide class="s1"></swiper-slide>
            <swiper-slide class="s2"></swiper-slide>
            <swiper-slide class="s3"></swiper-slide>
            <swiper-slide class="s4"></swiper-slide>
            <div class="swiper-pagination" slot="pagination"></div>
        </swiper>
        <div class="qrcode-wrap">
            <div>
                <img :src="qrCodeUrl" alt="会所二维码" v-if="qrCodeUrl"/>
            </div>
            <div>长按二维码关注，获取更多优惠活动</div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'

    export default {
        data () {
            return {
                global: Global.data,
                qrCodeUrl: '',
                swiperOption: {
                    autoplay: 5000,
                    pagination: '.swiper-pagination',
                    paginationClickable: true,
                    loop: true,
                    autoplayDisableOnInteraction: false,
                    observeParents: true
                }
            }
        },
        created () {
            var that = this
            var global = that.global
            var clubId = global.currPage.query.clubId || global.clubId
            that.$http.get('../api/v2/club/clubortech/view', {
                params: {
                    id: clubId,
                    type: 'club'
                }
            }).then(function (res) {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    that.qrCodeUrl = res.qrCodeUrl || res.qrcodeUrl
                    global.loading = false
                } else {
                    that.$router.push({path: '/' + clubId + '/home'})
                }
            })
        }
    }
</script>
