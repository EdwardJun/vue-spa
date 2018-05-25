<style lang="sass">
    @import '../sass/page/login.scss';
</style>
<template>
    <div class="page login-page" id="recover-password-page">
        <div class="input tel spec"><i></i><span>+86</span><input type="tel" placeholder="请输入您的11位手机号" v-model="tel" maxlength="11" v-tel-input/></div>
        <div class="input auth spec"><i></i><input type="tel" placeholder="请输入手机短信验证码" v-model="testCode" v-test-code-input maxlength="4"/><a @click="getTestCode()" :class="testCodeBtnStatus">{{testCodeBtnText}}</a></div>
        <div class="input pw"><i></i><input type="password" placeholder="请输入6-20位密码，仅限字母和数字" v-password-input v-model="password" maxlength="20"/></div>
        <div class="error" v-show="!isTelValid">*&nbsp;请输入正确的11位手机号</div>
        <div class="error" v-show="isTelValid && !isTestCodeVaild">*&nbsp;请输入短信验证码</div>
        <div class="error" v-show="isTelValid && isTestCodeVaild && !isPasswordValid">*&nbsp;请输入6~20位密码</div>
        <div class="next-btn" :class="{ active : isTelValid && isTestCodeVaild && isPasswordValid }" @click="doClickConfirmBtn()">确认修改密码</div>
        <div class="tip-title">注：</div>
        <div class="tip">请输入相关信息完成密码的重置</div>
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
                testCodeBtnStatus: '',
                testCodeBtnText: '获取验证码',
                getTestCodeRepeatCount: 6
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
            var param = window['spa-login-info']
            if (param && param['username']) {
                that.tel = param['username']
            }
            that.global.loading = false
            document.title = '修改密码'
        },
        methods: {
            doClickConfirmBtn () {
                var that = this
                if (that.isTelValid && that.isTestCodeVaild && that.isPasswordValid) {
                    that.$http.post('../api/v1/user/checkLoginName', {loginName: that.tel}).then(function (res) {
                        res = res.body
                        if (res + '' == '-1') {
                            return Util.tipShow('用户尚未注册！')
                        }
                        that.$http.post('../api/v1/user/resetPassword', {
                            username: that.tel,
                            code: that.testCode,
                            password: that.password
                        }).then(function () {
                            Util.tipShow('密码修改成功！')
                            var loginInfo = {
                                username: that.tel,
                                isBindWeixin: false,
                                password: that.password
                            }
                            Util.localStorage('con-login-param', JSON.stringify(loginInfo))
                            that.$router.push({name: 'confirmLogin'})
                        })
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
                    if (res + '' == '-1') {
                        Util.tipShow('用户尚未注册！')
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
                    that.$http.get('../api/v1/verifyCode', {params: {mobile: that.tel, which: 'userRecoverPassword'}})
                })
            }
        }
    }
</script>
