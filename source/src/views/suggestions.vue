<style lang="sass">
    @import '../sass/page/suggestions.scss';
</style>
<template>
    <div class="page" id="suggestions-page" :style="{'min-height': global.winHeight+'px'}">
        <ul class="tab">
            <li v-for="(item, index) in tabArr" @click="doSwitchTab(index)">{{ item }}</li>
        </ul>

        <!--<div class="star-comment" v-show="commentList.length>0">
            <div v-for="(item, index) in commentList">
                <div>{{ item.tagName }}</div>
                <div class="stars" @click="doClickCommentStar($event, index)">
                    <div :style="{ width: scoreList[index] + '%' }"></div>
                </div>
                <div>{{ rateList[index][scoreList[index]+''] }}</div>
            </div>
        </div>-->

        <div class="input-comment" >
            <div><div>&nbsp;&nbsp;留言投诉</div></div>
            <!--placeholder="给会所一个评价吧"-->
            <div><textarea placeholder="请输入您的吐槽内容吧～" maxlength="1000" v-model="commentText"></textarea>
            <span>超出500字，打电话更方便哦</span>
            </div>
        </div>

        <div class="donation-btn" @click="doSubmitComment()" :class="{ processing: inSubmit }"><a>{{ inSubmit ? '提交中...' : '确定' }}</a></div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import Vue from 'vue'
    import eventHub from '../libs/hub'

    export default {
        data () {
            return {
                global: Global.data,
                commentText: '',
                commentList: [], // 评价项目
                rateList: [], // 评价的每一项目评分标准
                scoreList: [], // 每一项分数
                isAnonymous: false,
                inSubmit: false,
                tabArr: ['在线客服', '客服热线']
            }
        },
        created () {
            var that = this
            var global = that.global
            if (!global.clubId) {
                that.$router.back()
            } else {
                // 获取会所评价标签
                document.title = '投诉建议'
                that.$http.get('../api/v2/club/tag/getClubTagByType', {params: {tagType: 2, clubId: global.clubId}}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData || []
                        var rateObj = {}
                        var rateRemarkArr
                        var tempArr
                        var rateList = []
                        var scoreList = []
                        res.forEach(function (item) {
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
                        that.commentList = res
                        global.loading = false
                    } else {
                        Util.tipShow(res.msg || '查询会所评价标签数据出错！')
                        that.$router.back()
                    }
                })
            }
        },
        methods: {
            doClickCommentStar (event, index) {
                var that = this
                var v = Math.ceil((event.offsetX || event.layerX) / (10.944 * 16 * that.global.winScale * 0.2))
                Vue.set(that.scoreList, index, v * 20)
            },
            doCheckAnonymous () {
                this.isAnonymous = !this.isAnonymous
            },
            doSubmitComment () {
                var that = this
                if (that.inSubmit) {
                    return Util.tipShow('提交中，请稍候...')
                }
                var rateList = []
                var item
                for (var k = 0; k < that.commentList.length; k++) {
                    item = that.commentList[k]
                    rateList.push({
                        commentTagId: item.tagId,
                        commentTagName: item.tagName,
                        commentRate: that.scoreList[k],
                        commentTagType: 2
                    })
                }
                that.inSubmit = true
                // isAnonymous: that.isAnonymous ? 'Y' : 'N',
                // rateList: JSON.stringify(rateList)
                that.$http.post('../api/v2/profile/user/complaint/create', {
                    clubId: that.global.clubId,
                    comment: that.commentText.substr(0, 1000)
                }).then(function (res) {
                    res = res.body
                    that.inSubmit = false
                    if (res.statusCode == 200) {
                        Util.tipShow('提交成功！')
                        that.$router.push({name: 'personal'})
                    } else {
                        Util.tipShow(res.msg || '提交失败！')
                    }
                }, function () {
                    that.inSubmit = false
                    Util.tipShow('提交失败！')
                })
            },
            doSwitchTab (tabIndex) {
                var that = this
                if (tabIndex == 0) {
                    that.doContactServicer()
                } else if (tabIndex == 1) {
                    that.doClickSuggestionBtn()
                }
            },
            /**
             * 点击客服按钮
             * @return
             */
            doContactServicer () {
                let that = this
                let global = that.global
                that.$http.get('../api/v2/club/emchat/service/get', {params: {clubId: global.clubId}}).then(function (res) {
                    res = res.body
                    let statusCode = res.statusCode
                    if (statusCode == 200 && res.respData) {
                        that.$router.push({name: 'chat', query: {techId: res.respData.techId}})
                    } else if (statusCode == 211) { // 没有会所客服
                        eventHub.$emit('change-tel-detail', true)
                    } else if (statusCode == 210) { // 有客服但是全部不在线
                        eventHub.$emit('do-show-service-tip', true)
                    }
                })
            },
            doClickSuggestionBtn () {
                let that = this
                if (that.global.clubTelephone.length > 0) {
                    eventHub.$emit('change-tel-detail', true)
                } else {
                    Util.tipShow('暂无会所电话！')
                }
            }
        }
    }
</script>
