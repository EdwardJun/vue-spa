/* 腾讯云即时通讯的实现 */
import webim from './t.webim'
import Util from './util'
import ActMessageTitle from './act-message-title'
import ExpressionCode from './expression'
import SpecialCharCode from './special-char'

// 解码表情的正则表达式
const DecodeExpressionReg = new RegExp('/::[A-Zab]+', 'g')
const SpecialCharReg = new RegExp('&[a-z]+;', 'g')

window._webim = webim
// 单聊
const C2CSessionType = webim.SESSION_TYPE.C2C

export default {
    id: '', // 聊天ID
    appID: '1400063117',
    accountType: 21719,
    token: '', // 聊天的token
    init (options) {
        let that = this
        let imInstance = options.imInstance
        that.id = imInstance.id
        that.token = imInstance.token
        if (/(spa.93wifi.com|sdcm165.stonebean.com|sdcm166.stonebean.com)/.test(location.hostname)) {
            that.appID = '1400063194'
            that.accountType = 21874
        }
        const loginInfo = {
            sdkAppID: that.appID,
            appIDAt3rd: that.appID,
            identifier: that.id,
            userSig: that.token,
            accountType: that.accountType
        }
        const listeners = {
            onConnNotify (res) {
                options.onConnNotify.call(imInstance, res)
            },
            onMsgNotify (newMsgList) {
                options.onMsgNotify.call(imInstance, newMsgList)
            },
            onKickedEventCall () {
                options.onKickedEventCall.call(imInstance)
            }
        }
        const loginOptions = {
            isAccessFormalEnv: true,
            isLogOn: false
        }
        webim.login(loginInfo, listeners, loginOptions, () => {
            options.loginSuccess()
        }, (err) => {
            console.log('error ', err)
        })
        return null
    },
    getConnStatus (res) {
        let status = webim.CONNECTION_STATUS
        let resStatus
        let info
        switch (res.ErrorCode) {
        case status.ON:
            info = 'tim建立连接成功！'
            resStatus = 1
            break
        case status.OFF:
            info = '连接已断开，无法收到新消息，请检查网络是否正常！'
            Util.tipShow(info)
            resStatus = 2
            break
        case status.RECONNECT:
            info = '连接状态恢复正常！'
            Util.tipShow(info)
            resStatus = 1
            break
        default:
            info = '未知连接状态！'
            resStatus = 3
        }
        return resStatus
    },
    // 拉取最近联系人及消息
    getRecentContactList () {
        return new Promise(resolve => {
            webim.getRecentContactList({ Count: 50 }, res => {
                resolve(res.SessionItem || [])
            })
        })
    },
    doPullOfflineMessage (id) {
        return new Promise(resolve => {
            webim.getC2CHistoryMsgs({
                Peer_Account: id, // 好友帐号
                MaxCnt: 15, // 拉取消息条数
                LastMsgTime: 0, // 最近的消息时间，即从这个时间点向前拉取历史消息
                MsgKey: ''
            }, res => {
                resolve(res)
            })
        })
    },
    onMsgNotify (newMsgList) {
        let ele = null
        let recentMsg = ''
        let msg
        let that = this
        let notifyResArr = []
        console.log('onMsgNotify：', newMsgList)
        newMsgList.forEach(item => {
            if (!item.isSend) {
                if (item.elems.length == 1) { // 只有一个消息体的
                    ele = item.elems[0]
                    if (ele.type == 'TIMCustomElem') { // 只对自定义消息处理
                        try {
                            msg = JSON.parse(ele.content.data)
                            let msgType = msg.type
                            let msgData = msg.data
                            if (msgType == 'text') { // 普通文本消息
                                msg.data = msgData.content
                                recentMsg = that.decodeExpression(msg.data)
                            } else if (msgType == 'image2') { // 群发图片消息
                                recentMsg = '[图片]'
                                msg.data.width = 0
                                msg.data.height = 0
                                msgType = 'image'
                            } else if (msgType == 'clubLocation') { // 会所位置消息
                                recentMsg = '[位置]'
                            } else if (msgType == 'requestReward') { // 求打赏消息
                                recentMsg = '万水千山总是情，打赏两个行不行~'
                            } else if (msgType == 'journal') { // 电子期刊
                                recentMsg = '[电子期刊]'
                                msgData.title = msgData.actName
                                msgData.desc = ActMessageTitle.journal.desc
                            } else if (msgType == 'inviteGift') { // 邀请有礼
                                recentMsg = '[邀请有礼活动]'
                                msgData.title = ActMessageTitle.inviteGift.title
                                msgData.desc = ActMessageTitle.inviteGift.desc
                            } else if (msgType == 'itemCard') { // 特惠商城
                                let cardType = msgData.cardType
                                recentMsg = '[' + ActMessageTitle.itemCard[cardType].title + ']'
                                msgData.title = msgData.actName
                                msgData.desc = ActMessageTitle.itemCard[cardType].desc
                            } else if (msgType == 'luckyWheel') { // 转盘抽奖
                                recentMsg = '[转盘抽奖]'
                                msgData.title = msgData.actName
                                msgData.desc = ActMessageTitle.luckyWheel.desc
                            } else if (msgType == 'groupBuy') { // 拼团消息
                                recentMsg = '[拼团活动]'
                                msgData.title = msgData.actName
                                msgData.desc = ActMessageTitle.groupBuy.desc
                            } else if (msgType == 'timeLimit') { // 限时抢
                                recentMsg = '[限时抢活动]'
                                msgData.title = msgData.actName
                                msgData.desc = ActMessageTitle.timeLimit.desc
                            } else if (msgType == 'paidCoupon') { // 点钟券
                                recentMsg = '[点钟券]立减' + msgData.discountValue + '元'
                            } else if (msgType == 'ordinaryCoupon') { // 优惠券
                                recentMsg = '[' + msgData.typeName + ']' + msgData.couponName
                            } else if (msgType == 'order_request') { // 求预约
                                recentMsg = '选项目、约技师，线上预约，方便快捷~'
                            } else if (msgType == 'order_confirm') { // 订单确认
                                recentMsg = '[预约确认]'
                            } else if (msgType == 'order_cancel') { // 取消预约
                                recentMsg = '[预约取消]'
                            } else if (msgType == 'order_refuse') { // 拒绝预约
                                recentMsg = '[拒绝预约]'
                            } else if (msgType == 'order_success') { // 预约成功
                                recentMsg = '[预约成功]'
                            } else if (msgType == 'revert_msg') { // 撤回消息，data中给消息ID
                                recentMsg = '撤回了一条消息'
                                msg.data = msgData.msgId
                            } else if (msgType == 'order') { // 普通预约
                                if (msgData.orderStatus == 'refuse') {
                                    recentMsg = '[拒绝预约]'
                                } else if (msgData.orderStatus == 'accept') {
                                    recentMsg = '[接受预约]'
                                }
                            }
                            notifyResArr.push({
                                msgType,
                                recentMsg,
                                msg,
                                receiveObj: {
                                    time: item.time, chatId: item.fromAccount, desc: recentMsg, data: msg.data, msgId: item.uniqueId, uid: item.random + '' + item.seq
                                }
                            })
                        } catch (error) {
                            console.log('解析错误！', error)
                        }
                    }
                } else if (item.elems.length == 2) { // 有两个消息体的
                    let customElem
                    let contentElem
                    item.elems.forEach(ele => {
                        if (ele.type == 'TIMCustomElem') {
                            customElem = ele
                        } else {
                            contentElem = ele
                        }
                    })
                    try {
                        msg = JSON.parse(customElem.content.data)
                        let msgType = msg.type
                        if (msgType == 'image') { // 图片消息
                            let imgEleArr = contentElem.content.ImageInfoArray
                            let imgInfo = {}
                            imgEleArr.forEach(infoItem => {
                                if (infoItem.type == webim.IMAGE_TYPE.ORIGIN) {
                                    imgInfo.url = infoItem.url
                                    imgInfo.width = infoItem.width
                                    imgInfo.height = infoItem.height
                                }
                            })
                            if (imgInfo.url) {
                                recentMsg = '[图片]'
                                notifyResArr.push({
                                    msgType,
                                    recentMsg,
                                    msg,
                                    receiveObj: {
                                        time: item.time, chatId: item.fromAccount, desc: recentMsg, data: imgInfo, msgId: item.uniqueId, uid: item.random + '' + item.seq
                                    }
                                })
                            }
                        } else if (msgType == 'voice') { // 语音消息
                            recentMsg = '[语音]'
                            notifyResArr.push({
                                msgType,
                                recentMsg,
                                msg,
                                receiveObj: {
                                    time: item.time, chatId: item.fromAccount, desc: recentMsg, msgId: item.uniqueId, uid: item.random + '' + item.seq, data: { duration: msg.data.duration, url: contentElem.content.downUrl }
                                }
                            })
                        }
                    } catch (error) {
                        console.log('解析消息错误！', error)
                    }
                }
            }
        })
        return notifyResArr
    },
    // 解析文本消息中的表情
    decodeExpression (messageString) {
        return messageString.replace(DecodeExpressionReg, function () {
            return ExpressionCode[arguments[0]] || arguments[0]
        })
    },
    // 解析文本消息中的特殊符号
    decodeSpecialCode (messageString) {
        return messageString.replace(SpecialCharReg, function () {
            return SpecialCharCode[arguments[0]] || arguments[0]
        })
    },
    checkMaxLength (content) {
        let len = webim.Tool.getStrBytes(content)
        let maxLen = webim.MSG_MAX_LENGTH.C2C
        if (len > maxLen) {
            Util.tipShow('消息长度超出限制(最多' + Math.round(maxLen / 3) + '个汉字)')
            return false
        }
        return true
    },
    doSendCommonMessage (options, msgType, msgDescText, msgContent, errorCallback) {
        let round = Math.round
        let msgTime = round((+new Date()) / 1000) // 消息时间戳
        let selSess = new webim.Session(C2CSessionType, options.to, options.to, '', msgTime)
        let isSend = true // 是否为自己发送
        let seq = -1 // 消息序列，-1表示sdk自动生成
        let random = round(Math.random() * 4294967296) // 消息随机数，用于去重
        let subType = webim.C2C_MSG_SUB_TYPE.COMMON
        let msg = new webim.Msg(selSess, isSend, seq, random, msgTime, '', subType, '')
        let textObj = new webim.Msg.Elem.Custom(JSON.stringify(msgContent))
        msg.addCustom(textObj)
        msg.sending = 1
        msg.PushInfoBoolean = true
        msg.PushInfo = {
            PushFlag: 0,
            Desc: msgDescText
        }
        let msgObjForStore = {
            chatId: options.to,
            data: options.data,
            desc: msgDescText,
            isRevoke: false,
            isSend: true,
            msgId: msg.uniqueId,
            uid: msg.random + '' + msg.seq,
            time: msg.time,
            type: msgType,
            sendStatus: true, // 默认为true
            readStatus: true
        }
        // 调用发送消息接口
        webim.sendMsg(msg, res => {
            if (options.success) { // 发送成功之后的回调
                options.success()
            }
        }, (error) => {
            console.log('error：', error)
            errorCallback(msgObjForStore.msgId, options.to, false)
        })
        return msgObjForStore
    },
    doSendImageMessage (options, uploadCallback, errorCallback) {
        let that = this
        let opt = { // 先上传图片，封装上传图片请求
            file: options.file, // 图片对象
            To_Account: options.to, // 接收者
            businessType: webim.UPLOAD_PIC_BUSSINESS_TYPE.C2C_MSG // 业务类型
        }
        webim.uploadPic(opt,
            res => {
                that.doImageUploaded(res, options.to, uploadCallback, errorCallback) // 上传成功发送图片
            },
            err => {
                console.log(err.ErrorInfo)
            }
        )
    },
    doImageUploaded (imgRes, talkerId, uploadCallback, errorCallback) {
        let that = this
        let round = Math.round
        let msgTime = round((+new Date()) / 1000) // 消息时间戳
        let selSess = new webim.Session(C2CSessionType, talkerId, talkerId, '', msgTime)
        let isSend = true // 是否为自己发送
        let seq = -1 // 消息序列，-1表示sdk自动生成
        let random = round(Math.random() * 4294967296) // 消息随机数，用于去重
        let subType = webim.C2C_MSG_SUB_TYPE.COMMON
        let msg = new webim.Msg(selSess, isSend, seq, random, msgTime, '', subType, '')
        let msgContent = {
            data: {},
            time: (+new Date()),
            type: 'image',
            userId: that.userId
        }
        let textObj = new webim.Msg.Elem.Custom(JSON.stringify(msgContent))
        msg.addCustom(textObj)
        msg.PushInfoBoolean = true
        msg.PushInfo = {
            PushFlag: 0,
            Desc: '[图片]'
        }
        let imageObj = new webim.Msg.Elem.Images(imgRes.File_UUID)
        let newImg
        let type
        let originImgInfo = {}
        imgRes.URL_INFO.forEach(img => {
            if (img.PIC_TYPE == 1) {
                type = 1
                originImgInfo.url = img.DownUrl
                originImgInfo.width = img.PIC_Width
                originImgInfo.height = img.PIC_Height
            } else if (img.PIC_TYPE == 2) {
                type = 3
            } else if (img.PIC_TYPE == 4) {
                type = 2
            }
            newImg = new webim.Msg.Elem.Images.Image(type, img.PIC_Size, img.PIC_Width, img.PIC_Height, img.DownUrl)
            imageObj.addImage(newImg)
        })
        msg.addImage(imageObj)
        msg.sending = 1
        let msgObjForStore = {
            chatId: talkerId,
            data: originImgInfo,
            desc: '[图片]',
            isRevoke: false,
            isSend: true,
            msgId: msg.uniqueId,
            uid: msg.random + '' + msg.seq,
            time: msg.time,
            type: 'image',
            sendStatus: true, // 默认为true
            readStatus: true
        }
        uploadCallback(msgObjForStore)
        // 调用发送消息接口
        webim.sendMsg(msg, res => {
            console.log('发送成功：', res, msgObjForStore)
        }, err => {
            console.log(err.ErrorInfo)
            msgObjForStore.sendStatus = false
            errorCallback(msgObjForStore.msgId, talkerId)
        })
    },
    close () {
        webim.logout()
    }
}
