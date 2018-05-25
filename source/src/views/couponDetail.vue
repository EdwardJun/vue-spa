<style lang="sass">
    @import '../sass/page/couponDetail.scss';
</style>
<template>
    <div class="page" id="coupon-detail-page">
        <div class="club-name">{{ userAct.clubName }}</div>
        <div class="coupon-info">
            <div>{{ isPaidServiceItem ? userAct.couponTypeName : userAct.useTypeName }}</div>
            <div>{{ isMoneyCoupon ? userAct.actValue+"元" : userAct.actTitle }}</div>
            <template v-if="!isPaidServiceItem">
                <div class="spec-desc" v-show="!isMoneyCoupon || userAct.consumeMoney != 0">{{ userAct.consumeMoneyDescription }}</div>
                <div>券有效期：<span>{{ userAct.couponPeriod }}</span></div>
                <div>领取时间：<span>{{ userAct.getDate }}</span></div>
                <div v-show="isRepeatCoupn">可用次数：<span>{{ userAct.canUseSum }}次</span></div>
            </template>
            <template v-else>
                <div>{{ userAct.paidType == 'give' ? '卡券来源' : '购买金额' }}：<span>{{ userAct.actValueStr }}</span></div>
                <div>有效期：<span>{{ userAct.couponPeriod }}</span></div>
                <div>购买时间：<span>{{ userAct.getDate }}</span></div>
                <div v-show="userAct.useEndDate && userAct.status!='settled'">剩余 <span>{{ userAct.expiredTime }}</span></div>
                <div v-show="userAct.status=='settled'">已使用</div>
                <div v-show="userAct.techId">所选技师：<span>{{ userAct.techName }}</span></div>
            </template>
        </div>
        <div class="item share" v-show="isRepeatCoupn && !isPaidServiceItem">分享给朋友<br/>朋友使用后可再获得一次使用机会
            <div :class="shareStatus" @click="doClickShareBtn()">立即分享</div>
        </div>
        <div class="item qrcode" v-show="userAct.status!='settled'">
            <div>电子票号（使用时请出示二维码，或者优惠码）</div>
            <img alt="二维码" v-if="couponQrCodeUrl" :src="couponQrCodeUrl"/>
            <span>{{ userAct.couponNo | codeFormatter }}</span>
        </div>

        <div class="item get-records" v-show="isRepeatCoupn && !isPaidServiceItem" v-if="phoneNumsOfGet.length>0 || phoneNumsOfUse.length>0">
            <div>好友领取</div>
            <ul>
                <li v-for="item in phoneNumsOfGet">{{ item.phone }}
                    <div>已经领取{{ couponName }}<span>{{ item.date }}</span></div>
                </li>
                <li v-for="item in phoneNumsOfUse">{{ item.phone }}
                    <div>已经使用{{ couponName }}<span>{{ item.date }}</span></div>
                </li>
            </ul>
        </div>
        <div class="item desc" v-if="!isMoneyCoupon && !userAct.actDescription && !isPaidServiceItem">
            <div>优惠说明：</div>
            <div>{{ userAct.actDescription || "无" }}</div>
        </div>

        <div class="item desc content" v-show="!isPaidServiceItem">
            <div>使用说明：</div>
            <div>券有效期：{{ userAct.couponPeriod }}</div>
            <div>使用时段：{{ userAct.useTimePeriod }}</div>
            <div>
                <div v-show="useServiceItem">使用项目：仅限{{ useServiceItem }}</div>
                <div v-html="userAct.actContent"></div>
            </div>
        </div>

        <!-- 项目券的展示 -->
        <div class="explain-item act-explain" v-if="isPaidServiceItem && couponType == 'paid_service_item'">
            <div>活动说明</div>
            <div>
                <div></div>
                <div>
                    <div>使用时间：<span>{{ userAct.useDateStr }}</span></div>
                    <div v-show="userAct.usePeriodStr">可用时段：<span>{{ userAct.usePeriodStr }}</span></div>
                    <div v-html="userAct.actContent"></div>
                </div>
            </div>
        </div>

        <div class="explain-item project-coupon-explain" v-if="isPaidServiceItem && couponType != 'paid_service_item'">
            <div>使用说明</div>
            <div>
                <div style="display: none"></div>
                <div>
                    <ol>
                        <li>本项目券逾期不消费不退还款项，请尽快消费！</li>
                        <li>本项目券只对 <span>{{ userAct.actTitle }}</span> 项目有效；</li>
                        <li>消费不受会所项目价格变动，只以当时支付价格为准；</li>
                    </ol>
                    <div v-html="userAct.actContentStr"></div>
                </div>
            </div>
        </div>

        <div class="explain-item project-explain" v-if="isPaidServiceItem">
            <div>项目说明</div>
            <div>
                <div>
                    <div>
                        <div :style="{ 'background-image': 'url('+(userAct.imageUrl || global.defaultServiceItemImgUrl)+')' }"></div>
                        <div>
                            <div>{{ userAct.actTitle }}</div>
                            <div>{{ userAct.discountPrice || ' ' }}</div>
                            <div>原价：<span>{{ userAct.priceStr}}</span><span v-if="userAct.pricePlusStr">加钟：{{ userAct.pricePlusStr}}</span></div>
                        </div>
                    </div>
                </div>
                <div>
                    <div>项目说明</div>
                    <div v-html = "userAct.description || '无'"></div>
                </div>
            </div>
        </div>

        <Share :share-url="shareUrl" v-if="isRepeatCoupn && shareUrl"></Share>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import eventHub from '../libs/hub'
    import CodeFormatter from '../filters/code-formatter'
    import 'jr-qrcode'
    import Share from '../components/share'

    export default {
        components: {
            Share
        },
        filters: {
            codeFormatter: CodeFormatter
        },
        data () {
            return {
                global: Global.data,
                userActId: '',
                userAct: {},
                couponQrCodeUrl: '',
                couponNo: '',
                isPaidServiceItem: false,
                couponType: '',
                isMoneyCoupon: false,
                isRepeatCoupn: false,
                phoneNumsOfGet: [],
                phoneNumsOfUse: [],
                couponName: '',
                useServiceItem: '',
                shareStatus: '',
                useDefaultShareConfig: false,
                shareUrl: ''
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            that.userActId = query.userActId
            that.couponType = query.couponType
            that.couponNo = query.couponNo
            that.isPaidServiceItem = query.couponType == 'paid_service_item' || query.couponType == 'service_item'

            if (!that.userActId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            } else {
                document.title = '优惠券详情'
                that.$http.get(that.isPaidServiceItem ? '../api/v2/club/user/service_item_coupon/view' : '../api/v2/club/userredpacket/{suaId}', {
                    params: {userType: 'user', id: that.userActId, suaId: that.userActId, couponNo: that.couponNo}
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        var userAct
                        if (that.isPaidServiceItem) { // 项目券
                            userAct = res.userAct
                            userAct.clubName = res.clubName
                            if (userAct.paidType == 'credits') {
                                userAct.actValueStr = userAct.actValue + ' 积分'
                            } else if (userAct.paidType == 'give') {
                                userAct.actValueStr = '奖品赠送'
                            } else {
                                userAct.actValueStr = userAct.actValue + ' 元'
                            }

                            // 剩余天数
                            if (userAct.useEndDate) {
                                var tmpDate = (+new Date(userAct.useEndDate.split(' ')[0].replace(/-/g, '/') + ' 23:59:59')) - (+new Date())
                                var floor = Math.floor
                                var timeUnit = ''
                                if (floor(tmpDate / 86400000) > 0) {
                                    tmpDate = floor(tmpDate / 86400000)
                                    timeUnit = '天'
                                } else if (floor(tmpDate / 3600000) > 0) {
                                    tmpDate = floor(tmpDate / 3600000)
                                    timeUnit = '小时'
                                } else {
                                    tmpDate = floor(tmpDate / 60000)
                                    timeUnit = '分钟'
                                }
                                userAct.expiredTime = tmpDate + timeUnit
                            }

                            if (that.couponType == 'paid_service_item') {
                                userAct.useDateStr = userAct.useStartDate.split(' ')[0] + ' - ' + userAct.useEndDate.split(' ')[0]
                                var usePeriodStr = ''
                                if (userAct.useDay) {
                                    if (userAct.useDay.match(/(\d)/g).length == 7) {
                                        userAct.useDay = '170'
                                    }
                                    usePeriodStr = (userAct.useDay || '').replace(/(\d)/g, function () {
                                        return ['周日', '周一', '周二', '周三', '周四', '周五', '周六', ' 至 '][arguments[1]]
                                    }) + ' ' + (userAct.startTime ? (userAct.startTime.replace(/:00$/g, '') + ':00 - ' + userAct.endTime.replace(/:00$/g, '') + ':00') : '')
                                } else if (userAct.usePeriod) {
                                    usePeriodStr = userAct.usePeriod
                                }
                                userAct.usePeriodStr = usePeriodStr
                            } else {
                                userAct.actContentStr = userAct.actContent.replace(/<!--.*?-->/g, '')
                            }
                            if (that.isPaidServiceItem) {
                                if (userAct.useType != 'paid_service_item') {
                                    userAct.discountPrice = '网店价：' + userAct.actValue + '元/' + userAct.duration + userAct.durationUnit
                                }
                                userAct.priceStr = userAct.price + '元/' + userAct.duration + userAct.durationUnit
                                if (userAct.pricePlus) {
                                    userAct.pricePlusStr = userAct.pricePlus + '元/' + userAct.durationPlus + userAct.durationUnitPlus
                                }
                            }

                            that.userAct = userAct
                        } else {
                            userAct = res.userAct
                            that.isMoneyCoupon = userAct.useType == 'money'
                            that.isRepeatCoupn = userAct.couponType == 'redpack'
                            that.couponName = that.isMoneyCoupon ? userAct.actValue + '元' + userAct.useTypeName : userAct.actTitle
                            if ((userAct.couponStatus != '1' && userAct.couponStatus != '2') || !res.shareUrl) {
                                that.shareStatus = 'unwork'
                            }
                            that.useDefaultShareConfig = !(global.userAgent.isWX && (that.shareStatus == ''))
                            res.items = res.items || []
                            if (res.items.length > 0) {
                                var items = res.items
                                var itemsArr = []
                                for (var i = 0; i < items.length; i++) {
                                    itemsArr.push(items[i]['name'])
                                }
                                that.useServiceItem = itemsArr.join('，')
                            }
                            if (that.isRepeatCoupn && !that.useDefaultShareConfig) {
                                that.doHandlerShareConfig(res)
                            }
                            that.userAct = userAct
                            that.phoneNumsOfGet = res.phoneNums_get || []
                            that.phoneNumsOfUse = res.phoneNums_use || []
                            that.shareUrl = res.shareUrl
                        }

                        // 获取二维码
                        that.couponQrCodeUrl = userAct.couponQrCodeUrl || userAct.qrCodeUrl || that.getQrCodeImageUrl()
                        global.loading = false
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                        that.$router.back()
                    }
                })
            }
        },
        methods: {
            /**
             * 在本地生成二维码
             */
            getQrCodeImageUrl () {
                var that = this
                var userAct = that.userAct
                return jrQrcode.getQrBase64(userAct.couponNo, {padding: 0})
            },
            doClickShareBtn () {
                var that = this
                if (that.shareStatus == '') {
                    eventHub.$emit('change-share-pop', true) // 弹出分享提示
                } else {
                    Util.tipShow('活动已过期！不可分享！')
                }
            },
            doHandlerShareConfig (res) {
                var that = this
                Global.shareConfig({
                    title: res.clubName + '-' + (that.isMoneyCoupon ? res.userAct.actValue + '元' + res.userAct.useTypeName : res.userAct.actTitle), // 分享标题
                    desc: that.isRepeatCoupn ? '此券可在' + res.clubName + '使用，分享给朋友获得更多优惠。' : '送你一张优惠券，带上它，让你的身体爽一把。', // 分享描述
                    link: res.shareUrl, // 分享链接
                    imgUrl: res.imageUrl, // 分享图标
                    success () {
                        that.$http.get('../api/v2/club/redpacket/share', {params: {userActId: that.userActId}}).then(function (shareRes) {
                            shareRes = shareRes.body
                            if (shareRes.statusCode == 200) {
                                eventHub.$emit('change-share-pop', false) // 关闭分享提示
                            }
                        })
                    },
                    cancel () {
                        // 用户取消分享后执行的回调函数
                    },
                    fail () {
                        Util.tipShow('分享失败！请稍后再试！')
                    }
                })
            }
        }
    }
</script>
