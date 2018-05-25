<style lang="sass">
    @import '../sass/page/chat.scss';
</style>
<template>
    <div class="page" id="chat-page">
        <div class="page-title fixed">{{ talker.type != 'manager' ? talker.name : talker.clubName }}<span v-show="talker.serialNo">[{{ talker.serialNo }}]</span>
            <router-link class="icon home" v-show="clubId" :class="{ once : talker.type!='tech' }" :to="{ path: '/' + clubId + '/home' }"></router-link>
            <router-link class="icon tech" v-show="talker.type=='tech'" :to="{ name : 'technicianDetail', query : { id : talker.userId } }"></router-link>
        </div>
        <div class="order-tip fixed" @click="doClickOrderTip()" v-show="talker.type=='tech' && talker.appointType && talker.status !='rest'">如果技师没有回应，那就立即预约吧！<div></div></div>
        <div class="order-tip fixed" v-show="talker.status =='rest'">该技师正在休假，您可以选择其他技师进行聊天</div>
        <div class="message-wrap fixed" :class="{ 'tip-pos': talker.type=='tech' && talker.appointType }" :style="{ 'bottom': wrapBottom + 'rem' }" ref="listWrap" @click="doClickMessageWrap()">
            <div class="list-wrap" ref="list">
                <MessageLoading v-if='!isLoadOver'></MessageLoading>
                <div v-else class="load-over-tip">没有更多记录了！</div>
                <MessageNode v-for="(msg, index) in talkerMessageList" :msg="msg" :gift-map-data="giftMapData" :credit-config="creditConfig" :key="index"></MessageNode>
            </div>
        </div>
        <ChatInput :credit-config="creditConfig" :gifts="gifts" :coupons="coupons" :curr-integral-account.sync="currIntegralAccount" :can-reward="canReward"></ChatInput>
        <TelDetail v-if="talker.telephone.length>0 && global.pageMode!='club'" :telephone="talker.telephone"></TelDetail>
        <CreditTip></CreditTip>
        <OrderTimePop :club-id="clubId" v-if="talker.type=='servicer'"></OrderTimePop>
    </div>
</template>
<script>
    import BScroll from 'better-scroll'
    import Global from '../libs/global'
    import eventHub from '../libs/hub'
    import im from '../libs/im'
    import Util from '../libs/util'
    import MessageNode from '../components/message-node'
    import MessageLoading from '../components/message-loading'
    import OrderTimePop from '../components/order-time-pop'
    import TelDetail from '../components/tel-detail'
    import CreditTip from '../components/credit-tip'
    import ChatInput from '../components/chat-input'
    import { mapState } from 'vuex'

    export default {
        components: {
            MessageNode, MessageLoading, OrderTimePop, TelDetail, CreditTip, ChatInput
        },
        data () {
            return {
                global: Global.data,
                clubId: '', // 技师或者管理者的clubId
                wrapBottom: 3.5,
                giftMapData: {}, // 积分礼物数据
                gifts: [],
                creditConfig: { // 积分的配置
                    creditSwitch: false
                },
                scroll: null, // BScroll
                currIntegralAccount: 0, // 当前账户积分
                canReward: false, // 是否可以打赏
                coupons: [], // 优惠券数据
                onceLoadCount: 10, // 一次加载10条
                isLoadOver: false, // 是否已经全部加载
                inLoadMore: false, // 是否正在加载历史记录
                lastedHistoryMessageId: 0, // 当前最后一条消息的ID
                wrapBottoms: {}
            }
        },
        computed: {
            ...mapState(['talker', 'talkerMessageList'])
        },
        mounted () {
            let that = this
            let global = that.global
            let query = global.currPage.query
            let talkerUserId = query.techId
            let state = that.$store.state
            if (!(talkerUserId || (global.pageMode == 'club' && query.clubId))) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            let cacheTalkerData = Util.sessionStorage('chat-talker-data')
            let cacheTalker
            if (cacheTalkerData) {
                cacheTalker = JSON.parse(cacheTalkerData)
                Util.removeSessionStorage('chat-talker-data')
            }
            if (cacheTalker && cacheTalker.userId == talkerUserId) { // 使用缓存中的talker数据
                im.setTalker(cacheTalker)
            } else {
                // 从sessionList里面setTalker
                im.ready().then(() => {
                    let talkerSessionObj = im.getSessionObj(talkerUserId, true)
                    if (talkerSessionObj) {
                        talkerSessionObj = talkerSessionObj.obj
                        im.setTalker({
                            id: talkerSessionObj.id,
                            name: talkerSessionObj.name,
                            userId: talkerSessionObj.userId,
                            serialNo: talkerSessionObj.serialNo,
                            type: talkerSessionObj.type,
                            header: talkerSessionObj.header,
                            clubId: talkerSessionObj.clubId || query.clubId,
                            status: 'free',
                            clubName: '',
                            inviteCode: '',
                            isAppointment: false,
                            isPhoneAppointment: false,
                            appointType: '',
                            telephone: []
                        })
                        that.init()
                        if (that.talker.type != 'manager') {
                            that.getTechDetail(talkerUserId)
                        } else {
                            that.initClubInfo()
                        }
                    } else {
                        if (state.talker.userId == talkerUserId && state.talker.type == 'manager') {
                            that.init()
                            if (global.pageMode != 'club') { // 依据clubId查询会所信息
                                that.initClubInfo()
                            }
                        } else {
                            that.getTechDetail(talkerUserId)
                        }
                    }
                })
            }
            eventHub.$on('update-credit-account', that.updateCreditAccount)
            eventHub.$on('message-wrap-to-bottom', that.scrollToBottom)
            eventHub.$on('change-wrap-height', that.chageWrapHeight)
            eventHub.$on('show-chat-pictures', that.showChatPictures)
            eventHub.$on('do-start-servicer-order', that.doStartServicerOrder)
        },
        methods: {
            getTechDetail (talkerUserId) {
                let that = this
                let talker = that.talker
                let global = that.global
                let errorInfo = '未能获取技师信息，技师可能已离开会所！'
                that.$http.get('../api/v2/club/technician/{techId}', {
                    params: {
                        techId: talkerUserId, needServiceInfo: 'N', needAppointConfig: 'Y', needFavorite: 'Y'
                    }
                }).then(res => {
                    res = res.body
                    if (res.id) {
                        let info = res.info
                        let oldTalkerId = talker.id
                        that.clubId = info.clubId
                        let setObj = {
                            id: res.emchatId,
                            name: info.name || global.defaultTechName,
                            userId: talkerUserId,
                            serialNo: info.serialNo || '',
                            type: info.serviceStatus == 'Y' ? 'servicer' : 'tech',
                            header: info.avatarUrl || global.defaultHeader,
                            status: info.status,
                            clubId: that.clubId,
                            clubName: res.clubName,
                            inviteCode: info.inviteCode,
                            isAppointment: res.appointment != 'N',
                            isPhoneAppointment: res.phoneAppointment != 'N',
                            appointType: res.appointType,
                            telephone: (res.telephone ? res.telephone.split(',') : [])
                        }
                        im.setTalker(setObj)
                        let updateSessionOption = {
                            id: setObj.id, name: setObj.name, clubId: that.clubId, serialNo: setObj.serialNo
                        }
                        if (info.avatarUrl) {
                            updateSessionOption.header = info.avatarUrl
                        }
                        if (info.avatar) {
                            updateSessionOption.avatar = info.avatar
                        }
                        im.updateSessionList(updateSessionOption, false) // 更新改技师的信息
                        if (!oldTalkerId) {
                            that.init()
                        } else {
                            global.loading = false
                        }
                    } else {
                        Util.tipShow(errorInfo)
                        return that.$router.back()
                    }
                }, () => {
                    Util.tipShow(errorInfo)
                    return that.$router.back()
                })
            },
            init () {
                let that = this
                let global = that.global
                let params = global.currPage.query
                let talker = that.$store.state.talker
                that.clubId = params.clubId || global.clubId
                // 计算出wrap list在各种状态的bottom定位
                that.wrapBottoms = {
                    normal: 3.5, expression: 8.8, gift: 11.5
                }
                that.wrapBottom = that.wrapBottoms.normal

                that.initMessageList() // 获取消息列表
                that.initCreditConfig() // 获取积分系统开关

                if (talker.type != 'manager') {
                    that.initCouponData() // 获取优惠券数据
                    Global.queryClubTechRewardStatus(that.clubId).then(res => { that.canReward = res }) // 查询会所是否关闭打赏
                }

                if (global.pageMode != 'club') { // 依据clubId查询会所信息
                    that.initClubInfo()
                }

                that.$nextTick(() => {
                    let listWrap = that.$refs.listWrap
                    if (listWrap) {
                        that.scroll = new BScroll(listWrap, {
                            pullDownRefresh: { threshold: 40, stop: 5 },
                            click: true
                        })
                        that.scrollToBottom()

                        // 如果消息列表中有图片，列表高度在图片加载完会改变，需要再次scrollToBottom
                        setTimeout(() => { that.scrollToBottom() }, 350)

                        // 下拉刷新的效果
                        that.scroll.on('touchEnd', function (pos) {
                            if (pos.y > 10 && !that.isLoadOver) {
                                if (!that.inLoadMore) {
                                    that.inLoadMore = true // 防止重复加载数据
                                    setTimeout(() => {
                                        that.loadMoreData()
                                        setTimeout(() => {
                                            that.scroll.refresh()
                                            that.inLoadMore = false
                                        }, 300)
                                    }, 300)
                                }
                            }
                        })
                    }
                })

                im.updateSessionList({ id: talker.id, newMsgCount: 0 }, false) // 更新新消息数目
                im.updateTotalNewMsgCount() // 计算总的新消息数目
                global.loading = false
            },
            // 初始化消息列表
            initMessageList () {
                let that = this
                let store = that.$store
                let talker = store.state.talker
                store.commit('clearTalkerMessageList')
                im.ready().then(() => {
                    im.getLastedMessage(talker.id, message => {
                        if (message) {
                            that.lastedHistoryMessageId = message.id
                            that.loadMoreData(true)
                        } else {
                            that.isLoadOver = true
                            that.showWelcomeMessage()
                        }
                    })
                })
            },
            // 获取会所信息
            initClubInfo () {
                let that = this
                if (that.clubId) {
                    that.$http.get('../api/v2/club/{clubId}/clubName', {
                        params: { clubId: that.clubId }
                    }).then(res => {
                        res = res.body
                        let options = { clubName: res.name }
                        let oldTalkerClubName = that.talker.clubName
                        if (that.talker.type == 'manager') {
                            options.header = res.logo || './static/images/defaultManagerLogo.png'
                        }
                        im.setTalker(options)
                        if (res.logo) {
                            im.updateSessionList({ id: that.talker.id, header: res.logo }, false) // 更新管理者的头像
                        }
                        if (!oldTalkerClubName) {
                            that.showWelcomeMessage()
                        }
                    })
                } else {
                    im.setTalker({
                        clubName: '连锁管理者'
                    })
                }
            },
            // 初始化积分配置
            initCreditConfig () {
                let that = this
                Global.getClubSwitches(that.clubId).then(res => {
                    that.creditConfig = res
                    if (res.creditSwitch) {
                        that.$http.get('../api/v2/credit/gift/list').then(giftRes => {
                            giftRes = giftRes.body.respData
                            if (giftRes) {
                                let list = {}
                                for (let i = 0; i < giftRes.length; i++) {
                                    list[giftRes[i]['id']] = { url: giftRes[i]['gifUrl'] }
                                }
                                that.giftMapData = list
                                that.gifts = giftRes
                            }
                        })
                        that.updateCreditAccount() // 获取当前账户积分
                    }
                })
            },
            // 获取优惠券数据
            initCouponData () {
                let that = this
                that.$http.get('../api/v1/profile/redpack/list', {
                    params: { clubId: that.clubId }
                }).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        let couponData = res.respData.coupons || []
                        if (couponData.length > 0) {
                            let lastObj = couponData[couponData.length - 1]
                            if (lastObj.actTitle.length > 7) {
                                lastObj.actTitle = lastObj.actTitle.substr(0, 7) + '...'
                            }
                        }
                        that.coupons = couponData
                    }
                })
            },
            getHeight () {
                return document.documentElement.clientHeight
            },
            // 下拉加载更多的历史消息
            loadMoreData (isFirstLoad) {
                let that = this
                let talker = that.$store.state.talker
                im.getMessageList({
                    chatId: talker.id,
                    endId: that.lastedHistoryMessageId,
                    pageSize: that.onceLoadCount
                }, list => {
                    if (list.length < that.onceLoadCount) {
                        that.isLoadOver = true
                    }
                    if (list.length > 0) {
                        that.lastedHistoryMessageId = list[list.length - 1].id - 1 // 下次加载的消息<=lastedHistoryMessageId
                        that.$store.commit('addMessagesToCurrList', list)
                    }
                    if (isFirstLoad) { // 显示欢迎语句
                        that.showWelcomeMessage()
                    }
                })
            },
            // 显示欢迎语句
            showWelcomeMessage () {
                let that = this
                let talker = that.talker
                let restText = '很抱歉，该技师目前正在休假中，可能无法及时回复您的消息，有问题您可以在线留言，技师看到会第一时间回复您。您也可以选择其他技师进行聊天，谢谢~'
                if (talker.clubName && talker.type != 'servicer' && that.talkerMessageList.length == 0) {
                    that.$store.commit('addWelcomeMessage', {
                        chatId: talker.id,
                        data: talker.status == 'rest' ? restText : talker.clubName + '欢迎您！',
                        isRevoke: false,
                        type: 'text',
                        isSend: false,
                        time: Math.round((+new Date()) / 1000)
                    })
                }
            },
            // 点击预约（提示）
            doClickOrderTip () {
                let that = this
                let global = that.global
                let talker = that.talker
                let appointType = talker.appointType

                if (appointType == 'phone') { // 电话预约
                    if (talker.telephone.length == 0) {
                        Util.tipShow('暂无预约电话！')
                    } else {
                        eventHub.$emit('change-tel-detail', true) // 弹出电话界面
                    }
                } else if (appointType == 'paid' || appointType == 'paid_full') { // 付费预约
                    if (!global.userAgent.isWX) {
                        if (Global.checkAccess('confirmOrder')) {
                            Util.tipShow('此会所需支付预约，请在微信中打开！')
                        } else {
                            Util.tipShow('此会所未开通付费预约功能！')
                        }
                    } else {
                        that.$router.push({ name: 'technicianDetail', query: { id: talker.userId } })
                    }
                } else if (appointType == 'appoint') { // 普通预约
                    that.$router.push({ name: 'confirmOrder', query: { techId: talker.userId, clubId: that.clubId } })
                } else {
                    Util.tipShow('此会所不支持线上预约！')
                }
            },
            // 更新当前账户积分
            updateCreditAccount (callback) {
                let that = this
                Global.getCreditAccount(that.clubId).then(res => {
                    that.currIntegralAccount = (res[0] ? res[0].amount : 0)
                    if (callback) {
                        callback()
                    }
                })
            },
            // 改变wrap list的高度
            chageWrapHeight (type) {
                let that = this
                type = type || 'normal'
                that.wrapBottom = that.wrapBottoms[type]
                setTimeout(() => {
                    that.scroll.refresh()
                    // that.scrollToBottom()
                }, 0)
            },
            // 滚动到底部
            scrollToBottom (option) {
                let that = this
                let wrap = that.$refs.listWrap
                let list = that.$refs.list
                let scroll = that.scroll
                if (!option) {
                    option = {}
                }
                let refresh = option.refresh !== false
                if (scroll && wrap && list) {
                    if (refresh) {
                        scroll.refresh()
                    }
                    // console.log('list.offsetHeight：' + list.offsetHeight)
                    // console.log('wrap.offsetHeight：' + wrap.offsetHeight)
                    if (list.offsetHeight > wrap.offsetHeight) {
                        setTimeout(() => {
                            if (parseInt(wrap.style.top) != scroll.maxScrollY) {
                                // console.log('scroll to：' + scroll.maxScrollY)
                                scroll.scrollTo(0, scroll.maxScrollY, (option.time || 300), false)
                            }
                        }, (refresh ? 200 : 1))
                    }
                }
            },
            // 点击消息区域，使消息输入框失去焦点
            doClickMessageWrap () {
                let that = this
                let inputEl = document.querySelector('.chat-input-wrap>.input>div')
                if (inputEl) {
                    inputEl.blur()
                }
                eventHub.$emit('change-tool-state', '')
                that.chageWrapHeight()
            },
            // 将当前消息列表中的图片在另外一个页面展示
            showChatPictures (currPicUrl) {
                let that = this
                let list = that.$store.state.talkerMessageList
                let pics = []
                let currIndex = 0
                let pageParams = {}

                list.forEach(msg => {
                    if (msg.type == 'image') {
                        if (msg.data.url == currPicUrl) {
                            currIndex = pics.length
                        }
                        pics.push(msg.data.url)
                    }
                })
                if (pics.length > 0) {
                    let ss = Util.sessionStorage
                    ss('chat-pics', JSON.stringify(pics))
                    pageParams.index = currIndex
                    // if (talker.type == 'manager') {
                    //     ss('chat-pics-talker', JSON.stringify({
                    //         name: talker.name,
                    //         id: talker.id,
                    //         userId: '',
                    //         userNo: '',
                    //         type: 'manager',
                    //         header: talker.header,
                    //         avatar: talker.avatar,
                    //         clubId: talker.clubId,
                    //         clubName: talker.clubName || '',
                    //         inviteCode: '',
                    //         isAppointment: false,
                    //         isPhoneAppointment: false,
                    //         appointType: '',
                    //         telephone: [],
                    //         messageList: []
                    //     }))
                    // }
                    that.$router.push({ name: 'chatPictures', query: pageParams })
                }
            },
            // 发起客服预约
            doStartServicerOrder (appointTimeStr) {
                let that = this
                let talker = that.talker
                let appointTime = 0
                if (appointTimeStr) {
                    appointTime = new Date(appointTimeStr.replace(/-/g, '/')).getTime()
                }
                im.doSendOrderStartMessage({
                    to: talker.id,
                    tag: 'customer_service',
                    data: {
                        orderTechId: '',
                        orderTechName: '',
                        orderTechAvatar: '',
                        orderServiceId: '',
                        orderServiceName: '',
                        orderServiceTime: appointTime, // 到店时间
                        orderServiceDuration: 0,
                        orderServicePrice: 0,
                        orderCustomerName: '',
                        orderCustomerPhone: '',
                        orderAppointType: talker.appointType
                    }
                })
            }
        },
        beforeDestroy () { // 销毁数据
            let that = this
            eventHub.$off('update-credit-account', that.updateCreditAccount)
            eventHub.$off('message-wrap-to-bottom', that.scrollToBottom)
            eventHub.$off('change-wrap-height', that.chageWrapHeight)
            eventHub.$off('show-chat-pictures', that.ShowChatPictures)
            eventHub.$off('do-start-servicer-order', that.doStartServicerOrder)
            if (that.scroll) {
                that.scroll.off('touchEnd')
            }
            that.talker.id = ''
        }
    }
</script>
