<style lang="sass">
    @import '../sass/page/fastPayRecords.scss';
</style>
<template>
    <div class="page" id="fast-pay-records-page" :style="{ height : global.winHeight+'px' }">
        <div class="all-list" ref="listEle" v-show="!noData" :style="{ height : (global.winHeight-0*global.winScale*16)+'px' }" @scroll="doHandlerListScroll()">
            <div v-for="item in dataList">
                <router-link class="item-title" tag="div" :to="{ path: '/'+item.clubId+'/home' }"><div :style="{ 'background-image': 'url('+item.clubLogo+')'}"></div>{{ item.clubName }}</router-link>
                <ul class="item-list">
                    <li v-for="record in item.list" @click="doClickGetGift(record.id)">
                        <div>
                            <template v-if="record.techName">服务技师：{{ record.techName }}<span v-show="record.techNo">{{ record.techNo }}</span></template>
                            <template v-else>{{record.remark}}</template>
                            <i v-if="record.haveFastPayPackage == 'Y'"></i>
                        </div>
                        <div>{{ record.createTime }}</div>
                        <div><b>{{ record.payAmount | MoneyFormatter }}</b>元</div>
                        <div>{{ payChannelObj[record.payChannel]}}</div>
                    </li>
                </ul>
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
    import MoneyFormatter from '../filters/money-formatter'

    export default {
        filters: {
            MoneyFormatter: MoneyFormatter
        },
        data () {
            return {
                global: Global.data,
                clubId: '',
                dataList: [],
                currPage: 0,
                pageSize: 10,
                listEle: null,
                clubDataSet: {},
                showDataLoadTip: false, // 显示数据正在加载
                showFinishLoadTip: false, // 显示已经加载完成
                isDataAddEnd: false, // 数据是否已加载完
                isAddData: false, // 数据是否正在加载
                noData: true,
                payChannelObj: {
                    wx: '微信支付',
                    account: '会员消费支付',
                    ali: '支付宝支付'
                }
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            that.clubId = query.clubId || global.clubId || ''
            that.queryData(1)
            document.title = '买单记录'
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

                that.$http.get('../api/v2/club/fastpay/order/list', {params: {
                    clubId: that.clubId,
                    userId: global.userId,
                    page: page,
                    pageSize: that.pageSize
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData || []
                        var dataItem
                        var itemIndex
                        var dataItemObj

                        for (var i = 0; i < res.length; i++) {
                            dataItem = res[i]
                            itemIndex = that.clubDataSet[dataItem.clubId]
                            if (itemIndex == undefined) {
                                dataItemObj = {
                                    clubId: dataItem.clubId,
                                    clubName: dataItem.clubName,
                                    clubLogo: dataItem.clubImageUrl || global.defaultClubLogo,
                                    list: []
                                }
                                that.clubDataSet[dataItem.clubId] = that.dataList.length
                                that.dataList.push(dataItemObj)
                            } else {
                                dataItemObj = that.dataList[itemIndex]
                            }
                            dataItemObj.list.push(dataItem)
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
                    }
                }, function () {
                    Util.tipShow(global.loadError)
                })
            },
            doClickGetGift (orderId) {
                var that = this
                that.$router.push({name: 'fastPayDetail', query: {orderId: orderId}})
            }
        }
    }
</script>
