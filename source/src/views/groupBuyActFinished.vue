<!--拼团活动已结束页面-->
<style lang="sass">
    @import '../sass/page/groupBuyActFinished.scss';
</style>
<template>
    <div class="page" id="group-buy-act-finished-page">
        <div class="top-wrap">
            <div>活动已结束！</div>
            <div>您来晚啦~</div>
            <router-link :to="{ path: '/' + clubId + '/home' }" tag="div">返回首页</router-link>
        </div>
        <div class="act-list" v-show="paidServiceItems.length>0 && bodySetting.act.isShow == 'Y'">
            <div class="wrap-title"><span>{{ bodySetting.act.title }}</span><router-link :to="{ path: '/' + clubId + '/activities' }" tag="div">更多</router-link></div>
            <template v-for="(item,index) in paidServiceItems">
                <PaidServiceAct v-if="item.actType == 'paid_item'" :act-data="item" :key="index"></PaidServiceAct>
                <OneYuanAct v-if="item.actType && item.actType == 'one_yuan' && item.status != 'complete'" :act-data="item" :key="index"></OneYuanAct>
            </template>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import GroupBuyAct from '../components/group-buy-act'
    import PaidServiceAct from '../components/paid-service-act'
    import OneYuanAct from '../components/one-yuan-act'

    export default {
        components: {
            'group-buy-act': GroupBuyAct, PaidServiceAct, OneYuanAct
        },
        watch: {
            // 应用会所设置
            'global.clubHomeConfig' (newval, old) {
                if (newval.home_module) {
                    this.doHandlerClubHomeConfig()
                }
            }
        },
        data () {
            return {
                global: Global.data,
                clubId: '',
                paidServiceItems: [],
                bodySetting: {
                    act: {}
                }
            }
        },
        created () {
            let that = this
            let global = that.global
            let query = global.currPage.query
            let ss = Util.sessionStorage
            let cacheDataStr = ss('club-home-data')
            let cacheData = cacheDataStr ? JSON.parse(cacheDataStr) : null

            that.clubId = query.clubId || global.clubId
            // 从缓存加载数据
            if (cacheData && cacheData.clubId == global.clubId) {
                that.paidServiceItems = cacheData.paidServiceItems
            }
            // 初始化首页设置
            if (global.clubHomeConfig.home_module) {
                that.doHandlerClubHomeConfig()
            }
            that.getPaidServiceItems()
            global.loading = false
        },
        methods: {
            doHandlerClubHomeConfig () {
                let that = this
                let homeModule = that.global.clubHomeConfig.home_module
                homeModule.forEach(function (item) {
                    switch (item.code) {
                    case 'hotActivity':
                        that.bodySetting.act = {
                            order: item.position,
                            isShow: item.isShow,
                            title: item.title
                        }
                        break
                    }
                })
            },
            getPaidServiceItems () { // 抢购项目数据
                let that = this
                that.$http.get('../api/v2/club/recommend/list', {
                    params: {
                        clubId: that.clubId,
                        businessCategory: 'hot_activity'
                    }
                }).then(function (paidItemRes) {
                    paidItemRes = paidItemRes.body
                    if (paidItemRes.statusCode == 200) {
                        paidItemRes = paidItemRes.respData || {}
                        let actList = []
                        let actItem
                        let splitIndex
                        let itemIndex
                        let itemActType
                        for (let paidItemKey in paidItemRes) {
                            actItem = paidItemRes[paidItemKey]
                            splitIndex = paidItemKey.lastIndexOf('_')
                            itemIndex = paidItemKey.substr(splitIndex + 1) - 1
                            itemActType = paidItemKey.substr(0, splitIndex)
                            if (itemActType == 'paid_service_item') {
                                itemActType = 'paid_item'
                            }
                            actItem.actType = itemActType
                            if (/^(paid_item|one_yuan)$/.test(itemActType)) {
                                actList[itemIndex] = actItem
                            }
                        }
                        that.paidServiceItems = actList
                    }
                })
            }
        }
    }
</script>