<style lang="sass">
    @import '../sass/page/paidCouponDetail.scss';
</style>
<template>
    <div class="page paid-coupon-page" id="paid-coupon-detail-page">
        <router-link class="title" :class="couponData.clubId" :to="{ path: '/'+couponData.clubId+'/home' }" tag="div">
            <div :style="{ backgroundImage : 'url('+(couponData.imageUrl || global.defaultClubLogo )+')' }"></div>
            <span>{{ couponData.clubName }}</span></router-link>

        <div class="item-coupon">
            <div class="item-content" :style="{ backgroundImage : 'url('+(couponData.userAct.backgroupImageUrl || global.defaultCouponBg)+')' }">
                <div class="item item-title">{{ couponData.userAct.actTitle }} <span>{{ couponData.userAct.couponTypeName }}</span></div>
                <div class="item-price" v-show="couponData.userAct.couponType=='cash'"><span>￥</span><span>{{couponData.userAct.actValue}}</span><span v-show="couponData.userAct.consumeMoney!='0'">满{{couponData.userAct.consumeMoney}}元可用</span></div>
                <div class="item-price" v-show="couponData.userAct.couponType=='gift'"><span></span><span></span><span></span></div>
                <div class="item-price" v-show="couponData.userAct.couponType=='coupon'">
                    <span>￥</span><span>{{couponData.userAct.actValue}}</span><span>原价{{couponData.userAct.consumeMoney}}元</span>
                </div>
                <div class="item-price" v-show="couponData.userAct.couponType=='discount'">
                    <span></span><span>{{couponData.userAct.actValue / 100}}折</span><span v-show="couponData.userAct.consumeMoney!='0'">满{{couponData.userAct.consumeMoney}}元可用</span>
                </div>
                <div class="item-price" v-show="couponData.userAct.couponType=='paid'">
                    <span>￥</span><span>{{couponData.userAct.actValue}}</span><span>抵{{couponData.userAct.consumeMoney}}元</span>
                </div>

                <div class="item-time" v-show="couponData.userAct.couponType=='paid'"><span>购买时间：</span><span>{{couponData.userAct.getDate}}</span></div>
                <div class="item-period"><span>券有效期：</span><span>至{{couponData.userAct.useEndDate ? couponData.userAct.useEndDate : '长期有效'}}</span>&nbsp;&nbsp;<span v-show="day != 0">剩余{{day > 0 ? day : 0}}天</span></div>
                <div class="item-time" v-show="couponData.userAct.couponType!='paid'"><span>领取时间：</span><span>{{couponData.userAct.getDate}}</span></div>
            </div>
        </div>

        <div class="item-tech" v-if="couponData.techs != null">
            <div :style="{ backgroundImage : 'url('+(couponData.techs.avatarUrl || global.defaultHeader )+')' }"></div>
            <div>
                <div>
                    <span>{{ couponData.techs.name }}</span>
                    <span>{{ couponData.techs.serialNo }}</span>
                    <div>
                        <div class="stars">
                            <!--:style="{ width : couponData.techs.star+'%' }"-->
                            <div :style="{ width : couponData.techs.star+'%' }"></div>
                        </div>
                        <!--{{ couponData.techs.commentCount }}-->
                        <div>
                            <div></div>{{ couponData.techs.commentCount }}评论
                        </div>
                    </div>
                </div>
                <div>{{ couponData.techs.description || "这个技师很懒，没有填写个人简介..." }}</div>
            </div>
        </div>

        <div class="item-code">
            <div class="item-first" v-show="couponData.userAct.couponType=='gift'">
                <div :style="{ backgroundImage : 'url('+(couponData.userAct.actLogoUrl || global.defaultServiceItemImgUrl )+')' }"></div>
                <div>
                    <div>{{couponData.userAct.actSubTitle}}</div>
                    <div>{{ couponData.userAct.actDescription }}</div>
                </div>
            </div>
            <div class="item-last">
                <div>电子票号 ( 使用时请出示二维码，或者优惠码 ) </div>
                <div>
                    <img :src="qrCodeImgSrc">
                    <div>{{couponData.userAct.couponNo}}</div>
                </div>
            </div>
        </div>

        <div class="item-contact">
            <div class="item-address">
                <div>详细地址：</div>
                <div>{{couponData.clubAddress}}</div>
                <div :class="clubDist" class="address"><router-link tag="span" :to="{ path: '/'+couponData.clubId+'/map' }">{{clubDist}}</router-link></div>
            </div>
            <div class="item-tel" @click="doClickContactClub()">
                <span>{{couponData.clubPhones}}</span>
                <TelDetail v-if="global.clubTelephone.length>0" :telephone="global.clubTelephone" :show-prefix="false"></TelDetail>
                <span @click="doClickContactClub()" :telephone="global.clubTelephone"></span>
            </div>
        </div>

        <div class="item-explain">
            <div class="item-address">
                <div>使用说明：</div>
                <div v-show="couponData.userAct.couponType!='paid'">使用时段：<span>{{ couponData.userAct.useTimePeriod }}</span></div>
                <div v-show="couponData.userAct.couponType!='paid'">使用项目：<span class="item-pack" v-if="item">{{ item }}</span></div>
                <div v-html="couponData.userAct.actContent"></div>
            </div>
        </div>
        <div class="item-no" v-show="couponData.userAct.couponType!='paid'"></div>
        <div class="item-footer" v-show="couponData.userAct.couponType!='paid'">
            <div class="item-appio" @click="doClickOrderBtn()">{{ footerBtnText }}</div>
        </div>
    </div>
</template>
<script>
    import im from '../libs/im'
    import Global from '../libs/global'
    import Util from '../libs/util'
    import 'jr-qrcode'
    import eventHub from '../libs/hub'
    import TelDetail from '../components/tel-detail'

    export default {
        components: {
            TelDetail
        },
        data () {
            return {
                global: Global.data,
                isCrossInner: false, // 是否已经与内网对接
                userActId: '',
                qrCodeImgSrc: null,
                couponData: {
                    userAct: {},
                    techs: {},
                    clubId: '',
                    imageUrl: '',
                    clubName: ''
                },
                appointType: '', // 预约类型
                item: '',
                paramData: Util.localStorage('paid-cou-detail-param'),
                inPaid: false,
                techttelFlag: 'techttel',
                payAuthCode: '',
                payRequestObj: {},
                footerBtnText: '立即预约',
                couponStatusCls: '',
                couponStatusDescription: '',
                hidePayBtn: false,
                canOrder: true, // 是否可以预约
                day: 0,
                serviceItems: [],
                clubDist: '定位中...'
            }
        },
        created () {
            let that = this
            let global = that.global
            let query = global.currPage.query
            that.userActId = query.userActId
            that.payAuthCode = query.code || global.authCode
            // global.loading = false
            if (!that.userActId) {
                Util.tipShow(global.visitError)
                that.$router.back()
            } else if (!global.isLogin) {
                Global.login(that.$router)
            } else {
                that.init()
            }
        },
        methods: {
            init () {
                let that = this
                let global = that.global
                that.$http.get('../api/v2/club/userredpacket/{userActId}', {
                    params: {
                        userType: 'paid', userActId: that.userActId
                    }
                }).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.qrCodeImgSrc = jrQrcode.getQrBase64(res.userAct.couponNo, {padding: 0})
                        let clubPhones = res.clubPhones.replace('，', ',')
                        global.clubTelephone = clubPhones ? clubPhones.split(',') : []
                        that.couponData = res
                        // 查询会所的预约类型
                        if (that.couponData.techs) {
                            that.$http.get('../api/v2/club/technician/{techId}/section/bottom', {params: {techId: that.couponData.techs.id}}).then(function (appointRes) {
                                appointRes = appointRes.body
                                if (appointRes.statusCode == 200) {
                                    appointRes = appointRes.respData
                                    that.appointType = appointRes.appointType
                                }
                            })

                            // 查询技师项目
                            that.$http.get('../api/v2/club/technician/{techId}', { params: { techId: that.couponData.techs.id } }).then(res => {
                                res = res.body
                                if (res && res.info) {
                                    that.serviceItems = res.service || []
                                    that.isCrossInner = res.hasInnerProvider == 'true'
                                }
                            }, function () {
                                Util.tipShow(global.loadError)
                            })
                        }
                        let items = that.couponData.items
                        let itemsArr = []
                        if (items) {
                            for (let i = 0; i < items.length; i++) {
                                itemsArr.push(items[i].name)
                            }
                        }
                        that.item = itemsArr.join('，')
                        if (res.userAct.useStartDate && res.userAct.useEndDate) {
                            let useEndDate = new Date(res.userAct.useEndDate.replace(/-/g, '/')).getTime()
                            let currTime = (+new Date())
                            that.day = Math.floor((useEndDate - currTime) / 1000 / 60 / 60 / 24)
                        }
                        if (res.userAct && res.userAct.couponType != 'paid' && res.userAct.couponType != 'service_item') {
                            that.setWXShare(res)
                        }
                        that.$http.post('../api/v2/club/share/view/count/update', { actId: that.userActId, techCode: '', clubId: that.global.clubId, techId: '', type: 'coupon_reward' }) // 更新用户查看数
                        // 用户定位
                        if (!global.currLaty || !global.currLaty) {
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
                    } else {
                        Util.tipShow(res.msg || '获取点钟券数据详情失败！')
                        that.$router.back()
                    }
                }, function () {
                    Util.tipShow('获取点钟券数据详情失败！')
                    that.$router.back()
                })
            },
            setWXShare (data) {
                let that = this
                that.shareLink = location.origin + '/spa-manager/coupons/#/home?actId=' + data.userAct.actId + '&userCode=' + data.userAct.userInviteCode + '&techCode=' + data.userAct.techNo + '&chanel=link'
                if (that.global.userAgent.isWX) {
                    Global.shareConfig({
                        title: data.userAct.consumeMoneyDescription || data.userAct.clubName + '-' + data.userAct.actTitle,
                        desc: '超值福利，等你领取，赶快点我。',
                        imgUrl: data.imageUrl || data.userAct.imageUrl || that.global.defaultClubLogo,
                        link: that.shareLink,
                        success () {
                            that.$http.get('../api/v2/redpacket/share', {
                                params: {
                                    userActId: data.userAct.userActId, refresh: Date.now
                                }
                            })
                        }
                    }, 'paidCouponDetail')
                }
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
            doClickOrderBtn () {
                let that = this
                let couponData = that.couponData
                if (couponData.techs == null) {
                    that.doClickContactClub()
                    return
                } else if (couponData.techs.status == 'rest') {
                    return Util.tipShow('该技师正在休假中，请预约其他技师')
                }
                if (that.canOrder) {
                    if (that.appointType == 'phone') {
                        if (!that.global.isLogin) { // 未登录，跳转到登录页
                            that.$router.push({name: 'login'})
                        } else {
                            that.doClickContactClub()
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
                                    that.doClickContactClub()
                                }, 1000)
                                return
                            }
                            that.arrIdSplit()
                            that.$router.push({
                                name: 'confirmOrder',
                                query: {
                                    techId: couponData.techs.id,
                                    itemId: '',
                                    clubId: couponData.clubId
                                }
                            })
                        }
                    } else if (that.appointType == 'appoint') {
                        that.arrIdSplit()
                        that.$router.push({
                            name: 'confirmOrder',
                            query: {
                                techId: couponData.techs.id,
                                itemId: '',
                                clubId: couponData.clubId
                            }
                        })
                    } else {
                        Util.tipShow('会所不支持线上预约！')
                    }
                }
            },
            arrIdSplit () {
                let that = this
                let arr = that.couponData.userAct.itemId.split(',')
                let itemsArr = []
                if (arr) {
                    for (let i = 0; i < arr.length; i++) {
                        if (arr[i] != '') {
                            itemsArr.push(arr[i])
                        }
                    }
                }
                that.couponData.userAct.itemId = itemsArr
            },
            doClickPayBtn () {
                let that = this
                let couponData = that.couponData
                let global = that.global
                if (that.footerBtnText != '已下线') {
                    if (that.footerBtnText == '立即支付') {
                        if (!global.userAgent.isWX) {
                            if (Global.checkAccess('paidCouponDetail')) {
                                Util.tipShow('请您打开微信登录\'小摩豆\'公众号！')
                            }
                        } else if (!global.userTel) {
                            Global.bindTelPhone()
                        } else {
                            Util.removeLocalStorage('paid-cou-detail-param')
                            if (!that.inPaid) {
                                that.inPaid = true
                                that.footerBtnText = '支付中...'
                                that.$http.post('../api/v2/wx/pay/paid_coupon_immediately', {
                                    actId: couponData.userAct.actId,  // 点钟券id
                                    businessType: 'paid_coupon',
                                    businessChannel: couponData.userAct.chanel,
                                    clubId: couponData.userAct.clubId,
                                    money: couponData.userAct.actValue,
                                    openId: global.openId,
                                    techId: couponData.techs.id,
                                    tradeChannel: 'wx',
                                    bizId: couponData.userAct.bizId,
                                    userId: global.userId
                                }).then(res => {
                                    res = res.body
                                    if (res.statusCode == 200) {
                                        res = res.respData
                                        if (res) {
                                            that.payRequestObj = JSON.parse(res)
                                            Global.wxJsBridgeReady(() => {
                                                that.onBridgeReady()
                                            })
                                        } else {
                                            that.inPaid = false
                                            that.footerBtnText = '立即预约'
                                            Util.tipShow('您已成功支付！')
                                            that.couponStatusCls = 'already'
                                            that.couponStatusDescription = '已支付'
                                        }
                                    } else if (res.statusCode == 935801) {
                                        Util.localStorage('paid-cou-detail-param', true)
                                        Global.getOauthCode('9358', 'paid-coupon-detail', 'base')
                                    } else {
                                        that.inPaid = false
                                        that.footerBtnText = '立即支付'
                                        Util.tipShow(res.msg || '购买点钟券请求失败！')
                                    }
                                })
                            }
                        }
                    } else if (that.footerBtnText == '立即预约') {
                        that.$router.push({
                            name: 'confirmOrder',
                            query: { techId: couponData.techs.id, clubId: couponData.clubId }
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
                    if (res.err_msg.indexOf('ok') >= 0) { // 支付成功之后
                        Util.tipShow('支付成功！')
                        that.footerBtnText = '立即预约'
                        that.couponStatusCls = 'already'
                        that.couponStatusDescription = '已支付'
                        that.sendMessage()
                    } else {
                        that.footerBtnText = '立即支付'
                        Util.tipShow('未能成功支付！')
                    }
                })
            },
            /**
             * 发送购买点钟券的消息
             */
            sendMessage () {
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
            }
        }
    }
</script>
