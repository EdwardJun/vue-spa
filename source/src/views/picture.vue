<style lang="sass">
    @import '../sass/page/info.scss';
</style>
<template>
    <div class="page info-page" id="picture-page">
        <PageTitle title-text="裁剪图片" :showBack="false"><div @click="doClickSaveBtn()">保存</div></PageTitle>
        <ImageCut :all-w-prop="global.winWidth" :all-h-prop="global.winHeight" :v-w-prop="global.winWidth*0.8" :v-h-prop="global.winWidth*0.8"></ImageCut>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import eventHub from '../libs/hub'
    import Util from '../libs/util'
    import ImageCut from '../components/image-cut.vue'
    import PageTitle from '../components/page-title'

    export default {
        data () {
            return {
                global: Global.data,
                type: '',
                inPostData: false
            }
        },
        components: {
            ImageCut, PageTitle
        },
        created () {
            var that = this
            var global = that.global
            var win = window
            if (!win._fileReader) {
                that.$router.replace({name: 'info'})
            } else {
                that.type = global.currPage.query.type
                global.loading = false
            }
            eventHub.$on('put-base64', that.doPutBase64)
        },
        methods: {
            doClickSaveBtn () {
                var that = this
                if (that.inPostData) {
                    return Util.tipShow('正在保存，请稍候...')
                }
                that.inPostData = true
                eventHub.$emit('get-base64', {width: 160, height: 160})
            },
            doPutBase64 (imgData) {
                var that = this
                that.$http.post('../api/v2/profile/user/avatar/eidt', {avatar: imgData}).then(() => {
                    Global.updateUserNameAndHeader()
                    Util.tipShow('保存成功！')
                    that.inPostData = false
                    that.$router.push({name: 'info'})
                })
            }
        },
        beforeDestroy () {
            eventHub.$off('put-base64', this.doPutBase64)
        }
    }
</script>
