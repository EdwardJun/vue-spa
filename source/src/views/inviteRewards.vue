<style lang="sass">
    @import '../sass/page/inviteRewards.scss';
</style>
<template>
    <div class="page" id="invite-rewards-page">
        <ul class="switch-title">
            <li v-for="(item, index) in datas" :class="{ active : currTab == index }" @click="doSwitchTab(index)" :key="index">{{ item.label }}</li>
        </ul>
        <div class="zone-wrap" ref='wrap' :class="'act-' + currTab">
            <div v-for="(data, index) in datas" :key="index" class="list-wrap" :style="{ height : listHeight + 'px' }" @scroll="doHandlerListScroll()">
                <div v-for="(item, itemIndex) in data.dataList"  class="list-item" :key="itemIndex" @click="doClickItem(item)">
                    <div :class="item.prizeContentType"></div>
                    <div>{{ prizeTypeName[item.prizeContentType] }}奖励</div>
                    <div>{{ item.prizeContent }}</div>
                    <div>{{ item.time }}</div>
                </div>
                <div class="data-load-tip" :class="{ none : !data.isLoading }"><div>加载数据</div></div>
                <div class="finish-load-tip" :class="{ none : !(data.isLoadedOver && !data.noData) }"><div>已经加载全部数据</div></div>
                <!--空数据时候的显示-->
                <div class="blank" v-show="data.noData && !data.isLoading">
                    <div v-show="currActId">
                        <div @click="doSwitchRuleModal(true)">活动规则</div>
                        <div @click="doPopShare()">邀请好友</div>
                    </div>
                </div>
            </div>
        </div>
        <!--活动规则弹窗-->
        <div class="rule-modal pop-modal" :class="{ active: showRuleModal }" @click="doSwitchRuleModal(false)">
            <div class="center-wrap" @click="doClickModalWrap($event)">
                <h4>活动规则</h4>
                <ul>
                    <li v-for="(item, index) in descArr" :key="index"><div>{{ index + 1 }}</div>{{ item }}</li>
                </ul>
                <div class="close-btn" @click="doSwitchRuleModal(false, $event)">&times;</div>
            </div>
        </div>
        <!--分享-->
        <Share :share-url = "shareUrl"></Share>
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
                listHeight: 0,
                clubId: '',
                pageSize: 10, // 每页数据
                currTab: 0, // 当前显示的tab
                datas: [], // 数据源
                prizeTypeName: { coupon: '优惠券', credit: '积分', service_item: '服务项目', gift: '礼品券' },
                showRuleModal: false, // 控制活动规则弹窗的显示
                shareUrl: '', // 分享链接
                descArr: [], // 活动规则描述
                currActId: '' // 正在进行中的活动id
            }
        },
        created () {
            let that = this
            let global = that.global
            let query = global.currPage.query

            document.title = '我的奖励'
            that.clubId = query.clubId || global.clubId || ''
            that.currTab = (query.tab || 0) - 0
            that.listHeight = global.winHeight - 2.944 * global.winScale * 16
            // 构造数据
            let labels = ['分享好友奖励', '邀请新人奖励', '新人消费奖励']
            let types = ['share', 'invite', 'consume']
            let datas = []
            for (let i = 0; i < 3; i++) {
                datas.push({
                    label: labels[i],
                    type: types[i],
                    dataList: [],
                    currPage: 0,
                    listEle: null,
                    hasLoad: false, // 是否查询过数据
                    isLoading: false, // 数据是否正在加载
                    isLoadedOver: false, // 数据是否已加载完
                    noData: true // 是否没有数据
                })
            }
            that.datas = datas
            that.queryData(1)
            that.getCurrActInfo()
        },
        methods: {
            /**
             * 头部tab的切换
             */
            doSwitchTab (tabIndex) {
                let that = this
                if (that.currTab != tabIndex) {
                    that.currTab = tabIndex
                    let dataObj = that.datas[tabIndex]
                    that.$router.replace({name: 'inviteRewards', query: {tab: tabIndex}}) // 切换地址参数
                    if (!dataObj.hasLoad) { // 未加载过数据
                        that.queryData(1)
                    }
                }
            },
             /**
             * 获取当前正进行中的活动
             */
            getCurrActInfo () {
                let that = this
                let global = that.global
                that.$http.get('../api/v2/club/user/invite/activity/active', {params: {clubId: that.clubId}}).then((res) => {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        if (res.description) {
                            let descArr = res.description.split('\n')
                            descArr = descArr.map((item) => {
                                return item.trim()
                            })
                            that.descArr = descArr
                        }
                        that.currActId = res.activityId
                        that.shareUrl = global.prefixPathname + '#/' + that.clubId + '/inviteActivityShare?userId=' + global.userId + '&actId=' + that.currActId + '&userName=' + encodeURIComponent(global.userName)
                        // 设置分享
                        if (global.userAgent.isWX) {
                            Global.shareConfig({
                                title: global.userName + '分享的大礼包！',
                                desc: '收到好友分享，点击有惊喜！',
                                link: that.shareUrl,
                                imgUrl: res.registerPrize.imageUrl || global.clubLogoUrl,
                                success () {
                                    that.$http.post('../api/v2/club/user/invite/prize/share', {activityId: that.currActId, clubId: that.clubId})
                                    eventHub.$emit('change-share-pop', false)
                                }
                            }, 'inviteRewards')
                        }
                    }
                })
            },
            /**
             * 滚动加载数据
             */
            doHandlerListScroll () {
                let that = this
                let currTab = that.currTab
                let dataObj = that.datas[currTab]
                let listEle = that.$refs.wrap.children[currTab]
                if (!dataObj.isLoadedOver && listEle.scrollTop + listEle.clientHeight * 1.4 > listEle.scrollHeight) {
                    that.queryData()
                }
            },
            /**
             * 滚动加载数据
             */
            queryData (page) {
                let that = this
                let global = that.global
                let currTab = that.currTab
                let dataObj = that.datas[currTab]

                if (dataObj.isLoading) {
                    return
                }
                dataObj.isLoading = true
                page = page || dataObj.currPage + 1
                dataObj.isLoadedOver = false

                that.$http.get('../api/v2/club/user/invite/prize/list', {params: {
                    clubId: that.clubId,
                    page: page,
                    pageSize: that.pageSize,
                    prizeType: dataObj.type
                }}).then((res) => {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData || []
                        res.forEach((item) => {
                            if (item.time) {
                                item.time = Util.dateFormat(new Date(item.time), 'yyyy.MM.dd hh:mm')
                            }
                        })
                        dataObj.dataList.push(...res)
                        if (res.length < that.pageSize) {
                            dataObj.isLoadedOver = true
                        }
                        dataObj.currPage = page
                        dataObj.isLoading = false
                        if (!dataObj.hasLoad) {
                            dataObj.hasLoad = true
                            global.loading = false
                        }
                        dataObj.noData = (page == 1 && res.length == 0)
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                    }
                }, () => {
                    Util.tipShow(global.loadError)
                })
            },
            /**
             * 点击列表项
             */
            doClickItem (item) {
                let that = this
                let router = that.$router
                if (item.prizeContentType == 'credit') { // 积分
                    router.push({name: 'integralDetail'})
                } else { // 优惠券、项目券、礼品券
                    router.push({name: 'paidCouponDetail', query: {userActId: item.prizeContentId}})
                }
            },
            /**
             * 弹出显示活动规则弹窗
             */
            doSwitchRuleModal (status, e) {
                this.showRuleModal = status
                if (e) {
                    e.stopPropagation()
                }
            },

            doClickModalWrap (e) {
                e.stopPropagation()
            },
            /**
             * 弹出分享提示
             */
            doPopShare () {
                eventHub.$emit('change-share-pop', true)
            }
        }
    }
</script>
