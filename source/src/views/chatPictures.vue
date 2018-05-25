<style lang="sass">
    @import '../sass/page/chatPictures.scss';
</style>
<template>
    <div class="page" id="chat-pictures-page" :style="{height: global.winHeight+'px'}">
        <swiper class="pic-swipe" :options="swiperOption">
            <swiper-slide v-for="(pic,index) in pics" :key="index">
                <div class="swiper-zoom-container">
                    <img :src="pic"/>
                </div>
            </swiper-slide>
            <div class="swiper-pagination" slot="pagination"></div>
        </swiper>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'

    var imgSwiper = null // 图片slide
    var thisPage = null // 组件实例的引用

    export default {
        data () {
            return {
                global: Global.data,
                startIndex: 0,
                techId: '',
                clubId: '',
                pics: [],
                swiperOption: {
                    observeParents: true,
                    zoom: true,
                    zoomMax: 2,
                    pagination: '.swiper-pagination',
                    onInit (swiper) {
                        imgSwiper = swiper
                    },
                    onSlideChangeEnd (swiper) {
                        if (thisPage) {
                            thisPage.doSlideChange(swiper.activeIndex)
                        }
                    },
                    onClick () {
                        thisPage.$router.back()
                    }
                }
            }
        },
        created () {
            let that = this
            let global = that.global
            let query = global.currPage.query
            thisPage = that

            that.startIndex = (query.index || 0) - 0
            let cacheData = Util.sessionStorage('chat-pics')
            if (cacheData) {
                that.pics = JSON.parse(cacheData)
            }

            if (that.pics.length > 0) {
                that.$nextTick(function () {
                    if (that.startIndex != 0) {
                        that.waitSlideTo()
                    } else {
                        global.loading = false
                        that.addEvent()
                    }
                })
            } else {
                that.$router.back()
            }
        },
        methods: {
            waitSlideTo () {
                var that = this
                var waitTimer = setInterval(function () {
                    if (imgSwiper) {
                        clearInterval(waitTimer)
                        imgSwiper.slideTo(that.startIndex, 0)
                        that.global.loading = false
                        that.addEvent()
                    }
                }, 30)
            },
            doSlideChange (index) {
                var that = this
                that.$router.replace({name: 'chatPictures', query: {index: index}})
            },
            addEvent () {
                // var that = this
                // var swiperContainer = that.$el.querySelector('div.swiper-container')
                // var swiperWrapper = that.$el.querySelector('div.swiper-wrapper')
                // if (swiperContainer) {
                //     swiperContainer.addEventListener('click', function () {
                //         that.$router.back()
                //     })
                // }
                // if (swiperWrapper) {
                //     swiperWrapper.addEventListener('click', function (event) {
                //         event.stopPropagation()
                //     })
                // }
            }
        }
    }
</script>
