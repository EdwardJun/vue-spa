<style lang="sass">
    @import '../sass/page/accountDetail.scss';
</style>
<template>
    <div class="page" id="account-detail-page" :class="{ noMember : !hasMember }">
        <template v-if="hasMember">
            <div class="card-wrap">
                <router-link v-if="memberCard" class="member-card" :class="'tpl-0'+memberCard.styleId" :to="{ name : 'qrPayCode' , query : { accountId : accountId }}">
                    <div>
                        <div>
                            <div :style="{ backgroundImage : 'url('+(memberCard.clubImage || global.clubLogoUrl || global.defaultClubLogo)+')' }"></div>
                            <div>{{ memberCard.clubName || global.clubName }} <span class="isChain" v-if="chainId != 0">连锁</span></div>
                        </div>
                        <div>
                            <div><span :class="{ vip : memberCard.isVip }">{{ memberCard.isVip ? 'vip' : memberCard.discount }}</span>{{ memberCard.isVip ? '' : '折'}}</div>
                            <div>{{ memberCard.memberTypeName || memberCard.name }}会员</div>
                        </div>
                    </div>
                    <div>
                        <div>ID：{{ memberCard.cardNo }}</div>
                        <div></div>
                    </div>
                </router-link>
            </div>
            <div class="money-info">
                <div><span>可用金额：</span><span>{{ availableMoney }}</span></div>
                <div><span>冻结金额：</span><span>{{ frozenMoney }}</span></div>
            </div>
            <router-link v-if="chainId != 0" class="right-arrow-item item" :to="{ name : 'clubChains' , query : { id : chainId, type: 'member' }}">适用门店</router-link>
            <router-link class="record-item right-arrow-item item" :to="{ name : 'tradeRecords' , query : { accountId : accountId }}">交易记录</router-link>
            <router-link class="invite-item right-arrow-item item" :to="{ name : 'treat' , query : { accountId : accountId }}">我要请客</router-link>
            <div class="explain-info">
                <div>会员说明：</div>
                <ul><li v-for="desc in descList">{{ desc }}</li></ul>
            </div>
        </template>
        <template v-else>
            <div class="none-member">
                <div>
                    <div>您当前没有会员卡记录哦~</div>
                    <div>开卡请到会所门店</div>
                </div>
            </div>
            <div class="member-list-title" v-show="cardList.length>0">会所的会员卡</div>
            <div class="member-list" v-show="cardList.length>0">
                <div v-for="item in cardList" class="member-card" :class="'tpl-0'+item.styleId">
                    <div>
                        <div>
                            <div :style="{ backgroundImage : 'url('+(item.clubImage || global.clubLogoUrl || global.defaultClubLogo)+')' }"></div>
                            <div>{{ item.clubName || global.clubName }}</div>
                        </div>
                        <div>
                            <div><span :class="{ vip : item.isVip }">{{ item.isVip ? 'vip' : item.discount }}</span>{{ item.isVip ? '' : '折'}}</div>
                            <div>{{ item.memberTypeName || item.name }}会员</div>
                        </div>
                    </div>
                    <div>
                        <div>ID：{{ item.cardNo }}</div>
                        <div></div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                hasMember: true,
                chainId: '',
                accountId: '',
                clubId: '',
                availableMoney: '-',
                frozenMoney: '-',
                descList: [],
                memberCard: null,
                cardList: []
            }
        },
        created () {
            var that = this
            var global = that.global
            var pageParams = global.currPage.query
            var queryDataUrl = '../api/v2/financial/'
            var isFromClub = false

            that.accountId = pageParams.accountId || ''
            if (!that.accountId && !global.clubId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            } else if (that.accountId) {
                isFromClub = false
                queryDataUrl += 'account/' + that.accountId
            } else {
                isFromClub = true
                queryDataUrl += 'club/account'
            }
            that.$http.get(queryDataUrl, {params: {clubId: global.clubId}}).then((res) => {
                res = res.body
                if (res.statusCode == 200 && res.respData) {
                    res = res.respData

                    if (!res.info && isFromClub) {
                        that.hasMember = false
                        if (res.memberTypes) {
                            var list = res.memberTypes || []
                            var arr = []
                            list.forEach((listItem) => {
                                arr.push(that.doHandlerMemberCard(listItem))
                            })
                            that.cardList = arr
                        }
                    } else {
                        that.hasMember = true
                        if (isFromClub) {
                            res = res.info
                        }
                        that.chainId = res.chainId
                        that.accountId = res.id
                        that.availableMoney = (res.amount / 100).toFixed(2)
                        that.frozenMoney = (res.freezeAmount / 100).toFixed(2)
                        that.clubId = res.clubId
                        that.descList = res.description.split(/[\f\n]/g)
                        that.memberCard = that.doHandlerMemberCard(res)
                    }
                    global.loading = false
                } else {
                    Util.tipShow(global.loadError)
                    that.$router.back()
                }
            })
            document.title = '会员卡详情'
        },
        methods: {
            doHandlerMemberCard (cardData) {
                if (cardData.discount / 100 >= 10) {
                    cardData.isVip = true
                } else {
                    cardData.isVip = false
                    cardData.discount = (cardData.discount / 100).toFixed(2).replace(/0*$/g, '').replace(/\.$/g, '')
                }
                cardData.cardNo = Util.spaceFormat(cardData.cardNo || '8888888888888888')
                return cardData
            }
        }
    }
</script>
