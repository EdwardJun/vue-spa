<style lang="sass">
    @import "../sass/page/order.scss";
</style>
<template>
    <div class="page" id="order-list-page">
        <div class="order-list" ref="listEle" :style="{ height : (global.winHeight-(global.pageMode=='club' ? 2.9: 0)*global.winScale*16)+'px'}" @scroll="doHandlerOrderListScroll()">
            <div class="order-item" v-for="(order,$index) in orderList" :key="order.id">
                <router-link :to="{name:'orderDetail',query:{id:order.id}}" tag="div">{{order.clubName}}<span>{{order.downPayment>0?('￥'+order.downPayment+'元'):''}}</span><span>{{order.status | orderStatusFilter('name')}}</span></router-link>
                <router-link :to="{name:'orderDetail',query:{id:order.id}}" tag="div">
                    <div><span class="item-title">选择技师</span><span class="item-check">{{order.techId ? order.techName : '到店安排'}}</span><span v-if="order.techId"><template v-if="order.techSerialNo">[<strong>{{order.techSerialNo}}</strong>]</template></span></div>
                    <div><span class="item-title">选择项目</span><span>{{order.serviceItemName || "到店选择"}}</span></div>
                    <div><span class="item-title">到店时间</span><span>{{order.appointTime | date2FullDate}}</span></div>
                    <div v-if="order.orderType=='paid'&&(order.status=='submit' || order.status=='accept' || order.status=='complete')" v-show="order.qrShow">
                        <img :src='order.qrCodeImgSrc' v-if="order.qrCodeImgSrc"/>
                        <div>预约号：{{ order.orderNo }}</div>
                    </div>
                </router-link>
                <a class='paid' v-if="order.orderType=='paid' && order.status=='unpaid'" @click="doClickPaid($index)">支付</a>
                <a class='reminder' v-if="order.status=='submit'" @click="doClickReminder(order)">催单</a>
                <a class='inquiries' v-if="order.status=='accept'" @click="doClickInquiries(order)">问询</a>
                <router-link class='comment' v-if="order.status=='complete' && order.techId && order.commented == 'N' && (commentSwitch || order.commentSwitch)" :to="{name:'orderDetail',query:{id:order.id}}">点评</router-link>
                <router-link class='comment' v-if="order.status=='complete' && order.techId && order.commented == 'N' && (isRewardOn && !commentSwitch || order.rewardSwitch && !order.commentSwitch)" :to="{name:'techReward',query:{techId:order.techId}}">打赏</router-link>
                <a class='refunded' v-if="order.orderType=='paid' && order.status=='refund'" @click="doClickRefundQuery($index)">查询</a>
                <router-link class='reAppoint' v-if="order.status=='error'" :to="{name:'confirmOrder',query:{orderId:order.id,clubId:order.clubId,downPayment:order.downPayment,customerName:encodeURIComponent(order.customerName),itemId:order.itemId,techId:order.techId}}">预约</router-link>
                <a class='refund' :class="order.refundStatus" v-if="order.orderType=='paid' && (order.status=='refundfailure' || order.status=='reject' || order.status=='overtime' || order.ststus=='error')" @click="doClickRefund(order)">{{ order.refundStatus=='refunded'? '已退款': '退款' }}</a>
                <span class='expandBtn' v-if="order.orderType=='paid' && (order.status=='submit' || order.status=='accept' || order.status=='complete')" @click="doShowQrCode(order)" :class="{expand:order.qrShow}">{{order.qrShow?'收起':'展开'}}</span>
            </div>

            <div class="data-load-tip" :class="{ none : !showDataLoadTip }"><div>加载数据</div></div>
            <div class="finish-load-tip" :class="{ none : !showFinishLoadTip }"><div>已经加载全部数据</div></div>
            <div class="nullData" v-show="orderList.length==0 && !isAddData">
                <div></div>
                <div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div>
            </div>
        </div>
        <div id="refundDialog" :class="{ hide:!showRefundDlg }">
            <div>
                <p>系统消息</p>
                <p>{{refundInfo}}</p>
                <div @click="doClickComfirm()">确定</div>
            </div>
        </div>
        <div id="reAppointDlg" :class="{ hide: !showAppointDlg }">
            <div>
                <p>系统消息</p>
                <p>您预约的技师（{{busyTechName}}）太抢手啦，被别人先预约了~。<br/>改约其它时间无需再次付费哦~</p>
                <div>
                    <div>取消</div>
                    <div>预约</div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
    import Vue from 'vue'
    import Global from '../libs/global'
    import im from '../libs/im'
    import eventHub from '../libs/hub'
    import Util from '../libs/util'
    import OrderStatusFilter from '../filters/order-status-filter'
    import Date2FullDate from '../filters/order-date-to-full-date'
    import 'jr-qrcode'

    export default {
        filters: {
            orderStatusFilter: OrderStatusFilter,
            date2FullDate: Date2FullDate
        },
        data () {
            return {
                global: Global.data,
                orderList: [],
                dataSwitch: [],
                isDataAddEnd: false,
                isAddData: false,
                showDataLoadTip: false,    // 显示数据正在加载
                showFinishLoadTip: false,  // 显示已经加载完成
                commentSwitch: false, // 评论开关
                isRewardOn: false, // 打赏开关
                currPage: 1,
                pageSize: 10,
                currScrollTop: 0,

                // === 退款信息
                refundInfo: '您的退款申请已提交，退款将在3个工作日内退回支付账号。',
                showRefundDlg: false,
                busyTechName: '',
                showAppointDlg: false,
                payAuthCode: '',     // 微信授权码
                paramData: null,     // 自动支付的参数
                storeDataList: ['orderList', 'currPage', 'showFinishLoadTip', 'isDataAddEnd']
            }
        },
        created () {
            var that = this
            var global = that.global
            var pageData = global.pageData['orderList']
            that.paramData = Util.sessionStorage('order-list-param') || null
            that.payAuthCode = global.currPage.query.code
            if (!that.global.clubId) {
                that.queryAllCommentSwitch()
            } else {
                that.queryCommentSwitch()
            }
            that.queryOrderList(1)
            if (pageData) {
                for (var key in pageData) {
                    that[key] = pageData[key]
                }
            } else if (that.paramData && that.payAuthCode) {
                that.$http.post('../api/v2/wx/oauth2/user/openid', {
                    code: that.payAuthCode,
                    scope: 'snsapi_base',
                    wxmp: '9358',
                    userType: 'user',
                    state: 'order-list'
                }).then((result) => {
                    result = result.body
                    if (result.statusCode == 200) {
                        Util.removeSessionStorage('order-list-param')
                        that.queryOrderList(1)
                        global.loading = false
                        if (global.pageMode == 'club') {
                            eventHub.$emit('do-show-service-btn')
                        }
                    } else if (result.statusCode == '935801') {
                        Global.getOauthCode('9358', 'order-list', 'base')
                    } else {
                        Util.tipShow(result.msg || '获取openId失败！')
                    }
                }, function () {
                    Util.tipShow('获取openId失败！')
                })
            } else {
                that.queryOrderList(1)
                global.loading = false
                if (global.pageMode == 'club') {
                    eventHub.$emit('do-show-service-btn')
                }
            }
            document.title = Global.setPageTitle('order') || '我的订单'
        },
        mounted () {
            var that = this
            var global = that.global
            var pageData = global.pageData['orderList']

            if (pageData) {
                that.$nextTick(function () {
                    setTimeout(function () {
                        that.$refs.listEle.scrollTop = pageData['scrollTop']
                        global.loading = false
                        if (global.pageMode == 'club') {
                            eventHub.$emit('do-show-service-btn')
                        }
                    }, 100)
                })
            }
        },
        methods: {
            queryOrderList (page) {
                var that = this
                var global = that.global
                if (that.isAddData) {
                    return
                }
                that.isAddData = true
                page = page || that.currPage + 1

                // 更新数据加载提示
                that.showDataLoadTip = true
                that.showFinishLoadTip = false
                that.isDataAddEnd = false

                that.$http.get('../api/v2/profile/user/order/list', {
                    params: {
                        page: page,
                        pageSize: that.pageSize,
                        clubId: global.clubId
                    }
                }).then((res) => {
                    res = res.body
                    if (res && res.respData) {
                        res = res.respData
                        that.doHandlerOrderListData(res)
                        if (that.dataSwitch.length > 1) {
                            for (var i = 0; i < that.dataSwitch.length; i++) {
                                for (var j = 0; j < res.length; j++) {
                                    if (that.dataSwitch[i].clubId == res[j].clubId) {
                                        res[j].commentSwitch = that.dataSwitch[i].commentSwitch
                                        res[j].rewardSwitch = that.dataSwitch[i].rewardSwitch
                                    }
                                }
                            }
                        }
                        if (page == 1) {
                            that.orderList = res
                        } else {
                            that.orderList.push(...res)
                        }
                        if (res.length < that.pageSize) {
                            that.isDataAddEnd = true
                            if (!(page == 1 && res.length == 0)) {
                                that.showFinishLoadTip = true
                            }
                        }
                        that.currPage = page
                        that.isAddData = false
                        that.showDataLoadTip = false
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                    }
                }, () => Util.tipShow(global.loadError))
            },
            doHandlerOrderListData (list) {
                list.forEach(function (v) {
                    v.qrShow = v.qrShow || false
                })
            },
            doHandlerOrderListScroll () { // 数据列表往下滑动加载的处理
                var that = this
                var listEle = that.$refs.listEle
                that.currScrollTop = listEle.scrollTop
                if (!that.isDataAddEnd && listEle.scrollTop + listEle.clientHeight * 1.4 > listEle.scrollHeight) {
                    that.queryOrderList()
                }
            },
            doShowQrCode (order) {
                order.qrShow = !order.qrShow
                order.qrCodeImgSrc = jrQrcode.getQrBase64(order.qrCodeContent, {padding: 0})
                this.refreshDataItem(order)
            },
            doClickPaid (index) { // 支付
                var that = this
                var data = this.orderList[index]
                if (!that.global.userAgent.isWX) {
                    Util.tipShow('请您打开微信登录\'小摩豆\'公众号！')
                    return
                }
                if (!that.global.isLogin) {
                    that.$router.push({name: 'login'})
                } else {
                    that.paidOrder(data, index)
                }
            },
            doClickRefund (data) { // 退款
                var that = this
                if (data.refundStatus == 'refunded') {
                    return
                }
                if (!data.isOperating) {
                    data.isOperating = true
                    that.$http.post('../api/v2/wx/pay/refund/applyfor', {
                        bizId: data.id,
                        businessChannel: 'link',
                        clubId: data.clubId,
                        tradeChannel: 'wx',
                        tradeYear: (data['createdAt'].match(/^(\d{4})/g)[0] || (new Date()).getFullYear()),
                        userId: that.global.userId
                    }).then((res) => {
                        data.isOperating = false
                        res = res.body
                        if (res && res.respData) {
                            that.refundInfo = '您的退款申请已提交，退款将在3个工作日内退回支付账号。'
                            that.showRefundDlg = true
                            data.status = 'refund'
                        } else {
                            Util.tipShow(res.msg || '退款不成功，请重试！')
                        }
                        that.refreshDataItem(data)
                    }, () => {
                        Util.tipShow('error')
                        data.isOperating = false
                        that.refreshDataItem(data)
                    })
                }
            },
            doClickRefundQuery (index) { // 查询退款状态
                var that = this
                var data = that.orderList[index]

                if (!data.isOperating) {
                    data.isOperating = true
                    that.$http.post('../api/v2/wx/pay/refund/applyfor', {
                        bizId: data.id,
                        businessChannel: 'link',
                        clubId: data.clubId,
                        tradeChannel: 'wx',
                        tradeYear: (data['createdAt'].match(/^(\d{4})/g)[0] || (new Date().getFullYear())),
                        userId: that.global.userId
                    }).then((res) => {
                        data.isOperating = false
                        res = res.body
                        if (res && res.respData) {
                            that.refundInfo = res.msg
                            that.showRefundDlg = true
                        } else {
                            Util.tipShow(res.msg || '查询失败，请重试！')
                        }
                    }, () => {
                        Util.tipShow('error')
                        data.isOperating = false
                    })
                }
            },
            doClickReminder (item) { // 催单
                var that = this
                that.$http.get('../api/v2/club/technician/{techId}/section/bottom', {params: {techId: item.techId}}).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.telephone = res.telephone ? res.telephone.split(',') : []
                        if (that.telephone.length == 0) {
                            Util.tipShow('暂无会所电话！')
                        } else {
                            eventHub.$emit('change-tel-detail', true)
                        }
                    }
                })
            },
            doClickInquiries (data) { // 问询
                var that = this
                if (data.techId) {
                    that.$router.push({
                        name: 'chat',
                        query: {techId: data.techId, clubId: data.clubId}
                    })
                } else {
                    that.doClickReminder(data)
                }
            },
            paidOrder (data, index) {
                var that = this
                that.$http.post('../api/v2/wx/pay/paid_order_immediately', {
                    bizId: data.id,
                    sessionType: that.global.sessionType,
                    clubId: data.clubId,
                    businessChannel: 'link',
                    tradeChannel: 'wx',
                    downPayment: data.downPayment
                }).then((result) => {
                    result = result.body
                    if (result.statusCode == 200) {
                        that.payRequestObj = JSON.parse(result.respData)
                        Global.wxJsBridgeReady(() => {
                            that.onBridgeReady(data)
                        })
                    } else if (result.statusCode == '935801') {
                        Util.sessionStorage('order-list-param', index)
                        Global.getOauthCode('9358', 'order-list', 'base')
                    } else {
                        Util.tipShow(result.msg || '支付预约请求失败！')
                    }
                })
            },
            doClickComfirm () {
                var that = this
                that.showRefundDlg = false
            },
            onBridgeReady (data) {
                var that = this
                var payRequestObj = that.payRequestObj

                WeixinJSBridge.invoke('getBrandWCPayRequest', {
                    appId: payRequestObj.appId,
                    timeStamp: payRequestObj.timeStamp + '',
                    nonceStr: payRequestObj.nonceStr,
                    package: payRequestObj.package,
                    signType: payRequestObj.signType,
                    paySign: payRequestObj.paySign
                }, function (res) {
                    if (res.err_msg.indexOf('ok') >= 0) { // 支付成功之后
                        Util.tipShow('支付成功！')
                        that.$http.get('../api/v2/profile/user/order/view', {params: {id: data.id}}).then((response) => {
                            response = response.body
                            if (response.statusCode == 200) {
                                response = response.respData
                                var orderData = response.order
                                if (response.statusNow == 'submit') {
                                    data.orderNo = response.orderNo
                                    data.qrCodeImgSrc = jrQrcode.getQrBase64(response.qrCodeContent, {padding: 0})
                                    data.status = 'submit' // 更新订单状态
                                } else if (response.statusNow == 'error') {
                                    data.status = 'error'
                                    data.busyTechName = orderData.techName
                                    data.showAppointDlg = true
                                }
                                that.refreshDataItem(data)
                                that.sendMessage(data)
                            } else if (response.msg) {
                                Util.tipShow(response.msg)
                            }
                        })
                    } else {
                        Util.tipShow('未能成功支付！')
                    }
                })
            },
            refreshDataItem (item) {
                var that = this
                var list = that.orderList
                var index = list.indexOf(item)
                if (index >= 0) {
                    Vue.set(list, index, item)
                }
            },
            queryCommentSwitch () {
                var that = this
                that.$http.get('../api/v2/user/comment/switch', {params: {clubId: that.global.clubId}}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.commentSwitch = res.respData
                        if (!that.commentSwitch) {
                            that.queryReward()
                        }
                    }
                })
            },
            queryReward () {
                let that = this
                that.$http.get('../api/v2/user/reward/isRewardOn', {params: {clubId: that.global.clubId}}).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.isRewardOn = res.respData
                    }
                })
            },
            queryAllCommentSwitch () {
                let that = this
                that.$http.get('../api/v2/user/reward/comment/switch').then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.dataSwitch = res.respData
                    }
                })
            },
            // 发送环信消息
            sendMessage (data) {
                let that = this
                that.$http.get('../api/v2/club/technician/' + data.techId).then(res => {
                    res = res.body
                    im.doSendAppointTechMessage({ // 发送预约消息
                        to: res.emchatId,
                        data: {
                            appointTime: data.appointTime,
                            serviceItemName: (data.serviceItemId ? data.serviceItemName : '到店选择'),
                            orderId: data.id
                        }
                    })
                })
            }
        },
        beforeDestroy () { // 保存当前页面状态数据
            var that = this
            var pageData = that.global.pageData
            if (!pageData.orderList) pageData.orderList = {}
            pageData = pageData.orderList
            var status
            for (var k = 0; k < that.storeDataList.length; k++) {
                status = that.storeDataList[k]
                pageData[status] = that[status]
            }
            pageData.scrollTop = that.currScrollTop
        }
    }
</script>
