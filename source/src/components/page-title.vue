<!--带返回箭头按钮的页面标题-->
<template>
    <div class="page-title" v-show="isShow"><a v-if="showBack" class="back" @click="doClickPageBack()"></a>{{ titleText }}<slot></slot></div>
</template>

<script>
    import Global from '../libs/global'
    
    export default {
        data () {
            return {
                isShow: true
            }
        },
        props: {
            titleText: {
                required: true
            },
            showBack: {
                default: true
            },
            toHome: {
                default: false
            },
            hideInWx: { // 在微信中隐藏
                default: false
            }
        },
        created () {
            if (this.hideInWx && Global.data.userAgent.isWX) {
                this.isShow = false
            }
        },
        methods: {
            doClickPageBack () {
                var that = this
                if (that.toHome) {
                    that.$router.push({name: 'home'})
                } else {
                    Global.toBack()
                }
            }
        }
    }
</script>
