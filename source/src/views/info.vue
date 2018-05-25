<style lang="sass">
    @import '../sass/page/info.scss';
</style>
<template>
    <div class="page info-page" id="info-page">
        <div class="info-content">
            <div>
                <input type="file" accept="image/*" multiple @change="doImgChange($event)"/>
                <div>头像</div>
                <div class="header" :style="{ backgroundImage : 'url('+(global.userHeader)+')' }"></div>
                <div class="tip">更换头像</div>
            </div>
            <div>
                <div>昵称</div>
                <div><input type="text" maxlength="20" v-model="nickName"/></div>
            </div>
        </div>
        <div class="submit" @click="doClickSaveBtn()" :class="{loading: inSubmit}">保存{{ inSubmit ? '中...' : '' }}</div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                nickName: '',
                inSubmit: false
            }
        },
        created () {
            var that = this
            var global = that.global
            document.title = '资料编辑'
            that.nickName = global.userName
            global.loading = false
        },
        methods: {
            doClickSaveBtn () {
                var that = this
                if (that.nickName.length == 0) {
                    return Util.tipShow('昵称不能为空！')
                }
                if (that.inSubmit) {
                    return Util.tipShow('正在保存，请稍候...')
                }
                that.inSubmit = true
                that.$http.post('../api/v2/profile/user/info/eidt', {name: that.nickName}).then(res => {
                    res = res.body
                    that.inSubmit = false
                    if (res.statusCode == 200) {
                        that.global.userName = that.nickName
                        Util.localStorage('userName', that.nickName)
                        Util.tipShow('保存成功！')
                        that.$router.push({name: 'personal'})
                    } else {
                        Util.tipShow(res.msg || '保存失败！')
                    }
                }, function () {
                    Util.tipShow('保存失败！')
                    that.inSubmit = false
                })
            },
            doImgChange (event) {
                var that = this
                var file = event.target.files[0]
                var win = window
                if (!file) return
                if (!/image\/\w+/.test(file.type) && !/(jpg|jpeg|gif|bmp|png)$/.test(file.type.toLowerCase())) {
                    return Util.tipShow('只能上传图片格式哦！')
                }
                if (file.size > 1024 * 1024 * 10) {
                    return Util.tipShow('图片不能超过10M！')
                }
                win._fileReader = new FileReader()
                win._fileReader.onload = function () {
                    if (that.nickName.length != 0) {
                        that.$http.post(that.saveUserInfoUrl, {name: that.nickName})
                    }
                    that.$router.push({name: 'picture', query: {type: 'avatar'}})
                }
                win._fileReader.readAsDataURL(file)
            }
        }
    }
</script>
