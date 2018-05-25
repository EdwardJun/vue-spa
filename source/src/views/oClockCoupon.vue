<style lang="sass">
    @import '../sass/page/oClockCoupon.scss';
</style>
<template>
    <div class="page" id="oclick-coupon-page">
        <!--Tab栏-->
        <div class="tab-list">
            <div v-for="(item, index) in tabArr" :key="index" :class="{ active: currTab == index }" @click="doSwitchTab(index)" >{{ item }}</div>
        </div>

        <div v-for="(dataObj, dataIndex) in dataArr" :key="dataIndex" class="item-content oClock list" v-show="currTab==dataIndex" :style="{ height : (global.winHeight-2.3*global.winScale*16)+'px' }" @scroll="doHandlerListScroll()">
            <div v-for="(clubItem, clubIndex) in dataObj.dataList" :key="clubIndex">
                <div class="item-coupon">
                    <template class="item-type" v-for="typeObj in clubItem.listObj">
                        <coupon-item :coupon-data="item" :class="item.couponStatus==1 ? 'item-data'+item.couponStatus : 'item-data'" v-for="(item,index) in typeObj.list" :key="index"></coupon-item>
                    </template>
                </div>
            </div>

            <div class="data-load-tip" :class="{ none : !dataObj.showDataLoadTip }"><div>加载数据</div></div>
            <div class="finish-load-tip border-top" :class="{ none : !dataObj.showFinishLoadTip }"><div>已经加载全部数据</div></div>
            <div class="load-more" v-show='!dataObj.showDataLoadTip && !dataObj.showFinishLoadTip && !dataObj.isAddData && dataObj.dataList.length>0' @click="queryRecord()">加载更多</div>
            <!--没数据时显示-->
            <div v-show="dataObj.dataList.length==0 && !dataObj.isAddData" class="nullData" :class="dataObj.dataList.length">
                <div></div>
                <div></div>
                <!-- tag="div" :to="{ name: 'clubList' }"-->
                <div @click="doClickhome()">随便逛逛</div>
            </div>
        </div>
    </div>
</template>

<script>
    import Vue from 'vue'
    import Global from '../libs/global'
    import Util from '../libs/util'
    import oClockCouponItem from '../components/oclock-coupon'
    import eventHub from '../libs/hub'
    export default {
        components: {
            'coupon-item': oClockCouponItem
        },
        data () {
            return {
                global: Global.data,
                pageSize: 10,
                isQueryAll: true,
                tabArr: ['未使用', '已使用', '不可用'],
                currTab: 0, // 当前的tab页
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

            let cacheData = ss('coupon_data')
            let cacheTab = ss('coupon_tab')

            if (cacheTab == that.currTab && cacheData) {
                let dataObj = that.dataArr[cacheTab]
                dataObj.dataList = JSON.parse(cacheData)
                dataObj.currPage = ss('coupon_page') - 0
                dataObj.dataIndex = JSON.parse(ss('coupon_set'))
                dataObj.isDataAddEnd = ss('coupon_end') == 'true'
                dataObj.showFinishLoadTip = ss('coupon_finish') == 'true'
                dataObj.hasLoadData = true

                // 滚动条定位
                let top = ss('coupon_top')
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
                ssc('coupon_data')
                ssc('coupon_tab')
                ssc('coupon_page')
                ssc('coupon_set')
                ssc('coupon_end')
                ssc('coupon_finish')
                ssc('coupon_top')
            }

            document.title = '点钟券'
            // 事件监听
            eventHub.$on('jump-view-oClockCoupon', that.cacheSave)
        },
        methods: {
            /**
             * 查询点钟券记录
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
                        businessType: 'paid_coupon',
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
                        // this.dataArr = res
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
                    } else {
                        Util.tipShow(global.loadError)
                    }
                }, function () {
                    Util.tipShow(global.loadError)
                })
            },
            doHandlerData (data, dataObj) {
                let item
                let dataIndex
                let listObj
                let currCouponType
                let currCouponTypeName
                for (let k = 0; k < data.length; k++) {
                    item = data[k]
                    currCouponType = item.useType
                    currCouponTypeName = item.useTypeName
                    dataIndex = dataObj.dataIndex[item['clubId']]
                    if (dataIndex == undefined) {
                        dataIndex = dataObj.dataList.length
                        dataObj.dataIndex[item['clubId']] = dataIndex
                        dataObj.dataList.push({clubName: item.clubName, listObj: {}, isClosed: false})
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
            /**
             * 切换tab
             */
            doSwitchTab (index) {
                var that = this
                if (that.currTab != index) {
                    let dataObj = that.dataArr[index]
                    if (!dataObj.hasLoadData) {
                        that.queryRecord(index, 1)
                    }
                    that.currTab = index
                    that.$router.replace({name: 'oClockCoupon', query: {tab: index, all: that.isQueryAll}})
                }
            },
            doClickhome () {
                var that = this
                var global = that.global
                if (global.pageMode == 'club') {
                    that.$router.push({name: 'home'})
                } else {
                    that.$router.push({name: 'clubList'})
                }
            }
        },
        /**
         * 解除事件绑定
         */
        beforeDestroy () {
            var that = this
            eventHub.$off('jump-view-oClockCoupon', that.cacheSave)
        }
    }
</script>
