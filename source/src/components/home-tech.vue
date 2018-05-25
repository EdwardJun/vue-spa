<style lang="sass">
    @import '../sass/components/home-tech.scss';
</style>
<template>
    <div class="home-tech-wrap">
        <swiper v-if="techs.length>0 && swiperOption" :options="swiperOption">
            <swiper-slide v-for="(tech,index) in techs" :key="tech.id">
                <div :style="{ backgroundImage : 'url('+(tech.avatarUrl || global.defaultHeader )+')' }" @click="doClickTech(tech.id)" :techId='tech.id'>
                    <div v-show="index == 0"></div>
                </div>
                <div>{{ tech.name }}</div>
                <div v-show="tech.serialNo">{{ tech.serialNo }}</div>
            </swiper-slide>
        </swiper>
    </div>
</template>

<script>
    import Global from '../libs/global'
    var thisPage

    export default {
        data () {
            return {
                global: Global.data
            }
        },
        computed: {
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
                        }, 100)
                    },
                    onTap (swiper) {
                        var techId = swiper.clickedSlide.querySelector('div:nth-of-type(1)').getAttribute('techId')
                        if (techId) {
                            thisPage.doClickTech(techId)
                        }
                    }
                }
            }
        },
        filters: {
            kiloNumFormat (val) {
                if (val >= 1000) {
                    return (val / 1000).toFixed(1) + 'K'
                } else {
                    return val
                }
            }
        },
        props: {
            techs: {
                type: Array,
                required: true
            }
        },
        created () {
            thisPage = this
        },
        methods: {
            doClickTech (techId) {
                this.$router.push({name: 'technicianDetail', query: {id: techId}})
            }
        }
    }
</script>
