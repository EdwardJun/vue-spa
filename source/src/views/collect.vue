<style lang="sass">
    @import '../sass/page/collect.scss';
</style>
<template>
    <div class="page" id="collect-page">
        <!--Tab栏-->
        <ul class="tab-list">
            <div v-for="(item, index) in tabArr" :key="index" :class="{ active: currIndex == index }" @click="doSwitchTab(index)">{{ item }}</div>
        </ul>
        <!--收藏技师-->
        <div class="coll" :class="{ active: currIndex == 0 }">
            <div class="list" ref="itemTechListEle" :style="{ height : (global.winHeight-2.6*global.winScale*16)+'px' }" @scroll="doHandlerListScroll(0)">
                <div class="list-item" v-for="(singleClubData, singleIndex) in itemTech.dataList" :key="singleIndex">
                    <div class='header' v-if="isQueryAll">{{ singleClubData.clubName }}</div>
                    <div class="item" v-for="(item, itemIndex) in singleClubData.list" :key="itemIndex" @click='doView(item)'>
                        <div>
                            <div :style="{ backgroundImage : 'url('+(item.avatarUrl || global.defaultHeader)+')' }"></div>
                            <div v-if="item.status == 'free'" class="free">闲</div>
                            <div v-if="item.status == 'busy'" class="busy">忙</div>
                            <div v-if="item.status == 'rest'" class="rest">休</div>
                        </div>
                        <div>
                            <div>
                                <div><div>{{ item.techName || global.defaultTechName }}</div><template v-if="item.serialNo"><span></span><div>{{ item.serialNo}}</div><span></span></template></div>
                                <!--<div>
                                    <div class="stars"><div :style="{ width: item.star+'%' }"></div></div>
                                    <div>{{ item.commentCount || 0 }}评论</div>
                                </div>-->
                            </div>
                            <div>{{ item['tags'][0]['tagName'] }}</div>
                            <div>
                                <div>{{ item.description || '' }}</div>
                                <div v-if="item.status != 'rest'">立即预约</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="data-load-tip" :class="{ none : !itemTech.showDataLoadTip }"><div>加载数据</div></div>
                <div class="finish-load-tip" :class="{ none : !itemTech.showFinishLoadTip }"><div>已经加载全部数据</div></div>
                <div class="nullData" v-show="itemTech.dataList.length==0 && !itemTech.isAddData">
                    <div v-show="!global.loading"></div>
                    <div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div>
                </div>
            </div>
        </div>

        <!--收藏会所-->
        <div class="coll" :class="{ active: currIndex == 1 }">
            <div class="list item-club" ref="itemClubListEle" @scroll="doHandlerListScroll(1)" :style="{ height : (global.winHeight-2.6*global.winScale*16)+'px' }" >
                <router-link v-for="item in itemClub.dataList" :key="item.clubId" class="item" :to="{path: '/' + item.clubId + '/home'}" tag='div'>
                    <span :style="{ backgroundImage : 'url('+(item.imageUrl || global.defaultHeader)+')' }"></span><!--会所图片-->
                    <div class="item-name">{{ item.clubName }}</div>
                    <span>{{ item.clubDist }}</span>
                </router-link>
                <div class="data-load-tip" :class="{ none : !itemClub.showDataLoadTip }"><div>加载数据</div></div>
                <div class="finish-load-tip" :class="{ none : !itemClub.showFinishLoadTip }"><div>已经加载全部数据</div></div>
                <div class="nullData" v-show="itemClub.dataList.length==0 && !itemClub.isAddData">
                    <div v-show="!global.loading"></div>
                    <div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
    import Vue from 'vue'
    import Global from '../libs/global'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                dataList: [],
                clubList: [],
                dataIndex: {},
                currPage: 0,
                clubId: '', // 查询的收藏会所，全部为空
                pageSize: 15,
                isQueryAll: true, // 查询所有的
                tabArr: ['收藏技师', '收藏会所'],
                currIndex: 0, // 当前的tab页
                indexObj: ['itemTech', 'itemClub'],
                // 技师收藏变量控制
                itemTech: {
                    dataList: [],
                    currPage: 0,
                    showDataLoadTip: false, // 显示数据正在加载
                    showFinishLoadTip: false, // 显示已经加载完成
                    isDataAddEnd: false, // 数据是否已加载完
                    isAddData: false, // 数据是否正在加载
                    noData: true,
                    cardType: 'item_tech',
                    hasLoadData: false // 是否已加载数据
                },
                // 会所收藏变量控制
                itemClub: {
                    dataList: [],
                    currPage: 0,
                    showDataLoadTip: false, // 显示数据正在加载
                    showFinishLoadTip: false, // 显示已经加载完成
                    isDataAddEnd: false, // 数据是否已加载完
                    isAddData: false, // 数据是否正在加载
                    noData: true,
                    cardType: 'item_club',
                    hasLoadData: false // 是否已加载数据
                }
            }
        },
        mounted () {
            let that = this
            let global = that.global
            let query = global.currPage.query
            let ss = Util.sessionStorage
            let ssc = Util.removeSessionStorage

            document.title = '我的收藏'
            that.isQueryAll = global.pageMode != 'club' || query.all == 'true'
            that.currIndex = query.tab || 0

            if (!that.isQueryAll) {
                that.clubId = global.clubId
            }

            let cacheData = ss('collect_data')
            let cacheClubId = ss('collect_clubId') || ''
            var cacheTab = ss('collect_tab')
            var currType = that.indexObj[that.currIndex]
            if (cacheTab && cacheData && cacheTab == that.currIndex && cacheClubId == that.clubId) { // 从缓存加载数据
                var dataObj = that[currType]
                dataObj.dataList = JSON.parse(cacheData)
                that.dataIndex = JSON.parse(ss('collect_data_index'))
                dataObj.currPage = ss('collect_page') - 0
                dataObj.isDataAddEnd = ss('collect_end') == 'true'
                dataObj.showFinishLoadTip = ss('collect_finish') == 'true'
                dataObj.hasLoadData = true
                dataObj.noData = false
                let top = ss('collect_top') - 0
                that.$nextTick(function () {
                    var listEle = that.$refs[currType + 'ListEle']
                    setTimeout(function () {
                        listEle.scrollTop = top
                        global.loading = false
                    }, 100)
                })
            } else {
                that.queryRecord()
            }

            if (cacheData) { // 清除缓存中的数据
                ssc('collect_data')
                ssc('collect_data_index')
                ssc('collect_page')
                ssc('collect_clubId')
                ssc('collect_end')
                ssc('collect_finish')
                ssc('collect_top')
            }
        },
        methods: {
            queryRecord (page, tabIndex) {
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

                if (tabIndex == 0) {
                    that.$http.get('../api/v2/profile/user/favorite', {
                        params: {
                            page: page, pageSize: that.pageSize, clubId: that.clubId
                        }
                    }).then(function (res) {
                        res = res.body
                        if (res) {
                            res = (res.statusCode != '200') ? [] : res['respData']
                            if (!dataObj.hasLoadData) {
                                dataObj.hasLoadData = true
                            }
                            that.doHandlerData(res, dataObj)
                            if (res.length == 0) {
                                dataObj.isDataAddEnd = true
                                if (page != 1) {
                                    dataObj.showFinishLoadTip = true
                                }
                            }
                            dataObj.currPage = page
                            dataObj.isAddData = false
                            dataObj.showDataLoadTip = false
                        } else {
                            Util.tipShow(global.loadError)
                        }
                        if (global.loading) {
                            global.loading = false
                        }
                    }, function () {
                        Util.tipShow(global.loadError)
                    })
                } else if (tabIndex == 1) {
                    that.$http.get('../api/v2/profile/user/favorite/club/list', {
                        params: {
                            page: page, pageSize: that.pageSize
                        }
                    }).then(function (res) {
                        res = res.body
                        if (res) {
                            res = (res.statusCode != '200') ? [] : res['respData']
                            if (!dataObj.hasLoadData) {
                                dataObj.hasLoadData = true
                            }
                            res.forEach(function (item) {
                                that.itemClub.dataList.push({
                                    clubId: item.clubId,
                                    clubName: item.clubName,
                                    imageUrl: item.imageUrl,
                                    latitude: item.latitude,
                                    longitude: item.longitude
                                })
                            })
                            // 用户定位
                            if (!global.currLngx || !global.currLaty) {
                                Util.getLocation(function (position) {
                                    let coords = position.coords
                                    if (coords.longitude && coords.latitude) {
                                        global.currLngx = coords.longitude
                                        global.currLaty = coords.latitude
                                    } else {
                                        global.currLngx = ''
                                        global.currLaty = ''
                                    }
                                    that.setLocation(that.itemClub.dataList)
                                }, function () {
                                    that.setLocation(that.itemClub.dataList)
                                })
                            } else {
                                that.setLocation(that.itemClub.dataList)
                            }
                            if (res.length == 0) {
                                dataObj.isDataAddEnd = true
                                if (page != 1) {
                                    dataObj.showFinishLoadTip = true
                                }
                            }
                            dataObj.currPage = page
                            dataObj.isAddData = false
                            dataObj.showDataLoadTip = false
                        } else {
                            Util.tipShow(global.loadError)
                        }
                        if (global.loading) {
                            global.loading = false
                        }
                    }, function () {
                        Util.tipShow(global.loadError)
                    })
                }
            },
            setLocation (data) {
                var that = this
                var global = that.global
                data.forEach(function (item, index) {
                    var dist
                    if (global.currLngx && global.currLaty && item.longitude && item.latitude) {
                        dist = ~~Util.getGreatCircleDistance(global.currLaty, global.currLngx, item.latitude, item.longitude)
                        if (dist / 1000 > 1) {
                            dist = (dist / 1000).toFixed(1) + 'km'
                        } else {
                            dist += 'm'
                        }
                        item.clubDist = dist
                        Vue.set(that.itemClub.dataList, index, item)
                    }
                })
            },
            doHandlerListScroll (tabIndex) {
                var that = this
                var dataType = that.indexObj[tabIndex] // itemTech 技师收藏
                var dataObj = that[dataType] // 所有列表数据
                var listEle = that.$refs[dataType + 'ListEle']
                if (!dataObj.isDataAddEnd && listEle.scrollTop + listEle.clientHeight * 1.4 > listEle.scrollHeight) {
                    that.queryRecord()
                }
            },
            doHandlerData (data, dataObj) {
                var that = this
                var item
                var dataIndex
                var dataList = dataObj.dataList
                var isAlreadyIn = false // 去重
                var list
                var i
                for (var k = 0; k < data.length; k++) {
                    item = data[k]
                    if (!item.tags || item.tags.length == 0) {
                        item.tags = [{tagName: '(无)'}]
                    }
                    dataIndex = that.dataIndex[item['clubId']]
                    if (dataIndex == undefined) {
                        dataIndex = dataList.length
                        that.dataIndex[item['clubId']] = dataIndex
                        dataList.push({clubName: item.clubName, list: []})
                    }

                    // 防止重复加入列表里面
                    isAlreadyIn = false
                    list = dataList[dataIndex].list
                    for (i = 0; i < list.length; i++) {
                        if (list[i].techId == item.techId) {
                            isAlreadyIn = true
                            break
                        }
                    }
                    if (!isAlreadyIn) {
                        list.push(item)
                    }
                }
            },
            /**
             * 查看技师主页,跳转之前缓存数据
             * @param  {Object} tech
             * @return
             */
            doView (tech) {
                let that = this
                let ss = Util.sessionStorage
                let type = that.indexObj[that.currIndex]
                var dataObj = that[type]
                var listEle = that.$refs[type + 'ListEle']

                ss('collect_data', JSON.stringify(dataObj.dataList))
                ss('collect_data_index', JSON.stringify(that.dataIndex))
                ss('collect_page', dataObj.currPage)
                ss('collect_clubId', that.clubId)
                ss('collect_end', dataObj.isDataAddEnd)
                ss('collect_finish', dataObj.showFinishLoadTip)
                ss('collect_top', listEle.scrollTop)
                that.$router.push({name: 'technicianDetail', query: {id: tech.techId}})
            },
            /**
             * 切换tab
             */
            doSwitchTab (index) {
                var that = this
                if (that.currIndex != index) {
                    that.currIndex = index
                    var dataObj = that[that.indexObj[index]]
                    if (!dataObj.hasLoadData) {
                        that.queryRecord(1, index)
                    }
                    that.$router.replace({name: 'collect', query: {tab: index, all: that.isQueryAll}})
                }
            }
        }
    }
</script>
