<style lang="sass">
    @import '../sass/page/appointTech.scss';
</style>
<template>
    <div class="page" id="appoint-tech-page">
        <div class="title">
            <router-link tag="div" class="item-title" :to="{ path: '/'+clubId+'/home' }"><div :style="{'background-image':'url('+clubLogoUrl+')'}"></div>{{clubName}}</router-link>
            <div class="item-filter" @click="doClickShowServiceItemSelectArea()"><div :class="{ active : showServiceItemSelectArea }"></div>筛选</div>
        </div>

        <div class="image-area" @touchmove="doTouchMoveImgArea($event)">
            <div class="image-item" v-for="(item, index) in dataList" v-show="total>1 || index==3" @touchstart="doTouchStart(index,$event)" @touchmove="doTouchMove(index,$event)" @touchcancel="doTouchEnd(index,$event)" @touchend="doTouchEnd(index,$event)" @transitionend="doTransitionEnd(index,$event)">
                <div :style="{ opacity: item.opacity, transform: item.transform, transitionDuration: item.transitionDuration }">
                    <div>
                        <img :src="item.img || global.defaultHeader"/>
                        <span v-show="item.techCode">{{ item.techCode }}</span>
                        <div :class="item.status"></div>
                    </div>
                    <div>{{ item.techName }}<div @click="doClickCollectBtn()"><div :class="{ active: currCollected }"></div>{{ currCollected ? '已收藏' : '收藏' }}</div></div>
                    <div><span v-for="service in item.service">{{ service }}</span></div>
                    <div>{{ item.desc }}</div>
                </div>
                <div v-if="index==3" v-show="showSlide">
                    <div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                    <div>左右滑动</div>
                    <div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                </div>
                <span :style="{ opacity: (index==3 ? 1 : 0) }">技师 {{ currIndex+1 }}/{{ total }}</span>
            </div>
            <div @click="doClickILikeBtn()" class="item-like" v-show="iLikeList.length>0">
                <div><i></i><i>{{ iLikeList.length }}</i></div>
            </div>
        </div>

        <div class="footer-btn">
            <router-link :to="{ name: 'technicianDetail', query: { id : currTech.id } }" tag="div">相册</router-link>
            <div @click="doClickLikeBtn()" :class="{ active: currLike }">{{ currLike ? '已' : '' }}喜欢</div>
        </div>

        <div class="no-tech-pop" v-show="showPop">
            <div>
                <div>该会所尚未添加技师,<br/><span>{{ timeCount }}</span>秒后将自动跳转到会所首页</div>
                <router-link :to="{ path: '/'+clubId+'/home' }" tag="div">立即跳转</router-link>
            </div>
        </div>

        <div class="pop-modal selector-area" :class="{ active : showBgSelectScore }">
            <div class="item-bg service-item" :class="{ active : showBgSelectScore }"></div>
            <span class="service-bg"></span>
        </div>

        <!--筛选-->
        <div class="pop-modal selector-area" :class="{ active : showSelectScore || showServiceItemSelectArea }">
            <div class="comment" :class="{ active : showSelectScore }">
                <div @click="doClickChangeScoreStatus('1')">评论最多</div>
                <div @click="doClickChangeScoreStatus('-1')">评分最高</div>
            </div>
            <div class="service-item" :class="{ active : showServiceItemSelectArea }">
                <div>
                    <div class="item-selected">
                        <div class="service-title">技师状态</div>
                    </div>
                    <div class="category">
                        <div>
                            <div v-for="(item, index) in serviceStatus" class="item" :class="{ active : itemStatusStr==item.status }" @click="doClickServiceStatus(currItemActiveStatusStr, item.status, item.name)">{{item.name }}</div>
                        </div>
                    </div>
                    <div class="gray"></div>
                    <div class="item-selected">
                        <div class="service-title">项目选择</div>
                    </div>
                    <div class="all">
                        <div class="item" :class="{ active : itemActiveId=='' }" @click="doClickServiceItem('','全部项目','')">全部项目</div>
                    </div>
                    <div class="category" v-for="item in serviceItems">
                        <div>{{ item.name }}</div>
                        <div>
                            <div class="item" v-for="subItem in item.serviceItems" :class="{ active : itemActiveId==subItem.id }" @click="doClickServiceItem(subItem.id,subItem.name,item.name)">{{ subItem.name }}</div>
                        </div>
                    </div>
                </div>
                <div>
                    <div @click="doClickServiceItemBtn('cancel')">取消</div>
                    <div @click="doClickServiceItemBtn('ok')">确定</div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import Vue from 'vue'

    export default {
        data () {
            return {
                global: Global.data,
                dataList: [],
                serviceItems: [],
                serviceStatus: [{name: '全部', status: ''}, {name: '闲', status: 'free'}, {name: '忙', status: 'busy'}, {name: '休假', status: 'rest'}],
                pageIndex: {1: 3, 2: 2, 3: 1, 'right': 4, 'left': 5},
                clubName: '',
                clubId: '',
                techs: [],
                iLikeList: [],
                currTech: {},
                currPage: 0,
                lastPage: 0,
                pageSize: 100,
                currIndex: 0,
                total: 0,
                isLoadEnd: [],
                currCollected: false,
                currLike: false,

                showPop: false,
                timeCount: 5,
                goTimer: null,
                isBack: false,
                showSlide: true,

                startDirection: 0,
                startPoint: {x: 0, y: 0},
                isDrag: false,
                isNeedChange: false,
                isCalled: false,
                secondTy: 2,
                secondScale: 0.94,
                thirdTy: 4,
                tyDt: 2,
                thirdScale: 0.88,
                scaleDt: 0.06,
                secondOpacity: 0.9,
                thirdOpacity: 1,
                opacityDt: 0.1,
                touchCount: 0,
                divWidth: 0,
                showBgSelectScore: false,
                showSelectScore: false, // 评论评分的下拉选择
                showServiceItemSelectArea: false, // 是否显示服务项目选择
                showFilter: false,

                // 查询参数
                itemActiveId: '',
                qrcodeType: '',
                qrcodeId: '',

                selectedCategory: '', // 选中项目的分类
                selectItemName: '全部项目', // 选中的服务项目名
                currSelectedCategory: '',
                currSelectItemName: '全部项目',
                currItemActiveId: '',
                currItemActiveStatusStr: '',

                itemStatusStr: '',
                selectItemStatusName: '全部'
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            that.clubId = query.clubId || global.clubId || ''
            that.qrcodeType = query.clubsource
            if (global.pageMode == 'club' && that.clubId == global.clubId) {
                that.clubName = global.clubName
                that.clubLogoUrl = global.clubLogoUrl
            } else {
                that.$http.get('../api/v2/club/' + that.clubId + '/clubName').then(function (res) {
                    res = res.body
                    that.clubLogoUrl = res.logo || global.defaultClubLogo
                    that.clubName = res.name
                })
            }
            if (!that.clubId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }

            var cacheData = Util.sessionStorage('appoint-tech-data')
            if (cacheData) {
                cacheData = JSON.parse(cacheData)
            }
            if (cacheData && cacheData.clubId == that.clubId) {
                that.dataList = cacheData.dataList
                that.serviceItems = cacheData.serviceItems
                that.pageIndex = cacheData.pageIndex
                that.clubName = cacheData.clubName
                that.clubId = cacheData.clubId
                that.techs = cacheData.techs
                that.currTech = cacheData.currTech
                that.currPage = cacheData.currPage
                that.lastPage = cacheData.lastPage
                that.currIndex = cacheData.currIndex
                that.total = cacheData.total
                that.isLoadEnd = cacheData.isLoadEnd
                that.currCollected = cacheData.currCollected
                that.showPop = cacheData.showPop
                that.isBack = cacheData.isBack
                that.showSlide = cacheData.showSlide
                that.startDirection = cacheData.startDirection
                that.startPoint = cacheData.startPoint
                that.isDrag = cacheData.isDrag
                that.isNeedChange = cacheData.isNeedChange
                that.isCalled = cacheData.isCalled
                that.secondTy = cacheData.secondTy
                that.secondScale = cacheData.secondScale
                that.thirdTy = cacheData.thirdTy
                that.tyDt = cacheData.tyDt
                that.thirdScale = cacheData.thirdScale
                that.scaleDt = cacheData.scaleDt
                that.secondOpacity = cacheData.secondOpacity
                that.thirdOpacity = cacheData.thirdOpacity
                that.opacityDt = cacheData.opacityDt
                that.touchCount = cacheData.touchCount
                that.divWidth = cacheData.divWidth
                that.showBgSelectScore = cacheData.showBgSelectScore
                that.showSelectScore = cacheData.showSelectScore // 评论评分的下拉选择
                that.showServiceItemSelectArea = cacheData.showServiceItemSelectArea // 是否显示服务项目选择
                that.showFilter = cacheData.showFilter
                that.itemActiveId = cacheData.itemActiveId
                that.selectedCategory = cacheData.selectedCategory // 选中项目的分类
                that.selectItemName = cacheData.selectItemName // 选中的服务项目名
                that.currSelectedCategory = cacheData.currSelectedCategory
                that.currSelectItemName = cacheData.currSelectItemName
                that.currItemActiveId = cacheData.currItemActiveId
                that.currItemActiveStatusStr = cacheData.currItemActiveStatusStr
                that.itemStatusStr = cacheData.itemStatusStr
                that.selectItemStatusName = cacheData.selectItemStatusName
                global.loading = false
            } else {
                // init dataList
                var list = []
                for (let k = 0; k < 6; k++) {
                    list.push({
                        img: '',
                        techCode: '',
                        techName: '',
                        status: '',
                        service: '',
                        desc: '',
                        transform: '',
                        opacity: k < 4 ? 1 : 0,
                        transitionDuration: 0
                    })
                }
                that.dataList = list
                that.divWidth = global.winScale * 16 * 16.666
                that.isCurrTechLike()

                that.queryData(1).then(function () {
                    if (that.lastPage > 1) {
                        that.queryData(that.lastPage).then(function () {
                            that.initPage()
                        })
                    } else {
                        that.initPage()
                    }
                })
            }

            let cacheILikeData = Util.sessionStorage('item_appoint_tech_data')
            if (cacheILikeData) {
                that.iLikeList = JSON.parse(cacheILikeData)
                Util.removeSessionStorage('item_appoint_tech_data')
            }

            Util.removeSessionStorage('appoint-tech-data')
        },
        mounted () {
            var that = this
            var global = that.global
            var pageData = global.pageData['appointTech']
            if (pageData) {
                that.$nextTick(function () {
                    setTimeout(function () {
                        that.$refs.listEle.scrollTop = pageData['scrollTop']
                    }, 100)
                })
            }
            // 获取服务项目
            that.$http.get('../api/v2/club/{clubId}/service/select', {params: {clubId: global.clubId}}).then(function (res) {
                res = res.body
                if (res && res.length) {
                    that.serviceItems = res
                }
            })
        },
        methods: {
            initPage () {
                var that = this
                var techs = that.techs
                // that.total = techs.length
                if (that.total == 0) {
                    return
                } else if (that.total > 1) {
                    that.showData(techs[techs.length - 1], 'left')
                    that.showData(techs[techs.length - 1], 'right')
                    techs[techs.length - 1].imageLoaded = true
                    that.showData(techs[0], 1)
                    that.showData(techs[that.calcIndex(1)], 2)
                    that.showData(techs[that.calcIndex(2)], 3)
                    techs[0].imageLoaded = true
                    techs[that.calcIndex(1)].imageLoaded = true
                    techs[that.calcIndex(1)].imageLoaded = true
                } else {
                    that.showData(techs[0], 1)
                    that.showSlide = false
                }
                that.currIndex = 0
                that.currTech = techs[0]
                that.isCollected(techs[0]).then(function (dataRes) {
                    that.currCollected = dataRes
                })
                that.isCurrTechLike()
            },
            doTouchStart (index, e) {
                var that = this
                if (index == 3 && that.total > 1) {
                    that.startPoint = {
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY
                    }
                    that.isDrag = false
                    that.isNeedChange = false
                }
            },
            doTouchMove (index, e) {
                var that = this
                if (index == 3 && that.total > 1) {
                    var dataList = that.dataList
                    var pageIndex = that.pageIndex
                    var page1 = dataList[pageIndex[1]]
                    var page2 = dataList[pageIndex[2]]
                    var page3 = dataList[pageIndex[3]]
                    var pageLeft = dataList[pageIndex['left']]
                    var pageRight = dataList[pageIndex['right']]

                    if (e.preventDefault) {
                        e.preventDefault()
                    } else {
                        e.returnValue = false
                    }

                    var touch = e.changedTouches[0]
                    var cx = touch.clientX
                    var cy = touch.clientY
                    var ds
                    that.currDirection = 0

                    if (that.isDrag || Math.abs((cx - that.startPoint.x) / (cy - that.startPoint.y)) > 1) {
                        that.currDirection = (cx - that.startPoint.x) / Math.abs(cx - that.startPoint.x)
                        that.startDirection = that.currDirection
                        that.showSlide = false
                        ds = Math.abs((cx - that.startPoint.x) / that.divWidth)
                        if (!that.isDrag) {
                            that.touchCount++
                            that.isDrag = true
                        }
                        if (that.currDirection < 0) {
                            that.isBack = false
                            page1.transform = 'translate(' + (cx - that.startPoint.x) + 'px,0)'
                            page1.opacity = 1 - ds
                            page2.transform = 'translate(0,' + (that.secondTy - that.tyDt * ds) + '%) scale(' + (that.secondScale + that.scaleDt * ds) + ',1)'
                            page2.opacity = that.secondOpacity + that.opacityDt * ds
                            page3.transform = 'translate(0,' + (that.thirdTy - that.tyDt * ds) + '%) scale(' + (that.thirdScale + that.scaleDt * ds) + ',1)'
                            page3.opacity = that.thirdOpacity - that.opacityDt * ds
                        } else {
                            that.isBack = true
                            page1.transform = 'translate(0,' + that.tyDt * ds + '%) scale(' + (1 - that.scaleDt * ds) + ',1)'
                            page1.opacity = 1 - that.opacityDt * ds
                            page2.transform = 'translate(0,' + (that.secondTy + that.tyDt * ds) + '%) scale(' + (that.secondScale - that.scaleDt * ds) + ',1)'
                            page2.opacity = that.secondOpacity - that.opacityDt * ds
                            if (that.startDirection > 0) {
                                pageLeft.transform = 'translate(' + (cx - that.startPoint.x - that.divWidth) + 'px,0)'
                                pageLeft.opacity = ds
                            } else {
                                pageRight.transform = 'translate(' + (cx - that.startPoint.x + that.divWidth) + 'px,0)'
                                pageRight.opacity = ds
                            }
                        }
                    }
                    that.refreshDataList()
                }
            },
            doTouchEnd (index, e) {
                var that = this
                if (index == 3 && that.total > 1) {
                    var dataList = that.dataList
                    var pageIndex = that.pageIndex
                    var page1 = dataList[pageIndex[1]]
                    var page2 = dataList[pageIndex[2]]
                    var page3 = dataList[pageIndex[3]]
                    var pageLeft = dataList[pageIndex['left']]
                    var pageRight = dataList[pageIndex['right']]

                    var touch = e.changedTouches[0]
                    var cx = touch.clientX
                    // var cy = touch.clientY
                    var ds

                    if (that.isDrag) {
                        ds = Math.abs((cx - that.startPoint.x) / that.divWidth)
                        // direction = (cx - that.startPoint.x) / Math.abs(cx - that.startPoint.x)
                        if (ds > 0.3) {
                            if (that.isBack) {
                                page1.transform = 'translate(0,' + that.secondTy + '%) scale(' + that.secondScale + ',1)'
                                page1.opacity = that.secondOpacity
                                page2.transform = 'translate(0,' + that.thirdTy + '%) scale(' + that.thirdScale + ',1)'
                                page2.opacity = that.thirdOpacity
                                page3.transform = 'translate(0,' + that.thirdTy + '%) scale(' + that.thirdScale + ',1)'
                                page3.opacity = 1

                                if (that.startDirection > 0) {
                                    pageLeft.transform = 'translate(0,0)'
                                    pageLeft.opacity = 1
                                } else {
                                    pageRight.transform = 'translate(0,0)'
                                    pageRight.opacity = 1
                                }
                            } else {
                                page1.transform = 'translate(' + (that.divWidth * that.direction) + 'px,0)'
                                page1.opacity = 0
                                page2.transform = 'translate(0,0) scale(1,1)'
                                page2.opacity = 1
                                page3.transform = 'translate(0,' + that.secondTy + '%) scale(' + that.secondScale + ',1)'
                                page3.opacity = that.secondOpacity
                            }
                            that.isNeedChange = true
                        } else {
                            page1.transform = 'translate(0,0)'
                            page1.opacity = 1
                            page2.transform = 'translate(0,' + that.secondTy + '%) scale(' + that.secondScale + ',1)'
                            page2.opacity = that.secondOpacity
                            page3.transform = 'translate(0,' + that.thirdTy + '%) scale(' + that.thirdScale + ',1)'
                            page3.opacity = that.thirdOpacity

                            if (that.isBack) {
                                if (that.startDirection > 0) {
                                    pageLeft.transform = 'translate(' + -that.divWidth + 'px,0)'
                                    pageLeft.opacity = 0
                                } else {
                                    pageRight.transform = 'translate(' + that.divWidth + 'px,0)'
                                    pageRight.opacity = 0
                                }
                            }
                        }

                        page1.transitionDuration = '200ms'
                        page2.transitionDuration = '200ms'
                        page3.transitionDuration = '200ms'
                        pageLeft.transitionDuration = '200ms'
                        pageRight.transitionDuration = '200ms'
                        that.isDrag = false
                    }
                    that.refreshDataList()
                }
            },
            doTransitionEnd (index, e) {
                var that = this
                if (index == 3 && that.total > 1) {
                    if (that.isCalled) {
                        return
                    }
                    that.isCalled = true
                    setTimeout(function () {
                        that.isCalled = false
                    }, 0)
                    var dataList = that.dataList
                    var pageIndex = that.pageIndex
                    var page1 = dataList[pageIndex[1]]
                    var page2 = dataList[pageIndex[2]]
                    var page3 = dataList[pageIndex[3]]
                    var pageLeft = dataList[pageIndex['left']]
                    var pageRight = dataList[pageIndex['right']]

                    page1.transitionDuration = '0ms'
                    page2.transitionDuration = '0ms'
                    page3.transitionDuration = '0ms'
                    pageLeft.transitionDuration = '0ms'
                    pageRight.transitionDuration = '0ms'

                    page1.transform = 'translate(0,0)'
                    page1.opacity = 1
                    page2.transform = 'translate(0,' + that.secondTy + '%) scale(' + that.secondScale + ',1)'
                    page2.opacity = that.secondOpacity
                    page3.transform = 'translate(0,' + that.thirdTy + '%) scale(' + that.thirdScale + ',1)'
                    page3.opacity = that.thirdOpacity

                    if (that.isBack) {
                        if (that.startDirection > 0) {
                            pageLeft.transform = 'translate(' + -that.divWidth + 'px,0)'
                            pageLeft.opacity = 0
                        } else {
                            pageRight.transform = 'translate(' + that.divWidth + 'px,0)'
                            pageRight.opacity = 0
                        }
                    }
                    that.refreshDataList()

                    if (that.isNeedChange) {
                        var startIndex = 0
                        if (that.isBack) {
                            that.currIndex = that.calcIndex(that.currIndex - 1)
                            if (!that.techs[that.calcIndex(that.currIndex - 2)]) { // 加载上一页内容
                                var lastPage = that.lastPage
                                that.queryData((lastPage + ((Math.ceil((that.currIndex + 1) / that.pageSize) - 1) % lastPage)) % lastPage).then(function () {
                                    // 缓存下次可能显示的图片
                                    that.loadImage(that.techs[that.calcIndex(that.currIndex - 2)])
                                })
                            } else {
                                that.loadImage(that.techs[that.calcIndex(that.currIndex - 2)])
                            }
                        } else {
                            that.currIndex = that.calcIndex(that.currIndex + 1)
                            // 加载未加载的内容
                            if (!that.techs[that.calcIndex(that.currIndex + 3)]) {   // 加载下一页的内容
                                that.queryData(Math.ceil((that.currIndex + 1) / that.pageSize) + 1).then(function () {
                                    // 缓存下次可能显示的图片
                                    that.loadImage(that.techs[that.calcIndex(that.currIndex + 3)])
                                })
                            } else {
                                that.loadImage(that.techs[that.calcIndex(that.currIndex + 3)])
                            }
                        }

                        that.currTech = that.techs[that.currIndex]
                        that.isCurrTechLike()
                        that.isCollected(that.techs[that.currIndex]).then(function (dataRes) {
                            that.currCollected = dataRes
                        })
                        startIndex = that.calcIndex(that.currIndex - 1)

                        that.showData(that.techs[startIndex], 'left')
                        that.showData(that.techs[startIndex], 'right')
                        for (var i = 1; i <= 3; i++) {
                            that.showData(that.techs[that.calcIndex(startIndex + i)], i)
                        }
                    }
                } else {
                    that.refreshDataList()
                }
            },
            doTouchMoveImgArea (e) {
                if (e.preventDefault) {
                    e.preventDefault()
                } else {
                    e.returnValue = false
                }
            },
            /**
             * 设置相应页数据
             */
            showData (data, page) {
                if (!data) {
                    return
                }
                var that = this
                var global = that.global
                var obj = that.dataList[that.pageIndex[page]]

                Vue.set(that.dataList, that.pageIndex[page], {
                    img: data.avatarUrl || global.defaultHeader,
                    techCode: data.serialNo || '无编号',
                    status: data.status,
                    techName: data.name,
                    service: that.handlerTechTags(data.techTags),
                    desc: data.description || '此技师暂无说明',
                    transform: obj.transform,
                    opacity: obj.opacity,
                    transitionDuration: obj.transitionDuration
                })
            },
            refreshDataList () {
                var that = this
                var item
                var dataList = that.dataList
                for (var k = 0; k < dataList.length; k++) {
                    item = dataList[k]
                    Vue.set(dataList, k, item)
                }
            },
            queryData (page) {
                var that = this
                var global = that.global
                that.currPage = page = page || 1

                return new Promise(function (resolve, reject) {
                    that.$http.get('../api/v2/club/{clubId}/technician/list', {
                        params: {
                            clubId: that.clubId,
                            itemId: that.currItemActiveId,
                            status: that.currItemActiveStatusStr,
                            page: page,
                            pageSize: that.pageSize
                        }
                    }).then(function (res) {
                        res = res.body
                        if (res.statusCode == 200) {
                            that.total = res.respData.total
                            if (page == 1) {
                                global.loading = false
                            }
                            that.showBgSelectScore = false
                            if (page == 1 && res.respData.technicians.length == 0) {
                                that.techs = []
                                that.total = 0
                                that.currIndex = 0
                                if (that.showFilter) {
                                    that.showBgSelectScore = true
                                    that.showFilter = false
                                } else {
                                    return that.goCount()
                                }
                            } else if (that.lastPage == 0) {
                                that.techs = new Array((res.pageCount - 1) * that.pageSize)
                                that.isLoadEnd = new Array(res.pageCount)
                                that.lastPage = res.pageCount
                            } else if (page == that.lastPage) {
                                that.techs = that.techs.concat(res.respData.technicians || [])
                                that.total = res.respData.total
                                that.currIndex = 0
                            } else {
                                that.techs = res.respData.technicians || []
                                that.total = res.respData.total
                            }

                            that.isLoadEnd[page] = true

                            var args = [(page - 1) * that.pageSize, that.pageSize]
                            Array.prototype.push.apply(args, res.respData.technicians || [])
                            Array.prototype.splice.apply(that.techs, args)
                            resolve()
                        } else {
                            Util.tipShow(res.msg || global.loadError)
                        }
                    }, function () {
                        reject()
                    })
                })
            },

            calcIndex (index) {
                var that = this
                return (that.techs.length + (index % that.techs.length)) % that.techs.length
            },

            /**
             * 点击收藏按钮的处理
             */
            doClickCollectBtn () {
                var that = this
                var global = that.global
                var currTech = that.currTech
                if (!global.isLogin) { // 跳转至登录
                    return Global.login(that.$router)
                }
                that.$http.get('../api/v2/profile/user/favorite/{ope}', {
                    params: {
                        ope: currTech.isColleced ? 'delete' : 'create',
                        id: currTech.id
                    }
                }).then(function () {
                    currTech.isColleced = !currTech.isColleced
                    that.currCollected = currTech.isColleced
                }, function () {
                    Util.tipShow('操作失败！')
                })
            },
            /**
             * 喜欢
             */
            doClickLikeBtn () {
                var that = this
                var k = 0
                var list = that.iLikeList
                var tech
                for (; k < list.length; k++) {
                    tech = list[k]
                    if (tech.id == that.currTech.id) {
                        list.splice(k, 1)
                        that.currLike = false
                        return
                    }
                }
                that.iLikeList.push(that.currTech)
                that.currLike = true
            },
            isCurrTechLike () {
                var that = this
                var tag = false
                that.iLikeList.forEach(function (item) {
                    if (item.id == that.currTech.id) {
                        tag = true
                    }
                })
                that.currLike = tag
                Vue.set(that.iLikeList, that.currLike)
            },
            /**
             * di
             */
            doClickILikeBtn () {
                let that = this
                Util.sessionStorage('item_appoint_tech_data', JSON.stringify(that.iLikeList))
                that.$router.push({name: 'ilike'})
            },
            /**
             * 判断技师是否已收藏
             */
            isCollected (tech) {
                var that = this
                var global = that.global
                return new Promise(function (resolve, reject) {
                    if (!global.isLogin) {
                        resolve(false)
                    }
                    if (typeof tech.isColleced == 'undefined') {
                        that.$http.get('../api/v2/profile/is_favorite/tech', {params: {techId: tech.id}}).then(function (res) {
                            res = res.body
                            if (res.statusCode == 200) {
                                res = res.respData
                                tech.isColleced = (res.isFavorite == 'Y')
                                resolve(tech.isColleced)
                            } else {
                                Util.tipShow('查询收藏状态出错！' + (res.msg || ''))
                                resolve(false)
                            }
                        }, function () {
                            resolve(false)
                        })
                    } else {
                        resolve(tech.isColleced)
                    }
                })
            },

            handlerTechTags (tags) {
                tags = tags || []
                var tempArr = []
                for (let i = 0; i < tags.length; i++) {
                    if (i < 3) {
                        tempArr.push(tags[i].tagName)
                    } else if (i == 3) {
                        tempArr.push('...')
                    }
                }
                if (tempArr.length == 0) {
                    tempArr.push('此技师暂无服务类型')
                }
                return tempArr
            },
            loadImage (data) {
                if (!data.imageLoaded) {
                    var img = new Image()
                    img.onload = function () {
                        data.imageLoaded = true
                    }
                    if (data.avatarUrl) {
                        img.src = data.avatarUrl
                    } else {
                        data.imageLoaded = true
                    }
                }
            },

            /**
             * 跳转到首页的计时
             */
            goCount () {
                var that = this
                that.timeCount--
                if (that.goTimer) {
                    clearTimeout(that.goTimer)
                }
                if (that.timeCount > 0) {
                    that.goTimer = setTimeout(function () {
                        that.goCount()
                    }, 1000)
                } else {
                    that.$router.push({path: '/' + that.clubId + '/home'})
                }
            },
            doClickShowServiceItemSelectArea () {
                this.showSelectScore = false
                this.showServiceItemSelectArea = !this.showServiceItemSelectArea
            },
            /**
             * 全部项目
             */
            doClickServiceItem (itemId, itemName, categoryName) {
                this.itemActiveId = itemId
                this.selectItemName = itemName
                this.selectedCategory = categoryName
            },
            doClickServiceStatus (str, itemStatus, itemName) {
                this.itemStatusStr = itemStatus
                this.selectItemStatusName = itemName
            },
            /**
             * 取消 确定
             */
            doClickServiceItemBtn (type) {
                var that = this
                if (type == 'ok') {
                    that.showFilter = true
                    that.currSelectedCategory = that.selectedCategory
                    that.currSelectItemName = that.selectItemName
                    that.currItemActiveId = that.itemActiveId
                    that.currItemActiveStatusStr = that.itemStatusStr
                    that.queryData(1).then(function () {
                        that.initPage()
                    })
                }
                that.showServiceItemSelectArea = false
            }
        },
        beforeDestroy () {
            var that = this
            if (that.goTimer) {
                clearTimeout(that.goTimer)
            }

            // save page status
            var cacheObj = {
                dataList: that.dataList,
                serviceItems: that.serviceItems,
                pageIndex: that.pageIndex,
                clubName: that.clubName,
                clubId: that.clubId,
                techs: that.techs,
                currTech: that.currTech,
                currPage: that.currPage,
                lastPage: that.lastPage,
                currIndex: that.currIndex,
                total: that.total,
                isLoadEnd: that.isLoadEnd,
                currCollected: that.currCollected,
                showPop: that.showPop,
                isBack: that.isBack,
                showSlide: that.showSlide,
                startDirection: that.startDirection,
                startPoint: that.startPoint,
                isDrag: that.isDrag,
                isNeedChange: that.isNeedChange,
                isCalled: that.isCalled,
                secondTy: that.secondTy,
                secondScale: that.secondScale,
                thirdTy: that.thirdTy,
                tyDt: that.tyDt,
                thirdScale: that.thirdScale,
                scaleDt: that.scaleDt,
                secondOpacity: that.secondOpacity,
                thirdOpacity: that.thirdOpacity,
                opacityDt: that.opacityDt,
                touchCount: that.touchCount,
                divWidth: that.divWidth,
                showBgSelectScore: that.showBgSelectScore,
                showSelectScore: that.showSelectScore, // 评论评分的下拉选择
                showServiceItemSelectArea: that.showServiceItemSelectArea, // 是否显示服务项目选择
                showFilter: that.showFilter,
                itemActiveId: that.itemActiveId,
                selectedCategory: that.selectedCategory, // 选中项目的分类
                selectItemName: that.selectItemName, // 选中的服务项目名
                currSelectedCategory: that.currSelectedCategory,
                currSelectItemName: that.currSelectItemName,
                currItemActiveId: that.currItemActiveId,
                currItemActiveStatusStr: that.currItemActiveStatusStr,
                itemStatusStr: that.itemStatusStr,
                selectItemStatusName: that.selectItemStatusName
            }
            Util.sessionStorage('appoint-tech-data', JSON.stringify(cacheObj))
        }
    }
</script>
