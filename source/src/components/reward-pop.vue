<style lang="sass">
    @import '../sass/components/reward-Pop.scss';
</style>
<template>
    <div class="reward-pop-wrap pop-modal" :class="{ active : show }">
         <div class="wrap-content">
             <div>
                 <div>
                     <div :style="{ 'background-image': 'url('+avatarUrl+')' }"></div>
                     <div><div>{{ techName }}</div><div>{{ clubName || global.clubName }}</div></div>
                 </div>
             </div>
             <div>
                 <div><p>这么棒棒哒技师，赶紧告诉小伙伴吧！</p></div>
             </div>
             <div><div @click="doClickShare()">分享名片</div></div>
             <div @click="doClose()">&times;</div>
         </div>
        <Share :share-url="shareUrl"></Share>
    </div>
</template>

<script>
    import Global from '../libs/global'
    import eventHub from '../libs/hub'
    import Share from './share'

    export default {
        components: {
            Share
        },
        data () {
            return {
                global: Global.data,
                show: false,
                avatarUrl: '',
                techId: '',
                techName: '',
                clubName: '',
                clubId: '',
                shareUrl: '',
                qrcodeType: ''
            }
        },
        created () {
            var that = this
            eventHub.$on('pop-reward', that.popReward)
        },
        methods: {
            popReward (techData) {
                var that = this
                var global = that.global
                that.avatarUrl = techData.avatarUrl || global.defaultHeader
                that.techId = techData.id
                that.techName = techData.name
                that.clubName = techData.clubName
                that.clubId = techData.clubId

                // 分享链接
                that.shareUrl = global.prefixPathname + '#/' + that.clubId + '/technicianDetail?visitChannel=9358&isNeedFollow=true&id=' + that.techId

                // 设置分享
                if (global.userAgent.isWX) {
                    Global.shareConfig({
                        title: that.techName + '欢迎您',
                        desc: '点我聊聊，更多优惠，更好服务！',
                        link: that.shareUrl,
                        imgUrl: that.avatarUrl,
                        success: () => {
                            if (this.qrcodeType) {
                                that.$http.post('../api/v1/scan/code/stat', {
                                    clubId: this.clubId,
                                    qrcodeType: this.qrcodeType,
                                    statType: 'share',
                                    techId: this.techId
                                })
                            }
                        }
                    }, 'technicianDetail-' + that.techId)
                }

                that.show = true
            },
            doClose () {
                this.show = false
            },
            doClickShare () {
                eventHub.$emit('change-share-pop', true)
            }
        },
        beforeDestroy () {
            eventHub.$off('pop-reward', this.popReward)
        }
    }
</script>
