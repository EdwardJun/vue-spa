<style lang="sass">
    @import '../sass/page/inviteCode.scss';
</style>
<template>
    <div class="page login-page" id="invite-code-page">
        <div class="code-input">
            <input placeholder="会所邀请码 (必填)" maxlength="6" v-model="inviteCode" @input="doInputInviteCode()"/>
            <input placeholder="技师编号 (选填)" maxlength="6" v-model="techNo" @input="doInputTechNo()"/>
        </div>
        <div class="submit-btn" :class="{ active : isInviteCodeValid && isTechNoValid }" @click="doClickSubmitBtn()">完成</div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'

    export default {
        data () {
            return {
                global: Global.data,
                inviteCode: '',
                techNo: '',
                isInviteCodeValid: false,
                isTechNoValid: true
            }
        },
        created () {
            var that = this
            var global = that.global

            document.title = '输入邀请码'
            if (global.clubInviteCode) {
                that.inviteCode = global.clubInviteCode
                that.isInviteCodeValid = true
            }
            if (global.techSerialNo) {
                that.techNo = global.techSerialNo
            }
            global.loading = false
            if (that.clubInviteCode && (global.techSerialNo || global.techInviteCode)) {
                that.doClickSubmitBtn()
            }
        },
        methods: {
            doClickSubmitBtn () {
                var that = this
                var global = that.global
                if (that.isInviteCodeValid && that.isTechNoValid) {
                    that.$http.get('../api/v1/wx/club_tech_page_url', {
                        params: {
                            clubInviteCode: that.inviteCode,
                            techSerialNo: that.techNo || '',
                            techInviteCode: global.techInviteCode,
                            source: global.currPage.query['tmp_clubSource'] || ''
                        }
                    }).then(function (res) {
                        res = res.body
                        if (res.statusCode == 200) {
                            res = res.respData
                            if (res.techInviteCode) {
                                global.techInviteCode = res.techInviteCode
                                Util.sessionStorage('techInviteCode', res.techInviteCode)
                            }
                            var urlObj = Util.urlFormat(res.linkUrl)
                            if (global.techSerialNo) {
                                urlObj.query.techNo = global.techSerialNo
                            }
                            if (global.clubInviteCode) {
                                urlObj.query.clubCode = global.clubInviteCode
                            }
                            that.$router.push({path: urlObj.path, query: urlObj.query})
                        } else {
                            Util.tipShow(res.msg || '操作失败！')
                        }
                    })
                }
            },
            doInputInviteCode () {
                var that = this
                if (/\D/.test(that.inviteCode)) {
                    that.inviteCode = that.inviteCode.replace(/\D/g, '')
                }
                if (that.inviteCode.length > 6) {
                    that.inviteCode = that.inviteCode.substr(0, 6)
                }
                that.isInviteCodeValid = /^\d{3,}$/.test(that.inviteCode)
            },
            doInputTechNo () {
                var that = this
                if (/\W/.test(that.techNo)) {
                    that.techNo = that.techNo.replace(/\W/g, '')
                }
                if (that.techNo.length > 6) {
                    that.techNo = that.techNo.substring(0, 6)
                }
                if (that.techNo.length > 0) {
                    that.isTechNoValid = /^\w{0,6}$/.test(that.techNo)
                } else {
                    that.isTechNoValid = true
                }
            }
        }
    }
</script>
