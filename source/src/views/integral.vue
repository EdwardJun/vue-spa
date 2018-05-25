<style lang="sass">
    @import '../sass/page/integral.scss';
</style>
<template>
    <div class="page" id="integral-all-page">
        <div class="list" ref="listEle" style="height: 100%;" @scroll="doHandlerListScroll()">
            <router-link class="list-item" v-for="item in dataList" :key="item.clubId" :to="{ name : 'integralDetail', query : { clubId : item.clubId } }">
                <div><div :style="{ backgroundImage : 'url('+(item.clubImage || global.defaultClubLogo)+')' }"></div>{{ item.clubName || '小摩豆会所' }}<i></i></div>
                <div><span>剩余积分</span>{{ item.amount }}</div>
            </router-link>
            <div class="data-load-tip" :class="{ none : !showDataLoadTip }"><div>加载数据</div></div>
            <div class="finish-load-tip" :class="{ none : !showFinishLoadTip }"><div>已经加载全部数据</div></div>
            <div class="nullData" v-show="dataList.length==0 && !isAddData">
                <div v-show="!global.loading"></div>
                <div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div>
            </div>
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
                dataList: [],
                currPage: 0,
                pageSize: 10,
                showDataLoadTip: false, // 显示数据正在加载
                showFinishLoadTip: false, // 显示已经加载完成
                isDataAddEnd: false, // 数据是否已加载完
                isAddData: false // 数据是否正在加载
            }
        },
        created () {
            document.title = '所有账户'
            this.queryRecord()
        },
        methods: {
            queryRecord (page) {
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

                that.$http.get('../api/v2/credit/user/account', {
                    params: {
                        page: page,
                        pageSize: that.pageSize,
                        clubId: '',
                        userType: 'user'
                    }
                }).then(function (res) {
                    res = res.body
                    if (res) {
                        res = (res.statusCode != '200') ? [] : res['respData']
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
                        if (global.loading) {
                            global.loading = false
                        }
                    } else {
                        Util.tipShow(global.loadError)
                    }
                }, function () {
                    Util.tipShow(global.loadError)
                })
            },
            doHandlerListScroll () {
                var that = this
                var listEle = that.$refs.listEle
                if (!that.isDataAddEnd && listEle.scrollTop + listEle.clientHeight * 1.4 > listEle.scrollHeight) {
                    that.queryRecord()
                }
            }
        }
    }
</script>
