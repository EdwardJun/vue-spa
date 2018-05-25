<style lang="sass">
    @import '../sass/page/review.scss';
</style>
<template>
    <div class="page" id="review-list-page">
        <!-- :class="{ 'search-active': showSearchInput }" -->
        <div class="menu" >
            <div class="status" @click="doClickShowSelectReview(1)">
                <div :class="{ active : showSelectReview }">{{currType == 'order' ? '订单评论' : ( currType == 'tech' ? '粉丝评论' : '全部评论' )}}</div>
            </div>
            <div class="filter" @click="doClickShowSelectScore(2)">
                <!--<div :class="{ active : showSelectScore }">{{ scoreActiveId !='1' ? '全部' : '有文字的评论' }}</div>-->
                <div :class="{ active : showSelectScore }">筛选</div>
            </div>
        </div>

        <!--  'show-search' : showSearchInput,  -->
        <div class="pop-modal selector-area" :class="{active : showSelectScore || showSelectReview || showServiceItemSelectArea }">
            <div class="comment" :class="{ active : showSelectScore || showSelectReview }">
                <div v-show="currNumType==1" @click="doSelectCommentType('')" :class="{ active : currType=='' }">全部评论<i></i><i></i></div>
                <div v-show="currNumType==1" @click="doSelectCommentType('order')" :class="{ active : currType=='order' }">订单评论</div>
                <div v-show="currNumType==1" @click="doSelectCommentType('tech')" :class="{ active : currType=='tech' }">粉丝评论</div>

                <div v-show="currNumType==2" @click="doClickChangeScoreStatus('2')" :class="{ active : scoreActiveId =='2' }">全部</div>
                <div v-show="currNumType==2" @click="doClickChangeScoreStatus('1')" :class="{ active : scoreActiveId =='1' }">有文字的评论</div>
            </div>
        </div>

        <div class="comment-list" ref="listEle" :style="{ height : (global.winHeight-2.44*global.winScale*16)+'px' }" @scroll="doHandlerListScroll()">
            <div class="comment-item" v-for="item in comments">
                <div>
                    <div :style="{ backgroundImage : 'url('+(item.avatarUrl || global.defaultHeader)+'),url('+global.defaultHeader+')' }"></div>
                    <div>{{ ((!item.name || item.name=="null") ? "匿名用户" : item.name ) }}</div>
                    <div>{{item.createdAt}}</div>
                    <div>{{item.commentType == "tech" ? "粉丝" : "订单" }}评论</div>
                </div>
                <div>
                    <div :style="{ width: starWidth * 5+'px', 'background-size': starWidth+'px 1.111rem' }"><div :style="{ width : item.rate+'%', 'background-size': starWidth+'px 1.111rem' }"></div></div>
                    <div v-show="item.rewardAmount != 0"><i></i>打赏：<span>{{ (item.rewardAmount/100).toFixed(2) }}</span>元</div>
                </div>
                <div v-show="item.comment">{{ item.comment }}</div>
            </div>
            <div class="data-load-tip" :class="{ none : !showDataLoadTip }"><div>加载数据</div></div>
            <div class="finish-load-tip" :class="{ none : !showFinishLoadTip }"><div>已加载完全部数据</div></div>
            <div class="nullData" v-show="comments.length==0 && !isAddData">
                <div v-show="!global.loading"></div>
                <div>{{ global.loading ? '数据加载中...' : '暂无内容...' }}</div>
            </div>
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
                pageSize: 20,
                currPage: 1,
                currType: '',
                techId: '',
                comments: [],
                showDataLoadTip: false, // 显示数据正在加载
                showFinishLoadTip: false, // 显示已经加载完成
                isDataAddEnd: false, // 数据是否已加载完
                isAddData: false, // 数据是否正在加载
                showCommentTypeSelect: false,
                starWidth: 0,
                currNumType: 0,
                scoreActiveId: '1',
                showSelectReview: false,
                showServiceItemSelectArea: false, // 是否显示服务项目选择
                showSelectScore: false // 评论评分的下拉选择
            }
        },
        created () {
            var that = this
            var global = that.global
            if (!global.clubId) {
                return that.$router.back()
            }
            that.techId = global.currPage.query.id
            that.starWidth = Math.floor(1.333 * global.winScale * 16)
            if (!that.techId) { // 链接上无技师id
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            document.title = '评论列表'
            that.$http.get('../api/v2/club/technician/comments', {
                params: {
                    page: that.currPage,
                    pageSize: that.pageSize,
                    type: that.currType,
                    techId: that.techId,
                    isEmpty: that.scoreActiveId // 1 有文字评论 2 所有评论
                }
            }).then(function (res) {
                res = res.body
                global.loading = false
                if (res.statusCode == 200) {
                    res = res.respData
                    if (res.length == 0) {
                        that.isDataAddEnd = true
                    } else if (res.length < that.pageSize) {
                        that.isDataAddEnd = true
                        that.showFinishLoadTip = true
                    }
                    that.comments = res
                } else {
                    Util.tipShow(global.loadError)
                    that.$router.back()
                }
            }, function () {
                Util.tipShow(global.loadError)
                that.$router.back()
            })
        },
        methods: {
            doClickShowSelectScore (type) {
                this.showSelectScore = !this.showSelectScore
                this.currNumType = type
                this.showSelectReview = false
            },
            doClickShowSelectReview (type) {
                this.showSelectReview = !this.showSelectReview
                this.currNumType = type
                this.showSelectScore = false
            },
            doClickChangeScoreStatus (type) {
                var that = this
                if (that.scoreActiveId != type) {
                    this.scoreActiveId = type
                    that.currType = ''
                    that.queryCommentData(1)
                }
                that.showSelectScore = false
            },
            doSelectCommentType (type) {
                var that = this
                if (that.currType != type) {
                    that.currType = type
                    this.scoreActiveId = 2
                    that.queryCommentData(1)
                }
                this.showSelectReview = false
            },
            doShowCommentTypeSelect () {
                this.showCommentTypeSelect = !this.showCommentTypeSelect
            },
            queryCommentData (page) { // 查询列表数据
                var that = this
                if (that.isAddData) {
                    return
                }
                that.isAddData = true
                page = page || that.currPage + 1

                // 更新数据加载提示
                that.showDataLoadTip = true
                that.showFinishLoadTip = false
                that.isDataAddEnd = false

                that.$http.get('../api/v2/club/technician/comments', {
                    params: {
                        page: page,
                        pageSize: that.pageSize,
                        type: that.currType,
                        techId: that.techId,
                        isEmpty: that.scoreActiveId // 1 有文字评论 2 所有评论
                    }
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.publComment(res, page)
                    } else {
                        Util.tipShow(that.global.loadError)
                    }
                }, function () {
                    Util.tipShow(that.global.loadError)
                })
            },
            queryCommentList (page) {
                var that = this
                if (that.isAddData) {
                    return
                }
                that.isAddData = true
                page = page || that.currPage + 1
                // 更新数据加载提示
                that.showDataLoadTip = true
                that.showFinishLoadTip = false
                that.isDataAddEnd = false

                that.$http.get('../api/v2/comment/app/notnullcomment/list', {
                    params: {
                        page: page,
                        pageSize: that.pageSize,
                        technicianId: that.techId,
                        isEmpty: that.scoreActiveId
                    }
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.publComment(res, page)
                    } else {
                        Util.tipShow(that.global.loadError)
                    }
                }, function () {
                    Util.tipShow(that.global.loadError)
                })
            },
            publComment (res, page) {
                var that = this
                if (page == 1) {
                    that.comments = res
                    if (res.length == 0) {
                        that.isDataAddEnd = true
                    } else if (res.length < that.pageSize) {
                        that.isDataAddEnd = true
                        that.showFinishLoadTip = true
                    }
                } else {
                    for (var i = 0; i < res.length; i++) {
                        that.comments.push(res[i])
                    }
                    if (res.length < that.pageSize) {
                        that.isDataAddEnd = true
                        that.showFinishLoadTip = true
                    }
                }
                that.currPage = page
                that.isAddData = false
                that.showDataLoadTip = false
            },
            doHandlerListScroll () { // 列表的滚动加载
                var that = this
                var listEle = that.$refs.listEle
                if (!that.isDataAddEnd && listEle.scrollTop + listEle.clientHeight * 1.4 > listEle.scrollHeight) {
                    that.queryCommentData()
                }
            }
        }
    }
</script>
