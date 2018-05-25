<style lang="sass">
    @import '../sass/page/oneYuanRecords.scss';
</style>
<template>
    <div class="page" id="one-yuan-records-page">
        <div class="switch-button">
            <div :class="{ active : currType == 'all' }" @click="doSwitch('all')"><div>全部记录</div></div>
            <div :class="{ active : currType == 'win' }" @click="doSwitch('win')"><div>中奖记录</div></div>
        </div>
        <div class="wrap" :style="{ height : (global.winHeight-2.2*global.winScale*16)+'px' }" :class="{ active: currType == 'win' }">
            <div>
                <!--全部记录-->
                <div class="all-list" ref="allListEle" v-show="allDataList.length != 0" :style="{ height : (global.winHeight-4.833*global.winScale*16)+'px' }" @scroll="doHandlerAllListScroll()">
                    <div v-for="item in allDataList" class="list-wrap" :key="item.clubId">
                        <router-link class="item-title" tag="div" :to="{ path: '/'+item.clubId+'/home' }"><div>{{ item.clubName }}</div></router-link>
                        <ul>
                            <router-link class="record-item" :class="record.status" tag="li" v-for="record in item.list" :key="record.oneYuanId" :to="{ name: 'oneYuanDetail', query: { oneYuanId: record.oneYuanId } }">
                                <div :style="{ 'background-image': 'url('+( record.actImageUrl || global.defaultServiceItemImgUrl) + ')' }"></div>
                                <div>
                                    <div>
                                        <div>{{ record.actName }}</div>
                                        <div>{{ statusObj[record.status] }}</div>
                                    </div>
                                    <div>
                                        <div>
                                            <div class="act-process">开奖进度：<span>{{ (((record.totalPaidCount - record.canPaidCount)/record.totalPaidCount) * 100).toFixed(2) }}%</span></div>
                                            <div class="act-process-bar"><div :style="{ width: (((record.totalPaidCount - record.canPaidCount)/record.totalPaidCount) * 100).toFixed(2) + '%' }"></div></div>
                                            <div class="act-nums">
                                                <div>总需{{ record.totalPaidCount }}次</div>
                                                <div>还剩<span>{{ record.canPaidCount }}</span></div>
                                            </div>
                                        </div>
                                        <router-link class="act-buy-btn" tag="div" :to="{path: '/'+item.clubId+'/oneYuanDetail', query: { oneYuanId: record.oneYuanId } }">继续抢购</router-link>
                                    </div>
                                    <div>
                                        <div>我参与了<span>{{ record.ticketCount }}</span>次</div>
                                        <div class="check-my-nums" @click="doClickCheckNum(record, $event)">查看我的号码</div>
                                    </div>
                                    <div>
                                        <div><div>获奖者：</div><div>{{ record.status == 'complete' ? record.drawUserName+record.phoneNum.replace(/^(\d{3})\d{4}(\d{4})$/g,'（$1****$2）') : '' }}</div></div>
                                        <div><div>幸运号码：</div><div>{{ record.actDrawNo }}</div></div>
                                        <div><div>揭晓时间：</div><div>{{ record.drawTime }}</div></div>
                                    </div>
                                </div>
                            </router-link>
                        </ul>
                    </div>
                    <div class="data-load-tip" :class="{ none : !showAllDataLoadTip }"><div>加载数据</div></div>
                    <div class="finish-load-tip" :class="{ none : !showAllFinishLoadTip }"><div>已经加载全部数据</div></div>
                </div>
                <div class="nullData" v-show="allDataList.length == 0">
                    <div v-show="!global.loading"></div>
                    <div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div>
                </div>
            </div>

            <div>
                <!--中奖记录-->
                <div class="all-list" ref="winListEle" v-show="winDataList.length != 0" :style="{ height : (global.winHeight-4.833*global.winScale*16)+'px' }" @scroll="doHandlerWinListScroll()">
                    <div v-for="item in winDataList" class="list-wrap" :key="item.clubId">
                        <router-link class="item-title" tag="div" :to="{ path: '/'+item.clubId+'/home' }"><div>{{ item.clubName }}</div></router-link>
                        <ul>
                            <router-link v-for="(record,index) in item.list" :key="index" class="record-item complete" tag="li" :to="{ name: 'oneYuanRecordsDetail', query: { userOneYuanId: record.userOneYuanId, clubId: record.clubId } }">
                                <div :style="{ 'background-image': 'url('+( record.actImageUrl || global.defaultServiceItemImgUrl) + ')' }"></div>
                                <div>
                                    <div>
                                        <div>{{ record.actName }}</div>
                                        <div>已揭晓</div>
                                    </div>
                                    <div>
                                        <div>
                                            <div class="act-nums">
                                                <div>总需{{ record.totalPaidCount }}次</div>
                                                <div>还剩<span>0</span></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div>我参与了<span>{{ record.ticketCount }}</span>次</div>
                                        <div class="check-my-nums" @click="doClickCheckNum(record, $event)">查看我的号码</div>
                                    </div>
                                    <div>
                                        <div><div>幸运号码：</div><div>{{ record.actDrawNo }}</div></div>
                                        <div><div>揭晓时间：</div><div>{{ record.drawTime }}</div></div>
                                    </div>
                                </div>
                            </router-link>
                        </ul>
                    </div>
                    <div class="data-load-tip" :class="{ none : !showWinDataLoadTip }"><div>加载数据</div></div>
                    <div class="finish-load-tip" :class="{ none : !showWinFinishLoadTip }"><div>已经加载全部数据</div></div>
                </div>
                <div class="nullData" v-show="winDataList.length == 0">
                    <div v-show="!global.loading"></div>
                    <div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div>
                </div>
            </div>
        </div>

        <div class="num-pop pop-modal" :class="{ active: isShowPopNum }">
            <div class="center-wrap">
                <div>
                    <div>{{ popActName }}</div>
                    <div @click="doClosePopNum()">&times;</div>
                </div>
                <div>
                    <div>参与 <span>{{ popNums.length }}</span> 次</div>
                    <div>{{ popNums.join(' ') }}</div>
                </div>
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
                clubId: '',
                pageSize: 10,
                currType: 'all', // all win
                statusObj: {
                    not_online: '未上线',
                    online: '进行中',
                    end: '待开奖',
                    complete: '已揭晓',
                    refund: '已退款'
                },
                myNums: {},
                popActName: '',
                popNums: [],
                isShowPopNum: false,

                currAllPage: 0,
                clubAllDataSet: {},
                allDataList: [],
                showAllDataLoadTip: false,
                showAllFinishLoadTip: false,
                isAllDataAddEnd: false, // 数据是否已加载完
                isAllAddData: false, // 数据是否正在加载

                currWinPage: 0,
                clubWinDataSet: {},
                winDataList: [],
                showWinDataLoadTip: false,
                showWinFinishLoadTip: false,
                isWinDataAddEnd: false,
                isWinAddData: false
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query

            document.title = '夺宝'
            that.clubId = query.clubId || global.clubId || ''
            that.queryAllData(1)
            that.queryWinData(1)
            global.loading = false
        },
        methods: {
            doSwitch (type) {
                this.currType = type
            },
            queryAllData (page) { // 查询全部记录
                var that = this
                var global = that.global
                if (that.isAllAddData) {
                    return
                }
                that.isAllAddData = true
                page = page || that.currAllPage + 1

                // 更新数据加载提示
                that.showAllDataLoadTip = true
                that.showAllFinishLoadTip = false
                that.isAllDataAddEnd = false

                that.$http.get('../api/v2/club/one_yuan/act/list', {params: {
                    clubId: that.clubId || '',
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
                            itemIndex = that.clubAllDataSet[dataItem.clubId]
                            if (itemIndex == undefined) {
                                dataItemObj = {
                                    clubId: dataItem.clubId,
                                    clubName: dataItem.clubName,
                                    list: []
                                }
                                that.clubAllDataSet[dataItem.clubId] = that.allDataList.length
                                that.allDataList.push(dataItemObj)
                            } else {
                                dataItemObj = that.allDataList[itemIndex]
                            }
                            dataItemObj.list.push(dataItem)
                        }
                        if (res.length < that.pageSize) {
                            that.isAllDataAddEnd = true
                            that.showAllFinishLoadTip = true
                        }
                        that.currAllPage = page
                        that.isAllAddData = false
                        that.showAllDataLoadTip = false
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                    }
                }, function () {
                    Util.tipShow(global.loadError)
                })
            },
            queryWinData (page) {
                var that = this
                var global = that.global
                if (that.isWinAddData) {
                    return
                }
                that.isWinAddData = true
                page = page || that.currWinPage + 1

                // 更新数据加载提示
                that.showWinDataLoadTip = true
                that.showWinFinishLoadTip = false
                that.isWinDataAddEnd = false

                that.$http.get('../api/v2/club/one_yuan/draw/list', {params: {
                    clubId: global.clubId || '',
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
                            itemIndex = that.clubWinDataSet[dataItem.clubId]
                            if (itemIndex == undefined) {
                                dataItemObj = {
                                    clubId: dataItem.clubId,
                                    clubName: dataItem.clubName,
                                    list: []
                                }
                                that.clubWinDataSet[dataItem.clubId] = that.winDataList.length
                                that.winDataList.push(dataItemObj)
                            } else {
                                dataItemObj = that.winDataList[itemIndex]
                            }
                            dataItemObj.list.push(dataItem)
                        }
                        if (res.length < that.pageSize) {
                            that.isWinDataAddEnd = true
                            that.showWinFinishLoadTip = true
                        }
                        that.currWinPage = page
                        that.isWinAddData = false
                        that.showWinDataLoadTip = false
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                    }
                }, function () {
                    Util.tipShow(global.loadError)
                })
            },
            doHandlerAllListScroll () {
                var that = this
                var listEle = that.$refs.allListEle
                if (!that.isAllDataAddEnd && listEle.scrollTop + listEle.clientHeight * 1.4 > listEle.scrollHeight) {
                    that.queryAllData()
                }
            },
            doHandlerWinListScroll () {
                var that = this
                var listEle = that.$refs.winListEle
                if (!that.isWinDataAddEnd && listEle.scrollTop + listEle.clientHeight * 1.4 > listEle.scrollHeight) {
                    that.queryWinData()
                }
            },
            doClickCheckNum (record, e) {
                e.stopPropagation()
                var that = this
                var myNums = that.myNums
                var global = that.global
                var oneYuanId = record.oneYuanId
                if (myNums[oneYuanId]) {
                    that.showNums(myNums[oneYuanId], record.actName)
                } else {
                    global.eventMask = true
                    that.$http.get('../api/v2/club/one_yuan/my/ticket_no', {params: {
                        clubId: record.clubId,
                        oneYuanId: oneYuanId
                    }}).then(function (res) {
                        res = res.body
                        if (res.statusCode == 200) {
                            res = res.respData.split(',')
                            myNums[oneYuanId] = res.length > 0 && res[0] ? res : []
                            that.showNums(myNums[oneYuanId], record.actName)
                        } else {
                            Util.tipShow(res.msg || '加载我的号码失败！')
                        }
                        global.eventMask = false
                    }, function () {
                        Util.tipShow('加载我的号码失败！')
                        global.eventMask = false
                    })
                }
            },
            doClosePopNum () {
                this.isShowPopNum = false
            },
            showNums (nums, actName) {
                var that = this
                that.popActName = actName
                that.popNums = nums
                that.isShowPopNum = true
            }
        }
    }
</script>
