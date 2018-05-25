<!--赠送详情-->
<style lang="sass">
    @import "../sass/page/itemDonationDetail.scss";
</style>
<template>
    <div class="page" id="item-donation-detail">
        <div class="item-friends">
            <div :style="{ 'background-image': 'url('+(detailData.avatarUrl || global.defaultHeader)+')'}"></div><!--会所图片-->
            <div>您赠送给好友的次卡</div><!--会所名称-->
        </div>
        <!--次卡信息-->
        <div class="card-info">
            <div>
                <div>次卡信息</div>
                <div class="item item-content"><!--router-link -->
                    <div :style="{ 'background-image': 'url('+detailData.imageUrl+')' }"></div><!--图片-->
                    <div>
                        <div>
                            <div><div>{{ detailData.activityName }}</div></div>
                            <div>{{ detailData.itemName }} * {{ detailData.itemCount }}次 </div>
                        </div>
                    </div>
                    <div>￥{{ detailData.totalMoney / 100}}</div>
                </div>
            </div>
        </div>
        <!--赠送说明-->
        <div class="ex-info">
            <div>
                <div class="donation-info">赠送说明</div>
                <ul>
                    <div><div></div><li>赠送完成后,您将无法使用已赠送次卡中的服务项目,转赠时请认真核实信息;</li></div>
                    <div><div></div><li>赠送发起后24小时内,若好友未领取您的赠送,所赠送的次卡将返还至您的账户;</li></div>
                    <div><div></div><li>[{{detailData.clubName}}]保留对次卡赠送法律范围内的最终解释权。若有其他疑问，请咨询[{{detailData.clubName}}]客服。</li></div>
                </ul>
            </div>
        </div>

        <!--赠送给好友-->
        <div class="donation-btn" @click="doGiveFirends()"><a>赠送给好友</a></div>

        <Share :share-url = "shareUrl"></Share>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import eventHub from '../libs/hub'
    import Share from '../components/share'

    export default {
        components: {
            Share
        },
        data () {
            return {
                global: Global.data,
                orderId: '',
                actIds: '',
                detailData: {
                    imageUrl: '',
                    itemName: '',
                    totalMoney: '',
                    clubName: '',
                    itemCount: '',
                    activityName: '',
                    clubId: ''
                },
                shareUrl: '', // 分享链接
                cardName: '',
                recordId: ''
            }
        },
        created () {
            var that = this
            that.global.loading = false
            var global = that.global
            var query = global.currPage.query
            that.orderId = query.id
            that.actIds = query.actIds
            if (!that.orderId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            document.title = '赠送详情'
            // 此接口适配当前页面次卡信息记录
            that.$http.get('../api/v2/user/item_card/order/give/detail', {params: {
                orderId: that.orderId,
                actIds: that.actIds
            }}).then(function (res) {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData || {}
                    that.detailData = res
                }
            })
        },
        methods: {
            /**
             * 赠送给好友
             */
            doGiveFirends () {
                var that = this
                var global = that.global
                if (!that.orderId && !that.actIds) {
                    Util.tipShow(global.visitError)
                    return that.$router.back()
                }
                that.$http.post('../api/v2/user/item_card/order/give', {
                    orderId: that.orderId,
                    actIds: that.actIds
                }).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        that.recordId = res.recordId
                        that.cardName = res.cardName
                        that.shareUrl = global.prefixPathname + '#/' + that.detailData.clubId + '/itemReceive?recordId=' + that.recordId
                        if (global.userAgent.isWX) {
                            Global.shareConfig({
                                title: '好友赠送福利，当抢则抢！！！',
                                desc: '价值' + that.detailData.totalMoney / 100 + '元' + ',免费好礼,速速来抢',
                                imgUrl: that.detailData.imageUrl,
                                link: that.shareUrl,
                                success () {
                                    that.$http.get('../api/v2/user/item_card/order/give/share/callback', {params: {
                                        recordId: that.recordId
                                    }})
                                    eventHub.$emit('change-share-pop', false)
                                }
                            }, 'itemDonationDetail')
                        }
                        eventHub.$emit('change-share-pop', true)
                    }
                })
            }
        }
    }
</script>
