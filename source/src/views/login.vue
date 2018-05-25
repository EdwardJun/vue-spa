<style lang="sass">
    @import '../sass/page/login.scss';
</style>
<template>
    <div class="page login-page" id="login-page">
        <div class="input tel"><i></i><span>+86</span><input type="tel" placeholder="请输入您的11位手机号" v-model="tel" maxlength="11" v-tel-input @keypress.enter="doClickNextBtn()"/></div>
        <div class="next-btn" :class="{ active : isTelValid }" @click="doClickNextBtn()">下一步</div>
        <div class="tip-title">注：</div>
        <div class="tip">进行身份验证后系统会自动判断你是否为注册用户，并自动衔接后续的操作</div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import TelInput from '../directives/tel-input'

    export default {
        directives: {
            'tel-input': TelInput
        },
        data () {
            return {
                global: Global.data,
                tel: '',
                userLoginParam: null
            }
        },
        computed: {
            isTelValid () {
                return /^1[3456789]\d{9}$/.test(this.tel)
            }
        },
        created () {
            var that = this
            var _userLoginParam = Util.localStorage('user-login-param')
            var pageParam = that.global.currPage.query
            var global = that.global
            if (_userLoginParam) {
                that.userLoginParam = JSON.parse(_userLoginParam)
            }
            if (pageParam.code) {
                global.authCode = pageParam.code
            }
            if (global.userAgent.isWX && (!global.authCode || pageParam.state != '9358_login')) {
                return Global.getOauthCode('9358', '9358_login', 'base')
            } else {
                if (pageParam['loginTel']) {
                    that.tel = pageParam['loginTel']
                    that.isTelValid = /^1[3456789]\d{9}$/.test(that.tel)
                }
                global.loading = false
            }
            document.title = '小摩豆'
        },
        mounted () {
            var that = this
            var param = that.userLoginParam
            if (param && param['username']) {
                that.tel = param['username']
                that.isTelValid = /^1[3456789]\d{9}$/.test(that.tel)
                Util.removeLocalStorage('user-login-param')
                that.doClickNextBtn()
            }
        },
        methods: {
            doClickNextBtn () {
                var that = this
                var global = that.global
                if (that.isTelValid) {
                    var paramData = {
                        username: that.tel,
                        password: '',
                        usertype: 'user',
                        clubId: global.clubId || global.loginChanelClubId || '',
                        code: global.authCode,
                        scope: 'snsapi_base'
                    }
                    if (global.sessionType == '9358' || global.userAgent.isWX) {
                        paramData.loginChanel = global.loginChanel
                        paramData.openId = global.openId
                        paramData.wxNickName = ''
                        paramData.wxHeadimgurl = ''
                    }
                    that.$http.post('../api/v1/user/login', paramData).then(function (res) {
                        window['spa-login-info'] = paramData
                        res = res.body
                        if (res.statusCode == 2) {
                            Util.removeLocalStorage('user-login-param')
                            Util.localStorage('user-register-param', JSON.stringify(paramData))
                            that.$router.push({name: 'register'})
                        } else if (res.statusCode == '935801') { // 需重新获取授权
                            Util.localStorage('user-login-param', JSON.stringify(paramData))
                            Global.getOauthCode('9358', '9358_login', 'base')
                        } else if (res.statusCode == 1) {
                            Util.removeLocalStorage('user-login-param')
                            Util.localStorage('con-login-param', JSON.stringify(paramData))
                            that.$router.push({name: 'confirmLogin'})
                        }
                    })
                }
            }
        }
    }
</script>
