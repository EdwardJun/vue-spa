<style lang="sass">
    @import '../sass/page/oneYuanPastWinRecords.scss';
</style>
<template>
    <div class="page" id="one-yuan-past-win-records-page">
        <div class="list" style="height: 100%;" v-show="dataList.length>0">
            <div class="list-item" v-for="record in dataList">
                <div>第{{ record.currentPeriod }}期 （揭晓时间：{{ record.createdTime }}）</div>
                <div>
                    <div :style="{ 'background-image': 'url('+( record.userAvatarUrl || global.defaultHeader )+ ')' }"></div>
                    <div>
                        <div>获奖者：<span>{{ record.userName }}</span></div>
                        <div>参与次数：<span>{{ record.ticketCount }}</span><span>次</span></div>
                        <div>中将号码：<span>{{ record.actDrawNo }}</span></div>
                    </div>
                </div>
            </div>
            <div class="finish-load-tip" :class="{ none : dataList.length==0 }"><div>已经加载全部数据</div></div>
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
                clubId: '',
                dataList: []
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            var oneYuanBaseId = query.oneYuanBaseId
            document.title = '往期中奖'
            that.clubId = query.clubId || global.clubId
            if (!oneYuanBaseId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            that.$http.get('../api/v2/club/one_yuan/draw/records', {params: {
                clubId: that.clubId,
                oneYuanBaseId: oneYuanBaseId
            }}).then(function (res) {
                res = res.body
                if (res.statusCode == 200) {
                    that.dataList = res.respData
                    global.loading = false
                } else {
                    Util.tipShow(res.msg || global.loadError)
                    return that.$router.back()
                }
            }, function () {
                Util.tipShow(global.loadError)
                return that.$router.back()
            })
        }
    }
</script>
