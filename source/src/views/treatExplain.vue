<style lang="sass">
    @import '../sass/page/ruleDescription.scss';
</style>
<template>
    <div class="page rule-description" id="integral-explain-page">
        <div class="wrap">
            <ul class="info">
                <li>
                    <div>请客有什么作用？</div>
                    <div>请客是指您可以使用小摩豆，为您朋友的消费买单。既不用向以往那样把会员卡交给对方；也不用担心在对方消费时，漏接会所的确认电话而影响朋友感情。</div>
                </li>
                <li>
                    <div>怎么请客？</div>
                    <div>首先，输入授权金额，也就是您朋友可以消费的上限；
                        <br>然后，输入您朋友的手机号码，您请客的消息将会发送到这个手机号上；
                        <br>再次，您还可以选择是否让朋友看见请客金额，避免尴尬；
                        <br>最后，点击“确认授权”，您朋友即可凭借收到的授权码去会所消费啦。
                    </div>
                </li>
                <li>
                    <div>填错手机号码怎么办？</div>
                    <div>只要对方还未消费，您随时都可以取消请客。具体步骤：点击“请客记录”——点开想取消的那条请客——点击“取消授权”并确认即可。</div>
                </li>
            </ul>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'

    export default {
        data () {
            return {
                global: Global.data
            }
        },
        created () {
            this.global.loading = false
            document.title = '请客说明'
        }
    }
</script>
