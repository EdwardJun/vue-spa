<style lang="sass">
    @import '../sass/page/inviteFriends.scss';
</style>
<template>
    <div class="page" id="invite-friends-page">
        <div class="all-list" ref="listEle" v-show="!noData" style="height: 100%;" @scroll="doHandlerListScroll()">
            <div v-for="item in dataList" class="list-item" :key="item.$index">
                <div :style="{ backgroundImage : 'url('+(item.userAvatarUrl || global.defaultHeader )+')' }"></div>
                <div>
                    <div>{{ item.userName }}</div>
                    <div>{{ item.registerTime }}</div>
                </div>
            </div>
            <div class="data-load-tip" :class="{ none : !showDataLoadTip }"><div>加载数据</div></div>
            <div class="finish-load-tip" :class="{ none : !showFinishLoadTip }"><div>已经加载全部数据</div></div>
        </div>
        <div class="nullData" v-show="noData">
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
                pageSize: 10,
                currPage: 0,
                dataList: [],
                listEle: null,
                showDataLoadTip: false, // 显示数据正在加载
                showFinishLoadTip: false, // 显示已经加载完成
                isDataAddEnd: false, // 数据是否已加载完
                isAddData: false, // 数据是否正在加载
                noData: true
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query

            document.title = '我邀请的好友'
            that.clubId = query.clubId || global.clubId || ''
            that.queryData(1)
        },
        methods: {
            doHandlerListScroll () {
                var that = this
                var listEle = that.$refs.listEle
                if (!that.isDataAddEnd && listEle.scrollTop + listEle.clientHeight * 1.4 > listEle.scrollHeight) {
                    that.queryData()
                }
            },
            queryData (page) {
                var that = this
                var global = that.global
                if (that.isAddData) {
                    return
                }
                that.isAddData = true
                page = page || that.currPage + 1

                // 更新数据加载提示
                that.showDataLoadTip = true
                that.showFinishLoadTip = false
                that.isDataAddEnd = false

                that.$http.get('../api/v2/club/user/invite/customer/list', {params: {
                    clubId: that.clubId,
                    page: page,
                    pageSize: that.pageSize
                }}).then((res) => {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData || []
                        res.forEach((item) => {
                            if (item.registerTime) {
                                item.registerTime = Util.dateFormat(new Date(item.registerTime), 'yyyy.MM.dd hh:mm:ss')
                            }
                        })
                        that.dataList.push(...res)
                        if (res.length < that.pageSize) {
                            that.isDataAddEnd = true
                            that.showFinishLoadTip = true
                        }
                        that.currPage = page
                        that.isAddData = false
                        that.showDataLoadTip = false

                        if (res.length > 0) {
                            that.noData = false
                        }
                        if (page == 1) {
                            global.loading = false
                        }
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                    }
                }, () => {
                    Util.tipShow(global.loadError)
                })
            }
        }
    }
</script>
