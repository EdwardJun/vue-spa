<style lang="sass">
    @import '../sass/components/plumflowers-pop.scss';
</style>
<template>
    <div class="plumflowers-pop pop-modal" :class="{ active : show }">
        <div class="center-wrap">
            <div>
                <div><div></div><div></div></div>
                <a @click="doClickGet()">立即抢购</a>
            </div>
            <div @click="doChange(false)">&times;</div>
        </div>
    </div>
</template>

<script>
    import eventHub from '../libs/hub'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                show: false
            }
        },
        props: {
            shareUrl: {
                type: String
            }
        },
        created () {
            eventHub.$on('change-plumflowers-pop', this.doChange)
        },
        methods: {
            doChange (type) {
                this.show = type
            },
            doClickGet () {
                var that = this
                var urlObj = Util.urlFormat(that.shareUrl)
                that.$router.push({name: urlObj.page, query: urlObj.querys})
            }
        },
        beforeDestroy () {
            eventHub.$off('change-plumflowers-pop', this.doChange)
        }
    }
</script>