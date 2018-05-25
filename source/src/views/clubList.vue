<style lang="sass">
    @import '../sass/page/clubList.scss';
</style>
<template>
    <router-view></router-view>
</template>
<script>
    import Global from '../libs/global'
    import eventHub from '../libs/hub'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                currCity: '',
                currRegion: '',
                isOldUser: Util.localStorage('viewClubType') == 4
            }
        },
        created () {
            var that = this
            console.log(that)
            var global = that.global
            var query = global.currPage.query
            var authCode = query.code
            document.title = '小摩豆'
            if (global.userAgent.isWX && (!global.openId || global.openId.length < 10)) {
                if (authCode) {
                    Global.getOpenId({authCode: authCode}).then(function () {
                        that.init()
                    }, function (err) {
                        Util.tipShow(err)
                    })
                } else {
                    Global.getOauthCode('9358', '9358', 'base')
                    return that.$router.back()
                }
            } else {
                that.init()
            }
            eventHub.$on('get-curr-city-region', this.doGetCurrCityRegion)
        },
        methods: {
            init () {
                var that = this
                var global = that.global
                var currPage = global.currPage
                if (currPage.name == 'clubList') {
                    var searchText = currPage.query['search_text']
                    if (searchText) {
                        that.$router.push({name: 'clubList-search', query: {'search_text': searchText}})
                    } else {
                        that.$router.push({name: 'clubList-all'})
                    }
                }
                that.initLocationInfo()
            },
            /**
             * 初始化位置信息
             */
            initLocationInfo () {
                var that = this
                var global = that.global
                if (global.currLngx && global.currLaty) {
                    window.initMap = function () {
                        that.getLocation()
                    }
                    if (typeof (window.qq) == 'undefined') {
                        var script = document.createElement('script')
                        script.type = 'text/javascript'
                        script.src = location.protocol + '//map.qq.com/api/js?v=2.exp&key=YD4BZ-3SD3P-VIQDB-LS7BN-FXOOK-Y4BJM&callback=initMap'
                        document.getElementsByTagName('head')[0].appendChild(script)
                    } else {
                        that.getLocation()
                    }
                } else if (global.userAgent.isWX) {
                    // console.log('未能获取位置信息！')
                }
            },
            /**
             * 获取位置
             */
            getLocation () {
                var that = this
                var global = that.global
                var geocoder = new window.qq.maps.Geocoder({
                    complete (result) {
                        that.geocoderCallBack(result.detail.addressComponents)
                    },
                    error () {
                        Util.tipShow('经纬度数据不正确！')
                    }
                })
                geocoder.getAddress(new window.qq.maps.LatLng(parseFloat(global.currLaty), parseFloat(global.currLngx)))
            },
            geocoderCallBack (address) {
                var that = this
                var global = that.global
                that.currCity = address.city || address.province
                that.currRegion = address.district

                // 上报位置
                that.$http.post('../api/v1/position/user', {
                    city: address.city,
                    district: that.currRegion,
                    latitude: global.currLaty,
                    longitude: global.currLngx,
                    mapSystem: 'amap',
                    province: address.province,
                    street: address.street
                })

                // 主动触发事件
                eventHub.$emit('put-curr-city-region', {
                    city: that.currCity,
                    region: that.currRegion
                })
            },
            doGetCurrCityRegion () {
                var that = this
                if (that.currCity != '' || that.currRegion != '') {
                    eventHub.$emit('put-curr-city-region', {city: that.currCity, region: that.currRegion})
                }
            }
        },
        beforeDestroy () {
            eventHub.$off('get-curr-city-region', this.doGetCurrCityRegion)
        }
    }
</script>
