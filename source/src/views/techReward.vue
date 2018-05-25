<style lang="sass">
    @import '../sass/page/techReward.scss';
</style>
<template>
    <div class="page" id="tech-reward-page">
        <div class="header">
            <div class="avatar">
                <div class="img-box"><img :src="avatarUrl"></div>
                <i class="flow"></i></div>
                <p class="num" v-show="serialNo">{{serialNo}}</p>
        </div>
        <div class="section" v-if="moneySwitchOn">
            <div class="title"><p class="money"></p></div>
            <ul class="items">
                <li class="item" v-for="(item, index) in moneySettingList" @click="clickItem(index,'money',item.amountType)">
                    <div class="header" v-if="item.amountType == 0"><img :src="goodUrl" width="60%"></div>
                    <div class="header" v-if="item.amountType == 1">￥<p class="amount">{{ item.amount | MoneyFormatter }}</p></div>
                    <div class="header" v-if="item.amountType == 2"><img :src="moneyUrl" width="60%"></div>
                    <div class="msg">
                        <span v-if="item.amountType == 0">棒棒哒</span>
                        <span v-if="item.amountType == 1" class="text">{{item.description}}</span>
                        <span v-if="item.amountType == 2">其他金额</span>
                    </div>
                </li>
            </ul>
        </div>

        <div class="section" v-if="creditSwitchOn">
            <div class="title"><p class="credit"></p></div>
            <ul class="items">
                <li class="item" v-for="(item, index) in creditSettingList" @click="clickItem(index,'credit')">
                    <div class="header"><img :src="item.imgPath || defaultImageUrl"></div>
                    <div class="msg">{{item.credit}}积分</div>
                </li>
            </ul>
        </div>

        <i class="home" @click="routerTo(true)"></i>

        <div class="confirm-modal pop-modal money" :class="{ active : showCustomMoney }">
            <div class="center-wrap">
                <div class="content">
                    <div class="title-image"></div>
                    <div class="text"></div>
                    <div class="input">
                        <i class="icon-edit"></i>
                        <input type="text" :placeholder="`最多不超过${moneyLimit / 100}元`" maxlength="6" v-model="customMoney" @input="doInputCustomMoney">
                    </div>
                    <div class="close" @click="showCustomMoney = false"><i class="icon-close"></i></div>
                </div>
                <div class="footer single">
                    <button class="submit" @click="submitMoney()">{{submitBtnText}}</button>
                </div>
            </div>
        </div>

        <div class="confirm-modal pop-modal credit" :class="{ active : showCustomCredit }">
            <div class="center-wrap">
                <div class="content">
                    <div class="text-confirm"></div>
                    <div class="credit-image"><img :src="currentCreditList.imgPath" alt=""></div>
                    <div class="credit-amount">{{currentCreditList.credit}}积分</div>
                    <div class="close" @click="showCustomCredit = false"><i class="icon-close"></i></div>
                </div>
                <div class="footer double">
                    <button class="cancel" @click="showCustomCredit = false">取消</button>
                    <button class="submit" @click="creditReward()">确定</button>
                </div>
            </div>
        </div>
        <CreditTip></CreditTip>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import im from '../libs/im'
    import Util from '../libs/util'
    import eventHub from '../libs/hub'
    import MoneyFormatter from '../filters/money-formatter'
    import CreditTip from '../components/credit-tip'

    export default {
        components: {
            CreditTip
        },
        filters: {
            MoneyFormatter
        },
        data () {
            return {
                global: Global.data,
                submitStatusCls: '',
                isTechQrcode: null,
                submitBtnText: '打赏',
                selectType: 'money',
                techInfo: null,
                techId: '',
                techName: '',
                serialNo: '',
                qrcodeId: '',
                qrcodeType: '',
                commentId: '',
                isAnonymous: 'N',
                payAuthCode: '',
                clubId: '',
                currIntegralAccount: 0, // 当前账户积分
                prePayId: '',
                orderId: '',
                backTo: '', // 接下来跳转的地址

                showCustomMoney: false,
                showCustomCredit: false,
                avatarUrl: '',
                defaultImageUrl: './static/images/techReward/default.png',
                goodUrl: './static/images/techReward/good.png',
                moneyUrl: './static/images/techReward/money.png',
                moneySettingList: [],
                creditSettingList: [],
                creditSwitchOn: null,
                creditSystemSwitchOn: null,
                moneySwitchOn: null,
                moneyLimit: 0,
                customMoney: '',
                currentCreditList: []
            }
        },
        created () {
            let that = this
            let global = that.global
            let params = global.currPage.query
            let ss = Util.sessionStorage
            that.qrcodeId = ss('qrcodeId') || ''
            that.qrcodeType = ss('qrcodeType') || ''
            that.techId = params.techId || ''
            that.backTo = params.backTo || ''
            that.orderId = params.orderId || ''
            if (!that.techId) {
                Util.tipShow(global.visitError)
                that.$router.back()
            } else {
                that.commentId = params.commentId
                that.isAnonymous = params.isAnonymous || 'N'
                that.payAuthCode = params.code
                that.clubId = global.clubId
                global.isFollowed = !!(global.isFollowed || Util.localStorage('spa_user_isFollowed') - 0 || false)
                that.init()
            }
        },
        methods: {
            init () {
                let that = this
                let global = that.global

                // 获取技师信息
                that.$http.get('../api/v2/club/technician/{techId}', {
                    params: { techId: that.techId }
                }).then(res => {
                    res = res.body
                    that.techInfo = res.info
                    that.serialNo = res.info.serialNo
                    that.avatarUrl = res.info.avatarUrl || global.defaultHeader
                    that.techInfo.emchatId = res.emchatId
                    that.techInfo.clubName = res.clubName
                    that.clubId = res.info.clubId
                    that.techName = res.info.name
                    global.loading = false

                    // 获取会所打赏设置
                    that.$http.get('../api/v2/user/reward/setting', {
                        params: { clubId: that.clubId }
                    }).then(res => {
                        res = res.body
                        if (res.statusCode == 200) {
                            let data = res.respData
                            that.moneySettingList = data.moneySettingList || []
                            that.creditSettingList = data.creditSettingList || []
                            that.creditSwitchOn = data.creditSwitchOn
                            that.creditSystemSwitchOn = data.creditSystemSwitchOn
                            that.moneySwitchOn = data.moneySwitchOn
                            that.moneyLimit = data.moneyLimit
                        } else {
                            Util.tipShow(res.msg)
                            setTimeout(() => { that.$router.back() }, 1000)
                        }
                    })

                    // 获取当前账户积分
                    Global.getCreditAccount(that.clubId).then(creditRes => {
                        if (creditRes && creditRes[0]) {
                            that.currIntegralAccount = creditRes[0].amount
                        }
                    })

                    // 设置分享
                    if (global.userAgent.isWX) {
                        Global.shareConfig({
                            title: that.techName + '欢迎您',
                            desc: '点我聊聊，更多优惠，更好服务！',
                            link: global.prefixPathname + '#/' + that.clubId + '/technicianDetail?visitChannel=9358&isNeedFollow=true&id=' + that.techId,
                            imgUrl: that.avatarUrl,
                            success: () => {
                                that.$http.post('../api/v1/scan/code/stat', {
                                    clubId: this.clubId,
                                    qrcodeType: that.qrcodeType,
                                    statType: 'share',
                                    techId: that.techId
                                })
                            }
                        }, 'technicianDetail-' + that.techId)
                    }
                })
            },
            clickItem (index, type, code) {
                let that = this
                if (type == 'money') {
                    switch (code) {
                    case 0:
                        Util.tipShow('谢谢惠顾，欢迎下次光临！')
                        setTimeout(() => { that.routerTo(true) }, 1000)
                        break
                    case 1:
                        that.moneyReward(that.moneySettingList[index].amount)
                        break
                    case 2:
                        that.showCustomMoney = true
                        break
                    }
                } else {
                    that.showCustomCredit = true
                    that.currentCreditList = that.creditSettingList[index]
                }
            },
            submitMoney () {
                let that = this
                if (Number(that.customMoney) > that.moneyLimit / 100) {
                    Util.tipShow(`最多打赏${that.moneyLimit / 100}元`)
                    return false
                }
                if (that.customMoney == 0 || !that.customMoney) {
                    Util.tipShow('请输入大于0的金额！')
                    return false
                }
                that.moneyReward(that.customMoney * 100)
            },
            moneyReward (num) {
                let that = this
                let global = that.global
                if (that.submitStatusCls == 'processing') {
                    return Util.tipShow('打赏中，请稍候...')
                }
                if (!global.userAgent.isWX) {
                    return Util.tipShow('请在微信中打开！')
                }
                that.submitStatusCls = 'processing'
                that.submitBtnText = '打赏中...'
                that.$http.post('../api/v2/wx/pay/user_reward', {
                    consumeMoney: num,
                    openId: global.openId,
                    clubId: that.clubId,
                    consumeType: 'user_reward',
                    consumeChanel: 'user_reward',
                    techId: that.techId,
                    prePayId: '',
                    paySessionType: '9358_fw',
                    commentId: that.commentId,
                    isAnonymous: that.isAnonymous
                }).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        let payInfo = JSON.parse(res.respData)
                        that.prePayId = payInfo.package.split('=')[1]
                        Global.wxJsBridgeReady(() => {
                            WeixinJSBridge.invoke('getBrandWCPayRequest', {
                                appId: payInfo.appId,
                                timeStamp: payInfo.timeStamp + '',
                                nonceStr: payInfo.nonceStr,
                                package: payInfo.package,
                                signType: payInfo.signType,
                                paySign: payInfo.paySign
                            }, function (payRes) {
                                that.submitStatusCls = ''
                                that.submitBtnText = '打赏'
                                if (payRes.err_msg.indexOf('ok') >= 0) { // 支付成功之后
                                    that.$http.post('../api/v2/wx/pay/pay_result', { prePayId: that.prePayId }).then(() => {
                                        that.sendMessage(num / 100, 'money')
                                    })
                                    that.$http.post('../api/v1/scan/code/stat', {
                                        clubId: that.clubId,
                                        qrcodeId: that.qrcodeId || '',
                                        qrcodeType: that.qrcodeType,
                                        statType: 'reward',  // 打赏
                                        techId: that.techId
                                    })
                                } else {
                                    Util.tipShow('未能成功支付！')
                                }
                            })
                        })
                    } else if (res.statusCode == 935801) {
                        Global.getOauthCode('9358', 'tech-reward', 'userInfo')
                    } else {
                        that.submitStatusCls = ''
                        that.submitBtnText = '打赏'
                        Util.tipShow(res.msg || '支付失败！')
                    }
                }, function () {
                    that.submitStatusCls = ''
                    that.submitBtnText = '打赏'
                    Util.tipShow('支付失败！')
                })
            },
            creditReward () {
                let that = this
                if (that.submitStatusCls == 'processing') {
                    return Util.tipShow('打赏中，请稍候...')
                }
                let selectGift = that.currentCreditList
                if (selectGift.credit > that.currIntegralAccount) {
                    eventHub.$emit('set-credit-tip', { amount: selectGift.credit, show: true, type: 'gift' })
                } else {
                    that.submitStatusCls = 'processing'
                    that.submitBtnText = '打赏中...'
                    that.$http.get('../api/v2/credit/gift/send', {
                        params: {
                            clubId: that.clubId,
                            emchatId: that.techInfo.emchatId,
                            giftId: selectGift.belongingsId,
                            num: 1
                        }
                    }).then(res => {
                        res = res.body
                        that.submitStatusCls = ''
                        that.submitBtnText = '打赏'
                        if (res.statusCode == 200) {
                            this.$http.post('../api/v1/scan/code/stat', {
                                clubId: that.clubId,
                                qrcodeId: that.qrcodeId || '',
                                qrcodeType: that.qrcodeType,
                                statType: 'reward',  // 打赏
                                techId: that.techId
                            }).then(res => {
                                that.sendMessage(selectGift.credit, 'gift', selectGift.belongingsId, selectGift.rewardName)
                            })
                        } else {
                            Util.tipShow(res.msg || '打赏积分请求失败！')
                        }
                    }, function () {
                        Util.tipShow('打赏积分请求失败！')
                    })
                }
            },
            // 发送打赏消息
            sendMessage (val, type, giftId, giftName) {
                let that = this
                let techInfo = that.techInfo
                Util.tipShow('打赏成功！')
                im.ready().then(() => {
                    if (type == 'money') {
                        im.doSendMoneyRewardMessage({ // 金钱打赏
                            to: techInfo.emchatId,
                            data: {
                                amount: (val - 0).toFixed(2)
                            }
                        })
                    } else {
                        im.doSendGiftRewardMessage({ // 积分礼物打赏
                            to: techInfo.emchatId,
                            data: { giftId: giftId, giftValue: val, giftName: giftName }
                        })
                    }
                })
                that.doBack()
            },
            // 处理跳转逻辑
            doBack (isToHome) {
                let that = this
                let global = that.global
                isToHome = isToHome === true
                // 如果已关注，则正常跳转，否则跳转到引导关注页
                if (global.userAgent.isWX && !global.isFollowed) {
                    that.$http.get('../api/v2/wx/isSubscribed', {
                        params: { openId: global.openId }
                    }).then(res => {
                        res = res.body
                        if (res.statusCode == 200) {
                            global.isFollowed = res.respData.toString() == 'true'
                            if (!global.isFollowed) {
                                that.$router.push({
                                    name: 'follow9358',
                                    query: { techId: that.techId, clubId: that.clubId }
                                })
                            } else {
                                that.routerTo()
                            }
                        } else {
                            that.$router.push({name: 'follow9358', query: { techId: that.techId, clubId: that.clubId }})
                        }
                    }, function () {
                        that.$router.push({name: 'follow9358', query: { techId: that.techId, clubId: that.clubId }})
                    })
                } else {
                    that.routerTo()
                }
            },
            routerTo (tohome) {
                let that = this
                if (tohome) {
                    that.$router.push({path: '/' + that.clubId + '/home'})
                } else {
                    switch (that.backTo) {
                    case 'home':
                        that.$router.push({path: '/' + that.clubId + '/home'})
                        break
                    case 'orderDetail':
                        that.$router.push({name: 'orderDetail', query: {id: that.orderId}})
                        break
                    default:
                        that.$router.back()
                    }
                }
            },
            doInputCustomMoney () {
                var that = this
                var val = that.customMoney
                if (val.length == 1) {
                    if (/\D/.test(val)) {
                        val = ''
                    }
                } else {
                    val = val.replace(/[^\d.]/g, '')
                    var dotIndex = 0
                    val = val.replace(/\./g, function () {
                        if (dotIndex == 0) {
                            dotIndex = arguments[1]
                            return '.'
                        } else {
                            return ''
                        }
                    })
                    if (dotIndex > 0) {
                        val = val.substring(0, dotIndex + 3)
                    }
                }
                if (val) {
                    val = val.substr(0, 6)
                }
                that.customMoney = val
            }
        }
    }
</script>
