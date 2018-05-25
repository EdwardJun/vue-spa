<style lang="sass">
    @import '../sass/page/treatRecords.scss';
</style>
<template>
    <div class="page" id="treat-records-page">
        <div class="list" ref="listEle" style="height: 100%;" @scroll="doHandlerListScroll()">
            <router-link class="list-item" v-for="item in dataList" :key="item.id" :to="{ name : 'treatDetail' , query : { detailId : item.id }}">
                <div>
                    <div>{{ item.createDateStr }}</div>
                    <div :class="statusObj[item.status].value">{{ statusObj[item.status].name }}</div>
                </div>
                <div>
                    <div>授权金额<span>{{ item.amount }}</span></div>
                    <div>授权手机<span>{{ item.telStr }}</span></div>
                </div>
            </router-link>
            <div class="data-load-tip" :class="{ none : !showDataLoadTip }"><div>加载数据</div></div>
            <div class="finish-load-tip" :class="{ none : !showFinishLoadTip || dataList.length==0 }"><div>已经加载全部数据</div></div>
            <div class="nullData" v-show="dataList.length==0 && !isAddData">
                <div v-show="!global.loading"></div>
                <div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div>
            </div>
        </div>
    </div>
</template>
<script>
    // import Vue from 'vue'
    import Global from '../libs/global'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                dataList: [],
                currPage: 0,
                pageSize: 10,
                statusObj: {
                    'CANCLED': {name: '已取消', value: 'treat-canceled'},
                    'NOT_USERD': {name: '未使用', value: 'treat-unuse'},
                    'USED': {name: '已使用', value: 'treat-used'}
                },
                clubId: '',
                showDataLoadTip: false, // 显示数据正在加载
                showFinishLoadTip: false, // 显示已经加载完成
                isDataAddEnd: false, // 数据是否已加载完
                isAddData: false, // 数据是否正在加载
                storeDataList: ['dataList', 'currPage', 'showFinishLoadTip', 'isDataAddEnd', 'showFinishLoadTip', 'clubId'],
                currScrollTop: 0
            }
        },
        mounted () {
            var that = this
            var global = that.global
            var pageParams = global.currPage.query
            document.title = '请客记录'
            that.clubId = pageParams.clubId || global.clubId

            // var pageData = global.pageData.treatRecords
            // if (pageData && that.clubId == pageData.clubId) {
            //     for (var key in pageData) { // 从数据缓存中加载数据
            //         that[key] = pageData[key]
            //     }
            //     var changeObj = pageData.changeStatusRecord
            //     if (changeObj) {
            //         var dataList = that.dataList
            //         for (var k = 0; k < dataList.length; k++) {
            //             if (dataList[k]['id'] == changeObj.id) {
            //                 if (changeObj.status == 'CANCLED') {
            //                     dataList[k]['status'] = 'CANCLED'
            //                     Vue.set(dataList, k, dataList[k])
            //                 }
            //                 break
            //             }
            //         }
            //     }
            //     that.$nextTick(function () {
            //         setTimeout(function () {
            //             that.$refs.listEle.scrollTop = pageData.scrollTop
            //             global.loading = false
            //         }, 100)
            //     })
            // }
            if (that.clubId) {
                that.queryRecord()
            } else {
                Util.tipShow(global.visitError)
                that.$router.back()
            }
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

                that.$http.get('../api/v2/financial/account/payforother/list', {
                    params: {
                        page: page,
                        pageSize: that.pageSize,
                        clubId: that.clubId
                    }
                }).then(function (res) {
                    res = res.body
                    if (res) {
                        res = (res.statusCode != '200') ? [] : res['respData']
                        for (var i = 0; i < res.length; i++) {
                            res[i].amount = (res[i].amount / 100).toFixed(2)
                            res[i].telStr = Util.spaceFormat(res[i].telephone, true)
                            res[i].createDateStr = Util.dateFormat(new Date(res[i].createDate.replace(/-/g, '/')), 'yyyy-MM-dd hh:mm')
                            that.dataList.push(res[i])
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
                that.currScrollTop = listEle.scrollTop
                if (!that.isDataAddEnd && listEle.scrollTop + listEle.clientHeight * 1.4 > listEle.scrollHeight) {
                    that.queryRecord()
                }
            }
        },
        beforeDestroy () {
            var that = this
            var pageData = that.global.pageData
            if (!pageData.treatRecords) pageData.treatRecords = {}
            pageData = pageData.treatRecords
            var storeData
            for (var k = 0; k < that.storeDataList.length; k++) {
                storeData = that.storeDataList[k]
                pageData[storeData] = that[storeData]
            }
            pageData.scrollTop = that.currScrollTop
        }
    }
</script>
