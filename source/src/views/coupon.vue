<style lang="sass">
    @import '../sass/page/coupon.scss';
</style>
<template>
    <div class="page" id="coupon-page">
        <div class="tab-list">
            <div :class="{ active: currTab == index }" v-for="(item, index) in tabList" :key="index" @click="doSwitchTab(index)">{{item}}</div>
        </div>
        <!--3个列表-->
        <div v-for="(dataObj,dataIndex) in dataArr" :key="dataIndex" v-show="currTab==dataIndex" class="list item-content" :ref="'listEle'+dataIndex" :style="{ height : (global.winHeight-2.08*global.winScale*16)+'px' }" @scroll="doHandlerListScroll()">
            <div class="list-item" v-for="(singleClubData, singleIndex) in dataObj.dataList" :key="singleIndex">
                <div class='header' v-if="isQueryAll" :class="{ first: singleIndex == 0 }">{{ singleClubData.clubName }}<div :class="{ closed: singleClubData.isClosed }" @click="doSwitchClose(singleClubData, singleIndex, 0)">{{ singleClubData.isClosed ? '展开' : '收起' }}</div></div>
                <div v-show="!singleClubData.isClosed" class="item-coupon">
                    <template v-for="typeObj in singleClubData.listObj">
                        <coupon-item v-for="(item, itemIndex) in typeObj.list" :key="item.id" :class="item.couponStatus==1 ? 'item-data'+item.couponStatus : 'item-data'" :coupon-data="item"></coupon-item>
                    </template>
                </div>
            </div>
            <div class="data-load-tip" :class="{ none : !dataObj.showDataLoadTip }"><div>加载数据</div></div>
            <div class="finish-load-tip border-top" :class="{ none : !dataObj.showFinishLoadTip }"><div>已经加载全部数据</div></div>
            <div class="load-more" v-show='!dataObj.showDataLoadTip && !dataObj.showFinishLoadTip && !dataObj.isAddData && dataObj.dataList.length>0' @click="queryRecord()">加载更多</div>
            <div class="nullData" v-show="dataObj.dataList.length==0 && !dataObj.isAddData">
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
    import CouponItem from '../components/coupon'
    import eventHub from '../libs/hub'

    export default {
        components: {
            'coupon-item': CouponItem
        },
        data () {
            return {
                global: Global.data,
                pageSize: 10,
                isQueryAll: true, // 是否查询所有会所的
                currTab: 0, // 当前的tab页索引
                tabList: ['未使用', '已使用', '已过期'],
                dataArr: []
            }
        },
        mounted () {
            let that = this
            let global = that.global
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

            if (cacheTab == that.currTab && cacheData) { // 从缓存加载数据
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
            document.title = '优惠券'

            // 事件监听
            eventHub.$on('jump-view-coupon', that.cacheSave)
        },
        methods: {
            /**
             * 查询优惠券记录
             * @param  {int} tab  tab索引值
             * @param  {int} page 需要查询的数据页索引
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
                        clubId: (that.isQueryAll ? '' : global.clubId),
                        loginName: global.loginName,
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
                    } else {
                        Util.tipShow(global.loadError)
                    }
                }, function () {
                    Util.tipShow(global.loadError)
                })
            },
            /**
             * 处理滚动
             */
            doHandlerListScroll () {
                let that = this
                let dataObj = that.dataArr[that.currTab]
                let listEle = that.$refs['listEle' + that.currTab][0]
                if (!dataObj.isDataAddEnd && listEle.scrollTop + listEle.clientHeight * 1.4 > listEle.scrollHeight) {
                    that.queryRecord()
                }
            },
            /**
             * 处理请求获取的数据
             * @param  {Object} data 请求获取的数据
             * @param  {Object} dataObj tab数据对象
             * @return
             */
            doHandlerData (data, dataObj) {
                let item
                let dataIndex
                let listObj
                let currCouponType
                let currCouponTypeName
                for (let k = 0; k < data.length; k++) {
                    item = data[k]
                    item.isExpire = (item['couponStatusDescription'] == '已过期' || item['couponStatusDescription'] == '已使用')
                    if (item.useType == 'money' && item.consumeMoney == 0) {
                        item.consumeMoneyDescription = '&nbsp;'
                    }
                    if (item.useType == 'new_user_gift') {
                        item.useTypeName = '新人礼包'
                    }
                    if ((/^(paid_service_item|discount_item)$/.test(item.useType))) {
                        currCouponType = 'service_item'
                        currCouponTypeName = '项目抵用券'
                    } else {
                        currCouponType = item.useType
                        currCouponTypeName = item.useTypeName
                    }
                    if (item.couponType == 'paid_service_item' || currCouponType == 'service_item') {
                        item.actTitle += '券'
                        item.couponPeriod = item.couponPeriod.replace(/(\d{2}:\d{2})(:\d{2})/g, '$1')
                    }

                    item.couponStatusClass = (item['couponStatus'] == 0 ? 'unpay' : (item['couponStatus'] == 1 ? 'payed' : 'expire'))
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
            /**
             * 切换Tab
             * @param  {int} index 点击tab的索引
             * @return
             */
            doSwitchTab (index) {
                let that = this
                if (that.currTab != index) {
                    let dataObj = that.dataArr[index]
                    if (!dataObj.hasLoadData) {
                        that.queryRecord(index, 1)
                    }
                    that.currTab = index
                    that.$router.replace({name: 'coupon', query: {tab: index, all: that.isQueryAll}})
                }
            },
            /**
             * 跳转之前缓存数据
             */
            cacheSave () {
                let that = this
                let ss = Util.sessionStorage
                let dataObj = that.dataArr[that.currTab]
                let listEle = that.$refs['listEle' + that.currTab][0]
                ss('coupon_data', JSON.stringify(dataObj.dataList))
                ss('coupon_tab', that.currTab)
                ss('coupon_page', dataObj.currPage)
                ss('coupon_set', JSON.stringify(dataObj.dataIndex))
                ss('coupon_end', dataObj.isDataAddEnd)
                ss('coupon_finish', dataObj.showFinishLoadTip)
                ss('coupon_top', listEle.scrollTop)
            },
            /**
             * 展开、收起
             * @return {[type]} [description]
             */
            doSwitchClose (clubDataObj, dataIndex, tabIndex) {
                let that = this
                let dataObj = that.dataArr[tabIndex]
                clubDataObj.isClosed = !clubDataObj.isClosed
                Vue.set(dataObj.dataList, dataIndex, clubDataObj)
            }
        },
        /**
         * 解除事件绑定
         */
        beforeDestroy () {
            var that = this
            eventHub.$off('jump-view-coupon', that.cacheSave)
        }
    }
</script>
