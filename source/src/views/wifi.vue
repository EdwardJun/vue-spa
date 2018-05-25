<style lang="sass">
    @import '../sass/page/wifi.scss';
</style>
<template>
    <div class="page" id="wifi-page">
        <div class="list" style="height: 100%;">
            <div class="list-item" v-for="item in dataList">
                <div>WiFi：{{ item.ssid }}</div>
                <div>密码：{{ item.password }}</div>
            </div>
        </div>
        <div class="nullData" v-show="dataList.length==0">
            <div v-show="!global.loading"></div>
            <div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                dataList: []
            }
        },
        created () {
            let that = this
            let global = that.global
            let clubId = global.clubId || global.currPage.query.clubId
            if (!clubId) {
                return Util.tipShow(global.visitError)
            }
            document.title = '会所WiFi'
            that.$http.get('../api/v2/user/wifi', {params: {clubId: clubId}}).then(function (res) {
                res = res.body
                if (res.statusCode == 200) {
                    that.dataList = res.respData || []
                    global.loading = false
                } else {
                    Util.tipShow(res.msg || global.loadError)
                    that.$router.back()
                }
            })
        }
    }
</script>
