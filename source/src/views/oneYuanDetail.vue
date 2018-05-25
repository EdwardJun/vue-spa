<style lang="sass">
    @import '../sass/page/oneYuanDetail.scss';
</style>
<template>
    <div class="page" id="one-yuan-detail-page" :class="'act-'+actData.status"
         :style="{ 'padding-bottom': (isShowFooterBtn ? '3.167rem' : '0') }">
        <div class="banner"
             :style="{ 'background-image': 'url('+ (actData.imageUrl || './static/images/one-yuan-bg-image.jpg') +')' }">
            <router-link :to="{ path: '/'+clubId+'/home' }" tag="div" class="club-title fixed right-arrow-item">
                <div :style="{ 'background-image': 'url('+global.clubLogoUrl+')' }"></div>
            </router-link>
                <div>{{ global.clubName }}</div>
                       <router-link :to="{ name: 'oneYuanExplain' }" class="act-rule" tag="div">
                <div>活动规则</div>
            </router-link>
        </div>

        <div class="act-processing">
            <div>
                <div>{{ actData.statusText }}</div>
                <div>{{ actData.actName }}<span>(第{{ actData.currentPeriod }}期)</span></div>
                <div class="price"><span><span>￥</span>{{ actData.actPrice }}</span>/<span>{{ actData.duration }}</span>
                </div>
            </div>
            <div>
                <div>
                    <div class="price">
                        <span><span>￥</span>{{ actData.actPrice }}</span>/<span>{{ actData.duration }}</span></div>
                    <div>还差<span>{{ actData.canPaidCount }}</span></div>
                </div>
                <div>
                    <div :style="{ width: actData.progress + '%' }"></div>
                </div>
            </div>
        </div>

        <div class="act-calc-time">
            <div>
                <div>揭晓倒计时：</div>
                <div v-show="isShowHour">{{ hour }}</div>
                <div v-show="isShowHour">时</div>
                <div>{{ min }}</div>
                <div>分</div>
                <div v-show="!isShowHour">{{ sec }}</div>
                <div v-show="!isShowHour">秒</div>
            </div>
            <div v-if="actData.drawTime && actData.drawTime.getFullYear">将以{{ actData.drawTime.getFullYear() }}年{{
                actData.drawTime.getMonth() + 1 }}月{{ actData.drawTime.getDate() }}日福彩3D开奖结果为准
            </div>
        </div>

        <div class="winner-info">
            <div class="winner-info-wrap">
                <div>
                    <div
                        :style="{ 'background-image': 'url('+ (oneYuanDrawLog.userAvatarUrl || global.defaultHeader) +')'}"></div>
                    <div>
                        <div>
                            <div>获奖者：</div>
                            <div>{{ oneYuanDrawLog.userName || '---' }}</div>
                        </div>
                        <div>
                            <div>参与次数：</div>
                            <div><span>{{ oneYuanDrawLog.ticketCount || '-' }}</span>次</div>
                        </div>
                        <div>
                            <div>揭晓时间：</div>
                            <div>{{ oneYuanDrawLog.drawTime || '----' }}</div>
                        </div>
                    </div>
                </div>
                <div>
                    <div>中奖号码：</div>
                    <div>{{ oneYuanDrawLog.actDrawNo }}</div>
                    <div @click="doViewOtherDrawNo()">查看他的号码</div>
                </div>
                <div>获奖者</div>
            </div>
        </div>

        <div class="my-nums"
             :class="{ 'no-more': myTicketNos.length<=7, 'null-data': myTicketNos.length == 0, 'expanded': isExpandedMyNum }">
            <div @click="doSwitchExpandedMyNum()">
                <div>我的号码：</div>
                <div>{{ myTicketNos.length == 0 ? '您暂未购买' : myTicketNos.slice(0, 7).join(' ') }}</div>
                <div></div>
            </div>
            <div>
                <div>{{ myTicketNos.join('') }}</div>
                <div @click="doCloseExpandedMyNum()">
                    <div></div>
                </div>
            </div>
        </div>

        <div class="past-win-info" v-show="lastOneYuanDrawLog.info">
            <router-link tag="div"
                         :to="{ name: 'oneYuanPastWinRecords', query: { oneYuanBaseId: oneYuanBaseId, clubId: clubId } }">
                <div></div>
                <div>上期中奖</div>
                <div>往期</div>
                <div></div>
            </router-link>
            <div>
                <div
                    :style="{ 'background-image': 'url('+(lastOneYuanDrawLog.userAvatarUrl || global.defaultHeader)+')' }"></div>
            </div>
            <div>{{ lastOneYuanDrawLog.info || '----' }}</div>
        </div>

        <div class="join-list">
            <router-link :to="{ name: 'oneYuanJoinRecords', query: { oneYuanId: oneYuanId, clubId: clubId }}" tag="div">
                <div></div>
                <div>本期参与记录</div>
                <div v-show="joinData.length > 0">全部</div>
                <div v-show="joinData.length > 0"></div>
            </router-link>
            <div :class="{ 'null-data' : joinData.length == 0 }">
                <div>
                    <div v-for="item in joinData" class="join-item">
                        <div
                            :style="{ 'background-image' : 'url('+(item.userAvatarUrl || global.defaultHeader)+')' }"></div>
                        <div>
                            <div>
                                <div>{{ item.userName }} {{ item.phoneNum.replace(/^(\d{3})\d{4}(\d{4})$/g,'（$1****$2）')
                                    }}
                                </div>
                                <div><span>{{ item.ticketCount }}</span>人次</div>
                            </div>
                            <div>{{ item.createdTime }}</div>
                        </div>
                    </div>
                </div>
                <div>无参与记录，争做第一人</div>
            </div>
        </div>

        <div class="rob-item act-explain">
            <div class="node-pad-icon">活动说明</div>
            <div>
                <div style="display: none;">
                    <div>活动时间</div>
                    <div></div>
                </div>
                <div>
                    <div style="display: none;">活动说明</div>
                    <div style="margin-top:0;">
                        <div v-html="actData.actDescription || '无' "></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="rob-item item-explain">
            <div class="info-icon">项目说明</div>
            <div>
                <div>
                    <div>
                        <div
                            :style="{ 'background-image': 'url('+ (actData.prizeImageUrl || global.defaultServiceItemImgUrl )+')' }"></div>
                        <div>
                            <div>{{ actData.actName || '-' }}</div>
                            <div>
                                <span>{{ actData.actPrice }}元/{{ actData.duration }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div style="display: none;">项目说明</div>
                    <div>
                        <div v-html="actData.prizeDescription || '无'"></div>
                    </div>
                </div>
            </div>
        </div>

        <Share :share-url="shareUrl"></Share>

        <div class="footer-btn" v-show="isShowFooterBtn" :class="{ over: isActOver }">
            <div>
                <div class="shared" @click="doClickShareBtn()">叫上朋友一起</div>
                <div class="robed" @click="doClickRobedBtn()">一元抢</div>
            </div>
            <div>
                <div>第{{ actData.onlinePeriod }}期正在火热进行中...</div>
                <div @click="doClickGoOnlineAct()">立即前往</div>
            </div>
        </div>

        <div class="join-info" :class="{ active: isJoinInfoPop }">
            <div>
                <div>
                    <div>参与信息<span>({{ actData.unitPrice }}元参与一次)</span></div>
                    <div class="close-btn" @click="doCloseJoinInfo()">&times;</div>
                </div>
                <div :class="{ 'is-bind': isBindPhone }">
                    <div class="input-item phone-item">
                        <div>手机号码</div>
                        <div>
                            <input v-model="phone" type="tel" maxlength="11" placeholder="请输入您的手机号"
                                   :disabled="isBindPhone || inSendingCode" v-tel-input/>
                        </div>
                        <div :class="{ disabled: isTelValid || inSendingCode}" @click="doClickSendCode()">{{
                            sendCodeText }}
                        </div>
                    </div>
                    <div class="input-item code-item">
                        <div>验证码</div>
                        <div>
                            <input v-model="verifyCode" type="tel" maxlength="4" placeholder="请输入验证码"
                                   v-test-code-input/>
                        </div>
                    </div>
                    <div class="input-item amount-item">
                        <div>参与数量</div>
                        <div>
                            <div>
                                <div class="reduce-count" data-type="reduce"
                                     @touchstart="doTouchStartPayCount('-', $event)"
                                     @touchend="doTouchEndPayCount('-', $event)"
                                     @touchcancel="doTouchEndPayCount('-', $event)">-
                                </div>
                                <div class="times-count">{{ timesCount }}</div>
                                <div class="plus-count" data-type="plus" @touchstart="doTouchStartPayCount('+', $event)"
                                     @touchend="doTouchEndPayCount('+', $event)"
                                     @touchcancel="doTouchEndPayCount('+', $event)">+
                                </div>
                            </div>
                        </div>
                        <div :class="{ checked: isSelectAll }" @click="doClickSelectAll()">全额</div>
                    </div>
                    <div>
                        <span>剩余可参与次数</span>
                        <span><span class="timesSurplus">{{ actData.canPaidCount }}</span>次</span>
                    </div>
                </div>
                <div class="sure-btn" :class="{ 'disabled': !canPay }" @click="doClickPayBtn()">
                    <div>确定</div>
                </div>
            </div>
        </div>

        <div class="show-num-pop pop-modal" :class="{ active: isShowNumPop }">
            <div class="center-wrap">
                <div>
                    <div>{{ actData.actName }}</div>
                    <div @click="doCloseNumPop()">&times;</div>
                </div>
                <div>
                    <div>参与 <span>{{ otherUserNums.length }}</span> 次</div>
                    <div>{{ otherUserNums.join(' ') }}</div>
                </div>
            </div>
        </div>

    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import eventHub from '../libs/hub'
    import TelInput from '../directives/tel-input'
    import TestCodeInput from '../directives/test-code-input'
    import Share from '../components/share'

    export default {
        components: {
            Share
        },
        data () {
            return {
                global: Global.data,
                clubId: '',
                oneYuanId: '',
                oneYuanBaseId: '',
                actData: {},
                oneYuanDrawLog: {},
                otherUserNums: [], // 其他号码
                myTicketNos: [], // 我的号码
                lastOneYuanDrawLog: {}, // 上期中奖

                timesCount: 1,
                shareUrl: '',
                joinData: [],
                isShowFooterBtn: true,
                isShowNumPop: false,
                isJoinInfoPop: false,
                isBindPhone: false,
                isActOver: false,
                isSelectAll: false,
                isExpandedMyNum: false,
                isInPay: false, // 正在支付
                payRequestObj: null,
                oneYuanOrderLog: null,

                verifyCode: '',
                phone: '',

                // 计时
                isShowHour: true,
                hour: '00',
                min: '00',
                sec: '00',

                intervalTime: 60,
                sendCodeText: '发送验证码',
                inSendingCode: false,

                countTimer: 0,
                plusValue: 1,
                plusSpeed: 200,
                runCount: 0,
                qrcodeId: '', // 二维码ID
                qrcodeType: '' // 二维码类型
            }
        },
        computed: {
            isVerifyCodeVaild () {
                return /^\d{4}$/.test(this.verifyCode)
            },
            isTelValid () {
                return /^1[3456789]\d{9}$/.test(this.phone)
            },
            canPay () {
                var that = this
                return (that.isTelValid && that.isVerifyCodeVaild) || that.isBindPhone
            }
        },
        directives: {
            'tel-input': TelInput,
            'test-code-input': TestCodeInput
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query

            that.clubId = query.clubId || global.clubId
            that.beforeInit()
            var authCode = query.code
            if (authCode && query.state == 'paid-oneYuan') {
                Global.getOpenId({authCode: authCode, state: 'paid-oneYuan'}).then(function () {
                    that.init()
                }, function (error) {
                    Util.tipShow(error)
                    that.$router.back()
                })
            } else {
                that.init()
            }
        },
        methods: {
            clearData () {
                var that = this
                that.oneYuanId = ''
                that.oneYuanBaseId = ''
                that.actData = {}
                that.oneYuanDrawLog = {}
                that.otherUserNums = [] // 其他号码
                that.myTicketNos = [] // 我的号码
                that.lastOneYuanDrawLog = {} // 上期中奖
                that.timesCount = 1

                that.shareUrl = ''
                that.joinData = []
                that.isShowFooterBtn = true
                that.isShowNumPop = false
                that.isJoinInfoPop = false
                that.isBindPhone = false
                that.isActOver = false
                that.isSelectAll = false
                that.isExpandedMyNum = false
                that.isInPay = false // 正在支付
                that.payRequestObj = null
                that.oneYuanOrderLog = null

                that.verifyCode = ''
                that.phone = ''

                // 计时
                that.isShowHour = true
                that.hour = '00'
                that.min = '00'
                that.sec = '00'

                that.intervalTime = 60
                that.sendCodeText = '发送验证码'
                that.inSendingCode = false

                that.countTimer = 0
                that.plusValue = 1
                that.plusSpeed = 200
                that.runCount = 0
            },
            beforeInit () {
                var that = this
                var global = that.global
                var query = global.currPage.query

                that.oneYuanId = query.oneYuanId || ''
                that.oneYuanBaseId = query.oneYuanBaseId || ''

                if (!that.oneYuanId && !that.oneYuanBaseId) {
                    Util.tipShow(global.visitError)
                    that.$router.back()
                }
            },
            init () {
                var that = this
                var global = that.global
                var ss = Util.sessionStorage
                that.qrcodeId = ss('qrcodeId') || ''
                that.qrcodeType = ss('qrcodeType') || ''
                // console.log(`qrcodeId=${that.qrcodeId}`)
                // console.log(`qrcodeType=${that.qrcodeType}`)
                that.isBindPhone = !!global.userTel
                if (that.isBindPhone) { // 如果已经绑定手机了，则自动填写手机号码，且不可更改
                    that.phone = global.userTel
                    that.canPay = true
                    that.isTelValid = true
                }
                that.$http.get('../api/v2/club/one_yuan/view', {
                    params: {
                        clubId: that.clubId,
                        oneYuanId: that.oneYuanId,
                        oneYuanBaseId: that.oneYuanBaseId
                    }
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        var oneYuanAct = res.oneYuanAct
                        var lastOneYuanDrawLog = res.lastOneYuanDrawLog
                        var myTicketNos = res.myTicketNos.split(',')
                        var oneYuanDrawLog = res.oneYuanDrawLog

                        that.oneYuanId = oneYuanAct.id
                        that.oneYuanBaseId = oneYuanAct.oneYuanBaseId
                        oneYuanAct.canPaidCount = res.canPaidCount
                        oneYuanAct.shareImage = oneYuanAct.imageUrl || './static/images/one-yuan-bg-image.jpg'
                        oneYuanAct.statusText = '进行中'
                        oneYuanAct.progress = (oneYuanAct.paidCount / oneYuanAct.totalPaidCount) * 100

                        if (oneYuanAct.status == 'end') {
                            oneYuanAct.statusText = '待开奖'
                            that.doHandlerDrawTime(oneYuanAct)
                            that.isShowFooterBtn = false
                        } else if (oneYuanAct.status == 'complete' && oneYuanDrawLog) {
                            oneYuanAct.statusText = '已揭晓'
                            that.oneYuanDrawLog = oneYuanDrawLog
                        } else if ((oneYuanAct.status == 'complete' && oneYuanDrawLog) || /^(not_online|refund)$/.test(oneYuanAct.status)) {
                            if (oneYuanAct.status == 'refund') {
                                oneYuanAct.statusText = '已退款'
                            } else if (oneYuanAct.status == 'not_online') {
                                oneYuanAct.statusText = '已下线'
                            }
                            if (res.onlinePeriod) {
                                that.isActOver = true
                                oneYuanAct.onlinePeriod = res.onlinePeriod
                                oneYuanAct.onlineOneYuanId = res.onlineOneYuanId
                            } else {
                                that.isShowFooterBtn = false
                            }
                        }
                        that.actData = oneYuanAct

                        // 我的号码
                        if (res.myTicketNos && myTicketNos.length > 0) {
                            that.myTicketNos = myTicketNos
                        }

                        // 上期中奖
                        if (lastOneYuanDrawLog) {
                            lastOneYuanDrawLog.info = lastOneYuanDrawLog.userName + lastOneYuanDrawLog.phoneNum.replace(/^(\d{3})\d{4}(\d{4})$/g, '（$1****$2）')
                            that.lastOneYuanDrawLog = lastOneYuanDrawLog
                        }

                        if (that.oneYuanId) { // 查询本期购买记录
                            that.queryPaidRecords()
                        }
                        // 请求分享链接
                        that.$http.get('../api/v2/club/one_yuan/share/url', {params: {oneYuanId: that.oneYuanId}}).then(function (shareRes) {
                            shareRes = shareRes.body
                            if (shareRes.statusCode == 200) {
                                that.shareUrl = shareRes.respData
                            }
                            that.settingShare()
                        }, function () {
                            that.settingShare()
                        })
                        global.loading = false
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                        that.$router.back()
                    }
                }, function () {
                    Util.tipShow(global.loadError)
                    that.$router.back()
                })
            },
            doClickPayBtn () { // 点击购买的确定按钮
                var that = this
                var global = that.global
                if (!that.canPay) {
                    return
                }
                if (that.isInPay) {
                    return Util.tipShow('支付购买中...')
                }
                that.isInPay = true
                global.eventMask = true
                if (that.isBindPhone) {
                    Util.tipShow('支付购买中...')
                    that.doPay()
                } else {
                    Global.execBindPhone(that.phone, that.verifyCode, false).then(function (res) {
                        if (res.statusCode != 200) {
                            global.eventMask = false
                            Util.tipShow(res.msg || '绑定失败，请重新绑定！')
                        } else {
                            Util.tipShow('绑定成功，支付购买中...')
                            that.doPay()
                        }
                    }, function () {
                        global.eventMask = false
                        Util.tipShow('绑定失败，请重新绑定！')
                    })
                }
            },
            doPay () {
                var that = this
                var global = that.global
                var query = global.currPage.query
                that.$http.post('../api/v2/wx/pay/paid_one_yuan', {
                    count: that.timesCount,
                    chanel: query.chanel || 'link',
                    clubId: that.clubId,
                    oneYuanId: that.oneYuanId,
                    openId: global.openId,
                    phoneNum: that.phone,
                    shareCode: query.shareCode || '',
                    topShareCode: query.topShareCode || '',
                    tradeChannel: 'wx',
                    businessChannel: query.chanel || 'link'
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        var oneYuanOrderLog = res.oneYuanOrderLog
                        if (oneYuanOrderLog.amount < parseInt(that.timesCount)) {
                            that.actData.canPaidCount = oneYuanOrderLog.amount
                            that.actData.progress = 100
                            that.timesCount = oneYuanOrderLog.amount == 0 ? 1 : oneYuanOrderLog.amount
                            Util.tipShow('剩余次数小于您所选购的次数，请注意！')
                        }
                        that.oneYuanOrderLog = oneYuanOrderLog
                        that.payRequestObj = JSON.parse(res.tradeReqData)
                        Global.wxJsBridgeReady(() => {
                            that.onBridgeReady()
                        })
                    } else if (res.statusCode == '935801') {
                        that.isInPay = false
                        global.eventMask = false
                        Util.tipShow('OpenId无效，重新授权！')
                        Global.getOauthCode('9358', 'paid-oneYuan', 'base')
                    } else if (res.statusCode == 500) {
                        that.isInPay = false
                        global.eventMask = false
                        Util.tipShow('此次未购买成功！')
                    }
                })
            },
            onBridgeReady () {
                var that = this
                var global = that.global
                var payRequestObj = that.payRequestObj
                WeixinJSBridge.invoke('getBrandWCPayRequest', {
                    appId: payRequestObj.appId,
                    timeStamp: payRequestObj.timeStamp + '',
                    nonceStr: payRequestObj.nonceStr,
                    package: payRequestObj.package,
                    signType: payRequestObj.signType,
                    paySign: payRequestObj.paySign
                }, function (res) {
                    that.isInPay = false
                    global.eventMask = false
                    if (res.err_msg && res.err_msg.indexOf('ok') >= 0) { // 支付成功之后
                        Util.localStorage('tmpOneYuanNums_cache', JSON.stringify({
                            nums: that.oneYuanOrderLog.ticketNo,
                            shareUrl: that.shareUrl,
                            shareImage: that.actData.shareImage,
                            oneYuanId: that.oneYuanId
                        }))
                        Util.tipShow('购买成功！')
                        global.eventMask = false
                        that.timesCount = 1
                        that.isSelectAll = false
                        that.$http.post('../api/v1/scan/code/stat', {
                            clubId: that.clubId,
                            qrcodeId: that.qrcodeId || '',
                            qrcodeType: that.qrcodeType,
                            statType: 'join'  // 活动参与
                        }).then(() => {
                            // res = res.body
                            // console.log(res)
                            that.$router.push({
                                name: 'oneYuanSuccess',
                                query: {oneYuanId: that.oneYuanId, clubId: that.clubId}
                            })
                        })
                    } else {
                        Util.tipShow('未能成功支付！')
                        that.$http.post('../api/v2/club/one_yuan/pay_failure', {oneYuanOrderId: that.oneYuanOrderLog.id})
                    }
                })
            },
            doClickGoOnlineAct () { // 前往正在线的活动
                var that = this
                that.$router.push({name: 'oneYuanDetail', query: {oneYuanId: that.actData.onlineOneYuanId}})
                that.global.loading = true
                that.beforeInit()
                that.clearData()
                that.init()
            },
            doCloseNumPop () {
                this.isShowNumPop = false
            },
            doCloseJoinInfo () {
                this.isJoinInfoPop = false
            },
            doSwitchExpandedMyNum () {
                var that = this
                if (that.myTicketNos.length > 7) {
                    that.isExpandedMyNum = !that.isExpandedMyNum
                }
            },
            doCloseExpandedMyNum () {
                this.isExpandedMyNum = false
            },
            doViewOtherDrawNo () {
                var that = this
                if (that.otherUserNums.length == 0) {
                    that.$http.get('../api/v2/club/one_yuan/user/ticket_no', {
                        params: {
                            userId: that.oneYuanDrawLog.userId,
                            oneYuanId: that.oneYuanId
                        }
                    }).then(function (res) {
                        res = res.body
                        if (res.statusCode == 200) {
                            that.otherUserNums = res.respData.split(',')
                            that.isShowNumPop = true
                        } else {
                            Util.tipShow(res.msg || '查询中奖者号码失败！')
                        }
                    }, function () {
                        Util.tipShow('查询中奖者号码失败！')
                    })
                } else {
                    that.isShowNumPop = true
                }
            },
            doHandlerDrawTime (actData) {
                var that = this
                var plusDate
                var completeTime = new Date(actData.completeTime)
                var drawTime
                var cacheData = Util.localStorage('one_yuan_detail')

                cacheData = cacheData ? JSON.parse(cacheData) : {}
                plusDate = cacheData[that.oneYuanId] || 0
                if (plusDate && (+new Date()) - plusDate < 10 * 60 * 1000) {
                    Util.tipShow('暂未开奖，稍后重新查询')
                    drawTime = new Date(plusDate - 0)
                } else {
                    var todayDrawTime = new Date()
                    if (completeTime - (new Date(Util.dateFormat(todayDrawTime, 'yyyy/MM/dd 21:00:00'))) > 0) {
                        todayDrawTime.setDate(todayDrawTime.getDate() + 1)
                    }
                    drawTime = new Date(Util.dateFormat(todayDrawTime, 'yyyy/MM/dd 21:45:00'))
                }
                actData.drawTime = drawTime
                that.doTimeCounter(drawTime)
            },
            doClickSendCode () {
                var that = this
                if (!that.isTelValid || that.inSendingCode || that.intervalTime < 60) {
                    return
                }
                that.inSendingCode = true
                that.sendCodeText = '重发（60s）'
                that.$http.get('../api/v1/icode', {params: {mobile: that.phone}})
                setTimeout(function sendCode () {
                    that.intervalTime--
                    if (that.intervalTime > 0) {
                        that.sendCodeText = '重发（' + that.intervalTime + 's）'
                        setTimeout(sendCode, 1000)
                    } else {
                        that.intervalTime = 60
                        that.sendCodeText = '发送验证码'
                        that.inSendingCode = false
                    }
                }, 1000)
            },
            doTimeCounter (drawTime) {
                var that = this
                var intervalTime
                var currTime = new Date()
                var hour
                var min
                var sec
                if (drawTime - currTime > 0) {
                    var delt = (drawTime - currTime) / 1000
                    hour = ~~(delt / 3600 % 24)
                    min = ~~(delt / 60 % 60)
                    sec = ~~(delt % 60)
                    if (hour > 0) {
                        that.hour = hour < 10 ? '0' + hour : hour
                        that.min = min < 10 ? '0' + min : min
                        that.isShowHour = true
                    } else {
                        that.min = min < 10 ? '0' + min : min
                        that.sec = sec < 10 ? '0' + sec : sec
                        intervalTime = 1000
                        that.isShowHour = false
                    }
                    setTimeout(function () {
                        that.doTimeCounter(drawTime)
                    }, intervalTime)
                } else {
                    var plusDate = new Date()
                    plusDate.setMinutes(plusDate.getMinutes() + 10)
                    var tmp = {}
                    tmp[that.oneYuanId] = plusDate - 0
                    Util.localStorage('one_yuan_detail', JSON.stringify(tmp))
                    that.init()
                }
            },
            queryPaidRecords () { // 查询本期购买记录
                var that = this
                that.$http.get('../api/v2/club/one_yuan/paid/records', {
                    params: {
                        clubId: that.clubId,
                        oneYuanId: that.oneYuanId,
                        page: 1,
                        pageSize: 3
                    }
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.joinData = res.respData || []
                    } else {
                        Util.tipShow(res.msg || '查询参与记录失败')
                    }
                }, function () {
                    Util.tipShow('查询参与记录失败！')
                })
            },
            doClickSelectAll () {
                var that = this
                if (that.isSelectAll) {
                    that.timesCount = 1
                } else {
                    that.timesCount = that.actData.canPaidCount
                }
                that.isSelectAll = !that.isSelectAll
            },
            doClickShareBtn () {
                eventHub.$emit('change-share-pop', true)
            },
            doClickRobedBtn () { // 点击一元抢按钮
                var that = this
                var global = that.global
                if (!global.userAgent.isWX) {
                    return Util.tipShow('请在微信浏览器中打开！')
                }
                if (!global.isLogin) {
                    return Global.login(that.$router)
                }
                that.isJoinInfoPop = true
            },
            doTouchStartPayCount (type, e) {
                var that = this
                e.preventDefault()
                that.initCountValue()
                if (type == '+') {
                    that.plusValue = 1
                } else {
                    that.plusValue = -1
                }
                that.plusCount()
            },
            doTouchEndPayCount (type, e) {
                var that = this
                e.preventDefault()
                that.initCountValue()
            },
            initCountValue () {
                var that = this
                if (that.countTimer) {
                    clearTimeout(that.countTimer)
                }
                that.countTimer = 0
                that.runCount = 0
                that.plusSpeed = 200
            },
            plusCount () {
                var that = this
                if ((that.plusValue < 0 && that.timesCount == 1) || (that.plusValue > 0 && that.timesCount == that.actData.canPaidCount)) {
                    return that.initCountValue()
                }
                if (that.isSelectAll) {
                    that.isSelectAll = false
                }
                that.runCount++
                that.plusSpeed = that.plusSpeed > 10 ? (that.plusSpeed -= 5) : that.plusSpeed // 使渐变速度越来越快
                that.timesCount = parseInt(that.timesCount) + that.plusValue
                that.countTimer = setTimeout(function () {
                    that.plusCount()
                }, that.plusSpeed)
            },
            settingShare () {
                var that = this
                var global = that.global
                var query = global.currPage.query
                if (!that.shareUrl) {
                    that.shareUrl = global.prefixPathname + '#/' + that.clubId + '/oneYuanDetail?oneYuanId=' + that.oneYuanId + '&chanel=' + query.channel || 'link'
                }
                // 设置分享
                if (global.userAgent.isWX) {
                    Global.shareConfig({
                        title: '夺宝',
                        desc: '我和你只有一块钱的距离，点我立即参与',
                        link: that.shareUrl,
                        imgUrl: that.actData.shareImage,
                        success () {
                            eventHub.$emit('change-share-pop', false)
                        },
                        fail () {
                            Util.tipShow('分享失败！请刷新页面后再试！')
                        }
                    }, 'oneYuanDetail-' + that.oneYuanId)
                }
            }
        }
    }
</script>
