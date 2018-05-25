<style lang="sass">
    @import '../sass/page/contacts.scss';
</style>
<template>
    <div class="page" id="contacts-page">
        <PageTitle title-text="最近联系人"><div class="edit-title" @click="doClickEditBtn()">{{ inEdit ? "完成" : "编辑"}}</div></PageTitle>
        <div class="list" ref="listEle" :style="{ height : (global.winHeight-2.611*global.winScale*16)+'px' }" @scroll="doHandlerListScroll()">
            <div class="list-item" v-for="item in dataList" :key="item.friendUserId" @click="doClickRecord(item)">
                <div :style="{ backgroundImage : 'url('+(item.friendAvatarUrl || (item.toType == 'manager' ? global.defaultClubLogo : global.defaultHeader ))+')' }"></div>
                <div>
                    <div>{{ item.friendName}}<span v-if="item.techNo"><span>[</span>{{ item.techNo }}<span>]</span></span></div>
                    <div>{{ item.msg }}</div>
                    <div>{{ item.chatDate | MsgTimeFormatter }}</div>
                </div>
                <div :class="{ active : inEdit }" @click="doClickDelRecord(item,$event)">删除记录</div>
            </div>
            <div class="data-load-tip" :class="{ none : !showDataLoadTip }"><div>加载数据</div></div>
            <div class="finish-load-tip" :class="{ none : !showFinishLoadTip || dataList.length==0 }"><div>已经加载全部数据</div></div>
            <div class="nullData" v-show="dataList.length==0 && !isAddData">
                <div></div>
                <div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div>
            </div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import IM from '../libs/im'
    import MsgTimeFormatter from '../filters/msg-time-formatter'
    import PageTitle from '../components/page-title'

    export default {
        components: {
            PageTitle
        },
        filters: {
            MsgTimeFormatter: MsgTimeFormatter
        },
        data () {
            return {
                global: Global.data,
                im: IM,
                dataList: [],
                currPage: 0,
                pageSize: 10,
                sessionList: null,
                inEdit: false,
                showDataLoadTip: false, // 显示数据正在加载
                showFinishLoadTip: false, // 显示已经加载完成
                isDataAddEnd: false, // 数据是否已加载完
                isAddData: false // 数据是否正在加载
            }
        },
        created () {
            var that = this
            that.sessionList = that.im.getSessionList()
            that.queryRecord()
            that.global.loading = false
            document.title = '联系人'
        },
        methods: {
            queryRecord (page) {
                var that = this
                var global = that.global
                var sessionList = that.sessionList
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
                        id: that.im.id,
                        page: page,
                        pageSize: that.pageSize,
                        channel: 'center'
                    }
                }).then(function (res) {
                    res = res.body
                    if (res) {
                        res = (res.statusCode != '200') ? [] : res['respData']
                        var item, sessionItem
                        for (var i = 0; i < res.length; i++) {
                            item = res[i]
                            if (global.pageMode == 'club' && (!item.clubId || item.clubId != global.clubId)) {
                                continue
                            }
                            item.chatDate = Util.stringToDate(item.chatDate)
                            sessionItem = sessionList[item.friendChatId]
                            item.msg = item.friendDescription || ''
                            if (sessionItem) {
                                item.msg = that.im.decodeExpression(sessionItem.msg.data.replace(/<br>|<br\/>/g, ''))
                                item.chatDate = sessionItem.time
                            }
                            that.dataList.push(res[i])
                        }
                        if (res.length < that.pageSize) {
                            that.isDataAddEnd = true
                            that.showFinishLoadTip = true
                        }
                        that.currPage = page
                        that.isAddData = false
                        that.showDataLoadTip = false
                    } else {
                        Util.tipShow(global.loadError)
                    }
                }, function () {
                    Util.tipShow(global.loadError)
                })
            },
            doHandlerListScroll () {
                var that = this
                var listEle = that.$refs.listEle
                if (!that.isDataAddEnd && listEle.scrollTop + listEle.clientHeight * 1.4 > listEle.scrollHeight) {
                    that.queryRecord()
                }
            },
            doClickEditBtn () {
                var that = this
                that.inEdit = !that.inEdit
            },
            doClickRecord (item) {
                var that = this
                var techId = item.friendUserId
                var im = IM
                if (item.toType == 'manager') {
                    var talker = im.talker
                    talker.name = item.name // 对方名称
                    talker.id = item.friendChatId // 对方环信ID
                    talker.userId = ''
                    talker.userNo = ''
                    talker.userType = 'manager'
                    talker.header = item.friendAvatarUrl // 对方头像url
                    talker.avatar = item.avatar // 对方头像编号
                    talker.clubId = item.clubId // 对方所在的clubID
                    talker.clubName = '' // 对方所在的clubName
                    talker.inviteCode = ''
                    talker.isAppointment = false
                    talker.isPhoneAppointment = false
                    talker.appointType = ''
                    talker.telephone = []
                    talker.messageList = []
                }
                that.$router.push({name: 'chat', query: {techId: techId, clubId: item.clubId}})
            },
            doClickDelRecord (item, e) {
                var that = this
                var im = that.im
                e.stopPropagation()
                that.$http.post('../api/v1/emchat/friend', {
                    channel: 'center',
                    currentChatId: im.id,
                    showFlag: 'n',
                    friendChatId: item.friendChatId
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        im.delMessageRecord(item.friendChatId, item.friendUserId)
                        var itemIndex = that.dataList.indexOf(item)
                        that.dataList.splice(itemIndex, 1)
                        Util.tipShow('删除成功！')
                    } else {
                        Util.tipShow(res.msg || '操作失败！')
                    }
                })
            }
        }
    }
</script>
