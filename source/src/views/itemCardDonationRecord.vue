<style lang="sass">
    @import "../sass/page/itemCardDonationRecord.scss";
</style>
<template>
    <div class="page" id="item-card-donation-record-page" :style="{ 'min-height': global.winHeight+'px'}">
        <div class="spa-name">
            <router-link tag="div" :to="{ path: '/'+clubId+'/home' }">
                <div :style="{'background-image':'url('+clubLogoUrl+')'}"></div>
                <span>{{clubName}}</span>
            </router-link>
            <i class="helf" @click="doClickHelp()">提示说明</i>
        </div>

        <!--item-->
        <div class="item-list">
            <item-card-donation-record v-for="(item,index) in recordList" :key="index" :record-data="item"></item-card-donation-record>
        </div>

        <!--弹窗-->
        <div class="card-package-pop-wrap pop-modal" :class="{ active: help }">
            <div class="center-wrap">
                <div class="center-header">次卡赠送好友 <span @click="doCloseHelp('help')"></span></div>
                <div class="center-content">
                    <div class="pop-content">
                        <div>1</div> <!--序号-->
                        <div>赠送好友有什么作用？</div><!--标题-->
                        <div>
                            <div>赠送好友是指您可以使用小摩豆将账户中未使用完的次卡赠送给好友,好友获得您的赠送即可进行消费。</div><!--内容-->
                        </div>
                    </div>

                    <div class="pop-content">
                        <div>2</div> <!--序号-->
                        <div>怎么赠送好友？</div><!--标题-->
                        <div>
                            <div>选择需赠送给好友的次卡&gt;&gt;点击赠送好友&gt;&gt;选择服务项目&gt;&gt;点击确认赠送&gt;&gt;分享给微信好友&gt;&gt;好友领取>>赠送成功。</div><!--内容-->
                        </div>
                    </div>

                    <div class="pop-content">
                        <div>3</div> <!--序号-->
                        <div>赠送规则</div><!--标题-->
                        <div>
                            <div><span class="rule"></span>赠送发起后,您将无法使用已赠送次卡中的服务项目,赠送时请认真核实信息;</div><!--内容-->
                            <div><span class="rule"></span>赠送发起后24小时内,若好友未领取您的赠送,赠送的次卡将返还至您的账户;</div>
                            <div><span class="rule"></span>[{{clubName}}]保留对次卡赠送好友法律范围内的最终解释权。若有其他疑问,请咨询[会所名称]客服。</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import itemCardDonationRecord from '../components/item-card-donation-record'
    import eventHub from '../libs/hub'
    // import Util from '../libs/util'

    export default {
        components: {
            'item-card-donation-record': itemCardDonationRecord
        },
        data () {
            return {
                global: Global.data,
                orderId: '',
                help: false,
                clubId: '',
                clubName: '',
                clubLogoUrl: '',
                recordList: []
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            that.clubId = query.clubId || global.clubId
            that.orderId = query.orderId || global.orderId || ''
            if (global.pageMode == 'club' && that.clubId == global.clubId) {
                that.clubName = global.clubName
                that.clubLogoUrl = global.clubLogoUrl
            } else {
                that.$http.get('../api/v2/club/' + that.clubId + '/clubName').then(function (res) {
                    res = res.body
                    that.clubLogoUrl = res.logo || global.defaultClubLogo
                    that.clubName = res.name
                })
            }
            if (!that.orderId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            that.queryData()
            that.global.loading = false
        },
        methods: {
            /**
             * 查询数据
             */
            queryData () {
                var that = this
                that.$http.get('../api/v2/user/item_card/order/give/record/list', {params: {
                    orderId: that.orderId
                }}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData || []
                        that.recordList = res
                    }
                })
            },
            /**
             * 跳转之前缓存数据
             */
            cacheSave () {
                var that = this
                var ss = Util.sessionStorage
                ss('item_card_record_data', JSON.stringify(that.recordList))
            },
            /**
             * 打开弹窗
             */
            doClickHelp () {
                var that = this
                that.help = true
            },
            /**
             * 关闭弹窗
             * @param help 弹窗名
             */
            doCloseHelp (help) {
                this[help] = false
            }
        },
        /**
         * 解除事件绑定
         */
        beforeDestroy () {
            var that = this
            eventHub.$off('jump-view-item-card-record', that.cacheSave)
        }
    }
</script>
