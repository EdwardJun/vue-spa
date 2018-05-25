<style lang="sass">
    @import '../sass/page/comment.scss';
</style>
<template>
    <div class="page" id="comment-page" :class="{ 'already-comment' : orderType != 0 }">
        <div class="wrap thanks">
            <div>
                <div></div>
                <div>感谢您的评价!</div>
            </div>
        </div>
        <div class="tech-info-wrap" v-show="techName">
            <router-link :to="{ name : 'technicianDetail' , query : { id : techId }}">
                <div :style="{ backgroundImage : 'url('+techHeader+')' }"></div>
                <div>
                    <div>{{ techName }}</div>
                    <div v-show="techNo">{{ techNo }}</div>
                </div>
            </router-link>
        </div>
        <div class="comment-info wrap" v-show="commentItems.length>0">
            <div class="item" v-for="(item, index) in commentItems">
                <div>{{ item.name }}</div>
                <div @click="doClickCommentStar($event, index)">
                    <div :style="{ width : scoreList[index]+'%' }"></div>
                </div>
                <div :class="rateList[index][scoreList[index]]">{{ rateList[index][scoreList[index] + ''] }}</div>
            </div>
        </div>
        <div class="comment-impression wrap" v-show="impressionList.length>0">
            <div class="title">印象点评<span>（最多3项）</span></div>
            <div class="comment-labels">
                <div v-for="item in impressionList" :key="item.id" @click="doClickImpressionItem(item)" :class="{ active : item.selected }">{{ item.name }}
                </div>
            </div>
            <div class="comment-text" v-show="!(orderType == 1 && commentInputText.length == 0)">
                <textarea maxlength="200" ref="commentInput" @focus="onTextareaFocus()" @blur="onTextareaBlur()" v-model="commentInputText" :readonly="orderType==1"></textarea>
                <div>200字以内哦~</div>
                <span :class="{ none : !showTextareaPlaceholder }">亲，点击这里，留句好评哦，么么哒~</span>
            </div>
        </div>
        <Attention v-show="commentItems.length>0"></Attention>
        <div class="submit-btn" v-show="commentItems.length>0">
            <div :class="{ checked: isAnonymous }" @click="doCheckAnonymous()">匿名评价</div>
            <div class="submit-button" @click="doClickSubmitBtn()" :class="{ processing : inProcessing }">{{ inProcessing ? '提交中...' : '发表评价' }}</div>
        </div>
    </div>
</template>
<script>
    import Vue from 'vue'
    import Global from '../libs/global'
    import Util from '../libs/util'
    import Attention from '../components/attention'

    export default {
        components: {
            Attention
        },
        data () {
            return {
                global: Global.data,
                orderId: '',
                techId: '',
                clubId: '',
                type: '',
                commentId: '',
                orderType: 0,
                techHeader: '',
                techName: '',
                techStars: 0,
                techNo: '',
                qrcodeType: '',
                commentCount: 0,
                commentInputText: '',
                showTextareaPlaceholder: true,
                inProcessing: false,
                rewardStatus: false,
                impressionList: [],
                selectedImpression: [],
                isScan: false,
                commentItems: [], // 评价项目
                rateList: [], // 评价的每一项目评分标准
                scoreList: [], // 每一项分数
                isAnonymous: false,
                isFromFastPay: false,
                backTo: ''
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            that.techId = query.techId
            that.clubId = query.clubId || global.clubId
            that.orderId = query.orderId || query.id
            that.type = query.type || 'tech'
            that.backTo = query.backTo || ''

            if (!that.clubId) {
                Util.tipShow('页面缺少clubId参数')
                return setTimeout(() => { that.$router.back() }, 1000)
            }

            if (!that.techId) {
                Util.tipShow('页面缺少techId参数')
                return setTimeout(() => { that.$router.back() }, 1000)
            }

            // if (!that.orderId) {
            //     Util.tipShow('页面缺少orderId参数')
            //     return setTimeout(() => {that.$router.back()},1000)
            // }

            that.$http.get('../api/v2/user/comment/switch', {params: {clubId: that.clubId}}).then(function (res) {
                res = res.body
                if (res.statusCode == 200) {
                    if (res.respData) { // 评论开启
                        that.init()
                    } else {
                        that.queryReward()
                    }
                }
            })
        },
        methods: {
            init () {
                var that = this
                var global = that.global
                var query = global.currPage.query
                var qrcodeType = query.clubsource
                var ss = Util.sessionStorage

                ss('qrcodeType', qrcodeType)
                that.qrcodeType = ss('qrcodeType')
                that.commentId = query.commentId || ''
                that.isScan = query.isScan == 1
                that.isFromFastPay = query.from == 'fastPay'

                that.$http.get('../api/v2/club/shared/technician', {
                    params: {
                        id: that.orderId || that.techId,
                        type: that.type,
                        commentId: that.commentId
                    }
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        if (res.isUserRewardPage) {
                            that.queryReward()
                        } else {
                            that.queryTechTag(res)
                        }
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                        that.$router.back()
                    }
                }, function () {
                    Util.tipShow(global.loadError)
                    that.$router.back()
                })
            },
            /**
             * 查询技师评价标签和印象标签
             */
            queryTechTag (data) {
                var that = this
                var impressionLabelObj
                var selectedImpressionObj
                var k
                that.$http.get('../api/v2/club/tag/getClubTagList', {params: {clubId: that.clubId}}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData

                        // 处理技师评分标签
                        var scoreTagList = res.scoreTagList
                        var rateObj = {}
                        var rateRemarkArr
                        var tempArr
                        var rateList = []
                        var scoreList = []
                        scoreTagList.forEach(function (item) {
                            if (!item.rateRemark) {
                                item.rateRemark = '100:非常好,80:满意,60:一般,40:不满意,20:非常差'
                            }
                            rateRemarkArr = item.rateRemark.split(',')
                            rateObj = {}
                            rateRemarkArr.forEach(function (val) {
                                tempArr = val.split(':')
                                rateObj[tempArr[0]] = tempArr[1]
                            })
                            rateList.push(rateObj)
                            scoreList.push(100)
                        })

                        that.rateList = rateList
                        that.scoreList = scoreList
                        that.commentItems = scoreTagList

                        // 处理印象标签
                        var impressionTagList = res.impressionTagList
                        impressionLabelObj = {}
                        for (k = 0; k < impressionTagList.length; k++) {
                            impressionTagList[k]['selected'] = (selectedImpressionObj && selectedImpressionObj[impressionTagList[k]['name']])
                            impressionLabelObj[impressionTagList[k]['name']] = k
                        }
                        that.impressionList = impressionTagList

                        // 查询技师信息
                        that.queryTechInfo(data, impressionLabelObj, selectedImpressionObj)
                    } else {
                        Util.tipShow(res.msg || '查询技师评价标签和印象标签！')
                        // console.log(res.msg || '查询技师评价标签和印象标签！')
                        return that.$router.back()
                    }
                })
            },
            /**
             * 查询技师信息
             */
            queryTechInfo (data, impressionLabelObj, selectedImpressionObj) {
                var that = this
                var global = that.global

                var techInfo = data.tech
                that.techId = techInfo.id
                that.techHeader = techInfo.avatarUrl || global.defaultHeader
                that.techName = techInfo.name || global.defaultTechName
                that.commentCount = techInfo.commentCount || 0
                that.techNo = techInfo.serialNo
                that.techStars = techInfo.star || 0
                that.clubId = techInfo.clubId
                that.orderType = data.allow

                if (that.orderType == 1) {
                    var commentData = data.commentBo.obj
                    that.commentInputText = commentData.comment + ''

                    // 显示技师评分
                    var scoreData = data.commentBo.commentRateList
                    scoreData.forEach(function (scoreItem, i) {
                        if (scoreItem.commentRate < 20) {
                            scoreItem.commentRate = 20
                        }
                        Vue.set(that.scoreList, i, scoreItem.commentRate)
                    })

                    // 显示技师印象标签
                    var impressionArr = commentData.impression.split('、')
                    var i
                    var impressionIndex
                    var impressionObj
                    selectedImpressionObj = {}
                    for (i = 0; i < impressionArr.length; i++) {
                        selectedImpressionObj[impressionArr[i]] = true
                        if (impressionLabelObj) {
                            impressionIndex = impressionLabelObj[impressionArr[i]]
                            impressionObj = that.impressionList[impressionIndex]
                            if (impressionObj) {
                                Vue.set(that.impressionList, impressionIndex, {
                                    name: impressionObj.name,
                                    id: impressionObj.id,
                                    selected: true
                                })
                            }
                        }
                    }
                }
                // 设置分享
                if (global.userAgent.isWX) {
                    Global.shareConfig({
                        title: that.techName + '欢迎您',
                        desc: '点我聊聊，更多优惠，更好服务！',
                        link: global.prefixPathname + '#/' + that.clubId + '/technicianDetail?visitChannel=9358&isNeedFollow=true&id=' + that.techId,
                        imgUrl: that.techHeader,
                        success: () => {
                            // console.log('scan分享统计')
                            that.$http.post('../api/v1/scan/code/stat', {
                                clubId: that.clubId,
                                qrcodeType: that.qrcodeType,
                                statType: 'share',
                                techId: that.techId
                            }).then((res) => {
                                res = res.body
                                if (res.statusCode != 200) {
                                    //  console.log('统计分享失败')
                                }
                            })
                        }
                    }, 'technicianDetail-' + that.techId)
                }
                global.loading = false
            },
            doCheckAnonymous () {
                this.isAnonymous = !this.isAnonymous
            },
            doClickCommentStar (event, index) { // 点击服务评级
                var that = this
                if (that.orderType != 0) return
                var v = Math.ceil((event.offsetX || event.layerX) / (8.611 * 16 * that.global.winScale * 0.2))
                var scoreList = that.scoreList
                if (v > 5) {
                    v = 5
                }
                Vue.set(scoreList, index, v * 20)
            },
            onTextareaFocus () {
                var that = this
                if (that.orderType != 0) return
                that.showTextareaPlaceholder = false
                that.$refs.commentInput.scrollIntoView(true)
            },
            onTextareaBlur () {
                var that = this
                if (that.orderType != 0) return
                if (that.commentInputText.length == 0) {
                    that.showTextareaPlaceholder = true
                }
            },
            doClickSubmitBtn () {
                var that = this
                var global = that.global
                if (that.inProcessing) {
                    Util.tipShow('正在提交评论，请稍候...')
                } else {
                    if (that.orderType == 0) {
                        that.inProcessing = true
                        var commentItems = that.commentItems
                        var impressionArr = []
                        var list = that.impressionList
                        var rateList = []
                        list.forEach(function (item) {
                            if (item.selected) {
                                impressionArr.push(item.name)
                            }
                        })

                        commentItems.forEach(function (commentItem, i) {
                            rateList.push({
                                commentTagId: commentItem.id,
                                commentTagName: commentItem.name,
                                commentRate: that.scoreList[i],
                                commentTagType: 1
                            })
                        })

                        that.$http.post('../api/v2/club/user/comment/create', {
                            id: that.orderId || that.techId,
                            type: that.isScan ? 'tech_qrcode' : that.type,
                            rateList: JSON.stringify(rateList),
                            impression: impressionArr.join('、'),
                            comment: that.commentInputText,
                            isAnonymous: that.isAnonymous ? 'Y' : 'N'
                        }).then(function (res) {
                            res = res.body
                            if (res.statusCode == 200) {
                                if (that.qrcodeType) {
                                    // console.log('scan点评统计')
                                    this.$http.post('../api/v1/scan/code/stat', {
                                        clubId: that.clubId,
                                        qrcodeId: that.qrcodeId || '',
                                        qrcodeType: that.qrcodeType,
                                        statType: 'comment',  // 点评
                                        techId: that.techId
                                    })
                                }
                                Util.tipShow(res.msg)
                                that.orderType = 1
                                that.commentCount++
                                if (global.userAgent.isWX) {
                                    var currPageQuery = global.currPage.query
                                    var commentId = res.respData || ''
                                    currPageQuery.commentId = commentId
                                    that.$router.replace({name: 'comment', query: currPageQuery})
                                    that.$router.push({
                                        name: 'techReward',
                                        query: {
                                            techId: that.techId,
                                            commentId: res.respData || '',
                                            isAnonymous: (that.isAnonymous ? 'Y' : 'N'),
                                            backTo: (that.qrcodeType == 'tech_qrcode' ? 'home' : '') || that.backTo,
                                            orderId: that.orderId
                                        }
                                    })
                                }
                            } else if (res.statusCode == 412) {
                                Util.tipShow(res.msg || '您今天已经评论过该技师了')
                                // console.log(that.isFromFastPay)
                                if (that.isFromFastPay) {
                                    setTimeout(function () {
                                        // 弹出感谢打赏的窗口
                                        // eventHub.$emit('pop-reward', {
                                        //     avatarUrl: that.techHeader,
                                        //     id: that.techId,
                                        //     name: that.techName,
                                        //     clubName: global.clubName || '小摩豆会所',
                                        //     clubId: that.clubId
                                        // })
                                        that.$router.push({name: 'home'})
                                    }, 300)
                                } else {
                                    // console.log('!isFromFastPay')
                                    that.$router.back()
                                }
                            } else {
                                Util.tipShow(res.msg || '评论出错！')
                            }
                            that.inProcessing = false
                        })
                    } else {
                        Util.tipShow('此评论已提交。')
                    }
                }
            },
            doClickImpressionItem (impressionItem) {
                var that = this
                var k = 0
                var selectedList = that.selectedImpression
                var impressionList = that.impressionList
                if (that.orderType != 0) return
                if (impressionItem.selected) { // 取消选中
                    var index = impressionList.indexOf(impressionItem)
                    Vue.set(impressionList, index, {id: impressionItem.id, name: impressionItem.name, selected: false})
                    for (k = 0; k < selectedList.length; k++) {
                        if (selectedList[k] == impressionItem.id) {
                            selectedList.splice(k, 1)
                            break
                        }
                    }
                } else { // 增加选中
                    if (selectedList.length == 3) {
                        for (k = 0; k < impressionList.length; k++) {
                            if (impressionList[k].id == selectedList[0]) {
                                Vue.set(impressionList, k, {
                                    id: impressionList[k].id,
                                    name: impressionList[k].name,
                                    selected: false
                                })
                                break
                            }
                        }
                        selectedList.splice(0, 1)
                    }
                    Vue.set(impressionList, impressionList.indexOf(impressionItem), {
                        id: impressionItem.id,
                        name: impressionItem.name,
                        selected: true
                    })
                    selectedList.push(impressionItem.id)
                }
            },
            queryReward () {
                var that = this
                that.$http.get('../api/v2/user/reward/isRewardOn', {params: {clubId: that.clubId}}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.rewardStatus = res.respData
                        if (res.respData) {
                            return that.$router.replace({name: 'techReward', query: {techId: that.techId}})
                        } else {
                            return that.$router.replace({name: 'technicianDetail', query: {id: that.techId}})
                        }
                    }
                })
            }
        }
    }
</script>
