<style lang="sass">
    @import '../sass/page/robProjectDetail.scss';
</style>
<template>
    <div>
        <div class="page" id="rob-project-detail-page" :style="{ height : (global.winHeight-7.5*16*global.winScale)+'px' }">
            <div class="top-banner">
                <router-link class="club" tag="div" :to="{ path: '/' + clubId + '/home' }"><div :style="{ 'background-image': 'url('+clubLogo+')' }"></div><div>{{ clubName }}</div></router-link>
            </div>
            <div class="info">
                <div class="clear-fix"><div>{{ itemData.name }}</div><span v-show="isShowLimitUseTag">限时用</span></div>
                <div><span class="item-amount" v-if="itemData.amountFen>0">{{ itemData.amountFen / 100 }}</span> <i v-if="itemData.amountFen>0">元</i><span v-if="itemData.amountFen>0&&itemData.credits>0">或</span><span class="item-credits" v-show="itemData.credits>0"><span>{{ itemData.credits }}</span> 积分</span></div>
                <div>
                    <div><span>原价{{ itemData.price }}元</span></div>
                    <div><span v-if="itemData.canPaidCount>0">剩余{{ itemData.canPaidCount - itemData.paidCount }}份</span><span v-else>不限份数</span></div>
                </div>
            </div>
            <Clock v-if="itemData.startDate" :start="itemData.startDate" :end="itemData.endDate" @status-change="doCounterStatusChange"></Clock>

            <div class="act-desc">
                <div class="node-pad-icon">活动说明</div>
                <div class="act-desc-info">
                    <div class="item-title">可用时段</div>
                    <div class="use-time">{{ itemData.useStartDateStr }} - {{ itemData.useEndDateStr }}</div>
                    <div class="use-time" v-show="isShowLimitUseTag">{{ periodStr }}</div>
                    <div class="item-title">活动说明</div>
                    <div class="desc" v-html="itemData.instructions"></div>
                    <div class="item-title">活动时间</div>
                    <div class="act-time">{{ itemData.actTimeStr }}</div>
                </div>
            </div>

            <div class="item-desc">
                <div class="info-icon">项目说明</div>
                <div>
                    <div>
                        <div>
                            <div v-if="itemData.imageUrl" :style="{ backgroundImage : 'url('+itemData.imageUrl+')' }"></div>
                            <div>
                                <div>{{ itemData.name }}</div>
                                <div><span>{{ itemData.price }}元/{{ itemData.duration }}{{ itemData.durationUnit }}</span>&nbsp;&nbsp;<span v-show="itemData.pricePlus"><span>加钟</span>{{ itemData.pricePlus }}元/{{ itemData.durationPlus }}{{ itemData.durationUnit }}</span></div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div>项目说明</div>
                        <div>
                            <div v-html="itemData.description || '无'"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="rob-project-confirm-btn" :class="{ 'disabled' : (status != 'started' || itemData.status != 'online' || !isCanPaid ), 'processing' : isProcessing }">
            <div>
                <span>销售人员：</span>
                <div @click="doPopTechSelector()">{{ techId ? techName : '未选择' }}<span v-show="techId && techNum">[{{ techNum }}]</span><i class="icon-arrow-right"></i></div>
            </div>
            <div>
                <div><span v-if="itemData.amountFen>0">{{ itemData.amountFen / 100 * payCount }}</span><i v-if="itemData.amountFen>0">元</i>{{ itemData.amountFen>0&&itemData.credits>0 ? '，或' : '' }}<span v-show="isCredits">{{ itemData.credits * payCount }}</span>{{ isCredits ? '积分' : '' }}</div>
                <span @click="doClickChangeCount(1)">+</span><span>{{ payCount }}</span><span @click="doClickChangeCount(0)">-</span>
            </div>
            <div>
                <div v-if="itemData.credits>0" v-show="isCredits" @click="doClickPayBtnOfCredit()" :class="{ processing : creditProcessing }">{{creditProcessing ? '购买中...' : '积分购买' }}</div>
                <div v-if="itemData.amountFen>0" @click="doClickPayBtnOfCash()" :class="{ processing : cashProcessing }">{{ cashProcessing ? '购买中...' :'微信支付' }}</div>
            </div>
        </div>
        <TechSelector :tech-id="techId" :is-show="isShowTechSelectorPop" @commit="doCommitSelector" @close="doCloseSelector()"></TechSelector>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import WeekDayFormatter from '../filters/week-day-formatter'
    import TechSelector from '../components/tech-selector'
    import Clock from '../components/clock'

    export default {
        filters: {
            WeekDayFormatter: WeekDayFormatter
        },
        components: {
            TechSelector, Clock
        },
        data () {
            return {
                global: Global.data,
                clubId: '',
                clubName: '',
                clubLogo: '',
                itemId: '',
                itemData: {},
                isCanPaid: false,
                isCredits: false,
                status: 'notStarted',
                isProcessing: false,
                creditProcessing: false, // 积分购买中
                cashProcessing: false, // 现金购买中
                cashPayData: null,
                periodStr: '',
                isShowLimitUseTag: false, // 是否显示限时用标记
                qrcodeId: '', // 二维码ID
                qrcodeType: '', // 二维码类型
                payCount: 1, // 购买数量
                userMaxCount: 999,
                userObtainedCount: 0, // 用户已购买的数量
                techId: '', // 当前选择的技师
                techAvatar: '',
                techNum: '', // 技师编号
                techName: '',
                techCode: '',
                isShowTechSelectorPop: false // 控制是否显示选择营销人员弹窗
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            var paramData = Util.sessionStorage('con-rob-project-param')
            var code = query.code
            that.techId = query.techId
            if (that.techId) {
                Util.sessionStorage('saleTechId', that.techId)
            } else {
                that.techId = Util.sessionStorage('saleTechId') || ''
            }

            if (!query.robProjectId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            } else {
                if (paramData && code) {
                    Global.getOpenId({authCode: code, userType: 'user', state: 'confirm-order'}).then(function () {
                        that.init()
                    })
                } else {
                    that.init()
                }
            }
        },
        methods: {
            init () {
                var that = this
                var global = that.global
                var query = global.currPage.query
                that.clubId = query.clubId || global.clubId
                that.itemId = query.robProjectId
                that.techCode = query.techCode
                var ss = Util.sessionStorage
                that.qrcodeId = ss('qrcodeId') || ''
                that.qrcodeType = ss('qrcodeType') || ''
                if (global.pageMode == 'club') {
                    that.clubName = global.clubName
                    that.clubLogo = global.clubLogoUrl
                } else {
                    that.$http.get('../api/v2/club/' + that.clubId + '/clubName').then((clubRes) => {
                        clubRes = clubRes.body
                        that.clubLogo = clubRes.logo || global.defaultClubLogo
                        that.clubName = clubRes.name
                    })
                }
                that.$http.get('../api/v2/club/paid_service_item/view', {params: {id: that.itemId}}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.userMaxCount = res.userPaidCount || 999
                        that.userObtainedCount = res.userObtainedCount || 0
                        that.userMaxCount = that.userMaxCount - that.userObtainedCount
                        res.useStartDateStr = res.useStartDate.split(' ')[0].replace(/-/g, '.')
                        res.useEndDateStr = res.useEndDate.split(' ')[0].replace(/-/g, '.')
                        res.actTimeStr = res.startDate.replace(/-/g, '.') + ' - ' + res.endDate.replace(/-/g, '.')
                        if (res.usePeriod && (res.usePeriod.match(/(\d)/g).length != 7 || res.endTime)) {
                            that.isShowLimitUseTag = true
                        }
                        if ((res.canPaidCount == 0 || res.canPaidCount - res.paidCount > 0) && that.userMaxCount > 0) {
                            that.isCanPaid = true
                        }
                        if (that.isShowLimitUseTag) {
                            that.formatPeriodData(res)
                        }
                        that.itemData = res
                        that.getShareCountUpdate(res.id)
                        Global.getClubSwitches(that.clubId).then(function (switchRes) {
                            if (switchRes.creditSwitch && res.credits > 0) {
                                that.isCredits = true
                            }
                        })
                        that.shareSetting(res.shareUrl, res.imageUrl, res.name)

                        global.loading = false
                    } else {
                        Util.tipShow(res.msg || '查询抢项目详情失败！')
                        // that.$router.back()
                    }
                }, function () {
                    Util.tipShow('查询抢项目详情失败！')
                    // that.$router.back()
                })
            },
            /**
             * 更新分享数
             */
            getShareCountUpdate (actId) {
                var that = this
                that.$http.post('../api/v2/club/share/view/count/update', {
                    actId: actId,
                    type: 'paid_service_item',
                    techCode: that.techCode || '',
                    techId: that.techId,
                    clubId: that.clubId
                }).then(function (res) {
                })
            },
            doCounterStatusChange (status) {
                this.status = status
            },
            doClickChangeCount (isAdd) {
                var that = this
                if (!that.isCanPaid || that.isProcessing) {
                    return
                }
                if (isAdd) {
                    if (that.payCount < that.userMaxCount) {
                        that.payCount++
                    }
                } else {
                    if (that.payCount > 1) {
                        that.payCount--
                    }
                }
            },
            // 设置分享
            shareSetting (shareUrl, imageUrl, name) {
                var that = this
                var global = that.global
                Global.shareConfig({
                    title: global.clubName + '-' + name + '限时抢购就等你来',
                    desc: '据说这个项目一般人抢不到，但是我觉得你可以！抢项目，约技师，享人间极乐。',
                    link: shareUrl || location.href,
                    imgUrl: imageUrl,
                    success () {
                    },
                    fail () {
                        Util.tipShow('分享失败！请刷新页面后再试！')
                    }
                }, 'robProjectDetail' + that.itemId)
            },
            doCheck () {
                var that = this
                var global = that.global
                if (!global.isLogin) {
                    Util.tipShow('请您先登录！')
                    Global.login(that.$router)
                    return false
                } else if (!global.userTel) {
                    Global.bindTelPhone()
                    return false
                }
                return true
            },
            // 点击积分购买按钮
            doClickPayBtnOfCredit () {
                var that = this
                var global = that.global
                var query = global.currPage.query

                if (!that.isCanPaid) {
                    return
                }
                if (that.status == 'notStarted') {
                    return Util.tipShow('活动未开始！')
                } else if (that.status == 'over') {
                    return Util.tipShow('活动已结束！')
                } else if (that.itemData.status != 'online') {
                    return Util.tipShow('活动未上线！')
                }
                if (!that.doCheck()) return

                if (that.isCredits) {
                    if (that.isProcessing) {
                        return Util.tipShow('购买中，请稍候...')
                    }
                    that.isProcessing = true
                    that.creditProcessing = true
                    that.$http.get('../api/v2/club/credits/paid/service_item', {
                        params: {
                            id: that.itemId,
                            techCode: global.techInviteCode || query.techCode || '',
                            userCode: query.userCode || '',
                            count: that.payCount,
                            techId: that.techId
                        }
                    }).then(function (res) {
                        res = res.body
                        that.isProcessing = false
                        that.creditProcessing = false
                        var robProjectId = res.respData
                        if (res.statusCode == 200) {
                            Util.tipShow('支付成功！')
                            that.$http.post('../api/v1/scan/code/stat', {
                                clubId: that.clubId,
                                qrcodeId: that.qrcodeId || '',
                                qrcodeType: that.qrcodeType,
                                statType: 'join'  // 活动参与
                            }).then(() => {
                                that.$router.push({name: 'robProjectSuccess', query: {id: robProjectId, isIntegral: 'true', clubId: that.clubId, techId: that.techId}})
                                //  that.$router.push({name: 'robProjectSuccess', query: {id: cashPayData.bizId, clubId: that.clubId, techId: that.techId}})
                            })
                        } else {
                            Util.tipShow(res.msg || '积分支付失败！')
                        }
                    }, function () {
                        that.isProcessing = false
                        that.creditProcessing = false
                        Util.tipShow('积分支付失败！')
                    })
                } else {
                    Util.tipShow('未开通积分购买！')
                }
            },
            // 点击现金购买按钮
            doClickPayBtnOfCash () {
                var that = this
                var global = that.global
                var query = global.currPage.query
                if (!that.isCanPaid) {
                    return
                }
                if (that.status == 'notStarted') {
                    return Util.tipShow('活动未开始！')
                } else if (that.status == 'over') {
                    return Util.tipShow('活动已结束！')
                } else if (that.itemData.status != 'online') {
                    return Util.tipShow('活动未上线！')
                }

                if (!global.userAgent.isWX) {
                    if (Global.checkAccess('robProjectDetail')) {
                        return Util.tipShow('请在微信中打开页面！')
                    } else {
                        return Util.tipShow('未开通此权限！')
                    }
                }
                if (!that.doCheck()) return
                if (that.isProcessing) {
                    return Util.tipShow('购买中，请稍候...')
                }

                that.isProcessing = true
                that.cashProcessing = true
                that.$http.post('../api/v2/wx/pay/paid_service_item/save', {
                    paidServiceItemId: that.itemId,
                    clubId: that.itemData.clubId,
                    tradeChannel: 'wx',
                    businessChannel: query.channel || 'link',
                    count: that.payCount,
                    techId: that.techId
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.cashPayData = JSON.parse(res.respData)
                        Global.wxJsBridgeReady(() => {
                            that.onBridgeReady()
                        })
                    } else if (res.statusCode == 935801) {
                        Util.localStorage('con-rob-project-param', true)
                        Global.getOauthCode('9358', 'confirm-rob-project', 'base')
                    } else {
                        Util.tipShow(res.msg || '抢项目失败！')
                        that.isProcessing = false
                        that.cashProcessing = false
                    }
                }, function () {
                    Util.tipShow('请求异常！')
                    that.isProcessing = false
                    that.cashProcessing = false
                })
            },
            onBridgeReady () {
                var that = this
                var cashPayData = that.cashPayData
                WeixinJSBridge.invoke('getBrandWCPayRequest', {
                    appId: cashPayData.appId,
                    timeStamp: cashPayData.timeStamp + '',
                    nonceStr: cashPayData.nonceStr,
                    package: cashPayData.package,
                    signType: cashPayData.signType,
                    paySign: cashPayData.paySign
                }, function (res) {
                    that.isProcessing = false
                    if (res.err_msg.indexOf('ok') >= 0) {
                        Util.tipShow('支付成功！')
                        that.$http.post('../api/v1/scan/code/stat', {
                            clubId: that.clubId,
                            qrcodeId: that.qrcodeId || '',
                            qrcodeType: that.qrcodeType,
                            statType: 'join'  // 活动参与
                        }).then(() => {
                            that.$router.push({name: 'robProjectSuccess', query: {id: cashPayData.bizId, clubId: that.clubId, techId: that.techId}})
                        })
                    } else {
                        that.cashProcessing = false
                        Util.tipShow('未能成功支付！')
                        // 支付失败，删除预支付订单
                        that.$http.get('../api/v2/wx/pay/activity/payment/cancel', {params: {payId: cashPayData.bizId}})
                    }
                })
            },
            formatPeriodData (res) {
                var that = this
                var usePeriod = res.usePeriod || ''
                var str = '仅限'
                if (usePeriod === '1,2,3,4,5') {
                    str += '工作日（周一至周五）'
                } else if (usePeriod === '6,0') {
                    str += '周末（周六、周日）'
                } else if (usePeriod.match(/(\d)/g).length == 7) {
                    str += '周一至周日'
                } else {
                    str += (usePeriod || '').replace(/(\d)/g, function () {
                        return ['周日', '周一', '周二', '周三', '周四', '周五', '周六', ' 至 '][arguments[1]]
                    })
                }
                that.periodStr = str + ' ' + (res.startTime ? (res.startTime.replace(/:00$/g, '') + ':00 - ' + res.endTime.replace(/:00$/g, '') + ':00') : '') + '可用'
            },
            // 选择技师回调
            doCommitSelector (data) {
                let that = this
                that.techId = data.techId
                that.techAvatar = data.techAvatar
                that.techNum = data.techNum
                that.techName = data.techName
            },
            doCloseSelector () {
                this.isShowTechSelectorPop = false
            },
            doPopTechSelector () {
                this.isShowTechSelectorPop = true
            }
        }
    }
</script>
