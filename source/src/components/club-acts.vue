<!--会所下面的活动-->
<style lang="sass">
    @import '../sass/components/clubActs.scss';
</style>
<template>
    <div class="club-acts-wrap">
        <!--标题区域-->
        <div class="club-info loading-process-bar" v-show="showClubTitle">
            <div>
                <div :style="{ 'background-image' : 'url('+(clubData.imageUrl || global.defaultClubLogo)+')' }"></div>
                <div>{{ clubData.name }}</div>
            </div>
            <div>
                <div>&nbsp;</div>
                <div>{{ clubData.actCount }}活动</div>
                <div v-if="clubData.actCount" @click="doClickOpenBtn()" :class="{ open: isOpen }"></div>
            </div>
        </div>
        <!--内容区域-->
        <div class="content-area" v-show="isOpen">
            <!--拼团活动-->
            <div class="group-buy-area m-b-16" v-show="groupBuy.dataList.length>0" :class="{ 'has-more': groupBuy.hasMore }">
                <div class="item-header loading-process-bar b-b">
                    <div><div>拼团活动</div></div>
                </div>
                <div class="group-buy-list">
                    <GroupBuyAct v-for="(item, index) in groupBuy.dataList" :key="index" :act-data="item" v-show="!(index>=groupBuy.firstPageSize && groupBuy.isPullUp)"></GroupBuyAct>
                </div>
                <div class="item-more loading-process-bar" @click="doClickMoreBtn('groupBuy')" :class="{ expanded : groupBuy.isOver && !groupBuy.isPullUp, oneLine: groupBuy.isOver && groupBuy.isPullUp, 'process-active': groupBuy.inLoading }">
                    <div>{{ groupBuy.isOver && !groupBuy.isPullUp ? '收起' : '更多展开' }}</div>
                    <div></div>
                </div>
            </div>
            <!--买单有礼-->
            <div class="fast-pay-area m-b-16" v-show="fastPayPackage.dataList.packageList"  :class="{'has-more': fastPayPackage.hasMore}">
                <div class="item-title">
                    <span></span>
                    <div>你买单，我就送</div>
                    <i @click="doClickHelp()">?</i>
                </div>
                <div >
                    <ul v-for="(act, index) in fastPayPackage.dataList.packageList" :key="index" v-show="index <= currItemIndex">
                        <li class="item-pay-gift">
                            <span>满{{ act.amount / 100 }}元送</span>
                            <div>
                                <div v-for="(item,itemIndex) in act.packageItems" :key="itemIndex">{{item.type==0 ? item.count+item.itemName : item.itemName + ' * ' + item.count}}</div>
                            </div>
                        </li>
                    </ul>
                </div>
                <div class="item-more loading-process-bar" @click="doClickMoreBtn('fastPayPackage', giftLoad)" :class="{ expanded : giftLoad }" v-show="fastPayPackage.dataList.packageList.length > 1" v-if="fastPayPackage.dataList.packageList">
                    <div>{{ giftLoad ? '点击收起' : '查看全部'+fastPayPackage.dataList.packageList.length+'个优惠' }}</div>
                    <div></div>
                </div>
            </div>
            <!--优惠券-->
            <div class="coupons-area m-b-16" v-show="coupons.length>0">
                <div class="item-header m-b-16">
                    <div><div>优惠券</div></div>
                </div>

                <div class="item-coupon">
                    <div class="item-container">
                        <div class="item-data1" v-for="(coupon,cindex) in coupons" v-show="coupon.couponType!='paid'" :key="cindex">
                            <div class="coupon-left" :class="coupon.couponType" v-show="coupon.couponType!='gift'" >
                                <div v-show="coupon.couponType!='gift'">
                                    <span v-show="coupon.couponType!='discount'">￥</span><span>{{ coupon.amount / 100 }}</span><span v-show="coupon.couponType=='discount'">&nbsp;&nbsp;折</span>
                                </div>
                                <div v-show="coupon.couponType!='gift'">{{ coupon.couponTypeName }}</div>
                            </div>
                            <div class="coupon-left" :class="coupon.couponType" v-show="coupon.couponType=='gift'" :style="{ 'background-image': 'url('+(coupon.imageUrl ? coupon.imageUrl:global.defaultServiceItemImgUrl)+')' }">
                                <div v-show="coupon.couponType!='gift'">
                                    <span v-show="coupon.couponType!='discount'">￥</span>
                                    <span>{{ coupon.amount / 100 }}</span>
                                </div>
                                <div v-show="coupon.couponType!='gift'">{{ coupon.couponTypeName }}</div>
                            </div>
                            <div class="coupon-right">
                                <ul><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>
                                <div :class="coupon.couponType+'1'" class="item-count">
                                    <div>{{ coupon.title }}</div>
                                    <div v-show="coupon.couponType=='paid'">抵{{ coupon.oriAmount / 100 }}元</div>
                                    <div v-show="coupon.couponType=='cash'">{{ coupon.oriAmount==0 ? '直减'+(coupon.amount/100)+'元' : '满'+(coupon.oriAmount/ 100)+'元可用' }}</div>
                                    <div v-show="coupon.couponType=='money'">{{ coupon.oriAmount==0 ? '直减'+(coupon.amount/100)+'元' : '满'+(coupon.oriAmount/ 100)+'元可用' }}</div>
                                    <div v-show="coupon.couponType=='cash'&&coupon.oriAmount<=0"></div>
                                    <div v-show="coupon.couponType=='discount'">{{ coupon.oriAmount==0 ? '打'+(coupon.amount/100)+'折' : '满'+(coupon.oriAmount/ 100)+'元可用' }}</div>
                                    <div v-show="coupon.couponType=='coupon'">原价{{ coupon.oriAmount / 100 }}元</div>
                                    <div v-show="coupon.couponType=='gift'">{{ coupon.subTitle }}</div>
                                    <div>{{ coupon.couponPeriod }}</div>
                                    <!--<div v-show="coupon.period == ''">券有效期：<span v-if="coupon.useStartTime">{{ coupon.useStartTime }}-{{coupon.useEndTime}}</span> <span v-else>长期有效</span></div>-->
                                </div>
                                <span class="item-circle" v-show="coupon.status!='1'">
                                    <i>描述</i>
                                </span>
                                <!--:class="coupon.obtainedStatus" -->
                                <div :class="coupon.obtainedStatus" class="no-border">
                                    <!--:class="{ 'disabled': coupon.getFlag == 'already_get' || coupon.getFlag == 'finish_get' }"-->
                                    <div id="sure-btn" :class="[coupon.couponType+'2', { 'disabled': coupon.obtainedStatus == 'already_get' || coupon.obtainedStatus == 'finish_get' }]"  @click="doClickGetCouponBtn(coupon, $event)">{{ coupon.obtainedStatus == 'already_get' ? '已领取' : (coupon.obtainedStatus == 'finish_get' ? '已领完' : '立即领取') }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!--转盘抽奖-->
            <div class="lucky-wheel-area m-b-16" v-show="luckyWheel.dataList.length>0" :class="{ 'has-more': luckyWheel.hasMore }">
                <div class="item-header b-b  loading-process-bar">
                    <div>
                        <div>抽奖活动</div>
                        <router-link :to="{ name: 'lucky' }" tag="div">参与记录</router-link>
                        <div></div>
                    </div>
                </div>
                <div class="lucky-list">
                    <router-link class="lucky-item" v-for="(act, index) in luckyWheel.dataList" :key="index" v-if="index==0" :class="{ 'image' : index==0, 'default': index !=0 }" tag="div" :to="{ name: 'luckyWheel', query: { actId: act.id, clubId: act.clubId } }" v-show="!(index>=luckyWheel.firstPageSize && luckyWheel.isPullUp)">
                        <template v-if="index==0">
                            <div>
                                <div>活动时间：
                                    <span v-if="act.startTime && act.endTime">{{ act.startTime | parseDateFormat('short') }} - {{ act.endTime | parseDateFormat('short') }}</span>
                                    <span v-else>不限</span>
                                </div>
                                <div>赢取{{ act.firstPrize }}</div>
                            </div>
                        </template>
                        <template v-else>
                            <div>
                                <div>活动奖品：</div>
                                <div>{{ act.firstPrize }}</div>
                            </div>
                            <div>
                                <div>活动时间：</div>
                                <div>{{ act.startTime }} - {{ act.endTime }}</div>
                            </div>
                        </template>
                    </router-link>
                </div>
                <div class="item-more loading-process-bar" @click="doClickMoreBtn('luckyWheel')" :class="{ expanded : luckyWheel.isOver && !luckyWheel.isPullUp, oneLine: luckyWheel.isOver && luckyWheel.isPullUp, 'process-active': luckyWheel.inLoading }">
                    <div>{{ luckyWheel.isOver && !luckyWheel.isPullUp ? '收起' : '更多展开' }}</div>
                    <div></div>
                </div>
            </div>
            <!--限时抢购-->
            <div class="time-limit-area m-b-16" v-show="paidServiceItem.dataList.length>0" :class="{ 'has-more': paidServiceItem.hasMore }">
                <div class="item-header loading-process-bar b-b">
                    <div><div>限时抢购</div></div>
                </div>
                <div class="time-limit-list">
                    <PaidServiceAct v-for="(item, index) in paidServiceItem.dataList" :key="index" :act-data="item" v-show="!(index>=paidServiceItem.firstPageSize && paidServiceItem.isPullUp)"></PaidServiceAct>
                </div>
                <div class="item-more loading-process-bar" @click="doClickMoreBtn('paidServiceItem')" :class="{ expanded : paidServiceItem.isOver && !paidServiceItem.isPullUp, oneLine: paidServiceItem.isOver && paidServiceItem.isPullUp, 'process-active': paidServiceItem.inLoading }">
                    <div>{{ paidServiceItem.isOver && !paidServiceItem.isPullUp ? '收起' : '更多展开' }}</div>
                    <div></div>
                </div>
            </div>
            <!--谁替我买单-->
            <div class="one-yuan-area m-b-16" v-show="oneYuan.dataList.length>0" :class="{ 'has-more': oneYuan.hasMore }">
                <div class="item-header loading-process-bar b-b">
                    <div>
                        <div>谁替我买单</div>
                        <router-link :to="{ name: 'oneYuanRecords' }" tag="div">参与记录</router-link>
                        <div></div>
                    </div>
                </div>
                <div class="one-yuan-list">
                    <OneYuanAct v-for="(item, index) in oneYuan.dataList" :key="index" :act-data="item" v-show="!(index>=oneYuan.firstPageSize && oneYuan.isPullUp)"></OneYuanAct>
                </div>
                <div class="item-more loading-process-bar" @click="doClickMoreBtn('oneYuan')" :class="{ expanded : oneYuan.isOver && !oneYuan.isPullUp, oneLine: oneYuan.isOver && oneYuan.isPullUp, 'process-active': oneYuan.inLoading }">
                    <div>{{ oneYuan.isOver && !oneYuan.isPullUp ? '收起' : '更多展开' }}</div>
                    <div></div>
                </div>
            </div>
            <!--优惠活动-->
            <div class="discount-act-area m-b-16" v-show="offlineActs.length>0">
                <div class="item-header b-b">
                    <div><div>优惠活动</div></div>
                </div>
                <div class="discount-act-list">
                    <router-link class="discount-act-item" v-for="(act, actIndex) in offlineActs" :key="actIndex" tag="div" :to="{ name: 'promotionsActivity', query: { id: act.actId } }" :style="{ 'background-image': 'url('+act.actLogoUrl+')' }">
                        <div>
                            <div>{{ act.actTitle }}</div>
                            <div>活动时间：{{ act.startDate | DateToString(act.endDate,'—') }}</div>
                        </div>
                    </router-link>
                </div>
            </div>
        </div>

        <!--弹窗-->
        <div class="card-package-pop-wrap pop-modal" :class="{ active: help }">
            <div class="center-wrap">
                <div class="center-header">活动说明 <span @click="doCloseHelp('help')"></span></div>
                <div class="center-content">
                    <div class="pop-content">
                        <div></div> <!--序号-->
                        <div>活动时间</div><!--标题-->
                        <div>
                            <div v-if="fastPayPackage.dataList.endTime">{{ fastPayPackage.dataList.startTime }}-{{ fastPayPackage.dataList.endTime }}</div><!--内容-->
                            <div v-if="!fastPayPackage.dataList.endTime">长期有效</div>
                        </div>
                    </div>

                    <div class="pop-content">
                        <div></div> <!--序号-->
                        <div>参与次数</div><!--标题-->
                        <div>
                            <div v-if="fastPayPackage.dataList.personTime>0 && fastPayPackage.dataList.personDayTime">你还可以参与<span>{{ fastPayPackage.dataList.personTime - fastPayPackage.dataList.totalRcvTime }}</span>次 (今天还可以参与<span>{{ fastPayPackage.dataList.personDayTime - fastPayPackage.dataList.curDateRcvTime }}</span>次)</div><!--内容-->
                            <div v-else-if="fastPayPackage.dataList.personTime>0">你还可以参与<span>{{ fastPayPackage.dataList.personTime - fastPayPackage.dataList.totalRcvTime }}</span>次 </div>
                            <div v-else-if="fastPayPackage.dataList.personDayTime>0">今天还可以参与<span>{{ fastPayPackage.dataList.personDayTime - fastPayPackage.dataList.curDateRcvTime }}</span>次 </div>
                            <div v-else>不限次数</div>
                        </div>
                    </div>

                    <div class="pop-content" v-show="fastPayPackage.dataList.payCouponLimit!='N'">
                        <div></div> <!--序号-->
                        <div>用券发放</div><!--标题-->
                        <div>
                            <div><span class="rule"></span>买单使用优惠券后，不再赠送活动奖品</div><!--内容-->
                        </div>
                    </div>

                    <div class="pop-content" v-show="fastPayPackage.dataList.memberLimit!='N'">
                        <div></div> <!--序号-->
                        <div>会员卡发放</div><!--标题-->
                        <div>
                            <div><span class="rule"></span>买单使用会员卡支付后，不再赠送活动奖品</div><!--内容-->
                        </div>
                    </div>
                </div>
                <div class="pop-disc">{{ global.clubName }}保留对此活动法律范围内的最终解释权。若有其他疑问，请咨询{{ global.clubName }}客服。</div>
            </div>
        </div>
    </div>
</template>

<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import DateToString from '../filters/date-to-string'
    import parseDateFormat from '../filters/parse-date-formatter'
    import GroupBuyAct from './group-buy-act'
    import PaidServiceAct from './paid-service-act'
    import OneYuanAct from './one-yuan-act'

    export default {
        components: {
            GroupBuyAct, PaidServiceAct, OneYuanAct
        },
        filters: {
            DateToString: DateToString,
            parseDateFormat: parseDateFormat
        },
        data () {
            return {
                global: Global.data,
                clubId: '',
                hasLoadData: false,
                giftLoad: false,
                help: false,
                luckyWheel: { // 大转盘活动数据
                    dataList: [],
                    firstPageSize: 3,
                    currPage: 0,
                    isOver: false,
                    hasMore: false,
                    isPullUp: false,
                    inLoading: false
                },
                paidServiceItem: { // 限时购活动数据
                    dataList: [],
                    firstPageSize: 2,
                    currPage: 0,
                    hasMore: false,
                    isOver: false,
                    isPullUp: false,
                    inLoading: false
                },
                groupBuy: { // 拼团活动数据
                    dataList: [],
                    firstPageSize: 2,
                    currPage: 0,
                    hasMore: false,
                    isOver: false,
                    isPullUp: false,
                    inLoading: false
                },
                oneYuan: { // 一元抢活动数据
                    dataList: [],
                    firstPageSize: 1,
                    currPage: 0,
                    isOver: false,
                    hasMore: false,
                    isPullUp: false,
                    inLoading: false
                },
                fastPayPackage: {
                    dataList: {},
                    firstPageSize: 4,
                    fastPayType: 'fastPayGift',
                    currPage: 0,
                    hasMore: true,
                    isOver: false,
                    isPullUp: false,
                    inLoading: false
                },
                currItemIndex: 0,
                coupons: [], // 优惠券数据
                offlineActs: [], // 线下活动数据
                isOpen: false
            }
        },
        props: {
            clubData: {
                type: Object,
                required: true
            },
            defaultOpen: {
                type: Boolean,
                required: true
            },
            showClubTitle: {
                type: Boolean,
                required: true
            }
        },
        computed: {
            couponSwiperOption () {
                let that = this
                return {
                    loop: that.coupons.length > 1,
                    observeParents: true,
                    slidesPerView: 'auto',
                    onInit (swiper) {
                        setTimeout(function () {
                            if (that.coupons.length > 2) {
                                swiper.reLoop()
                            }
                        }, 600)
                    }
                }
            }
        },
        created () {
            var that = this
            var clubData = that.clubData
            var global = that.global
            that.isOpen = that.defaultOpen
            that.clubId = clubData.id
            if (global.pageMode == 'club') { // 加载全部的
                that.paidServiceItem.firstPageSize = 100
                that.oneYuan.firstPageSize = 100
                that.fastPayPackage.firstPageSize = 100
            }
            if (clubData.actCount >= 0 && that.defaultOpen) {
                that.hasLoadData = true
                that.queryCoupons()
                that.queryListData('luckyWheel', 1, that.luckyWheel.firstPageSize)
                that.queryListData('paidServiceItem', 1, that.paidServiceItem.firstPageSize)
                that.queryListData('groupBuy', 1, that.groupBuy.firstPageSize)
                that.queryListData('oneYuan', 1, that.oneYuan.firstPageSize)
                that.queryListData('fastPayPackage', 1, that.fastPayPackage.firstPageSize)
            }
        },
        methods: {
            queryListData (type, page, pageSize) {
                var that = this
                var global = that.global
                var typeObj = that[type]
                var queryUrl
                if (type == 'paidServiceItem') {
                    queryUrl = '../api/v2/club/paid_service_item/online/list'
                } else if (type == 'luckyWheel') {
                    queryUrl = '../api/v2/user/luckyWheel/online/list'
                } else if (type == 'oneYuan') {
                    queryUrl = '../api/v2/club/one_yuan/online/list'
                } else if (type == 'fastPayPackage') {
                    queryUrl = '../api/v2/user/fastpay/package/online/act'
                } else if (type == 'groupBuy') {
                    queryUrl = '../api/v2/user/group/buy/online/list'
                }

                page = page || typeObj.currPage + 1
                pageSize = pageSize || 10
                that.$http.get(queryUrl, {
                    params: {
                        clubId: that.clubId,
                        page: page,
                        pageSize: pageSize
                    }
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData || []
                        if (pageSize == typeObj.firstPageSize) {
                            typeObj.dataList = res
                        } else {
                            if (page == 1) {
                                res = res.slice(typeObj.firstPageSize)
                            }
                            for (var k = 0; k < res.length; k++) {
                                typeObj.dataList.push(res[k])
                            }
                        }
                        if (res.length < pageSize || (res.packageList && res.packageList.length < pageSize)) {
                            typeObj.isOver = true
                        }

                        if (pageSize == typeObj.firstPageSize) {
                            if (type != 'fastPayPackage') {
                                typeObj.hasMore = !typeObj.isOver
                            }
                        } else if (page == 1) {
                            if (type != 'fastPayPackage') {
                                typeObj.hasMore = (res.length != 0)
                            }
                        }

                        if (type == 'groupBuy') {
                            typeObj.hasMore = false
                        }

                        if (pageSize != typeObj.firstPageSize) {
                            typeObj.currPage = page
                        }
                        setTimeout(function () {
                            typeObj.inLoading = false
                        }, 300)
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                    }
                })
            },
            queryCoupons () { // 查询优惠券
                var that = this
                var global = that.global
                that.$http.get('../api/v2/club/{clubId}/activities', {params: {clubId: that.clubId}}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.offlineActs = res.acts || []
                        that.coupons = res.coupons || []
                        for (var i = 0; i < that.coupons.length; i++) {
                            if (that.coupons[i].useStartTime) {
                                that.coupons[i].useStartTime = that.coupons[i].useStartTime.replace(/-/g, '.')
                            }
                            if (that.coupons[i].useEndTime) {
                                that.coupons[i].useEndTime = that.coupons[i].useEndTime.replace(/-/g, '.')
                            }
                        }
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                    }
                })
            },
            doClickClub () {
                var that = this
                if (that.clubObj.name) {
                    that.$router.push({path: '/' + that.clubObj.id + '/home'})
                }
            },
            doClickMoreBtn (type) {
                var that = this
                var currType = type
                if (currType == 'fastPayPackage') {
                    if (!that.giftLoad) {
                        that.giftLoad = true
                        that.currItemIndex = that.fastPayPackage.dataList.packageList.length
                    } else {
                        that.giftLoad = false
                        that.currItemIndex = 0
                    }
                    return
                }
                var dataObj = that[type]
                if (!dataObj.isOver) { // 继续加载数据
                    dataObj.inLoading = true
                    that.queryListData(type)
                } else {
                    dataObj.isPullUp = !dataObj.isPullUp
                }
            },
            doClickOpenBtn () {
                var that = this
                that.isOpen = !that.isOpen
                if (that.isOpen && !that.hasLoadData) {
                    that.hasLoadData = true
                    that.queryCoupons()
                    that.queryListData('luckyWheel', 1, that.luckyWheel.firstPageSize)
                    that.queryListData('paidServiceItem', 1, that.paidServiceItem.firstPageSize)
                    that.queryListData('oneYuan', 1, that.oneYuan.firstPageSize)
                }
            },
            doClickHelp () {
                var that = this
                that.help = true
            },
            doCloseHelp (help) {
                this[help] = false
            },
            doClickGetCouponBtn (coupon, e) {
                var btn = e.target
                var that = this
                var global = that.global

                if (btn.classList.contains('disabled')) {
                    return
                }
                if (!global.userTel) {
                    return Global.bindTelPhone()
                }
                btn.classList.add('disabled')
                btn.innerHTML = '领取中...'
                that.$http.get('../api/v2/club/get/redpacket', {params: {
                    actId: coupon.id,
                    phoneNum: global.userTel,
                    openId: global.openId
                }}).then(function (res) {
                    res = res.body
                    btn.classList.remove('disabled')
                    btn.innerHTML = '立即领取'
                    var statusCode = res.statusCode
                    if (statusCode == 200) {
                        if (coupon.couponType != 'redpack') {
                            coupon.userGetCounts ++
                            coupon.couponSellTotal ++
                        }
                    } else if (statusCode == 206) {
                        Util.tipShow(res.msg || '你已经领取过了！')
                    } else if (statusCode == 400) {
                        btn.innerHTML = '已领完'
                    } else {
                        Util.tipShow(res.msg || '领取失败！')
                    }
                    if (statusCode != 200 && coupon.couponType != 'redpack') {
                        btn.classList.add('disabled')
                        if (statusCode == 200 || statusCode == 206) {
                            btn.innerHTML = '已领取完'
                        }
                    }

                    if (coupon.couponType == 'redpack') {
                        btn.classList.add('disabled')
                    } else if (statusCode == 200) {
                        Util.tipShow('领取成功，可重复领取')
                        if (coupon.userGetCount - coupon.userGetCounts <= 0 || (coupon.actTotal != 0 && coupon.couponSellTotal - coupon.actTotal >= 0)) {
                            btn.classList.add('disabled')
                            if (statusCode == 200 || statusCode == 206) {
                                btn.innerHTML = '已领取完'
                            }
                        }
                    }
                }, function () {
                    btn.classList.remove('disabled')
                    btn.innerHTML = '立即领取'
                    Util.tipShow('领取失败！')
                })
            }
        }
    }
</script>
