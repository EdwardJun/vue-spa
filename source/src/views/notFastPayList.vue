<style lang="sass">
    @import '../sass/page/notFastPayList.scss';
</style>
<template>
    <div class="page" id="not-fast-pay-list-page" :style="{height: (initHeight + (dataList.length!=0 ? 31 : 0)) + 'px'}">
        <div class="item-wrap" ref="listWrap" v-show="dataList.length!=0">
            <div class="list-wrap" ref="list">
                <div class="list" v-for="item in dataList">
                    <div class="item-list">
                        <div class="time">
                            <span>{{ item.createTime }}</span>
                            <span>待付款</span>
                        </div>
                        <div class="content">
                            <div class="item" v-for="details in item.details">
                                <div>{{ details.roomTypeName }}：<span>{{ details.roomName }}</span></div>
                                <div>手牌号：<span>{{ details.userIdentify }}</span></div>
                            </div>
                        </div>
                        <div class="price">
                            <span>订单金额： ￥{{ item.originalAmount / 100 }}</span>
                            <span>应付金额： <i>￥{{ item.payAmount / 100 }}</i></span>
                        </div>
                        <div class="btn">
                            <div @click="doClickPay(item.batchNo, item.id)">去支付</div>
                            <div @click="doClickOrder(item.batchNo)">查看订单</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="nullData" v-show="dataList.length==0">
            <div v-show="!global.loading"></div>
            <div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div>
        </div>

        <div class="pop-modal detail-modal" :class="{ active: isShowDetail }">
            <div class="detail">
                <div class="title">订单详情<i @click="doCancel()"></i></div>
                <div class="list">
                    <div class="content">
                        <div class="item" v-for="list in detailList.details">
                            <div class="room">
                                <div>{{ list.roomTypeName }}：<span>{{ list.roomName }}</span></div>
                                <div>手牌号：<span>{{ list.userIdentify }}</span></div>
                            </div>
                            <div class="service-item" v-for="item in list.itemList">
                                    <div class="name">{{ item.itemName }} * {{ item.itemCount }} <span class="price">￥{{ item.itemAmount / 100 }}</span></div>
                                    <div class="tech" v-for="employee in item.employeeList">技师:[{{ employee.employeeNo }}] <span class="bell">{{ employee.bellName }}</span></div>
                            </div>
                        </div>
                    </div>
                    <div class="sale">
                        <div class="money">订单金额： <span>￥{{ detailList.originalAmount / 100 }}</span></div>
                        <div class="appoint" >预约抵扣： <span>-￥{{ paidOrderAmount }}</span></div>
                        <div class="coupon" >用券抵扣： <span>-￥{{ couponAmount }}</span></div>
                        <div class="menber" >会员优惠： <span>-￥{{ memberAmount }}</span></div>
                    </div>
                    <div class="money">实收金额：<span>￥{{ detailList.payAmount / 100 }}</span></div>
                </div>
                <div class="btn" @click="doCancel()">确认</div>
            </div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                initHeight: 0,
                dataList: [], // 内网未支付单列表
                detailList: {}, // 合并支付单详情
                isShowDetail: false,
                orderDiscountList: [],
                paidOrderAmount: 0, // 预约抵扣
                couponAmount: 0, // 用券抵扣
                memberAmount: 0 // 会员优惠
            }
        },
        created () {
            var that = this
            that.initHeight = that.global.winHeight
            that.getPayList()
        },
        methods: {
            // 内网未支付单列表
            getPayList () {
                var that = this
                that.$http.get('../api/v2/club/native/fast_pay/list', {params: {
                    clubId: that.global.clubId,
                    batchNo: ''
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.dataList = res.respData || []
                        that.global.loading = false
                        that.isLoadOver = true
                    }
                }, function (res) {
                    that.global.loading = false
                    Util.tipShow('请求失败！')
                })
            },
            // 合并支付单详情
            doClickOrder (batchNo) {
                this.isShowDetail = true
                var that = this
                that.$http.get('../api/v2/club/native/batch/detail', {params: {
                    clubId: that.global.clubId,
                    batchNo: batchNo
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData || []
                        that.detailList = res
                        var orderDiscountList = res.orderDiscountList
                        var paidOrderAmount = 0
                        var couponAmount = 0
                        var memberAmount = 0
                        orderDiscountList.forEach(function (item) {
                            if (item.type == 'paid_order') { // 预约抵扣
                                paidOrderAmount += item.amount
                            } else if (item.type == 'coupon') { // 用券抵扣
                                couponAmount += item.amount
                            } else if (item.type == 'member') { // 会员优惠
                                memberAmount += item.amount
                            }
                        })
                        that.paidOrderAmount = paidOrderAmount / 100
                        that.couponAmount = couponAmount / 100
                        that.memberAmount = memberAmount / 100
                    }
                })
            },
            doClickPay (batchNo, id) {
                if (batchNo && id) {
                    this.$router.replace({name: 'fastPayCashier', query: {batchNo: batchNo, payId: id}})
                }
            },
            doCancel () {
                this.isShowDetail = false
            }
        }
    }
</script>