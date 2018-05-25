<style lang="sass">
    @import '../sass/page/limit.scss';
</style>
<template>
    <div class="page" id="limit-page">
        <!--Tab栏-->
        <div class="tab-list">
            <div v-for="(item, index) in tabArr" :key="index" :class="{ active: currTab == index }" @click="doSwitchTab(index)">{{ item }}</div>
        </div>
        <!--未使用-->
        <div v-for="(dataObj, dataIndex) in dataArr" :key="dataIndex" v-show="currTab==dataIndex" class="limit list" :ref="'listEle'+dataIndex" :style="{ height : (global.winHeight-2.3*global.winScale*16)+'px' }" @scroll="doHandlerListScroll()">
            <div class="list-item" v-for="(clubItem, clubIndex) in dataObj.dataList" :key="clubIndex">
                <router-link tag="div" :to="{ path: '/'+clubItem.clubId+'/home' }" class="item-title">{{ clubItem.clubName }}<span></span></router-link>
                <div class="item-limit">
                    <template v-for="(typeObj, tindex) in clubItem.listObj">
                        <limit-item v-for="(item,itemIndex) in typeObj.list" :key="itemIndex" :limit-data="item"></limit-item>
                    </template>
                </div>
            </div>
            <div class="data-load-tip" :class="{ none : !dataObj.showDataLoadTip }"><div>加载数据</div></div>
            <div class="finish-load-tip" :class="{ none : !dataObj.showFinishLoadTip }"><div>已经加载全部数据</div></div>
            <div class="load-more" v-show='!dataObj.showDataLoadTip && !dataObj.showFinishLoadTip && !dataObj.isAddData && dataObj.dataList.length>0' @click="queryRecord()">加载更多</div>
            <div class="nullData" v-show="dataObj.dataList.length==0 && !dataObj.isAddData" :class="dataObj.dataList.length">
                <div v-show="!global.loading"></div>
                <div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div>
            </div>
        </div>
    </div>
</template>
<script>
    import Vue from 'vue'
    import Global from '../libs/global'
    import Util from '../libs/util'
    import limitItem from '../components/item-limit'
    export default {
        components: {
            'limit-item': limitItem
        },
        data () {
            return {
                global: Global.data,
                tabArr: ['未使用', '已使用', '不可用'],
                currTab: 0, // 当前tab页面
                isQueryAll: true,
                pageSize: 10,
                dataArr: []
            }
        },
        mounted () {
            var that = this
            var global = that.global
            let query = global.currPage.query
            let ss = Util.sessionStorage
            let ssc = Util.removeSessionStorage
            let dataArr = []

            that.isQueryAll = global.pageMode != 'club' || query.all == 'true'
            that.currTab = query.tab || 0

            // 构造dataArr数组:未使用、已使用、已过期
            for (let i = 0; i < 3; i++) {
                dataArr.push({
                    dataList: [],
                    dataIndex: {},
                    currPage: 0,
                    showDataLoadTip: false, // 显示数据正在加载
                    showFinishLoadTip: false, // 显示已经加载完成
                    isDataAddEnd: false, // 数据是否已加载完
                    isAddData: false, // 数据是否正在加载
                    hasLoadData: false // 使用加载过数据
                })
            }
            that.dataArr = dataArr

            let cacheData = ss('limit_data')
            let cacheTab = ss('limit_tab')

            if (cacheTab == that.currTab && cacheData) {
                let dataObj = that.dataArr[cacheTab]
                dataObj.dataList = JSON.parse(cacheData)
                dataObj.currPage = ss('limit_page') - 0
                dataObj.dataIndex = JSON.parse(ss('limit_set'))
                dataObj.isDataAddEnd = ss('limit_end') == 'true'
                dataObj.showFinishLoadTip = ss('limit_finish') == 'true'
                dataObj.hasLoadData = true

                // 滚动条定位
                let top = ss('limit_top')
                that.$nextTick(function () {
                    let listEle = that.$refs['listEle' + cacheTab][0]
                    setTimeout(function () {
                        listEle.scrollTop = top
                        global.loading = false
                    }, 100)
                })
            } else {
                that.queryRecord()
                global.loading = false
            }

            // 清除缓存
            if (cacheData) {
                ssc('limit_data')
                ssc('limit_tab')
                ssc('limit_page')
                ssc('limit_set')
                ssc('limit_end')
                ssc('limit_finish')
                ssc('limit_top')
            }
            document.title = '限时抢购'
        },
        methods: {
            /**
             * 查询限时抢购列表
             * @param index
             */
            queryRecord (tab, page) {
                let that = this
                let global = that.global
                tab = (tab != undefined ? tab : that.currTab) - 0
                let dataObj = that.dataArr[tab]
                if (dataObj.isAddData) {
                    return
                }
                dataObj.isAddData = true
                page = page || dataObj.currPage + 1

                // 更新数据加载提示
                dataObj.showDataLoadTip = true
                dataObj.showFinishLoadTip = false
                dataObj.isDataAddEnd = false

                that.$http.get('../api/v2/club/user_get_coupons', {
                    params: {
                        page: page,
                        pageSize: that.pageSize,
                        businessType: 'paid_service_item',
                        clubId: (that.isQueryAll ? '' : global.clubId),
                        couponStatus: tab + 1
                    }
                }).then(function (res) {
                    res = res.body
                    if (res) {
                        res = (res.statusCode != '200') ? [] : res['respData']
                        if (!dataObj.hasLoadData) {
                            dataObj.hasLoadData = true
                        }
                        that.doHandlerData(res, dataObj)
                        if (res.length < that.pageSize) {
                            dataObj.isDataAddEnd = true
                            if (!(page == 1 && res.length == 0)) {
                                dataObj.showFinishLoadTip = true
                            }
                        }
                        dataObj.currPage = page
                        dataObj.isAddData = false
                        dataObj.showDataLoadTip = false
                        Vue.set(that.dataArr, tab, dataObj)
                        // console.log('dataArr', JSON.stringify(that.dataArr))
                    } else {
                        Util.tipShow(global.loadError)
                    }
                }, function () {
                    Util.tipShow(global.loadError)
                })
            },
            doHandlerData (data, dataObj) {
                let item
                let currCouponType
                let currCouponTypeName
                let dataIndex
                let listObj
                for (let k = 0; k < data.length; k++) {
                    item = data[k]
                    currCouponType = item.useType
                    currCouponTypeName = item.useTypeName
                    dataIndex = dataObj.dataIndex[item['clubId']]
                    if (dataIndex == undefined) {
                        dataIndex = dataObj.dataList.length
                        dataObj.dataIndex[item['clubId']] = dataIndex
                        dataObj.dataList.push({clubName: item.clubName, clubId: item.clubId, listObj: {}, isClosed: false})
                    }
                    listObj = dataObj.dataList[dataIndex].listObj
                    if (!listObj[currCouponType]) {
                        listObj[currCouponType] = {
                            couponTypeName: currCouponTypeName,
                            list: []
                        }
                    }
                    listObj[currCouponType].list.push(item)
                }
            },
            doHandlerListScroll () {
                let that = this
                let dataObj = that.dataArr[that.currTab]
                if (!dataObj.isDataAddEnd) {
                    that.queryRecord()
                }
            },
            doSwitchTab (index) {
                var that = this
                if (that.currTab != index) {
                    let dataObj = that.dataArr[index]
                    if (!dataObj.hasLoadData) {
                        that.queryRecord(index, 1)
                    }
                    that.currTab = index
                    that.$router.replace({name: 'limit', query: {tab: index, all: that.isQueryAll}})
                }
            }
        }
    }
</script>
