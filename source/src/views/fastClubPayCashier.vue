<style lang="sass">
    @import '../sass/page/fastClubPayCashier.scss';
</style>
<template>
    <div class="page" id="fast-club-pay-cashier-page" :style="{height: initHeight + 'px'}">
        <div class="top-hint" v-if="unpaidCount>0">您有{{ unpaidCount }}笔订单未支付，点击<a @click="doConfirm()">查看详情</a></div>
        <div class="top-wrap" :class="{top: topPage}">
            <div class="plow">
                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>

        <div class="center-wrap">
            <div class="header"  :style="{ 'background-image' : 'url('+ global.clubLogoUrl +')'}"></div>
            <div class="name">{{ global.clubName }}</div>
        </div>

        <div class="bottom-wrap">
            <div class="tab-list">
                <div v-for="(item, index) in tabArr" :class="{active: currTab == index}" @click="doSwitchTab(index)">{{ item }}</div>
            </div>
            <input v-show="currTab==0" placeholder="请输入手牌号" v-model="orderNum" @focus="onFocusMoneyInput()" @blur="onBlurMoneyInput()" @input="onInputOrder()"/>
            <input v-show="currTab==1" placeholder="请输入房间号" v-model="roomNum" @focus="onFocusMoneyInput()" @blur="onBlurMoneyInput()" @input="onInputRoom()"/>
            <ul v-for="item in infoList" v-show="showSelected">
                <li @click="doClickSelected(item)" v-if="currTab==0">{{  item.userIdentify }}</li>
                <li @click="doClickSelected(item)" v-if="currTab==1">{{  item.name }}</li>
            </ul>
            <!-- <div>或</div>
            <input placeholder="请输入消费金额" type="number" maxlength="5" v-model="money"/> -->
            <span>请提醒收银确认信息，否则支付无法完成</span>
        </div>

        <div class="btn-wrap" :style="{ 'margin-top': mTop+'rem' }"><a @click="doNextStep()" >下一步</a></div>

        <div class="pop-modal modalTip"  :class="{active: isShowTip}">
            <div>
                <div class="title">提示</div>
                <div class="content">您有{{ unpaidCount }}笔订单未支付，是否前往查看？</div>
                <div class="btn"><span @click="doCancel()">取消</span> <span @click="doConfirm()">确认</span></div>
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
                tabArr: ['手牌号', '房间号'],
                currTab: 0, // 当前的tab页
                techName: '',
                techHeader: '',
                roomId: '',
                roomNum: '',
                orderNum: '',
                infoObj: {},
                infoList: [],
                isShowTip: false,
                showSelected: false,
                unpaidCount: 0,
                orderId: '',
                mTop: 0,
                initHeight: 0,
                topPage: false
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            var ua = global.userAgent
            that.clubId = query.clubId || global.clubId
            that.paramData = Util.localStorage('fast-club-pay-cashier-param')
            that.payAuthCode = query.code
            that.initHeight = global.winHeight
            that.mTop = global.winHeight / (16 * global.winScale) - 24.4444
            if (ua.isWX && that.paramData && that.payAuthCode) { // 获取openId
                Global.getOpenId({authCode: that.payAuthCode}).then(function (res) {
                    that.openId = res.openid
                    that.global.loading = false
                    that.init()
                })
            } else {
                that.global.loading = false
                that.init()
            }
        },
        methods: {
            init () {
                this.getUnpaidCount()
            },
            /*
            * 搜索顾客手牌
            **/
            onInputOrder () {
                var that = this
                if (!that.orderNum) {
                    return
                }
                that.$http.get('../api/v2/club/native/order/select/list', {params: {
                    clubId: that.global.clubId,
                    userIdentify: that.orderNum
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData || []
                        if (res.length == 0) {
                            that.showSelected = false
                            return Util.tipShow('您输入的手牌号不存在！')
                        }
                        that.infoList = res
                        that.showSelected = true
                    }
                }, function () {
                    Util.tipShow('请求失败！')
                })
            },
            /**
             * 搜索使用中房间选择列表
             */
            onInputRoom () {
                var that = this
                if (!that.roomNum) {
                    return
                }
                that.$http.get('../api/v2/club/native/room/simple/select/list', {params: {
                    clubId: that.global.clubId,
                    roomName: that.roomNum
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        if (res.length == 0) {
                            that.showSelected = false
                            return Util.tipShow('您输入的房间号不存在！')
                        }
                        that.infoList = res
                        that.showSelected = true
                    }
                }, function () {
                    Util.tipShow('请求失败！')
                })
            },
            doSwitchTab (index) {
                var that = this
                if (that.currTab != index) {
                    that.currTab = index
                    that.showSelected = false
                }
            },
            doNextStep () {
                var that = this
                // 用户输入手牌号，比较手牌号是否存在
                that.infoList.forEach(function (item) {
                    if (that.orderNum == item.userIdentify || that.roomNum == item.name) {
                        that.infoObj = item
                    }
                })
                if (!that.infoObj.id) {
                    if (that.currTab == 0) {
                        return Util.tipShow('请输入正确手牌号！')
                    } else {
                        return Util.tipShow('请输入正确房间号！')
                    }
                }
                if (that.currTab == 0) {
                    that.$router.push({name: 'fastPayCashier', query: {orderId: that.infoObj.id}})
                } else if (that.currTab == 1) {
                    that.$router.push({name: 'fastPayCashier', query: {roomId: that.infoObj.id}})
                }
            },
            doClickSelected (item) {
                var that = this
                that.infoObj = item
                if (that.currTab == 0) {
                    that.orderNum = item.userIdentify
                } else {
                    that.roomNum = item.name
                }
                that.showSelected = false
            },
            /**
             * 合并支付单未支付数量
             */
            getUnpaidCount () {
                var that = this
                that.$http.get('../api/v2/club/native/fast_pay/unpaid/count', {params: {
                    clubId: that.global.clubId
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        if (res.unpaidCount > 0) {
                            that.isShowTip = true
                        }
                        that.unpaidCount = res.unpaidCount
                    }
                }, function () {
                    Util.tipShow('请求失败！')
                })
            },
            doCancel () {
                this.isShowTip = false
            },
            doConfirm () {
                this.$router.push({name: 'notFastPayList'})
            },
            // 输入框获取焦点时
            onFocusMoneyInput () {
                var that = this
                that.topPage = true
                that.mTop += 4
            },
            // 输入框失去焦点时
            onBlurMoneyInput () {
                var that = this
                that.topPage = false
                that.mTop -= 4
            }
        }
    }
</script>