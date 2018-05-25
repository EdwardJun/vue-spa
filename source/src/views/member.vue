<style lang="sass">
    @import '../sass/page/member.scss';
</style>
<template>
    <div class="page" id="member-page" v-show="!global.loading">
        <div class="item" v-for="item in dataList">
            <div :style="{ backgroundImage : 'url('+item.logoUrl+')' }"></div>
            <div>{{ item.memberName }}</div>
            <div v-html="item.memberContent"></div>
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
            var that = this
            var global = that.global
            that.$http.get('../api/v2/club/{clubId}/memberinfo', {params: {clubId: global.clubId}}).then(function (res) {
                res = res.body
                if (res.length) {
                    that.dataList = res
                    global.loading = false
                } else {
                    Util.tipShow(res.msg || global.loadError)
                    return that.$router.back()
                }
            }, function () {
                Util.tipShow(global.loadError)
                that.$router.back()
            })
        }
    }
</script>
