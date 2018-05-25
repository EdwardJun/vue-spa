<style lang="sass">
    @import '../sass/page/plumflowers.scss';
</style>
<template>
    <div class="page" id="plumflowers-page">
        <router-link :to="{ name : 'home' }" class="header" tag="div">
            <div :style="{ backgroundImage : 'url('+(actData.clubLogo || global.defaultClubLogo )+')' }"></div>
            <div>{{ actData.clubName }}</div>
            <div class="right-arrow"></div>
        </router-link>
        <div class="banner"><img v-if="actDetail.imageUrl" :src="actDetail.imageUrl"/></div>
        <div class="act-process">
            <div class="act-process-detail">
                <div :class="actDetail.status">{{ actDetail.status=='complete' ? "已结束" : "进行中" }}</div>
                <div>{{ actDetail.title }}</div>
                <div><span>￥</span><span class="price">{{ actDetail.price }}</span><span>/{{ actDetail.serviceTime }}分钟</span></div>
            </div>
            <div class="act-process-bar">
                <div>
                    <div :style="{ width : processRatio+'%' }"></div>
                    <div :style="{ left : processRatio+'%' }"></div>
                </div>
            </div>
            <div class="act-process-text">
                <div>总需<span class="price">{{ actDetail.price }}</span>人次</div>
                <div>还差<span class="timesSurplus">{{ timesSurplus }}</span></div>
            </div>
        </div>
        <div class="item act-result" v-show="showActResult">
            <div></div>
            <div>中奖揭晓</div>
            <div v-show="!showWinningNo">
                <ul>
                    <li><span>本次开奖将以<span class="lottery-date">{{ lotteryDate || '无' }}</span>福彩3D结果为参照，敬请期待！</span></li>
                </ul>
            </div>
            <div v-show="showWinningNo">
                <div>幸运号码<span>{{ actDetail.winningNo }}</span></div>
                <div>福彩3D<span>{{ actDetail.lotteryNo }}</span></div>
            </div>
        </div>
        <div class="item act-mynums" :class="{ 'no-nums' : !hasNum }">
            <div></div>
            <div>我的号码<a @click="doClickViewBtn()">查看</a></div>
            <div>
                <ul>
                    <li v-for="item in actNos">
                        <div>
                            <div><span>手机<span>{{ item.phoneNum }}</span></span><span>{{ item.createdAt | DateFormatter('MM月dd日 hh:mm:ss') }}</span></div>
                            <div v-html="item.actNo | PlumNumber(winningNo)"></div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
        <div class="item act-rules">
            <div></div>
            <div>活动规则</div>
            <div>
                <ul>
                    <li><span>本活动需要支付，最低一元起，每支付一块钱获得一个号码。</span></li>
                    <li><span>当参与购买的达到{{ actDetail.price }}元，活动停止参与，并根据当天(20点之后则根据明天)福利彩票3D开奖号码计算出一个幸运号码，持有该号码的用户，即可获得奖励。</span></li>
                    <li><span>幸运号码计算办法：若开奖号码小于等于{{ actDetail.price }}即视作为幸运号码；若大于{{ actDetail.price }}则用该号码除以{{ actDetail.price }}余数作为幸运号码。</span></li>
                    <li><span>中奖者收到通知一个月内凭手机号到店消费，奖品不可兑现。</span></li>
                    <li><span>中奖者揭晓后，将会收到电话通知，但不会有任何形式付费领奖要求。一切要求转账、提供银行卡信息行为均为诈骗，请谨防上当受骗。</span></li>
                </ul>
            </div>
            <div><img :src="imgUrl"></div>
        </div>
        <div class="foot-btn">
            <div :class="isComplete ? 'next-time' : 'robed'" @click="doClickRobedBtn()">{{ isComplete ? '下次通知我' : '一元抢'}}</div>
            <div class="shared" @click="doClickShareBtn()">{{ isComplete ? '给朋友看看' : '叫上朋友一起' }}</div>
        </div>
        <div class="join-info pop-modal" :class="{ active : popJoin }">
            <div>
                <div class="close-btn" @click="doCloseJoinPop()">&times;</div>
                <div class="join join-first" v-show="showJoinName=='first'">
                    <div>参与信息<span>(1元参与一次)</span></div>
                    <div>
                        <div class="input-item">
                            <div>手机号码</div>
                            <div><input type="tel" placeholder="请输入您的手机号" v-model="telOfInputFirst" maxlength="11" v-tel-input/></div>
                        </div>
                        <div class="input-item">
                            <div>参与数量</div>
                            <div>
                                <div>
                                    <span class="reduce-count" @touchstart="doTouchStartReduce($event)" @touchmove="doTouchMoveReduce($event)" @touchend="doTouchEndReduce($event)"><span>-</span></span>
                                    <span class="times-count">{{ timesCount }}</span>
                                    <span class="plus-count" @touchstart="doTouchStartPlus($event)" @touchmove="doTouchMovePlus($event)" @touchend="doTouchEndPlus($event)">+</span>
                                </div>
                            </div>
                            <div :class="{ checked : checkedAll }" @click="doClickCheckAll()">全额</div>
                        </div>
                        <div>
                            <span>剩余可参与次数</span>
                            <span><span class="timesSurplus"></span>次</span>
                        </div>
                    </div>
                    <div class="sure-btn" :class="{ disabled : !telOfInputFirstValid }">
                        <div @click="doClickJoinFirstBtn()">确定</div>
                    </div>
                </div>
                <div class="join join-success" v-show="showJoinName=='success'">
                    <div>成功参与</div>
                    <div>
                        <div>
                            <div>您参与了</div>
                            <div class="join-times"><span>{{ joinTimes }}</span>次</div>
                        </div>
                        <div>
                            <div>您的手机</div>
                            <div class="join-tel">{{ joinTel }}</div>
                        </div>
                        <div>
                            <div>您的号码</div>
                            <div class="join-nums"><span v-for="num in joinNums">{{ num }}</span></div>
                        </div>
                    </div>
                    <div class="sure-btn">
                        <div :class="{ 'num-over' : isNumOver }">
                            <div @click="doClickContinueRob()">继续抢</div>
                            <div class="shared">我要炫耀</div>
                        </div>
                    </div>
                </div>
                <div class="join join-notice" v-show="showJoinName=='notice'">
                    <div>联系人信息</div>
                    <div v-show="showJoinNoticeTelInput">
                        <div class="input-item">
                            <div>手机号码</div>
                            <div><input type="tel" placeholder="请输入您的手机号" v-model="telOfInputNotice" maxlength="11" v-tel-input/></div>
                        </div>
                    </div>
                    <div v-show="showJoinNoticeTelList">
                        <div></div>
                        <div>活动开启信息将会发送到下列手机号码</div>
                        <div>{{ noticeTel }}</div>
                    </div>
                    <div class="sure-btn" :class="{ disabled : !telOfInputNoticeValid }">
                        <div @click="doClickJoinNoticeBtn()">确定</div>
                    </div>
                </div>
                <div class="join join-search" v-show="showJoinName=='search'">
                    <div>输入手机号查看已购买</div>
                    <div><div><input type="tel" placeholder="请输入您的手机号" v-model="telOfInputSearch"/></div></div>
                    <div class="sure-btn" :class="{ disabled : !telOfInputSearchValid }" @click="doClickJoinSearchBtn()"><div>确定</div></div>
                </div>
            </div>
        </div>
        <Share :share-url="shareUrl"></Share>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import eventHub from '../libs/hub'
    import Util from '../libs/util'
    import DateFormatter from '../filters/date-formatter'
    import PlumNumber from '../filters/plum-number'
    import TelInput from '../directives/tel-input'
    import Share from '../components/share'

    export default {
        filters: {
            DateFormatter: DateFormatter,
            PlumNumber: PlumNumber
        },
        directives: {
            'tel-input': TelInput
        },
        components: {
            Share
        },
        data () {
            return {
                global: Global.data,
                imgUrl: './static/images/plumflowers/9358.jpg',
                tel: '',
                isPay: false,
                isNeedQuery: false,
                actId: '',
                shareCode: '',
                openId: '',
                clubId: '',
                shareUrl: '',
                actData: {},
                actDetail: {},
                timesSurplus: '-',
                processRatio: 0,
                showActResult: false,
                showWinningNo: false,
                isComplete: false,
                hasNum: false,
                actNos: [],
                winningNo: '',
                telOfInputFirst: '',
                telOfInputNotice: '',
                telOfInputSearch: '',
                popJoin: false,
                showJoinName: 'first',
                showJoinNoticeTelInput: false,
                showJoinNoticeTelList: false,
                telInputReg: /^1[3456789]\d{9}$/,
                timesCount: 1,
                lotteryDate: '',
                tradeReqData: null,
                payResData: null,
                joinTimes: '',
                joinTel: '',
                isNumOver: true,
                checkedAll: false,
                noticeTel: '',
                reduceTimer: null,
                plusTimer: null,
                joinNums: []
            }
        },
        computed: {
            telOfInputFirstValid () {
                return this.telInputReg.test(this.telOfInputFirst)
            },
            telOfInputNoticeValid () {
                return this.telInputReg.test(this.telOfInputNotice)
            },
            telOfInputSearchValid () {
                return this.telInputReg.test(this.telOfInputSearch)
            }
        },
        beforeRouteEnter (to, from, next) {
            var query = to.query
            var openId
            var global = Global.data
            var authCode = query.code || ''
            if (!query.id) {
                Util.tipShow(global.visitError)
                next(false)
            } else {
                openId = Util.localStorage('_indianas_user_open_id') || ''
                if (global.userAgent.isWX) {
                    if (!openId || openId.length < 10) {
                        if ((+new Date()) - (query['_t'] || 0) > 24000 || authCode) {
                            Global.getOauthCode('9358', 'plumflowers_pay', 'base')
                        } else {
                            Global.getOpenId({authCode: authCode}).then(function (res) {
                                openId = res.openid
                                Util.localStorage('_indianas_user_open_id', openId)
                                next(function (vm) {
                                    vm.openId = openId
                                    vm.init()
                                })
                            }, function () {
                                Util.tipShow('未能获取OpenId！')
                                next(false)
                            })
                        }
                    } else {
                        next(function (vm) {
                            vm.init()
                        })
                    }
                } else {
                    next(function (vm) {
                        vm.init()
                    })
                }
            }
        },
        methods: {
            init () {
                var that = this
                var global = that.global
                var query = global.currPage.query
                var detail
                var joinNums = []

                that.actId = query.id
                that.shareCode = query.shareCode || ''
                that.tel = Util.localStorage('_indianas_tel_phone') || global.userTel || ''
                for (var i = 1; i <= 200; i++) {
                    if (i < 10) {
                        joinNums.push('00' + i)
                    } else if (i < 100) {
                        joinNums.push('0' + i)
                    } else {
                        joinNums.push(i)
                    }
                }
                that.joinNums = joinNums
                that.$http.post('../api/v2/plumflower/view', {
                    id: that.actId,
                    phoneNum: that.tel,
                    shareCode: that.shareCode,
                    topShareCode: query.topShareCode || '',
                    chanel: query.chanel || 'link'
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.clubId = res.clubId
                        that.shareUrl = res.shareUrl || location.href + (query.chanel ? '' : '&chanel=link')
                        if (res.shareCode) {
                            that.shareCode = res.shareCode
                        }
                        detail = that.actDetail = res.plumFloweActivity
                        that.actData = res
                        that.timesSurplus = detail.price - detail.successPaidAmount
                        that.processRatio = (detail.successPaidAmount / detail.price * 100).toFixed(3)
                        that.actNos = (res.actNos && res.actNos.length ? res.actNos : [])
                        that.winningNo = detail.winningNo
                        that.lotteryDate = detail.lotteryDate

                        if (detail.status == 'complete') {
                            that.showActResult = true
                            that.showWinningNo = !!detail.winningNo
                            that.isComplete = true
                        } else if (that.actNos.length > 0) {
                            that.showWinningNo = false
                            that.hasNum = true
                            if (that.timesSurplus == 0) {
                                that.showActResult = true
                            }
                        }

                        if (that.timesSurplus == 0) {
                            that.isComplete = true
                        }

                        if (that.tel) {
                            if (that.actNos.length == 0 && query.isSearch) {
                                // $.paramClear('isSearch')
                                Util.tipShow('未查询到您的购买信息。', 5000)
                            }
                            that.isNeedQuery = true
                            that.telOfInputFirst = that.tel
                            that.telOfInputNotice = that.tel
                        }
                        global.loading = false
                    } else {
                        Util.tipShow(res.msg || '数据请求失败！')
                        that.$router.back()
                    }
                }, function () {
                    Util.tipShow('数据请求失败！')
                    that.$router.back()
                })
            },
            // 设置分享
            shareSetting (shareUrl, clubLogo, actId) {
                var that = this
                var global = that.global
                var query = global.currPage.query
                Global.shareConfig({
                    title: '一元夺美女',
                    desc: '一元抢会所高端项目，美女技师任你挑~',
                    link: shareUrl,
                    imgUrl: clubLogo || global.defaultClubLogo,
                    success () {
                        that.$http.post('../api/v2/plumflower/share', {
                            id: actId,
                            shareCode: that.shareCode || '',
                            topShareCode: query.topShareCode || '',
                            chanel: query.chanel || ''
                        })
                    },
                    fail () {
                        Util.tipShow('分享失败！请刷新页面后再试！')
                    }
                })
            },
            doCloseJoinPop () {
                this.popJoin = false
            },
            doClickViewBtn () {
                this.showJoinName = 'search'
                this.popJoin = true
            },
            doClickJoinSearchBtn () {
                var that = this
                Util.localStorage('_indianas_tel_phone', that.telOfInputSearch)
                // $.page('plumflowers&isSearch=true&_time='+new Date().getTime()+'&id='+actId,0,true,false);
            },
            doClickRobedBtn () {
                var that = this
                that.popJoin = true
                if (that.isComplete) { // next-time
                    that.showJoinName = 'notice'
                    that.showJoinNoticeTelInput = true
                    that.showJoinNoticeTelList = false
                } else {
                    that.showJoinName = 'first'
                }
            },
            onBridgeReady () {
                var that = this
                var tradeReqData = that.tradeReqData
                var payResData = that.payResData
                WeixinJSBridge.invoke('getBrandWCPayRequest', {
                    'appId': tradeReqData.appId,
                    'timeStamp': tradeReqData.timeStamp + '',
                    'nonceStr': tradeReqData.nonceStr,
                    'package': tradeReqData.package,
                    'signType': tradeReqData.signType,
                    'paySign': tradeReqData.paySign
                }, function (res) {
                    that.isPay = false
                    if (res.err_msg && res.err_msg.indexOf('ok') >= 0) { // 支付成功之后
                        Util.tipShow('支付成功！')
                        Util.localStorage('_indianas_tel_phone', that.telOfInputFirst)
                        if (that.tel && that.tel != that.telOfInputFirst) {
                            that.actNos = []
                        }
                        that.showJoinName = 'success'

                        var userPlumFlower = payResData.userPlumFlowe.userPlumFlowe
                        var plumFlower = payResData.userPlumFlowe.plumFlowe
                        var paidAmount = userPlumFlower.amount + plumFlower.successPaidAmount
                        var date = new Date()

                        that.timesSurplus = plumFlower.price - paidAmount
                        that.processRatio = (paidAmount / plumFlower.price * 100).toFixed(3)

                        if (that.timesSurplus == 0) {
                            that.showActResult = true
                            if (date.getHours() >= 20) {
                                date.setDate(date.getDate() + 1)
                            }
                            that.lotteryDate = Util.dateFormat(date, 'yyyy-MM-dd')
                            that.isComplete = true
                        }
                        that.joinTimes = userPlumFlower.amount
                        that.joinTel = userPlumFlower.phoneNum
                        that.isNumOver = (userPlumFlower + plumFlower.successPaidAmount >= plumFlower.price)
                        that.joinNums = userPlumFlower.actNo.split(',')
                        that.hasNum = true
                        that.actNos = [{
                            phoneNum: userPlumFlower.phoneNum,
                            createdAt: userPlumFlower.createdAt,
                            actNo: userPlumFlower.actNo
                        }]
                    } else {
                        Util.tipShow('未能成功支付！')
                        that.$http.post('../api/v2/plumflower/userplumflower/delete', {id: payResData.userPlumFlowe.userPlumFlowe.id})
                    }
                    that.timesCount = 1
                    that.checkedAll = false
                })
            },
            doClickJoinFirstBtn () {
                var that = this
                var global = that.global
                var query = global.currPage.query

                if (!that.telOfInputFirstValid) return
                if (that.timesCount == 0) {
                    Util.localStorage('_indianas_tel_phone', that.telOfInputFirst)
                    // $.page('plumflowers&isSearch=true&_time='+new Date().getTime()+'&id='+actId,0,true,false);
                    return
                } else if (!global.userAgent.isWX) {
                    if (Global.checkAccess('plumflowers')) {
                        Util.tipShow('请在微信中打开！')
                    }
                    return
                }

                // 是否需要查询之前是否已有购买数据
                if (that.isNeedQuery) {
                    that.$http.post('../api/v2/plumflower/view', {
                        id: that.actId,
                        phoneNum: that.tel,
                        shareCode: query.shareCode || '',
                        topShareCode: query.topShareCode || '',
                        chanel: query.chanel || 'link'
                    }).then(function (res) {
                        res = res.body
                        that.actNos = (res.actNos && res.actNos.length ? res.actNos : [])
                        if (that.actNos.length > 0) {
                            that.hasNum = true
                            that.winningNo = res.plumFloweActivity.winningNo
                        }
                    })
                }
                // ======
                if (!that.isPay) {
                    that.isPay = true
                    that.$http.post('../api/v2/wx/pay/paid_plumflower', {
                        plumFloweId: that.actId,
                        amount: that.timesCount,
                        phoneNum: that.telOfInputFirst,
                        shareCode: query.shareCode,
                        topShareCode: query.topShareCode,
                        chanel: query.chanel || 'link',
                        openId: that.openId,
                        clubId: that.clubId,
                        tradeChannel: 'wx',
                        businessChannel: query.chanel || 'link'
                    }).then(function (payRes) {
                        payRes = payRes.body
                        if (payRes.statusCode == 200) {
                            that.payResData = payRes = payRes.respData
                            var userPlumFlower = payRes.userPlumFlowe.userPlumFlowe
                            var plumFlower = payRes.userPlumFlowe.plumFlowe
                            var paidAmount

                            if (userPlumFlower.amount < parseInt(that.timesCount)) {
                                paidAmount = userPlumFlower.amount + plumFlower.successPaidAmount
                                that.timesSurplus = plumFlower.price - plumFlower.successPaidAmount
                                that.processRatio = (paidAmount / plumFlower.price * 100).toFixed(3)

                                if (that.timesSurplus == 0) {
                                    that.timesCount = 1
                                    that.popJoin = false
                                    that.showActResult = true
                                    that.lotteryDate = plumFlower.lotteryDate
                                    that.isComplete = true
                                    if (plumFlower.price - plumFlower.successPaidAmount == 0 || userPlumFlower.amount == 0) {
                                        that.isPay = false
                                        return Util.tipShow('剩余次数为0，抱歉，您此次未抢到！')
                                    }
                                } else {
                                    that.timesCount = that.timesSurplus
                                    Util.tipShow('剩余次数小于您所选购的次数，请注意！')
                                }
                            }

                            that.tradeReqData = JSON.parse(payRes.tradeReqData)
                            Global.wxJsBridgeReady(() => {
                                that.onBridgeReady()
                            })
                        } else if (payRes.statusCode == 500) {
                            Util.tipShow('此次未抢购成功。')
                            // $.page('plumflowers&isSearch=true&_time='+new Date().getTime()+'&id='+actId,0,true,false);
                        }
                    })
                } else {
                    Util.tipShow('正在支付，请稍候...', 3000)
                }
            },
            // 点击全额
            doClickCheckAll () {
                var that = this
                if (!that.checkedAll) {
                    that.timesCount = that.timesSurplus
                }
                that.checkedAll = !that.checkedAll
            },
            // 点击继续抢
            doClickContinueRob () {
                this.showJoinName = 'first'
                this.timesCount = 1
            },
            // 点击下次通知确定按钮
            doClickJoinNoticeBtn () {
                var that = this
                if (!that.telOfInputNoticeValid) return

                if (!that.showJoinNoticeTelInput) {
                    that.popJoin = false
                } else {
                    that.$http.post('../api/v2/plumflower/nextnoticeuser/save', {
                        phoneNum: that.telOfInputNotice,
                        clubId: that.clubId,
                        actId: that.actId
                    }).then(function (res) {
                        res = res.body
                        if (res.statusCode == 200) {
                            Util.tipShow('预约成功！')
                            that.showJoinNoticeTelInput = false
                            that.showJoinNoticeTelList = true
                            that.noticeTel = that.telOfInputNotice
                        } else {
                            Util.tipShow(res.msg || '预约失败！')
                        }
                    })
                }
            },
            // 点击分享按钮
            doClickShareBtn () {
                eventHub.$emit('change-share-pop', true)
            },
            doReduceCount () {
                var that = this
                clearTimeout(that.reduceTimer)
                that.reduceTimer = 0
                if (parseInt(that.timesCount) > 1) {
                    clearTimeout(that.plusTimer)
                    that.plusTimer = 0
                    that.timesCount = that.timesCount - 1
                    that.reduceTimer = setTimeout(that.doReduceCount, 100)
                }
            },
            doPlusCount () {
                var that = this
                clearTimeout(that.plusTimer)
                that.plusTimer = 0
                if (parseInt(that.timesCount) < that.timesSurplus) {
                    clearTimeout(that.reduceTimer)
                    that.reduceTimer = 0
                    that.timesCount = parseInt(that.timesCount) + 1
                    that.plusTimer = setTimeout(that.doPlusCount, 100)
                }
            },
            doTouchStartReduce (e) {
                e.preventDefault()
                this.checkedAll = false
                this.doReduceCount()
            },
            doTouchMoveReduce () {
                var that = this
                clearTimeout(that.reduceTimer)
                clearTimeout(that.plusTimer)
                that.reduceTimer = 0
                that.plusTimer = 0
            },
            doTouchEndReduce (e) {
                e.preventDefault()
                this.doTouchMoveReduce()
            },
            doTouchStartPlus (e) {
                e.preventDefault()
                this.doPlusCount()
            },
            doTouchMovePlus () {
                var that = this
                clearTimeout(that.reduceTimer)
                clearTimeout(that.plusTimer)
                that.reduceTimer = 0
                that.plusTimer = 0
            },
            doTouchEndPlus (e) {
                e.preventDefault()
                this.doTouchMovePlus()
            }
        }
    }
</script>
