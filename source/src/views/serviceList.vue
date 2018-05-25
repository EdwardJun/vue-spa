<style lang="sass">
    @import '../sass/page/serviceList.scss';
</style>
<template>
    <div class="page" id="service-list-page" v-show="!global.loading" @scroll="doScrollPage()">
        <div class="backTop" v-show="isShowBackTop" @click="gotoTop(0.1, 10)"></div>
        <div class="category" v-for="(category,index) in serviceList" :key="index" :class="'c'+index">
            <div>
                <div :style="{ 'background-image' : 'url(' + category.categoryBean.imageUrl + ')' }"></div>
                <div>{{ category.categoryBean.name }}</div>
            </div>
            <ul class="service-list">
                <router-link tag="li" v-for="item in category.itemList" :key="item.id" :to="{ name: 'serviceItem', query: { id : item.id }}">
                    <div :style="{ backgroundImage : 'url('+(item.coverUrl || global.defaultServiceItemImgUrl)+')' }"></div>
                    <div>
                        <div>{{ item.name }}</div>
                        <div>{{ item.price | itemPriceFormatter(item.duration,item.durationUnit) }}<span v-show="item.pricePlus">{{ item.pricePlus | itemPriceFormatter(item.durationPlus, item.durationUnitPlus) }}</span></div>
                    </div>
                </router-link>
            </ul>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import ItemPriceFormatter from '../filters/item-price-formatter'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                serviceList: [],
                isShowBackTop: true
            }
        },
        mounted () {
            var that = this
            var global = that.global
            document.title = Global.setPageTitle('serviceList') || '服务项目'

            that.$http.get('../api/v1/club/category/getCategoryItemList', {params: {clubId: global.clubId}}).then(function (res) {
                res = res.body
                if (res.statusCode == 200) {
                    that.serviceList = res.respData || []
                    var fixedServiceId = global.currPage.query.id
                    if (fixedServiceId) {
                        var fixedIndex = 0
                        for (let k = 0; k < that.serviceList.length; k++) {
                            if (that.serviceList[k].categoryBean.id == fixedServiceId) {
                                fixedIndex = k
                            }
                        }
                        global.loading = false
                        if (fixedIndex != 0) {
                            that.$nextTick(function () {
                                var posEl = that.$el.querySelector('.c' + fixedIndex)
                                var maxCount = 0
                                var initScrollTimer = setInterval(function () {
                                    maxCount++
                                    if (posEl.offsetTop || maxCount > 50) {
                                        clearInterval(initScrollTimer)
                                        that.$el.scrollTop = posEl.offsetTop
                                    }
                                }, 40)
                            })
                        }
                    } else {
                        global.loading = false
                    }
                } else {
                    Util.tipShow(global.loadError)
                    that.$router.back()
                }
            }, function () {
                Util.tipShow(global.loadError)
                that.$router.back()
            })
        },
        filters: {
            itemPriceFormatter: ItemPriceFormatter
        },
        methods: {
            doScrollPage () {
                var that = this
                var el = that.$el
                that.isShowBackTop = el.scrollTop > 30
            },
            gotoTop (acceleration, time) {
                var that = this
                var el = that.$el
                acceleration = acceleration || 0.1
                time = time || 10

                var x1 = 0
                var y1 = 0
                var x2 = 0
                var y2 = 0

                x2 = el.scrollLeft || 0
                y2 = el.scrollTop || 0

                // 滚动条到页面顶部的水平距离
                var x = x2 - x1
                // 滚动条到页面顶部的垂直距离
                var y = y2 - y1

                // 滚动距离 = 目前距离 / 速度, 因为距离原来越小, 速度是大于 1 的数, 所以滚动距离会越来越小
                var speeding = 1 + acceleration
                el.scrollLeft = Math.floor(x / speeding)
                el.scrollTop = Math.floor(y / speeding)

                // 如果距离不为零, 继续调用函数
                if (x > 0 || y > 0) {
                    window.setTimeout(function () {
                        that.gotoTop(acceleration, time)
                    }, time)
                }
            }
        }
    }
</script>
