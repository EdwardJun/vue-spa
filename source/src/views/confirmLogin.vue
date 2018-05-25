<style lang="sass">
    @import '../sass/page/login.scss';
</style>
<template>
    <div class="page login-page" id="confirm-login-page">
        <div class="input tel spec"><i></i><span>+86</span><input type="tel" placeholder="请输入您的11位手机号" v-model="tel" maxlength="11" v-tel-input @keypress.enter="doClickLoginBtn()"/></div>
        <div class="input pw"><i></i><input type="password" autofocus placeholder="请输入6-20位密码，仅限字母和数字" v-password-input v-model="password" maxlength="20" @keypress.enter="doClickLoginBtn()"/></div>
        <div class="error" v-show="!isTelValid">*&nbsp;请输入正确的11位手机号</div>
        <div class="error" v-show="isTelValid && !isPasswordValid">*&nbsp;请输入6~20位密码</div>
        <div class="next-btn" :class="{ active : isTelValid && isPasswordValid }" @click="doClickLoginBtn">登录</div>
        <div class="recover-password" @click="doClickRecoverPasswordBtn">忘记密码？</div>
        <div class="tip-title">注：</div>
        <div class="tip">您的手机号已注册，请输入密码完成登录</div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import TelInput from '../directives/tel-input'
    import PasswordInput from '../directives/password-input'

    export default {
        directives: {
            'tel-input': TelInput,
            'password-input': PasswordInput
        },
        data () {
            return {
                global: Global.data,
                tel: '',
                password: '',
                isBindWeixin: false,
                userLoginParam: null
            }
        },
        computed: {
            isTelValid () {
                return /^1[3456789]\d{9}$/.test(this.tel)
            },
            isPasswordValid () {
                return (this.password.length >= 6)
            }
        },
        created () {
            let that = this
            let userLoginParam = Util.localStorage('con-login-param')
            let global = that.global
            let pageParam = global.currPage.query
            if (userLoginParam) {
                that.userLoginParam = JSON.parse(userLoginParam)
            } else {
                that.userLoginParam = window['spa-login-info'] || null
            }
            if (pageParam.code) {
                global.authCode = pageParam.code
            }
            if (global.userAgent.isWX && (!global.authCode || pageParam.state != '9358_login')) {
                return Global.getOauthCode('9358', '9358_login', 'base')
            } else {
                global.loading = false
            }
        },
        mounted () {
            let that = this
            let param = that.userLoginParam
            if (param && param['username']) {
                that.tel = param['username']
                that.isBindWeixin = param.isBindWeixin
                if (param.password) {
                    that.password = param.password
                    Util.removeLocalStorage('con-login-param')
                    that.doClickLoginBtn()
                }
            }
        },
        methods: {
            doClickLoginBtn () {
                let that = this
                let global = that.global
                let ls = Util.localStorage
                if (that.isTelValid && that.isPasswordValid) {
                    let paramData = {
                        username: that.tel,
                        password: that.password,
                        usertype: 'user',
                        clubId: global.clubId || global.loginChanelClubId || '',
                        code: global.authCode,
                        isBindWeixin: that.isBindWeixin ? 'Y' : 'N'
                    }
                    if (global.sessionType == '9358') {
                        paramData.loginChanel = global.loginChanel
                        paramData.openId = global.openId
                        paramData.wxNickName = ''
                        paramData.wxHeadimgurl = ''
                    }
                    that.$http.post('../api/v1/user/login', paramData).then(res => {
                        res = res.body
                        if (res.statusCode == 2) {
                            window['spa-login-info'] = paramData
                            that.$router.push({ name: 'register' })
                        } else if (res.statusCode == '935801') { // 需重新获取授权
                            ls('con-login-param', JSON.stringify(paramData))
                            Global.getOauthCode('9358', '9358_login', 'base')
                        } else if (res.status == 200) {
                            global.token = res.token
                            global.userId = res.userId
                            global.userHeader = res.avatarUrl || global.defaultHeader
                            global.userTel = res.phoneNum
                            global.userName = res.name
                            global.loginName = res.loginName
                            global.chatId = res.emchatId
                            global.chatToken = res.emchatPassword
                            global.isLogin = true
                            // data.userInBlicklist

                            ls('token', global.token)
                            ls('userID', global.userId)
                            ls('userHeader', global.userHeader)
                            ls('userTel', global.userTel)
                            ls('userName', global.userName)
                            ls('chatId', global.chatId)
                            ls('chatToken', global.chatToken)
                            Util.tipShow(res.message || '登录成功！')

                            Global.initChat()
                            Global.redirectToLastPage(that.$router)
                            if (res.message) {
                                Util.tipShow(res.message)
                            }
                        } else if (res.respData == 'HAS_BOUND') {
                            Util.tipShow(res.message || '当前用户已绑定！')
                            Global.redirectToLastPage(that.$router)
                        } else {
                            Util.tipShow(res.message || '登录出错！')
                        }
                    })
                }
            },
            doClickRecoverPasswordBtn () {
                var that = this
                window['spa-login-info'] = {'username': that.tel}
                that.$router.push({name: 'recoverPassword'})
            }
        }
    }
</script>
