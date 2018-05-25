<style lang="sass">
    @import '../sass/components/bind-phone-pop.scss';
</style>
<template>
    <div class="bind-phone-wrap pop-modal" :class="{ active : show }">
        <div class="center-wrap">
            <div class="wrap">
                <div class="title">绑定手机</div>
                <div class="section tel"><input type="tel" v-model="phoneNumber" maxlength="11" placeholder="请输入手机号码" v-tel-input/></div>
                <div class="section code">
                    <input type="tel" v-model="phoneCode" maxlength="4" placeholder="请输入验证码" v-test-code-input/>
                    <button :class="{ notel : !isTelValid, disabled: inCodeGetting }" @click="doGetCode()">{{ inCodeGetting ? '重发('+timeCount+')' : '获取验证码' }}</button>
                </div>
                <div class="submit" :class="{ disabled: !isTestCodeVaild || !isTelValid, processing: inBinding }" @click="doConfirm()">{{ inBinding ? '绑定中' : '确认' }}</div>
            </div>
            <div class="close" @click="doClose()">&times;</div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import eventHub from '../libs/hub'
    import TelInput from '../directives/tel-input'
    import TestCodeInput from '../directives/test-code-input'

    export default {
        directives: {
            'tel-input': TelInput,
            'test-code-input': TestCodeInput
        },
        data () {
            return {
                global: Global.data,
                show: false,
                phoneCode: '',
                phoneNumber: '',
                inCodeGetting: false, // 正在获取验证码
                timeCount: 60,
                inBinding: false // 是否正在绑定中
            }
        },
        computed: {
            isTestCodeVaild () {
                return /^\d{4}$/.test(this.phoneCode)
            },
            isTelValid () {
                return /^1[3456789]\d{9}$/.test(this.phoneNumber)
            }
        },
        created () {
            var that = this
            eventHub.$on('pop-bind-phone', that.pop)
        },
        methods: {
            pop () {
                var that = this
                that.phoneCode = ''
                that.phoneNumber = ''
                that.inCodeGetting = false
                that.timeCount = 60
                that.inBinding = false
                that.show = true
            },
            /**
             * 点击确认按钮
             */
            doConfirm () {
                var that = this
                if (that.inBinding) {
                    Util.tipShow('绑定中，请稍候...')
                }
                if (that.isTestCodeVaild && that.isTelValid) {
                    that.inBinding = true
                    Global.execBindPhone(that.phoneNumber, that.phoneCode).then(function (res) {
                        if (res.statusCode == 200) {
                            res = res.respData
                            Util.tipShow(res.message || '绑定成功！')
                            that.show = false
                        } else {
                            if (res.msg != 'HAS_BOUND') {
                                res.msg = res.msg ? (res.msg.indexOf('绑定失败') == 0 ? res.msg : ('绑定失败：' + res.msg)) : '绑定失败'
                                Util.tipShow(res.msg)
                            } else {
                                that.show = false
                            }
                        }
                        that.inBinding = false
                    })
                }
            },
            doClose () {
                this.show = false
            },
            // 获取验证码
            doGetCode () {
                var that = this
                if (that.isTelValid && !that.inCodeGetting) {
                    that.timeCount = 60
                    that.inCodeGetting = true
                    var timer = setInterval(function () {
                        that.timeCount --
                        if (that.timeCount == 0) {
                            that.inCodeGetting = false
                            clearInterval(timer)
                        }
                    }, 1000)
                    that.$http.get('../api/v1/verifyCode', {params: {mobile: that.phoneNumber, which: 'userBindPhoneNumber'}})
                }
            }
        },
        beforeDestroy () {
            eventHub.$off('pop-bind-phone', this.pop)
        }
    }
</script>
