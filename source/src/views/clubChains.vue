<style lang="sass">
    @import '../sass/page/clubChains.scss';
</style>
<template>
    <div class="page" id="club-chains-page">
        <div class="all-list" ref="listEle" v-show="!noData" :style="{ height : listHeight + 'px' }" @scroll="doHandlerListScroll()">
            <div>
                <div v-for="item in dataList" class="list-item" :key="item.$index">
                    <router-link tag="div" :to="{ path: '/'+ item.id + '/home'}">
                        <div>{{ item.name }}</div>
                        <div>{{ item.address }}</div>
                    </router-link>
                    <router-link tag="div" :to="{name: 'map', query: {clubId: item.id }}">{{ item.distance }}</router-link>
                    <div @click="doPopTel(item.mobilePhone)"></div>
                </div>
            </div>
            <div class="data-load-tip" :class="{ none : !showDataLoadTip }"><div>加载数据</div></div>
            <div class="finish-load-tip" :class="{ none : !showFinishLoadTip }"><div>已经加载全部数据</div></div>
        </div>
        <div class="nullData" v-show="noData">
            <div v-show="!global.loading"></div>
            <div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div>
        </div>
        <TelDetail :telephone="tels" :show-prefix="false"></TelDetail>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import eventHub from '../libs/hub'
    import TelDetail from '../components/tel-detail'

    export default {
        components: {
            TelDetail
        },
        data () {
            return {
                global: Global.data,
                listHeight: 0,
                chainId: '',
                chainType: '',
                pageSize: 10,
                currPage: 0,
                dataList: [],
                listEle: null,
                showDataLoadTip: false, // 显示数据正在加载
                showFinishLoadTip: false, // 显示已经加载完成
                isDataAddEnd: false, // 数据是否已加载完
                isAddData: false, // 数据是否正在加载
                noData: true,
                tels: [],
                currScrollTop: 0
            }
        },
        mounted () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            that.chainId = query.id
            that.chainType = query.type
            document.title = '门店地址'
            that.listHeight = global.winHeight
            if (!that.chainId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }

            that.queryData(1)
        },
        methods: {
            doHandlerListScroll () {
                var that = this
                var listEle = that.$refs.listEle
                that.currScrollTop = listEle.scrollTop
                if (!that.isDataAddEnd && listEle.scrollTop + listEle.clientHeight * 1.4 > listEle.scrollHeight) {
                    that.queryData()
                }
            },
            doPopTel (tels) {
                let that = this
                if (tels) {
                    that.tels = tels.split(',')
                    eventHub.$emit('change-tel-detail-of-tech', true)
                } else {
                    Util.tipShow('暂无会所电话！')
                }
            },
            queryData (page) {
                var that = this
                var global = that.global
                if (that.isAddData) {
                    return
                }
                that.isAddData = true
                page = page || that.currPage + 1

                // 更新数据加载提示
                that.showDataLoadTip = true
                that.showFinishLoadTip = false
                that.isDataAddEnd = false

                that.$http.get('../api/v2/club/chain/clubs', {params: {
                    chainId: that.chainId,
                    laty: global.currLaty,
                    lngx: global.currLngx,
                    type: that.chainType,
                    page: page,
                    pageSize: that.pageSize
                }}).then((res) => {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData || []
                        let distance
                        res.forEach((item) => {
                            distance = item.distance
                            if (distance) {
                                if (distance >= 1) {
                                    if (distance > 10000) {
                                        item.distance = '-km'
                                    } else if (distance > 1000) {
                                        item.distance = distance.toFixed(0) + 'km'
                                    } else {
                                        item.distance = distance.toFixed(1) + 'km'
                                    }
                                } else {
                                    item.distance = parseInt(distance * 1000) + 'm'
                                }
                            }
                        })
                        that.dataList.push(...res)
                        if (res.length < that.pageSize) {
                            that.isDataAddEnd = true
                            that.showFinishLoadTip = true
                        }
                        that.currPage = page
                        that.isAddData = false
                        that.showDataLoadTip = false

                        if (res.length > 0) {
                            that.noData = false
                        }
                        if (page == 1) {
                            global.loading = false
                        }
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                    }
                }, () => {
                    Util.tipShow(global.loadError)
                })
            }
        }
    }
</script>
