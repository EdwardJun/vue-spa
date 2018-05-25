<style lang="sass">
    @import '../sass/page/message.scss';
</style>
<template>
    <div class="page" id="message-page">
        <div class="tool-title">
            <div>
                <div :class="{ active: currShow=='message' }" @click="doSwitchTab('message')">消息</div>
                <div :class="{ active: currShow=='contact' }" @click="doSwitchTab('contact')">联系人</div>
            </div>
            <div v-show="currShow=='message' && sessionList.length>0" @click="doChangeConfirmPop(true)">清空</div>
            <div v-show="currShow=='contact'">
                <span v-if="inEdit" @click="doClickDelBtn">完成</span>
                <i class="icon-more" v-else @click="menuSet"></i>
                <ul id="menu-more" v-if="menuShow">
                    <li class="del-contacts" @click="doClickDelBtn">删除</li>
                    <router-link class="blacklist" :to="{ name: 'blacklist' }" tag="li">黑名单管理</router-link>
                </ul>
            </div>
        </div>
        <div class="list-wrap" :class="{ active: currShow=='contact' }" :style="{ height : (global.winHeight-2.611*global.winScale*16)+'px' }">

            <!--消息列表-->
            <div class="list" @scroll="doHandlerListScroll">
                <div class="list-item" v-for="item in sessionList" @click="doClickSessionRecord(item)" :key="item.id">
                    <div :style="{ 'background-image' : item.headerUrl }"></div>
                    <div>
                        <div>
                            <div>
                                <div>{{ item.name }}</div>
                                <div :class="(item.type != 'tech') ? 'manager' : (item.serialNo ? 'tech' : 'none')">{{ item.type == 'manager' ? '店长' : (item.type == 'servicer' ? '客服' : item.serialNo) }}</div>
                            </div>
                            <div>{{ item.time | MsgTimeFormatter }}</div>
                        </div>
                        <div :class="item.recentMsg">
                            <div v-html="item.recentMsg || '&nbsp;'"></div>
                            <div v-show="item.newMsgCount>0">{{ item.newMsgCount }}</div>
                        </div>
                    </div>
                </div>
                <div class="nullData" v-show="sessionList.length==0">
                    <div v-show="!global.loading"></div>
                    <div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div>
                </div>
            </div>

            <!--联系人列表-->
            <div class="list" ref="listEle" @scroll="doHandlerListScroll">
                <div v-for="item in contactList" v-show='item.list.length>0' :key="item.clubId">
                    <div class="club-name" v-show="global.pageMode != 'club'">{{ item.clubName }}</div>
                    <ul>
                        <li v-for="record in item.list" class="list-item" @click="doClickContactRecord(record)" :key="record.chatId">
                            <div :style="{ 'background-image' : `url(${ record.friendAvatarUrl ? record.friendAvatarUrl : global.defaultManagerHeader }),url(${ item.toType != 'manager' ? global.defaultHeader : global.defaultManagerHeader })` }"></div>
                            <div>
                                <div>
                                    <div>
                                        <div>{{ record.friendName }}</div>
                                        <div :class="record.toType == 'manager' ? 'manager' : (record.techNo && record.techNo.length>0 ? 'tech' : 'none')">{{ record.toType == 'manager' ? '店长' : record.techNo }}</div>
                                    </div>
                                </div>
                                <div><div v-html="record.msgStr || '&nbsp;'"></div></div>
                                <div :class="{ active: inEdit }" @click="doClickDelRecord(record, $event)">&times</div>
                            </div>
                        </li>
                    </ul>
                </div>
                <div class="data-load-tip" :class="{ none : !showDataLoadTip }"><div>加载数据</div></div>
                <div class="finish-load-tip" :class="{ none : !showFinishLoadTip || contactList.length==0 }"><div>已经加载全部数据</div></div>
                <div class="nullData" v-show="contactList.length==0 && !isAddData">
                    <div></div><div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div>
                </div>
            </div>
        </div>

        <div class="confirm-del" :class="{ active: showConfirmDel }">
            <div>
                <div @click="doClearChatList(true)">列表及聊天记录</div>
                <div @click="doClearChatList(false)">聊天记录</div>
                <div @click="doChangeConfirmPop(false)">取消</div>
            </div>
        </div>
    </div>
</template>
<script>
import Global from '../libs/global'
import im from '../libs/im'
import Util from '../libs/util'
import MsgTimeFormatter from '../filters/msg-time-formatter'

export default {
    filters: {
        MsgTimeFormatter
    },
    data () {
        return {
            global: Global.data,
            contactList: [], // 联系人列表
            contactIndexObj: {},
            inEdit: false,
            showConfirmDel: false,

            showDataLoadTip: false, // 显示数据正在加载
            showFinishLoadTip: false, // 显示已经加载完成
            isDataAddEnd: false, // 数据是否已加载完
            isAddData: false, // 数据是否正在加载
            currPage: 0,
            pageSize: 10,
            currShow: 'message', // message or contact
            menuShow: false,
            currScrollTop: 0 // 滚动条的位置
        }
    },
    computed: {
        sessionList () { // 会话列表
            let that = this
            let global = that.global
            let imSessionList = that.$store.state.sessionList
            // console.log(imSessionList)
            let dataArr = []
            let itemObj
            for (let i = 0; i < imSessionList.length; i++) {
                itemObj = imSessionList[i]
                if (itemObj.name && itemObj.time && itemObj.recentMsg != '@@' && ((global.pageMode == 'club' && itemObj.clubId == global.clubId) || (global.pageMode != 'club' && Global.isClubInXmdAppId(itemObj.clubId)))) {
                    itemObj.headerUrl = (itemObj.header ? 'url(' + itemObj.header + '),' : '') + 'url(' + (itemObj.type == 'tech' ? global.defaultHeader : global.defaultManagerHeader) + ')'
                    dataArr.push(itemObj)
                }
            }
            if (dataArr.length > 0) {
                dataArr.sort(function (a, b) {
                    return (a.time > b.time ? -1 : 1)
                })
            }
            return dataArr
        }
    },
    mounted () {
        let that = this
        let global = that.global
        let query = global.currPage.query
        let clubId = global.pageMode == 'club' ? global.clubId : ''
        let ss = Util.sessionStorage
        let ssc = Util.removeSessionStorage
        let cacheData = ss('message-data')

        document.title = Global.setPageTitle('message') || '消息'
        cacheData = cacheData ? JSON.parse(cacheData) : null
        that.currShow = query.type || 'message'

        if (cacheData && cacheData.clubId == clubId) { // 从缓存加载数据
            that.contactList = cacheData.contactList
            that.showFinishLoadTip = cacheData.showFinishLoadTip
            that.isDataAddEnd = cacheData.isDataAddEnd
            that.currPage = cacheData.currPage
            that.$nextTick(() => {
                setTimeout(() => {
                    that.$refs.listEle.scrollTop = cacheData.top || 0
                    global.loading = false
                }, 100)
            })
        } else {
            that.queryContact()
            global.loading = false
        }

        if (cacheData) {
            ssc('message-data')
        }
    },
    methods: {
        doChangeConfirmPop (tag) {
            this.showConfirmDel = tag
        },
        // 删除聊天记录&会话记录，tag为true会删除会话记录
        doClearChatList (tag) {
            let that = this
            let global = that.global
            im.delAllMessage(global.clubId, tag)
            Util.tipShow('删除成功！')
            that.showConfirmDel = false
            that.$store.state.newMessageTotal = 0
        },
        doSwitchTab (tab) {
            let that = this
            that.currShow = tab
            that.$router.replace({ name: 'message', query: { type: tab } })
        },
        queryContact (page) {
            let that = this
            let global = that.global
            if (that.isAddData) {
                return
            }
            that.isAddData = true
            page = page || that.currPage + 1

            // 更新数据加载提示
            that.showDataLoadTip = true
            that.showFinishLoadTip = false
            that.isDataAddEnd = false
            that.$http.get('../api/v1/emchat/friendlist/{id}', {
                params: {
                    id: im.id,
                    page: page,
                    pageSize: that.pageSize,
                    channel: 'center'
                }
            }).then(res => {
                res = res.body
                if (res) {
                    res = (res.statusCode != '200') ? [] : res.respData
                    let item
                    let sessionItem
                    let listItem
                    let listItemObjIndex
                    let contactList = this.contactList
                    for (let k = 0; k < res.length; k++) {
                        item = res[k]
                        if ((global.pageMode == 'club' && item.clubId != global.clubId) || !item.clubName) {
                            continue
                        }
                        listItemObjIndex = that.contactIndexObj[item.clubId]
                        if (listItemObjIndex == undefined) {
                            listItem = {
                                clubName: item.clubName,
                                list: []
                            }
                            that.contactIndexObj[item.clubId] = contactList.length
                            contactList.push(listItem)
                        } else {
                            listItem = contactList[listItemObjIndex]
                        }
                        item.friendDescription = item.friendDescription || ''
                        sessionItem = im.getSessionObj[item.friendChatId]
                        if (sessionItem) {
                            sessionItem = sessionItem.obj
                            item.msgStr = sessionItem.recentMsg
                            item.time = sessionItem.time
                        } else {
                            item.msgStr = im.decodeExpression(item.friendDescription.replace(/<br>|<br\/>/g, ''))
                        }
                        listItem.list.push(item)
                    }
                    if (res.length == 0) {
                        that.isDataAddEnd = true
                        if (page != 1) {
                            that.showFinishLoadTip = true
                        }
                    }
                    that.currPage = page
                    that.isAddData = false
                    that.showDataLoadTip = false
                } else {
                    Util.tipShow(global.loadError)
                }
            }, () => {
                Util.tipShow(global.loadError)
            })
        },
        doHandlerListScroll () {
            let that = this
            let listEle = that.$refs.listEle
            console.log(listEle.scrollTop)
            console.log(listEle.clientHeight)
            console.log(listEle.scrollHeight)
            that.currScrollTop = listEle.scrollTop
            if (!that.isDataAddEnd && listEle.scrollTop + listEle.clientHeight * 1.4 > listEle.scrollHeight) {
                that.queryContact()
            }
        },
        // 点击会话记录，进入到聊天页面
        doClickSessionRecord (item) {
            let that = this
            im.setTalker(item)
            that.$router.push({ name: 'chat', query: { techId: item.userId, clubId: item.clubId } })
        },
        // 点击联系人记录，进入到聊天页面
        doClickContactRecord (item) {
            let that = this
            let talkerOption = {
                id: item.friendChatId,
                name: item.friendName,
                userId: item.friendUserId,
                header: item.friendAvatarUrl,
                serialNo: item.techNo,
                clubId: item.clubId,
                type: item.toType
            }
            im.setTalker(talkerOption)
            that.$router.push({ name: 'chat', query: { techId: item.friendUserId, clubId: item.clubId } })
        },
        // 菜单操作
        menuSet () {
            let that = this
            that.menuShow = !that.menuShow
        },
        // 删除最近联系人
        doClickDelRecord (item, e) {
            e.stopPropagation()
            let that = this
            let global = that.global
            that.$http.post('../api/v1/emchat/friend', {
                channel: 'center',
                currentChatId: im.id,
                showFlag: 'n',
                friendChatId: item.friendChatId
            }).then(res => {
                res = res.body
                if (res.statusCode == 200) {
                    let contactObj = that.contactList[that.contactIndexObj[item.clubId]]
                    if (contactObj) {
                        contactObj.list.splice(contactObj['list'].indexOf(item), 1)
                    }
                } else {
                    Util.tipShow(res.msg || global.loadError)
                }
            }, () => {
                Util.tipShow(global.loadError)
            })
        },
        doClickDelBtn () {
            let that = this
            that.inEdit = !that.inEdit
            that.menuShow = false
        }
    },
    beforeDestroy () {
        let that = this
        let global = that.global
        let ss = Util.sessionStorage
        ss('message-data', JSON.stringify({
            clubId: global.pageMode == 'club' ? global.clubId : '',
            contactList: that.contactList,
            showFinishLoadTip: that.showFinishLoadTip,
            isDataAddEnd: that.isDataAddEnd,
            currPage: that.currPage,
            contactIndexObj: that.contactIndexObj,
            top: that.currScrollTop
        }))
    }
}
</script>
