<style lang="sass">
    @import '../sass/page/itemCardDetail.scss';
</style>
<template>
    <div class="item-card-detail-page-wrap">
        <div class="page" id="item-card-detail-page">
            <div class="banner" :style="{ 'background-image': 'url('+actData.bannerImg+')' }">
                <router-link :to="{ path: '/'+clubId+'/home' }" tag="div">
                    <div :style="{ 'background-image': 'url('+clubLogo+')' }"></div>
                    <span>{{ clubName }}</span></router-link>
            </div>

            <div class="service-wrap">
                <div>{{ actData.name }}<!--<span>{{ actItemData.duration }}{{ actItemData.durationUnit }}</span>--></div>
                <ul class="package-title">
                    <li v-for="(plan,index) in plans"
                        :class="{ active : currActiveIndex == index, best : plan.optimal=='Y' }"
                        @click="doSelectPlan(index)">{{ actData.type==1 ? '买' : ''}}<span>{{ plan.paidCount }}{{ actData.type==1 ? '' : actData.unitName}}</span>
                        <template v-if="actData.type==1">送<span>{{ plan.giveCount }}</span></template>
                    </li>
                </ul>
                <ul class="package-content">
                    <li :class="{ active : currActiveIndex==index }" v-for="(plan,index) in plans">
                        <div>{{ actItemData.name }}<span>{{ actItemData.price }}元/{{ actData.unitName }}</span><span>{{ plan.totalCount }}{{ actData.unitName }}</span></div>
                        <div>¥<b>{{ plan.actAmount | MoneyFormatter }}</b><span>¥{{ plan.originAmount*100 | MoneyFormatter }}</span><span>每{{ actData.unitName }}立减{{ plan.discountAmount }}元</span>
                        </div>
                    </li>
                </ul>
            </div>

            <div class="item-wrap pay">
                <div class="item-title">购买须知</div>
                <div class="strong">有效期</div>
                <div>自购买之日起<strong>{{ actData.period }}内</strong></div>
                <div class="strong">补充说明</div>
                <div v-html="actData.description"></div>
            </div>

            <div class="item-wrap service" :class="{ notPay: isNotPay }">
                <div class="item-title">相关项目</div>
                <router-link class="service-item" tag="div" :to="{ name: 'serviceItem', query: { id: actItemData.id } }">
                    <div :style="{ 'background-image': 'url('+actItemData.imgUrl+')' }"></div>
                    <div>{{ actItemData.name }}</div>
                    <div>{{ actItemData.price }}元/{{ actItemData.duration }}{{ actItemData.durationUnit }}
                        <template v-if="actItemData.pricePlus"><span>加钟</span>{{ actItemData.pricePlus }}元/{{ actItemData.durationPlus }}{{ actItemData.durationUnitPlus }}</template>
                    </div>
                </router-link>
            </div>
        </div>
        <div class="submit-button footer" :class="{ sellOut: actData.statusName == '已售完' , expired: actData.statusName == '已过期', processing: inProcessing }" @click="doClickConfirmBtn()">{{ isNotPay ? '逛商城、找优惠' : (inProcessing ? '购买中...' : '购买') }}</div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import MoneyFormatter from '../filters/money-formatter'

    export default {
        filters: {
            MoneyFormatter: MoneyFormatter
        },
        data () {
            return {
                global: Global.data,
                cardId: '',
                clubId: '',
                techId: '',
                journal: '',

                clubName: '',
                clubLogo: '',
                actData: {
                    bannerImg: '',
                    name: '',
                    period: '',
                    description: '',
                    statusName: '',
                    type: 1,
                    unitName: ''
                },
                actItemData: {
                    id: '',
                    duration: '',
                    durationUnit: '',
                    imgUrl: '',
                    name: '',
                    price: '',
                    pricePlus: '',
                    durationPlus: '',
                    durationUnitPlus: ''
                },
                plans: [],
                currActiveIndex: 0,
                isNotPay: false,

                paramData: null,
                payAuthCode: '',
                openId: '',
                inProcessing: false
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query

            that.clubId = query.clubId || global.clubId || ''
            that.cardId = query.id
            that.techId = query.techId
            that.journal = query.type

            document.title = '次卡详情'
            if (!that.clubId || !that.cardId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }

            that.paramData = Util.localStorage('item-card-pay-param')
            that.payAuthCode = query.code || global.authCode

            if (global.userAgent.isWX && that.paramData && that.payAuthCode) { // 获取openId
                Global.getOpenId({authCode: that.payAuthCode}).then(function (res) {
                    that.openId = res.openid
                    that.init()
                })
            } else {
                that.init()
            }
        },
        methods: {
            init () {
                var that = this
                var global = that.global

                // 缓存techId
                if (that.techId) {
                    Util.sessionStorage('itemCardTechId', that.techId)
                } else {
                    that.techId = Util.sessionStorage('itemCardTechId') || ''
                }

                that.$http.get('../api/v2/club/item_card/activity/detail', {
                    params: {
                        activityId: that.cardId,
                        clubId: that.clubId
                    }
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        if (res.activity.cardType == 'credit_gift') {
                            that.$router.push({
                                name: 'itemPackageDetail',
                                query: {id: that.cardId, type: 'credit_gift'}
                            })
                        }
                        var actData = res.activity
                        var actItemData = res.items[0]
                        var thisActData = that.actData
                        var thisActItemData = that.actItemData
                        var plans = actData.itemCardPlans
                        var k
                        var plan
                        var periodObj = {'Y': '年', 'M': '月', 'D': '日'}
                        var optimalPlan

                        that.clubName = res.clubName
                        that.clubLogo = res.clubImageUrl || global.defaultClubLogo
                        thisActData.bannerImg = actData.imageUrl
                        thisActData.name = actData.name
                        thisActData.type = actData.type
                        thisActData.unitName = actData.unitName
                        thisActData.period = actData.period.replace(/(Y|M|D)/g, function () {
                            if (periodObj[arguments[0]]) {
                                return periodObj[arguments[0]]
                            }
                            return arguments[0]
                        })
                        thisActData.description = actData.description || '无'
                        thisActData.statusName = actData.statusName
                        that.isNotPay = (actData.statusName == '已售完' || actData.statusName == '已过期')

                        for (k = 0; k < plans.length; k++) {
                            plan = plans[k]
                            if (plan.optimal == 'Y') {
                                that.currActiveIndex = k
                                optimalPlan = plan
                            }
                            plan.totalCount = plan.paidCount + plan.giveCount
                            if (actItemData) {
                                thisActItemData.id = actItemData.id
                                thisActItemData.duration = actItemData.duration
                                thisActItemData.durationUnit = actItemData.durationUnit
                                thisActItemData.imgUrl = actItemData.imageUrl || global.defaultServiceItemImgUrl
                                thisActItemData.name = actItemData.name
                                thisActItemData.price = actItemData.price
                                thisActItemData.pricePlus = actItemData.pricePlus
                                thisActItemData.durationPlus = actItemData.durationPlus
                                thisActItemData.durationUnitPlus = actItemData.durationUnitPlus

                                actItemData.price = parseFloat(actItemData.price)
                                plan.originAmount = actItemData.price * plan.totalCount
                                plan.discountAmount = ((plan.originAmount - plan.actAmount / 100) / plan.totalCount).toFixed(2)
                            }
                        }
                        that.plans = plans
                        global.loading = false
                        that.$http.post('../api/v2/club/share/view/count/update', {actId: that.cardId, techCode: '', clubId: that.clubId, techId: that.techId, type: 'item_card'}) // 更新用户查看数

                        // 分享配置
                        if (global.userAgent.isWX) {
                            var discount = ((optimalPlan.actAmount / (optimalPlan.originAmount * 100)) * 10).toFixed(1)
                            Global.shareConfig({
                                title: actData.name,
                                desc: actItemData.name + '_' + discount + '折_（买' + optimalPlan.paidCount + '送' + optimalPlan.giveCount + '）',
                                link: global.prefixPathname + '#/' + that.clubId + '/itemCardDetail?id=' + that.cardId + (that.techId ? '&techId=' + that.techId : ''),
                                imgUrl: that.clubLogo
                            }, 'itemCardDetail')
                        }
                        /* if (that.paramData) {
                         that.currActiveIndex = that.paramData
                         that.doClickConfirmBtn()
                         } */
                    } else {
                        Util.tipShow(res.msg || '查询次卡详情失败！')
                        return that.$router.back()
                    }
                }, function () {
                    Util.tipShow('查询次卡详情失败！')
                    return that.$router.back()
                })
            },
            doSelectPlan (index) {
                this.currActiveIndex = index
                // console.log(this.currActiveIndex)
            },
            doClickConfirmBtn () {
                var that = this
                var global = that.global
                if (that.isNotPay) {
                    return that.$router.push({name: 'discountMall'})
                }
                if (!global.userTel) {
                    return Global.bindTelPhone()
                }
                if (that.cardType == 'credit_gift') {
                    if (that.inProcessing) {
                        return Util.tipShow('兑换中，请稍候...')
                    }
                    that.doExchange()
                } else {
                    that.$router.push({
                        name: 'payDetail',
                        query: {clubId: that.clubId, id: that.cardId, num: that.currActiveIndex, techId: that.techId}
                    })
                }
            }
        }
    }
</script>
