
<style lang="sass">
    @import '../sass/page/qrPayComplete.scss';
</style>
<template>
    <div class="page" id="qrpay-complete-page">
        <div class="success-info">
            <div>
                <span><i></i><span>成功支付</span></span><span><span>{{ money }}</span><span>元</span></span>
            </div>
        </div>
        <div class="comment-star">
            <div>
                <div>环境</div>
                <div>
                    <div class="stars-area" @click="doClickCommentStar(0,$event)"><div :style="{ width : environmentScore+'%' }"></div></div>
                </div>
                <div>非常好</div>
            </div>
            <div>
                <div>服务</div>
                <div>
                    <div class="stars-area" @click="doClickCommentStar(1,$event)"><div :style="{ width : serviceScore+'%' }"></div></div>
                </div>
                <div>非常好</div>
            </div>
        </div>
        <div class="comment-title">会所评价</div>
        <textarea class="comment-text" placeholder="您的建设很重要，来点评下吧！" v-model="commentStr"></textarea>
        <div class="submit-btn" @click="doClickSubmitBtn()" :class="{ processing: inSubmit }">{{ inSubmit ? '正在提交...' : '提交' }}</div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                scoreObj: ['非常差', '很差', '一般', '很好', '非常好'],
                clubId: '',
                money: '',
                environmentScore: 100,
                serviceScore: 100,
                commentStr: '',
                payToken: '',
                inSubmit: false
            }
        },
        created () {
            var that = this
            var global = that.global
            var pageParams = global.currPage.query

            document.title = '支付完成'
            that.money = pageParams.money
            that.clubId = pageParams.clubId || global.clubId || ''
            that.payToken = pageParams.payToken
            if (!that.money || !that.clubId) {
                Util.tipShow(global.visitError)
                that.$router.back()
            } else {
                global.loading = false
            }
        },
        methods: {
            doClickCommentStar (type, event) {
                var that = this
                var v = Math.ceil((event.offsetX || event.layerX) / (8.611 * 16 * that.global.winScale * 0.2))
                if (type == 0) {
                    that.environmentScore = v * 20
                } else {
                    that.serviceScore = v * 20
                }
            },
            doClickSubmitBtn () {
                var that = this
                if (that.inSubmit) {
                    return Util.tipShow('正在提交，请稍候...')
                }
                that.inSubmit = true
                that.$http.post('../api/v2/profile/user/feedback/create', {
                    clubId: that.clubId,
                    environmentalScore: that.environmentScore,
                    serviceScore: that.serviceScore,
                    comments: encodeURIComponent(that.commentStr.substr(0, 1000)),
                    token: that.payToken
                }).then(function (res) {
                    res = res.body
                    that.inSubmit = false
                    if (res.statusCode == 200) {
                        Util.tipShow('提交成功！')
                        that.$router.push({name: 'home'})
                    } else {
                        Util.tipShow(res.msg || '提交失败！')
                    }
                }, function () {
                    that.inSubmit = false
                    Util.tipShow('提交失败！')
                })
            }
        }
    }
</script>
