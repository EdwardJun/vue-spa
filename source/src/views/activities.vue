<style lang="sass">
    @import '../sass/page/activities.scss';
</style>
<template>
    <div class="page" id="activities-page" :style="{ height : global.winHeight+'px' }">
        <div class="list-wrap" ref="listEle" @scroll="doHandlerListScroll()">
            <ClubActs v-if="club.id && club.name" v-for="(club,index) in dataList" :key="index" :club-data="club" :default-open="isDefaultOpen" :show-club-title="isShowClubTitle"></ClubActs>
            <div class="data-load-tip" :class="{ none : !showDataLoadTip || isSingle }"><div>加载数据</div></div>
            <div class="finish-load-tip" :class="{ none : !showFinishLoadTip || isSingle }"><div>已经加载全部数据</div></div>
            <div class="nullData" v-show="dataList.length==1 && dataList[0].actCount == 0 && !isAddData">
                <div v-show="!global.loading"></div>
                <div>{{ global.loading ? '数据加载中...' : '暂无活动~' }}</div>
                <router-link tag="div" :to="{ name: 'home' }" v-show="!global.loading">随便逛逛</router-link>
            </div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import eventHub from '../libs/hub'
    import ClubActs from '../components/club-acts'

    export default {
        components: {
            ClubActs
        },
        data () {
            return {
                global: Global.data,
                dataList: [],
                isSingle: false,
                isDefaultOpen: false,
                isShowClubTitle: true,
                clubId: '',
                qrcodeType: '',  // 二维码类型
                currPage: 0,
                pageSize: 15,
                showDataLoadTip: false, // 显示数据正在加载
                showFinishLoadTip: false, // 显示已经加载完成
                isDataAddEnd: false, // 数据是否已加载完
                isAddData: false // 数据是否正在加载
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            that.qrcodeType = query.clubsource
            var qrcodeId = query.qrcodeId || ''
            var ss = Util.sessionStorage
            ss('qrcodeType', that.qrcodeType)
            ss('qrcodeId', qrcodeId)

            document.title = Global.setPageTitle('activities') || '热门活动'
            that.clubId = query.clubId || global.clubId || ''
            if (that.clubId == 'all') {
                that.clubId = ''
            }
            if (that.clubId) { // 查询单个会所的
                that.isSingle = true
                that.isDefaultOpen = true // 默认展开
                that.isShowClubTitle = false // 不需要显示标题头

                that.$http.get('../api/v2/club/act/count', {params: {
                    clubId: that.clubId
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.dataList = res.respData
                        that.isDataAddEnd = true
                        global.loading = false
                        if (global.pageMode == 'club') {
                            eventHub.$emit('do-show-service-btn')
                        }
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                        that.$router.back()
                    }
                }, function () {
                    Util.tipShow(global.loadError)
                    that.$router.back()
                })
            } else {
                that.queryClub(1)
            }
        },
        methods: {
            queryClub (page) {
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

                that.$http.get('../api/v2/profile/user/favorite/club/act_count', {
                    params: {
                        page: page,
                        pageSize: that.pageSize,
                        clubId: ''
                    }
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        if (page == 1) {
                            that.dataList = res
                        } else {
                            for (var i = 0; i < res.length; i++) {
                                that.dataList.push(res[i])
                            }
                        }
                        if (res.length < that.pageSize) {
                            that.isDataAddEnd = true
                            that.showFinishLoadTip = true
                        }
                        that.currPage = page
                        that.isAddData = false
                        that.showDataLoadTip = false
                        if (page == 1) {
                            global.loading = false
                            if (global.pageMode == 'club') {
                                eventHub.$emit('do-show-service-btn')
                            }
                        }
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                    }
                }, function () {
                    Util.tipShow(global.loadError)
                })
            },
            doHandlerListScroll () {
                var that = this
                var listEle = that.$refs.listEle
                if (!that.isDataAddEnd && listEle.scrollTop + listEle.clientHeight * 1.4 > listEle.scrollHeight) {
                    that.queryClub()
                }
            }
        }
    }
</script>
