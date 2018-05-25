<template>
    <div class="service-tip-pop pop-modal" :class="{ active: show }">
        <div class="center-wrap">
            <div>提醒</div>
            <div>抱歉，会所客服正在忙碌，无法提供及时的服务。您可拨打会所电话进行咨询，是否拨打会所电话？</div>
            <div>
                <div @click="doCancel()">不，谢谢</div>
                <div @click="doConfirm()">拨打电话</div>
            </div>
        </div>
    </div>
</template>

<script>
    import Global from '../libs/global'
    import eventHub from '../libs/hub'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                show: false
            }
        },
        mounted () {
            let that = this
            eventHub.$on('do-show-service-tip', that.doShow)
        },
        methods: {
            doShow () {
                this.show = true
            },
            /**
             * 点击"不，谢谢"
             * @return
             */
            doCancel () {
                this.show = false
            },
            doConfirm () {
                let that = this
                if (that.global.clubTelephone.length == 0) {
                    Util.tipShow('暂无会所电话！')
                } else {
                    that.show = false
                    eventHub.$emit('change-tel-detail', true)
                }
            }
        },
        beforeDestroy () {
            eventHub.$off('do-show-service-tip', this.doShow)
        }
    }
</script>
