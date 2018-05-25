<style lang="sass">
    @import '../sass/page/hourTicketList.scss';
</style>
<template>
    <div class="page" id="hour-ticket-list-page">
        <div class="list" style="height: 100%;">
            <div class="item" v-for="item in dataList" @click="doClickPaidCoupon(item.actId)">
                <div>
                    <div><span v-show="item.useType == 'money'">￥</span>{{ item.useType == "money" ? item.actValue : item.actTitle }}</div>
                    <span>{{ item.consumeMoneyDescription }}</span>
                    <div>
                        <div>{{ item.useTypeName }}</div>
                        <div>立即购买</div>
                    </div>
                    <div></div>
                    <div></div>
                </div>
            </div>
            <div class="nullData" v-show="dataList.length==0">
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
                dataList: [],
                clubId: '',
                techCode: ''
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query

            document.title = '点钟券'
            that.clubId = query.clubId || global.clubId
            that.techCode = query.techCode
            that.$http.get('../api/v1/profile/redpack/list', {params: {clubId: that.clubId}}).then(function (res) {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData.coupons
                    var list = []
                    for (var i = 0; i < res.length; i++) {
                        if (res[i].couponType == 'paid') {
                            res[i].useType = (res[i].useType == 'null' ? 'money' : res[i].useType)
                            list.push(res[i])
                        }
                    }
                    that.dataList = list
                    global.loading = false
                } else {
                    Util.tipShow(res.msg || global.loadError)
                    that.$router.back()
                }
            }, function () {
                Util.tipShow(global.loadError)
                that.$router.back()
            })
        },
        methods: {
            doClickPaidCoupon (actId) {
                var that = this
                var global = that.global
                if (!global.isLogin) {
                    global.loginPage = 'paidCoupon'
                    global.loginPageQuery = {actId: actId, techCode: that.techCode}
                } else {
                    that.$router.push({name: 'paidCoupon', query: {actId: actId, techCode: that.techCode}})
                }
            }
        }
    }
</script>
