<style lang="sass">
    @import '../sass/page/account.scss';
</style>
<template>
    <div class="page" id="account-page">
        <div class="search-area">
            <input type="text" placeholder="输入会所名称" maxlength="50" v-model="searchText" @keypress.enter="doSearch()"/>
            <span @click="doSearch()"></span>
        </div>
        <div class="list">
            <router-link class="member-card" :class="'tpl-0'+item.styleId" v-for="(item,index) in dataList" :key="index" v-show="showList[index]" :to="{ name : 'accountDetail', query : { accountId : item.id } }">
                <div>
                    <div>
                        <div :style="{ backgroundImage : 'url('+(item.clubImage || global.defaultClubLogo)+')' }"></div>
                        <div>{{ item.clubName }} <span class="isChain" v-if="item.chainId != 0">连锁</span></div>
                    </div>
                    <div>
                        <div><span :class="{ vip : item.isVip }">{{ item.isVip ? 'vip' : item.discount }}</span>{{ item.isVip ? '' : '折'}}</div>
                        <div>{{ item.memberTypeName }}会员</div>
                    </div>
                </div>
                <div>
                    <div>ID：{{ item.cardNo }}</div>
                    <div></div>
                </div>
            </router-link>
        </div>
        <div class="nullData" v-show="noData">
            <div v-show="!global.loading"></div>
            <div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                dataList: [],
                showList: [],
                searchText: '',
                noData: true
            }
        },
        created () {
            var that = this
            var global = that.global
            that.$http.get('../api/v2/financial/accounts').then((res) => {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    var showList = []
                    var item
                    var i
                    for (i = 0; i < res.length; i++) {
                        item = res[i]
                        if (item.discount / 100 >= 10) {
                            item.isVip = true
                        } else {
                            item.isVip = false
                            item.discount = (item.discount / 100).toFixed(2).replace(/0*$/g, '').replace(/\.$/g, '')
                        }
                        item.cardNo = Util.spaceFormat(item.cardNo)
                        showList.push(true)
                    }
                    that.dataList = res
                    that.showList = showList
                    if (res.length > 0) {
                        that.noData = false
                    }
                } else {
                    Util.tipShow(res.msg || global.loadError)
                    return that.$router.back()
                }
                global.loading = false
            }, () => {
                Util.tipShow(global.loadError)
                return that.$router.back()
            })
            document.title = '会员卡'
        },
        methods: {
            doSearch () {
                var that = this
                var searchText = that.searchText.trim()
                var list = that.dataList
                var showList = []
                var k
                if (list.length > 0) {
                    if (searchText) {
                        var item
                        that.noData = true
                        for (k = 0; k < list.length; k++) {
                            item = list[k]
                            if (item.clubName.indexOf(searchText) >= 0) {
                                showList.push(true)
                                that.noData = false
                            } else {
                                showList.push(false)
                            }
                        }
                    } else {
                        that.noData = false
                        for (k = 0; k < list.length; k++) {
                            showList.push(true)
                        }
                    }
                    that.showList = showList
                }
            }
        }
    }
</script>
