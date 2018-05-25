<!--疑似废弃页面-->
<style lang="sass">
    @import '../sass/page/inviteActivityShare.scss';
</style>
<template>
    <div class="page" id="invite-activity-share-page">
        <PageTitle title-text="邀请有礼"><div @click="doPopShare()">分享好友</div></PageTitle>
        <div class="top-wrap">
            <router-link class="club-info" tag="div" :to="{ path: '/' + clubId + '/home'}">
                <div :style="{ 'background-image': 'url(' + ( global.clubLogoUrl || global.defaultClubLogo ) +')' }"></div>
                <span class="club-name">{{ global.clubName }}</span>
            </router-link>
            <div class="gift-info">
                <div class="gift-title"><div></div>新人专享</div>
                <div class="gift-content">
                    <div :style="{ 'background-image': 'url(' + packageImageUrl + ')' }"></div>
                    <div>
                        <div>{{ packageName }}</div>
                        <div>{{ packageDesc }}</div>
                        <div v-show="packagePercent>=50">礼包已领取：<div><div :style="{ width: packagePercent + '%' }"></div><div>{{ packagePercent }}%</div></div></div>
                    </div>
                </div>
                <div class="gift-time"><b></b>{{ actTime }}</div>
            </div>
            <div class="get-btn" @click="doClickBtn()" :class="{ expired: hasExpired && !hasClick }">{{ hasClick ? statusText[actStatus] : '立即领取' }}</div>
        </div>
        <div class="desc-wrap">
            <h3>活动说明</h3>
            <div v-for="(item, index) in descArr" :key="index"><div>{{ index + 1 }}</div>{{ item }}</div>
        </div>
        <!--关注二维码-->
        <div class="qrcode-pop-wrap pop-modal" :class="{ active: isPopQrCode }">
            <div class="center-wrap">
                <div><img :src="attentionQrCodeUrl" v-if="attentionQrCodeUrl"/></div>
                <div>长按二维码识别关注，查看礼包哦~</div>
                <div @click="doClosePop('isPopQrCode')">&times;</div>
            </div>
        </div>
        <!--不满足条件-->
        <div class="no-newer-pop-wrap pop-modal" :class="{ active: noNewerPop }">
            <div class="center-wrap">
                <div>只有会所新用户才能领取新人礼包哟，您也可以邀请好友，赢取其他奖励~</div>
                <router-link tag="div" :to="{ name: 'inviteActivity' }">领取更多奖励</router-link>
            </div>
            <div @click="doClosePop('noNewerPop')">&times;</div>
        </div>
        <!--绑定手机提示弹窗-->
        <div class="bind-tel-pop-wrap pop-modal" :class="{ active: bindTelPop }">
            <div class="center-wrap">
                <div>领取新人礼包需填入手机号，是否前往输入手机号？</div>
                <div @click="doPopBindTel()">确定</div>
            </div>
            <div @click="doClosePop('bindTelPop')">&times;</div>
        </div>
        <!--礼包已领取完-->
        <div class="no-gift-pop-wrap pop-modal" :class="{ active: noGiftPop }">
            <div class="center-wrap">
                <div>您还是晚来了一步，礼包已领取完了~</div>
                <router-link tag="div" :to="{ path: '/' + clubId+ '/home' }">更多优惠等您参与</router-link>
            </div>
            <div @click="doClosePop('noGiftPop')">&times;</div>
        </div>
        <!--活动已结束-->
        <div class="no-gift-pop-wrap pop-modal" :class="{ active: actOverPop }">
            <div class="center-wrap">
                <div v-if="!isActStatusNew">您还是晚来了一步，{{ global.clubName }}的活动已结束~</div>
                <div v-else>活动还未上线哦~</div>
                <router-link tag="div" :to="{ path: '/' + clubId+ '/home' }">更多优惠等您参与</router-link>
            </div>
            <div @click="doClosePop('actOverPop')">&times;</div>
        </div>
        <!--领取成功-->
        <div class="gift-get-success-pop-wrap pop-modal" ref="giftGetSuccessPopWrap" @click="doCloseGetSuccessPop()">
            <div class="center-wrap" @click="stopClick($event)">
                <div class="light"></div>
                <div class="box"></div>
                <div class="star-box"></div>
                <div class="tip">
                    <div>恭喜您获得</div>
                    <div><span class="club-name">{{ global.clubName }}</span>的<br/>[{{ packageName }}]<br/>已放入您的账户中~ </div>
                </div>
            </div>
            <div class="view-gift-btn" @click="doViewGifts()">查看礼品</div>
        </div>

        <!--分享奖励领取失败-->
        <div class="get-failed-pop-wrap pop-modal" :class="{ active: getFailedPop }" @click="doClosePop('getFailedPop')">
            <div class="center-wrap" @click="doClickModalWrap($event)">
                <div>{{ getFailedMsg || '奖励领取失败，请联系会所处理~' }}</div>
                <router-link tag="div" :to="{ name: 'activities' }">更多优惠等您参与</router-link>
            </div>
            <div @click="doClosePop('getFailedPop', $event)">&times;</div>
        </div>
        <Share :share-url = "shareUrl"></Share>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import eventHub from '../libs/hub'
    import 'jr-qrcode'
    import PageTitle from '../components/page-title'
    import Share from '../components/share'

    export default {
        components: {
            PageTitle, Share
        },
        data () {
            return {
                global: Global.data,
                clubId: '',
                userId: '', // 分享者的userId
                userName: '--', // 分享者的名称
                actId: '', // 活动ID
                descArr: [], // 活动规则描述
                packageName: '', // 礼包名称
                packageImageUrl: '', // 礼包图片
                actTime: '活动时间不限', // 活动时间
                packageDesc: '', // 描述
                packagePercent: 0, // 领取进度
                actStatus: 1, // 状态
                shareUrl: '', // 分享链接
                hasClick: false,
                hasExpired: false, // 是否过期
                userActId: '',
                attentionQrCodeUrl: '', // 二维码
                isActStatusNew: false, // 活动的状态是否为 new
                statusText: {
                    0: '查看我的礼包',
                    1: '立即领取',
                    2: '领取更多奖励',
                    3: '更多优惠等你参与',
                    4: '更多优惠等你参与',
                    5: '领取中...',
                    6: '更多优惠等你参与' // 功能关闭
                },
                isPopQrCode: false, // 控制关注二维码的弹窗
                noNewerPop: false, // 控制不满足领取条件时的弹窗
                noGiftPop: false, // 控制礼包已领取完的弹窗
                actOverPop: false, // 控制活动已结束的弹窗
                bindTelPop: false, // 绑定手机的弹窗
                getFailedPop: false, // 分享获取奖励失败弹窗
                getFailedMsg: ''
            }
        },
        created () {
            let that = this
            let global = that.global
            let query = global.currPage.query
            let isScanQrCode = query.code == 1
            that.clubId = query.clubId || global.clubId
            that.userId = query.userId
            that.actId = query.actId
            that.userName = query.userName
            // 是否缺少参数
            if (!that.clubId || !that.userId || !that.actId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }

            // 获取活动信息
            that.$http.get('../api/v2/club/user/invite/activity', {params: {
                clubId: that.clubId, activityId: that.actId
            }}).then(function (res) {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    let registerPrize = res.registerPrize
                    that.packageName = registerPrize.name // 礼包名称
                    that.packageImageUrl = registerPrize.imageUrl || global.defaultServiceItemImgUrl // 礼包图片
                    that.packageDesc = registerPrize.description // 描述
                    if (registerPrize.count && registerPrize.count > 0) {
                        that.packagePercent = ((registerPrize.grantCount / registerPrize.count) * 100).toFixed(0) - 0 // 进度
                    }
                    // 处理活动规则的显示
                    if (res.description) {
                        let descArr = res.description.split('\n')
                        descArr = descArr.map((item) => {
                            return item.trim()
                        })
                        that.descArr = descArr
                    }

                    // 是否过期
                    if (res.status != 'online') {
                        that.hasExpired = true
                    }
                    that.isActStatusNew = res.status == 'new'

                     // 活动时间
                    if (res.startTime && res.endTime) {
                        // that.actTime = Util.dateFormat(new Date(res.startTime), 'yyyy.MM.dd') + '至' + Util.dateFormat(new Date(res.endTime), 'yyyy.MM.dd')
                        that.actTime = Util.dateFormat(new Date(res.endTime), 'yyyy.MM.dd') + ' 结束'
                    }
                    that.shareUrl = global.prefixPathname + '#/' + that.clubId + '/inviteActivityShare?userId=' + global.userId + '&actId=' + that.actId + '&userName=' + encodeURIComponent(global.userName)

                    // 获取用户领取状态
                    that.queryGetStatus()

                    // 设置分享
                    if (global.userAgent.isWX) {
                        Global.shareConfig({
                            title: global.userName + '分享的大礼包',
                            desc: '收到好友分享，点击有惊喜！',
                            link: that.shareUrl,
                            imgUrl: res.registerPrize.imageUrl || global.clubLogoUrl,
                            success () {
                                that.$http.post('../api/v2/club/user/invite/prize/share', {activityId: that.actId, clubId: that.clubId}).then((shareRes) => {
                                    shareRes = shareRes.body
                                    if (shareRes.statusCode == 400) {
                                        that.getFailedPop = true
                                        that.getFailedMsg = shareRes.msg
                                    }
                                })
                                eventHub.$emit('change-share-pop', false)
                            }
                        }, 'inviteActivityShare')
                    }

                    // 绑定手机号码之后自动领取
                    if (query.bind == 1) {
                        that.doClickBtn()
                    }
                } else {
                    Util.tipShow(res.msg || global.loadError)
                    return that.$router.back()
                }
            })

            // 分享者增加分享奖励
            if (isScanQrCode) {
                that.$http.post('../api/v2/club/user/invite/prize/share', {activityId: that.actId, clubId: that.clubId, userId: that.userId})
            }
        },
        methods: {
            /**
             * 获取新人礼包领取状态
             */
            queryGetStatus () {
                let that = this
                let global = that.global
                that.$http.get('../api/v2/club/user/invite/prize/register/status', {params: {
                    activityId: that.actId, clubId: that.clubId
                }}).then((res) => {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        if (res.grant) {
                            that.userActId = res.contentId
                        }
                        global.loading = false
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                        return that.$router.back()
                    }
                })
            },
             /**
             * 查看礼品
             */
            doViewGifts () {
                let that = this
                if (that.attentionQrCodeUrl) {
                    that.isPopQrCode = true // 弹窗关注
                } else {
                    that.$router.push({name: 'inviteActivityGifts', query: {userActId: that.userActId}})
                }
            },
             /**
             * 点击中间按钮的处理
             */
            doClickBtn () {
                let that = this
                let actStatus = that.actStatus
                if (actStatus == 0) { // 查看我的礼包
                    that.doViewGifts()
                } else if (actStatus == 1) { // 领取
                    that.doGetGift()
                } else if (actStatus == 2) {
                    that.$router.push({name: 'inviteActivity'})
                } else if (actStatus == 3 || actStatus == 4 || actStatus == 6) {
                    that.$router.push({name: 'home'})
                }
            },
           /**
             * 领取礼包
             */
            doGetGift () {
                let that = this
                let global = that.global
                if (that.hasExpired) { // 过期的处理
                    that.actStatus = 3
                    that.actOverPop = true
                    that.hasClick = true
                    return
                }
                if (!global.userTel) { // 未绑定手机号
                    that.bindTelPop = true
                    return
                }
                if (that.actStatus == 5) {
                    return Util.tipShow('领取中，请稍候...')
                }
                that.actStatus = 5
                that.hasClick = true
                that.$http.post('../api/v2/club/user/invite/prize/register', {
                    activityId: that.actId,
                    clubId: that.clubId,
                    inviteUserId: that.userId
                }).then((res) => {
                    res = res.body
                    let statusCode = res.statusCode
                    if (statusCode == 200) {
                        res = res.respData
                        that.userActId = res.contentId
                        let giftPop = that.$refs.giftGetSuccessPopWrap
                        giftPop.style.display = 'block'
                        setTimeout(() => {
                            giftPop.classList.add('active')
                        }, 100)
                        if (res.detailQRCodeValue) {
                            that.attentionQrCodeUrl = jrQrcode.getQrBase64(res.detailQRCodeValue, {padding: 0})
                        }
                    } else if (statusCode == 201) { // 功能关闭
                        Util.tipShow(res.msg || '会所已关闭邀请有礼功能！')
                        that.actStatus = 6
                    } else if (statusCode == 202) { // 活动已结束
                        // Util.tipShow(res.msg || '活动已结束，感谢您的参与！')
                        that.actStatus = 3
                        that.actOverPop = true
                    } else if (statusCode == 203) { // 不满足领取条件
                        // Util.tipShow(res.msg || '您不满足领取条件，谢谢！')
                        that.actStatus = 2
                        that.noNewerPop = true
                    } else if (statusCode == 204) { // 礼包已被领取完
                        // Util.tipShow(res.msg || '抱歉，礼包已被领取完！')
                        that.actStatus = 4
                        that.noGiftPop = true
                    } else if (statusCode == 205) { // 每日领取限制
                        Util.tipShow(res.msg || '抱歉，每日领取有限制！')
                        that.actStatus = 2
                    } else if (statusCode == 206) {
                        Util.tipShow(res.msg || '抱歉，领取失败！')
                        that.actStatus = 1
                    } else if (statusCode == 400) {
                        Util.tipShow(res.msg || '抱歉，领取失败！')
                        that.actStatus = 1
                        if (res.msg && /绑定手机号/.test(res.msg)) { //  清空缓存中的userTel
                            that.bindTelPop = true
                            global.userTel = ''
                        }
                    }
                })
            },
            /**
             * 关闭弹窗
             */
            doClosePop (type) {
                let that = this
                that[type] = false
                if (type == 'bindTelPop') {
                    that.doReplaceUrl(0)
                }
            },
            /**
             * 弹窗分享的提示层
             */
            doPopShare () {
                eventHub.$emit('change-share-pop', true)
            },
             /**
             * 弹窗绑定手机号的窗口
             */
            doPopBindTel () {
                let that = this
                that.doReplaceUrl(1)
                that.bindTelPop = false
                eventHub.$emit('pop-bind-phone')
            },
            doReplaceUrl (bind) {
                let that = this
                that.$router.replace({name: 'inviteActivityShare', query: {bind: bind, userId: that.userId, actId: that.actId, userName: decodeURIComponent(that.userName)}})
            },
            /**
             * 关闭成功领取礼物的弹窗
             */
            doCloseGetSuccessPop () {
                var that = this
                var giftPop = that.$refs.giftGetSuccessPopWrap
                giftPop.classList.remove('active')
                giftPop.style.display = 'none'
            },
            stopClick (e) {
                e.stopPropagation()
            }
        }
    }
</script>
