<style lang="sass">
    @import '../sass/page/promotions.scss';
</style>
<template>
    <div class="page" id="promotions-page">
        <div class="title coupon-title" v-if="coupons.length>0">优惠券</div>
        <div v-for="(coupon,index) in coupons" class="money-coupon" :class="{ money : coupon.useType == 'money' }">
            <div>
                <div>{{ coupon.actTitle }}</div>
                <div>{{ coupon.useType == 'money' ? coupon.actValue+'元现金券，' : '' }}{{ coupon.consumeMoneyDescription }}</div>
            </div>
            <div>
                <div>{{ coupon.useTypeName }}</div>
                <div class="sure-btn" :class="{ disabled : coupon.getFlag == 'already_get' || coupon.getFlag == 'finish_get' || inGettingCouponId== coupon.actId }" @click="doGetCoupon(index, $event)">{{ inGettingCouponId== coupon.actId ? '领取中...' : ( coupon.getFlag == 'already_get' ? '已领取' : (coupon.getFlag == 'finish_get' ? '已领完' : '立即领取') )}}</div>
            </div>
        </div>
        <div class="title" v-if="activities.length>0">优惠活动</div>
        <router-link v-for="act in activities" class="activity" :style="{ backgroundImage : 'url('+act.actLogoUrl+')' }" :to="{ name :'promotionsActivity' , query : { id : act.actId }}">
            <div>
                <div>{{ act.actTitle }}</div>
                <div>活动时间：{{act.startDate | dateToString(act.endDate,'—')}}</div>
            </div>
        </router-link>
        <div class="nullData" v-if="activities.length==0 && coupons.length==0">
            <div v-show="!global.loading"></div>
            <div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div>
        </div>
        <div class="pop-modal getted-coupon-pop" :class="{ active : showPopTip }">
            <div class="center-wrap">
                <div>恭喜您！获得一张优惠券<br/>已经放在您的个人中心</div>
                <div>
                    <div @click="doClickCancelPop()">取消</div>
                    <div @click="doClickViewBtn()">立即查看</div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import DateToString from '../filters/date-to-string'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                coupons: [],
                activities: [],
                showPopTip: false,
                inGettingCouponId: '' // 正在领取的couponID
            }
        },
        created () {
            var that = this
            var global = that.global
            document.title = '优惠活动'
            that.$http.get('../api/v2/club/{clubId}/activities', {params: {clubId: global.clubId}}).then(function (res) {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    var coupon
                    for (var i = 0; i < res.coupons.length; i++) {
                        coupon = res.coupons[i]
                        coupon['useType'] = (coupon['useType'] == 'null' ? 'money' : coupon['useType'])
                        if (coupon['useType'] == 'money' && coupon['consumeMoney'] == 0) {
                            coupon['consumeMoneyDescription'] = '不限使用'
                        }
                    }
                    that.coupons = res.coupons
                    that.activities = res.acts
                    global.loading = false
                } else {
                    Util.tipShow(global.loadError)
                    that.$router.back()
                }
            }, function () {
                Util.tipShow(global.loadError)
                that.$router.back()
            })
        },
        filters: {
            dateToString: DateToString
        },
        methods: {
            doClickCancelPop () {
                this.showPopTip = false
            },
            doClickViewBtn () {
                this.$router.push({name: 'personal'})
            },
            doGetCoupon (index, event) { // 点击领取
                var that = this
                var global = that.global
                var coupon = that.coupons[index]
                var btn = event.target
                if (!btn.classList.contains('disabled')) {
                    if (!global.isLogin) { // 跳转到登录
                        Global.login(that.$router)
                        return
                    } else if (!global.userTel) {
                        Global.bindTelPhone()
                        return
                    } else {
                        that.inGettingCouponId = coupon.actId
                        that.$http.get('../api/v2/club/get/redpacket', {params: {actId: coupon.actId, phoneNum: global.userTel, openId: global.openId}}).then(function (res) {
                            res = res.body
                            that.inGettingCouponId = ''
                            if (res.statusCode == 200) {
                                that.showPopTip = true
                                if (coupon.couponType == 'redpack') {
                                    coupon.userGetCounts++
                                    coupon.couponSellTotal++
                                }
                            } else if (res.statusCode == 206) {
                                Util.tipShow(res.msg || '你已经领取过了！')
                            } else {
                                Util.tipShow(res.msg || '领取失败！')
                            }

                            if (res.statusCode != 200 && coupon.couponType != 'redpack') {
                                btn.classList.add('disabled')
                                if (res.statusCode == 206) {
                                    coupon.getFlag = 'finish_get'
                                    btn.innerHTML = '已领完'
                                }
                            }
                            if (coupon.couponType == 'redpack') {
                                btn.classList.add('disabled')
                                if (res.statusCode == 200 || res.statusCode == 206) {
                                    coupon.getFlag = 'already_get'
                                    btn.innerHTML = '已领取'
                                }
                            } else if (res.statusCode == 200) {
                                if (!(coupon.userGetCount > coupon.userGetCounts && coupon.couponSellTotal < coupon.actTotal)) {
                                    btn.classList.add('disabled')
                                    if (res.statusCode == 200 || res.statusCode == 206) {
                                        btn.innerHTML = '已领完'
                                    }
                                }
                            }
                        }, function () {
                            that.inGettingCouponId = ''
                            Util.tipShow('领取出错！请稍后再试！')
                        })
                    }
                }
            }
        }
    }
</script>
