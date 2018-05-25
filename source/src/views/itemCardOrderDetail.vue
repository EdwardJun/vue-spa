<style lang="sass">
    @import '../sass/page/itemCardOrderDetail.scss';
</style>
<template>
    <div class="page" id="item-card-order-detail-page">
        <router-link class="title" :to="{ path: '/'+clubId+'/home' }" tag="div"><div :style="{ 'background-image': 'url('+clubLogo+')' }"></div><span>{{ clubName }}</span>
            <router-link v-show="orderData.haveGiveRecord == 1 && cardType=='item_card' && orderData.giveCount>0"  class="record" :to="{ name: 'itemCardDonationRecord', query: { orderId: orderId, clubId: clubId} }">赠送记录</router-link>
        </router-link>
        <router-link class="service-item" tag="div" :to="{ name: cardType=='item_card' ? 'itemCardDetail' : 'itemPackageDetail', query: { id: cardId, clubId: clubId, type: cardType } }">
            <div :style="{ 'background-image': 'url('+orderData.imgUrl+')' }" :class="cardType"></div>
            <div>{{ orderData.name }}</div>
            <div v-if=" cardType != 'credit_gift' ">总价：<span>{{ orderData.amount | MoneyFormatter }}</span>元</div>
            <div v-else>总价：<span>{{ orderData.credits }}</span>积分</div>
            <div>{{ orderData.useEndTime ? '有效期至：'+orderData.useEndTime.slice(0,-3) : '长期有效' }}</div>
        </router-link>
        <div class="ope-wrap">
            <div :class="{ active: currShowIndex==0 }" @click="doSwitchList(0)">{{ orderData.status == 2 ? '已过期': '未使用' }}（<span>{{ orderData.totalCount - orderData.usedCount }}</span>）</div>
            <div :class="{ active: currShowIndex==1 }" @click="doSwitchList(1)">已使用（<span>{{ orderData.usedCount }}</span>）</div>
        </div>

        <!--可用券列表-->
        <div class="can-use list" v-show="currShowIndex==0">
            <div class="no-data" v-show="orderData.canUseCount == 0">已经全部用完啦~</div>
            <div class="item" v-show="orderData.canUseCount > 0" v-for="item in canUseList" :class="{ expired: orderData.status == 2, active: item.isShow }">
                <h4 @click="doSwitchShow(item)">{{ item.itemName }}券</h4>
                <div class="coupon" v-for="(coupon,index) in item.coupons">
                    <div>券{{ index + 1 }}</div>
                    <div class="item-coupon" v-show="cardType=='item_card' && orderData.haveGiveRecord == 1 && coupon.giveStatus==1">
                        <item-data-time :modify-time="modifyTime" :expire-time="coupon.expireTime == null ? '' : coupon.expireTime" :record-id="coupon.recordId"></item-data-time>
                    </div>
                    <!--:class="{ active: coupon.isCheck}"-->
                    <!--haveGiveRecord转赠后此字段应由0变成1，此处返回状态有问题-->
                    <img :class="{ active: cardType=='item_card' && orderData.haveGiveRecord==1 && coupon.giveStatus==1 }" alt="核销二维码" :src="coupon.codeImgUrl"/>
                    <div :class="{ active: cardType=='item_card' && orderData.haveGiveRecord == 1 && coupon.giveStatus==1 }">核销码：<span>{{ coupon.couponNoStr }}</span></div>
                    <div class="item-edit" v-show="inEdit && coupon.giveStatus!=1"><span>(请勾选要赠送的券)</span></div>
                    <div v-show="cardType=='item_card' && orderData.isGived == 1" class="item-friends">
                        <div :style="{ 'background-image': 'url('+(orderData.giveAvatarUrl || global.defaultHeader)+')' }"></div><!--会所图片-->
                        <div>来自好友 {{ orderData.originOwnerName }} 的赠送</div><!--会所名称-->
                    </div>
                    <!--来自好友的赠送 giveStatus:1  haveGiveRecord:0-->
                    <!--转赠 giveStatus:0 haveGiveRecord:1 -->
                    <div class="item-check" v-show="inEdit && coupon.giveStatus==0 || (inEdit && coupon.giveStatus==1 && orderData.haveGiveRecord==0)"><div @click="doCheck(item.coupons, index)" :class="{ active: coupon.isCheck }"></div></div>
                    <span v-if="cardType=='item_card' && orderData.haveGiveRecord == 1 && coupon.giveStatus==1" class="item-status"><i>未领取</i></span>
                </div>
            </div>
            <div class="item-last"></div>
        </div>

        <!--已用券列表-->
        <div class="used list" v-show="currShowIndex==1">
            <div class="no-data" v-show="orderData.usedCount == 0">还没有使用记录~</div>
            <div class="item" v-show="orderData.usedCount > 0" v-for="item in usedList" :class="{ active: item.isShow }">
                <h4 @click="doSwitchShow(item)">{{ item.itemName }}券</h4>
                <div class="coupon" v-for="(coupon,index) in item.coupons">
                    <div>券{{ index + 1 }}</div>
                    <img alt="核销二维码" :src="coupon.codeImgUrl"/>
                    <div>核销码：<span>{{ coupon.couponNoStr }}</span></div>
                    <div>使用时间：{{ coupon.modifyDate }}</div>
                  <span v-if="cardType=='item_card' && coupon.isReceive == 1" class="item-status"><i>已赠送</i></span>
                </div>
            </div>
          <div class="item-last"></div>
        </div>

        <div v-if="orderData.totalCount - orderData.usedCount > 0 && cardType=='item_card'" class="btn-footer">
            <div>
                <div v-if="orderData.totalCount - orderData.usedCount > 0" class="submit-btn btn-give" @click="doGiveFriends()" :class="{ active: inEdit }">{{ inEdit ? '取消' : '赠送好友'}}</div>
                <router-link  class="submit-btn btn-super" :to="{path: '/' + clubId + '/discountMall'}" v-show="!inEdit" tag="div">逛商城、找优惠</router-link>
                <div class="submit-btn btn-confirm"  v-show="inEdit" :class="{ active: hasSelected }" @click="doConfirmGive()">确认赠送</div>
            </div>
        </div>
        <!--|| cardType!='item_card'-->
        <router-link v-if="orderData.totalCount - orderData.usedCount <= 0 || cardType!='item_card'" class="submit-button footer" :to="{path: '/' + clubId + '/discountMall'}" tag="div">逛商城、找优惠</router-link>
    </div>
</template>
<script>
    import Vue from 'vue'
    import Global from '../libs/global'
    import Util from '../libs/util'
    import MoneyFormatter from '../filters/money-formatter'
    import itemDataTime from '../components/item-data-time'
    import 'jr-qrcode'

    export default {
        filters: {
            MoneyFormatter: MoneyFormatter
        },
        components: {
            'item-data-time': itemDataTime
        },
        data () {
            return {
                global: Global.data,
                orderId: '',
                cardId: '',
                cardType: '',
                clubLogo: '',
                clubName: '',
                clubId: '',
                orderData: {
                    imgUrl: '',
                    itemName: '',
                    name: '',
                    amount: '',
                    useEndTime: '',
                    totalCount: 0,
                    usedCount: 0,
                    canUseCount: 0,
                    credits: 0,
                    status: '',
                    originOwnerName: '',
                    giveAvatarUrl: '',
                    avatarUrl: '',
                    giveCount: 0,
                    isGived: 0,
                    haveGiveRecord: 0
                },
                modifyTime: '',
                canUseList: {},
                usedList: {},
                currShowIndex: 0,
                inEdit: false
            }
        },
        computed: {
            hasSelected () {
                let that = this
                let list = that.canUseList
                let coupons
                let i
                for (let key in list) {
                    coupons = list[key].coupons
                    for (i = 0; i < coupons.length; i++) {
                        if (coupons[i].isCheck) {
                            return true
                        }
                    }
                }
                return false
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query

            that.orderId = query.id
            if (!that.orderId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            that.$http.get('../api/v2/club/item_card/order/detail', {params: {orderId: that.orderId}}).then(function (res) {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    var orderData = res.order
                    var thisOrderData = that.orderData
                    var couponList = res.couponList
                    that.modifyTime = res.currentTime
                    var canUseList = {}
                    var usedList = {}

                    that.clubLogo = orderData.clubImageUrl || global.defaultClubLogo
                    that.clubName = orderData.clubName
                    that.clubId = orderData.clubId
                    that.cardType = orderData.cardType
                    that.cardId = orderData.activityId
                    thisOrderData.haveGiveRecord = orderData.haveGiveRecord

                    thisOrderData.imgUrl = orderData.imageUrl || global.defaultServiceItemImgUrl
                    thisOrderData.itemName = orderData.itemName
                    thisOrderData.name = orderData.name
                    thisOrderData.amount = orderData.amount
                    thisOrderData.useEndTime = orderData.useEndTime
                    thisOrderData.totalCount = orderData.totalCount
                    thisOrderData.usedCount = orderData.usedCount
                    thisOrderData.canUseCount = orderData.totalCount - orderData.usedCount
                    thisOrderData.status = orderData.status
                    thisOrderData.originOwnerName = orderData.originOwnerName
                    thisOrderData.giveAvatarUrl = orderData.giveAvatarUrl
                    thisOrderData.avatarUrl = orderData.avatarUrl
                    thisOrderData.giveCount = orderData.giveCount
                    thisOrderData.isGived = orderData.isGived
                    thisOrderData.credits = orderData.credits || 0

                    // 分割项目
                    let splitedItemIds = orderData.itemId.split(',')
                    let splitedItemNames = orderData.itemName.split(',')
                    let splitItemObj = {}
                    splitedItemIds.forEach(function (splitedItem, k) {
                        splitItemObj[splitedItem] = splitedItemNames[k]
                    })

                    let tag
                    let listObj
                    let listItemObj
                    let itemId
                    couponList.forEach(function (couponItem) {
                        couponItem.codeImgUrl = jrQrcode.getQrBase64(couponItem.couponNo, {padding: 0})
                        couponItem.couponNoStr = Util.spaceFormat(couponItem.couponNo)
                        tag = couponItem.couponSettled == 'Y' // 是否已用
                        listObj = tag ? usedList : canUseList
                        itemId = couponItem.itemId
                        couponItem.isCheck = false
                        if (!listObj[itemId]) {
                            listObj[itemId] = {
                                itemName: splitItemObj[itemId],
                                coupons: [],
                                isShow: true // 控制展开、收起
                            }
                        }
                        listItemObj = listObj[itemId]
                        listItemObj.coupons.push(couponItem)
                    })
                    that.canUseList = canUseList
                    that.usedList = usedList
                    global.loading = false
                } else {
                    Util.tipShow(res.msg || global.loadError)
                    that.$router.back()
                }
            })
        },
        methods: {
            /**
            * 确认赠送
            */
            doConfirmGive () {
                var that = this
                let key
                let item
                var global = that.global
                var query = global.currPage.query
                that.orderId = query.id
                var actIdsArr = []
                for (key in that.canUseList) {
                    item = that.canUseList[key]
                    item.coupons.forEach(function (coupon) {
                        if (coupon.isCheck) {
                            actIdsArr.push(coupon.suaId)
                        }
                    })
                }
                if (actIdsArr[0]) {
                    var actIds = actIdsArr.join(',')
                    that.$router.push({ name: 'itemDonationDetail', query: { id: that.orderId, actIds: actIds, avatarUrl: that.orderData.avatarUrl } })
                }
            },
            /**
             * 取消按钮
             */
            doGiveFriends () {
                this.inEdit = !this.inEdit
                var key
                var item
                for (key in this.canUseList) {
                    item = this.canUseList[key]
                    item.coupons.forEach(function (coupon) {
                        coupon.isCheck = false
                    })
                }
            },
            /**
             * 勾选赠送好友的券
             */
            doCheck (list, index) {
                let item = list[index]
                item.isCheck = !item.isCheck
                Vue.set(list, index, item)
            },
            /**
             * 切换已使用、未使用
             * @param index
             */
            doSwitchList (index) {
                this.currShowIndex = index
            },
            /**
             * 切换列表的展开、收起
             * @param index
             */
            doSwitchShow (item) {
                item.isShow = !item.isShow
            }
        }
    }
</script>
