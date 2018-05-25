<style lang="sass">
    @import "../sass/page/itemCardDonationDetail.scss";
</style>
<template>
    <div class="page" id="item-card-donation-detail-page" :style="{ 'min-height': global.winHeight+'px'}">
        <div class="item">
            <div>目前状态: <div v-show="recordData.status==2">已赠送</div></div>
            <div>赠送时间: <div>{{ recordData.createTime }}</div></div>
            <div>赠予: <div>{{ recordData.gainerName }}</div></div>
        </div>
        <div class="item-list">
            <div>
                <div :style="{ 'background-image': 'url('+(recordData.imageUrl || global.defaultServiceItemImgUrl)+')' }"></div><!--图片-->
                <div>
                    <div>
                        <div><div>{{ recordData.itemName }} * </div> <div> {{ recordData.giveCount }} </div> <div>次</div></div>
                        <div>总价 : <div> {{ recordData.amount / 100 }}</div>元</div>
                        <div>
                            <div>有效期至:</div><!--小图标-->
                            <div>{{ recordData.useEndTime }}</div>
                        </div>
                    </div>
                </div>
                <!--<div>已赠送</div>-->
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
                recordId: '',
                pageSize: 20,
                recordData: {
                    imageUrl: '',
                    itemName: '',
                    itemCount: '',
                    totalMoney: '',
                    activityName: '',
                    status: 0,
                    createTime: '',
                    giveUserName: '',
                    gainerName: '',
                    giveCount: '',
                    expireTime: ''
                }
            }
        },
        created () {
            var that = this
            that.global.loading = false
            document.title = '次卡赠送详情'
            that.queryData()
        },
        methods: {
            /**
             * 查询数据
             */
            queryData () {
                var that = this
                var global = that.global
                var query = global.currPage.query
                that.recordId = query.id
                if (!that.recordId) {
                    Util.tipShow(global.visitError)
                    return that.$router.back()
                }
                that.$http.get('../api/v2/user/item_card/order/give/record/detail', {params: {
                    recordId: that.recordId
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData || []
                        that.recordData = res
                    }
                })
            }
        }
    }
</script>
