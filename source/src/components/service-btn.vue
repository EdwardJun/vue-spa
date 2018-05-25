<template>
    <div class="customer-service" ref="serviceWrap" v-show="showBtn && canShow" @click="doContactServicer()">
        <div ref="serviceTip" @animationend="doServiceTipAniEnd()">想了解更多服务项目，点我！</div>
        <div ref='servicer' @animationend="doServiceAniEnd()">
          <div ref="serviceFont" @animationend="doServiceAniEnd()"></div>
        </div>
    </div>
</template>

<script>
    import Global from '../libs/global'
    import eventHub from '../libs/hub'

    export default {
        data () {
            return {
                showBtn: false,
                hasRun: false,
                global: Global.data,
                canShow: false
            }
        },
        watch: {
            'global.showServiceBtn' (newVal) {
                // console.log('service-btn' + newVal)
                if (newVal) {
                    this.showBtn = false
                } else {
                    this.showBtn = false
                    this.canShow = false
                }
            }
        },
        mounted () {
            let that = this
            let global = that.global
            if (global.showServiceBtn) {
                that.showBtn = true
            }
            eventHub.$on('do-show-service-btn', that.doShow)
        },
        methods: {
            doShow () {
                let that = this
                that.$nextTick(() => {
                    let refs = that.$refs
                    setTimeout(() => {
                        that.showBtn = true
                        that.canShow = true
                        if (!that.hasRun) {
                            refs.serviceTip.classList.add('run')
                            refs.servicer.classList.add('run')
                            refs.serviceFont.classList.add('run')
                            that.hasRun = true
                        }
                    }, 400)
                })
            },
            doServiceAniEnd () {
                this.$refs.servicer.classList.add('fix')
                this.$refs.serviceFont.classList.add('fix')
            },
            doServiceTipAniEnd () {
                this.$refs.serviceWrap.classList.add('fix')
            },
            /**
             * 点击客服按钮
             * @return
             */
            doContactServicer () {
                let that = this
                let global = that.global
                that.$http.get('../api/v2/club/emchat/service/get', {params: {clubId: global.clubId}}).then(res => {
                    res = res.body
                    let statusCode = res.statusCode
                    if (statusCode == 200 && res.respData) {
                        that.$router.push({name: 'chat', query: {techId: res.respData.techId}})
                    } else if (statusCode == 211) { // 没有会所客服
                        eventHub.$emit('change-tel-detail', true)
                    } else if (statusCode == 210) { // 有客服但是全部不在线
                        eventHub.$emit('do-show-service-tip', true)
                    }
                })
            }
        },
        beforeDestroy () {
            eventHub.$off('do-show-service-btn', this.doShow)
        }
    }
</script>
