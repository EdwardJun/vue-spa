import Vue from 'vue'
import Util from '../libs/util'
import im from '../libs/im'
import eventHub from '../libs/hub'

// 全局的数据
const imgPathPrefix = './static/images/' // 默认图片路径前缀
const win = window
const doc = document
const wx = require('weixin-js-sdk')

export default {
    data: {
        baseWidth: null, // 页面加载时窗口初始宽度，用于计算页面 scale
        winWidth: null, // 页面内容容器的当前宽度px --固定20rem
        winHeight: null, // 页面的高度 px
        winScale: 1, // 页面当前的font scale
        bodyScrollTop: 0, // 当前页面body元素的滚动条位置
        currPage: { // 当前页面名称、参数
            name: '', query: null
        },
        lastPage: { // 上一次的页面的名称、参数
            name: '', query: null
        },
        router: null, // Vue路由实例对象
        loginPage: '', // 登录之后跳转的页面名称
        loginPageQuery: {}, // 登录之后跳转的页面参数
        prefixPathname: '', // 链接前缀，如location.href.split('#')[0]

        showAppMenu: false, // 是否显示底部菜单--club模式下
        show9358Menu: false, // 9358公众号模式下
        loading: false, // 是否显示loading效果
        pageMode: 'club', // 当前页面模式，club--会所网站 小摩豆--公众号
        isClubOnline: true, // 当前会所是否在线--club模式下
        sessionType: 'web',
        showServiceBtn: false, // 是否显示客服按钮

        token: '', // 用户token
        userId: '', // 用户ID
        userInBlicklist: false, // 用户是否在黑名单中
        userAvatar: '', // 用户头像ID
        userHeader: '', // 用户头像URL
        userTel: '', // 用户手机号码
        userName: '', // 用户名名称
        isLogin: false, // 用户是否登录
        currLngx: '', // 用户地理位置坐标-经度
        currLaty: '', // 用户地理位置坐标-纬度
        openId: '', // 用户微信OpenId
        chatId: '', // 用户聊天ID
        chatToken: '', // 用户聊天登录令牌
        xmdAppId: '', // 公众号的标识
        clubsInAppId: [], // 当前xmdAppId下的会所
        appId: '',
        eventMask: false, // 一个全局的事件屏蔽层，当有支付等不能让用户操作界面时设置为true
        // -------------------------------------------用户登录小摩豆公众号的额外信息
        authCode: '', // 授权码
        loginChanel: '',
        sessionId: '',
        clubInviteCode: '',
        techSerialNo: '',
        techInviteCode: '',
        clubSource: '',
        loginChanelClubId: '',
        isFollowed: false,  // 是否关注公众号的判断值

        userAgent: { // 浏览器UA
            isWX: false, // 是否是微信
            isAliPay: false, // 是否是支付宝
            isiPhone: false // 是否是iphone
        },
        accessMenus: {}, // 会所已开通的功能

        // ----------------------------------------------默认的一些设置
        defaultClubLogo: imgPathPrefix + 'logo_default.jpg', // 默认的club logo
        defaultHeader: imgPathPrefix + 'defaultUserLogo.png', // 默认的头像
        defaultCouponBg: imgPathPrefix + 'coupon_icon.png',
        defaultManagerHeader: imgPathPrefix + 'defaultManagerLogo.png', // 管理者的默认头像
        defaultTechName: '小摩豆技师', // 默认的技师名字
        defaultName: '散客', // 默认的用户名称
        defaultBannerImgUrl: imgPathPrefix + 'banner_default.jpg', // 默认的banner图
        defaultServiceItemImgUrl: imgPathPrefix + 'serviceItem_default.jpg', // 默认的服务项目图
        defaultGiftImg: 'gift_default.png', // 默认的积分礼物图片
        loadError: '数据请求失败！', // 请求数据出错时的默认提示语
        visitError: '页面缺少参数！', // 页面缺少访问参数的提示语

        // -----------------------------------------------club模式有效
        clubId: null, // 当前会所ID
        clubHomeConfig: {}, // 当前会所基本设置
        clubLogoUrl: null, // 当前会所logo-club模式有效
        clubName: '', // 当前会所名称
        clubTelephone: [], // 当前会所联系电话
        clubCfg: { // 当前会所的一些配置信息、开关
            accountSwitch: null, // 账户系统
            creditSwitch: false, // 积分系统是否开启
            diceGameTimeout: 24 * 60 * 60 * 1000, // 骰子游戏超时时间
            diceGameSwitch: false, // 骰子游戏是否开启
            paidCouponSwitch: false, // 点钟券
            paidCouponFee: 0, // 点钟券手续费
            paidOrderSwitch: false, // 付费预约开关
            paidOrderFee: 0 // 付费预约手续费
        },
        reminds: { // 各种券提醒数目
            coupon: 0, // 优惠券
            itemLimit: 0, // 限时抢
            itemCard: 0, // 特惠商城
            order: 0, // 预约
            itemCoupon: 0, // 项目券
            orderCoupon: 0, // 点钟券
            total: 0
        },
        shareConfigOption: {}, // 全局的分享option
        techList: [], // 暂存的技师列表页面数据
        techListID: {}, // 暂存的技师列表ID值
        pageData: {} // 缓存(在内存)的页面数据，切换回来的时候可以恢复状态
    },

    // 页面初始化之前处理逻辑
    beforeInit () {
        let uaStr = navigator.userAgent.toLowerCase()
        let that = this
        let data = that.data
        let ua = data.userAgent

        ua.isWX = /micromessenger/.test(uaStr)
        ua.isiPhone = /iPhone/i.test(uaStr)
        ua.isAliPay = /alipay/i.test(uaStr)
        if (ua.isWX || ua.isAliPay) {
            data.sessionType = '9358' // 在微信中，sessionType设置为9358
        }
        if (ua.isAliPay) { // 增加alipayjsapi脚本
            let js = document.createElement('script')
            js.src = './static/lib/alipayjsapi.min.js'
            document.querySelector('head').appendChild(js)
        }

        // 获取clubID
        let tArr = location.href.toString().match(/\/(\d{18,18})\/?/)
        if (tArr && tArr[1]) {
            data.pageMode = 'club'
            data.clubId = tArr[1]
        } else {
            data.pageMode = '9358'
        }

        // 获取域名前缀
        let prefixPathname = location.href.split('#')[0]
        if (prefixPathname.indexOf('?') > 0) {
            prefixPathname = prefixPathname.split('?')[0]
        }
        data.prefixPathname = prefixPathname + '?o=xmd'
    },

    // 初始化一些数据
    init () {
        let that = this
        let data = that.data
        let pageParams = Util.getPageParams()
        let ls = Util.localStorage
        let ss = Util.sessionStorage

        data.token = ls('token') || ls('userToken')
        data.userId = ls('userID')
        data.userHeader = ls('userHeader') || data.defaultHeader
        data.userAvatar = ls('userAvatar')
        data.userTel = ls('userTel')
        data.userName = ls('userName') || data.defaultName
        data.currLaty = ss('currLaty')
        data.currLngx = ss('currLngx')
        data.chatId = ls('chatId')
        data.chatToken = ls('chatToken')
        data.authCode = pageParams.code
        data.xmdAppId = pageParams.xmdAppId
        data.appId = pageParams.appId

        data.isFollowed = ls('isFollowed') == 1
        data.loginChanel = ss('loginChanel')
        data.loginChanelClubId = ss('loginChanelClubId')
        data.openId = ls('openId')
        data.sessionId = ls('sessionId')
        data.clubInviteCode = ss('clubInviteCode')
        data.techSerialNo = ss('techSerialNo') || pageParams.techCode || ''
        data.techInviteCode = ss('techInviteCode') || pageParams.techInviteCode || ''

        if (data.xmdAppId) {
            data.prefixPathname += 'xmdAppId=' + data.xmdAppId
        }

        // 因需知道此用户是否已关注小摩豆公众号，所以只要是从微信进入系统，全部需走授权
        return new Promise(resolve => {
            let ua = data.userAgent
            if (ua.isWX) { // 微信
                that.initInWx(resolve)
            } else if (ua.isAliPay) { // 支付宝
                that.initInAlipay(resolve)
            } else if (data.token && data.userId) { // 判定token是否有效
                that.checkTokenValid(resolve)
            } else {
                that.clearLoginInfo()
                resolve()
            }
        })
    },

    // 在微信里面的初始化
    initInWx (resolve) {
        let that = this
        let data = that.data
        let pageParams = Util.getPageParams()
        let ls = Util.localStorage
        let lsc = Util.removeLocalStorage
        let ss = Util.sessionStorage
        if (!data.loginChanel || /personal/.test(location.hash)) {
            if (!data.authCode) { // 重新授权
                return that.getOauthCode('9358', '9358', 'base')
            } else {
                let currUrl = location.href
                Vue.http.post('../api/v2/wx/9358/index', {
                    openid: data.openId || '',
                    code: data.authCode,
                    scope: /personal/.test(location.hash) ? 'snsapi_userinfo' : 'snsapi_base',
                    state: /inviteActivity/.test(currUrl.substring(currUrl.lastIndexOf('/'))) ? 'inviteGift' + pageParams.sceneId : 'clubList',
                    sessionId: data.sessionId || ''
                }).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        let wxInfo = res.wxUserInfo
                        let loginData = res.loginChanelData

                        data.token = loginData.token
                        data.userId = loginData.userId
                        data.chatId = loginData.emchatId
                        data.chatToken = loginData.emchatPassword
                        data.userName = wxInfo.nickname || loginData.userName || data.defaultName
                        data.userHeader = wxInfo.headimgurl
                        data.openId = wxInfo.openid
                        data.sessionId = wxInfo.sessionId
                        data.loginChanelClubId = loginData.clubId
                        data.loginChanel = loginData.loginChannel
                        data.clubInviteCode = loginData.clubInviteCode
                        data.techSerialNo = loginData.techSerialNo
                        data.techInviteCode = loginData.techInviteCode
                        data.currLngx = loginData.lngx
                        data.currLaty = loginData.laty
                        data.isLogin = loginData.isLogin == 'Y'
                        data.isFollowed = wxInfo.subscribe == 1 // 是否已经关注小摩豆公众号

                        ls('token', data.token)
                        ls('userID', data.userId)
                        ls('userName', data.userName)
                        ls('openId', data.openId)
                        ls('sessionId', data.sessionId)
                        ls('isFollowed', wxInfo.subscribe)
                        ls('chatId', data.chatId)
                        ls('chatToken', data.chatToken)
                        ss('loginChanelClubId', data.loginChanelClubId)
                        ss('loginChanel', data.loginChanel)
                        ss('clubInviteCode', data.clubInviteCode)
                        ss('techSerialNo', data.techSerialNo)
                        ss('techInviteCode', data.techInviteCode)
                        ss('currLngx', data.currLngx)
                        ss('currLaty', data.currLaty)

                        if (!wxInfo.headimgurl) {
                            that.updateUserNameAndHeader()
                        }

                        if (loginData.telephone) {
                            data.userTel = loginData.telephone
                            ls('userTel', data.userTel)
                        } else {
                            data.userTel = null
                            lsc('userTel')
                        }

                        if (data.userId) {
                            that.initChat()
                        }
                        if (data.clubId) {
                            that.bindClubTech(data.token)
                        }
                        that.queryReminds()
                        that.doQueryClubsInAppId()
                    } else if (res.statusCode == 935801) {
                        that.getOauthCode('9358', '9358', 'base')
                    } else if (res.statusCode == 404) {
                        that.clearLoginInfo()
                        location.hash = '#/login'
                    } else {
                        Util.tipShow(res.msg || 'wx/9358/index接口异常！')
                    }
                    resolve()
                })
            }
        } else {
            data.isLogin = true
            that.initChat()
            that.queryReminds()
            that.doQueryClubsInAppId()
            resolve()
        }
    },

    // 在支付宝里面的初始化
    initInAlipay (resolve) {
        let that = this
        let data = that.data
        let pageParams = Util.getPageParams()
        let ls = Util.localStorage
        let ss = Util.sessionStorage
        if (!data.loginChanel || /personal/.test(location.hash)) {
            data.authCode = pageParams.auth_code
            if (!data.authCode) { // 请求授权
                return that.getOauthCodeOfAlipay('9358', 'userInfo')
            } else {
                Vue.http.post('../api/v2/alipay/oauth2/index', {
                    auth_code: data.authCode,
                    scope: /personal/.test(location.hash) ? 'auth_user' : 'auth_base',
                    state: '9358'
                }).then(res => {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        let loginData = res.loginChanelData
                        data.token = loginData.token
                        data.userId = loginData.userId
                        data.chatId = loginData.emchatId
                        data.chatToken = loginData.emchatPassword
                        data.userName = loginData.userName || data.defaultName
                        data.userHeader = data.defaultHeader
                        data.loginChanelClubId = loginData.clubId
                        data.loginChanel = loginData.loginChannel
                        data.clubInviteCode = loginData.clubInviteCode
                        data.techSerialNo = loginData.techSerialNo
                        data.techInviteCode = loginData.techInviteCode
                        data.currLngx = loginData.lngx
                        data.currLaty = loginData.laty
                        data.isLogin = loginData.isLogin == 'Y'

                        ls('token', data.token)
                        ls('userID', data.userId)
                        ls('userName', data.userName)
                        ls('chatId', data.chatId)
                        ls('chatToken', data.chatToken)
                        ls('userHeader', data.userHeader)
                        ss('loginChanelClubId', data.loginChanelClubId)
                        ss('loginChanel', data.loginChanel)
                        ss('clubInviteCode', data.clubInviteCode)
                        ss('techSerialNo', data.techSerialNo)
                        ss('techInviteCode', data.techInviteCode)
                        ss('currLngx', data.currLngx)
                        ss('currLaty', data.currLaty)

                        if (loginData.userId) {
                            that.initChat()
                            that.queryReminds()
                        }
                        if (data.clubId) {
                            that.bindClubTech(data.token)
                        }
                    } else {
                        Util.tipShow(res.msg || 'alipay/oauth2/index接口调用失败！')
                    }
                    resolve()
                })
            }
        } else {
            data.isLogin = true
            that.initChat()
            that.queryReminds()
            resolve()
        }
    },

    // 判定token是否有效
    checkTokenValid (resolve) {
        let that = this
        let data = that.data
        Vue.http.get('../api/v1/check_login/' + data.sessionType + '/' + data.token).then(res => {
            res = res.body
            if (res.msg !== 'Y') {
                that.clearLoginInfo()
            } else {
                data.isLogin = true
                that.initChat()
                that.updateUserNameAndHeader()
                that.queryReminds() // 查询券的提醒数目
                that.doQueryClubsInAppId()
            }
            resolve()
        })
    },

    // 初始化会所基础数据
    getClubData () {
        let that = this
        let data = that.data
        return new Promise(resolve => {
            if (data.clubId) {
                that.doStatUserVisitClub() // 增加统计
                Promise.all([Vue.http.get('../api/v2/club/menu/all', {params: {clubId: data.clubId}}), Vue.http.get('../api/v2/club/' + data.clubId + '/clubName'), Vue.http.get('../api/v2/user/website/setting', {params: {clubId: data.clubId}})]).then((res) => {
                    that.doHandleClubMenuAuth(res[0]) // 会所菜单权限
                    that.doHandlerClubName(res[1]) // 会所名称
                    that.doHandlerClubHomeData(res[2]) // 会所首页配置信息
                    resolve()
                })
            } else {
                resolve()
            }
        })
    },

    // 获取会所权限列表
    doHandleClubMenuAuth (res) {
        let that = this
        let data = that.data
        res = res.body
        if (res.statusCode == 200) {
            res = res.respData
            that.handlerMenuAuth(res.enabledResourcesIds || [], res.switchOffResourcesIds, res.menuList, data.accessMenus)
        }
    },

    // 查询XmdAppId下的会所
    doQueryClubsInAppId () {
        const that = this
        const data = that.data
        if (data.pageMode == '9358' && data.xmdAppId) {
            Vue.http.get('../api/v2/club/wx/clubIds').then(res => {
                res = res.body
                if (res.statusCode == 200) {
                    data.clubsInAppId = res.respData || []
                }
            })
        }
    },

    // 判定会所ID是否在clubsInApp里面
    isClubInXmdAppId (clubId) {
        const that = this
        const data = that.data
        if (data.pageMode == '9358' && data.xmdAppId) {
            for (let i = 0; i < data.clubsInAppId.length; i++) {
                if (data.clubsInAppId[i] == clubId) {
                    return true
                }
            }
            return false
        }
        return true
    },

    // 获取会所名称logo
    doHandlerClubName (res) {
        let that = this
        let data = that.data
        res = res.body
        if (res.statusCode != 401) {
            data.clubLogoUrl = res.logo || data.defaultClubLogo
            data.clubName = res.name
            data.clubTelephone = res.telephone ? res.telephone.split(',') : []
            data.isClubOnline = res.status == 'online'

            data.shareConfigOption = {
                title: data.clubName + '欢迎您',
                desc: '选个技师，选个项目，给身体放个假，这里太合适不过了。',
                link: data.prefixPathname + '#/' + data.clubId + '/home',
                imgUrl: data.clubLogoUrl
            }
        }
    },

    // 获取会所首页配置数据
    doHandlerClubHomeData (res) {
        let that = this
        let data = that.data
        if (res.body.statusCode == 200) {
            data.clubHomeConfig = res.body.respData
        }
    },

    // 用户访问会所的统计
    doStatUserVisitClub () {
        let that = this
        let data = that.data
        let prevSaveTime = Util.localStorage('prev_save_time') || ''
        let timeParam = Util.getPageParams('_t')
        if (prevSaveTime == '' || (!timeParam && prevSaveTime == timeParam)) {
            if (prevSaveTime == '' || prevSaveTime == timeParam) {
                Util.localStorage('prev_save_time', prevSaveTime)
            }
            let clubSource = Util.getPageParams('clubsource') || 'link'
            if (clubSource && /wifi/.test(clubSource)) {
                clubSource = 'wifi'
            }
            data.clubSource = clubSource
            let visitParams = {
                clubId: data.clubId,
                clubName: data.clubName,
                source: clubSource,
                techCode: data.techInviteCode || '',
                url: encodeURIComponent(location.href)
            }
            if (/inviteActivity/.test(location.hash)) {
                visitParams.scene = 'user_invite'
                visitParams.inviteId = Util.getPageParams('userId') || ''
                visitParams.activityId = Util.getPageParams('actId') || ''
                visitParams.inviteType = 'user'
            }
            Vue.http.get('../api/v2/log/club/visit', { params: visitParams })
        }
    },

    // 依据窗口宽度调整页面font-size
    resizeWidth () {
        let data = this.data
        let root = doc.documentElement

        if (!data.baseWidth) {
            data.baseWidth = doc.body.clientWidth || 320
        }
        data.winWidth = root.clientWidth || win.innerWidth || doc.body.clientWidth
        data.winHeight = root.clientHeight || win.innerHeight
        data.winWidth = data.winWidth > 540 ? 540 : (data.winWidth < 320 ? 320 : data.winWidth)
        data.winScale = data.winWidth / data.baseWidth
        root.style.fontSize = data.winScale * 16 + 'px'
    },

    // 删除用户登录信息
    clearLoginInfo () {
        let that = this
        let data = that.data
        let lsc = Util.removeLocalStorage

        data.isLogin = false
        data.token = ''
        data.userId = ''
        data.userHeader = ''
        data.userAvatar = ''
        data.userTel = ''
        data.userName = ''
        data.chatId = ''
        data.chatToken = ''

        lsc('token')
        lsc('userID')
        lsc('userHeader')
        lsc('userAvatar')
        lsc('userTel')
        lsc('userName')
        lsc('chatId')
        lsc('chatToken')

        im.close() // 关闭即时通讯

        let reminds = data.reminds
        reminds.coupon = 0 // 优惠券
        reminds.itemLimit = 0 // 限时抢
        reminds.itemCard = 0 // 特惠商城
        reminds.order = 0 // 预约
        reminds.itemCoupon = 0 // 项目券
        reminds.orderCoupon = 0 // 点钟券
        reminds.total = 0
    },

    // 初始化环信聊天
    initChat () {
        let that = this
        let data = that.data
        im.name = data.userName
        im.userId = data.userId
        im.avatar = data.userAvatar
        im.header = data.userHeader
        im.id = data.chatId
        im.token = data.chatToken
        if (!im.id || !im.token) {
            Util.tipShow('缺少IM账号信息！')
        } else {
            im.init()
        }
    },

    // 执行绑定
    execBindPhone (phoneNum, testCode) {
        let that = this
        let data = that.data
        let oldUserId = data.userId
        let ls = Util.localStorage

        return new Promise(resolve => {
            Vue.http.post('../api/v2/wx/bind_phone/save', {
                appVersion: '',
                clubCode: data.clubInviteCode || '',
                techInviteCode: data.techInviteCode || '',
                clubId: data.clubId || '',
                code: testCode,
                phoneNum: phoneNum
            }).then(res => {
                let resData = res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    data.token = res.token
                    data.userId = res.userId
                    data.userHeader = res.avatarUrl || data.defaultHeader
                    data.userTel = res.phoneNum
                    data.userName = res.name
                    ls('token', data.token)
                    ls('userID', data.userId)
                    ls('userHeader', data.userHeader)
                    ls('userTel', data.userTel)
                    ls('userName', data.userName)

                    if (oldUserId && oldUserId != data.userId) {
                        im.close()
                        setTimeout(() => {
                            location.reload(true)
                        }, 100)
                    }
                }
                resolve(resData)
            })
        })
    },

    // 获取会所的开关信息
    getClubSwitches (clubId) {
        let that = this
        clubId = clubId || that.data.clubId
        return new Promise(function (resolve, reject) {
            Vue.http.get('../api/v2/user/switches', { params: { clubId: clubId } }).then(res => {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    let cfg = (clubId == that.data.clubId ? that.data.clubCfg : {})
                    cfg.accountSwitch = (res.account.switch == 'on')
                    cfg.creditSwitch = (res.credit.systemSwitch == 'on' && res.credit.clubSwitch == 'on')
                    cfg.diceGameSwitch = (cfg.creditSwitch && res.credit.diceGameSwitch == 'on')
                    if (cfg.diceGameSwitch) {
                        cfg.diceGameTimeout = res.credit.gameTimeoutSeconds * 1000
                    }

                    cfg.paidCouponSwitch = (res.paidCoupon.couponSwitch == 'on')
                    if (cfg.paidCouponSwitch) {
                        cfg.paidCouponFee = res.paidCoupon.couponPlatformFee
                    }

                    cfg.paidOrderSwitch = (res.paidOrder.switch == 'on')
                    if (cfg.paidOrderSwitch) {
                        cfg.paidOrderFee = res.paidOrder.platformFee
                    }
                    resolve(cfg)
                } else {
                    reject('请求异常！')
                }
            })
        })
    },

    // 获取当前用户积分
    getCreditAccount (clubId) {
        let that = this
        clubId = clubId || that.data.clubId
        return new Promise((resolve, reject) => {
            Vue.http.get('../api/v2/credit/user/account', {
                params: {
                    clubId: clubId, userType: 'user'
                }
            }).then(res => {
                res = res.body
                if (res.statusCode == 200) {
                    resolve(res.respData)
                } else {
                    reject()
                }
            })
        })
    },

    // 更新用户的名称和头像
    updateUserNameAndHeader () {
        let that = this
        let data = that.data
        let ls = Util.localStorage
        if (data.token) {
            Vue.http.get('../api/v2/profile/user/info/view').then(res => {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    data.userAvatar = res.avatar || ''
                    data.userName = res.name || data.defaultName
                    data.userHeader = res.avatarUrl || data.defaultHeader
                    ls('userName', data.userName)
                    ls('userAvatar', data.userAvatar)
                    ls('userHeader', data.userHeader)
                    im.header = data.userHeader
                }
            })
        }
    },

    // 设置分享配置
    shareConfig (option, configPage) {
        let that = this
        if (!wx) return
        option = option || {}
        configPage = configPage || (that.data.currPage.name + Math.random())
        if (wx['signReady'] == true) {
            if (configPage == wx['configPage']) { // 已经配置过此页面的分享
                return
            }
            if (option.title) {
                wx.hideMenuItems({menuList: ['menuItem:copyUrl']})
                wx.showAllNonBaseMenuItem()
                wx.onMenuShareAppMessage(option) // 分享给朋友
                wx.onMenuShareTimeline(option) // 分享到朋友圈
                wx.onMenuShareQQ(option) // 分享到QQ
                wx.onMenuShareWeibo(option) // 分享到腾讯微博
                wx.onMenuShareQZone(option) // 分享到QQ空间
            } else {
                wx.hideAllNonBaseMenuItem() // 屏蔽分享菜单
            }
            wx['configPage'] = configPage
        } else if (win['requestSignCount'] == undefined) {
            win['requestSignCount'] = 2
            that.weiXinCfgSignature(option, configPage)
        }
    },

    // 微信签名
    weiXinCfgSignature (option, configPage) {
        let loc = location
        let signUrl = loc.origin + loc.pathname + loc.search
        let that = this
        Vue.http.get('../api/v1/wx/sign', {
            params: {
                url: encodeURIComponent(signUrl), sessionType: '9358'
            }
        }).then(res => {
            res = res.body
            wx.config({
                debug: false,
                appId: res.appId,
                timestamp: res.timestamp,
                nonceStr: res.nonceStr,
                signature: res.signature,
                jsApiList: ['onMenuShareAppMessage', 'onMenuShareTimeline', 'onMenuShareQQ', 'onMenuShareWeibo', 'onMenuShareQZone', 'hideAllNonBaseMenuItem', 'showAllNonBaseMenuItem', 'hideMenuItems']
            })

            if (!win['wxError']) {
                win['wxError'] = true
                wx.error(function () { // 微信分享配置失败
                    wx['signReady'] = false
                    win['requestSignCount']--
                    if (win['requestSignCount'] !== 0) {
                        that.weiXinCfgSignature(option, configPage)
                    }
                })
            }

            if (!win['wxReady']) {
                win['wxReady'] = true
                wx.ready(function () {
                    wx['signReady'] = true
                    that.shareConfig(option, configPage)
                })
            }
        })
    },

    // 判定页面的访问权限
    checkAccess (page, showTip) {
        let that = this
        let data = that.data
        let accessMenus = data.accessMenus

        if (data.pageMode == '9358' || !page) {
            return true
        }
        let canAccess = accessMenus[page] ? accessMenus[page].isPass : true
        if (!canAccess && showTip !== false) {
            Util.tipShow('会所未开通此功能！')
        }
        return canAccess
    },

    // 弹出绑定手机窗口
    bindTelPhone () {
        eventHub.$emit('pop-bind-phone')
    },

    // 从当前页面page跳转到login页面
    login (router, page, query, tag) {
        let that = this.data
        let currPage = that.currPage
        that.loginPage = page || currPage.name
        that.loginPageQuery = {}
        query = query || currPage.query
        router = router || that.router
        for (let item in query) {
            that.loginPageQuery[item] = query[item]
        }
        if (router && tag !== true) {
            router.push({ name: 'login' })
        }
    },

    // 登录之后跳转到上次访问的页面
    redirectToLastPage (router) {
        let data = this.data
        if (data.loginPage) {
            router.push({ name: data.loginPage, query: data.loginPageQuery })
        } else if (data.pageMode == 'club') {
            router.push({ name: 'home' })
        } else {
            router.push({ path: '/' })
        }
    },

    // 获取微信授权
    getOauthCode (sessionType, state, scope, msg) {
        let that = this
        let loc = location
        let timeStr = '_t=' + (+new Date())
        let pageUrl = loc.origin + loc.pathname + (that.data.xmdAppId ? '?xmdAppId=' + that.data.xmdAppId : '') + loc.hash + (loc.hash.indexOf('?') > 0 ? '&' + timeStr : '?' + timeStr)
        scope = /personal/.test(location.hash) ? 'snsapi_userinfo' : 'snsapi_base'
        if (!/_offline_notice/.test(pageUrl)) {
            pageUrl = pageUrl.replace(/(&|\?)code=[\da-zA-Z]+(&?)/g, function (v1, v2, v3) {
                return v2 == '?' ? (v3 ? '?' : '') : (v3 ? '&' : '')
            })
        }
        pageUrl = pageUrl.replace(/(&|\?)state=[\da-zA-Z_-]+(&?)/g, function (v1, v2, v3) {
            return v2 == '?' ? (v3 ? '?' : '') : (v3 ? '&' : '')
        })

        Vue.http.post('../api/v2/wx/oauth2/code', {
            wxmp: sessionType,
            state: state,
            pageUrl: pageUrl,
            scope: scope
        }).then(res => {
            res = res.body
            if (res && res.statusCode == 200) {
                loc.href = res.respData
            } else {
                Util.tipShow(msg || res.msg || '请求微信授权失败！')
            }
        })
    },

    // 获取支付宝授权
    getOauthCodeOfAlipay (state, scope, msg) {
        let that = this
        let loc = location
        let timeStr = '_t=' + (+new Date())
        let pageUrl = loc.origin + loc.pathname + (that.data.xmdAppId ? '?xmdAppId=' + that.data.xmdAppId : '') + loc.hash + (loc.hash.indexOf('?') > 0 ? '&' + timeStr : '?' + timeStr)
        // scope = (scope == 'base' ? 'snsapi_base' : 'snsapi_userinfo')
        scope = /personal/.test(location.hash) ? 'auth_user' : 'auth_base'
        if (!/_offline_notice/.test(pageUrl)) {
            pageUrl = pageUrl.replace(/(&|\?)code=[\da-zA-Z]+(&?)/g, function (v1, v2, v3) {
                return v2 == '?' ? (v3 ? '?' : '') : (v3 ? '&' : '')
            })
        }
        pageUrl = pageUrl.replace(/(&|\?)state=[\da-zA-Z_-]+(&?)/g, function (v1, v2, v3) {
            return v2 == '?' ? (v3 ? '?' : '') : (v3 ? '&' : '')
        })
        Vue.http.post('../api/v2/alipay/oauth2/code', {
            state: state,
            pageUrl: pageUrl, // post方式url不需要编码
            scope: scope
        }).then(res => {
            res = res.body
            if (res && res.statusCode == 200) {
                loc.href = res.respData
                setTimeout(() => {
                    loc.href = res.respData
                    setTimeout(() => { loc.href = res.respData }, 100)
                }, 100)
            } else {
                Util.tipShow(msg || res.msg || '请求支付宝授权失败！')
            }
        })
    },

    // 获取微信OpenId
    getOpenId (option) {
        let that = this
        return new Promise((resolve, reject) => {
            Vue.http.post('../api/v2/wx/oauth2/openid', {
                code: option.authCode,
                scope: option.scope || 'snsapi_base',
                sessionType: '9358',
                openId: '',
                webSessionId: option.sessionId || ''
            }).then(res => {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData.openid
                    that.data.openId = res
                    resolve(res)
                } else if (res.statusCode == 40029) {
                    that.getOauthCode('9358', option.state || '9358', 'base')
                    reject('重新获取授权！')
                } else {
                    reject(res.msg || '获取openId失败！')
                }
            }, () => {
                reject('获取openId失败！')
            })
        })
    },

    // 处理页面上的返回按钮
    toBack () {
        let that = this
        let data = that.data
        let router = data.router

        if (data.pageMode == 'club') {
            if (data.currPage.name != 'home' && !data.lastPage.name) {
                router.push({ name: 'home' })
            } else {
                router.back()
            }
        } else {
            if (!/clubList/.test(data.currPage.name) && !data.lastPage.name) {
                router.push({ name: 'clubList' })
            } else {
                router.back()
            }
        }
    },

    // 支付宝JS是否已加载的判断
    alipayJsApiLoaded () {
        return new Promise(resolve => {
            if (win.ap) {
                resolve()
            } else {
                let waiter = setInterval(() => {
                    if (win.ap) {
                        win.clearInterval(waiter)
                        resolve()
                    }
                }, 50)
            }
        })
    },

    // 支付宝AlipayJSBridge就绪之后回调
    alipayJsBridgeReady (callback) {
        let that = this
        that.alipayJsApiLoaded().then(() => {
            if (win.AlipayJSBridge) { // 如果jsbridge已经注入则直接调用
                callback && callback()
            } else {
                // 如果没有注入则监听注入的事件
                document.addEventListener('AlipayJSBridgeReady', callback, false)
            }
        })
    },

    // 微信WeixinJSBridge就绪之后回调
    wxJsBridgeReady (callback) {
        if (window.WeixinJSBridge) {
            callback && callback()
        } else {
            document.addEventListener('WeixinJSBridgeReady', callback, false)
        }
    },

    // 递归处理会所页面的权限列表
    handlerMenuAuth (enabledRes, offRes, arr, obj) {
        let that = this
        arr = arr || []
        obj = obj || {}
        let item
        for (let i = 0, l = arr.length; i < l; i++) {
            item = arr[i]
            obj[item.code] = item
            item['isPass'] = enabledRes.some(function (v) {
                return v == item.id
            })
            item['isOff'] = offRes.some(function (v) {
                return v == item.id
            })
            if (item.children && item.children.length > 0) {
                that.handlerMenuAuth(enabledRes, offRes, item.children, obj)
            }
        }
    },

    // 记录用户与会所技师的关系
    bindClubTech (token) {
        let data = this.data
        let getParam = Util.getPageParams
        setTimeout(() => {
            let paramOption = {
                clubId: data.clubId,
                timestamp: (+new Date()),
                token: token,
                techId: getParam('techId') || '',
                techCode: (data.techInviteCode ? data.techInviteCode.split('/')[0] : ''),
                openId: data.openId || '',
                source: (/scan/.test(data.loginChanel) ? 'qrCode' : 'web')
            }
            if (/inviteActivity/.test(location.hash)) {
                paramOption.scene = 'user_invite'
                paramOption.inviteId = getParam('userId') || ''
                paramOption.activityId = getParam('actId') || ''
                paramOption.inviteType = 'user'
            }
            Vue.http.post('../api/v2/log/user_bind_club_tech', paramOption)
        }, 350)
    },

    // 查询各种券的提醒数量
    queryReminds () {
        let data = this.data
        let reminds = data.reminds
        if (data.isLogin) {
            Vue.http.get('../api/v2/profile/coupon/expire/count', {
                params: {
                    clubId: data.clubId
                }
            }).then(res => {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    reminds.coupon = res.coupon // 优惠券
                    reminds.itemLimit = res.timeLimit // 限时抢
                    reminds.itemCard = res.itemCard + res.itemPackage + res.creditGift // 次卡
                    reminds.order = res.order || 0 // 预约订单
                    reminds.itemCoupon = res.serviceItem // 项目券
                    reminds.orderCoupon = res.paidCoupon // 点钟券
                    reminds.total = res.total || 0
                    // reminds.total = res.coupon + res.timeLimit + res.itemCard + res.itemPackage + res.creditGift + res.serviceItem + res.paidCoupon + (res.order || 0)
                }
            })
        }
    },

    // 查询会所的打赏是否关闭状态
    queryClubTechRewardStatus (clubId) {
        return new Promise(resolve => {
            Vue.http.get('../api/v2/user/reward/isRewardOn', { params: { clubId: clubId } }).then(res => {
                res = res.body
                if (res.statusCode == 200) {
                    resolve(res.respData)
                } else {
                    resolve(false)
                }
            })
        })
    },

    setPageTitle (type) {
        let that = this
        let data = that.data
        let _return = ''
        if (!data.clubId) {
            return false
        }
        data.clubHomeConfig.bottom_menu.forEach(item => {
            if (item.code == type) {
                _return = item.title
            }
        })
        return _return
    }
}
