<!--拼团活动开团、参与成功页面-->
<style lang="sass">
    @import '../sass/page/groupBuyActJoinSuccess.scss';
</style>
<template>
    <div class="page" id="group-buy-act-join-success-page">
        <div class="top-wrap">
            <div>{{ needHide ? '购买' : '拼团' }}成功！</div>
            <div v-if="!needHide">
                <span v-if="type == 'join'">当前拼团人数：<span>{{ joinCount }}/{{ personalCount }}</span></span>
                <span v-else>单打独斗不如拼团抢购~</span>
            </div>
            <div class="act-time" v-show="groupEndTime">剩余<div><span v-show="groupEnd.day">{{ groupEnd.day }}</span>{{ groupEnd.day ? '天' : '' }}<span>{{ groupEnd.hour }}</span>小时<span>{{ groupEnd.min }}</span>分钟<span v-show="!groupEnd.day">{{ !groupEnd.day ? groupEnd.sec : '' }}</span>{{ !groupEnd.day ? '秒' : '' }}</div>失效</div>
        </div>
        <router-link class="act-info" :to="{ name: 'groupBuyActShare', query: {id: actId, groupId: groupId, techId: techId} }" v-if="!needHide">
            <div :style="{ 'background-image': 'url('+itemImageUrl+')' }"></div>
            <div>
                <div>{{ itemName }}<span>({{ personalCount }}人团)</span></div>
                <div>{{ personalCount }}人团：<span>￥{{ price | MoneyFilter }}</span></div>
                <div>拼团已省：<span>￥{{ discountPrice | MoneyFilter }}</span></div>
            </div>
            <div>x {{ count }}</div>
        </router-link>

        <div class="qrcode-wrap" v-if="!needHide">
            <img :src="clubQrCodeImg" v-if="clubQrCodeImg"/>
            <div>长按关注小摩豆，<br/>随时查看拼团进程哦~</div>
        </div>

        <router-link class="share-btn" tag="div" :to="{ name: 'groupBuyRecords' }" v-if="!needHide">查看</router-link>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import MoneyFilter from '../filters/money-formatter'

    export default {
        filters: {
            MoneyFilter
        },
        data () {
            return {
                global: Global.data,
                clubId: '',
                actId: '',
                orderId: '',
                actName: '',
                groupId: '',
                count: 1,
                techId: '',
                showPopShare: false, // 控制分享弹窗的显示
                type: 'join', // launch--发起  join--参与
                personalCount: '-',
                joinCount: 0,
                itemImageUrl: '',
                itemName: '',
                itemPrice: 0,
                price: 0,
                discountPrice: 0,
                groupEndTime: 0,
                groupEnd: {
                    day: 0,
                    hour: 0,
                    min: 0,
                    sec: 0
                },
                timer: null,
                isOver: false, // 是否结束
                clubQrCodeImg: '',
                getCodeImgMaxCount: 5
            }
        },
        computed: {
            needHide () {
                return this.clubId == '602057981877559296'
            }
        },
        created () {
            let that = this
            let global = that.global
            let query = global.currPage.query
            that.type = query.type || 'join'
            that.actId = query.id
            that.orderId = query.orderId
            that.count = query.count || 1
            that.techId = query.techId
            that.clubId = query.clubId || global.clubId
            if (!that.orderId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            // 查询活动详情
            that.$http.get('../api/v2/user/group/buy/get/open/group', {params: {
                orderId: that.orderId
            }}).then(res => {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    that.actName = res.activityName
                    that.personalCount = res.personalCount
                    that.joinCount = res.obtainedCount
                    that.itemImageUrl = res.itemImageUrl
                    that.itemName = res.itemName
                    that.itemPrice = res.itemPrice
                    that.price = res.price * that.count
                    that.groupId = res.id
                    that.discountPrice = (res.itemPrice - res.price) * that.count
                    if (res.endTime) {
                        that.groupEndTime = res.endTime
                        that.doComputedTime()
                        that.timer = setInterval(() => {
                            that.doComputedTime()
                        }, that.groupEnd.day ? 60 * 1000 : 1000)
                    }
                    that.global.loading = false
                    that.initShareConfig()
                    that.getClubQrCodeImg()
                } else {
                    Util.tipShow(res.msg || '查询活动详情失败！')
                }
            })
        },
        methods: {
            doSwitchSharePop (type) {
                this.showPopShare = type
            },
            // 设置分享
            initShareConfig () {
                let that = this
                let global = that.global
                let query = global.currPage.query
                // 设置分享
                if (global.userAgent.isWX) {
                    Global.shareConfig({
                        title: that.actName,
                        desc: '没有大动作，哪敢惊动你！' + that.itemName + '，原价' + ((that.itemPrice / 100).toFixed(2)) + '，现仅需' + ((that.price / 100).toFixed(2)) + '，立刻点击参与！',
                        link: global.prefixPathname + '?#/' + that.clubId + '/groupBuyActShare?id=' + that.actId + '&techId=' + (query.techId || '') + '&userId=' + global.userId + '&groupId=' + that.groupId,
                        imgUrl: that.itemImageUrl,
                        success () {
                            that.$http.post('../api/v2/user/group/buy/update/share/count', {
                                activityId: that.actId, shareUserId: global.userId
                            })
                        }
                    }, 'groupBuyActJoinSuccess-' + that.actId)
                }
            },
            // 活动时间倒计时
            doComputedTime () {
                let that = this
                let endTime = that.groupEndTime
                let obj = that.groupEnd
                let delt = 0
                let num = 0
                const floor = Math.floor
                const paddingTime = Util.paddingTime
                delt = endTime - (+new Date())
                if (delt > 0) {
                    num = delt / 1000
                    obj.sec = paddingTime(floor(num % 60))
                    obj.min = paddingTime(floor(num / 60 % 60))
                    obj.hour = paddingTime(floor(num / 3600 % 24))
                    obj.day = floor(num / 3600 / 24)
                } else {
                    that.isOver = true // 该团已结束
                    clearInterval(that.timer)
                    Util.tipShow('该团已到结束时间！')
                }
            },
            getClubQrCodeImg () {
                let that = this
                that.getCodeImgMaxCount--
                that.$http.get('../api/v1/qrcode/club/home', {params: {clubId: that.clubId}}).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        if (res.respData == 'N') {
                            if (that.getCodeImgMaxCount != 0) {
                                that.getClubQrCodeImg()
                            }
                        } else {
                            that.clubQrCodeImg = res.respData.url
                        }
                    }
                })
            }
        },
        beforeDestroy () {
            let that = this
            if (that.timer) {
                clearInterval(that.timer)
            }
        }
    }
</script>