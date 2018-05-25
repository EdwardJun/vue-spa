
<style lang="sass">@import '../sass/page/technicianDetail.scss';</style>
<template>
    <div>
        <div class="page" id="technician-detail-page" :style="{ 'min-height': global.winHeight + 'px' }" :class="{'no-padding': blacklistModal }">
            <div class="top">
                <router-link :to="{ path: '/' + clubId + '/home' }" tag="div" class="home" :class="{ right: blacklistModal }"></router-link>
                <div class="blacklist" @click="showMask" v-show="!blacklistModal"></div>
                <div class="header" v-if="techAvatarUrl" :style="{ backgroundImage : 'url('+techAvatarUrl+')' }"><div :class="techStatus">{{ techStatusName }}</div></div>
                <div class="name">{{ techName }}<span v-show="techNo">{{ techNo }}</span></div>
                <div class="desc" v-show="techDesc">{{ techDesc }}</div>
                <div class="collect-btn" :class="{ collected : isFavorite }" @click="doClickCollectBtn()"><div></div><div>{{ collectedText }}</div><span>{{ favoriteCount }}</span></div>
                <div class="pics clear-fix" v-show="techPics.length>0">
                    <router-link v-for="pic in techPics" tag="div" :key="pic.id" :style="{ backgroundImage : 'url('+pic.imageUrl+')' }" :to="{ name : 'technicianImg' , query : { id : techId , index : pic.orders }}"></router-link>
                </div>
            </div>

            <div class="service-item" v-show="serviceItems.length>0 && displaySelectProject">
                <div class="title">服务项目</div>
                <div class="wrap">
                    <div class="item" v-for="service in serviceItems" @click="doSelectServiceItem(service.id)">
                        <router-link :to="{name: 'serviceItem', query: { id: service.id }}" tag="div" :style="{ backgroundImage : 'url('+service.imageUrl+')' }"></router-link>
                        <div>
                            <div>{{ service.name }}</div>
                            <div>{{service.price1 | ItemPriceFormatter(service.duration1,service.durationUnit)}}</div>
                            <div v-show="service.price2">{{service.price2 | ItemPriceFormatter(service.duration2,service.durationUnitPlus)}}<span></span></div>
                        </div>
                        <div @click="doClickOrderItemBtn(service)">约项目</div>
                    </div>
                </div>
            </div>

            <div class="view" @click="doViewOtherTech()">
                <div class="tip">更多技师</div>
                <div class="other-tech" v-for="item in otherTechs" :style="{'background-image': 'url('+item.avatarUrl+')'}"></div>
            </div>

            <!--评论-->
            <div class="comments-wrap">
                <div class="comments-wrap_h">技师点评</div>
                <ul class="comments-list">
                    <li class="comments-item" v-for="comment in commentList" :key="comment.id">
                        <div class="comments-item_h">
                            <div :style="{ 'background-image': 'url('+ (comment.avatarUrl || global.defaultHeader) +')' }"></div>
                            <div>{{ comment.name }}</div>
                            <div>{{ comment.createdAt | DateFormatter('yyyy-MM-dd hh:mm') }}</div>
                        </div>
                        <div class="comments-item_bd" v-html="comment.comment"></div>
                        <div class="comments-item_ft">
                            <div v-for="rate in comment.commentRateList" :key="rate.id"><label>{{ rate.commentTagName }}</label><div><div :style="{ width: (0.61111 * rate.commentRate/100) + 'rem' }"></div>{{ parseInt(rate.commentRate / 20) }}</div></div>
                        </div>
                    </li>
                </ul>
                <div class="data-load-tip" :class="{ none : !showDataLoadTip }"><div>加载数据</div></div>
                <div class="finish-load-tip" :class="{ none : !showFinishLoadTip }"><div>已加载完全部数据</div></div>
                <div class="no-comments" v-show="commentList.length==0 && !isAddData">暂无点评...</div>
            </div>
        </div>
        <div class="submit-button footer" v-show="blacklistModal" @click="removeBlacklist">移出黑名单</div>

        <!--底部按钮-->
        <div class="tech-detail-footer-wrap" v-show="!blacklistModal">
            <a @click="doClickRewardBtn()">打赏</a>
            <router-link :to="{ name : 'chat', query : { techId: techId, clubId: clubId } }">聊天</router-link>
            <a @click="doClickOrderBtn()" :class="{ active : canOrder, unable: techStatus == 'free' }">约<b>Ta</b></a>
        </div>

        <!--电话弹窗-->
        <TelDetail v-if="telephone.length>0 && global.pageMode != 'club'" :telephone="telephone"></TelDetail>

        <!--抢优惠按钮-->
        <div class="club-coupon" v-show="!(paidCoupons.length==0 && ordinaryCoupons.length==0)" @click="switchCouponListStatus(true)">
            <div></div><span>抢优惠</span>
        </div>

        <!--优惠券列表弹窗-->
        <div class="coupon-list" :class="{ active : showCouponList }">
            <div>
                <div class="title"><span>抢优惠</span><div @click="switchCouponListStatus(false)">&times;</div></div>
                <div class="list">
                    <div class="coupon-title" v-if="paidCoupons.length>0">点钟券</div>
                    <div class="coupon-item paid" v-for="coupon in paidCoupons" @click="doViewPaidCoupon(coupon)">
                        <div>
                            <div>{{ coupon.actTitle }}</div>
                            <div>{{ coupon.consumeMoneyDescription }}</div>
                        </div>
                        <div>
                            <div>点钟券</div>
                            <div @click="doGetPaidCoupon(coupon, $event)">立即购买</div>
                        </div>
                    </div>
                    <div class="coupon-title" v-if="ordinaryCoupons.length>0">优惠券</div>
                    <div class="coupon-item ordinary" v-for="coupon in ordinaryCoupons">
                        <div>
                            <div>{{ coupon.actTitle }}</div>
                            <div>{{ (coupon.useType == 'money' ? (coupon.actValue + '元现金券，') : '') + coupon.consumeMoneyDescription }}</div>
                        </div>
                        <div>
                            <div>{{ coupon.useTypeName }}</div>
                            <div :class="{ disabled: coupon.getFlag=='already_get' || coupon.getFlag == 'finish_get' }" @click="doGetOrdinaryCoupon(coupon,$event)">{{ (coupon.getFlag == 'already_get' ? '已领取' : (coupon.getFlag == 'finish_get' ? '已领完' :'立即领取')) }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!--加入黑名单确认弹窗-->
        <transition name="fade">
            <div class="modal-mask" v-show="listShow" @click.self="hideMask">
                <div class="horizontal-wrap">
                    <div class="title">加入黑名单，你将不再收到对方的消息！</div>
                    <div class="footer">
                        <div class="submit" @click="addBlacklist">确定</div>
                        <div class="cancel" @click="hideMask">取消</div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import eventHub from '../libs/hub'
    import ItemPriceFormatter from '../filters/item-price-formatter'
    import im from '../libs/im'
    import TelDetail from '../components/tel-detail'
    import DateFormatter from '../filters/date-formatter'

    export default {
        components: {
            TelDetail
        },
        filters: {
            ItemPriceFormatter, DateFormatter
        },
        data () {
            return {
                global: Global.data,
                canReward: true, // 是否可以打赏
                techId: '', // 技师ID
                techChatId: '', // 技师聊天ID
                clubId: '', // 会所ID
                techAvatarUrl: '',   // 技师头像
                techAvatar: '', // 技师头像ID
                techName: '', // 技师名称
                techNo: '', // 技师编号
                techStatus: 'free',
                techStatusName: '', // 技师状态
                techDesc: '', // 技师自评
                techInviteCode: '', // 技师邀请码
                favoriteCount: 0, // 技师收藏数

                techPics: [], // 技师相片
                techCommentCount: 0, // 技师评论数
                techStar: 0, // 技师星级
                serviceItems: [], // 服务项目列表
                canComment: false, // 是否可评论
                isFavorite: false, // 是否已收藏
                collectedAniTimer: null,
                showCollectedAni: false,
                collectedText: '收藏',

                canOrder: true, // 是否可以预约
                appointType: '',
                telephone: [], // 电话
                currSelectItem: '', // 当前选中的项目
                paidCoupons: [], // 点钟券数据
                ordinaryCoupons: [], // 普通优惠券数据
                showCouponList: false, // 是否显示优惠券列表
                contactList: [], // 联系人列表
                contactObj: [], // 联系人列表

                listShow: false,
                blacklistModal: false,
                btnSwitch: true, // 按钮能否点击，类似于button的disabled
                payRequestObj: null,
                payTarget: null,
                payCoupon: null,
                commentSwitch: false,
                otherTechs: [],

                commentList: [],
                commentPage: 1,
                commentPageSize: 4,
                showDataLoadTip: false, // 显示数据正在加载
                showFinishLoadTip: false, // 显示已经加载完成
                isDataAddEnd: false, // 数据是否已加载完
                isAddData: false // 数据是否正在加载
            }
        },
        computed: {
            displaySelectProject () {
                return Global.checkAccess('display_select_project', false)
            }
        },
        created () {
            const that = this
            const global = that.global
            let query = global.currPage.query
            that.friendId = query.id
            if (!query.id) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            that.init()
        },
        methods: {
            init () {
                const that = this
                const global = that.global
                const query = global.currPage.query
                window.aa = that

                // 查询技师数据
                that.$http.get('../api/v2/club/technician/{techId}', { params: { techId: query.id } }).then(res => {
                    res = res.body
                    if (res && res.info) {
                        let info = res.info
                        that.techId = res.id
                        that.techChatId = res.emchatId
                        that.clubId = info.clubId
                        that.techAvatarUrl = info.avatarUrl || global.defaultHeader
                        that.techAvatar = info.avatar || ''
                        that.techName = info.name || global.defaultTechName
                        that.techNo = info.serialNo || ''
                        that.techStatus = info.status
                        that.techStatusName = { free: '闲', busy: '忙', rest: '休' }[info.status || 'free']
                        that.techInviteCode = info.inviteCode || ''
                        that.techCommentCount = info.commentCount || 0
                        that.techStar = info.star || 0
                        that.techDesc = info.description
                        that.serviceItems = res.service || []

                        that.queryCommentSwitch()
                        global.loading = false

                        // 设置分享
                        if (global.userAgent.isWX) {
                            Global.shareConfig({
                                title: that.techName + '欢迎您',
                                desc: '点我聊聊，更多优惠，更好服务！',
                                link: global.prefixPathname + '#/' + that.clubId + '/technicianDetail?visitChannel=9358&isNeedFollow=true&id=' + that.techId,
                                imgUrl: that.techAvatarUrl
                            }, 'technicianDetail-' + that.techId)
                        }
                        that.getCouponData() // 获取优惠券数据
                        that.queryOtherTech() // 查询其他技师头像
                    } else {
                        Util.tipShow(global.loadError)
                        that.$router.back()
                    }
                }, () => {
                    Util.tipShow(global.loadError)
                    that.$router.back()
                })

                // 查询技师是否被拉黑
                that.$http.post('../api/v1/emchat/in/blacklist', { userId: global.userId, friendId: that.friendId }).then(res => {
                    res = res.body
                    if (res.respData.inBlacklist) {
                        that.blacklistModal = true
                    }
                })

                // 查询技师的是否收藏
                if (global.isLogin) {
                    that.$http.get('../api/v2/club/technician/{techId}/section/top', { params: { techId: query.id } }).then(collectRes => {
                        collectRes = collectRes.body
                        if (collectRes.statusCode == 200) {
                            collectRes = collectRes.respData
                            that.favoriteCount = parseInt(collectRes.favoriteCount || 0)
                            that.isFavorite = (collectRes.isFavorite || 'n').toLowerCase() == 'y'
                            that.canComment = collectRes.toDayCommentCount != 1
                        }
                    })
                }

                // 查询会所的预约类型
                that.$http.get('../api/v2/club/technician/{techId}/section/bottom', { params: { techId: query.id } }).then(appointRes => {
                    appointRes = appointRes.body
                    if (appointRes.statusCode == 200) {
                        appointRes = appointRes.respData
                        that.canReward = appointRes.isRewardOn // 是否可以打赏
                        that.telephone = appointRes.telephone ? appointRes.telephone.split(',') : []
                        that.appointType = appointRes.appointType
                        that.downPayment = appointRes.downPayment
                    }
                })

                // 查询技师相册
                that.$http.get('../api/v2/club/tech/albums/{techId}', { params: { techId: query.id } }).then(picRes => {
                    picRes = picRes.body
                    if (picRes.statusCode == 200) {
                        picRes = picRes.respData
                        if (picRes) {  // 技师相册缓存到global
                            let pageData = global.pageData
                            if (!pageData['technicianImg']) {
                                pageData['technicianImg'] = {}
                            }
                            picRes.sort(function (pic1, pic2) {
                                return pic1.orders > pic2.orders
                            })
                            picRes.forEach(function (item, index) {
                                item.orders = index + 1
                            })
                            pageData['technicianImg'][query.id] = picRes
                            that.techPics = picRes
                        }
                    }
                })
            },
            showMask () {
                this.listShow = true
            },
            hideMask () {
                this.listShow = false
            },
            doClickOrderItemBtn (serviceItem) {
                const that = this
                that.currSelectItem = serviceItem.id
                that.doClickOrderBtn()
            },
            // 加入黑名单
            addBlacklist () {
                const that = this
                const global = that.global
                let ss = Util.sessionStorage
                let cacheData = ss('message-data')
                cacheData = cacheData ? JSON.parse(cacheData) : null
                if (cacheData) {
                    that.contactList = cacheData.contactList
                    that.contactObj = that.contactList[0]
                }
                if (!that.btnSwitch) {
                    return false
                }
                that.btnSwitch = false
                that.$http.post('../api/v1/emchat/add/blacklist', { userId: global.userId, friendId: this.friendId }).then(res => {
                    that.btnSwitch = true
                    res = res.body
                    if (res.statusCode == '200') { // 关闭弹窗
                        Util.tipShow('加入黑名单成功！')
                        that.hideMask()
                        that.blacklistModal = true
                        im.delMessage(this.techChatId)
                        let list = that.contactObj['list']
                        let itemIndex = ''
                        for (let i = 0; i < list.length; i++) {
                            if (list[i].friendUserId == this.friendId) {
                                itemIndex = i
                                break
                            }
                        }
                        that.contactObj.list.splice(itemIndex, 1)
                        ss('message-data', JSON.stringify(cacheData))
                    } else {
                        Util.tipShow('对方还不是你的联系人，无法加入黑名单！')
                        that.hideMask()
                    }
                })
            },
            // 移出黑名单
            removeBlacklist () {
                const that = this
                const global = that.global
                if (!that.btnSwitch) {
                    return false
                }
                that.$http.post('../api/v1/emchat/remove/blacklist', { userId: global.userId, friendId: that.friendId }).then(res => {
                    that.btnSwitch = true
                    res = res.body
                    if (res.statusCode == '200') {
                        Util.tipShow('移出黑名单成功！')
                        that.blacklistModal = false
                    } else {
                        Util.tipShow(res.msg)
                    }
                })
            },
            doViewOtherTech () {
                const that = this
                that.global.pageData['technicianList'] = null
                that.$router.push({ path: '/' + that.clubId + '/technicianList', query: { clubsource: '9358' } })
            },
            doSelectServiceItem (itemId) { // 选择服务项目
                const that = this
                if (that.currSelectItem == itemId) {
                    that.currSelectItem = ''
                } else {
                    that.currSelectItem = itemId
                }
            },
            // 查询其他技师头像
            queryOtherTech () {
                const that = this
                that.$http.post('../api/v2/club/' + that.clubId + '/technician', {
                    clubId: that.clubId,
                    page: 1,
                    pageSize: 10,
                    stateActiveId: 'all',
                    scoreActiveId: 1,
                    itemActiveId: -1,
                    techName: ''
                }).then(res => {
                    res = res.body
                    if (res && res.list) {
                        let arr = []
                        let i = 0
                        let list = res.list
                        while (i < list.length && arr.length < 3) {
                            if (list[i].id != that.techId && list[i].avatarUrl) {
                                arr.push(list[i])
                            }
                            i++
                        }
                        that.otherTechs = arr
                    }
                })
            },
            doClickRewardBtn () { // 点击打赏按钮
                const that = this
                if (!that.canReward) {
                    return Util.tipShow('会所关闭了打赏功能！')
                }
                that.$router.push({ name: 'techReward', query: { techId: that.techId, techName: that.techName } })
            },
            doClickOrderBtn () { // 点击预约按钮
                const that = this
                const global = that.global
                if (that.techStatus == 'free') {
                    Util.tipShow('该技师正在休假中，请预约其他技师！')
                    return false
                }
                if (that.canOrder) {
                    if (that.appointType == 'phone') {
                        if (!global.isLogin) { // 未登录，跳转到登录页
                            that.$router.push({ name: 'login' })
                        } else if (that.telephone.length == 0) {
                            Util.tipShow('暂无联系电话！')
                        } else {
                            eventHub.$emit('change-tel-detail', true)
                        }
                    } else if (that.appointType == 'paid' || that.appointType == 'paid_full') {
                        if (!global.userAgent.isWX) {
                            if (Global.checkAccess('confirmOrder')) {
                                Util.tipShow('此会所需支付预约，请在微信客户端中打开！')
                            } else {
                                Util.tipShow('会所未开通预约权限！')
                            }
                        } else {
                            if ((that.appointType == 'paid_full') && !that.currSelectItem) {
                                return Util.tipShow('必须选择一个服务项目！', 4000)
                            }
                            that.$router.push({
                                name: 'confirmOrder',
                                query: { techId: that.techId, itemId: that.currSelectItem, clubId: that.clubId }
                            })
                        }
                    } else if (that.appointType == 'appoint') {
                        that.$router.push({
                            name: 'confirmOrder',
                            query: { techId: that.techId, itemId: that.currSelectItem, clubId: that.clubId }
                        })
                    } else {
                        Util.tipShow('会所不支持线上预约！')
                    }
                }
            },
            switchCouponListStatus (type) { // 切换优惠券的显示
                if (!Global.checkAccess('tip_paid_order')) {
                    return Util.tipShow('会所未开通此功能！')
                }
                this.showCouponList = type
            },
            doClickCollectBtn () { // 点击收藏按钮
                const that = this
                const global = that.global
                if (!Global.checkAccess('tip_store_tech')) {
                    return Util.tipShow('会所未开通此功能！')
                }
                if (!global.isLogin) {
                    Global.login(that.$router)
                    return
                }
                if (that.collectedAniTimer) {
                    clearTimeout(that.collectedAniTimer)
                    that.showCollectedAni = false
                }
                that.$http.get('../api/v2/profile/user/favorite/' + (that.isFavorite ? 'delete' : 'create'), { params: { id: that.techId } }).then(() => {
                    that.isFavorite = !that.isFavorite
                    if (that.isFavorite) {
                        that.collectedText = '已收藏'
                        that.favoriteCount += 1
                    } else {
                        that.collectedText = '收藏'
                        that.favoriteCount -= 1
                    }
                    that.showCollectedAni = true
                    that.collectedAniTimer = setTimeout(() => {
                        that.showCollectedAni = false
                    }, 1100)
                    Util.removeSessionStorage('collect_data')
                })
            },
            doViewPaidCoupon (coupon) {
                const that = this
                const global = that.global
                that.$router.push({
                    name: 'paidCoupon',
                    query: {
                        actId: coupon.actId,
                        techCode: that.techInviteCode,
                        chanel: global.currPage.query.chanel || 'link'
                    }
                })
            },
            getCouponData () { // 获取优惠券数据
                const that = this
                that.$http.get('../api/v1/profile/redpack/list', { params: { clubId: that.clubId } }).then(res => {
                    res = res.body
                    if (res && res.statusCode == 200) {
                        res = res.respData.coupons || []
                        res.sort(function (a, b) {
                            return a.useType >= b.useType ? ((b.consumeMoney - b.actValue) - (a.consumeMoney - a.actValue)) : -1
                        })
                        let coupon
                        for (let i = 0, len = res.length; i < len; i++) {
                            coupon = res[i]
                            if (coupon.couponType == 'paid') { // 点钟券
                                that.paidCoupons.push(coupon)
                            } else {
                                that.ordinaryCoupons.push(coupon)
                            }
                        }
                    }
                })
            },
            doGetPaidCoupon (coupon, event) { // 点击购买点钟券
                event.stopPropagation()
                const that = this
                const global = that.global
                const target = event.target
                let targetCls = target.classList
                let chanel = global.currPage.query.chanel || 'link'

                if (!global.userAgent.isWX) {
                    return Util.tipShow('需在微信中打开才可购买！')
                }
                if (!global.isLogin) {
                    Util.tipShow('请您先登录！')
                    Global.login(that.$router, 'paidCoupon', { // 登录之后跳转到paidCoupon页面
                        actId: coupon.actId,
                        techCode: that.techInviteCode,
                        chanel: chanel
                    })
                } else if (!global.userTel) {
                    Global.login(null)
                    Global.bindTelPhone()
                } else if (targetCls.contains('processing')) {
                    Util.tipShow('购买中,请稍候...')
                } else {
                    targetCls.add('processing')
                    target.innerHTML = '购买中...'

                    that.$http.post('../api/v2/wx/pay/paid_coupon', {
                        actId: coupon.actId,
                        businessType: 'paid_coupon',
                        businessChannel: chanel,
                        clubId: that.clubId,
                        money: coupon.actValue,
                        openId: global.openId,
                        techId: that.techId,
                        tradeChannel: 'wx'
                    }).then(res => {
                        res = res.body
                        if (res.statusCode == 200) {
                            that.payRequestObj = JSON.parse(res.respData)
                            that.payTarget = target
                            that.payCoupon = coupon
                            Global.wxJsBridgeReady(() => {
                                that.onBridgeReady()
                            })
                        } else if (res.statusCode == 935801) {
                            Util.localStorage('paid-coupon-param', true)
                            Global.getOauthCode('9358', 'paid-coupon', 'base')
                        } else {
                            targetCls.remove('processing')
                            target.innerHTML = '立即购买'
                            Util.tipShow(res.msg || '购买点钟券请求失败！')
                        }
                    }, () => {
                        Util.tipShow('购买点钟券请求失败！')
                        targetCls.remove('processing')
                        target.innerHTML = '立即购买'
                    })
                }
            },
            onBridgeReady () {
                const that = this
                let payRequestObj = that.payRequestObj
                let target = that.payTarget
                let payCoupon = that.payCoupon
                WeixinJSBridge.invoke('getBrandWCPayRequest', {
                    appId: payRequestObj.appId,
                    timeStamp: payRequestObj.timeStamp + '',
                    nonceStr: payRequestObj.nonceStr,
                    package: payRequestObj.package,
                    signType: payRequestObj.signType,
                    paySign: payRequestObj.paySign
                }, function (res) {
                    target.classList.remove('processing')
                    target.innerHTML = '立即购买'
                    if (res.err_msg.indexOf('ok') >= 0) {
                        Util.tipShow('支付成功！')
                        target.innerHTML = '购买成功'
                        im.doSendPaidCouponPurchaseTipMessage({ // 发送点钟券购买提醒消息
                            to: that.techChatId,
                            data: {
                                name: payCoupon.actTitle, techName: that.techName, id: payCoupon.actId
                            }
                        })
                        that.$router.push({ name: 'paidCouponDetail', query: { userActId: payRequestObj.bizId } }) // 跳转到点钟券详情页
                    }
                })
            },
            doGetOrdinaryCoupon (coupon, event) { // 点击领取优惠券
                const that = this
                const global = that.global
                let target = event.target
                let targetCls = target.classList

                if (targetCls.contains('disabled')) {
                    return
                }
                if (!global.isLogin) {
                    Global.login(that.$router)
                } else if (!global.userTel) {
                    Global.login(null)
                    Global.bindTelPhone()
                } else if (targetCls.contains('processing')) {
                    Util.tipShow('领取中,请稍候...')
                } else {
                    targetCls.add('processing')
                    target.innerHTML = '领取中...'
                    that.$http.get('../api/v2/club/get/redpacket', {
                        params: {
                            actId: coupon.actId,
                            phoneNum: global.userTel,
                            openId: global.openId,
                            techCode: that.techInviteCode
                        }
                    }).then(res => {
                        res = res.body
                        targetCls.remove('processing')
                        target.innerHTML = '立即领取'
                        if (res.statusCode == 200) {
                            if (coupon.userGetCounts && coupon.userGetCount > coupon.userGetCounts + 1) {
                                coupon.userGetCounts = coupon.userGetCounts + 1
                            } else {
                                targetCls.add('disabled')
                                target.innerHTML = '已领取'
                            }
                        } else if (res.statusCode == 206) {
                            targetCls.add('disabled')
                            target.innerHTML = '已领取'
                            Util.tipShow(res.msg || '你已经领取过了！')
                        } else {
                            Util.tipShow(res.msg || '领取失败！')
                        }
                    }, () => {
                        Util.tipShow('领取失败！')
                        targetCls.remove('processing')
                        target.innerHTML = '立即领取'
                    })
                }
            },
            // 查询评论开关
            queryCommentSwitch () {
                const that = this
                that.$http.get('../api/v2/user/comment/switch', { params: { clubId: that.clubId } }).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.commentSwitch = res.respData
                        if (that.commentSwitch) {
                            that.queryCommentList(1)
                            window.addEventListener('scroll', that.doHandlerListScroll)
                        }
                    }
                })
            },
            doHandlerListScroll () {
                const that = this
                const body = document.body
                const global = that.global
                if (!that.isDataAddEnd && document.documentElement.scrollTop + global.winHeight * 1.4 > body.scrollHeight) {
                    that.queryCommentList()
                }
            },
            // 查询技师评论
            queryCommentList (page) {
                const that = this
                const global = that.global
                if (that.isAddData) {
                    return
                }
                that.isAddData = true
                page = page || that.commentPage + 1

                // 更新数据加载提示
                that.showDataLoadTip = true
                that.showFinishLoadTip = false
                that.isDataAddEnd = false

                that.$http.get('../api/v2/club/technician/comments', {
                    params: {
                        page: page,
                        pageSize: that.commentPageSize,
                        techId: that.techId
                    }
                }).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData || []
                        that.handlerCommentData(res, page)
                    } else {
                        Util.tipShow(global.loadError)
                    }
                }, () => {
                    Util.tipShow(global.loadError)
                })
            },
            handlerCommentData (res, page) {
                const that = this
                if (page == 1) {
                    that.commentList = res.map(item => {
                        if (item.comment) {
                            item.comment = item.comment.replace(/\n/g, '<br/>')
                        }
                        return item
                    })
                    if (res.length == 0) {
                        that.isDataAddEnd = true
                    } else if (res.length < that.commentPageSize) {
                        that.isDataAddEnd = true
                        that.showFinishLoadTip = true
                    }
                } else {
                    res.forEach(item => {
                        if (item.comment) {
                            item.comment = item.comment.replace(/\n/g, '<br/>')
                        }
                        that.commentList.push(item)
                    })
                    if (res.length < that.commentPageSize) {
                        that.isDataAddEnd = true
                        that.showFinishLoadTip = true
                    }
                }
                that.commentPage = page
                that.isAddData = false
                that.showDataLoadTip = false
            }
        }
    }
</script>
