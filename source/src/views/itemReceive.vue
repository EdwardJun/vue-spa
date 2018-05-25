<style lang="sass">
    @import "../sass/page/itemReceive.scss";
</style>
<template>
    <div class="page" id="item-receive">
        <div class="item-friends">
            <div :style="{ 'background-image': 'url('+(giveRecord.avatarUrl || global.defaultHeader)+')' }"></div><!--赠送者头像-->
            <div>{{ giveRecord.giveUserName }}赠送给你的次卡</div><!--会所名称-->
        </div>

        <!--次卡信息 12-->
        <div class="item-card-info">
            <div>
                <div>次卡信息
                    <!--status: '' // 赠送状态:0:初始;1:待领取;2:已领取3:已过期-->
                    <item-receive-time v-show="giveRecord.status==1" :modify-time="modifyTime" :expire-time="giveRecord.expireTime" :record-id="recordId"></item-receive-time>
                    <!--<div><span></span> <span>剩余</span> <span>23:59:52</span></div>-->
                    <div v-show="giveRecord.status == 2">已领取</div>
                    <div v-show="giveRecord.status == 3">已过期</div>
                </div>
                <div class="item">
                    <div :style="{ 'background-image': 'url('+giveRecord.imageUrl+')' }"></div><!--图片-->
                    <div>
                        <div>
                            <div><div>{{ giveRecord.activityName }}</div></div>
                            <div>{{ giveRecord.itemName }} * {{ giveRecord.giveCount }}次 </div>
                        </div>
                    </div>
                    <div>￥{{ giveRecord.amount / 100 }}</div>
                </div>
            </div>
        </div>

        <div v-show="giveRecord.status==0 || giveRecord.status==1">
            <!--手机号-->
            <div class="tel spec"><div><input type="tel" placeholder="请输入手机号" v-model="tel" maxlength="11" :disabled="disabled" v-tel-input/></div></div>
            <!--验证码-->
            <div v-show="userTelShow" class="auth spec"><div class="code"><input type="tel" v-test-code-input v-model="testCode" placeholder="请输入验证码" maxlength="4"/></div><div @click="doCode()">{{ testCodeBtnText }}</div></div>
            <div class="next-btn" @click="doReceive()">立即领取</div>
        </div>

        <!--领取说明-->
        <div class="ex-info">
            <div>
                <div class="donation-info">领取说明</div>
                <ul>
                    <li>好友发起赠送后24小时内，若您未领取次卡，赠送次卡自动失效。</li>
                </ul>
            </div>
        </div>
        <!--弹窗 pop-modal-->
        <div class="receive-package-pop-wrap pop-modal" :class="{ active: qrCodeImg }">
            <div class="center-wrap">
                <div class="center-top">
                    <div>还差一步您即可领取到次卡啦</div>
                    <img :src="qrCodeImgSrc">
                    <div>长按二维码识别关注小摩豆,<br/>领好友次卡,享更多福利</div>
                </div>
                <div class="center-btn" @click="doCloseQrCodeImg('qrCodeImg')">&times;</div>
            </div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import itemReceiveTime from '../components/item-receive-time'
    import TelInput from '../directives/tel-input'
    import TestCodeInput from '../directives/test-code-input'
    import 'jr-qrcode'
    export default {
        components: {
            'item-receive-time': itemReceiveTime
        },
        directives: {
            'tel-input': TelInput,
            'test-code-input': TestCodeInput
        },
        data () {
            return {
                global: Global.data,
                recordId: '',
                tel: '',
                testCode: '', // 短信验证码
                testCodeBtnStatus: '',
                testCodeBtnText: '获取验证码',
                userTelShow: true,
                qrCodeImg: false,
                qrCodeImgSrc: null,
                codeLisen: true,
                backParam: {},
                disabled: false,
                giveRecord: {
                    giveUserName: '', // 赠送人姓名
                    imageUrl: '',
                    modifyTime: '', // 创建时间
                    expireTime: '', // 过期时间
                    itemName: '', // 套餐名
                    giveCount: '',
                    activityName: '', // 项目名
                    status: 0 // 赠送状态:0:初始;1:待领取;2:已领取3:已过期
                },
                modifyTime: '',
                user: {}
            }
        },
        computed: {
            isTestCodeVaild () {
                return /^\d{4}$/.test(this.testCode)
            },
            isTelValid () {
                return /^1[3456789]\d{9}$/.test(this.tel)
            }
        },
        created () {
            var that = this
            that.global.loading = false
            var global = that.global
            var query = global.currPage.query
            that.recordId = query.recordId
            that.tel = global.userTel

            document.title = '领取'
            if (global.userTel != null) {
                that.userTelShow = false
            }
            if (!that.recordId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            that.$http.get('../api/v2/user/item_card/order/receive/page', {params: {
                recordId: that.recordId
            }}).then(function (res) {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    console.log(11111111)
                    that.giveRecord = res.giveRecord
                    that.modifyTime = res.currentTime // modifyTime
                    that.user = res.user
                }
            })
        },
        mounted () {
        },
        methods: {
            /**
             * 获取验证码按钮
             */
            doCode () {
                var that = this
                if (that.testCodeBtnStatus == 'disabled' || that.testCodeBtnStatus == 'pause') {
                    return
                }
                if (!that.isTelValid) {
                    Util.tipShow('请输入正确的手机号码！')
                    return
                }
                var count = 60
                if (that.codeLisen) {
                    that.codeLisen = false
                    var sendInterval = setInterval(function () {
                        if (--count == 0) {
                            clearInterval(sendInterval)
                            that.getTestCodeRepeatCount--
                            that.testCodeBtnStatus = ''
                            that.testCodeBtnText = '获取验证码'
                            that.codeLisen = true
                            if (that.getTestCodeRepeatCount == 0) {
                                that.testCodeBtnStatus = 'disabled'
                            }
                        } else {
                            that.testCodeBtnText = '重新发送(' + count + 's)'
                        }
                    }, 1000)
                }
                that.$http.get('../api/v1/verifyCode', {params: {mobile: that.tel, which: 'itemCardReceive'}})
            },
            /**
             * 立即领取按钮
             */
            doReceive () {
                var that = this
                if ((that.isTelValid && !that.userTelShow) || (that.isTelValid && that.isTestCodeVaild && that.userTelShow)) {
                    that.$http.get('../api/v2/user/item_card/order/doReceive', {params: {
                        phoneNum: that.tel,
                        recordId: that.recordId,
                        userId: that.global.userId,
                        verifyCode: that.testCode
                    }}).then(function (res) {
                        res = res.body
                        if (res.statusCode == 200) {
                            res = res.respData
                            that.qrCodeImgSrc = jrQrcode.getQrBase64(res.url, {padding: 0})
                            that.doQrCodeImg()
                        } else {
                            Util.tipShow(res.msg)
                        }
                    }, function () {
                        Util.tipShow('领取异常！')
                    })
                }
            },
            /**
             * 打开弹窗
             */
            doQrCodeImg () {
                var that = this
                that.qrCodeImg = true
            },
            /**
             * 关闭弹窗
             */
            doCloseQrCodeImg (qrCodeImg) {
                this[qrCodeImg] = false
            }
        }
    }
</script>
