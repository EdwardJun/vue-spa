<style lang="sass">
    @import '../sass/page/oneYuanJoinRecords.scss';
</style>
<template>
    <div class="page" id="one-yuan-join-records-page">
        <div class="all-list" ref="listEle" v-show="!noData" style="height: 100%;" @scroll="doHandlerListScroll()">
            <div v-for="record in dataList" class="item">
                <div :style="{ 'background-image' : 'url(' + (record.userAvatarUrl || global.defaultHeader) + ')' }"></div>
                <div>
                    <div>
                        <div>{{ record.userName }}（{{ record.phoneNum.replace(/^(\d{3})\d{4}(\d{4})$/g,'$1****$2') }}）</div>
                        <div><span>{{ record.ticketCount }}</span>人次</div>
                    </div>
                    <div>{{ record.createdTime }}</div>
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
                oneYuanId: '',
                dataList: [],
                currPage: 0,
                clubId: '',
                pageSize: 20,
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

            document.title = '参与记录'
            that.oneYuanId = query.oneYuanId
            that.clubId = query.clubId || global.clubId
            if (!that.oneYuanId || !that.clubId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
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

                that.$http.get('../api/v2/club/one_yuan/paid/records', {params: {
                    clubId: that.clubId,
                    oneYuanId: that.oneYuanId,
                    page: page,
                    pageSize: that.pageSize
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData || []
                        if (page == 1) {
                            that.dataList = res
                        } else {
                            for (var k = 0; k < res.length; k++) {
                                that.dataList.push(res[k])
                            }
                        }
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
                        if (page == 1) {
                            that.$router.back()
                        }
                    }
                }, function () {
                    Util.tipShow(global.loadError)
                    if (page == 1) {
                        that.$router.back()
                    }
                })
            }
        }
    }
</script>
