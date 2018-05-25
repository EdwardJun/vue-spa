<style lang="sass">
    @import '../sass/page/login.scss';
</style>
<template>
    <div class="page login-page" id="register-page">
        <div class="input tel spec"><i></i><span>+86</span><input type="tel" placeholder="请输入您的11位手机号" v-model="tel" maxlength="11" v-tel-input/></div>
        <div class="input auth spec"><i></i><input type="tel" placeholder="请输入手机短信验证码" v-model="testCode" v-test-code-input maxlength="4"/><a @click="getTestCode()" :class="testCodeBtnStatus">{{testCodeBtnText}}</a></div>
        <div class="input pw"><i></i><input type="password" placeholder="请输入6-20位密码，仅限字母和数字" v-password-input v-model="password" maxlength="20"/></div>
        <div class="error" v-show="!isTelValid">*&nbsp;请输入正确的11位手机号</div>
        <div class="error" v-show="isTelValid && !isTestCodeVaild">*&nbsp;请输入短信验证码</div>
        <div class="error" v-show="isTelValid && isTestCodeVaild && !isPasswordValid">*&nbsp;请输入6~20位密码</div>
        <div class="next-btn" :class="{ active : isTelValid && isTestCodeVaild && isPasswordValid }" @click="doClickConfirmBtn()">注册</div>
        <div class="tip-title">注：</div>
        <div class="tip">您的手机号未注册，请输入相关信息完成注册</div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import TelInput from '../directives/tel-input'
    import PasswordInput from '../directives/password-input'
    import TestCodeInput from '../directives/test-code-input'

    export default {
        directives: {
            'tel-input': TelInput,
            'password-input': PasswordInput,
            'test-code-input': TestCodeInput
        },
        data () {
            return {
                global: Global.data,
                tel: '',
                password: '',
                testCode: '', // 短信验证码
                userLoginParam: null,
                testCodeBtnStatus: '',
                testCodeBtnText: '获取验证码',
                getTestCodeRepeatCount: 6,
                inRequest: false,
                isBindWeixin: false
            }
        },
        computed: {
            isTestCodeVaild () {
                return /^\d{4}$/.test(this.testCode)
            },
            isTelValid () {
                return /^1[3456789]\d{9}$/.test(this.tel)
            },
            isPasswordValid () {
                return (this.password.length >= 6)
            }
        },
        created () {
            var that = this
            var _userLoginParam = Util.localStorage('user-register-param')
            var _loginInfo = window['spa-login-info']
            var global = that.global
            var pageParam = global.currPage.query

            if (_userLoginParam) {
                that.userLoginParam = JSON.parse(_userLoginParam)
            }
            if (pageParam.code) {
                global.authCode = pageParam.code
            }
            if (global.userAgent.isWX && (!global.authCode || pageParam.state != '9358_login')) {
                Global.getOauthCode('9358', '9358_login', 'base')
                return
            } else {
                if (_loginInfo) {
                    that.tel = _loginInfo['username']
                    // that.isTelValid = /^1[3456789]\d{9}$/.test(that.tel)
                    if (_loginInfo.password && _loginInfo.code) {
                        that.testCode = _loginInfo.code
                        that.password = _loginInfo.password
                        that.isTestCodeVaild = /^\d{4}$/.test(that.testCode)
                        that.isPasswordValid = (that.password.length >= 6)
                    }
                    delete window['spa-login-info']
                }
            }
            global.loading = false
        },
        mounted () {
            var that = this
            var param = that.userLoginParam
            if (param && param['username']) {
                that.tel = param['username']
                that.isTelValid = /^1[3456789]\d{9}$/.test(that.tel)
                that.isBindWeixin = param['isBindWeixin']
                if (param['password']) {
                    that.password = param['password']
                    that.isPasswordValid = (that.password.length >= 6)
                }
                if (param['code']) {
                    that.testCode = param['code']
                    that.isTestCodeVaild = /^\d{4}$/.test(that.testCode)
                }
                Util.removeLocalStorage('user-register-param')
                that.doClickConfirmBtn()
            }
        },
        methods: {
            doClickConfirmBtn () {
                let that = this
                let global = that.global
                if (that.isTelValid && that.isTestCodeVaild && that.isPasswordValid) {
                    that.inRequest = true
                    that.$http.post('../api/v1/user/checkLoginName', { loginName: that.tel }).then(res => {
                        res = res.body
                        if (res + '' == '1') {
                            Util.tipShow('该用户已经注册了！')
                            that.inRequest = false
                        } else {
                            let param = {
                                mobile: that.tel,
                                code: that.testCode,
                                password: that.password,
                                clubId: global.clubId,
                                chanel: global.sessionType,
                                openId: global.openId || '',
                                wxNickName: '',
                                wxHeadimgurl: '',
                                clubCode: global.clubInviteCode,
                                techInviteCode: (global.techInviteCode || ''),
                                auth2code: global.authCode,
                                isBindWeixin: that.isBindWeixin ? 'Y' : 'N'
                            }
                            that.$http.post('../api/v1/user/register', param).then(res => {
                                res = res.body
                                if (res.status == 200) {
                                    global.token = res.token
                                    global.userId = res.userId
                                    global.userHeader = res.avatarUrl || global.defaultHeader
                                    global.userTel = res.phoneNum
                                    global.userName = res.name
                                    global.loginName = res.loginName
                                    global.isLogin = true

                                    Util.localStorage('token', global.token)
                                    Util.localStorage('userID', global.userId)
                                    Util.localStorage('userHeader', global.userHeader)
                                    Util.localStorage('userTel', global.userTel)
                                    Util.localStorage('userName', global.userName)
                                    Util.tipShow('注册成功！')
                                    Global.initChat()
                                    Global.redirectToLastPage(that.$router)
                                } else if (res.statusCode == '935801') {
                                    Util.localStorage('user-register-param', JSON.stringify(param))
                                    Global.getOauthCode('9358', '9358_login', 'base')
                                }
                                that.inRequest = false
                            }, error => {
                                Util.tipShow(error.data || '注册出错！')
                                that.inRequest = false
                            })
                        }
                    })
                }
            },
            getTestCode () { // 获取短信验证码
                var that = this
                if (that.testCodeBtnStatus == 'disabled' || that.testCodeBtnStatus == 'pause') {
                    return
                }
                if (!that.isTelValid) {
                    Util.tipShow('请输入正确的手机号码！')
                    return
                }
                that.$http.post('../api/v1/user/checkLoginName', {loginName: that.tel}).then(function (res) {
                    res = res.body
                    if (res + '' == '1') {
                        Util.tipShow('该用户已经注册了！')
                        return
                    }
                    that.testCodeBtnStatus = 'pause'
                    that.testCodeBtnText = '重新发送(60s)'

                    var count = 60
                    var sendInterval = setInterval(function () {
                        if (--count == 0) {
                            clearInterval(sendInterval)
                            that.getTestCodeRepeatCount--
                            that.testCodeBtnStatus = ''
                            that.testCodeBtnText = '获取验证码'

                            if (that.getTestCodeRepeatCount == 0) {
                                that.testCodeBtnStatus = 'disabled'
                            }
                        } else {
                            that.testCodeBtnText = '重新发送(' + count + 's)'
                        }
                    }, 1000)
                    that.$http.get('../api/v1/verifyCode', {params: {mobile: that.tel, which: 'userRegister'}})
                })
            }
        }
    }
</script>
