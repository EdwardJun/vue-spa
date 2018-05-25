<template>
    <div class="page club-list-page" id="club-list-search-page" :style="{ height : (global.winHeight-2.667*global.winScale*16)+'px' }" @scroll="doHandlerScroll()">
        <div class="page-title search-title">
            <a class="back" @click="doClickPageBack()"></a>
            <input type="text" v-model="searchText" placeholder="输入会所名称、地址、技师标签" maxlength="50" @keypress.enter="doClickSearchBtn()"/>
            <div @click="doClickSearchBtn()">搜索</div>
        </div>
        <div class="tags" v-show="showTags">
            <div>会所</div>
            <ul class="clear-fix">
                <li v-for="item in clubTags" @click="doClickTag(item)">{{ item }}</li>
            </ul>
        </div>
        <div class="tags" v-show="showTags && techTags.length>0">
            <div>技师</div>
            <ul class="clear-fix">
                <li @click="doClickTag(item.name)" v-for="item in techTags">{{ item.name }}</li>
            </ul>
        </div>
        <div class="club-list" v-show="!showTags && clubList.length>0">
            <div class="list-title">会所</div>
            <Club v-for="item in clubList" :club-obj="item" :key="item.id"></Club>
            <div class="view-more" @click="doClickViewMore('club')" v-show="!showClubDataFinish" :class="{ 'loading-data' : loadingClubData }"><span>{{ loadingClubData ? '正在加载...' : '查看更多会所' }}</span></div>
            <div class="finish-load-tip" :class="{ none : !showClubDataFinish }">
                <div>已经加载全部数据</div>
            </div>
        </div>
        <div class="tech-list" v-show="!showTags && techList.length>0">
            <div class="list-title">技师</div>
            <Tech v-for="item in techList" :tech-obj="item" :search-text="searchText" :key="item.id"></Tech>
            <div class="view-more" @click="doClickViewMore('tech')" v-show="!showTechDataFinish" :class="{ 'loading-data' : loadingTechData }"><span>{{ loadingTechData ? '正在加载...' : '查看更多技师' }}</span></div>
            <div class="finish-load-tip" :class="{ none : !showTechDataFinish }">
                <div>已经加载全部数据</div>
            </div>
        </div>
        <div class="nullData" v-show="!showTags && clubList.length==0 && techList.length==0">
            <div></div>
            <div>未能搜索到内容...</div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import eventHub from '../libs/hub'
    import Util from '../libs/util'
    import Club from '../components/club'
    import Tech from '../components/tech'

    export default {
        components: {
            Club, Tech
        },
        data () {
            return {
                global: Global.data,
                currCity: '',
                currRegion: '',
                clubTags: ['按摩', '桑拿', '水疗', '水会', '休闲', 'SPA'],
                techTags: [],
                searchText: '',
                scrollTop: 0,
                showTags: true,
                clubList: [],
                techList: [],
                showClubDataFinish: false,
                showTechDataFinish: false,
                queryClubPage: 1,
                queryTechPage: 1,
                loadingTechData: false,
                loadingClubData: false,
                queryPageSize: 3
            }
        },
        mounted () {
            let that = this
            let global = that.global
            let query = global.currPage.query
            let ss = Util.sessionStorage
            let ssc = Util.removeSessionStorage
            let cacheData = ss('club-search-info')
            let isLoadCache = false
            if (query.key) {
                that.searchText = decodeURIComponent(query.key)
            }
            if (cacheData) {
                cacheData = JSON.parse(cacheData)
                if (cacheData.searchText == that.searchText) {
                    isLoadCache = true
                    that.clubList = JSON.parse(ss('club-search-club-data'))
                    that.techList = JSON.parse(ss('club-search-tech-data'))
                    that.clubTags = cacheData.clubTags
                    that.techTags = cacheData.techTags
                    that.showTags = cacheData.showTags
                    that.showClubDataFinish = cacheData.showClubDataFinish
                    that.showTechDataFinish = cacheData.showTechDataFinish
                    that.queryClubPage = cacheData.queryClubPage
                    that.queryTechPage = cacheData.queryTechPage

                    that.scrollTop = cacheData.top
                    that.$nextTick(function () {
                        setTimeout(function () {
                            that.$el.scrollTop = that.scrollTop
                            global.loading = false
                        }, 100)
                    })
                }
                // 清除缓存
                ssc('club-search-club-data')
                ssc('club-search-tech-data')
                ssc('club-search-info')
            }

            if (!isLoadCache) {
                that.queryTechTags()
                if (that.searchText) {
                    that.doClickSearchBtn()
                }
                global.loading = false
            }

            eventHub.$on('put-curr-city-region', that.doPutCurrCityRegion)
            eventHub.$emit('get-curr-city-region')
        },
        methods: {
            // 查询会所标签
            queryClubTags () {
                var that = this
                var global = that.global
                that.$http.post('../api/v2/club/tags', {
                    city: that.currCity || '',
                    region: that.currRegion || '',
                    laty: global.currLaty || 0,
                    lngx: global.currLngx || 0
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        if (res && res instanceof Array) {
                            that.clubTags = res
                        }
                    } else {
                        Util.tipShow(res.msg || '查询会所标签数据出错！')
                    }
                })
            },
            // 查询技师标签
            queryTechTags () {
                var that = this
                that.$http.get('../api/v2/club/tag/getTagByType', {params: {tagType: 0}}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.techTags = res.respData
                    } else {
                        Util.tipShow(res.msg || '查询印象标签数据出错！')
                    }
                })
            },
            // 点击标签
            doClickTag (tag) {
                this.searchText = tag
                this.doClickSearchBtn()
            },
            // 点击搜索按钮
            doClickSearchBtn () {
                var that = this
                var global = that.global
                if (that.searchText == '') {
                    that.showTags = true
                    return
                }
                that.$router.replace({name: 'clubList-search', query: {key: encodeURIComponent(that.searchText)}})

                that.showClubDataFinish = false
                that.showTechDataFinish = false
                that.queryClubPage = 1
                that.queryTechPage = 1
                that.loadingTechData = false
                that.loadingClubData = false

                that.$http.post('../api/v2/club/club_tech_search', {
                    laty: global.currLaty || '',
                    lngx: global.currLngx || '',
                    page: 1,
                    pageSize: 3,
                    search: that.searchText.trim(),
                    searchType: ''
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.showTags = false
                        that.techList = res.techs || []
                        that.clubList = res.clubs || []
                    }
                })
            },
            // 点击'查看更多会所/技师'
            doClickViewMore (type) {
                var that = this
                var global = that.global
                var page
                var k
                if ((type == 'club' && that.loadingClubData) || (type == 'tech' && that.loadingTechData)) return
                if (type == 'club') {
                    that.loadingClubData = true
                    page = ++that.queryClubPage
                } else {
                    that.loadingTechData = true
                    page = ++that.queryTechPage
                }
                that.$http.post('../api/v2/club/club_tech_search', {
                    laty: global.currLaty || '',
                    lngx: global.currLngx || '',
                    page: page,
                    pageSize: that.queryPageSize,
                    search: that.searchText,
                    searchType: type
                }).then(function (res) {
                    res = res.body
                    type == 'club' ? that.loadingClubData = false : that.loadingTechData = false
                    if (res.statusCode == 200) {
                        res = res.respData
                        res = (type == 'club' ? res.clubs : res.techs) || []
                        if (page == 1) {
                            type == 'club' ? that.clubList = res : that.techList = res
                        } else {
                            if (type == 'club') {
                                for (k = 0; k < res.length; k++) {
                                    that.clubList.push(res[k])
                                }
                            } else {
                                for (k = 0; k < res.length; k++) {
                                    that.techList.push(res[k])
                                }
                            }
                        }
                        if (res.length < 10) {
                            type == 'club' ? that.showClubDataFinish = true : that.showTechDataFinish = true
                        }
                    }
                })
            },
            // 获取到curr city region
            doPutCurrCityRegion (option) {
                var that = this
                that.currCity = option.city
                that.currRegion = option.region
                that.queryClubTags()
            },
            doClickPageBack () {
                this.$router.go(-1)
            },
            doHandlerScroll () {
                let that = this
                that.scrollTop = that.$el.scrollTop
            },
            /**
             * 缓存数据
             * @return
             */
            cacheData () {
                let that = this
                let ss = Util.sessionStorage

                ss('club-search-club-data', JSON.stringify(that.clubList))
                ss('club-search-tech-data', JSON.stringify(that.techList))
                ss('club-search-info', JSON.stringify({
                    clubTags: that.clubTags,
                    techTags: that.techTags,
                    searchText: that.searchText,
                    showTags: that.showTags,
                    showClubDataFinish: that.showClubDataFinish,
                    showTechDataFinish: that.showTechDataFinish,
                    queryClubPage: that.queryClubPage,
                    queryTechPage: that.queryTechPage,
                    top: that.scrollTop
                }))
            }
        },
        beforeDestroy () {
            eventHub.$off('put-curr-city-region', this.doPutCurrCityRegion)
            this.cacheData()
        }
    }
</script>
