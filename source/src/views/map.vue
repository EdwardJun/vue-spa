<style lang="sass">
    @import '../sass/page/map.scss';
</style>
<template>
    <div class="map-page-wrap">
        <div class="page" id="map-page" v-show="!global.loading"></div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                mapData: null,
                clubId: ''
            }
        },
        created () {
            var that = this
            var global = that.global
            that.clubId = global.currPage.query.clubId || global.clubId
            window.initMap = function () {
                that.initPage()
            }

            if (typeof (window.qq) == 'undefined') {
                var script = document.createElement('script')
                script.type = 'text/javascript'
                script.src = location.protocol + '//map.qq.com/api/js?v=2.exp&key=YD4BZ-3SD3P-VIQDB-LS7BN-FXOOK-Y4BJM&callback=initMap'
                document.getElementsByTagName('head')[0].appendChild(script)
            } else {
                that.initPage()
            }
        },
        methods: {
            initPage () {
                var that = this
                // 获取会所位置坐标
                that.$http.get('../api/v2/club/club_map', {params: {clubId: that.clubId}}).then(function (res) {
                    res = res.body
                    if (res && res.statusCode == '200' && res.respData.lngx) {
                        res = res.respData
                        that.mapData = res
                        that.initMap(res)
                    } else {
                        Util.tipShow('未能获取会所位置！')
                        that.$router.back()
                    }
                }, function () {
                    Util.tipShow('未能获取会所位置！')
                    that.$router.back()
                })
            },
            initMap (res) {
                var that = this
                var global = that.global
                res = this.mapData || res
                var center = new window.qq.maps.LatLng(parseFloat(res.laty), parseFloat(res.lngx))
                var myOptions = {
                    zoom: 15,
                    center: center,
                    mapTypeId: window.qq.maps.MapTypeId.ROADMAP
                }
                var map = new window.qq.maps.Map(that.$el, myOptions) // 创建地图实例

                // 添加终点标记
                var markerElement = document.createElement('div')
                markerElement.className = 'gd_marker'
                markerElement.innerHTML = '终'
                var marker = new window.qq.maps.Marker({
                    map: map,
                    position: center,
                    content: markerElement
                })

                // 添加信息窗口
                var infoWinElement = document.createElement('div')
                infoWinElement.className = 'gd_infoWin'
                infoWinElement.innerHTML = '<h3>' + res.name + '</h3><span>' + res.address + '</span><a>导航</a>'
                var infoWin = new window.qq.maps.InfoWindow({
                    map: map,
                    content: infoWinElement,
                    position: marker,
                    zIndex: 10,
                    visible: true
                })
                infoWin.open()
                infoWinElement.querySelector('a').onclick = function () {
                    location.href = location.protocol + '//apis.map.qq.com/tools/routeplan/eword=' + res.name + '&epointx=' + res.laty + '&epointy=' + res.lngx + '?referer=clubmap&key=OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77'
                }
                global.loading = false
            }
        }
    }
</script>
