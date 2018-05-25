<style lang="sass">
    @import '../sass/page/luckyDetail.scss';
</style>
<template>
    <div class="page" id="lucky-detail-page">
        <div class="club-name">{{ clubName }}</div>
        <div class="prize-wrap">
            <div>{{ prizeName }}<span>大转盘</span></div>
            <div>中奖时间：{{ prizeTime }}</div>
        </div>
        <div class="code-wrap">
            <div>电子票号(使用时请出示{{ prizeType == 1 ? '兑换码' : '二维码，或者优惠码' }})</div>
            <img :src="codeUrl" v-if="codeUrl && prizeType != 1"/>
            <div :class="{ big: prizeType == 1 }">{{ verifyCode | CodeFormatter }}</div>
        </div>
        <div class="desc-wrap">
            <div>抽奖说明</div>
            <div v-html="actDesc"></div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import 'jr-qrcode'
    import CodeFormatter from '../filters/code-formatter'

    export default {
        filters: {
            CodeFormatter: CodeFormatter
        },
        data () {
            return {
                global: Global.data,
                requestTag: 0,
                clubName: '',
                prizeName: '',
                prizeTime: '-',
                verifyCode: '',
                codeUrl: '',
                actDesc: '',
                prizeType: ''
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query

            var recordId = query.recordId
            var cardId = query.cardId
            var prizeType = query.prizeType
            var actId = query.actId

            that.prizeType = prizeType

            document.title = '中奖详情'
            if (!recordId || !prizeType || !actId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            that.queryData(recordId, actId, cardId, prizeType)
        },
        methods: {
            init (data) {
                var that = this
                that.clubName = data.clubName
                that.prizeTime = data.prizeTime
                that.prizeName = data.prizeName
                that.actDesc = data.actDesp || '无'
                that.verifyCode = data.verifyCode
                if (data.qrCode) {
                    data.qrCode = JSON.parse(data.qrCode)
                    that.codeUrl = jrQrcode.getQrBase64(data.qrCode.qrNo, {padding: 0})
                }
            },
            queryData (recordId, actId, cardId, prizeType) {
                var that = this
                var global = that.global
                that.$http.post('../api/v2/user/luckyWheel/cardPrizeDetail', {
                    recordId: recordId,
                    actId: actId,
                    cardId: cardId,
                    prizeType: prizeType
                }).then(function (res) {
                    res = res.body
                    that.requestTag ++
                    if (res.statusCode == 200) {
                        that.init(res.respData)
                        global.loading = false
                    } else if (res.statusCode == 307 && that.requestTag < 3) {
                        setTimeout(function () {
                            that.queryData(recordId, actId, cardId, prizeType)
                        }, 300)
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                        that.$router.back()
                    }
                }, function () {
                    Util.tipShow(global.loadError)
                    that.$router.back()
                })
            }
        }
    }
</script>
