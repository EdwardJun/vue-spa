// 将会话列表与聊天消息存储在indexedDB里面
const DBName = 'spadb' // 数据库名称
const DBVersion = 1 // 数据库版本

// session对象仓库结构
// [{ id: '', name: ' ', time: Long, header: 'url()', avatar: 1120, userId: '', recentMsg: '' , newMsgCount: 0, type: 'tech' , clubId: '', serialNo: ''}]

// message对象仓库结构
/** **************************************** 普通文本消息（包含表情）
{
    id: '', // 自增
    msgId: 191991919, // sdk的消息ID
    uid: 3248923 // 腾讯IM的uniqueid发出去和重新拉取之后并不一致，发现random和seq 字段是一致的，uid有这两个字段拼接 random + seq
    chatId: 21372197328973, // 对方的聊天ID，发给对方的或者消息收至对方的
    isSend: true, // 是否是自己发的
    type: 'text',
    time: 1519638783672, // 消息的发送时间
    data: 'hello world/::O/::O', // 消息的数据
    desc: 'hello world/大笑/大笑' , // 对于消息的文本描述
    isRevoke: false // 是否被撤回
    sendStatus: true // true--发送成功   false--发送失败
    readStatus: false // 是否已读状态
}
******************************************** **/

/** **************************************** 图片消息(其他字段同文本消息)
{
    data: { url: '', width: 111, height: 111 }, // 消息的数据
    desc: '[图片]', // 对于消息的文本描述
    type: 'image'
}
******************************************** **/

/** **************************************** 会所位置消息(其他字段同文本消息)
{
    data: { address: '', lat: 111, lng: 111, staticMap: '' }, // 消息的数据
    desc: '[位置]', // 对于消息的文本描述
    type: 'clubLocation'
}
******************************************** **/

/** **************************************** 语音消息(其他字段同文本消息)
{
    data: { duration: '', url: '' },
    type: 'voice'
}
******************************************** **/

export default {
    db: null, // 数据库
    userId: '', // spa系统用户id
    sessionStoreName: '', // 会话列表的对象仓库名称
    messageStoreName: '', // 消息列表的对象仓库名称
    openDB (userId, category, callback) { //  打开数据库
        let that = this
        that.userId = userId
        that.sessionStoreName = 'session'
        that.messageStoreName = 'message'
        let request = indexedDB.open(DBName + '-' + category + userId, DBVersion)
        request.onsuccess = function (e) {
            that.db = e.target.result
            callback && callback()
        }
        request.onerror = function () {
            // console.log('连接数据库失败...')
        }
        request.onupgradeneeded = function (e) {
            // console.log('onupgradeneeded......')
            let db = that.db = e.target.result
            let sessionStoreName = that.sessionStoreName
            let messageStoreName = that.messageStoreName
            let objectStoreNames = db.objectStoreNames

            // 如果不存在session对象仓库则创建
            if (!objectStoreNames.contains(sessionStoreName)) {
                let store = db.createObjectStore(sessionStoreName, { keyPath: 'id', autoIncrement: false })
                store.createIndex('index', 'name', { unique: false })
            }

            // 如果不存在message对象仓库则创建
            if (!objectStoreNames.contains(messageStoreName)) {
                let store = db.createObjectStore(messageStoreName, { keyPath: 'id', autoIncrement: true })
                store.createIndex('index', 'chatId', { unique: false })
            }
        }
    },
    closeDB () {
        let that = this
        if (that.db) {
            that.db.close()
        }
    },
    // 获取indexedDB里面的session list
    getSessionList (callback) {
        let that = this
        let storeName = that.sessionStoreName
        let tx = that.db.transaction(storeName, 'readonly')
        let store = tx.objectStore(storeName)
        let req = store.openCursor()
        let data = []
        req.onsuccess = function () {
            let cursor = this.result
            if (cursor) {
                data.push(cursor.value)
                cursor.continue()
            } else {
                callback && callback(data)
            }
        }
    },
    // 将session list存储至indexedDB里面
    saveSession (sessionList) {
        let that = this
        let storeName = that.sessionStoreName
        let tx = that.db.transaction(storeName, 'readwrite')
        let store = tx.objectStore(storeName)
        sessionList.forEach(session => {
            store.put(session)
        })
    },
    // 从indexed DB里面删除session list
    delSession (sessionList) {
        let that = this
        let storeName = that.sessionStoreName
        let tx = that.db.transaction(storeName, 'readwrite')
        let store = tx.objectStore(storeName)
        let index = store.index('index')
        let req = index.openCursor()
        let cursor
        let sessionListKeys = {}
        sessionList.forEach(s => {
            sessionListKeys[s.id] = true
        })
        req.onsuccess = function () {
            cursor = this.result
            if (cursor) {
                if (sessionListKeys[cursor.value.id]) {
                    cursor.delete()
                }
                cursor.continue()
            }
        }
    },
    // 将一条消息存储至indexedDB里面
    saveMessage (message) {
        let that = this
        let storeName = that.messageStoreName
        let tx = that.db.transaction(storeName, 'readwrite')
        let store = tx.objectStore(storeName)
        store.put(message)
    },
    // 修改预约订单消息的支付状态
    changeOrderMessagePayStatus (chatId, orderId, status) {
        let that = this
        let storeName = that.messageStoreName
        let tx = that.db.transaction(storeName, 'readwrite')
        let store = tx.objectStore(storeName)
        let index = store.index('index')
        let req = index.openCursor(IDBKeyRange.only(chatId), 'prev') // 降序
        let cursor
        let record
        req.onsuccess = function () {
            cursor = this.result
            if (cursor) {
                record = cursor.value
                if (record.data.orderId == orderId) {
                    record.data.hasPay = status
                    cursor.update(record)
                } else {
                    cursor.continue()
                }
            }
        }
    },
    // 修改消息的撤回状态为true
    changMessageRevokeStatus (msgId, chatId, idType) {
        let that = this
        let storeName = that.messageStoreName
        let tx = that.db.transaction(storeName, 'readwrite')
        let store = tx.objectStore(storeName)
        let index = store.index('index')
        let req = index.openCursor(IDBKeyRange.only(chatId), 'prev') // 降序
        let cursor
        let record
        idType = !!idType
        req.onsuccess = function () {
            cursor = this.result
            if (cursor) {
                record = cursor.value
                if ((!idType && record.msgId == msgId) || (idType && record.id == msgId)) {
                    record.isRevoke = true
                    cursor.update(record)
                } else {
                    cursor.continue()
                }
            }
        }
    },
    // 修改消息的状态
    updateMessageStatus (msgId, chatId, status, statusName) {
        let that = this
        let storeName = that.messageStoreName
        let tx = that.db.transaction(storeName, 'readwrite')
        let store = tx.objectStore(storeName)
        let index = store.index('index')
        let req = index.openCursor(IDBKeyRange.only(chatId), 'prev') // 降序
        let cursor
        let record
        req.onsuccess = function () {
            cursor = this.result
            if (cursor) {
                record = cursor.value
                if (record.msgId == msgId) {
                    record[statusName] = status
                    cursor.update(record)
                } else {
                    cursor.continue()
                }
            }
        }
    },
    // 修改消息的是否已读状态
    updateMessageReadStatus (msgId, chatId, status) {
        this.updateMessageStatus(msgId, chatId, status, 'readStatus')
    },
    // 修改消息的发送状态
    updateMessageSendStatus (msgId, chatId, status) {
        this.updateMessageStatus(msgId, chatId, status, 'sendStatus')
    },
    // 获取与chatId的最后一条消息，以实现消息的分页加载
    getLastedMessage (chatId, callback) {
        let that = this
        let storeName = that.messageStoreName
        let tx = that.db.transaction(storeName, 'readonly')
        let store = tx.objectStore(storeName)
        let index = store.index('index')
        let req = index.openCursor(IDBKeyRange.only(chatId), 'prev') // 降序
        let cursor
        req.onsuccess = function () {
            cursor = this.result
            callback && callback(cursor ? cursor.value : null)
        }
    },
    // 获取消息列表
    getMessageList (options, callback) {
        let that = this
        let storeName = that.messageStoreName
        let tx = that.db.transaction(storeName, 'readonly')
        let store = tx.objectStore(storeName)
        let index = store.index('index')
        let req = index.openCursor(IDBKeyRange.only(options.chatId), 'prev') // 利用索引
        let data = []
        req.onsuccess = function () {
            let cursor = this.result
            if (cursor) {
                if (cursor.value.id <= options.endId) {
                    data.push(cursor.value)
                    if (data.length < options.pageSize) { // 只取pageSize大小的列表数据
                        cursor.continue()
                    } else {
                        callback && callback(data)
                    }
                } else {
                    cursor.continue()
                }
            } else {
                callback && callback(data)
            }
        }
    },
    delMessageRecord (messageId) {
        // console.log('del messageId：', messageId)
        let that = this
        let storeName = that.messageStoreName
        let tx = that.db.transaction(storeName, 'readwrite')
        let store = tx.objectStore(storeName)
        store.delete(messageId)
        // let request = store.delete(messageId)
        // request.onsuccess = function () {
        //     // console.log('del success：', messageId)
        // }
    },
    // 删除与某个聊天者的所有聊天消息
    delMessage (chatId) {
        let that = this
        let storeName = that.messageStoreName
        let tx = that.db.transaction(storeName, 'readwrite')
        let store = tx.objectStore(storeName)
        let index = store.index('index')
        let req = index.openCursor(IDBKeyRange.only(chatId), 'prev') // 降序
        let cursor
        let records = []
        req.onsuccess = function () {
            cursor = this.result
            if (cursor) {
                records.push(cursor.value.id)
                cursor.continue()
            } else { // 遍历结束
                if (records.length > 0) {
                    for (let i = 0; i < records.length; i++) {
                        if (i == 0) {
                            that.changMessageRevokeStatus(records[i], chatId, true)
                        } else {
                            that.delMessageRecord(records[i])
                        }
                    }
                }
            }
        }
    }
}
