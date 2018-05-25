<style lang="sass">
    @import '../sass/page/treatDetail.scss';
</style>
<template>
    <div>
        <div class="page" id="treat-detail-page">
            <div class="info-area">
                <div class="info-top">
                    <div>
                        <div class="treat-code">授权码：</div>
                        <div>{{ authorizeCode }}</div>
                        <div></div>
                    </div>
                    <div>
                        <div class="treat-money">授权金额：</div>
                        <div>
                            <span>{{ treatMoney }}</span>
                            <span class="vis-friend">朋友{{ isOpen ? "" : "不" }}可见</span>
                        </div>
                    </div>
                    <div>
                        <div class="treat-tel">授权手机：</div>
                        <div>
                            <span>{{ telStr }}</span>
                            <a :href="'tel:'+telephone" class="call-phone">拨打</a>
                        </div>
                    </div>
                </div>
                <div class="info-status">
                    <div>
                        <div>目前状态：</div>
                        <div>{{ resultStatus=='NOT_USERD' ? '未使用' : ( resultStatus=='CANCLED' ? '已取消' : '已使用' ) }}</div>
                    </div>
                    <div>
                        <div>授权时间：</div>
                        <div>{{ createDate }}</div>
                    </div>
                </div>
                <div class="use-item" v-show="resultStatus=='USED'">
                    <div>
                        <div>使用金额：</div>
                        <div>{{ usedAmount }}</div>
                    </div>
                    <div>
                        <div>使用时间：</div>
                        <div>{{ usedDate }}</div>
                    </div>
                </div>
                <div class="cancel-item" v-show="resultStatus=='CANCLED'">
                    <div>
                        <div>取消时间：</div>
                        <div>{{ cancelDate }}</div>
                    </div>
                </div>
            </div>
            <div class="cancel-auth" v-show="resultStatus=='NOT_USERD'" @click="doClickCancelAuthBtn()">取消授权</div>
        </div>
        <div class="cancel-treat-confirm pop-modal" :class="{ active : isShowConfirm }">
            <div class="center-wrap">
                <div>
                    <p class="h2">取消授权</p>
                    <p>取消授权后，授权码将作废，同时会通知到您的朋友。</p>
                </div>
                <div :class="{ processing : isProcessing }">
                    <a class="cancel-btn" @click="doClickAbortCancel()">放弃</a>
                    <a class="sure-btn" @click="doClickConfirmCancel()">确认</a>
                    <div>取消授权中...</div>
                </div>
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
                queryDataUrl: '../api/v2/financial/account/payforother/',
                detailId: '',
                authorizeCode: '-',
                treatMoney: '-',
                isOpen: false,
                telephone: '',
                telStr: '-',
                createDate: '-',
                resultStatus: '',
                cancelDate: '-',
                usedDate: '-',
                usedAmount: '-',
                isShowConfirm: false,
                isProcessing: false
            }
        },
        created () {
            var that = this
            var global = that.global
            var pageParams = global.currPage.query
            var tmpCache = Util.sessionStorage('tmpTreat_cache')
            that.detailId = pageParams.detailId
            if (tmpCache) {
                tmpCache = JSON.parse(tmpCache)
            }

            if (!that.detailId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            } else if (!tmpCache) {
                that.$http.get(that.queryDataUrl + 'detail', {params: {detailId: that.detailId}}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        that.doHandlerData(res.respData)
                    } else {
                        Util.tipShow(res.msg || global.loadError)
                        return that.$router.back()
                    }
                }, function () {
                    Util.tipShow(global.loadError)
                    return that.$router.back()
                })
            } else {
                Util.removeSessionStorage('tmpTreat_cache')
                that.doHandlerData(tmpCache)
            }
        },
        methods: {
            doHandlerData (res) {
                var that = this
                var global = that.global
                that.authorizeCode = Util.spaceFormat(res.authorizeCode)
                that.treatMoney = (res.amount / 100).toFixed(2)
                that.isOpen = res.open == 'Y'
                that.telephone = res.telephone
                that.telStr = Util.spaceFormat(res.telephone, true)
                that.createDate = res.createDate
                that.resultStatus = res.status
                that.cancelDate = res.cancelDate
                that.usedDate = res.usedDate
                that.usedAmount = (res.usedAmount / 100).toFixed(2)
                global.loading = false
            },
            doClickCancelAuthBtn () {
                this.isShowConfirm = true
            },
            doClickAbortCancel () {
                this.isShowConfirm = false
            },
            doClickConfirmCancel () {
                var that = this
                var global = that.global
                that.isProcessing = true
                that.$http.post(that.queryDataUrl + 'cancel', {detailId: that.detailId}).then(function (res) {
                    that.isProcessing = false
                    res = res.body
                    if (res.statusCode == 200) {
                        that.isShowConfirm = false
                        that.resultStatus = 'CANCLED'
                        that.cancelDate = Util.dateFormat(new Date())
                        var pageData = global.pageData['treatRecords']
                        if (pageData) {
                            pageData.changeStatusRecord = {id: that.detailId, status: 'CANCLED'}
                        }
                    } else {
                        Util.tipShow(res.msg || '请求出错！')
                    }
                }, function () {
                    that.isProcessing = false
                    Util.tipShow('操作出错了！')
                }, function () {
                    that.isProcessing = false
                    Util.tipShow('操作出错了！')
                })
            }
        }
    }
</script>
