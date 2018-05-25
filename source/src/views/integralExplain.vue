<style lang="sass">
    @import '../sass/page/ruleDescription.scss';
</style>
<template>
    <div class="page rule-description" id="integral-explain-page">
        <div class="wrap">
            <ul class="info">
                <li>
                    <div>积分是什么？</div>
                    <div>这里的积分指的是，您在会所进行消费以及进行其它的会所指定活动时，会所给您赠送的会所虚拟货币。您可以使用会所积分，参与会所的运营活动，或其它互动游戏。</div>
                </li>
                <li>
                    <div>您可以通过以下方法获得积分（不同会所限制略有不同）：</div>
                    <div>办理并充值会所的会员卡；
                        <br>去会所消费；<br>跟技师互动赚积分；<br>会所特殊活动赠送积分；
                    </div>
                </li>
                <li>
                    <div>积分有什么作用？</div>
                    <div>使用积分可以参与会所指定优惠活动，特价兑换项目或实物；
                        <br/>可以兑换礼物送给技师；<br/>可以与技师互动小游戏；<br/>更多福利持续开发中……
                    </div>
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
            document.title = '积分规则'
        }
    }
</script>
