<style lang="sass">
    @import '../sass/page/oneYuanSuccess.scss';
</style>
<template>
    <div class="page" id="one-yuan-success-page">
        <router-link :to="{ path: '/'+ clubId+'/home' }" class="club-title right-arrow-item" tag="div"><div :style="{ 'background-image': 'url('+global.clubLogoUrl+')' }" class="no-border"></div><div>{{ global.clubName }}</div></router-link>
        <div class="success-info">
            <div>抢到啦，感觉自己要中奖！</div>
            <div>赶紧告诉您的朋友吧</div>
            <div @click="doPopShare()">叫朋友一起抢</div>
        </div>

        <div class="my-num" :class="{ 'no-data':  numList.length == 0 }">
            <div>我的号码</div>
            <div v-if="numList.length == 0">未查询到您的号码，请稍候再试</div>
            <div v-else>
                <div v-for="(item,index) in numList" v-show="index<3 || isNumExpanded">{{ item }}</div>
            </div>
            <div v-show="numList.length>3" :class="{ 'expanded': isNumExpanded }" @click="doClickExpanded()"><div></div></div>
        </div>

        <div class="view-link"><router-link :to="{ name: 'oneYuanRecords' }">查看抢购记录</router-link></div>
        <Share :share-url="shareUrl" v-if="shareUrl"></Share>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import eventHub from '../libs/hub'
    import Share from '../components/share'

    export default {
        components: {
            Share
        },
        data () {
            return {
                global: Global.data,
                clubId: '',
                shareUrl: '',
                numList: [],
                oneYuanId: '',
                isNumExpanded: false
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            that.clubId = query.clubId || global.clubId
            that.oneYuanId = query.oneYuanId
            var actInfo = Util.localStorage('tmpOneYuanNums_cache')
            actInfo = actInfo ? JSON.parse(actInfo) : {nums: ''}

            document.title = '抢购成功'
            var nums = actInfo.nums
            if (!that.oneYuanId && !nums) {
                Util.tipShow(global.visitError)
                return that.$router.push({name: 'home'})
            }

            if (nums && that.oneYuanId == actInfo.oneYuanId) {
                that.doHandlerNums(nums.split(','))
                global.loading = false
            } else {
                that.$http.get('../api/v2/club/one_yuan/my/ticket_no', {params: {
                    oneYuanId: that.oneYuanId,
                    clubId: that.clubId
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.doHandlerNums(res.respData.split(','))
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                    }
                    global.loading = false
                }, function () {
                    Util.tipShow(global.loadError)
                    return that.$router.push({name: 'home'})
                })
            }
            if (global.userAgent.isWX && actInfo.shareUrl) {
                that.shareUrl = actInfo.shareUrl
                Global.shareConfig({
                    title: '夺宝',
                    desc: '我和你只有一块钱的距离，点我立即参与',
                    link: actInfo.shareUrl,
                    imgUrl: actInfo.shareImage,
                    success () {
                        eventHub.$emit('change-share-pop', false)
                    },
                    fail () {
                        Util.tipShow('分享失败！请刷新页面后再试！')
                    }
                }, 'oneYuanSuccess-' + that.oneYuanId)
            }
        },
        methods: {
            doPopShare () {
                if (this.shareUrl) {
                    eventHub.$emit('change-share-pop', true)
                } else {
                    Util.tipShow('未能获取分享链接！')
                }
            },
            doClickExpanded () {
                var that = this
                that.isNumExpanded = !that.isNumExpanded
            },
            doHandlerNums (numsArr) {
                var that = this
                var list = []
                var count = Math.ceil(numsArr.length / 10)
                while (count > 0 && numsArr.length > 0) {
                    list.push(numsArr.splice(0, 10).join(' '))
                    count--
                }
                that.numList = list
            }
        }
    }
</script>
