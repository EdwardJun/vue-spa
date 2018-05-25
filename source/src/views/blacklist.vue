<style lang="sass">
    @import '../sass/page/blacklist.scss';
</style>
<template>
    <div class="page-blacklist">
        <div class="list" ref="listEle" @scroll="doHandlerListScroll" style="height: 100%">
            <div v-for="(item,index) in blacklist" :key="index">
              <div class="club-name" v-show="global.pageMode != 'club'">{{item.clubName}}</div>
              <ul>
                  <li v-for="record in item.list" class="list-item" @click="doClickRecord(record)">
                      <div :style="{ 'background-image' : `url(${record.friendAvatarUrl ? record.friendAvatarUrl : global.defaultManagerHeader}),url(${item.toType != 'manager' ? global.defaultHeader : global.defaultManagerHeader})` }"></div>
                      <div>
                          <div>
                              <div><div>{{record.friendName}}</div><div class="tech">{{record.techNo}}</div></div>
                          </div>
                          <div><div>{{record.friendDescription || '暂无简介'}}</div></div>
                      </div>
                  </li>
              </ul>
            </div>
            <div class="data-load-tip" :class="{ none : !showDataLoadTip }"><div>加载数据</div></div>
            <div class="finish-load-tip" :class="{ none : !showFinishLoadTip || blacklist.length==0 }"><div>已经加载全部数据</div></div>
            <div class="nullData" v-show="blacklist.length==0 && !isAddData"><div></div><div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div></div>
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
                clubName: '',
                blacklist: {}, // 联系人列表
                showDataLoadTip: false, // 显示数据正在加载
                showFinishLoadTip: false, // 显示已经加载完成
                isDataAddEnd: false, // 数据是否已加载完
                isAddData: false, // 数据是否正在加载
                currPage: 0,
                pageSize: 10
            }
        },
        // computed: {
        //     isNoData () {
        //         return Object.keys(this.blacklist).length == 0
        //     }
        // },
        created () {
            let that = this
            let global = that.global
            document.title = '黑名单'
            that.queryContact()
            global.loading = false
        },
        methods: {
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

                that.$http.get('../api/v1/emchat/blacklist', {
                    params: {
                        page: page,
                        pageSize: that.pageSize,
                        userId: global.userId
                    }
                }).then(res => {
                    res = res.body
                    if (res) {
                        res = (res.statusCode != '200') ? [] : res['respData']
                        let k
                        let item
                        let listItem
                        let blackList = that.blacklist
                        let list
                        for (k = 0; k < res.length; k++) {
                            item = res[k]
                            if (global.pageMode == 'club' && item.clubId != global.clubId) {
                                continue
                            }
                            listItem = blackList[item.clubId]
                            if (!listItem) {
                                listItem = blackList[item.clubId] = {
                                    clubName: item.clubName,
                                    list: []
                                }
                            }
                            list = listItem.list
                            list.push(item)
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
                if (!that.isDataAddEnd && listEle.scrollTop + listEle.clientHeight * 1.4 > listEle.scrollHeight) {
                    that.queryContact()
                }
            },
            doClickRecord (item) {
                let that = this
                let global = that.global
                if (global.clubId) {
                    that.$router.push({ name: 'technicianDetail', query: { id: item.friendUserId } })
                } else {
                    that.$router.push({
                        path: '/' + item.clubId + '/technicianDetail',
                        query: { id: item.friendUserId }
                    })
                }
            }
        }
    }
</script>
