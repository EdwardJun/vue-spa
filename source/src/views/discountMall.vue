<style lang="sass">
    @import '../sass/page/discountMall.scss';
</style>
<template>
    <div class="discount-mall-page-wrap">
        <div class="page" id="discount-mall-page">
            <div class="search-wrap">
                <input type="input" maxlength="30" @keypress.enter="doSearch()" placeholder="搜索" v-model="searchVal"/>
                <div @click="doShowSelector()">选项目</div>
                <a class="search-icon" @click="doSearch()"></a>
            </div>
            <div class="nullData" v-show="noData">
                <div></div>
                <div>暂无内容...</div>
            </div>
            <!--Tab栏-->
            <ul class="tab" v-show="isAll && !noData" :class="'act_' + currTab">
                <li @click="doSwitchTab(1)">单项次卡</li>
                <li @click="doSwitchTab(2)">超值套餐</li>
                <li @click="doSwitchTab(3)">积分礼品</li>
            </ul>
            <div class="result-list" v-show="!noData" :class="{ 'no-more': !showMoreList && !isAll }"
                 :style="{ height: contentHeight + 'rem' }" ref="list">
                <div class="tip" v-show="showTip" v-html="tipStr"></div>

                <!--搜索结果 次卡数据列表-->
                <ul class="clear-fix res-card" v-show="!isAll">
                    <item-card v-for="(item,itemIndex) in resCards" :key="itemIndex" :tag="true" :card-data="item" :tech-id="techId"></item-card>
                </ul>
                <div class="more-tip" v-show="showMoreTip && !isAll">{{ moreTipStr }}</div>

                <!--全部次卡或者更多次卡-->
                <div class="zone-title item-card" v-show="isAll || itemCards.length>0">
                    <div></div>
                    单项次卡
                </div>
                <ul class="item-card clear-fix" v-show="isAll || itemCards.length>0">
                    <item-card v-for="(item,itemIndex) in itemCards" :key="itemIndex" :tag="false" :card-data="item" :tech-id="techId"></item-card>
                </ul>
                <div class="zone-title package-card" v-show="isAll || packageCards.length>0">
                    <div></div>
                    超值套餐
                </div>
                <ul class="package-card clear-fix" v-show="isAll || packageCards.length>0">
                    <item-card v-for="(item,itemIndex) in packageCards" :key="itemIndex" :tag="false" :card-data="item" :tech-id="techId"></item-card>
                </ul>
                <div class="zone-title credit-card" v-show="isAll || creditCards.length>0">
                    <div></div>
                    积分礼品
                </div>
                <ul class="credit-card clear-fix" v-show="isAll || creditCards.length>0">
                    <item-card v-for="(item,itemIndex) in creditCards" :key="itemIndex" :tag="false" :card-data="item" :tech-id="techId"></item-card>
                </ul>
            </div>
        </div>
        <router-link class="submit-button footer" :to="{name: 'serviceList'}" tag="div">查看全部项目</router-link>

        <div class="service-item-selector" :class="{ active: showSelectorPop }">
            <div class="pop-content">
                <ul class="clear-fix">
                    <li :class="{ active : currSelectServiceItemId=='' }" @click="doSelectServiceItem('','全部项目')">全部项目
                    </li>
                </ul>
                <div class="service-list" v-for="(serviceItem,sindex) in serviceItems" :key="sindex" v-show="serviceItem.serviceItems.length>0">
                    <div>{{ serviceItem.name }}</div>
                    <ul class="clear-fix">
                        <li v-for="item in serviceItem.serviceItems" :key="item.id" :class="{ active: currSelectServiceItemId==item.id }" @click="doSelectServiceItem(item.id, item.name)">{{ item.name }}</li>
                    </ul>
                </div>
            </div>
            <div class="btn-wrap">
                <div @click="doCancel()">取消</div>
                <div @click="doConfirm()">确定</div>
            </div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import itemCard from '../components/item-card'

    export default {
        components: {
            'item-card': itemCard
        },
        data () {
            return {
                global: Global.data,
                clubId: '',
                noData: false,
                tipStr: '',
                showTip: false,
                searchVal: '',
                selectedItem: null,
                showSelectorPop: false,
                allCards: [],
                resCards: [],
                itemCards: [],
                techId: '',
                packageCards: [],
                creditCards: [],
                isAll: true, // 全部显示状态
                initHeight: 0,

                showMoreTip: false,
                moreTipStr: '更多',
                showMoreList: false,
                contentHeight: 0, // 内容区域的高度
                isScrollerOver: true, // 滚动是否结束
                listPosArr: [0, 0, 0, 0], // 记住列表区域的位置
                currTab: 1, // 当前选中的tab

                serviceItems: [],
                currSelectServiceItemId: '', // 当前选择的服务项目ID
                currSelectServiceItemName: '全部项目' // 当前选择的服务项目名称
            }
        },
        created () {
            let that = this
            let global = that.global
            let query = global.currPage.query
            let ss = Util.sessionStorage

            document.title = Global.setPageTitle('discountMall') || '特惠商城'
            if (query.clubsource) {
                ss('techId', query.techId)
                ss('qrcodeType', query.clubsource)
            }
            that.techId = query.techId || ''
            that.clubId = query.clubId || global.clubId || ''
            if (!that.clubId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            // 查询服务项目数据
            that.$http.get('../api/v2/club/category/service/list', {params: {clubId: that.clubId}}).then(function (res) {
                res = res.body
                if (res.statusCode == 200) {
                    that.serviceItems = res.respData || []
                }
            })
            that.query()
            that.initHeight = global.winHeight / (16 * global.winScale)
            that.contentHeight = that.initHeight - 11.1233
            global.loading = false
        },
        methods: {
            /**
             * 查询数据
             * @return
             */
            query () {
                let that = this
                let selectedItemName = that.currSelectServiceItemName

                that.$http.post('../api/v2/club/item_card/activity/list', {
                    clubId: that.clubId,
                    itemId: that.currSelectServiceItemId,
                    itemName: that.searchVal,
                    pageSize: 100, // 忽略分页
                    page: 1
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        let activityList = res.activityList || []
                        let resCards = []
                        let itemCards = []
                        let packageCards = []
                        let creditCards = []
                        let splitCards = []

                        if (that.currSelectServiceItemId == '' && that.searchVal == '') {
                            that.allCards = activityList
                            that.isAll = true
                            splitCards = activityList
                            resCards = []
                            that.contentHeight = that.initHeight - 11.1233
                            that.currTab = 1
                        } else {
                            that.isAll = false
                            splitCards = []
                            resCards = activityList
                            that.allCards.forEach(function (card) {
                                if (!that.inResultList(card.id, resCards)) {
                                    splitCards.push(card)
                                }
                            })
                            that.contentHeight = that.initHeight - 8.32329
                        }

                        // 分割3个类型的次卡列表
                        if (splitCards.length > 0) {
                            splitCards.forEach(function (listItem) {
                                if (listItem.cardType == 'item_card') {
                                    itemCards.push(listItem)
                                } else if (listItem.cardType == 'item_package') {
                                    packageCards.push(listItem)
                                } else {
                                    creditCards.push(listItem)
                                }
                            })
                        }

                        // 赋值
                        that.resCards = resCards
                        that.itemCards = itemCards
                        that.packageCards = packageCards
                        that.creditCards = creditCards

                        if (that.searchVal || (selectedItemName && selectedItemName != '全部项目')) {
                            if (activityList.length > 0) {
                                that.tipStr = '以下是包含“<span>' + (that.searchVal || selectedItemName) + '”</span>项目的优惠'
                            } else {
                                that.tipStr = '没有“<span>' + (that.searchVal || selectedItemName) + '</span>”相关的次卡，看看其它吧~'
                            }
                            that.showTip = true
                        } else {
                            that.showTip = false
                        }

                        that.noData = (that.allCards.length == 0)
                        if (that.currSelectServiceItemId == '' && that.searchVal == '') {
                            that.showMoreTip = false
                            // that.showMoreList = false
                        } else {
                            if (splitCards.length == 0) {
                                that.moreTipStr = '没有更多了~'
                                that.showMoreTip = true
                                that.showMoreList = false
                            } else {
                                that.moreTipStr = '更多'
                                that.showMoreTip = true
                                that.showMoreList = true
                            }
                        }

                        // 获取位置
                        let listEl = that.$refs.list
                        let ul = listEl.querySelectorAll('ul')
                        setTimeout(function () {
                            ul.forEach(function (ulItem, i) {
                                that.listPosArr[i] = ulItem.offsetTop
                            })
                        }, 500)
                    }
                })
            },

            /**
             * 搜索
             * @return
             */
            doSearch () {
                this.query()
            },

            /**
             * 切换服务项目筛选窗口的显示
             * @return
             */
            doShowSelector () {
                this.showSelectorPop = !this.showSelectorPop
            },

            /**
             * 选择服务项目
             * @return
             */
            doSelectServiceItem (serviceItemId, serviceItemName) {
                this.currSelectServiceItemId = serviceItemId
                this.currSelectServiceItemName = serviceItemName
            },

            /**
             * 筛选窗口点击取消
             * @return
             */
            doCancel () {
                this.showSelectorPop = false
            },

            /**
             * 筛选窗口点击确定
             * @return
             */
            doConfirm () {
                var that = this
                that.query()
                that.showSelectorPop = false
            },

            /**
             * 判定cardId是否在resList里面
             * @return
             */
            inResultList (cardId, resList) {
                for (let j = 0; j < resList.length; j++) {
                    if (resList[j].id == cardId) {
                        return true
                    }
                }
                return false
            },

            /**
             * tab切换
             * @param tabIndex
             */
            doSwitchTab (tabIndex) {
                let that = this
                if (that.currTab != tabIndex) {
                    that.currTab = tabIndex
                    let dy = that.listPosArr[tabIndex]
                    let el = that.$refs.list
                    let y0 = that.listPosArr[1]
                    let destPos
                    if (el.scrollHeight - (dy - y0) > el.offsetHeight) {
                        destPos = dy - y0 // 滚动到相应位置
                    } else {
                        destPos = el.scrollHeight - el.offsetHeight // 滚动到底部
                    }
                    if (that.isScrollerOver) {
                        that.isScrollerOver = false
                        that.scrollTo(destPos)
                    } else {
                        that.isScrollerOver = true
                        setTimeout(function () {
                            that.isScrollerOver = false
                            that.scrollTo(destPos)
                        }, 30)
                    }
                }
            },

            /**
             * 区域滚动
             * @param y
             * @param acceleration
             * @param stime
             */
            scrollTo (y, acceleration, stime) {
                let that = this
                let el = that.$refs.list
                acceleration = acceleration || 0.1
                stime = stime || 10
                let y2 = el.scrollTop || 0
                let deltY = y - y2
                let speeding = 1 + acceleration

                // console.log("目标位置：", y, "当前位置：", y2, "滚动位置：", y2 + (deltY - Math.floor(deltY / speeding)))
                // 滚动距离 = 目前距离 / 速度, 因为距离原来越小, 速度是大于 1 的数, 所以滚动距离会越来越小
                speeding = deltY / speeding
                el.scrollTop = y2 + (deltY - (speeding > 0 ? Math.floor(speeding) : Math.ceil(speeding)))
                // console.log("el.scrollTop", el.scrollTop, Math.abs(y))

                if (Math.abs(deltY) > 0 && !that.isScrollerOver) {
                    setTimeout(function () {
                        that.scrollTo(y)
                    }, stime)
                }
            }
        }
    }
</script>
