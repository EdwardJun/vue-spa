<style lang="sass">
    @import '../sass/page/posPaySuccess.scss';
</style>
<template>
    <div class="page" id="pos-pay-success-page">
        <div class="ok" :class="{ alipay: global.userAgent.isAliPay }">支付成功！</div>
        <div class="wrap">
          <div>已付<span>￥{{ (amount/100).toFixed(2) }}</span></div>
          <div>商家<span>{{ global.clubName }}</span></span></div>
        </div>
        <router-link v-if="!global.userAgent.isAliPay" class="act-btn" :class="{ alipay: global.userAgent.isAliPay }" :to="{ name: 'activities' }" tag="div">领取优惠</router-link>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                amount: 0 // 支付的数额
            }
        },
        created () {
            let that = this
            let global = that.global
            that.amount = global.currPage.query.amount

            if (!that.amount) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            that.amount = that.amount - 0
            global.loading = false
        }
    }
</script>
