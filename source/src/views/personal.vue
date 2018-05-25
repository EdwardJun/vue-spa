<style lang="sass">
    @import '../sass/page/personal.scss';
</style>
<template>
    <div class="page" id="personal-page" :style="{'min-height': global.winHeight+'px'}">
        <div class="top">
            <div class="header" v-show="global.isLogin" :style="{ backgroundImage : 'url('+userHeader+')' }"></div>
            <div class="info" v-show="global.isLogin">
                <div>{{ global.userName }}</div>
                <div :class="{ 'bind-phone' : !global.userTel }" @click="bindTelPhone()">{{ global.userTel || '绑定手机'}}</div>
            </div>
            <div class="btn" v-show="!global.isLogin" @click="doClickLoginBtn()">登录/注册</div>
            <router-link class="edit" v-show="global.isLogin" tag="div" :to="{ name : 'info' }"></router-link>
            <div class="btn-menu">
                <router-link class="collect_btn" tag="div" :to="{ name : 'collect' }">我的收藏</router-link>
                <router-link class="coupon_btn remind-tip" tag="div" :to="{ name : 'coupon' }">优惠券<i v-show="global.reminds.coupon"></i></router-link>
                <router-link class="member_btn" tag="div" :class="{ hide: global.pageMode!='9358' && !global.clubCfg.accountSwitch }" :to="{ name : (global.pageMode=='club' ? 'accountDetail' : 'account') }">会员卡</router-link>
                <router-link class="integral_btn" tag="div" :class="{ hide: global.pageMode!='9358' && !global.clubCfg.creditSwitch }" :to="{ name : (global.pageMode=='club' ? 'integralDetail' : 'integral') }">积分</router-link>
            </div>
        </div>

        <div class="order-wrap">
            <div>我的订单</div>
            <div>
                <router-link class="discount_mall_btn remind-tip" tag="div" :to="{ name: 'itemCardOrders' }" v-show="showItemCard">{{menuMall}}<i v-show="global.reminds.itemCard"></i></router-link>
                 <router-link  class="item_limit_btn remind-tip" tag="div" :to="{ name: 'limit' }" >限时抢购<i v-show="global.reminds.itemLimit"></i></router-link>
                <router-link class="appoint_btn remind-tip" tag="div" :to="{ name: 'order' }">{{menuOrder}}<i v-show="global.reminds.order"></i></router-link>
                <router-link class="paid_coupon_btn remind-tip" tag="div" :to="{ name: 'oClockCoupon' }">点钟券<i v-show="global.reminds.orderCoupon"></i></router-link>
                <!--<router-link class="group_buy_btn" tag="div" :to="{ name: 'groupBuyRecords' }">拼团</router-link> -->
            </div>
        </div>

        <div class="menu-wrap">
            <!-- <router-link :to="{ name : 'oneYuanRecords' }" style="display:none">
                <div class="oneYuan"></div>
                <div>夺宝</div>
                <div class="right-arrow"></div>
            </router-link> -->
            <router-link :to="{ name : 'lucky' }">
                <div class="lucky"></div>
                <div>抽奖记录</div>
                <div class="right-arrow"></div>
            </router-link>
            <router-link :to="{ name : 'fastPayRecords' }" v-show="showFastPay">
                <div class="fastPay"></div>
                <div>买单记录</div>
                <div class="right-arrow"></div>
            </router-link>
            <router-link :to="{ name : 'serviceItemCoupon' }">
                <div class="serviceItemCoupon"></div>
                <div class="remind-tip service-item-coupon">我的项目券<i v-show="global.reminds.itemCoupon"></i></div>
                <div class="right-arrow"></div>
            </router-link>
        </div>

        <!--@click="doClickSuggestionBtn()" :to="{ name : 'suggestions' }"-->
        <router-link tag="div" :to="{ name : 'suggestions' }" class="suggestion-wrap" v-show="global.pageMode=='club' && global.clubTelephone.length>0">
            <div class="suggestions"></div>
            <div>投诉建议</div>
            <div class="right-arrow"></div>
        </router-link>

        <div class="wx-wrap" v-show="showWxUnbind" @click="doClickUnbandWx()">
            <div class="unbind-wechat"></div>
            <div>解除微信绑定</div>
            <div class="right-arrow"></div>
        </div>

        <div class="phone-wrap" style="display: none" @click="doClickUnbandTel()">
            <div class="unbind-phone"></div>
            <div>解除手机绑定</div>
            <div class="right-arrow"></div>
        </div>

        <div class="exit-wrap" v-show="global.isLogin && showExitBtn" @click="doClickLogout()">
            <div class="logout"></div>
            <div>退出登录</div>
            <div class="right-arrow"></div>
        </div>

        <Attention></Attention>

        <div class="confirm-logout pop-modal" :class="{ active : showLogout }">
            <div class="center-wrap">
                <div>确认退出登录？</div>
                <div><a @click="doClickLogoutBtn('cancel')">取消</a><a @click="doClickLogoutBtn('ok')">确定</a></div>
            </div>
        </div>

        <div :class="{ active: showUnbindPhoneDialog }" class="unbind-dialog pop-modal">
            <div class="center-wrap">
                <div>
                    <p class="h2">解除手机绑定</p>
                    <p>解除手机绑定后，将清空微信部分数据，手机登录照常显示。</p>
                </div>
                <div><a @click="doClickUnbindBtn('cancel')">取消</a><a @click="doClickUnbindBtn('ok')">确定</a></div>
            </div>
        </div>

        <!--邀请有礼入口按钮-->
        <router-link tag="div" id="invite-btn" :to="{name: 'inviteActivity'}" v-if="showInviteBtn"></router-link>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import IM from '../libs/im'
    import eventHub from '../libs/hub'
    import Attention from '../components/attention'

    export default {
        components: {
            Attention
        },
        data () {
            return {
                global: Global.data,
                showExitBtn: true,
                showWxUnbind: false,
                isWXUnbind: false,
                showLogout: false,
                userHeader: Global.data.userHeader,

                isInUnbinding: false, // 是否正在解绑操作中 -- 状态标记
                showUnbindPhoneDialog: false, // 显示解绑的确认框
                showFastPay: false, // 是否显示买单记录入口
                showItemCard: false, // 是否显示次卡订单入口
                showInviteBtn: false, // 是否显示邀请有礼入口按钮

                // '我的订单'中，自定义菜单名称的关联
                menuMall: '',
                menuOrder: ''
            }
        },
        created () {
            let that = this
            let global = that.global
            let ua = global.userAgent
            if ((ua.isWX || ua.isAliPay) && (global.userName == global.defaultName)) {
                if (ua.isWX) {
                    return Global.getOauthCode('9358', '9358', 'userInfo')
                } else {
                    return Global.getOauthCodeOfAlipay('9358', 'userInfo')
                }
            }
            if (global.clubCfg.accountSwitch == null) { // 获取开关状态
                Global.getClubSwitches()
            }
            if (global.isLogin) {
                if (global.loginChanel == '9358' && global.userTel) {
                    that.$http.get('../api/v2/wx/current/check_bind').then(function (res) {
                        res = res.body
                        if (res.statusCode == 200) {
                            if (res.msg == 'Y') {
                                that.showExitBtn = false
                                that.isWXUnbind = true
                            } else {
                                global.userTel = null
                                Util.removeLocalStorage('userTel')
                                location.reload()
                            }
                        } else {
                            Util.tipShow(res.msg || '检查绑定状态失败')
                        }
                        global.loading = false
                        if (global.pageMode == 'club') {
                            eventHub.$emit('do-show-service-btn')
                        }
                    })
                } else if (global.userTel) {
                    that.$http.get('../api/v2/wx/check_bind', {params: {phoneNum: global.userTel}}).then(function (res) {
                        res = res.body
                        if (res.statusCode == 200) {
                            if (res.respData != 1) {
                                that.showWxUnbind = false
                            }
                        } else {
                            Util.tipShow(res.msg || '检查绑定状态失败')
                        }
                        global.loading = false
                        if (global.pageMode == 'club') {
                            eventHub.$emit('do-show-service-btn')
                        }
                    })
                } else {
                    that.showExitBtn = false
                    global.loading = false
                    if (global.pageMode == 'club') {
                        eventHub.$emit('do-show-service-btn')
                    }
                }
            } else {
                global.loading = false
                if (global.pageMode == 'club') {
                    eventHub.$emit('do-show-service-btn')
                }
            }

            that.showFastPay = Global.checkAccess('fastPayRecords', false)
            that.showItemCard = Global.checkAccess('itemCardSellRecords', false)

            document.title = Global.setPageTitle('personal') || '个人中心'
            that.menuMall = Global.setPageTitle('discountMall') || '特惠商城'
            that.menuOrder = Global.setPageTitle('order') || '预约'
            // 获取当前会所邀请有礼是否开启
            if (global.pageMode == 'club') {
                that.$http.get('../api/v2/club/user/invite/enable', {params: {clubId: global.clubId}}).then(function (inviteRes) {
                    inviteRes = inviteRes.body
                    if (inviteRes.statusCode == 200 && inviteRes.respData === true) {
                        that.showInviteBtn = true
                    }
                })
            }

            if (global.currPage.query.debug == 1) {
                that.showWxUnbind = true
            }
            that.userHeader = global.userHeader
            Global.queryReminds() // 查询券的提醒数目
        },
        methods: {
            bindTelPhone () {
                var that = this
                var global = that.global
                if (!global.userTel) {
                    Global.bindTelPhone()
                }
            },
            doClickLoginBtn () {
                var that = this
                var global = that.global
                global.loginPage = 'personal'
                global.loginPageQuery = {}
                that.$router.push({name: 'login'})
            },
            doClickUnbandTel () { // 解除手机绑定
                var that = this
                that.showUnbindPhoneDialog = true
            },
            doClickLogout () { // 点击退出登录
                this.showLogout = true
            },
            doClickUnbindBtn (type) {
                var that = this
                var global = that.global
                var lsc = Util.removeLocalStorage
                if (type == 'cancel') {
                    that.showUnbindPhoneDialog = false
                } else {
                    if (!that.isInUnbinding) {
                        that.isInUnbinding = true
                        that.$http.post('../api/v2/wx/current/unbind').then(function (res) {
                            res = res.body
                            that.isInUnbinding = false
                            that.showUnbindPhoneDialog = false
                            if (res.statusCode == 200) {
                                if (that.isWXUnbind) {
                                    global.userTel = ''
                                    lsc('userTel')
                                    global.token = res.respData
                                    Util.localStorage('token', global.token)

                                    // 获取用户信息
                                    that.$http.post('../api/v2/wx/current/userInfo').then(function (infoRes) {
                                        infoRes = infoRes.body
                                        if (infoRes.statusCode == 200) {
                                            infoRes = infoRes.respData
                                            global.userName = infoRes.nickName || global.defaultName
                                            global.userHeader = infoRes.avatarUrl || infoRes.headingurl || global.userHeader
                                            global.userId = infoRes.userId
                                            Util.localStorage('userID', global.userId)

                                            // =====================更新IM对象 重新登录
                                            IM.userId = global.userId
                                        } else {
                                            global.userName = global.defaultName
                                            global.userHeader = global.defaultHeader
                                        }
                                    })
                                }
                                Util.tipShow('解绑成功！')
                            } else {
                                Util.tipShow(res.msg || '解绑失败！')
                            }
                        }, function () {
                            that.isInUnbinding = false
                            that.showUnbindPhoneDialog = false
                            Util.tipShow('解绑失败！')
                        })
                    } else {
                        Util.tipShow('正在解绑...')
                    }
                }
            },
            doClickLogoutBtn (type) { // 点击确认退出弹窗中的按钮
                var that = this
                if (type == 'cancel') { // cancel
                    that.showLogout = false
                } else { // OK
                    that.$http.get('../api/v1/user/logout').then(function () {
                        Global.clearLoginInfo()
                        that.showLogout = false
                    })
                }
            },
            doClickItemLimitBtn () {
                Util.tipShow('暂未开通！')
            },
            doClickPaidCouponBtn () {
                Util.tipShow('暂未开通！')
            },
            /**
             * 点击投诉意见菜单条目的处理
             */
            doClickSuggestionBtn () {
                let that = this
                if (that.global.clubTelephone.length > 0) {
                    eventHub.$emit('change-tel-detail', true)
                } else {
                    Util.tipShow('暂无会所电话！')
                }
            },
            /**
             * 解绑微信
             * @return
             */
            doClickUnbandWx () {
                let that = this
                that.$http.post('../api/v2/wx/current/unbind', {}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        Util.tipShow('解绑成功！')
                        setTimeout(function () {
                            location.reload()
                        }, 1500)
                    } else {
                        Util.tipShow('解绑失败！')
                    }
                })
            }
        }
    }
</script>
