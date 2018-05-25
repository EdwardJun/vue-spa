<style lang="sass">
    @import '../sass/page/promotionsActivity.scss';
</style>
<template>
    <div>
        <div class="page" id="promotions-activity-page">
            <div class="act-detail">
                <div class="act-bg" :style="{ backgroundImage : 'url('+(actDetail.actLogoUrl || global.defaultBannerImgUrl)+')' }">
                    <div></div>
                </div>
                <div class="act-content">
                    <div class="act-title">
                        <div></div>
                        <span>{{actDetail.actTitle}}</span>
                        <router-link :to="{ name : 'technicianList' }">马上预约</router-link>
                    </div>
                    <div class="act-item">
                        <i></i>
                        <div>{{actDetail.startDate | dateToString(actDetail.endDate,'—')}}</div>
                    </div>
                    <div class="act-item">
                        <i></i>
                        <div>活动规则</div>
                    </div>
                    <div class="act-desc" v-html="actDetail.actContent"></div>
                </div>
            </div>
            <div class="other-act" v-if="otherActs.length>1">
                <div class="title">
                    <div></div>
                    <div>其他优惠</div>
                </div>
                <router-link v-if='act.actId !=actDetail.actId ' v-for="act in otherActs" :key="act.actId" :to="{name :'promotionsActivity' , query : { id : act.actId }}">
                    <div :style="{ backgroundImage : 'url('+act.actLogoUrl+')' }"></div>
                    <div><i></i>{{ act.actTitle }}</div>
                    <div>活动时间：{{act.startDate | dateToString(act.endDate,'—')}}</div>
                </router-link>
            </div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import DateToString from '../filters/date-to-string'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                actDetail: {
                    actId: '',
                    actLogoUrl: null,
                    actTitle: '',
                    startDate: '',
                    endDate: '',
                    actContent: ''
                },
                otherActs: []
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query

            if (!query.id) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            that.$http.get('../api/v2/club/{clubId}/{actId}/actdetail', {params: {clubId: global.clubId, actId: query.id}}).then(function (res) {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    that.actDetail = res.act
                    that.otherActs = res.acts
                    global.loading = false
                } else {
                    Util.tipShow(global.loadError)
                    that.$router.back()
                }
            }, function () {
                Util.tipShow(global.loadError)
                that.$router.back()
            })
        },
        filters: {
            dateToString: DateToString
        },
        methods: {
            doClickPageBack () { // 点击返回按钮
                history.back()
            }
        }
    }
</script>
