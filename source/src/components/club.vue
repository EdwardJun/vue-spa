<style lang="sass">
    @import '../sass/components/club.scss';
</style>
<template>
    <div class="club-item-wrap" :class="{ 'no-techs' : techs.length>0, 'has-chain':  clubObj.chainId && clubObj.chainClubCount }" @click="doClickClub()">
        <div class="club-info" v-if="clubObj.name">
            <div :style="{ backgroundImage : 'url('+(clubObj.imageUrl || global.defaultClubLogo )+')' }"></div>
            <div>{{ clubObj.name }}</div>
            <div v-show="clubObj.couponCount>0" @click="doClickGetCoupon($event)">优惠</div>
            <div>{{ clubObj.distance | DistanceFormatter }}</div>
        </div>
        <swiper class="club-techs" v-if="techs.length>0 && swiperOption" :options="swiperOption">
            <swiper-slide v-for="(tech, index) in techs" :key="index">
                <div :techId="tech.id" :style="{ backgroundImage : 'url('+(tech.avatarUrl || global.defaultHeader )+')' }"></div>
                <div>{{ tech.name }}</div>
                <div v-show="tech.serialNo">{{ tech.serialNo }}</div>
            </swiper-slide>
        </swiper>
        <div @click="doViewChains($event)" class="club-chain" v-if="clubObj.chainId && clubObj.chainClubCount"><div>查看全部<span>{{ clubObj.chainClubCount }}</span>家门店</div></div>
    </div>
</template>

<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import DistanceFormatter from '../filters/distance-formatter'
    import BigNumFormatter from '../filters/big-num-formatter'

    var thisPage
    export default {
        data () {
            return {
                global: Global.data,
                swiperContainer: null
            }
        },
        props: {
            clubObj: {
                type: Object,
                required: true
            }
        },
        computed: {
            techs () {
                return this.clubObj.techs.filter(item => { return !!item.avatarUrl })
            },
            swiperOption () {
                let that = this
                return {
                    loop: that.techs.length > 3,
                    observeParents: true,
                    slidesPerView: 'auto',
                    onInit (swiper) {
                        setTimeout(function () {
                            if (that.techs.length > 3) {
                                swiper.reLoop()
                            }
                        }, 600)
                    },
                    onTap (swiper, event) {
                        var techId = swiper.clickedSlide.querySelector('div:nth-of-type(1)').getAttribute('techId')
                        if (techId) {
                            thisPage.doClickViewTech(techId, event)
                        }
                    }
                }
            }
        },
        filters: {
            DistanceFormatter: DistanceFormatter,
            BigNumFormatter: BigNumFormatter
        },
        created () {
            thisPage = this
        },
        methods: {
            doClickClub () {
                var that = this // 跳转到会所首页
                let clubObj = that.clubObj
                if (clubObj.name) {
                    Util.sessionStorage('club-distance-' + clubObj.id, clubObj.distance)
                    that.$router.push({path: '/' + clubObj.id + '/home'})
                }
            },
            doClickViewTech (id, event) {
                var that = this
                event.stopPropagation()
                that.$router.push({
                    name: 'technicianDetail',
                    query: {id: id}
                })
            },
            doClickGetCoupon (e) {
                var that = this
                that.$router.push({path: '/' + that.clubObj.id + '/promotions'})
                e.stopPropagation()
            },
            doViewChains (e) {
                var that = this
                var clubObj = that.clubObj
                that.$router.push({name: 'clubChains', query: {id: clubObj.chainId}})
                e.stopPropagation()
            }
        }
    }
</script>
