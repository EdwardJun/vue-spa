<style lang="sass">
    @import '../sass/components/messageNode.scss';
</style>
<template>
    <div class="messageNode" :class="messageCls" v-if="!msg.isRevoke">
        <span>{{ msg.time | MsgTimeFormatter(true) }}</span>

        <!--点钟券购买消息/优惠券领取消息-->
        <template v-if="type=='paidCouponTip'">
            <span @click="doClickMsgContent('paidCouponTip')">您购买了{{ msg.data.techName }}的{{ msg.data.name }}<a>点击查看</a></span>
        </template>

        <template v-else-if="type == 'couponTip'">
            <span @click="doClickMsgContent('couponTip')">您领取了{{ msg.data.techName }}的{{ msg.data.name }}<a>点击查看</a></span>
        </template>

        <!--撤回消息的提示-->
        <template v-else-if="type=='revert_msg'">
            <span class="revoke">{{ talker.name }}撤回了一条消息</span>
        </template>

        <!--会所位置消息-->
        <template v-else-if="type=='clubLocation'">
            <div :style="{ backgroundImage : 'url('+talker.header+'),url('+global.defaultHeader+')' }" @click="doClickTechHeader(talker.id)"></div>
            <div class='map-loc-content' @click='doClickMapLoc()'>
                <div>{{ loc.clubName }}</div>
                <div>{{ loc.address }}</div>
                <div :style="{ 'background-image': 'url(' + loc.staticMap + ')' }"></div>
            </div>
        </template>

        <!--活动消息：限时抢/转盘抽奖/电子期刊/特惠商城/邀请有礼-->
        <template v-else-if="/(timeLimit|groupBuy|luckyWheel|journal|itemCard|inviteGift)/.test(type)">
            <div :style="{ backgroundImage : 'url('+talker.header+'),url('+global.defaultHeader+')' }" @click="doClickTechHeader(talker.id)"></div>
            <div :class="type=='itemCard' ? msg.data.cardType : type" @click="doClickActMsg()">
                <div>
                    <div></div>
                    <div><div>{{ msg.data.title }}</div><div>{{ msg.data.desc }}</div></div>
                </div>
            </div>
        </template>

        <!--积分礼物消息-->
        <template v-else-if="type=='gift'">
            <div :style="{ backgroundImage : 'url('+header+'),url('+global.defaultHeader+')' }"></div>
            <div :class="contentCls"><img :src="giftImg"/></div>
        </template>

        <!--客服预约消息-->
        <template v-else-if="/order_/.test(type)">
            <div :style="{ backgroundImage : 'url('+( messageCls=='right' ? header : talker.header )+'),url('+global.defaultHeader+')' }" @click="doClickTechHeader(messageCls=='right' ? '' : talker.id)"></div>
            <div :class="contentCls">
                <template v-if="type=='order_request'"><!--求预约消息-->
                    <div @click="doOrderRequest()">选项目、约技师，<br/>线上预约，方便快捷~<div></div></div>
                </template>
                <template v-else>
                    <div>{{ serviceOrder.title }}</div>
                    <template v-if="/^(order_start|order_refuse)$/.test(type)"><div>到店时间：<span>{{ serviceOrder.serviceTimeStr || '待定' }}</span></div></template>
                    <template v-else>
                        <div>到店时间：<span>{{ serviceOrder.serviceTimeStr || '待定' }}</span></div>
                        <div>预约项目：<span>{{ serviceOrder.serviceName || '到店选择' }}</span></div>
                        <div>预约技师：<span>{{ serviceOrder.techName || '到店选择' }}</span></div>
                        <div v-if="/^(order_confirm|order_success)$/.test(type) && serviceOrder.orderPayMoney" class="order-money">预约金额：<span>¥ {{ serviceOrder.orderPayMoney | MoneyFormatter }}</span></div>
                        <div v-if="type=='order_confirm' && serviceOrder.orderPayMoney" class="wx-pay-btn" @click="doPayOrder" :class="{ hasPay: serviceOrder.hasPay || hasPayedOrder }">{{ (serviceOrder.hasPay || hasPayedOrder) ? '已支付' : '微信支付'}}</div>
                    </template>
                </template>
            </div>
        </template>

        <!--普通文本消息/图片/语音消息-->
        <template v-else>
            <div :style="{ backgroundImage : 'url('+( messageCls=='right' ? header : talker.header )+'),url('+global.defaultHeader+')' }" @click="doClickTechHeader(messageCls=='right' ? '' : talker.id)"></div>
            <div v-if="type=='text'" :class="contentCls" v-html="msgData" @click="doClickMsgContent(contentCls)"></div>
            <div v-else-if="type=='requestReward'" :class="contentCls" @click="doClickMsgContent('begReward')">万水千山总是情<br/>打赏两个行不行~</div>
            <div v-else-if="type=='reward'" :class="contentCls"><i></i>打赏<span>{{ msg.data.amount }}</span>元</div>
            <div v-else-if="type=='image'" :class="contentCls" @click='doClickPicInMessage(msg.data.url)'><img :src="msg.data.url" ref="img"/></div>
            <div v-else-if="type=='voice'" :class="contentCls" @click='doClickAudioMessage'>
                <audio ref='voice' @ended="doVoiceEnded" :src="msg.data.url"></audio>
                <span v-show='msg.data.duration'>{{ msg.data.duration }}"</span>
                <div v-if="!readStatus && !msg.readStatus"></div>
            </div>
            <div v-else-if="type=='order'" :class="contentCls">
                <span>{{ msg.data.orderStatus == 'refuse' ?  '拒绝' : ( msg.data.orderStatus == 'accept' ? '接受' : '发起' ) }}预约</span><br>到店时间：<b>{{ msg.data.appointTime }}</b><br>预约项目：<b>{{ msg.data.serviceItemName }}</b>
            </div>
            <div v-else-if="type=='paidCoupon'" class="paidCoupon" @click="doClickMsgContent('paidCoupon')"><i>求点钟</i>立减<span>{{ msg.data.discountValue }}</span>元<b>{{ msg.data.validPeriod }}</b></div>
            <div v-else-if="type=='ordinaryCoupon'" class="ordinaryCoupon" @click="doClickMsgContent('ordinaryCoupon')"><i>{{ msg.data.typeName }}</i><span>{{ msg.data.couponName }}</span><b>{{ msg.data.validPeriod }}</b></div>
        </template>
    </div>
</template>
<script>
    import Util from '../libs/util'
    import Global from '../libs/global'
    import im from '../libs/im'
    import eventHub from '../libs/hub'
    import MoneyFormatter from '../filters/money-formatter'
    import MsgTimeFormatter from '../filters/msg-time-formatter'

    export default {
        filters: {
            MsgTimeFormatter, MoneyFormatter
        },
        data () {
            return {
                global: Global.data,
                defaultGiftImg: './static/images/gift_default.png', // 默认的积分礼物图片
                inProcessing: false,
                inPayProcessing: false,
                payRequestObj: null,
                hasPayedOrder: false,
                imgSize: { w: 0, h: 0 },
                audioState: 2, // 音频的状态
                readStatus: false
            }
        },
        computed: {
            header () {
                return im.header
            },
            talker () {
                return this.$store.state.talker
            },
            type () { // 消息类型
                return this.msg.type
            },
            messageCls () {
                let that = this
                let msg = that.msg
                let type = msg.type
                if (type == 'paidCouponTip' || type == 'couponTip' || type == 'revert_msg') {
                    return 'center ' + type
                } else if (/^(timeLimit|groupBuy|luckyWheel|journal|itemCard|inviteGift)$/.test(type)) {
                    return 'left activity'
                } else if (type == 'clubLocation') {
                    return 'left map-loc'
                } else if (type == 'gift') {
                    return 'right gift'
                } else {
                    return msg.isSend ? 'right' : 'left'
                }
            },
            contentCls () {
                let that = this
                let msg = that.msg
                let type = msg.type
                let statusCls = msg.sendStatus ? 'success' : ''
                if (type != 'paidCouponTip' && type != 'couponTip') {
                    if (type == 'gift') {
                        return statusCls
                    } else if (/order_/.test(type)) {
                        return type + ' ' + statusCls
                    } else {
                        statusCls = (that.messageCls == 'right' && msg.sendStatus) ? 'success' : ''
                        if (type == 'text') {
                            return (type ? type + ' ' : '') + statusCls
                        } else if (type == 'image') {
                            return 'img ' + statusCls
                        } else if (type == 'voice') {
                            return 'audio ' + statusCls
                        } else if (type == 'reward') {
                            return 'reward ' + statusCls
                        } else if (type == 'requestReward') {
                            return 'begReward ' + statusCls
                        } else if (type == 'order') {
                            return 'order ' + statusCls
                        }
                    }
                }
            },
            msgData () {
                let that = this
                let msg = that.msg
                return that.type == 'text' ? im.decodeExpressionToImg(msg.data) : msg.data
            },
            giftImg () {
                let that = this
                let msgData = that.msg.data
                if (that.type == 'gift') {
                    let giftImg = that.giftMapData[msgData.giftId]
                    return giftImg ? (giftImg.url || that.defaultGiftImg) : that.defaultGiftImg
                }
            },
            // 地址消息对象
            loc () {
                let that = this
                let msgData = that.msg.data
                if (that.msg.type == 'clubLocation') {
                    return {
                        clubName: that.$store.state.talker.clubName,
                        lat: msgData.lat,
                        lng: msgData.lng,
                        address: msgData.address,
                        staticMap: msgData.staticMap
                    }
                }
            },
            // 客服消息数据字段
            serviceOrder () {
                let that = this
                let type = that.type
                let serviceMsgTitle = {
                    order_start: '发起预约',
                    order_refuse: '拒绝预约',
                    order_cancel: '取消预约',
                    order_confirm: '请您确认信息',
                    order_success: '预约成功'
                }
                if (/order_/.test(type) && type != 'order_request') {
                    let serviceTimeStr = null
                    let dataObj = that.msg.data
                    let serviceTime = dataObj.orderServiceTime
                    if (serviceTime) {
                        serviceTimeStr = Util.dateFormat(new Date(serviceTime - 0), 'MM月dd日 hh:mm')
                    }
                    if (dataObj.orderPayMoney && type == 'order_confirm') {
                        serviceMsgTitle.order_confirm = '请您付款'
                    }
                    return {
                        title: serviceMsgTitle[type],
                        techId: dataObj.orderTechId,
                        techName: dataObj.orderTechName,
                        techAvatar: dataObj.orderTechAvatar,
                        serviceId: dataObj.orderServiceId,
                        serviceName: dataObj.orderServiceName,
                        serviceTime: dataObj.orderServiceTime,
                        serviceTimeStr: serviceTimeStr,
                        servicePrice: dataObj.orderServicePrice || 0,
                        customerName: dataObj.orderCustomerName || '',
                        customerPhone: dataObj.orderCustomerPhone || '',
                        serviceDuration: dataObj.orderServiceDuration - 0,
                        orderId: dataObj.orderId || '',
                        orderPayMoney: dataObj.orderPayMoney || 0,
                        hasPay: dataObj.hasPay || false
                    }
                }
            }
        },
        props: {
            msg: {  // 消息
                type: Object,
                required: true
            },
            giftMapData: {
                type: Object,
                required: true
            },
            creditConfig: {
                type: Object,
                required: true
            }
        },
        mounted () {
            let that = this
            that.$nextTick(() => {
                if (that.type == 'voice') {
                    if (that.$refs.voice) {
                        eventHub.$on('stop-other-voice', that.doHandlerStopVoice) // 监听事件
                    }
                    if (im.category == 'h') { // 如果是环信，需要调用API加载音频
                        that.loadVoice()
                    }
                    that.readStatus = that.msg.readStatus
                }
                // } else if (that.type == 'image') {
                //     that.getImageSize(that.msg.data.width, that.msg.data.height)
                // }
            })
        },
        methods: {
            // 点击技师头像的处理
            doClickTechHeader (id) {
                let that = this
                let talker = that.talker
                if (talker.userId && id && talker.id == id && talker.type != 'servicer' && talker.type != 'manager') {
                    that.$router.push({ name: 'technicianDetail', query: { id: talker.userId } })
                }
            },
            // doImgLoad (e) {
            //     let that = this
            //     let img = that.$refs.img
            //     if (img) {
            //         let cimg = new Image() // 重新加载图片，获取正确的尺寸
            //         cimg.onload = function () {
            //             that.getImageSize(this.width, this.height)
            //         }
            //         cimg.src = img.src
            //     }
            // },
            // getImageSize (originW, originH) {
            //     let that = this
            //     let global = that.global
            //     let w = originW / (16 * global.winScale)
            //     let h = originH / (16 * global.winScale)
            //     let ratio
            //     if (!(w < 10 && h < 9)) {
            //         w = originW / 10
            //         h = originH / 9
            //         ratio = w > h ? w : h
            //         w = originW / ratio
            //         h = originH / ratio
            //     }
            //     that.imgSize.w = w
            //     that.imgSize.h = h
            // },
            doClickMsgContent (cls) {
                let that = this
                let router = that.$router
                let msg = that.msg
                if (/begReward/.test(cls)) { // 点击求打赏消息，跳转到打赏页面
                    eventHub.$emit('goto-reward-tech')
                } else if (/couponTip/.test(cls)) {
                    router.push({ name: 'coupon' })
                } else if (/paidCouponTip/.test(cls)) {
                    router.push({ name: 'oClockCoupon' })
                } else if (/ordinaryCoupon/.test(cls)) {
                    if (!that.global.userTel) {
                        eventHub.$emit('pop-bind-phone')
                    } else {
                        router.push({ name: 'coupon' })
                    }
                    // router.push({ name: 'couponDetail', query: { userActId: msg.userActId } })
                } else if (/paidCoupon/.test(cls)) { // 点钟券
                    if (!that.global.userTel) {
                        Global.bindTelPhone()  // 提示绑定
                    } else {
                        router.push({
                            name: 'paidCoupon', query: { actId: msg.data.actId, techCode: msg.data.techCode, chanel: 'link' }
                        })
                    }
                }
            },
            // 点击活动消息，跳转到对应的活动页面
            doClickActMsg () {
                let that = this
                let type = that.type
                let msgData = that.msg.data
                let actId = msgData.actId
                let talker = that.talker
                let clubId = talker.clubId
                let router = that.$router
                if (!actId && type != 'inviteGift') {
                    return Util.tipShow('缺少活动ID！')
                }
                if (type == 'journal') { // 电子期刊
                    location.href = that.global.prefixPathname.replace('/spa/', '/journal/') + '#/' + (msgData.templateId) + '/?id=' + actId + (talker.type == 'tech' ? '&techId=' + talker.userId : '')
                } else if (type == 'inviteGift') { // 邀请有礼
                    router.push({ path: '/' + clubId + '/inviteActivity' })
                } else if (type == 'itemCard') { // 特惠商城
                    let cardType = msgData.cardType
                    if (cardType == 'item_card') { // 单项次卡
                        router.push({ name: 'itemCardDetail', query: { id: actId, clubId: clubId, techId: talker.type == 'tech' ? talker.userId : '' } })
                    } else { // 套餐/积分
                        router.push({ name: 'itemPackageDetail', query: { id: actId, type: cardType, clubId: clubId, techId: talker.type == 'tech' ? talker.userId : '' } })
                    }
                } else if (type == 'timeLimit') { // 限时抢
                    router.push({ path: 'robProjectDetail', query: { robProjectId: actId, clubId: clubId, techId: talker.userId || '' } })
                } else if (type == 'groupBuy') { // 拼团
                    router.push({ name: 'groupBuyActDetail', query: { id: actId, clubId: clubId, techId: talker.userId || '' } })
                } else if (type == 'luckyWheel') { // 转盘抽奖
                    router.push({ name: 'luckyWheel', query: { actId: actId, clubId: clubId } })
                }
            },
            // 点击地图消息,跳转到腾讯地图的导航
            doClickMapLoc () {
                let that = this
                let locObj = that.loc
                location.href = 'http://apis.map.qq.com/tools/routeplan/eword=' + locObj.clubName + '&epointx=' + locObj.lat + '&epointy=' + locObj.lng + '?referer=clubmap&key=OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77'
            },
            // 点击消息里面的图片
            doClickPicInMessage (picUrl) {
                eventHub.$emit('show-chat-pictures', picUrl)
            },
            // 加载音频
            loadVoice () {
                let that = this
                let voice = that.$refs.voice
                let options = { url: that.msg.data.url }
                let conn = im.conn
                options.onFileDownloadComplete = function (response) {
                    if (voice) {
                        voice.src = WebIM.utils.parseDownloadResponse.call(conn, response)
                    }
                }
                options.headers = { 'Accept': 'audio/mp3' } // 通知服务器将音频转为mp3
                WebIM.utils.download.call(conn, options)
            },
            // 点击语音消息的处理
            doClickAudioMessage () {
                let that = this
                let voice = that.$refs.voice
                if (voice) {
                    let pNode = voice.parentNode
                    if (pNode.classList.contains('playing')) { // 正在播放的状态，暂停之
                        voice.pause()
                        voice.currentTime = 0
                        pNode.classList.remove('playing')
                    } else { // 播放之
                        eventHub.$emit('stop-other-voice', that.msg.data.url)
                        voice.play()
                        pNode.classList.add('playing')
                        if (!that.readStatus) {
                            that.readStatus = true
                            im.updateMessageReadStatus(that.msg.msgId, that.talker.id, true)
                        }
                    }
                }
                // if (that.audioState == 0) { // 尚未下载
                //     let count = 20
                //     let waitTimer = setInterval(() => { // wait
                //         count--
                //         if (count == 0 && that.audioState == 0) {
                //             that.audioState = 1
                //         }
                //         if (that.audioState != 0) {
                //             clearInterval(waitTimer)
                //             that.doClickAudioMessage()
                //         }
                //     }, 300)
                // } else if (that.audioState == 1) {
                //     Util.tipShow('未能下载语音！')
                // } else {
                //     let voice = that.$refs.voice
                //     if (voice) {
                //         let pNode = voice.parentNode
                //         if (pNode.classList.contains('playing')) { // 正在播放的状态，暂停之
                //             voice.pause()
                //             voice.currentTime = 0
                //             pNode.classList.remove('playing')
                //         } else { // 播放之
                //             eventHub.$emit('stop-other-voice', that.msg.data.url)
                //             voice.play()
                //             pNode.classList.add('playing')
                //             if (!that.readStatus) {
                //                 that.readStatus = true
                //                 im.updateMessageReadStatus(that.msg.msgId, that.talker.id, true)
                //             }
                //         }
                //     }
                // }
            },
            // 语音播放完毕，回到初始状态
            doVoiceEnded () {
                let that = this
                let voice = that.$refs.voice
                if (voice) {
                    let pNode = voice.parentNode
                    voice.pause()
                    voice.currentTime = 0
                    pNode.classList.remove('playing')
                }
            },
            doHandlerStopVoice (url) {
                let that = this
                if (that.msg.url != url) {
                    that.doVoiceEnded()
                }
            },
            // 点击求预约里面的“点我预约”按钮
            doOrderRequest () {
                let that = this
                console.log(11111111)
                let talker = that.talker
                if (talker.type == 'tech') {
                    that.$router.push({ name: 'confirmOrder', query: { techId: talker.userId, itemId: '', clubId: talker.clubId } })
                } else {
                    eventHub.$emit('change-order-time-pop', true)
                }
            },
            // 点击支付订单
            doPayOrder () {
                let that = this
                let global = that.global
                if (that.serviceOrder.hasPay) {
                    return
                }
                if (!global.userAgent.isWX) {
                    return Util.tipShow('请您登录小摩豆公众号进行支付！')
                }
                if (that.inPayProcessing) {
                    return Util.tipShow('正在支付，请稍候！')
                }
                that.doHandlerPayOrder()
            },
            // 支付订单处理
            doHandlerPayOrder () {
                let that = this
                let order = that.serviceOrder
                that.inPayProcessing = true
                that.$http.post('../api/v2/wx/pay/payment/pay_immediate', {
                    bizType: 'paid_order',
                    clubId: that.talker.clubId,
                    orderId: order.orderId
                }).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.payRequestObj = JSON.parse(res.respData)
                        Global.wxJsBridgeReady(() => {
                            that.onBridgeReady()
                        })
                    } else if (res.statusCode == 935801) {
                        Global.getOauthCode('', '9358', 'servicer-order-pay', 'base')
                    } else {
                        that.inPayProcessing = false
                        Util.tipShow(res.msg || '支付失败！')
                        if (res.respData == 'PHONE_NOT_EXISTS') { // 需要绑定手机
                            Global.bindTelPhone()
                        }
                    }
                }, function () {
                    that.inPayProcessing = false
                    Util.tipShow('支付请求失败！')
                })
            },
            /**
             * 微信 bridge ready
             * @return
             */
            onBridgeReady () {
                let that = this
                let payRequestObj = that.payRequestObj
                WeixinJSBridge.invoke(
                        'getBrandWCPayRequest', {
                            appId: payRequestObj.appId,
                            timeStamp: payRequestObj.timeStamp + '',
                            nonceStr: payRequestObj.nonceStr,
                            package: payRequestObj.package,
                            signType: payRequestObj.signType,
                            paySign: payRequestObj.paySign
                        },
                        function (res) {
                            that.inPayProcessing = false
                            if (res.err_msg && res.err_msg.indexOf('ok') >= 0) { // 支付成功之后
                                Util.tipShow('支付成功！')
                                that.serviceOrder.hasPay = true
                                that.hasPayedOrder = true

                                // 更新消息列表中的消息
                                let talkerId = that.talker.id
                                let serviceOrder = that.serviceOrder
                                im.changeOrderMessagePayStatus(talkerId, serviceOrder.orderId, true)
                                im.doSendOrderSuccessMessage({  // 发送预约成功的消息给客服
                                    to: talkerId,
                                    tag: 'customer_service',
                                    data: {
                                        orderTechId: serviceOrder.techId,
                                        orderTechName: serviceOrder.techName,
                                        orderTechAvatar: serviceOrder.techAvatar,
                                        orderServiceId: serviceOrder.serviceId,
                                        orderServiceName: serviceOrder.serviceName,
                                        orderServiceTime: serviceOrder.serviceTime - 0,
                                        orderServiceDuration: serviceOrder.serviceDuration - 0,
                                        orderServicePrice: serviceOrder.servicePrice || 0,
                                        orderCustomerName: serviceOrder.customerName || '',
                                        orderCustomerPhone: serviceOrder.customerPhone || '',
                                        orderId: serviceOrder.orderId,
                                        orderPayMoney: serviceOrder.orderPayMoney,
                                        xmd_tag: 'customer_service'
                                    }
                                })
                            } else {
                                Util.tipShow('未能成功支付！')
                            }
                        })
            }
        },
        beforeDestroy () {
            let that = this
            if (that.type == 'audio') {
                eventHub.$off('stop-other-voice', that.doHandlerStopVoice)
            }
        }
    }
</script>
