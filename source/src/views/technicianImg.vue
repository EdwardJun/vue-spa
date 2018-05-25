<style lang="sass">
    @import '../sass/page/technicianImg.scss';
</style>
<template>
    <div class="page" id="technician-img-page" :style="{height: global.winHeight+'px'}">
        <swiper class="pic-swipe" :options="swiperOption">
            <swiper-slide v-for="(pic,index) in pics" :key="index">
                <img :src="pic.bigImageUrl"/>
            </swiper-slide>
            <div class="swiper-pagination" slot="pagination"></div>
        </swiper>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'

    var techImgSwiper = null // 图片slide
    var thisPage = null // 组件实例的引用

    export default {
        data () {
            return {
                global: Global.data,
                techId: '',
                startIndex: 0,
                swiperOption: {
                    observeParents: true,
                    zoom: true,
                    zoomMax: 2,
                    pagination: '.swiper-pagination',
                    onInit (swiper) {
                        techImgSwiper = swiper
                    },
                    onSlideChangeEnd (swiper) {
                        if (thisPage) {
                            thisPage.doSlideChange(swiper.activeIndex)
                        }
                    }
                },
                pics: [] // 相册
            }
        },
        created () {
            var that = this
            var global = that.global
            var pageParam = global.currPage.query
            thisPage = that
            if (pageParam.id == undefined) { // 链接上无技师id
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            if (pageParam.index) {
                that.startIndex = parseInt(pageParam.index) - 1
            }
            var pageData = global.pageData
            that.techId = pageParam.id
            if (!pageData['technicianImg']) {
                pageData['technicianImg'] = {}
            }
            pageData = pageData['technicianImg']
            if (pageData[that.techId]) {
                that.pics = pageData[that.techId]
                that.$nextTick(function () {
                    if (that.startIndex != 0) {
                        that.waitSlideTo()
                    } else {
                        global.loading = false
                        that.addEvent()
                    }
                })
            } else {
                that.$http.get('../api/v2/club/tech/albums/{techId}', {params: {techId: pageParam.id}}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        if (res) {
                            res.sort(function (pic1, pic2) {
                                return pic1.orders > pic2.orders
                            })
                            that.pics = pageData[that.techId] = res
                        }
                        that.$nextTick(function () {
                            // console.log(that.startIndex)
                            if (that.startIndex != 0) {
                                that.waitSlideTo()
                            } else {
                                global.loading = false
                                that.addEvent()
                            }
                        })
                    } else {
                        Util.tipShow(global.loadError)
                        that.$router.back()
                    }
                }, function () {
                    Util.tipShow(global.loadError)
                    that.$router.back()
                })
            }
        },
        methods: {
            waitSlideTo () {
                var that = this
                var waitTimer = setInterval(function () {
                    if (techImgSwiper) {
                        clearInterval(waitTimer)
                        techImgSwiper.slideTo(that.startIndex, 0)
                        that.global.loading = false
                        that.addEvent()
                    }
                }, 30)
            },
            doSlideChange (index) {
                var that = this
                that.$router.replace({name: 'technicianImg', query: {id: that.techId, index: index + 1}})
            },
            addEvent () {
                var that = this
                var global = that.global
                var swiperContainer = that.$el.querySelector('div.swiper-container')
                var swiperWrapper = that.$el.querySelector('div.swiper-wrapper')
                if (swiperContainer) {
                    swiperContainer.addEventListener('click', function () {
                        if (global.lastPage.name == 'technicianDetail') {
                            that.$router.back()
                        } else {
                            that.$router.replace({name: 'technicianDetail', query: {id: that.techId}})
                        }
                    })
                }
                if (swiperWrapper) {
                    swiperWrapper.addEventListener('click', function (event) {
                        event.stopPropagation()
                    })
                }
            }
        }
    }
</script>
