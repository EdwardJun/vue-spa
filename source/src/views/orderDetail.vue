<style lang="sass">
    @import "../sass/page/orderDetail.scss";
</style>
<template>
    <div class="page" id="order-detail-page">
        <div style="height: 100%;">
            <div>
                <div>{{clubInfo.clubName}}</div>
                <div @click="doClickTelDetail()"><div></div></div>
            </div>
            <div>
                <router-link :style="{ backgroundImage : 'url('+(orderData.techAvatarUrl || global.defaultHeader)+'),url('+global.defaultHeader+')'}" :to="{name:'chat',query:{techId:orderData.technicianId,clubId:orderData.clubId}}" tag="div" v-if="orderData.technicianId"></router-link>
                <div v-else :style="{ backgroundImage : 'url('+(orderData.techAvatarUrl || global.defaultHeader)+'),url('+global.defaultHeader+')'}"></div>
                <div>
                    <div>
                        <div>{{orderData.technicianId ? orderData.techName : '技师待定'}}</div>
                        <div v-if="orderData.technicianId"><template v-if="orderData.techSerialNo">[<span>{{orderData.techSerialNo}}</span>]</template></div>
                    </div>
                    <div>{{orderData.technicianId?(orderData.techDescription || '这个技师很懒，没有填写个人简介...'):'到店选择技师'}}</div>
                </div>
                <div :class="computeOrderStatus(orderData.status)">{{orderData.status | OrderStatusFilter('name')}}</div>
            </div>
            <div>
                <div>预约项目<span>{{orderData.serviceItemName || '到店选择'}}</span></div>
                <div>项目价格<span v-if="orderData.servicePrie">{{ orderData.servicePrie | itemPriceFormatter(orderData.serviceDuration,orderData.serviceUnit) }}</span><span v-else>待定</span></div>
                <div>到店时间<span>{{orderData.appointTime | DateFormat}}</span><span>{{orderData.appointTime | DayFormat}}</span></div>
            </div>
            <div>
                <div>联系人&nbsp;&nbsp;&nbsp;&nbsp;<span>{{orderData.customerName}}</span></div>
                <div>联系电话<span>{{orderData.phoneNum}}</span></div>
                <div>下单时间<span>{{orderData.createdAt | DateFormat}}</span></div>
                <div class="btn" v-if="orderData.status == 'submit'" @click="submitOrder()"><div>确认预约</div></div>
            </div>
            <div v-if="orderData.status == 'complete' && orderData.commented == 'Y' && clubInfo.comment">
                <div>
                    <div>我的评分<div class="star" :style="{ width: starWidth * 5+'px', 'background-size': starWidth+'px 0.778rem' }"><div :style="{width:clubInfo.comment.rate+'%'}"></div></div></div>
                    <div>我的评论<span>{{ clubInfo.comment.comment }}</span></div>
                </div>
                <div>
                    <div><div>我的打赏</div></div>
                    <div>
                        <div v-if="Array.isArray(clubInfo.rewardAmounts) && clubInfo.rewardAmounts.length>0">
                            <div v-for="reward in clubInfo.rewardAmounts"><div>{{reward | MoneyFormatter}}元</div></div>
                        </div>
                        <div v-else><div>0元</div></div>
                        <div :class="{ 'not-wx': !global.userAgent.isWX}">
                            <div @click="doClickOrderBtn()">再来一单</div>
                            <router-link tag="div" :to="{ name:'techReward', query:{ techId: orderData.technicianId, backPublic:true, commentId:(clubInfo.comment?clubInfo.comment.id:'')} }">追加打赏</router-link>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else></div>
            <router-link class="item-switch" tag="div" v-if="commentSwitch" v-show="orderData.status == 'complete' && orderData.commented == 'N' && orderData.technicianId" :to="{ name:'comment',query:{ orderId:orderData.id,type:'order',clubId:orderData.clubId,techId:orderData.technicianId,backTo: 'orderDetail' } }">立即评论</router-link>
            <router-link class="item-switch" tag="div" v-if="isRewardOn" v-show="orderData.status == 'complete' && orderData.commented == 'N' && orderData.technicianId" :to="{ name:'comment',query:{ orderId:orderData.id,type:'order',techId:orderData.technicianId,backTo: 'orderDetail' } }">立即打赏</router-link>
            <Attention></Attention>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import eventHub from '../libs/hub'
    import Util from '../libs/util'
    import OrderStatusFilter from '../filters/order-status-filter'
    import ItemPriceFormatter from '../filters/item-price-formatter'
    import MoneyFormatter from '../filters/money-formatter'
    import Attention from '../components/attention'

    export default {
        components: {
            Attention
        },
        filters: {
            OrderStatusFilter: OrderStatusFilter,
            itemPriceFormatter: ItemPriceFormatter,
            MoneyFormatter: MoneyFormatter,
            DateFormat (dt, start) {
                if (/^\d{2}:\d{2}$/g.test(dt)) {
                    dt = '今天 ' + dt
                }
                if (/今天|明天|后天|大后天/.test(dt)) {
                    start = start || new Date()
                    dt = dt.split(' ')
                    var addDay = {'今天': 0, '明天': 1, '后天': 2, '大后天': 3}
                    start.setDate(start.getDate() + addDay[dt[0]] || 0)
                    return new Date().getFullYear() + '-' + (start.getMonth() < 9 ? '0' + (start.getMonth() + 1) : (start.getMonth() + 1)) + '-' + (start.getDate() <= 9 ? '0' + start.getDate() : start.getDate()) + ' ' + dt[1]
                } else if (/^\d{2}-\d{2}/.test(dt)) {
                    return new Date().getFullYear() + '-' + dt
                } else {
                    return dt
                }
            },
            DayFormat (_v) {
                if (/^\d{2}:\d{2}$/g.test(_v)) return '今天'
                if (/^(今天|明天|后天|大后天)/g.test(_v)) return RegExp.$1
                return ''
            }
        },
        data () {
            return {
                global: Global.data,
                clubInfo: {},
                orderData: {},
                starWidth: 0,
                isRewardOn: false, // 打赏开关
                commentSwitch: false, // 评论开关
                techDescription: '这个技师很赖，没有填写个人简介...',
                techStatus: '',
                canOrder: true, // 是否可以预约
                telephone: [],
                appointType: '' // 预约类型
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            that.starWidth = Math.floor(0.889 * global.winScale * 16)
            if (!query.id) {
                Util.tipShow('无订单ID!')
                return that.$router.back()
            }
            that.$http.get('../api/v2/profile/user/order/view', {
                params: {
                    id: query.id
                }
            }).then((res) => {
                res = res.body
                if (res.statusCode == '307') {    // 重新请求一次
                    setTimeout(() => {
                        that.$http.get('../api/v2/profile/user/order/view', {
                            params: {
                                id: query.id
                            }
                        }).then((res) => {
                            res = res.body
                            if (res.statusCode != '200' || !res.respData) {
                                Util.tipShow(global.loadError)
                                that.$router.back()
                            } else {
                                that.clubInfo = res.respData
                                that.orderData = res.respData.order
                                global.loading = false
                            }
                        })
                    }, 300)
                } else if (res.statusCode != '200' || !res.respData) {
                    Util.tipShow(global.loadError)
                    that.$router.back()
                } else {
                    that.clubInfo = res.respData
                    that.orderData = res.respData.order
                    global.loading = false
                }
                that.queryCommentSwitch()
                that.init()
            })
        },
        methods: {
            computeOrderStatus (status) {
                return OrderStatusFilter(status, 'tag')
            },
            init () {
                let that = this
                let orderData = that.orderData
                that.$http.get('../api/v2/club/technician/{techId}', {params: {techId: orderData.technicianId}}).then(res => {
                    res = res.body
                    if (res && res.info) {
                        let info = res.info
                        that.techStatus = { free: '闲', busy: '忙', rest: '休' }[info.status || 'free']
                    }
                })

                that.$http.get('../api/v2/club/technician/{techId}/section/bottom', {params: {techId: orderData.technicianId}}).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.appointType = res.appointType
                        that.telephone = res.telephone ? res.telephone.split(',') : []
                    }
                })
            },
            submitOrder () { // 确认预约
                var that = this
                var orderData = that.orderData
                if (orderData.technicianId) {
                    that.$router.push({
                        name: 'chat',
                        query: {techId: orderData.technicianId, clubId: orderData.clubId}
                    })
                } else {
                    if (that.global.clubTelephone.length == 0) {
                        Util.tipShow('暂无会所电话！')
                    } else {
                        eventHub.$emit('change-tel-detail', true)
                    }
                }
            },
            queryCommentSwitch () {
                var that = this
                that.$http.get('../api/v2/user/comment/switch', {params: {clubId: that.orderData.clubId}}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.commentSwitch = res.respData
                        if (!that.commentSwitch) {
                            that.$http.get('../api/v2/user/reward/isRewardOn', {params: {clubId: that.orderData.clubId}}).then(function (res) {
                                res = res.body
                                if (res.statusCode == 200) {
                                    that.isRewardOn = res.respData
                                }
                            })
                        }
                    }
                })
            },
            doClickOrderBtn () {
                let that = this
                if (that.techStatus == '休') {
                    Util.tipShow('该技师正在休假中，请预约其他技师')
                    return false
                }
                if (that.canOrder) {
                    if (that.appointType == 'phone') {
                        if (!that.global.isLogin) { // 未登录，跳转到登录页
                            that.$router.push({name: 'login'})
                        } else {
                            that.doClickTelDetail()
                        }
                    } else if (that.appointType == 'paid' || that.appointType == 'paid_full') {
                        if (!that.global.userAgent.isWX) {
                            if (Global.checkAccess('confirmOrder')) {
                                Util.tipShow('此会所需支付预约，请在微信客户端中打开！')
                            } else {
                                Util.tipShow('会所未开通预约权限！')
                            }
                        } else {
                            if ((that.isCrossInner || that.appointType == 'paid_full') && that.serviceItems.length == 0) {
                                Util.tipShow('该技师无可选项目，请电话联系会所，谢谢！')
                                setTimeout(function () {
                                    that.doClickTelDetail()
                                }, 1000)
                                return
                            }
                            that.$router.push({
                                name: 'confirmOrder',
                                query: {techId: that.orderData.technicianId, itemId: that.orderData.serviceItemId, clubId: that.orderData.clubId}
                            })
                        }
                    } else if (that.appointType == 'appoint') {
                        that.$router.push({
                            name: 'confirmOrder',
                            query: {techId: that.orderData.technicianId, itemId: that.orderData.serviceItemId, clubId: that.orderData.clubId}
                        })
                    } else {
                        Util.tipShow('会所不支持线上预约！')
                    }
                }
            },
            doClickTelDetail () {
                let that = this
                if (that.telephone.length == 0) {
                    Util.tipShow('暂无联系电话！')
                } else {
                    eventHub.$emit('change-tel-detail', true)
                }
            }
        }
    }
</script>
