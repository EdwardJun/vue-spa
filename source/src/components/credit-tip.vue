<template>
    <div class="credit-tip-pop pop-modal" :class="{ active : show }">
        <div class="center-wrap">
            <h3>积分不足</h3>
            <div class="tip" v-if="type=='gift'">送礼物需要<span>{{ amount }}</span>积分，当前您的积分不足。</div>
            <div class="tip" v-if="type=='game'">玩骰子需要<span>{{ amount }}</span>积分，当前您的积分不足。</div>
            <div class="btn">
                <a class="cancel" @click="doClickCancelBtn()">取消</a>
                <router-link class="get" :to="{ name : 'integralExplain' }">如何获取积分</router-link>
            </div>
        </div>
    </div>
</template>

<script>
    import eventHub from '../libs/hub'

    export default {
        data () {
            return {
                show: false,
                amount: 0,
                type: 'gift'
            }
        },
        created () {
            eventHub.$on('set-credit-tip', this.doSetCreditTip)
        },
        beforeDestroy () {
            eventHub.$off('set-credit-tip', this.doSetCreditTip)
        },
        methods: {
            doClickCancelBtn () {
                this.show = false
            },
            doSetCreditTip (option) {
                var that = this
                that.amount = option.amount || that.amount
                that.type = option.type || that.type
                that.show = option.show || that.show
            }
        }
    }
</script>