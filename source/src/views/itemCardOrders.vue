<style lang="sass">
    @import '../sass/page/itemCardOrders.scss';
</style>
<template>
    <div class="page" id="item-card-orders-page" :class="{'padding': global.pageMode=='club'}">
        <!--Tab栏-->
        <ul class="tab">
            <li v-for="(item, index) in tabArr" :key="index" :class="{ active: currIndex == index }" @click="doSwitchTab(index)">{{ item }}</li>
        </ul>
        <!--单项次卡-->
        <div class="zone" :class="{ active: currIndex == 0 }">
            <div class="all-list" ref="itemCardListEle" v-show="!itemCard.noData" :style="{ height : listHeight+'px' }" @scroll="doHandlerListScroll(0)">
                <div v-for="(item, itemIndex) in itemCard.dataList" :key="itemIndex">
                    <router-link class="item-title" tag="div" :to="{ path: '/'+item.clubId+'/home' }"><div :style="{ 'background-image': 'url('+item.clubLogo+')'}"></div>{{ item.clubName }}</router-link>
                    <ul class="item-list"><item-card-order v-for="(record, recordIndex) in item.list" :key="recordIndex" :order-data="record"></item-card-order></ul>
                </div>
                <div class="data-load-tip border-top" :class="{ none : !itemCard.showDataLoadTip }"><div>加载数据</div></div>
                <div class="finish-load-tip border-top" :class="{ none : !itemCard.showFinishLoadTip }"><div>已经加载全部数据</div></div>
            </div>
            <div class="nullData" v-show="itemCard.noData"><div v-show="!global.loading"></div><div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div></div>
        </div>

        <!--套餐次卡-->
        <div class="zone" :class="{ active: currIndex == 1 }">
            <div class="all-list" ref="packageCardListEle" v-show="!packageCard.noData" :style="{ height : listHeight+'px' }" @scroll="doHandlerListScroll(1)">
                <div v-for="(item, itemIndex) in packageCard.dataList" :key="itemIndex">
                    <router-link class="item-title" tag="div" :to="{ path: '/'+item.clubId+'/home' }"><div :style="{ 'background-image': 'url('+item.clubLogo+')'}"></div>{{ item.clubName }}</router-link>
                    <ul class="item-list"><item-card-order v-for="(record, recordIndex) in item.list" :key="recordIndex" :order-data="record"></item-card-order></ul>
                </div>
                <div class="data-load-tip border-top" :class="{ none : !packageCard.showDataLoadTip }"><div>加载数据</div></div>
                <div class="finish-load-tip border-top" :class="{ none : !packageCard.showFinishLoadTip }"><div>已经加载全部数据</div></div>
            </div>
            <div class="nullData" v-show="packageCard.noData"><div v-show="!global.loading"></div><div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div></div>
        </div>

        <!--积分礼品-->
        <div class="zone" :class="{ active: currIndex == 2 }">
            <div class="all-list" ref="creditCardListEle" v-show="!creditCard.noData" :style="{ height : listHeight+'px' }" @scroll="doHandlerListScroll(2)">
                <div v-for="(item,itemIndex) in creditCard.dataList" :key="itemIndex">
                    <router-link class="item-title" tag="div" :to="{ path: '/'+item.clubId+'/home' }"><div :style="{ 'background-image': 'url('+item.clubLogo+')'}"></div>{{ item.clubName }}</router-link>
                    <ul class="item-list"><item-card-order v-for="(record,recordIndex) in item.list" :key="recordIndex" :order-data="record"></item-card-order></ul>
                </div>
                <div class="data-load-tip border-top" :class="{ none : !creditCard.showDataLoadTip }"><div>加载数据</div></div>
                <div class="finish-load-tip border-top" :class="{ none : !creditCard.showFinishLoadTip }"><div>已经加载全部数据</div></div>
            </div>
            <div class="nullData" v-show="creditCard.noData"><div v-show="!global.loading"></div><div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div></div>
        </div>

        <router-link class="submit-button footer" :to="{ name: 'discountMall' }" tag="div" v-if="global.pageMode=='club'">逛商城、找优惠</router-link>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import itemCardOrder from '../components/item-card-order'
    import eventHub from '../libs/hub'

    export default {
        components: {
            'item-card-order': itemCardOrder
        },
        data () {
            return {
                global: Global.data,
                clubId: '',
                pageSize: 20,

                tabArr: ['单项次卡', '超值套餐', '积分礼品'],
                currIndex: 0, // 当前的tab页
                indexObj: ['itemCard', 'packageCard', 'creditCard'],

                // 单项次卡列表控制变量
                itemCard: {
                    dataList: [],
                    currPage: 0,
                    clubDataSet: {},
                    showDataLoadTip: false, // 显示数据正在加载
                    showFinishLoadTip: false, // 显示已经加载完成
                    isDataAddEnd: false, // 数据是否已加载完
                    isAddData: false, // 数据是否正在加载
                    noData: true,
                    cardType: 'item_card',
                    hasLoadData: false // 是否已加载数据
                },

                // 次卡套餐列表控制变量
                packageCard: {
                    dataList: [],
                    currPage: 0,
                    clubDataSet: {},
                    showDataLoadTip: false, // 显示数据正在加载
                    showFinishLoadTip: false, // 显示已经加载完成
                    isDataAddEnd: false, // 数据是否已加载完
                    isAddData: false, // 数据是否正在加载
                    noData: true,
                    cardType: 'item_package',
                    hasLoadData: false
                },

                // 积分礼品列表控制变量
                creditCard: {
                    dataList: [],
                    currPage: 0,
                    clubDataSet: {},
                    showDataLoadTip: false, // 显示数据正在加载
                    showFinishLoadTip: false, // 显示已经加载完成
                    isDataAddEnd: false, // 数据是否已加载完
                    isAddData: false, // 数据是否正在加载
                    noData: true,
                    cardType: 'credit_gift',
                    hasLoadData: false
                },

                listHeight: 0
            }
        },
        mounted () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            var ss = Util.sessionStorage
            var ssc = Util.removeSessionStorage
            that.clubId = query.clubId || global.clubId || ''
            that.currIndex = query.tab || 0
            that.listHeight = global.winHeight - (global.pageMode == 'club' ? 9.4421 : 6) * global.winScale * 16

            var cacheData = ss('item_card_order_data')
            var cacheTab = ss('item_card_order_tab')
            var currType = that.indexObj[that.currIndex]
            if (cacheTab && cacheData && cacheTab == that.currIndex) { // 从缓存加载数据
                var dataObj = that[currType]
                dataObj.dataList = JSON.parse(cacheData)
                dataObj.page = ss('item_card_order_page') - 0
                dataObj.clubDataSet = JSON.parse(ss('item_card_order_set'))
                dataObj.isDataAddEnd = ss('item_card_order_end') == 'true'
                dataObj.showFinishLoadTip = ss('item_card_order_finish') == 'true'
                dataObj.hasLoadData = true
                dataObj.noData = false

                // 滚动条定位
                var top = ss('item_card_order_top')
                that.$nextTick(function () {
                    var listEle = that.$refs[currType + 'ListEle']
                    setTimeout(function () {
                        listEle.scrollTop = top
                        global.loading = false
                    }, 300)
                })
            } else {
                that.queryData(1)
            }

            // 清除缓存
            if (cacheData) {
                ssc('item_card_order_data')
                ssc('item_card_order_tab')
                ssc('item_card_order_page')
                ssc('item_card_order_set')
                ssc('item_card_order_end')
                ssc('item_card_order_finish')
                ssc('item_card_order_top')
            }

            document.title = Global.setPageTitle('discountMall') || '特惠商城'

            // 事件监听
            eventHub.$on('jump-view-item-card-order', that.cacheSave)
        },
        methods: {
            /**
             * 切换tab
             */
            doSwitchTab (tabIndex) {
                var that = this
                if (that.currIndex != tabIndex) {
                    that.currIndex = tabIndex
                    var dataObj = that[that.indexObj[tabIndex]]
                    if (!dataObj.hasLoadData) {
                        that.queryData(1, tabIndex)
                    }
                    that.$router.replace({name: 'itemCardOrders', query: {tab: tabIndex}})
                }
            },
            /**
             * 滚动加载数据
             */
            doHandlerListScroll (tabIndex) {
                var that = this
                var dataType = that.indexObj[tabIndex]
                var dataObj = that[dataType]
                var listEle = that.$refs[dataType + 'ListEle']
                if (!dataObj.isDataAddEnd && listEle.scrollTop + listEle.clientHeight * 1.4 > listEle.scrollHeight) {
                    that.queryData()
                }
            },
            /**
             * 跳转之前缓存数据
             */
            cacheSave () {
                var that = this
                var ss = Util.sessionStorage
                var type = that.indexObj[that.currIndex]
                var dataObj = that[type]
                var listEle = that.$refs[type + 'ListEle']
                ss('item_card_order_data', JSON.stringify(dataObj.dataList))
                ss('item_card_order_tab', that.currIndex)
                ss('item_card_order_page', dataObj.page)
                ss('item_card_order_set', JSON.stringify(dataObj.clubDataSet))
                ss('item_card_order_end', dataObj.isDataAddEnd)
                ss('item_card_order_finish', dataObj.showFinishLoadTip)
                ss('item_card_order_top', listEle.scrollTop)
            },
            /**
             * 查询数据
             * @param page
             */
            queryData (page, tabIndex) {
                var that = this
                var global = that.global
                var dataObj

                tabIndex = tabIndex || that.currIndex
                dataObj = that[that.indexObj[tabIndex]]

                if (dataObj.isAddData) {
                    return
                }
                dataObj.isAddData = true
                page = page || dataObj.currPage + 1

                // 更新数据加载提示
                dataObj.showDataLoadTip = true
                dataObj.showFinishLoadTip = false
                dataObj.isDataAddEnd = false

                that.$http.get('../api/v2/club/item_card/order/list', {params: {
                    clubId: that.clubId,
                    page: page,
                    pageSize: that.pageSize,
                    cardType: dataObj.cardType
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData || []
                        var dataItem
                        var itemIndex
                        var dataItemObj
                        dataObj.hasLoadData = true

                        for (var i = 0; i < res.length; i++) {
                            dataItem = res[i]
                            // dataItem.isGived = 1 //
                            itemIndex = dataObj.clubDataSet[dataItem.clubId]
                            if (itemIndex == undefined) {
                                dataItemObj = {
                                    clubId: dataItem.clubId,
                                    clubName: dataItem.clubName,
                                    clubLogo: dataItem.clubImageUrl || global.defaultClubLogo,
                                    list: []
                                }
                                dataObj.clubDataSet[dataItem.clubId] = dataObj.dataList.length
                                dataObj.dataList.push(dataItemObj)
                            } else {
                                dataItemObj = dataObj.dataList[itemIndex]
                            }
                            dataItemObj.list.push(dataItem)
                        }
                        if (res.length < that.pageSize) {
                            dataObj.isDataAddEnd = true
                            dataObj.showFinishLoadTip = true
                        }
                        dataObj.currPage = page
                        dataObj.isAddData = false
                        dataObj.showDataLoadTip = false

                        if (res.length > 0) {
                            dataObj.noData = false
                        }
                        if (page == 1) {
                            global.loading = false
                        }
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                    }
                }, function () {
                    Util.tipShow(global.loadError)
                })
            }
        },
        /**
         * 解除事件绑定
         */
        beforeDestroy () {
            var that = this
            eventHub.$off('jump-view-item-card-order', that.cacheSave)
        }
    }
</script>
