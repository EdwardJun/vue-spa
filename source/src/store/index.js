import Vue from 'vue'
import Vuex from 'vuex'
import Global from '../libs/global'
import eventHub from '../libs/hub'
Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        sessionList: [], // [{ id: '', name: ' ', time: Long, header: 'url()', avatar: 11, userId: '', recentMsg: '' , newMsgCount: 0, type: 'tech' , clubId: '', serialNo: ''}]
        talkerMessageList: [], // 当前聊天对象的消息列表
        talker: { // 当前聊天对方信息
            id: '', // 对方聊天ID
            name: '', // 对方名称
            userId: '', // SPA系统中的用户id
            serialNo: '', // 用户编号--技师编号
            type: 'tech', // 技师/客服/管理者 tech、servicer、manager
            header: '', // 对方头像url
            status: 'free', // free rest等技师忙闲休假状态
            clubId: '', // 对方所在的clubID
            clubName: '', // 对方所在的clubName
            inviteCode: '', // 邀请码
            isAppointment: true, // 是否可预约
            isPhoneAppointment: false, // 是否可以电话预约
            appointType: 'appoint', // 预约类型
            telephone: [] // 预约电话
        },
        newMessageTotal: 0 // 新消息总数
    },
    mutations: {
        // 设置消息的会话列表数据
        setMessageSessionList (state, payload) {
            state.sessionList = payload.map(item => { return item })
        },
        // 更新某个会话数据
        updateMessageSession (state, payload) {
            state.sessionList.splice(payload.index, 1, payload.obj)
        },
        // 为会话列表增加会话
        addMessageSession (state, payload) {
            // console.log('add message session....')
            state.sessionList.push(payload)
        },
        // 更新总的消息数目
        updateNewMessageTotal (state) {
            let count = 0
            let global = Global.data
            state.sessionList.forEach(session => {
                if (!(global.pageMode == 'club' && session.clubId != global.clubId)) {
                    count += session.newMsgCount
                }
            })
            state.newMessageTotal = count
        },
        // 从当前的消息列表中修改撤回消息的isRevoke为true
        changeMessageRevokeStatus (state, msgId) {
            let list = state.talkerMessageList
            let i = list.length - 1
            for (; i >= 0; i--) {
                if (list[i].msgId == msgId) {
                    list[i].isRevoke = true
                    break
                }
            }
        },
        // 自动增加欢迎语
        addWelcomeMessage (state, msg) {
            state.talkerMessageList.push(msg)
        },
        // 清空当前聊天对象的消息列表
        clearTalkerMessageList (state) {
            state.talkerMessageList = []
        },
        // 更新当前聊天对象的相关信息
        updateChatTalker (state, options) {
            let talker = state.talker
            Object.keys(options).forEach(key => {
                if (key == 'header') {
                    options[key] = options[key] || Global.data.defaultHeader
                }
                talker[key] = options[key]
            })
        },
        // 添加消息至当前消息列表
        addMessageToCurrList (state, msg) {
            state.talkerMessageList.push(msg)
            setTimeout(() => { eventHub.$emit('message-wrap-to-bottom') }, 300)
        },
        // 修改消息的发送状态为false
        updateMessageSendStatus (state, msgId) {
            let item
            for (let i = state.talkerMessageList.length - 1; i >= 0; i--) {
                item = state.talkerMessageList[i]
                if (item.msgId == msgId) {
                    item.sendStatus = false
                    break
                }
            }
        },
        // 添加多条消息至当前消息列表
        addMessagesToCurrList (state, list) {
            list.forEach(item => {
                state.talkerMessageList.unshift(item)
            })
        }
    }
})
