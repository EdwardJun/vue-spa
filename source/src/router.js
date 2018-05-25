import Vue from 'vue'
import VueRouter from 'vue-router'
import Global from './libs/global'
import eventHub from './libs/hub'

Vue.use(VueRouter)
var _global = Global.data
var doc = document
var tArr = location.href.toString().match(/\/(\d{18,18})\/?/)
console.log(tArr)
var clubId = ''
if (tArr && tArr[1]) {
    clubId = tArr[1]
}
var isClubMode = (clubId != '')
var prefixPath = isClubMode ? '' : '/'
var clubPageRouterOption = []
var switchComponent = {
    template: '<div></div>',
    created () {
        location.reload()
    }
}
var pageRouterOption = [
    {
        path: prefixPath + 'home',
        name: 'home',
        meta: { checkLogin: false },
        component (resolve) {
            require(['./views/home.vue'], resolve)
        }
    },
    {
        path: prefixPath + '404',
        name: '404',
        meta: { checkLogin: false, fullPage: true },
        component (resolve) {
            require(['./views/404.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'message',
        name: 'message',
        meta: { checkLogin: true },
        component (resolve) {
            require(['./views/message.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'blacklist',
        name: 'blacklist',
        meta: { checkLogin: true },
        component (resolve) {
            require(['./views/blacklist.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'technicianList',
        name: 'technicianList',
        meta: { checkLogin: false },
        component (resolve) {
            require(['./views/technicianList.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'technicianDetail',
        name: 'technicianDetail',
        meta: { checkLogin: false, share: true },
        component (resolve) {
            require(['./views/technicianDetail.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'order',
        name: 'order',
        meta: { checkLogin: true, isNeedBind: true },
        component (resolve) {
            require(['./views/order.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'orderDetail',
        name: 'orderDetail',
        meta: { checkLogin: true },
        component (resolve) {
            require(['./views/orderDetail.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'personal',
        name: 'personal',
        meta: { checkLogin: false },
        component (resolve) {
            require(['./views/personal.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'clubProfile',
        name: 'clubProfile',
        meta: { checkLogin: false },
        component (resolve) {
            require(['./views/clubProfile.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'serviceList',
        name: 'serviceList',
        meta: { checkLogin: false, fullPage: true },
        component (resolve) {
            require(['./views/serviceList.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'serviceItem',
        name: 'serviceItem',
        meta: { checkLogin: false },
        component (resolve) {
            require(['./views/serviceItem.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'map',
        name: 'map',
        meta: { checkLogin: false, fullPage: true },
        component (resolve) {
            require(['./views/map.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'comment',
        name: 'comment',
        meta: { checkLogin: false },
        component (resolve) {
            require(['./views/comment.vue'], resolve)
        }
    },
    // {
    //     path: prefixPath + 'review',
    //     name: 'review',
    //     meta: { checkLogin: false },
    //     component (resolve) {
    //         require(['./views/review.vue'], resolve)
    //     }
    // },
    {
        path: prefixPath + 'technicianImg',
        name: 'technicianImg',
        meta: { checkLogin: false, fullPage: true },
        component (resolve) {
            require(['./views/technicianImg.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'chat',
        name: 'chat',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/chat.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'login',
        name: 'login',
        meta: { checkLogin: false, fullPage: true },
        component (resolve) {
            require(['./views/login.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'confirmLogin',
        name: 'confirmLogin',
        meta: { checkLogin: false, fullPage: true },
        component (resolve) {
            require(['./views/confirmLogin.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'recoverPassword',
        name: 'recoverPassword',
        meta: { checkLogin: false, fullPage: true },
        component (resolve) {
            require(['./views/recoverPassword.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'register',
        name: 'register',
        meta: { checkLogin: false, fullPage: true },
        component (resolve) {
            require(['./views/register.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'promotionsActivity',
        name: 'promotionsActivity',
        meta: { checkLogin: false },
        component (resolve) {
            require(['./views/promotionsActivity.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'accountDetail',
        name: 'accountDetail',
        meta: { checkLogin: true, fullPage: true, isNeedBind: true },
        component (resolve) {
            require(['./views/accountDetail.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'account',
        name: 'account',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/account.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'coupon',
        name: 'coupon',
        meta: { checkLogin: true },
        component (resolve) {
            require(['./views/coupon.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'couponDetail',
        name: 'couponDetail',
        meta: { checkLogin: true, share: true, title: '优惠券' },
        component (resolve) {
            require(['./views/couponDetail.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'confirmOrder',
        name: 'confirmOrder',
        meta: { checkLogin: false, isNeedBind: true },
        component (resolve) {
            require(['./views/confirmOrder.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'paidCouponDetail',
        name: 'paidCouponDetail',
        meta: { checkLogin: false, title: '券详情' },
        component (resolve) {
            require(['./views/paidCouponDetail.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'paidCoupon',
        name: 'paidCoupon',
        meta: { checkLogin: false, isNeedBind: true },
        component (resolve) {
            require(['./views/paidCoupon.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'collect',
        name: 'collect',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/collect.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'techReward',
        name: 'techReward',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/techReward.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'info',
        name: 'info',
        meta: { checkLogin: true },
        component (resolve) {
            require(['./views/info.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'picture',
        name: 'picture',
        meta: { checkLogin: true },
        component (resolve) {
            require(['./views/picture.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'integralDetail',
        name: 'integralDetail',
        meta: { checkLogin: true },
        component (resolve) {
            require(['./views/integralDetail.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'integral',
        name: 'integral',
        meta: { checkLogin: true },
        component (resolve) {
            require(['./views/integral.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'integralExplain',
        name: 'integralExplain',
        meta: { checkLogin: false },
        component (resolve) {
            require(['./views/integralExplain.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'suggestions',
        name: 'suggestions',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/suggestions.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'qrPayCode',
        name: 'qrPayCode',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/qrPayCode.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'tradeRecords',
        name: 'tradeRecords',
        meta: { checkLogin: true },
        component (resolve) {
            require(['./views/tradeRecords.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'treat',
        name: 'treat',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/treat.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'recharge',
        name: 'recharge',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/recharge.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'treatExplain',
        name: 'treatExplain',
        meta: { checkLogin: false },
        component (resolve) {
            require(['./views/treatExplain.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'treatRecords',
        name: 'treatRecords',
        meta: { checkLogin: true },
        component (resolve) {
            require(['./views/treatRecords.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'treatDetail',
        name: 'treatDetail',
        meta: { checkLogin: true },
        component (resolve) {
            require(['./views/treatDetail.vue'], resolve)
        }
    },
    // {
    //     path: prefixPath + 'inviteCode',
    //     name: 'inviteCode',
    //     meta: { checkLogin: false, fullPage: true },
    //     component (resolve) {
    //         require(['./views/inviteCode.vue'], resolve)
    //     }
    // },
    // {
    //     path: prefixPath + 'hourTicketList',
    //     name: 'hourTicketList',
    //     meta: { checkLogin: false },
    //     component (resolve) {
    //         require(['./views/hourTicketList.vue'], resolve)
    //     }
    // },
    {
        path: prefixPath + 'member',
        name: 'member',
        meta: { checkLogin: false },
        component (resolve) {
            require(['./views/member.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'qrPay',
        name: 'qrPay',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/qrPay.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'qrPayComplete',
        name: 'qrPayComplete',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/qrPayComplete.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'follow9358',
        name: 'follow9358',
        meta: { checkLogin: false, fullPage: true },
        component (resolve) {
            require(['./views/follow9358.vue'], resolve)
        }
    },
    // {
    //     path: prefixPath + 'plumflowers',
    //     name: 'plumflowers',
    //     meta: { checkLogin: false },
    //     component (resolve) {
    //         require(['./views/plumflowers.vue'], resolve)
    //     }
    // },
    {
        path: prefixPath + 'robProjectDetail',
        name: 'robProjectDetail',
        meta: { checkLogin: false, share: true },
        component (resolve) {
            require(['./views/robProjectDetail.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'robProjectSuccess',
        name: 'robProjectSuccess',
        meta: { checkLogin: true, share: true },
        component (resolve) {
            require(['./views/robProjectSuccess.vue'], resolve)
        }
    },
    // 电子期刊列表
    {
        path: prefixPath + 'journalList',
        name: 'journalList',
        meta: { checkLogin: false },
        component (resolve) {
            require(['./views/journalList.vue'], resolve)
        }
    },
    {   // 大转盘抽奖页面
        path: prefixPath + 'luckyWheel',
        name: 'luckyWheel',
        meta: { checkLogin: true, share: true, isNeedBind: false },
        component (resolve) {
            require(['./views/luckyWheel.vue'], resolve)
        }
    },
    {   // 大转盘分享页面
        path: prefixPath + 'luckyShare',
        name: 'luckyShare',
        meta: { checkLogin: false, share: false },
        component (resolve) {
            require(['./views/luckyShare.vue'], resolve)
        }
    },
    {   // 中奖纪录页面
        path: prefixPath + 'lucky',
        name: 'lucky',
        meta: { checkLogin: true },
        component (resolve) {
            require(['./views/lucky.vue'], resolve)
        }
    },
    {   // 中奖纪录详情页
        path: prefixPath + 'luckyDetail',
        name: 'luckyDetail',
        meta: { checkLogin: true },
        component (resolve) {
            require(['./views/luckyDetail.vue'], resolve)
        }
    },
    {   // wifi列表页面
        path: prefixPath + 'wifi',
        name: 'wifi',
        meta: { checkLogin: false },
        component (resolve) {
            require(['./views/wifi.vue'], resolve)
        }
    },
    {   // 在线买单页面
        path: prefixPath + 'fastPay',
        name: 'fastPay',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/fastPay.vue'], resolve)
        }
    },
    {   // 买单记录页面
        path: prefixPath + 'fastPayRecords',
        name: 'fastPayRecords',
        meta: { checkLogin: true },
        component (resolve) {
            require(['./views/fastPayRecords.vue'], resolve)
        }
    },
    {   // 买单出错页面
        path: prefixPath + 'fastPayError',
        name: 'fastPayError',
        meta: { checkLogin: false, fullPage: true },
        component (resolve) {
            require(['./views/fastPayError.vue'], resolve)
        }
    },
    {   // 特惠商城页面
        path: prefixPath + 'discountMall',
        name: 'discountMall',
        meta: { checkLogin: false, fullPage: true },
        component (resolve) {
            require(['./views/discountMall.vue'], resolve)
        }
    },
    {   // 次卡详情页面
        path: prefixPath + 'itemCardDetail',
        name: 'itemCardDetail',
        meta: { checkLogin: false, share: true },
        component (resolve) {
            require(['./views/itemCardDetail.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'payDetail',
        name: 'payDetail',
        meta: { checkLogin: false, share: true },
        component (resolve) {
            require(['./views/payDetail.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'payInstead',
        name: 'payInstead',
        meta: { checkLogin: false, share: true },
        component (resolve) {
            require(['./views/payInstead.vue'], resolve)
        }
    },
    {   // 用户次卡订单列表页面
        path: prefixPath + 'itemCardOrders',
        name: 'itemCardOrders',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/itemCardOrders.vue'], resolve)
        }
    },
    {   // 用户次卡订单详情页面
        path: prefixPath + 'itemCardOrderDetail',
        name: 'itemCardOrderDetail',
        meta: { checkLogin: true },
        component (resolve) {
            require(['./views/itemCardOrderDetail.vue'], resolve)
        }
    },
    {   // 热门活动页面
        path: prefixPath + 'activities',
        name: 'activities',
        meta: { checkLogin: true },
        component (resolve) {
            require(['./views/activities.vue'], resolve)
        }
    },
    {   // 预约技师页面
        path: prefixPath + 'appointTech',
        name: 'appointTech',
        meta: { checkLogin: false, fullPage: true },
        component (resolve) {
            require(['./views/appointTech.vue'], resolve)
        }
    },
    // {   //
    //     path: prefixPath + 'oneYuanDetail',
    //     name: 'oneYuanDetail',
    //     meta: { checkLogin: false, share: true },
    //     component (resolve) {
    //         require(['./views/oneYuanDetail.vue'], resolve)
    //     }
    // },
    // {   //
    //     path: prefixPath + 'oneYuanExplain',
    //     name: 'oneYuanExplain',
    //     meta: { checkLogin: false },
    //     component (resolve) {
    //         require(['./views/oneYuanExplain.vue'], resolve)
    //     }
    // },
    // {   //
    //     path: prefixPath + 'oneYuanJoinRecords',
    //     name: 'oneYuanJoinRecords',
    //     meta: { checkLogin: true },
    //     component (resolve) {
    //         require(['./views/oneYuanJoinRecords.vue'], resolve)
    //     }
    // },
    // {   //
    //     path: prefixPath + 'oneYuanPastWinRecords',
    //     name: 'oneYuanPastWinRecords',
    //     meta: { checkLogin: true, fullPage: true },
    //     component (resolve) {
    //         require(['./views/oneYuanPastWinRecords.vue'], resolve)
    //     }
    // },
    // {   //
    //     path: prefixPath + 'oneYuanRecords',
    //     name: 'oneYuanRecords',
    //     meta: { checkLogin: true, fullPage: true },
    //     component (resolve) {
    //         require(['./views/oneYuanRecords.vue'], resolve)
    //     }
    // },
    // {   //
    //     path: prefixPath + 'oneYuanRecordsDetail',
    //     name: 'oneYuanRecordsDetail',
    //     meta: { checkLogin: true },
    //     component (resolve) {
    //         require(['./views/oneYuanRecordsDetail.vue'], resolve)
    //     }
    // },
    // {   //
    //     path: prefixPath + 'oneYuanSuccess',
    //     name: 'oneYuanSuccess',
    //     meta: { checkLogin: false, share: true, fullPage: true },
    //     component (resolve) {
    //         require(['./views/oneYuanSuccess.vue'], resolve)
    //     }
    // },
    {
        path: prefixPath + 'clubList',
        name: 'clubList',
        meta: { checkLogin: false },
        component (resolve) {
            require(['./views/clubList.vue'], resolve)
        },
        children: [
            {
                path: 'all',
                name: 'clubList-all',
                meta: { checkLogin: false },
                component (resolve) {
                    require(['./views/clubList-all.vue'], resolve)
                }
            },
            {
                path: 'search',
                name: 'clubList-search',
                meta: { checkLogin: false },
                component (resolve) {
                    require(['./views/clubList-search.vue'], resolve)
                }
            }
        ]
    },
    {   // 邀请有礼活动
        path: prefixPath + 'inviteActivity',
        name: 'inviteActivity',
        meta: { checkLogin: true, share: true, title: '邀请有礼' },
        component (resolve) {
            require(['./views/inviteActivity.vue'], resolve)
        }
    },
    {   // 邀请有礼活动---我的礼品页面
        path: prefixPath + 'inviteActivityGifts',
        name: 'inviteActivityGifts',
        meta: { checkLogin: true, share: false, title: '我的礼品' },
        component (resolve) {
            require(['./views/inviteActivityGifts.vue'], resolve)
        }
    },
    {   // 邀请有礼活动---分享页面
        path: prefixPath + 'inviteActivityShare',
        name: 'inviteActivityShare',
        meta: { checkLogin: true, share: true },
        component (resolve) {
            require(['./views/inviteActivityShare.vue'], resolve)
        }
    },
    {   // 次卡套餐页面
        path: prefixPath + 'itemPackageDetail',
        name: 'itemPackageDetail',
        meta: { checkLogin: false, share: true },
        component (resolve) {
            require(['./views/itemPackageDetail.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'itemCardDonationRecord',
        name: 'itemCardDonationRecord',
        meta: { checkLogin: false, share: false },
        component (resolve) {
            require(['./views/itemCardDonationRecord.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'itemCardDonationDetail',
        name: 'itemCardDonationDetail',
        meta: { checkLogin: false, share: false },
        component (resolve) {
            require(['./views/itemCardDonationDetail.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'itemDonationDetail',
        name: 'itemDonationDetail',
        meta: { checkLogin: false, share: false },
        component (resolve) {
            require(['./views/itemDonationDetail.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'itemReceive',
        name: 'itemReceive',
        meta: { checkLogin: false, share: false },
        component (resolve) {
            require(['./views/itemReceive.vue'], resolve)
        }
    },
    // pos买单页面
    {
        path: prefixPath + 'posPay',
        name: 'posPay',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/posPay.vue'], resolve)
        }
    },
    // pos买单成功页面
    {
        path: prefixPath + 'posPaySuccess',
        name: 'posPaySuccess',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/posPaySuccess.vue'], resolve)
        }
    },
    // 聊天图片页面
    {
        path: prefixPath + 'chatPictures',
        name: 'chatPictures',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/chatPictures.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'ilike',
        name: 'ilike',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/ilike.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'oClockCoupon',
        name: 'oClockCoupon',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/oClockCoupon.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'limit',
        name: 'limit',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/limit.vue'], resolve)
        }
    },
    // 会所买单页面
    {
        path: prefixPath + 'fastClubPay',
        name: 'fastClubPay',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/fastClubPay.vue'], resolve)
        }
    },
    // 会员卡充值支付页面
    {
        path: prefixPath + 'memberChargePay',
        name: 'memberChargePay',
        meta: {checkLogin: true, fullPage: true},
        component (resolve) {
            require(['./views/memberChargePay.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'fastPayCouponsList',
        name: 'fastPayCouponsList',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/fastPayCouponsList.vue'], resolve)
        }
    },
    // 项目券
    {
        path: prefixPath + 'serviceItemCoupon',
        name: 'serviceItemCoupon',
        meta: { checkLogin: true },
        component (resolve) {
            require(['./views/serviceItemCoupon.vue'], resolve)
        }
    },
    // 支付完成活动页
    {
        path: prefixPath + 'fastPaySuccess',
        name: 'fastPaySuccess',
        meta: { checkLogin: true },
        component (resolve) {
            require(['./views/fastPaySuccess.vue'], resolve)
        }
    },
    // 邀请有礼--我邀请的好友
    {
        path: prefixPath + 'inviteFriends',
        name: 'inviteFriends',
        meta: { checkLogin: true, fullPage: true, title: '我邀请的好友' },
        component (resolve) {
            require(['./views/inviteFriends.vue'], resolve)
        }
    },
    // 邀请有礼--我的奖励
    {
        path: prefixPath + 'inviteRewards',
        name: 'inviteRewards',
        meta: { checkLogin: true, fullPage: true, share: true, title: '我的奖励' },
        component (resolve) {
            require(['./views/inviteRewards.vue'], resolve)
        }
    },
    // 连锁店分店地址
    {
        path: prefixPath + 'clubChains',
        name: 'clubChains',
        meta: { checkLogin: false, fullPage: true, title: '分店地址' },
        component (resolve) {
            require(['./views/clubChains.vue'], resolve)
        }
    },
    {   // 在线买单页面
        path: prefixPath + 'fastPayCashier',
        name: 'fastPayCashier',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/fastPayCashier.vue'], resolve)
        }
    },
    {   // 在线买单页面
        path: prefixPath + 'fastClubPayCashier',
        name: 'fastClubPayCashier',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/fastClubPayCashier.vue'], resolve)
        }
    },
    {   // 买单收银未支付页面
        path: prefixPath + 'notFastPayList',
        name: 'notFastPayList',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/notFastPayList.vue'], resolve)
        }
    },
    {   // 清除SessionStorage和LocalStorage
        path: prefixPath + 'cacheClean',
        name: 'cacheClean',
        meta: { checkLogin: false, fullPage: false },
        component (resolve) {
            require(['./views/cacheClean.vue'], resolve)
        }
    },
    {  // 拼团活动详情
        path: prefixPath + 'groupBuyActDetail',
        name: 'groupBuyActDetail',
        meta: { checkLogin: true, fullPage: true, share: true },
        component (resolve) {
            require(['./views/groupBuyActDetail.vue'], resolve)
        }
    },
    {  // 拼团活动详情分享页面
        path: prefixPath + 'groupBuyActShare',
        name: 'groupBuyActShare',
        meta: { checkLogin: true, fullPage: true, share: true },
        component (resolve) {
            require(['./views/groupBuyActShare.vue'], resolve)
        }
    },
    {  // 拼团活动开团、参与成功
        path: prefixPath + 'groupBuyActJoinSuccess',
        name: 'groupBuyActJoinSuccess',
        meta: { checkLogin: true, fullPage: true, share: true },
        component (resolve) {
            require(['./views/groupBuyActJoinSuccess.vue'], resolve)
        }
    },
    {  // 拼团活动结束页面
        path: prefixPath + 'groupBuyActFinished',
        name: 'groupBuyActFinished',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/groupBuyActFinished.vue'], resolve)
        }
    },
    {  // 拼团记录
        path: prefixPath + 'groupBuyRecords',
        name: 'groupBuyRecords',
        meta: { checkLogin: true, fullPage: true, share: true },
        component (resolve) {
            require(['./views/groupBuyRecords.vue'], resolve)
        }
    },
    {  // 拼团记录详情
        path: prefixPath + 'groupBuyRecordDetail',
        name: 'groupBuyRecordDetail',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/groupBuyRecordDetail.vue'], resolve)
        }
    },
    {
        path: prefixPath + 'fastPayDetail',
        name: 'fastPayDetail',
        meta: { checkLogin: true, fullPage: true },
        component (resolve) {
            require(['./views/fastPayDetail.vue'], resolve)
        }
    }
]

// 用于跳转
pageRouterOption.push({
    path: !isClubMode ? '/:clubId/*' : '/clubList/*',
    component: switchComponent
})

// 其他链接
pageRouterOption.push({
    path: '/', redirect: { name: isClubMode ? 'home' : 'clubList' }
})
pageRouterOption.push({
    path: '*', redirect: { name: isClubMode ? 'home' : 'clubList' }
})

if (isClubMode) { // 设置嵌套路由
    clubPageRouterOption.push({
        path: '/' + clubId,
        component: {
            template: '<router-view></router-view>'
        },
        children: pageRouterOption
    })
}

// 路由配置
var router = new VueRouter({
    linkActiveClass: 'active',
    routes: isClubMode ? clubPageRouterOption : pageRouterOption
})

// 加载页面之前
router.beforeEach((to, from, next) => {
    if (((_global.pageMode == 'club' && !_global.isClubOnline) || _global.userInBlicklist) && to.name != '404') {
        return next({ name: '404' })
    }
    // 从club模式跳转回来时
    if (to.name == null && isClubMode) {
        setTimeout(function () {
            location.reload()
        }, 0)
    }
    _global.bodyScrollTop = doc.body.scrollTop
    if (to.name == from.name) {
        return next()
    }
    if (!Global.checkAccess(to.name) || (to.name == 'clubList' && /clubList-/.test(from.name))) {
        return next(false)
    }
    // 在已登录状态下，按返回键返回到的页面为 login 或 confirmLogin 页面时，拒绝此次切换，再次调用 history.back()
    if (_global.isLogin && /^(login|confirmLogin)$/.test(to.name)) {
        next(false)
        router.go(to.name == 'login' ? -2 : -3)
        return
    }
    _global.loading = true

    // 检测登录
    if (to.meta.checkLogin && !_global.spec) {
        if (!(_global.isLogin && _global.token)) {
            Global.login(null, to.name, to.query, true)
            if (_global.currPage.name == 'login') {
                _global.loading = false
            }
            return next({ name: 'login' })
        }
    }

    var body = doc.body
    if (to.meta.fullPage) {
        body.classList.add('full')
    } else {
        body.classList.remove('full')
    }
    var needBind = !!to.meta.isNeedBind // 是否需要绑定手机号
    var currPage = _global.currPage
    var lastPage = _global.lastPage
    lastPage.name = from.name
    lastPage.query = currPage.query

    currPage.query = to.query
    currPage.name = to.name

    // 获取在#之前的参数，设置到query中
    var innerParams = location.href.split('#')[0].split('?')
    if (innerParams.length > 1) {
        innerParams = innerParams[1].split('&')
        var paramStrArr
        for (let k = 0; k < innerParams.length; k++) {
            paramStrArr = innerParams[k].split('=')
            if (paramStrArr.length == 2) {
                currPage.query[paramStrArr[0]] = decodeURIComponent(paramStrArr[1])
            }
        }
    }

    if (needBind && !_global.userTel) { // 弹出绑定手机窗口
        eventHub.$emit('pop-bind-phone')
    }
    _global.showAppMenu = isClubMode && /^(home|message|order|personal|technicianList|blacklist)$/.test(to.name)
    _global.show9358Menu = !isClubMode && /(clubList|message|personal|blacklist)/.test(to.name)
    _global.showServiceBtn = isClubMode && /^(home|order|personal|activities|technicianList)$/.test(to.name)
    body.scrollTop = 0
    if (to.meta.title) {
        document.title = to.meta.title
    }
    next()
})

// 加载页面之后
router.afterEach((to) => {
    if (_global.userAgent.isWX && to.meta.share !== true) { // 自定义分享的页面除外
        Global.shareConfig(_global.shareConfigOption, 'global')
    }
    _global.eventMask = false
})
export default router
