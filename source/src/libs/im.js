/**
 * 即时通讯im
 */
import Vue from 'vue'
import store from '../store/index'
import idb from './idb'
import ExpressionCode from './expression'
import impl from './t.im.impl' // 腾讯im的实现
// import impl from './h.im.impl' // 环信im的实现

// 表情的索引对象  /::O : 0   /::Y : 1
let ExpressionIndexObj = null
// 解码表情的正则表达式
const DecodeExpressionReg = new RegExp('/::[A-Zab]+', 'g')
const win = window
win._impl = impl
win._idb = idb

export default {
    id: '', // 聊天ID
    token: '',
    userId: '', // 用户id--SPA系统中
    header: null, // 用户头像
    name: '', // 聊天时的用户名称
    status: 0, // 0 --- 未登录状态   1--- 已登录状态   2--- 连接被断开状态   3--- 连接未知状态
    dbStatus: 0, // 0 --- 关闭状态   1 ---  打开状态
    category: 't', // t|h  t表示腾讯，h表示环信
    conn: null, // 环信的连接
    // 初始化
    init () {
        let that = this
        if (!that.id || !that.token) {
            console.log('缺少im的id或者token!')
            return
        }
        that.conn = impl.init({
            imInstance: that,
            onConnNotify: that.onConnNotify,
            onMsgNotify: that.onMsgNotify,
            onKickedEventCall: that.onKickedEventCall,
            loginSuccess () {
                idb.openDB(that.userId, that.category, () => {
                    that.dbStatus = 1
                    that.getSessionList(function () {
                        if (that.category == 't') { // 对于腾讯云IM
                            that.pullOfflineMessages() // 拉取离线消息
                        }
                    })
                })
            }
        })
    },
    // 判定状态是否就绪
    ready () {
        let that = this
        return new Promise(resolve => {
            if (that.status != 0 && that.status != 3 && that.dbStatus == 1) {
                resolve()
            } else {
                let waiter = setInterval(() => {
                    if (that.status != 0 && that.status != 3 && that.dbStatus == 1) {
                        clearInterval(waiter)
                        resolve()
                    }
                }, 50)
            }
        })
    },
    // 关闭
    close () {
        let that = this
        if (that.dbStatus == 1) { // 关闭数据库
            idb.closeDB()
        }
        if (that.status != 0) {
            impl.close()
        }
    },
    // 拉取离线消息
    pullOfflineMessages () {
        let that = this
        impl.getRecentContactList().then(list => {
            if (list.length > 0) {
                list.forEach(item => {
                    if (!that.isInSessionList(item.To_Account)) {
                        that.updateSessionList({ id: item.To_Account, recentMsg: '@@', newMsgCount: 0 }, false, false)
                    }
                })
            }
            // 对session list拉取离线的消息
            let cursor = 0
            let sessionList = store.state.sessionList
            that.doPullOfflineMessage(cursor, sessionList)
        })
    },
    doPullOfflineMessage (cursor, sessionList) {
        let that = this
        if (sessionList[cursor]) {
            let chatId = sessionList[cursor].id
            impl.doPullOfflineMessage(chatId).then(res => {
                if (res) {
                    let list = res.MsgList
                    let startIndex = list.length
                    let messageItem
                    let addMessageList = []
                    let lastedMsgTime = 0
                    if (startIndex > 0) {
                        idb.getLastedMessage(chatId, lastedMsg => {
                            if (lastedMsg) { // 寻找与lastedMsg中uid相等的消息
                                startIndex--
                                lastedMsgTime = lastedMsg.time
                                for (; startIndex >= 0; startIndex--) {
                                    messageItem = list[startIndex]
                                    if (messageItem.random + '' + messageItem.seq == lastedMsg.uid) {
                                        break
                                    }
                                }
                                startIndex++
                            } else {
                                startIndex = 0
                            }
                            for (; startIndex < list.length; startIndex++) {
                                messageItem = list[startIndex]
                                if (!messageItem.isSend && lastedMsgTime < messageItem.time) {
                                    addMessageList.push(messageItem)
                                }
                            }
                            if (addMessageList.length > 0) {
                                that.onMsgNotify(addMessageList)
                            }
                            that.doPullOfflineMessageNext(cursor, sessionList)
                        })
                    } else {
                        that.doPullOfflineMessageNext(cursor, sessionList)
                    }
                } else {
                    that.doPullOfflineMessageNext(cursor, sessionList)
                }
            })
        }
    },
    doPullOfflineMessageNext (cursor, sessionList) {
        if (cursor < sessionList.length - 1) {
            this.doPullOfflineMessage(cursor + 1, sessionList)
        }
    },
    // 判定会话是否已经在sessionList里头了
    isInSessionList (id) {
        let sessionList = store.state.sessionList
        for (let i = 0; i < sessionList.length; i++) {
            if (sessionList[i].id == id) {
                return true
            }
        }
        return false
    },
    // 获取session list
    getSessionList (callback) {
        let that = this
        if (store.state.sessionList.length == 0) {
            idb.getSessionList(list => {
                store.commit('setMessageSessionList', list)
                if (list.length > 0) {
                    that.updateSessionHeaderUrl(list)
                }
                that.updateTotalNewMsgCount()
                if (callback) {
                    callback()
                }
                return list
            })
        }
        return store.state.sessionList
    },
    // 通过聊天ID或者userID获取会话对象，idType为true表示id是userId，否则为聊天id
    getSessionObj (id, idType) {
        let sessionObj = null
        let sessionObjIndex = -1
        let sessionList = store.state.sessionList
        idType = !!idType
        let item
        for (let i = 0; i < sessionList.length; i++) {
            item = sessionList[i]
            if ((!idType && item.id == id) || (idType && item.userId == id)) {
                sessionObj = item
                sessionObjIndex = i
                break
            }
        }
        if (sessionObj) {
            return {
                obj: sessionObj, index: sessionObjIndex
            }
        } else {
            return null
        }
    },
    // 更新session list
    updateSessionList (options, isFromMsgNotify = true, needSearchTag = true) {
        // console.log('updateSessionList options：', options)
        let that = this
        let sessionObj = null
        let sessionObjIndex = -1
        let resObj
        if (needSearchTag) {
            resObj = that.getSessionObj(options.id)
        }
        if (resObj) {
            sessionObj = resObj.obj
            sessionObjIndex = resObj.index
        }
        if (sessionObj) { // update 更新字段
            sessionObj.time = options.time || Math.round((+new Date()) / 1000)
            if (options.recentMsg) {
                sessionObj.recentMsg = options.recentMsg
            }
            if (options.avatar) {
                sessionObj.avatar = options.avatar
            }
            if (options.header) {
                sessionObj.header = options.header
            }
            if (options.type) {
                sessionObj.type = options.type
            }
            if (options.clubId) {
                sessionObj.clubId = options.clubId
            }
            if (options.serialNo) {
                sessionObj.serialNo = options.serialNo
            }
            if (options.name) {
                sessionObj.name = options.name
            }
            if (isFromMsgNotify) {
                if (store.state.talker.id == sessionObj.id) {
                    sessionObj.newMsgCount = 0
                } else {
                    sessionObj.newMsgCount = sessionObj.newMsgCount + 1
                }
            } else if (options.newMsgCount != undefined) {
                sessionObj.newMsgCount = options.newMsgCount
            }
            store.commit('updateMessageSession', {
                index: sessionObjIndex,
                obj: sessionObj
            })
            that.updateTotalNewMsgCount()
            that.saveSession([sessionObj])
        } else { // add -- 新增会话
            // 通过聊天ID获取对方的详情信息
            Vue.http.get('../api/v2/chat/userInfo/{id}', {
                params: {
                    id: options.id, getPermission: false, idType: 'emchat'
                }
            }).then(res => {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    sessionObj = {
                        id: options.id,
                        name: res.name || options.name || '',
                        time: options.time || Math.round((+new Date()) / 1000),
                        header: res.avatar || options.header || '',
                        avatar: options.avatar || '',
                        userId: res.userId,
                        recentMsg: options.recentMsg,
                        newMsgCount: (store.state.talker.id == options.id ? 0 : (options.newMsgCount != undefined ? options.newMsgCount : 1)),
                        type: res.userType,
                        clubId: res.clubId || options.clubId,
                        serialNo: res.serialNo
                    }
                    resObj = that.getSessionObj(options.id)
                    if (!resObj) { // 再次判断是否已存在session
                        store.commit('addMessageSession', sessionObj)
                        that.updateTotalNewMsgCount()
                        that.saveSession([sessionObj])
                    }
                }
            })
        }
    },
    // 通过indexedDB，保存多个会话数据
    saveSession (sessionList) {
        this.ready().then(() => {
            idb.saveSession(sessionList)
        })
    },
    // 删除单个的会话记录与聊天记录
    delMessage (chatId) {
        let sessionList = store.state.sessionList
        let list = []
        let imList = []
        sessionList.forEach(session => {
            if (session.id == chatId) {
                idb.delMessage(session.id)
                session.recentMsg = '' // 清空消息
                list.push(session)
            } else {
                imList.push(session)
            }
        })
        if (list.length != 0) {
            idb.delSession(list)
            store.commit('setMessageSessionList', imList)
        }
    },
    // 删除聊天记录&会话记录，tag为true会删除会话记录，clubId可能为空
    delAllMessage (clubId, isDelSession) {
        let sessionList = store.state.sessionList
        let list = []
        sessionList.forEach(session => {
            if ((clubId && clubId == session.clubId) || !clubId) {
                idb.delMessage(session.id)
                session.recentMsg = '' // 清空消息
                session.newMsgCount = 0 // 清空未读消息数
                list.push(session)
            }
        })
        if (list.length != 0) {
            if (isDelSession) {
                idb.delSession(list)
                store.commit('setMessageSessionList', [])
            } else {
                idb.saveSession(list)
                store.commit('setMessageSessionList', list)
            }
        }
    },
    // 计算总的新消息数目
    updateTotalNewMsgCount () {
        store.commit('updateNewMessageTotal')
    },
    // 初始化聊天
    setTalker (options) {
        store.commit('updateChatTalker', options)
    },
    // 更新会话列表头像的url，防止过期失效
    updateSessionHeaderUrl (sessionList) {
        let that = this
        let avatarArr = []
        let avatar
        let updateSessionList = []
        for (let i = 0; i < sessionList.length; i++) {
            avatar = sessionList[i].avatar
            if (avatar && avatar.length > 0) {
                avatarArr.push(avatar)
                updateSessionList.push(sessionList[i])
            }
        }
        if (avatarArr.length > 0) {
            Vue.http.get('../api/v1/emchat/tech/avatars', {
                params: { avatarIds: avatarArr.join(',') }
            }).then(res => {
                res = res.body
                if (res.statusCode == 200 && res instanceof Array) {
                    for (let i = 0; i < res.length; i++) {
                        if (res[i]) {
                            updateSessionList[i].header = res[i]
                        }
                    }
                    that.saveSession(sessionList)
                    store.commit('setMessageSessionList', sessionList)
                }
            })
        }
    },
    // 监听连接状态回调变化事件
    onConnNotify (res) {
        // console.log('onConnNotify：', res)
        this.status = impl.getConnStatus(res)
    },
    // 新消息监听
    onMsgNotify (datas) {
        // console.log('new：', datas)
        let that = this
        let notifyResArr = impl.onMsgNotify(datas)
        notifyResArr.forEach(notifyRes => {
            if (notifyRes) {
                let receiveObj = notifyRes.receiveObj
                if (notifyRes.msgType == 'revert_msg') { // 如果是撤回消息
                    idb.changMessageRevokeStatus(notifyRes.msg.data, receiveObj.chatId)
                    if (store.state.talker.id == receiveObj.chatId) { // 从当前的消息列表中修改撤回消息的isRevoke为true
                        store.commit('changeMessageRevokeStatus', notifyRes.msg.data)
                    }
                }
                // console.log('receiveObj：', receiveObj)
                if (notifyRes.recentMsg) {
                    that.doReceiveMessage(receiveObj, notifyRes.msgType)
                    let updateOption = {
                        time: receiveObj.time, id: receiveObj.chatId, recentMsg: notifyRes.recentMsg, clubId: notifyRes.clubId, header: notifyRes.header, name: notifyRes.name, avatar: notifyRes.avatar
                    }
                    // console.log('updateOption：', updateOption)
                    that.updateSessionList(updateOption) // 更新会话列表
                }
            }
        })
    },
    // 获取与chatId的最后一条消息，以实现消息的分页加载
    getLastedMessage (chatId, callback) {
        idb.getLastedMessage(chatId, callback)
    },
    // 获取与当前聊天对象的历史消息：{ endId: 20, pageSize: 10, chatId: '' }
    getMessageList (options, callback) {
        idb.getMessageList(options, callback)
    },
    doReceiveMessage (options, type) {
        let msg = { ...options, type: type, isSend: false, isRevoke: false, readStatus: false }
        idb.saveMessage(msg) // 存储至indexedDB数据库中
        if (store.state.talker.id == options.chatId) { // 需要添加到当前的消息列表中
            store.commit('addMessageToCurrList', msg)
        }
    },
    // 发送文本消息
    doSendTextMessage (options) {
        let that = this
        let content = options.data = options.data.replace(/<br>/ig, '\n').replace(/<br\/>/ig, '\n')
        if (impl.checkMaxLength(content)) {
            Vue.http.post('../api/v2/chat/sensitive/filter', { str: content }).then(res => {
                res = res.body
                if (res.statusCode == 200) {
                    res = that.decodeSpecialCode(res.respData)
                    options.data = res
                    that.doSendCommonMessage(options, 'text', that.decodeExpression(res))
                } else {
                    that.doSendCommonMessage(options, 'text', that.decodeExpression(content))
                }
            })
        }
    },
    // 发送金钱打赏消息
    doSendMoneyRewardMessage (options) {
        // console.log('doSendMoneyRewardMessage', options)
        let data = options.data
        this.doSendCommonMessage(options, 'reward', '打赏金额' + data.amount + '元')
    },
    // 发送积分礼物打赏消息
    doSendGiftRewardMessage (options) {
        // console.log('doSendGiftRewardMessage：', options)
        let data = options.data
        this.doSendCommonMessage(options, 'gift', '打赏礼物[' + data.giftName + ']')
    },
    // 发送点钟券购买提醒消息
    doSendPaidCouponPurchaseTipMessage (options) {
        // console.log('doSendPaidCouponPurchaseTipMessage', options)
        let data = options.data
        this.doSendCommonMessage(options, 'paidCouponTip', '您购买了' + data.techName + '的[' + data.name + ']')
    },
    // 发送优惠券领取消息
    doSendCouponGetTipMessage (options) {
        // console.log('doSendCouponGetTipMessage', options)
        let data = options.data
        this.doSendCommonMessage(options, 'couponTip', '您领取了' + data.techName + '的[' + data.name + ']')
    },
    // 发送预约技师的消息
    doSendAppointTechMessage (options) {
        // console.log('options', options)
        let data = options.data
        this.doSendCommonMessage(options, 'order', '[发起预约]' + data.serviceItemName)
    },
    // 客服预约之发起预约的消息
    doSendOrderStartMessage (options) {
        // console.log('客服预约之发起预约的消息：', options)
        this.doSendCommonMessage(options, 'order_start', '[发起预约]')
    },
    // 客服预约支付之后发送预约成功的消息
    doSendOrderSuccessMessage (options) {
        this.doSendCommonMessage(options, 'order_success', '[预约成功]')
    },
    doSendCommonMessage (options, msgType, msgDescText) {
        let that = this
        let currTalker = store.state.talker
        let msgContent = {
            data: msgType == 'text' ? { content: options.data } : options.data,
            time: (+new Date()),
            type: msgType,
            userId: that.userId,
            tag: options.tag || ''
        }
        let errorCallback = function (msgId, to) {
            idb.updateMessageSendStatus(msgId, to, false) // 从idb中修改消息的发送状态
            if (to == currTalker.id) { // 从消息列表中修改消息的sendStatus为false
                store.commit('updateMessageSendStatus', msgId)
            }
        }
        let msgObjForStore = impl.doSendCommonMessage(options, msgType, msgDescText, msgContent, errorCallback)
        idb.saveMessage(msgObjForStore) // 存储至indexedDB数据库中
        // console.log('update session list：', options)
        let updateOption = { id: options.to, recentMsg: msgDescText }
        if (currTalker.id == options.to) {
            updateOption.clubId = currTalker.clubId
        }
        that.updateSessionList(updateOption, true)
        if (currTalker.id == options.to) { // 需要添加到当前的消息列表中
            store.commit('addMessageToCurrList', msgObjForStore)
            that.makeFriend({
                toChatId: options.to,
                fromType: 'user',
                toType: '',
                msgType: msgType,
                msgId: msgObjForStore.msgId,
                msgContent: msgObjForStore.desc
            })
        }
    },
    // 发送图片消息
    doSendImageMessage (options) {
        // console.log('发送图片消息：', options)
        let that = this
        impl.doSendImageMessage(options, function (msgObjForStore) {
            idb.saveMessage(msgObjForStore) // 存储至indexedDB数据库中
            that.updateSessionList({ id: options.to, recentMsg: '[图片]' }, true)
            if (store.state.talker.id == options.to) { // 需要添加到当前的消息列表中
                store.commit('addMessageToCurrList', msgObjForStore)
                that.makeFriend({
                    toChatId: options.to,
                    fromType: 'user',
                    toType: '',
                    msgType: 'image',
                    msgId: msgObjForStore.msgId,
                    msgContent: msgObjForStore.desc
                })
            }
        }, function (msgId, to) {
            idb.updateMessageSendStatus(msgId, to, false) // 从idb中修改消息的发送状态
        })
    },
    // 修改客服预约消息的支付状态
    changeOrderMessagePayStatus (chatId, orderId, status) {
        idb.changeOrderMessagePayStatus(chatId, orderId, status)
    },
    // 修改消息的是否已读状态，主要是对语音消息
    updateMessageReadStatus (msgId, chatId, status) {
        idb.updateMessageReadStatus(msgId, chatId, status)
    },
    // 被踢下线
    onKickedEventCall () {
        // console.log('被踢下线。。。')
    },
    // 解析文本消息中的表情
    decodeExpression (messageString) {
        return impl.decodeExpression(messageString)
    },
    decodeSpecialCode (messageString) {
        return impl.decodeSpecialCode(messageString)
    },
    // 解析文本消息to html
    decodeExpressionToImg (messageString) {
        let k
        if (!ExpressionIndexObj) {
            ExpressionIndexObj = {}
            k = 1
            for (let item in ExpressionCode) {
                ExpressionIndexObj[item] = k++
            }
        }
        return messageString.replace(DecodeExpressionReg, function () {
            k = ExpressionIndexObj[arguments[0]]
            return k ? '<img src="./static/images/chat/expression/' + k + '.png" data-exp="' + arguments[0] + '"/>' : arguments[0]
        })
    },
    // 维持好友关系，同时上传聊天记录
    makeFriend (options) {
        if (!options.toChatId) return
        let that = this
        Vue.http.post('../api/v1/emchat/markchattouser', {
            currentChatId: that.id,
            currentUserType: options.fromType || 'user',
            friendChatId: options.toChatId,
            friendUserType: options.toType || 'tech',
            msgType: options.msgType,
            msgId: options.msgId,
            msgContent: options.msgContent
        })
    }
}
