/* 环信即时通讯的实现 */
import './h.webim.config'
import './h.websdk'
import Util from './util'
import ActMessageTitle from './act-message-title'
import ExpressionCode from './expression'

// 解码表情的正则表达式
const DecodeExpressionReg = new RegExp('/::[A-Zab]+', 'g')
window._webim = WebIM

export default {
    id: '', // 聊天ID
    token: '', // password
    name: '',
    userId: '',
    avatar: '',
    header: '',
    apiUrl: location.protocol + '//a1.easemob.com',
    xmppUrl: 'im-api.easemob.com',
    https: /https/.test(location.protocol),
    conn: null,
    appKey: 'xiaomodo#spa' + (/(spa.93wifi.com|sdcm165.stonebean.com|sdcm166.stonebean.com)/.test(location.hostname) ? '' : 'test'), // 环信AppKey
    init (options) {
        let that = this
        let imInstance = options.imInstance
        that.id = imInstance.id
        that.token = imInstance.token
        that.name = imInstance.name
        that.userId = imInstance.userId
        that.avatar = imInstance.avatar || ''
        that.header = imInstance.header
        /* eslint-disable */
        let conn = new WebIM.connection({
            https: that.https,
            url: that.xmppUrl,
            apiUrl: that.apiUrl,
            isMultiLoginSessions: true  // 开启多页面同步收消息
        })
        // 监听消息的推送处理
        conn.listen({
            onOpened () { // 连接打开事件
                options.onConnNotify.call(imInstance, 1)
            },
            onTextMessage (msg) { // 文本消息
                options.onMsgNotify.call(imInstance, { msg, type: 'text' })
            },
            onPictureMessage (msg) { // 图片消息
                options.onMsgNotify.call(imInstance, { msg, type: 'image' })
            },
            onAudioMessage (msg) { // 语言消息
                options.onMsgNotify.call(imInstance, { msg, type: 'voice' })
            },
            onCmdMessage (msg) { // 命令消息
                options.onMsgNotify.call(imInstance, { msg, type: 'cmd' })
            },
            onOnline () {
                options.onConnNotify.call(imInstance, 1)
            },
            onOffline () {
                console.log('h webim on offline')
                options.onConnNotify.call(imInstance, 2)
            },
            onError (e) {
                console.log('h webim error：', e)
            },
            onClosed () {
                console.log('h webim closed')
                options.onConnNotify.call(imInstance, 0)
            }
        })
        that.conn = conn
        // 登录逻辑
        let loginId = that.id
        conn.open({
            user: loginId,
            pwd: loginId,
            appKey: that.appKey,
            success () {
                console.log(loginId + ' conn success')
                options.loginSuccess()
            },
            error () {
                console.log(loginId + ' conn error')
            }
        })
        return conn
    },
    getConnStatus (statusCode) {
        return statusCode
    },
    // 接收消息的处理
    onMsgNotify (notifyObj) {
        let that = this
        let rawMsg = notifyObj.msg
        let notifyType = notifyObj.type
        let recentMsg = ''
        let msg = {}
        let notifyRes = null
        let ext = rawMsg.ext
        let msgType
        if (notifyType == 'text') {
            msgType = ext.msgType || 'text'
            if (msgType == 'TXT') {
                msgType = 'text'
            } else if (msgType == 'begReward') {
                msgType = 'requestReward'
            }
            if (msgType == 'text') { // 文本消息
                msg.data = rawMsg.data
                recentMsg = that.decodeExpression(msg.data)
            } else if (msgType == 'clubLocation') { // 会所位置消息
                recentMsg = '[位置]'
                msg.data = { address: ext.address, lat: ext.lat, lng: ext.lng, staticMap: ext.staticMap }
            } else if (msgType == 'requestReward') { // 求打赏消息
                recentMsg = '万水千山总是情，打赏两个行不行~'
                msg.data = ''
            } else if (msgType == 'journal') { // 电子期刊
                msg.data = {
                    actId: ext.actId, actName: ext.actName, templateId: ext.templateId, title: ext.actName || ActMessageTitle.journal.title, desc: ActMessageTitle.journal.desc
                }
                recentMsg = '[电子期刊]'
            } else if (msgType == 'inviteGift') { // 邀请有礼
                msg.data = {
                    actId: ext.actId, actName: ext.actName, templateId: ext.templateId, title: ActMessageTitle.inviteGift.title, desc: ActMessageTitle.inviteGift.desc
                }
                recentMsg = '[邀请有礼活动]'
            } else if (msgType == 'itemCard') { // 特惠商城
                let cardType = ext.cardType
                recentMsg = '[' + ActMessageTitle.itemCard[cardType].title + ']'
                msg.data = {
                    actId: ext.actId, actName: ext.actName, cardType: cardType, title: ext.actName || ActMessageTitle.itemCard[cardType].title, desc: ActMessageTitle.itemCard[cardType].desc
                }
            } else if (msgType == 'luckyWheel') { // 转盘抽奖
                recentMsg = '[转盘抽奖]'
                let splitArr = rawMsg.data.split(':')
                if (splitArr.length == 2) {
                    ext.actName = splitArr[0]
                }
                msg.data = {
                    actId: ext.actId, actName: ext.actName, title: ext.actName || ActMessageTitle.luckyWheel.title, desc: ActMessageTitle.luckyWheel.desc
                }
            } else if (msgType == 'groupBuy') { // 拼团消息
                recentMsg = '[拼团活动]'
                msg.data = {
                    actId: ext.actId, actName: ext.actName, title: ext.actName || ActMessageTitle.groupBuy.title, desc: ActMessageTitle.groupBuy.desc
                }
            } else if (msgType == 'timeLimit') { // 限时抢
                recentMsg = '[限时抢活动]'
                let splitArr = rawMsg.data.split(':')
                if (splitArr.length == 2) {
                    ext.actName = splitArr[0]
                }
                msg.data = {
                    actId: ext.actId, actName: ext.actName, title: ext.actName || ActMessageTitle.timeLimit.title, desc: ActMessageTitle.timeLimit.desc
                }
            } else if (msgType == 'order_request') { // 求预约
                recentMsg = '选项目、约技师，线上预约，方便快捷~'
                msg.data = ''
            } else if (msgType == 'paidCoupon') { // 点钟券
                let str = rawMsg.data
                let discountValue = str.match(/<span>(\S*)<\/span>/)[1]
                recentMsg = '[点钟券]立减' + discountValue + '元'
                msg.data = { actId: ext.actId, techCode: ext.techCode, discountValue: discountValue, validPeriod: str.match(/<b>(\S*)<\/b>/)[1] }
            } else if (msgType == 'ordinaryCoupon') { // 优惠券
                let str = rawMsg.data
                let typeName = str.match(/<i>(\S*)<\/i>/)[1]
                let couponName = str.match(/<span>(\S*)<\/span>/)[1] + str.match(/<\/span>(\S*)<b>/)[1]
                let validPeriod = str.match(/<b>(\S*)<\/b>/)[1]
                recentMsg = '[' + typeName + ']' + couponName
                msg.data = { actId: ext.actId, techCode: ext.techCode, typeName: typeName, couponName: couponName, validPeriod: validPeriod }
            } else if (/order_/.test(msgType)) { // 客服预约消息
                msg.data = {
                    orderTechId: ext.orderTechId || '',
                    orderTechName: ext.orderTechName || '',
                    orderTechAvatar: ext.orderTechAvatar || '',
                    orderServiceId: ext.orderServiceId || '',
                    orderServiceName: ext.orderServiceName || '',
                    orderServiceTime: ext.orderServiceTime || '',
                    orderServiceDuration: ext.orderServiceDuration || 0,
                    xmd_tag: ext.xmd_tag || ''
                }
                if (/^(order_confirm|order_success)$/.test(msgType)) {
                    msg.data.orderId = ext.orderId
                    msg.data.orderPayMoney = ext.orderPayMoney || 0
                }
                if (msgType == 'order_confirm') { // 订单确认
                    recentMsg = '[预约确认]'
                } else if (msgType == 'order_cancel') { // 取消预约
                    recentMsg = '[预约取消]'
                } else if (msgType == 'order_refuse') { // 拒绝预约
                    recentMsg = '[拒绝预约]'
                } else if (msgType == 'order_success') { // 预约成功
                    recentMsg = '[预约成功]'
                }
            } else if (msgType == 'order') { // 普通预约消息
                let orderStatus
                let strArr = rawMsg.data.split('<br>')
                if (/接受预约/.test(strArr[0])) {
                    recentMsg = '[接受预约]'
                    orderStatus = 'accept'
                } else {
                    recentMsg = '[拒绝预约]'
                    orderStatus = 'refuse'
                }
                msg.data = { orderStatus: orderStatus, appointTime: strArr[1].slice(8, -4), serviceItemName: strArr[2].slice(8, -4) }
            }
        } else if (notifyType == 'image') { // 图片消息
            msg.data = {
                url: rawMsg.url, width: rawMsg.width, height: rawMsg.height
            }
            recentMsg = '[图片]'
            msgType = 'image'
        } else if (notifyType == 'voice') { // 语音消息
            msg.data = { duration: rawMsg.length, url: rawMsg.url }
            recentMsg = '[语音]'
            msgType = 'voice'
        } else if (notifyType == 'cmd') { // 操作
            if (ext.mark == 'revoke') {
                msg.data = ext.messageId
                recentMsg = '撤回了一条消息'
                msgType = 'revert_msg'
            }
        }

        // 构造返回的对象
        if (recentMsg) {
            notifyRes = {
                msgType,
                recentMsg,
                msg,
                clubId: ext.clubId,
                name: ext.techId ? ext.name : ext.clubName,
                avatar: ext.avatar,
                header: ext.header,
                receiveObj: { time: Math.round(ext.time / 1000), chatId: rawMsg.from, desc: recentMsg, data: msg.data, msgId: rawMsg.id }
            }
        }
        return notifyRes ? [notifyRes] : []
    },
    // 解析文本消息中的表情
    decodeExpression (messageString) {
        return messageString.replace(DecodeExpressionReg, function () {
            return ExpressionCode[arguments[0]] || arguments[0]
        })
    },
    checkMaxLength (content) {
        let maxLen = 1000
        if (content.length > maxLen) {
            Util.tipShow('消息长度超出限制(最多' + maxLen + '个字符)')
            return false
        }
        return true
    },
    doSendCommonMessage (options, msgType, msgDescText, msgContent, errorCallback) {
        // console.log('send common message：', options)
        let that = this
        let msgId = that.conn.getUniqueId()
        let sendTime = (+new Date())
        let extObj = {
            name: that.name,
            header: that.header,
            avatar: that.avatar,
            time: sendTime,
            userId: that.userId,
            userRoles: 'user'
        }
        let msgObjForStore = {
            chatId: options.to,
            data: options.data,
            desc: msgDescText,
            isRevoke: false,
            isSend: true,
            msgId: msgId,
            time: Math.round(sendTime / 1000),
            type: msgType,
            sendStatus: true // 默认为true
        }
        /*eslint-disable*/
        let sendMessage = new WebIM.message('txt', msgId)
        let messageStr = ''
        let optionsData = options.data

        if (msgType == 'text') { // 文本消息
            messageStr = optionsData
        } else if (msgType == 'reward') { // 金钱打赏的消息
            messageStr = '<i></i>打赏：<span>' + optionsData.amount + '</span>元'
            extObj.msgType = msgType
        } else if (msgType == 'gift') { // 积分礼物
            messageStr = '[礼物：' + 'giftName' + ']'
            extObj.msgType = msgType
            extObj.giftValue =  optionsData.giftValue
            extObj.giftName = optionsData.giftName
            extObj.giftId = optionsData.giftId
        } else if (msgType == 'paidCouponTip') { // 购买点钟券提醒消息
            messageStr = optionsData.name + '&' + optionsData.id
            extObj.msgType = msgType
        } else if (msgType == 'couponTip') { // 优惠券领取消息
            extObj.msgType = msgType
            messageStr = optionsData.name
        } else if (msgType == 'order') { // 预约消息
            extObj.msgType = msgType
            extObj.orderId = optionsData.orderId
            messageStr = '<span>发起预约</span><br>到店时间：<b>' + optionsData.appointTime + '</b><br>' + '预约项目：<b>' + optionsData.serviceItemName + '</b>'
        } else if (msgType == 'order_start' || msgType == 'order_success') { // 客服预约消息
            if (msgType == 'order_start') {
                if (optionsData.orderServiceTime == 0) {
                    messageStr = '客服预约'
                } else {
                    messageStr = '客服预约(时间：' + Util.dateFormat(new Date(optionsData.orderServiceTime)) + ')'
                }
            } else {
                messageStr = '预约成功'
            }
            extObj.msgType = msgType
            extObj.orderTechId = optionsData.orderTechId
            extObj.orderTechName = optionsData.orderTechName
            extObj.orderTechAvatar = optionsData.orderTechAvatar
            extObj.orderServiceId = optionsData.orderServiceId
            extObj.orderServiceName = optionsData.orderServiceName
            extObj.orderServiceTime = optionsData.orderServiceTime
            extObj.orderServiceDuration = optionsData.orderServiceDuration
            extObj.orderAppointType = optionsData.orderAppointType
            extObj.orderId = optionsData.orderId || ''
            extObj.orderPayMoney = optionsData.orderPayMoney || 0
            extObj.xmd_tag = 'customer_service'
        }
        let sendOption = {
            to: options.to,
            msg: messageStr,
            type: 'chat',
            ext: extObj,
            success (res) {
                // console.log('发送成功：', res, msgObjForStore)
                if (options.success) { // 发送成功之后的回调
                    options.success()
                }
            },
            error () {
                errorCallback(msgObjForStore.msgId, options.to, false)
            }
        }
        // console.log('sendOption：', sendOption)
        sendMessage.set(sendOption)
        that.conn.send(sendMessage.body)
        return msgObjForStore
    },
    doSendImageMessage (options, uploadCallback, errorCallback) {
        let that = this
        let img = new Image()
        img.src = window.URL.createObjectURL(options.file)
        img.onload = function () {
            let imgWidth = this.width
            let imgHeight = this.height
            let msgId = that.conn.getUniqueId()
            /*eslint-disable*/
            let sendMessage = new WebIM.message('img', msgId)
            let sendTime = (+new Date())
            let extObj = {
                name: that.name,
                header: that.header,
                avatar: that.avatar,
                time: sendTime,
                userId: that.userId,
                userRoles: 'user'
            }
            let msgOption = {
                apiUrl: that.apiUrl,
                file: WebIM.utils.getFileUrl(options.imgFile),
                to: options.to,
                roomType: false,
                chatType: 'singleChat',
                width: imgWidth,
                height: imgHeight,
                file_length: options.file.size,
                onFileUploadError: function (error) {      // 上传失败
                    console.log('send pic error：' + error)
                    Util.tipShow('图片发送失败，请稍后重试！')
                    window.URL.revokeObjectURL(img.src)
                    errorCallback(msgId, options.to)
                },
                onFileUploadComplete: function (uploadRes) {   // 上传成功
                    // console.log('onFileUploadComplete：', uploadRes)
                    let loadUrl = uploadRes.uri + '/' + uploadRes.entities[0].uuid
                    let msgObjForStore = {
                        chatId: options.to,
                        data: {
                            url: loadUrl, width: imgWidth, height: imgHeight
                        },
                        desc: '[图片]',
                        isRevoke: false,
                        isSend: true,
                        msgId: msgId,
                        time: Math.round(sendTime / 1000),
                        type: 'image',
                        sendStatus: true // 默认为true
                    }
                    // console.log('img msgObjForStore：', msgObjForStore)
                    uploadCallback(msgObjForStore)
                },
                success: function (msgId) { // 发送成功
                    Util.tipShow('图片发送成功！')
                    window.URL.revokeObjectURL(img.src)
                },
                ext: extObj
            }
            // console.log('img send option', msgOption)
            sendMessage.set(msgOption)
            that.conn.send(sendMessage.body)
        }
    },
    close () {
        let that = this
        if (that.conn) {
            that.conn.close()
        }
    }
}
