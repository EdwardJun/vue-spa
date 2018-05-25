<!--个人中心-拼团记录-->
<style lang="sass">
    @import '../sass/page/groupBuyRecords.scss';
</style>
<template>
    <div class="page" id="group-buy-records-page">
        <div class="switch-menu">
            <div :class="{ active: currTab == 0 }" @click="switchMenuType(0)">已成团</div>
            <div :class="{ active: currTab == 1 }" @click="switchMenuType(1)">进行中</div>
        </div>
        <div class="wrap" :class="{ active: currTab == 1 }" :style="{ height : (global.winHeight-2.667*global.winScale*16)+'px' }">
            <!--2个列表-->
            <div v-for="(dataObj, dataIndex) in dataArr" :key="dataIndex" class="list item-content" :ref="'listEle'+dataIndex" :style="{ height : (global.winHeight-2.667*global.winScale*16)+'px' }" @scroll="doHandlerListScroll()">
                <div class="list-item" v-for="(singleClubData, singleIndex) in dataObj.dataList">
                    <div class='header' v-if="isQueryAll" :class="{ first: singleIndex == 0 }">{{ singleClubData.clubName }}<div :class="{ closed: singleClubData.isClosed }" @click="doSwitchClose(singleClubData, singleIndex, dataIndex)">{{ singleClubData.isClosed ? '展开' : '收起' }}</div></div>
                    <div v-show="!singleClubData.isClosed" class="list-wrap">
                        <div class="item" :class="itemObj.type" :key="itemObj.id" v-for="itemObj in singleClubData.list" @click="doViewDetail(itemObj)">
                            <div>
                                <h3>{{ itemObj.activityName }}</h3>
                                <div><label>拼团价：</label><strong>{{ itemObj.price | MoneyFilter }}</strong><span>元</span></div>
                                <div v-show="itemObj.type!='already'"><label>拼团人数：</label><span>{{ itemObj.obtainedCount || itemObj.personalCount }}/{{ itemObj.personalCount }}</span></div>
                                <div v-if="itemObj.type=='already'"><label>有效时间：</label><span>{{ itemObj.couponPeriod }}</span></div>
                                <div v-else>
                                    <template v-if="itemObj.endTime && itemObj.timeStr"><label>剩余时间：</label><span>{{ itemObj.timeStr }}</span></template>
                                </div>
                                <div v-if="itemObj.type=='already'">{{ itemObj.verifyStatus }}</div>
                            </div>
                            <div v-if="itemObj.type=='already' && itemObj.verifyStatus=='可用'" @click="doPopQrcode(itemObj, $event)">立即使用</div>
                        </div>
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

        <!--弹窗-->
        <div class="pop-modal" :class="{ active: isPopModal }" @click="doCloseModal('isPopModal')">
            <div class="center-wrap" @click="doClickPopWrap($event)">
                <h3>{{ qrCodeTitle }}</h3>
                <img :src="qrCodeImgSrc" alt="二维码" v-if="qrCodeImgSrc"/>
                <div>{{ qrCode }}</div>
            </div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import Vue from 'vue'
    import MoneyFilter from '../filters/money-formatter'
    import 'jr-qrcode'

    export default {
        filters: {
            MoneyFilter
        },
        data () {
            return {
                global: Global.data,
                isPopModal: false, // 控制二维码弹窗的显示
                currTab: 1, // 0--已成团   1--进行中
                pageSize: 10,
                isQueryAll: true, // 是否查询所有会所的
                dataArr: [],
                qrCodeImgSrc: null,
                qrCode: '',
                qrCodeTitle: '',
                showPopShare: false,
                timer: null
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

            // 构造dataArr数组：已成团、进行中
            for (let i = 0; i < 2; i++) {
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

            let cacheData = ss('group_buy_data')
            let cacheTab = ss('group_buy_tab')

            if (cacheTab == that.currTab && cacheData) { // 从缓存加载数据
                let dataObj = that.dataArr[cacheTab]
                dataObj.dataList = JSON.parse(cacheData)
                dataObj.currPage = ss('group_buy_page') - 0
                dataObj.dataIndex = JSON.parse(ss('group_buy_set'))
                dataObj.isDataAddEnd = ss('group_buy_end') == 'true'
                dataObj.showFinishLoadTip = ss('group_buy_finish') == 'true'
                dataObj.hasLoadData = true

                // 滚动条定位
                let top = ss('group_buy_top')
                that.$nextTick(function () {
                    let listEle = that.$refs['listEle' + cacheTab][0]
                    setTimeout(function () {
                        listEle.scrollTop = top
                        global.loading = false
                        that.doTimerCount()
                    }, 100)
                })
            } else {
                that.queryRecord()
                global.loading = false
            }

            // 清除缓存
            if (cacheData) {
                ssc('group_buy_data')
                ssc('group_buy_tab')
                ssc('group_buy_page')
                ssc('group_buy_set')
                ssc('group_buy_end')
                ssc('group_buy_finish')
                ssc('group_buy_top')
            }
        },
        methods: {
            doClickShare (item, e) {
                e.stopPropagation()
                let that = this
                let global = that.global
                that.showPopShare = true
                // 设置分享
                if (global.userAgent.isWX) {
                    Global.shareConfig({
                        title: item.activityName,
                        desc: '没有大动作，哪敢惊动你！' + item.itemName + '，原价' + ((item.itemPrice / 100).toFixed(2)) + '，现仅需' + ((item.price / 100).toFixed(2)) + '，立刻点击参与！',
                        link: global.prefixPathname + '?#/' + item.clubId + '/groupBuyActShare?id=' + item.activityId + '&userId=' + global.userId + '&groupId=' + item.openGroupId,
                        imgUrl: item.itemImageUrl,
                        success () {
                            that.$http.post('../api/v2/user/group/buy/update/share/count', {
                                activityId: item.activityId, shareUserId: global.userId
                            })
                        }
                    }, 'groupBuyRecords-' + item.id)
                }
            },
            switchMenuType (index) {
                let that = this
                if (that.currTab != index) {
                    let dataObj = that.dataArr[index]
                    if (!dataObj.hasLoadData) {
                        that.queryRecord(index, 1)
                    }
                    that.currTab = index
                    that.$router.replace({name: 'groupBuyRecords', query: {tab: index, all: that.isQueryAll}})
                }
            },
            doCloseModal (type) {
                this[type] = false
            },
            doClickPopWrap (e) {
                e.stopPropagation()
            },
            doViewDetail (item) {
                let that = this
                that.cacheSave()
                if (item.type == 'already') {
                    that.$router.push({name: 'groupBuyRecordDetail', query: {id: item.id, clubId: item.clubId}})
                } else {
                    that.$router.push({name: 'groupBuyActShare', query: {id: item.activityId, clubId: item.clubId, groupId: item.openGroupId}})
                }
            },
            doPopQrcode (item, e) {
                e.stopPropagation()
                let that = this
                that.qrCodeImgSrc = jrQrcode.getQrBase64(item.couponNo, {padding: 0})
                that.qrCodeTitle = item.activityName
                that.qrCode = Util.spaceFormat(item.couponNo)
                that.isPopModal = true
            },
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

                that.$http.get('../api/v2/user/group/buy/record/list', {
                    params: {
                        page: page,
                        pageSize: that.pageSize,
                        clubId: (that.isQueryAll ? '' : global.clubId),
                        isCompleted: tab == 0
                    }
                }).then((res) => {
                    res = res.body
                    if (res) {
                        res = (res.statusCode != '200') ? [] : res['respData']
                        if (!dataObj.hasLoadData) {
                            dataObj.hasLoadData = true
                        }
                        that.doHandlerData(res, dataObj, tab)
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
                        that.doTimerCount()
                    } else {
                        Util.tipShow(global.loadError)
                    }
                }, () => {
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
            doHandlerData (data, dataObj, type) {
                let item
                let dataIndex
                let that = this
                for (let k = 0; k < data.length; k++) {
                    item = data[k]
                    item.type = (type == 0 ? 'already' : 'processing')
                    if (type == 1 && item.endTime) {
                        item.timeStr = that.getGroupEndTime(item.endTime)
                    }
                    dataIndex = dataObj.dataIndex[item['clubId']]
                    if (dataIndex == undefined) {
                        dataIndex = dataObj.dataList.length
                        dataObj.dataIndex[item['clubId']] = dataIndex
                        dataObj.dataList.push({clubName: item.clubName, list: [], isClosed: false})
                    }
                    dataObj.dataList[dataIndex].list.push(item)
                }
            },
            doTimerCount () {
                let that = this
                let k
                let i
                let dataItem
                let item
                let dataList
                let newDataList
                that.timer = setInterval(() => {
                    dataList = that.dataArr[1].dataList
                    newDataList = []
                    if (dataList.length) {
                        for (k = 0; k < dataList.length; k++) {
                            dataItem = dataList[k]
                            for (i = 0; i < dataItem.list.length; i++) {
                                item = dataItem.list[i]
                                if (item.endTime) {
                                    item.timeStr = that.getGroupEndTime(item.endTime)
                                }
                            }
                            newDataList.push(dataItem)
                        }
                    }
                    that.dataArr[1].dataList = newDataList
                }, 1000)
            },
            getGroupEndTime (time) {
                let hour = 0
                let min = 0
                let sec = 0
                let day = 0
                let num = 0
                let delt = time - (+new Date())
                const floor = Math.floor
                const paddingTime = Util.paddingTime
                if (delt < 0) {
                    return ''
                } else {
                    num = delt / 1000
                    sec = floor(num % 60)
                    min = floor(num / 60 % 60)
                    hour = floor(num / 3600 % 24)
                    day = floor(num / 3600 / 24)
                    if (day == 0) {
                        return paddingTime(hour) + ':' + paddingTime(min) + ':' + paddingTime(sec)
                    } else {
                        return day + '天' + paddingTime(hour) + ':' + paddingTime(min) + ':' + paddingTime(sec)
                    }
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
                ss('group_buy_data', JSON.stringify(dataObj.dataList))
                ss('group_buy_tab', that.currTab)
                ss('group_buy_page', dataObj.currPage)
                ss('group_buy_set', JSON.stringify(dataObj.dataIndex))
                ss('group_buy_end', dataObj.isDataAddEnd)
                ss('group_buy_finish', dataObj.showFinishLoadTip)
                ss('group_buy_top', listEle.scrollTop)
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
        beforeDestroy () {
            let that = this
            if (that.timer) {
                clearInterval(that.timer)
            }
        }
    }
</script>