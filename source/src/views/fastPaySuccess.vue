<style lang="sass">
    @import '../sass/page/fastPaySuccess.scss';
</style>
<template>
  <div class="page" id="fast-pay-success-page" v-show="isReveal">
        <div class="item-discri">
            <div></div>
            <div>感谢您的光顾，有空常来哟~</div>
        </div>

        <!-- isReceived:true 已领取礼品-->

        <!--
        <div class="item-discri" v-if="bindPhone || (!isReceived && !bindPhone)">
            <div></div>
            <div>感谢您的光顾，有空常来哟~</div>
        </div>
        
        <div class="item-phone" v-if="!bindPhone && canReceive">
            <span>恭喜您获得赠送礼品，请输入手机号领取</span>
            <input placeholder="请输入手机号" v-model="tel" type="tel" maxlength="11" v-tel-input/>
            <div @click="getGiftInfo()">马上领取</div>
        </div>
        -->

        <!-- 领取成功-->
        <!--
        <div class="item-get" v-if="!bindPhone && isReceived">
            <div></div>
            <div>领取成功</div>
            <div>礼品已发放至{{ userPhone }}</div>
        </div>
        -->

        <!--
        <div class="coupons-area" v-if="bindPhone || canReceive">
            <div class="item-title" v-if="(couponList && couponList.length>0 )|| credits">{{ canReceive ? '礼包内容' : '赠送您' }}：</div>
            <div class="item-content" v-if="couponList && couponList.length>0" v-for="(coupon, cindex) in couponList" :key="cindex">
                <div class="item-container">
                    <div class="coupon-left" :class="coupon.couponType" v-show="coupon.couponType!='gift'">
                        <div v-show="coupon.couponType!='gift'">
                            <span v-show="coupon.couponType!='discount'">￥</span>
                            <span v-if="bindPhone">{{ coupon.couponType!='discount'?coupon.actValueFen/100:coupon.actValueFen/10000 }}</span>
                            <span v-if="!bindPhone">{{ coupon.amount/100 }}</span>
                            <span v-show="coupon.couponType=='discount'">&nbsp;&nbsp;折</span>
                        </div>
                        <div v-show="coupon.couponType!='gift'">{{coupon.couponTypeName}}</div>
                    </div>
                    <div class="coupon-left" v-if="bindPhone" :class="coupon.couponType" v-show="coupon.couponType=='gift'" :style="{ 'background-image': 'url('+(coupon.actLogoUrl ? coupon.actLogoUrl:global.defaultServiceItemImgUrl)+')' }"></div>
                    <div class="coupon-left" v-if="!bindPhone" :class="coupon.couponType" v-show="coupon.couponType=='gift'" :style="{ 'background-image': 'url('+(coupon.imageUrl ? coupon.imageUrl:global.defaultServiceItemImgUrl)+')' }"></div>

                    <div class="coupon-right" v-if="bindPhone">
                        <ul><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>
                        <div :class="coupon.couponType+'1'">
                            <div>{{ coupon.actTitle }}</div>
                            <div v-show="coupon.couponType=='paid'">抵{{ coupon.actValueFen / 100 }}元</div>
                            <div v-show="coupon.couponType=='money'">{{ coupon.consumeMoneyFen=='0' ? '直减'+coupon.actValueFen / 100+'元':'满'+(coupon.consumeMoneyFen / 100)+'元可用'}}</div>
                            <div v-show="coupon.couponType=='cash'">{{ coupon.consumeMoneyFen=='0' ? '直减'+coupon.actValueFen / 100+'元':'满'+(coupon.consumeMoneyFen / 100)+'元可用'}}</div>
                            <div v-show="coupon.couponType=='discount'">{{coupon.consumeMoneyFen=='0'? '打'+(coupon.actValueFen / 10000)+'折':'满'+(coupon.consumeMoneyFen / 100)+'元可用' }}</div>
                            <div v-show="coupon.couponType=='coupon'">原价{{ coupon.consumeMoneyFen }}元</div>
                            <div v-show="coupon.couponType=='gift' || coupon.couponType=='service_item'">{{ coupon.actSubTitle }}</div>
                            <div>{{ coupon.couponPeriod }}</div>
                        </div>
                    </div>
                    <div class="coupon-right" v-if="!bindPhone">
                        <ul><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul>
                        <div :class="coupon.couponType+'1'">
                            <div>{{ coupon.title }}</div>
                            <div v-show="coupon.couponType=='paid'">抵{{ coupon.amount / 100 }}元</div>
                            <div v-show="coupon.couponType=='money'">{{ coupon.oriAmount=='0' ? '直减'+coupon.amount / 100+'元':'满'+(coupon.oriAmount / 100)+'元可用'}}</div>
                            <div v-show="coupon.couponType=='cash'">{{ coupon.oriAmount=='0' ? '直减'+coupon.amount / 100+'元':'满'+(coupon.oriAmount / 100)+'元可用'}}</div>
                            <div v-show="coupon.couponType=='discount'">{{coupon.oriAmount=='0'? '打'+(coupon.amount / 10000)+'折':'满'+(coupon.oriAmount / 100)+'元可用' }}</div>
                            <div v-show="coupon.couponType=='coupon'">原价{{ coupon.oriAmount }}元</div>
                            <div v-show="coupon.couponType=='gift' || coupon.couponType=='service_item'">{{ coupon.subTitle }}</div>
                            <div>{{ coupon.couponPeriod }}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="item-integral" v-if="credits">
                <div>+{{ credits }} <span>积分</span></div>
            </div>
        </div>

        <div class="btn-footer" v-if="bindPhone || isReceived">
            <div class="submit-btn btn-give" @click="doViewDetail()">查看</div>
            <div class="submit-btn btn-confirm" @click="doClickAchieve()">更多</div>
        </div>
        -->

        <!-- 二维码-->
        <div class="item-code">
            <div><img :src="clubQrCodeUrl"/></div>
            <div>长按二维码关注“小摩豆”，获取更多优惠信息</div>
        </div>

        <!--转盘抽奖-->
        <div class="lucky-wheel-area m-b-16" v-if="luckyWheel.dataList.length>0" :class="{ 'has-more': luckyWheel.hasMore }">
                <div class="item-header b-b  loading-process-bar">
                    <div>
                        <div>更多活动，等你参与：</div>
                        <!--<router-link :to="{ name: 'lucky' }" tag="div">参与记录</router-link>-->
                        <div></div>
                    </div>
                </div>
                <div class="lucky-list">
                    <router-link class="lucky-item image" v-for="(act, index) in luckyWheel.dataList" :key="index" v-if="index==0" :class="{ 'image' : index==0, 'default': index !=0 }" tag="div" :to="{ name: 'luckyWheel', query: { actId: act.id, clubId: act.clubId } }" v-show="!(index>=luckyWheel.firstPageSize && luckyWheel.isPullUp)">
                        <template v-if="index==0" :class="'ss'+index">
                            <div>
                                <div v-if="act.startTime && act.endTime">活动时间：{{ act.startTime | DateFormatter('yy.MM.dd hh:mm') }} -  {{ act.endTime | DateFormatter('yy.MM.dd hh:mm') }}</div>
                                <div v-else>不限</div>
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
                                <div>{{ act.startTime  | DateFormatter('yy.MM.dd hh:mm') }} - {{ act.endTime  | DateFormatter('yy.MM.dd hh:mm') }}</div>
                             </div>
                        </template>
                    </router-link>
                </div>
        </div>

        <!--限时抢购-->
        <div class="time-limit-area m-b-16" v-if="paidServiceItem.dataList.length>0" :class="{ 'has-more': paidServiceItem.hasMore }">
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
        <div class="one-yuan-area m-b-16" v-if="oneYuan.dataList.length>0" :class="{ 'has-more': oneYuan.hasMore }">
            <div class="item-header loading-process-bar b-b">
                <div>
                    <div>谁替我买单</div>
                    <!--<router-link :to="{ name: 'oneYuanRecords' }" tag="div">参与记录</router-link>-->
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
  </div>
</template>
<script>
    import Global from '../libs/global'
    import eventHub from '../libs/hub'
    import Util from '../libs/util'
    import DateFormatter from '../filters/date-formatter'
    import PaidServiceAct from '../components/paid-service-act'
    import OneYuanAct from '../components/one-yuan-act'
    import TelInput from '../directives/tel-input'

    export default {
        directives: {
            'tel-input': TelInput
        },
        components: {
            PaidServiceAct, OneYuanAct
        },
        filters: {
            DateFormatter: DateFormatter
        },
        data () {
            return {
                global: Global.data,
                couponList: [],
                credits: '',
                clubId: '',
                orderId: '',
                techId: '',
                tel: '',
                bindPhone: false, // 手机号绑定
                isShow: false,
                isReveal: true,
                clubQrCodeUrl: '',
                userPhone: '',
                canReceive: false,
                isReceived: false, // 是否领取礼品
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
                oneYuan: { // 一元抢活动数据
                    dataList: [],
                    firstPageSize: 1,
                    currPage: 0,
                    isOver: false,
                    hasMore: false,
                    isPullUp: false,
                    inLoading: false
                }
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            that.clubId = query.clubId || global.clubId
            that.orderId = query.orderId || global.orderId || ''
            that.techId = query.techId
            if (query.orderId == undefined) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            that.init()
        },
        methods: {
            init () {
                var that = this
                var global = that.global
                if (global.pageMode == 'club') { // 加载全部的
                    that.paidServiceItem.firstPageSize = 100
                    that.oneYuan.firstPageSize = 100
                }
                let isShow = Util.sessionStorage('show')
                if (isShow) {
                    that.isShow = isShow
                    Util.removeSessionStorage('show')
                }
                let userPhone = Util.sessionStorage('userPhone')
                if (userPhone) {
                    that.userPhone = userPhone
                    Util.removeSessionStorage('userPhone')
                }
                // that.queryCheckInfo()
                that.getClubQrcode()
                that.queryListData('luckyWheel', 1, that.luckyWheel.firstPageSize)
                that.queryListData('paidServiceItem', 1, that.paidServiceItem.firstPageSize)
                that.queryListData('oneYuan', 1, that.oneYuan.firstPageSize)
                that.global.loading = false
            },
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
                }

                page = page || typeObj.currPage + 1
                pageSize = pageSize || 10
                that.$http.get(queryUrl, {params: {
                    clubId: that.clubId,
                    page: page,
                    pageSize: pageSize
                }}).then(function (res) {
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
                        if (res.length < pageSize) {
                            typeObj.isOver = true
                        }

                        if (pageSize == typeObj.firstPageSize) {
                            typeObj.hasMore = !typeObj.isOver
                        } else if (page == 1) {
                            typeObj.hasMore = (res.length != 0)
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
            doClickMoreBtn (type) {
                var that = this
                var dataObj = that[type]
                if (!dataObj.isOver) { // 继续加载数据
                    dataObj.inLoading = true
                    that.queryListData(type)
                } else {
                    dataObj.isPullUp = !dataObj.isPullUp
                }
            },
            doViewDetail () {
                var that = this
                let couponList = that.couponList
                eventHub.$emit('jump-view-coupon')
                if (that.credits && couponList && couponList.length > 0) {
                    that.$router.push({name: 'personal'})
                } else if (that.credits) {
                    that.$router.push({name: 'integralDetail'})
                } else if (couponList && couponList.length == 1) {
                    that.$router.push({name: 'paidCouponDetail', query: {userActId: couponList[0].suaId}})
                } else {
                    that.$router.push({name: 'personal'})
                }
            },
            doClickAchieve () {
                var that = this
                that.$router.push({name: 'activities'})
            },
            /**
             * 检查是否可领取
             */
            queryCheckInfo () {
                var that = this
                that.$http.post('../api/v2/user/fastpay/package/check', {
                    orderId: that.orderId
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData || []
                        that.canReceive = res.canReceive
                        that.bindPhone = res.bindPhone // 是否绑定手机号
                        that.isReceived = res.isReceived
                        if (res.receivedPackage) { // 已领取
                            that.couponList = res.receivedPackage.couponList
                            that.credits = res.receivedPackage.credits
                        } else if (res.canReceivePackage) { // 未领取
                            that.couponList = res.canReceivePackage.couponList
                            that.credits = res.canReceivePackage.credits
                        }
                        that.isReveal = true
                        that.global.loading = false
                    } else {
                        Util.tipShow(res.msg || '请求失败！')
                    }
                })
            },
            /**
             * 领取奖品信息
             */
            getGiftInfo () {
                var that = this
                if (!that.tel) {
                    return Util.tipShow('请输入手机号！')
                }
                that.$http.post('../api/v2/user/fastpay/package/receive/package', {
                    orderId: that.orderId,
                    phoneNum: that.tel
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.isShow = true
                        that.canReceive = false
                        that.isReceived = true
                        that.userPhone = res.userPhone
                        Util.sessionStorage('show', that.isShow)
                        Util.sessionStorage('userPhone', that.userPhone)
                    } else {
                        Util.tipShow(res.msg || '领取失败！')
                    }
                })
            },
            /**
             * 会所二维码
             */
            getClubQrcode () {
                var that = this
                that.$http.get('../api/v1/qrcode/club/home', {params: {
                    clubId: that.global.clubId
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData || []
                        that.clubQrCodeUrl = res.url
                    }
                })
            }
        },
        beforeDestroy () {
            Util.removeSessionStorage('show')
        }
    }
</script>
