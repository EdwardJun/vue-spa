<style lang="sass">
    @import '../sass/page/home.scss';
</style>
<template>
    <div>
        <div class="page" id="home-page">
            <!--banner头部-->
            <div class="banner" v-show="displayHomeBanner">
                <swiper class="banner-swipe" :options="swiperOption">
                    <swiper-slide v-for="(pic, index) in bannerPics" :key="index">
                        <div :style="{ backgroundImage : 'url('+(pic.imageUrl || global.defaultBannerImgUrl )+')' }"></div>
                        <div :link="pic.link"></div>
                    </swiper-slide>
                    <div class="swiper-pagination" slot="pagination"></div>
                </swiper>
                <router-link :to="{ name : 'clubProfile' }" class="logo" tag="div">
                    <div v-if="global.clubLogoUrl" :style="{ backgroundImage : 'url('+global.clubLogoUrl+')' }"></div>
                    <div>{{ global.clubName }}</div>
                </router-link>
                <div class="collect" :class="{ act: isCollected }" @click="doClickCollectBtn()">{{ isCollected ? '已收藏' : '收藏' }}</div>
                <div class="address" :class="clubDist">
                    <router-link tag="div" :to="{ name: 'map' }">{{ clubDist }}</router-link>
                    <div @click="doClickContactClub()"></div>
                </div>
            </div>
            <router-link :to="{ name: 'clubChains', query: { id: chain.id }}" tag="div" class="club-chain" v-if="chain.id && chain.count">
                <div>查看全部<span>{{ chain.count }}</span>家门店</div>
            </router-link>
            <div class="journal" v-show="journal.id">
                <div>
                    <span @click="doClickJournal()">{{ journal.title }}</span>
                    <router-link :to="{ name: 'journalList' }">更多</router-link>
                </div>
            </div>
            <div class="recommend tech" :style="{order:bodySetting.tech.order}" v-if="techs.length>0 && displayRecommendTech && bodySetting.tech.isShow == 'Y'">
                <div class="title">
                    <div>{{bodySetting.tech.title}}</div>
                    <router-link :to="{ name: 'technicianList' }">更多</router-link>
                </div>
                <HomeTech :techs="techs"></HomeTech>
            </div>

            <div class="recommend act" :style="{order:bodySetting.act.order}" v-show="paidServiceItems.length>0 && bodySetting.act.isShow == 'Y'">
                <div class="title">
                    <div>{{bodySetting.act.title}}</div>
                    <router-link :to="{ name: 'activities' }">更多</router-link>
                </div>
                <template v-for="(item,index) in paidServiceItems">
                    <PaidServiceAct v-if="item.actType == 'paid_item'" :act-data="item" :key="index"></PaidServiceAct>
                    <OneYuanAct v-if="item.actType && item.actType == 'one_yuan' && item.status != 'complete'" :act-data="item" :key="index"></OneYuanAct>
                </template>
            </div>

            <div class="recommend itemCard" :style="{order:bodySetting.itemCard.order}" v-show="itemCards.length>0 && displayDiscountMall && bodySetting.itemCard.isShow == 'Y'">
                <div class="title">
                    <div>{{bodySetting.itemCard.title}}</div>
                    <router-link :to="{ name: 'discountMall' }">更多</router-link>
                </div>
                <ul class="clear-fix">
                    <ItemCard v-for="(item, index) in itemCards" :tag="true" :card-data="item" :key="index"></ItemCard>
                </ul>
            </div>

            <div class="recommend service" :style="{order:item.position}" v-if="item.isShow == 'Y'" v-for="item in serviceItems" v-show="item.itemList.length>0">
                <div class="title">
                    <div>{{ item.categoryBean.name || '推荐项目' }}</div>
                    <router-link :to="{ name: 'serviceList', query: { id: item.categoryBean.id } }">更多</router-link>
                </div>
                <div>
                    <router-link tag="div" class="item" :to="{ name: 'serviceItem', query: {top: '1', id: service.id, categoryId: item.categoryBean.id } }" v-for="service in item.itemList" :key="service.id">
                        <div :style="{ backgroundImage : 'url('+(service.coverUrl || global.defaultServiceItemImgUrl)+')' }" :class="{ 'recommend-label' : service.recommended=='Y' }">
                            <div>{{ service.name }}</div>
                        </div>
                        <div :class="service.id">
                            <div v-show="service.price"><span>¥</span>{{ service.price }}</div>
                            <div v-show="service.price">{{ service.duration }}<span>{{ service.durationUnit || '分钟' }}</span></div>
                        </div>
                    </router-link>
                </div>
            </div>
        </div>

        <!--抢优惠按钮-->
        <router-link class="home-coupon" :to="{ name: 'activities' }" tag='div' v-show="!global.loading">
            <div></div>
            <span>抢优惠</span>
        </router-link>

        <!--coupon的弹窗-->
        <div id="home-red-pack" class="pop-modal" v-if="popActType == 'coupon'" :class="{ active : showPopCoupon }">
            <div @click="doClickPopCoupon()">
                <div :class="popCouponActCls">
                    <div>{{ popActData.activityName }}</div>
                </div>
            </div>
            <div @click="doClickPopCoupon()">领取红包</div>
            <div @click="doClosePopCoupon()"></div>
        </div>

        <!--其他活动的弹窗-->
        <ActivityPop v-if="popActType != 'coupon'" :act-data="popActData"></ActivityPop>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import eventHub from '../libs/hub'
    import ActivityPop from '../components/activity-pop'
    import ItemCard from '../components/item-card'
    import PaidServiceAct from '../components/paid-service-act'
    import OneYuanAct from '../components/one-yuan-act'
    import HomeTech from '../components/home-tech'
    import Util from '../libs/util'

    let serviceItemConfig = {}
    export default {
        components: {
            ActivityPop, ItemCard, PaidServiceAct, OneYuanAct, HomeTech
        },
        data () {
            return {
                global: Global.data,
                bannerPics: [],
                serviceItems: [],
                techs: [],
                paidServiceItems: [],
                isCollected: false, // 是否已收藏
                clubDist: '定位中...', // 与会所的距离
                popActType: '', // 弹窗类型
                popActData: {}, // 弹窗数据
                popCouponActCls: '',
                showPopCoupon: false,
                journal: {
                    id: '', title: '', templateId: 1
                },
                chain: { // 连锁店
                    id: '', name: '', count: ''
                },
                itemCards: [], // 次卡数据

                // 定位信息
                bodySetting: {
                    tech: {},
                    act: {},
                    itemCard: {}
                },
                swiperOption: { // banner图
                    autoplay: '',
                    pagination: '.swiper-pagination',
                    paginationClickable: true,
                    loop: true,
                    autoplayDisableOnInteraction: false,
                    observeParents: true,
                    onInit (swiper) {
                        setTimeout(function () {
                            swiper.reLoop()
                            swiper.slideNext(null, 0)
                        }, 500)
                    },
                    onTap (swiper) {
                        var link = swiper.clickedSlide.querySelector('div:nth-of-type(2)').getAttribute('link')
                        if (link) { // banner是一个链接
                            location.href = link
                        }
                    }
                }
            }
        },
        computed: {
            displayHomeBanner () {
                return Global.checkAccess('display_banner', false)
            },
            displayRecommendTech () {
                return Global.checkAccess('display_recommend_tech', false)
            },
            displayDiscountMall () {
                return Global.checkAccess('itemCardMall', false)
            }
        },
        watch: {
            // 应用会所设置
            'global.clubHomeConfig' (newval, old) {
                if (newval.home_module) {
                    this.doHandlerClubHomeConfig()
                }
            }
        },
        created () {
            let that = this
            let global = that.global
            let ss = Util.sessionStorage
            let cacheDataStr = ss('club-home-data')
            let cacheData = cacheDataStr ? JSON.parse(cacheDataStr) : null

            // 从缓存加载数据
            if (cacheData && cacheData.clubId == global.clubId) {
                that.bannerPics = cacheData.bannerPics
                that.serviceItems = cacheData.serviceItems
                that.techs = cacheData.techs
                that.chain = cacheData.chain
                that.paidServiceItems = cacheData.paidServiceItems
                that.isCollected = cacheData.isCollected
                that.journal = cacheData.journal
                that.itemCards = cacheData.itemCards
                setTimeout(() => {
                    document.body.scrollTop = cacheData.scrollTop
                    that.global.loading = false
                    if (that.global.pageMode == 'club') {
                        eventHub.$emit('do-show-service-btn')
                    }
                }, 100)
            }

            // 初始化首页设置
            if (global.clubHomeConfig.home_module) {
                that.doHandlerClubHomeConfig()
            }

            // 请求主页数据
            that.$http.get('../api/v2/club/{clubId}/homeData', {params: {clubId: global.clubId}}).then(res => {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    let clubInfo = res.club
                    global.clubLogoUrl = clubInfo.imageUrl || global.defaultClubLogo
                    global.clubName = clubInfo.name
                    document.title = global.clubName
                    global.clubTelephone = clubInfo.telephone ? clubInfo.telephone.split(',') : []
                    that.bannerPics = res.sliderPic
                    // that.serviceItems = res.serviceItems
                    that.techs = res.techs
                    let chain = that.chain
                    chain.id = clubInfo.chainId
                    chain.name = clubInfo.chainName
                    chain.count = clubInfo.chainClubCount

                    // 用户定位
                    // let clubDistance = Util.sessionStorage('club-distance-' + global.clubId)
                    // if (clubDistance) { // 从session中获取距离
                    //     that.clubDist = Util.distanceFormat(clubDistance)
                    // } else {
                    //      if (!global.currLngx || !global.currLaty) {
                    //         Util.getLocation(function (position) {
                    //             let coords = position.coords
                    //             if (coords.longitude && coords.latitude) {
                    //                 global.currLngx = coords.longitude
                    //                 global.currLaty = coords.latitude
                    //             } else {
                    //                 global.currLngx = ''
                    //                 global.currLaty = ''
                    //             }
                    //             that.setLocation(clubInfo)
                    //         }, function () {
                    //             that.setLocation(clubInfo)
                    //         })
                    //     } else {
                    //         that.setLocation(clubInfo)
                    //     }
                    // }
                    that.queryClubDist()
                    // 用户是否已收藏会所
                    that.isCollected = res.isUserFavoriteClub

                    if (res.journal) {
                        that.journal = res.journal
                    }

                    global.loading = false
                    if (global.pageMode == 'club') {
                        eventHub.$emit('do-show-service-btn')
                    }
                } else {
                    Util.tipShow(global.loadError)
                }
            }, function () {
                Util.tipShow(global.loadError)
            })

            // 请求弹窗数据
            that.$http.get('../api/v2/club/popup/get', {params: {clubId: global.clubId}}).then(popRes => {
                popRes = popRes.body
                if (popRes.statusCode == 200) {
                    popRes = popRes.respData
                    if (!popRes) {
                        return
                    }
                    // 上次的弹窗数据
                    var lastPopInfo = Util.localStorage('pastPopInfo_' + global.clubId)
                    if (lastPopInfo) {
                        lastPopInfo = JSON.parse(lastPopInfo)
                    }
                    // 是否弹窗
                    if (!lastPopInfo || lastPopInfo.id != popRes.id || (lastPopInfo.id && lastPopInfo.time && (+new Date()) - new Date(lastPopInfo.time) > 24 * 3600 * 1000)) {
                        Util.localStorage('pastPopInfo_' + global.clubId, JSON.stringify({
                            id: popRes.id,
                            time: (+new Date())
                        }))
                        that.popActType = popRes.activityType
                        if (that.popActType == 'coupon') { // 优惠券
                            let len = that.computedWords(popRes.activityName)
                            if (len > 10) {
                                if (len <= 12) {
                                    that.popCouponActCls = 'spec-6'
                                } else if (len <= 14) {
                                    that.popCouponActCls = 'spec-7'
                                } else if (len <= 16) {
                                    that.popCouponActCls = 'spec-8'
                                } else {
                                    that.popCouponActCls = 'two-line'
                                    if (len >= 32) {
                                        popRes.activityName = popRes.activityName.substr(0, 14) + '...'
                                    }
                                }
                            }
                            that.popActData = popRes
                            that.showPopCoupon = true
                        } else {
                            that.popActData = popRes
                            eventHub.$emit('change-activity-pop', true)
                        }
                    }
                }
            })

            // 抢购项目数据
            that.$http.get('../api/v2/club/recommend/list', {
                params: {
                    clubId: global.clubId,
                    businessCategory: 'hot_activity'
                }
            }).then(paidItemRes => {
                paidItemRes = paidItemRes.body
                if (paidItemRes.statusCode == 200) {
                    paidItemRes = paidItemRes.respData || {}
                    let actList = []
                    let actItem
                    let splitIndex
                    let itemIndex
                    let itemActType
                    for (let paidItemKey in paidItemRes) {
                        actItem = paidItemRes[paidItemKey]
                        splitIndex = paidItemKey.lastIndexOf('_')
                        itemIndex = paidItemKey.substr(splitIndex + 1) - 1
                        itemActType = paidItemKey.substr(0, splitIndex)
                        if (itemActType == 'paid_service_item') {
                            itemActType = 'paid_item'
                        }
                        actItem.actType = itemActType
                        if (/^(paid_item|one_yuan)$/.test(itemActType)) {
                            actList[itemIndex] = actItem
                        }
                    }
                    that.paidServiceItems = actList
                }
            })

            // 次卡数据
            that.$http.get('../api/v2/club/recommend/list', {
                params: {
                    clubId: global.clubId,
                    businessCategory: 'discount_mall'
                }
            }).then(itemCardRes => {
                itemCardRes = itemCardRes.body
                if (itemCardRes.statusCode == 200) {
                    itemCardRes = itemCardRes.respData || {}
                    let cardList = []
                    let cardItemKey
                    let cardItem
                    let splitIndex
                    for (cardItemKey in itemCardRes) {
                        cardItem = itemCardRes[cardItemKey]
                        splitIndex = cardItemKey.lastIndexOf('_')
                        cardList[cardItemKey.substr(splitIndex + 1) - 1] = cardItem
                    }
                    that.itemCards = cardList
                }
            })

            // clear cache data
            if (cacheData) {
                Util.removeSessionStorage('club-home-data')
            }
        },
        methods: {
            doHandlerClubHomeConfig () {
                let that = this
                let homeModule = that.global.clubHomeConfig.home_module
                that.swiperOption.autoplay = Global.data.clubHomeConfig.bannerPlaySwitch == 'Y' ? '5000' : ''
                homeModule.forEach(item => {
                    switch (item.code) {
                    case 'techRecommend':
                        that.bodySetting.tech = {
                            order: item.position,
                            isShow: item.isShow,
                            title: item.title
                        }
                        break
                    case 'hotActivity':
                        that.bodySetting.act = {
                            order: item.position,
                            isShow: item.isShow,
                            title: item.title
                        }
                        break
                    case 'discountMall':
                        that.bodySetting.itemCard = {
                            order: item.position,
                            isShow: item.isShow,
                            title: item.title
                        }
                        break
                    default:
                        if (/^service_/.test(item.code)) {
                            serviceItemConfig[item.code.substr(8)] = item
                        }
                    }
                })
                that.getRecommendServiceItems()
            },
            /**
             * 获取推荐的服务项目数据
             * @return
             */
            getRecommendServiceItems () {
                let that = this
                let global = that.global
                that.$http.get('../api/v1/club/category/getRecommendCategoryItem', {params: {clubId: global.clubId}}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        let serviceItems = res.respData || []
                        let config
                        serviceItems.forEach(item => {
                            let id = item.categoryBean.id
                            if (serviceItemConfig[id]) {   // 匹配需要显示的服务项目
                                config = serviceItemConfig[item.categoryBean.id]
                                item.position = config.position
                                item.isShow = config.isShow
                            }
                        })
                        serviceItems.sort(function (itemA, itemB) {
                            return itemA.position > itemB.position ? 1 : -1
                        })
                        that.serviceItems = serviceItems
                    }
                })
            },

            /**
             * 点击banner上电话图标
             * @return
             */
            doClickContactClub () {
                let that = this
                if (!Global.checkAccess('tip_telephone')) {
                    return Util.tipShow('会所未开通此功能！')
                }
                if (that.global.clubTelephone.length == 0) {
                    Util.tipShow('暂无会所电话！')
                } else {
                    eventHub.$emit('change-tel-detail', true)
                }
            },

            /**
             * 跳转到电子期刊页面
             * @return
             */
            doClickJournal () {
                let that = this
                let journal = that.journal
                location.href = that.global.prefixPathname.replace('/spa/', '/journal/') + '#/' + journal.templateId + '/?id=' + journal.id
            },

            /**
             * 查询用户与会所的距离
             * @return
             */
            queryClubDist () {
                let that = this
                let global = that.global
                that.$http.get('../api/v1/position/club/distance', {
                    params: {
                        clubId: global.clubId,
                        lat: global.currLaty || '',
                        lon: global.currLngx || ''
                    }
                }).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        let dist = ''
                        if (res.respData && res.respData.distance) {
                            dist = res.respData.distance
                            if (dist / 1000 > 1) {
                                dist = (dist / 1000).toFixed(1) + ' km'
                            } else {
                                dist = dist.toFixed(0) + ' m'
                            }
                        } else {
                            dist = '定位失败'
                        }
                        that.clubDist = dist
                    }
                })
            },

            /**
             * 点击收藏按钮
             * @return
             */
            doClickCollectBtn () {
                let that = this
                let global = that.global
                if (!global.isLogin) {
                    return Global.login(that.$router)
                }
                that.$http.get('../api/v2/profile/user/favorite/club/' + (that.isCollected ? 'delete' : 'save'), {params: {clubId: global.clubId}}).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.isCollected = !that.isCollected
                    } else {
                        Util.tipShow(res.msg || '操作失败！')
                    }
                })
            },
            /**
             * 计算字符串的长度，汉字长度算做2
             * @return len
             */
            computedWords (words) {
                let len = 0
                let a
                for (let i = 0; i < words.length; i++) {
                    a = words.charAt(i)
                    if (a.match(/[\u4E00-\u9FFF]/ig) != null) len += 2
                    else len += 1
                }
                return len
            },

            /**
             * 点击优惠券弹窗
             * @return
             */
            doClickPopCoupon () {
                let that = this
                location.href = that.global.prefixPathname.replace('/spa/', '/coupons/') + '#home&actId=' + that.popActData.activityId + '&chanel=index&clubId=' + that.global.clubId
            },

            /**
             * 关闭优惠券弹窗
             * @return
             */
            doClosePopCoupon () {
                this.showPopCoupon = false
            }
        },

        /**
         * 页面跳转之前缓存数据
         * @return
         */
        beforeDestroy () {
            let ss = Util.sessionStorage
            let that = this
            let global = that.global
            let cacheData = {
                clubId: global.clubId,
                bannerPics: that.bannerPics,
                serviceItems: that.serviceItems,
                techs: that.techs,
                chain: that.chain,
                paidServiceItems: that.paidServiceItems,
                isCollected: that.isCollected,
                journal: that.journal,
                itemCards: that.itemCards,
                scrollTop: global.bodyScrollTop // 滚动条的位置
            }
            ss('club-home-data', JSON.stringify(cacheData))
        }
    }
</script>
