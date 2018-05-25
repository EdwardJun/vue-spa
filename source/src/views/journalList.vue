<style lang="sass">
    @import '../sass/page/journalList.scss';
</style>
<template>
    <div class="page" id="journal-list-page" :style="{ height : global.winHeight+'px' }">
        <div class="list" style="height: 100%">
            <div class="list-item" v-for="item in dataList" @click="doView(item)">
                <div class='logo' :style="{ backgroundImage : 'url(static/images/journal/'+item.templateId+'.png)' }">NO.{{ item.sequenceNo }}</div>
                <div class='title'>
                    <div>{{ item.title }}</div>
                    <div>发布时间：{{ item.modifyDate }}</div>
                </div>
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
            document.title = '电子期刊'
            that.$http.get('../api/v2/user/journal/list', {params: {clubId: clubId}}).then(function (res) {
                res = res.body
                if (res.statusCode == 200) {
                    that.dataList = res.respData || []
                    global.loading = false
                } else {
                    Util.tipShow(res.msg || global.loadError)
                    that.$router.back()
                }
            })
        },
        methods: {
            doView (journal) {
                let that = this
                location.href = that.global.prefixPathname.replace('/spa/', '/journal/') + '#/' + journal.templateId + '/?id=' + journal.journalId
            }
        }
    }
</script>
