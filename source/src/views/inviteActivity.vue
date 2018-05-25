<style lang="sass">
    @import '../sass/page/inviteActivity.scss';
</style>
<template>
    <div class="page" id="invite-activity-page">
        <div class="top-img"></div>

        <div class="step-wrap">
            <div class="wrap-title">您将获得</div>
            <div class="reward-list-desc">
                <router-link tag="div" v-show="sharePrize.type" :class="'reward-' + sharePrize.type" :to="{ name: 'inviteRewards', query: {tab: 0} }">
                    <div>分享好友奖励</div>
                    <div>{{ sharePrize.content }}</div>
                    <div>{{ sharePrize.desc }}</div>
                </router-link>
                <router-link tag="div" v-show="invitePrize.type" :class="'reward-' + invitePrize.type" :to="{ name: 'inviteRewards', query: {tab: 1} }">
                    <div>邀请新人奖励</div>
                    <div>{{ invitePrize.content }}</div>
                    <div>{{ invitePrize.desc }}</div>
                </router-link>
                <router-link tag="div" v-show="consumePrize.type" :class="'reward-' + consumePrize.type" :to="{ name: 'inviteRewards', query: {tab: 2} }">
                    <div>新人消费奖励</div>
                    <div>{{ consumePrize.content }}</div>
                    <div>{{ consumePrize.desc }}</div>
                </router-link>
            </div>
        </div>

        <div class="friends-reward-wrap" @click="doViewGiftDetail()">
            <div class="wrap-title">好友将获得</div>
            <div class="gift-content">
                <div>
                    <img :src="registerPrize.imageUrl || global.defaultServiceItemImgUrl"/>
                </div>
                <div>
                    <div>{{ registerPrize.name }}</div>
                    <div>{{ registerPrize.description }}</div>
                    <div v-show="registerPrize.percent>=50">礼包已领取：<div><div :style="{ width: registerPrize.percent + '%' }"></div><div>{{ registerPrize.percent }}%</div></div></div>
                </div>
            </div>
        </div>

        <div class="my-invite-wrap">
            <div class="wrap-title">我的收益</div>
            <router-link class="left" tag="div" :to="{ name: 'inviteFriends' }">
                <div>成功邀请</div>
                <div><b>{{ invitePrizeCount }}</b>人</div>
            </router-link>
            <router-link class="right" tag="div" :to="{ name: 'inviteRewards' }">
                <div>成功领取</div>
                <div><b>{{ totalPrizeCount }}</b>次奖励</div>
            </router-link>
        </div>

        <div class="act-info-wrap">
            <div>活动时间：<span>{{ actTime }}</span></div>
            <div @click="doPopDesc()">查看详细规则<div></div></div>
        </div>

        <!--底部按钮-->
        <div class="btn-wrap"><div @click="doPopQrCode()">面对面邀请</div><div @click="doClickShareBtn()">分享链接</div></div>

        <div class="desc-pop-wrap pop-modal" :class="{ active: showDescPop }" @click="doClosePop('showDescPop')">
            <div class="center-wrap" @click="doClickModalWrap($event)">
                <h3>活动说明</h3>
                <div v-for="(item, index) in descArr" :key="index" class="list-item"><div>{{ index + 1 }}</div>{{ item }}</div>
                <div class="close-btn" @click="doClosePop('showDescPop', $event)">&times;</div>
            </div>
        </div>

        <!--扫码弹窗-->
        <div class="gift-package-pop-wrap pop-modal" :class="{ active: giftQrCodePop }" @click="doClosePop('giftQrCodePop')">
            <div class="center-wrap" @click="doClickModalWrap($event)">
                <div>
                    <div>{{ registerPrize.name }}</div>
                    <img v-if="inviteQrCodeUrl" class="invite-qrcode" :src="inviteQrCodeUrl"/>
                </div>
                <div><div>好友扫码领取好礼</div></div>
                <div><div @click="doClosePop('giftQrCodePop', $event)">确定</div></div>
            </div>
        </div>

        <div class="get-failed-pop-wrap pop-modal" :class="{ active: getFailedPop }" @click="doClosePop('getFailedPop')">
            <div class="center-wrap" @click="doClickModalWrap($event)">
                <div>{{ getFailedMsg || '奖励领取失败，请联系会所处理~' }}</div>
                <router-link tag="div" :to="{ name: 'activities' }">更多优惠等您参与</router-link>
            </div>
            <div @click="doClosePop('getFailedPop', $event)">&times;</div>
        </div>

        <!--分享-->
        <Share :share-url = "shareUrl"></Share>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import eventHub from '../libs/hub'
    import Util from '../libs/util'
    import 'jr-qrcode'
    import Share from '../components/share'

    export default {
        components: {
            Share
        },
        data () {
            return {
                global: Global.data,
                clubId: '',
                currActId: '', // 当前活动ID
                isPreview: false, // 是否是预览状态
                clubName: '',
                invitePrizeCount: '-', // 拓客数量
                totalPrizeCount: '-', // 总奖励次数
                shareUrl: '', // 分享链接
                descArr: [], // 活动规则描述
                actTime: '不限', // 活动时间
                userActId: '', // 领取的新人礼包userActId
                registerPrize: { // 新人礼包
                    name: '新人礼包',
                    imageUrl: '',
                    description: '',
                    percent: 0 // 领取进度
                },
                sharePrize: { // 分享奖励
                    type: '', content: '', desc: ''
                },
                invitePrize: { // 邀请奖励
                    type: '', content: '', desc: ''
                },
                consumePrize: { // 消费奖励
                    type: '', content: '', desc: ''
                },
                showDescPop: false, // 活动说明弹窗
                inviteQrCodeUrl: '', // 面对面邀请二维码url
                giftQrCodePop: false, // 控制面对面邀请二维码弹窗
                getFailedPop: false, // 分享获取奖励失败弹窗
                getFailedMsg: ''
            }
        },
        created () {
            let that = this
            let global = that.global
            let query = global.currPage.query
            that.clubId = query.clubId || global.clubId
            that.currActId = query.actId || ''
            that.isPreview = (that.currActId && query.preview == 1)

            if (!that.clubId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            document.title = '邀请有礼'
            that.getInviteData()
            that.getPrizeCount()
            that.$http.post('../api/v2/club/share/view/count/update', {actId: that.currActId, techCode: '', techId: '', clubId: that.clubId, type: 'invite_gift'}) // 更新用户查看数
        },
        methods: {
            /**
             * 关闭弹窗
             * @param popName：弹窗名
             */
            doClosePop (popName, e) {
                this[popName] = false
                if (e) {
                    e.stopPropagation()
                }
            },

            doClickModalWrap (e) {
                e.stopPropagation()
            },

            // 弹窗活动说明窗口
            doPopDesc () {
                this.showDescPop = true
            },

            /**
             * 点击面对面邀请
             */
            doPopQrCode () {
                let that = this
                if (that.inviteQrCodeUrl) {
                    that.giftQrCodePop = true
                } else {
                    Util.tipShow('未能获取邀请二维码！')
                }
            },

            /**
             * 点击分享链接按钮
             */
            doClickShareBtn () {
                eventHub.$emit('change-share-pop', true)
            },

            /**
             * 获取用户获奖次数
             */
            getPrizeCount () {
                let that = this
                that.$http.get('../api/v2/club/user/invite/prize/count', {params: {clubId: that.clubId}}).then((res) => {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.invitePrizeCount = res.invitePrizeCount
                        that.totalPrizeCount = res.totalPrizeCount
                    }
                })
            },

            /**
             * 根据prize获取content与描述
             */
            getPrizeContent (prize, type) {
                let res = {
                    content: '', desc: ''
                }
                if (prize.contentType == 'credit') {
                    res.content = prize.contentId + '积分'
                } else {
                    res.content = prize.description.slice(prize.description.indexOf('】') + 1)
                    if (prize.contentType == 'service_item') {
                        res.desc = '服务项目1次'
                    } else if (prize.contentType == 'coupon') {
                        res.desc = '优惠券1张'
                    }
                }

                if (type == 'share') {
                    res.desc = '(每日' + (prize.dayCountLimit > 0 ? prize.dayCountLimit + '次)' : '不限次数)')
                }
                return res
            },

            /**
             * 获取用户活动数据
             */
            getInviteData () {
                var that = this
                var global = that.global
                that.$http.get('../api/v2/club/user/invite/activity' + (that.isPreview ? '' : '/active'), {params: {clubId: that.clubId, activityId: that.currActId}}).then((res) => {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        if (!res) {
                            Util.tipShow(that.isPreview ? '查询活动详情失败！' : '当前没有进行中的活动！')
                            return that.$router.push({name: 'home'})
                        }
                        that.doHandlerInviteActData(res)
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                        that.$router.back()
                    }
                })
            },
            /**
             * 处理邀请有礼活动数据
             */
            doHandlerInviteActData (res) {
                let that = this
                let global = that.global
                that.currActId = res.activityId
                // 新人礼包registerPrize
                let registerPrize = that.registerPrize
                let resRegPrize = res.registerPrize
                registerPrize.name = resRegPrize.name
                registerPrize.imageUrl = resRegPrize.imageUrl
                registerPrize.description = resRegPrize.description
                if (resRegPrize.count && resRegPrize.count > 0) {
                    registerPrize.percent = ((resRegPrize.grantCount / resRegPrize.count) * 100).toFixed(0)
                }
                // 分享礼包
                let resSharePrize = res.sharePrize
                let contentObj
                if (resSharePrize && resSharePrize.status == 'valid') {
                    let sharePrize = that.sharePrize
                    sharePrize.type = resSharePrize.contentType
                    contentObj = that.getPrizeContent(resSharePrize, 'share')
                    sharePrize.content = contentObj.content
                    sharePrize.desc = contentObj.desc
                }

                // 邀请礼包
                let resInvitePrize = res.invitePrize
                if (resInvitePrize && resInvitePrize.status == 'valid') {
                    let invitePrize = that.invitePrize
                    invitePrize.type = resInvitePrize.contentType
                    contentObj = that.getPrizeContent(resInvitePrize, 'invite')
                    invitePrize.content = contentObj.content
                    invitePrize.desc = contentObj.desc
                }

                // 消费礼包
                let resConsumePrize = res.consumePrize
                if (resConsumePrize && resConsumePrize.status == 'valid') {
                    let consumePrize = that.consumePrize
                    consumePrize.type = resConsumePrize.contentType
                    contentObj = that.getPrizeContent(resConsumePrize, 'consume')
                    consumePrize.content = contentObj.content
                    consumePrize.desc = contentObj.desc
                }

                // 处理活动规则的显示
                if (res.description) {
                    let descArr = res.description.split('\n')
                    descArr = descArr.map((item) => {
                        return item.trim()
                    })
                    that.descArr = descArr
                }
                // 活动时间
                if (res.startTime && res.endTime) {
                    that.actTime = Util.dateFormat(new Date(res.startTime), 'yyyy.MM.dd') + '至' + Util.dateFormat(new Date(res.endTime), 'yyyy.MM.dd')
                }

                // 设置分享
                that.shareUrl = global.prefixPathname + '#/' + that.clubId + '/inviteActivityShare?userId=' + global.userId + '&actId=' + that.currActId + '&userName=' + encodeURIComponent(global.userName)
                if (global.userAgent.isWX) {
                    Global.shareConfig({
                        title: global.userName + '分享的大礼包！',
                        desc: '收到好友分享，点击有惊喜！',
                        link: that.shareUrl,
                        imgUrl: res.registerPrize.imageUrl || global.clubLogoUrl,
                        success () {
                            that.$http.post('../api/v2/club/user/invite/prize/share', {activityId: that.currActId, clubId: that.clubId}).then((shareRes) => {
                                shareRes = shareRes.body
                                if (shareRes.statusCode == 200) {
                                    setTimeout(() => {
                                        that.getPrizeCount() // 重新获取我的收益次数
                                    }, 1500)
                                } else if (shareRes.statusCode == 400) {
                                    that.getFailedPop = true
                                    that.getFailedMsg = shareRes.msg
                                }
                            })
                            eventHub.$emit('change-share-pop', false)
                        }
                    }, 'inviteActivity')
                }

                // 生成面对面邀请二维码
                let codeUrl = that.shareUrl + '&code=1' // 标明code扫码分享
                that.inviteQrCodeUrl = jrQrcode.getQrBase64(codeUrl, {padding: 0})

                // 判定是否领取了礼包
                that.queryGetStatus(that.currActId)
                global.loading = false
            },

            /**
             * 跳转至我的礼包页面
             */
            doViewGiftDetail () {
                let that = this
                if (that.userActId) { // 当前已领取新人礼包，可跳转至详情页
                    that.$router.push({name: 'inviteActivityGifts', query: {userActId: that.userActId}})
                }
            },

            /**
             * 获取新人礼包领取状态
             */
            queryGetStatus (actId) {
                let that = this
                that.$http.get('../api/v2/club/user/invite/prize/register/status', {params: {
                    activityId: actId, clubId: that.clubId
                }}).then((res) => {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        if (res.grant) {
                            that.userActId = res.contentId
                        }
                    }
                })
            }
        }
    }
</script>
