<style lang="sass">
    @import '../sass/page/paidCoupon.scss';
</style>
<template>
    <div class="page paid-coupon-page" id="paid-coupon-page">
        <div class="item-head">
            <!--会所-->
            <router-link tag="div" class="title" :to="{ path: '/'+couponData.clubId+'/home' }" :class="couponData.clubId">
                <div :style="{ backgroundImage : 'url('+(couponData.imageUrl || global.defaultClubLogo )+')' }"></div>
                <span>{{ couponData.clubName }}</span>
            </router-link>
            <!--红包-->
            <div class="item-red-packet">
                <div class="item-coupon-title">{{ couponData.actTitle }}</div>
                <div class="item-price">￥<span :class="couponData.actValue">{{ couponData.actValue }}<span>&nbsp;{{ couponData.useTypeName }}</span></span></div>
                <div class="item-price2">抵{{ couponData.consumeMoney }}元</div>
                <div class="item-tech" v-if="couponData.techs">
                    <div :style="{ 'background-image': 'url('+ (couponData.techs.avatarUrl || global.defaultHeader)+')' }"></div>
                    <div @click="doAppointment()">预约</div>
                    <!--<router-link :data-id="couponData.techs.status" :to="{ name : 'chat', query : { techId : couponData.techs.id, clubId : couponData.clubId }}" tag="div">预约</router-link>-->
                    <div>
                        <div class="stars"><div :style="{ width : couponData.techs.star+'%' }"></div></div>
                        <div><div></div>{{ (couponData.techs.star / 20).toFixed(1) }}分</div>
                    </div>
                    <div>{{ couponData.techs.description || "这个技师很懒，没有填写个人简介..." }}</div>
                </div>
                <div class="item-gift"></div>
            </div>
        </div>

        <!--详细地址-->
        <div class="item-address" v-show="couponData.address">
            <div>
                <div class="line"></div>
                <div class="item-title-address">详细地址</div>
                <div class="item-name-address">
                    <div>{{ couponData.address || "&nbsp;&nbsp;"}}</div>
                    <div @click="doMap()"><router-link tag="span" :to="{ path: '/'+couponData.clubId+'/map' }"> {{ clubDist }}</router-link></div>
                </div>
                <div class="item-tel" @click="doClickContactClub()">
                    <span>{{couponData.clubPhones}}</span>
                    <TelDetail v-if="global.clubTelephone.length>0" :telephone="global.clubTelephone" :show-prefix="false"></TelDetail>
                    <span @click="doClickContactClub()" :telephone="global.clubTelephone"></span>
                </div>
            </div>
        </div>

        <!--有效期-->
        <div class="item-period">
            <div>
                <div class="line"></div>
                <div class="item-title">优惠说明</div>
                <div class="item-date">券有效期：<div>{{ couponData.couponPeriod }}</div></div>
                <div class="item-time">使用说明：<div v-html="couponData.actContent"></div></div>
            </div>
        </div>
        <div class="item-plac"></div>

        <div class="paid-coupon-bottom-wrap">
            <div>
                <!--payCount*couponData.actValue*100 | MoneyFormatter-->
                <div>共支付 ：<span>{{ payCount * couponData.actValue }}</span>元</div>
                <span @click="doClickChangeCount(1)">+</span><span>{{ payCount }}</span><span @click="doClickChangeCount(0)">-</span>
            </div>
            <div :class="{ processing : inPaid , downline : isDownLine }" @click="doClickPayBtn()">{{ isDownLine ? "已下线" : ( inPaid ? "购买中..." : "立即购买")}}</div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import im from '../libs/im'
    import MoneyFormatter from '../filters/money-formatter'
    import eventHub from '../libs/hub'
    import TelDetail from '../components/tel-detail'

    export default {
        components: {
            TelDetail
        },
        filters: {
            MoneyFormatter
        },
        data () {
            return {
                global: Global.data,
                actId: '',
                techCode: '',
                inPaid: false,
                chanel: '',
                paramData: Util.localStorage('paid-coupon-param'),
                payAuthCode: '',
                couponData: {
                    techs: {}
                },
                footerBtnText: '立即购买',
                payCount: 1,
                isDownLine: false,
                payRequestObj: {},
                clubDist: '定位中...'
            }
        },
        created () {
            let that = this
            let global = that.global
            let query = global.currPage.query

            that.actId = query.actId
            that.techCode = query.techCode
            that.payAuthCode = query.code || global.authCode
            that.chanel = query.channel || 'link'

            if (!that.actId || !that.techCode) {
                Util.tipShow(global.visitError)
                that.$router.back()
            } else if (that.paramData && that.payAuthCode) {
                that.$http.post('../api/v2/wx/oauth2/user/openid', {
                    code: that.payAuthCode,
                    scope: 'snsapi_base',
                    wxmp: '9358',
                    userType: 'user',
                    state: 'confirm-order'
                }).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.init()
                        Util.removeLocalStorage('paid-coupon-param')
                    } else if (res.statusCode == 935801) {
                        Global.getOauthCode('9358', 'paid-coupon', 'base')
                    } else {
                        Util.tipShow(res.msg || '获取openId失败！')
                    }
                })
            } else {
                that.init()
            }
        },
        methods: {
            init () {
                let that = this
                let global = that.global

                that.$http.get('../api/v2/club/redpacket/data', {
                    params: {
                        actId: that.actId,
                        userCode: '',
                        techCode: that.techCode,
                        chanel: that.chanel,
                        phoneNum: ''
                    }
                }).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        if (res.status == 'downline_can_use') {
                            that.isDownLine = true
                        }
                        let clubPhones = res.clubPhones.replace('，', ',')
                        global.clubTelephone = clubPhones ? clubPhones.split(',') : []
                        that.couponData = res
                        that.$http.post('../api/v2/club/share/view/count/update', { actId: that.actId, techCode: that.techCode, techId: '', clubId: that.global.clubId, type: 'paid_coupon' }) // 更新用户查看数
                        // 用户定位
                        if (!global.currLngx || !global.currLaty) {
                            Util.getLocation(function (position) {
                                let coords = position.coords
                                if (coords.longitude && coords.latitude) {
                                    global.currLngx = coords.longitude
                                    global.currLaty = coords.latitude
                                } else {
                                    global.currLngx = ''
                                    global.currLaty = ''
                                }
                                that.setLocation(res)
                            }, function () {
                                that.setLocation(res)
                            })
                        } else {
                            that.setLocation(res)
                        }
                        global.loading = false
                        if (that.paramData && that.payAuthCode) {
                            that.doClickPayBtn()
                        }
                    } else {
                        Util.tipShow(res.msg || '获取点钟券数据失败！')
                        that.$router.back()
                    }
                }, function () {
                    Util.tipShow('获取点钟券数据失败！')
                    that.$router.back()
                })
            },
            setLocation (clubInfo) {
                let that = this
                let global = that.global
                if (global.currLngx && global.currLaty && clubInfo.longitude && clubInfo.latitude) {
                    let dist = ~~Util.getGreatCircleDistance(global.currLaty, global.currLngx, clubInfo.latitude, clubInfo.longitude)
                    if (dist / 1000 > 1) {
                        dist = (dist / 1000).toFixed(1) + 'km'
                    } else {
                        dist += 'm'
                    }
                    that.clubDist = dist
                } else {
                    that.clubDist = '定位失败'
                }
            },
            doClickClubInfo () { // 点击会所
                let that = this
                let global = that.global
                let couponData = that.couponData

                if (global.pageMode != 'club') {
                    that.$router.push({ name: 'home' })
                } else {
                    that.$router.push({ path: '/' + couponData.clubId + '/home' })
                }
            },
            doClickChangeCount (isAdd) {
                let that = this
                if (isAdd) {
                    if (that.payCount < 999) {
                        that.payCount++
                    }
                } else {
                    if (that.payCount > 1) {
                        that.payCount--
                    }
                }
            },
            doClickPayBtn () { // 点击购买按钮
                let that = this
                let global = that.global
                if (!that.isDownLine) {
                    if (!global.userAgent.isWX) {
                        if (Global.checkAccess('paidCoupon')) {
                            Util.tipShow('请您打开微信登录\'小摩豆\'公众号！')
                        } else {
                            Util.tipShow('会所未开通点钟券的功能！')
                        }
                        return
                    }
                    if (!global.isLogin || !global.userTel) {
                        Global.login(null, 'paidCoupon')
                        if (!global.isLogin) {
                            Util.tipShow('请您先登录！')
                            that.$router.push({name: 'login'})
                        } else {
                            Global.bindTelPhone()
                        }
                    } else if (!that.inPaid) { // 支付
                        that.inPaid = true
                        let couponData = that.couponData
                        that.$http.post('../api/v2/wx/pay/paid_coupon', {
                            actId: that.actId,
                            businessType: 'paid_coupon',
                            businessChannel: that.chanel,
                            clubId: couponData.clubId,
                            money: couponData.actValue * parseInt(that.payCount),
                            count: parseInt(that.payCount),
                            openId: global.openId,
                            techId: couponData.techs.id,
                            tradeChannel: 'wx'
                        }).then(res => {
                            res = res.body
                            if (res.statusCode == 200) {
                                that.payRequestObj = JSON.parse(res.respData)
                                Global.wxJsBridgeReady(() => {
                                    that.onBridgeReady()
                                })
                            } else if (res.statusCode == 935801) {
                                Util.localStorage('paid-coupon-param', true)
                                Global.getOauthCode('9358', 'paid-coupon', 'base')
                            } else {
                                that.inPaid = false
                                Util.tipShow(res.msg || '购买点钟券请求失败！')
                            }
                        }, () => {
                            that.inPaid = false
                            Util.tipShow('购买点钟券请求异常！')
                        })
                    }
                }
            },
            onBridgeReady () {
                let that = this
                let payRequestObj = that.payRequestObj
                WeixinJSBridge.invoke('getBrandWCPayRequest', {
                    appId: payRequestObj.appId,
                    timeStamp: payRequestObj.timeStamp + '',
                    nonceStr: payRequestObj.nonceStr,
                    package: payRequestObj.package,
                    signType: payRequestObj.signType,
                    paySign: payRequestObj.paySign
                }, function (res) {
                    that.inPaid = false
                    if (res.err_msg.indexOf('ok') >= 0) {
                        Util.tipShow('支付成功！')
                        that.sendMessage(payRequestObj.bizId)
                        setTimeout(() => {
                            that.$router.push({ name: 'paidCouponDetail', query: { userActId: payRequestObj.bizId } })
                        }, 300)
                    } else {
                        Util.tipShow('未能成功支付！')
                    }
                })
            },
            doClickContactClub () {
                let that = this
                if (!Global.checkAccess('tip_telephone')) {
                    return Util.tipShow('会所未开通此功能！')
                }
                if (that.global.clubTelephone.length == 0) {
                    Util.tipShow('暂无技师电话！')
                } else {
                    eventHub.$emit('change-tel-detail-of-tech', true)
                }
            },
            doAppointment () {
                let that = this
                let couponData = that.couponData
                let status = couponData.techs.status
                if (status == 'rest') {
                    Util.tipShow('该技师正在休假中，请预约其他技师！')
                } else {
                    that.$router.push({
                        name: 'confirmOrder',
                        query: { techId: couponData.techs.id, clubId: couponData.clubId }
                    })
                }
            },
            /**
             * 发送购买点钟券的消息
             * @param bizId
             */
            sendMessage (bizId) {
                let that = this
                let couponData = that.couponData
                let tech = couponData.techs
                im.doSendPaidCouponPurchaseTipMessage({ // 发送点钟券购买提醒消息
                    to: tech.emchatId,
                    data: {
                        name: couponData.actTitle,
                        techName: tech.name,
                        id: couponData.actId
                    }
                })
                that.$router.push({ name: 'paidCouponDetail', query: { userActId: bizId } })
            }
        }
    }
</script>
