<style lang="sass">
    @import '../sass/page/oneYuanExplain.scss';
</style>
<template>
    <div class="page" id="one-yuan-explain-page">
        <div class="item">
            <div>怎么参与？</div>
            <ul>
                <li>1、本活动由会所官方发起，并由会所负责兑奖事宜；</li>
                <li>2、打开活动页面，点击屏幕右下角的“一元抢”按钮，即可参与；</li>
                <li>3、填写自己的手机号码，并选择要购买的份数，然后点击“确定”，即可进行支付，支付后即可获得对应数量的号码；</li>
            </ul>
        </div>
        <div class="item">
            <div>开奖规则？</div>
            <ul>
                <li>1、本活动遵循公平公正的原则，以福利彩票的3D开奖结果为参照号；</li>
                <li>2、21:00前完成购买的以当天的福彩3D开奖结果作为参照号，21:00后完成的以第二天福彩3D的开奖结果作为参照号；</li>
                <li>3、活动到期时，未购买完，将在24小时内退款；</li>
            </ul>
        </div>
        <div class="item">
            <div>中奖号码计算方法？</div>
            <ul>
                <li>1、如果当期福彩3D结果小于或等于活动的总份数，则此号码即为中奖号；</li>
                <li>2、如果当期福彩3D结果大于活动的总份数，则开奖号为福彩3D结果除以活动总份数的余数；<br>
                    例1：活动总份数=100、福彩3D=056，则中奖号码为056；<br>
                    例2：活动总份数=100、福彩3D=489，则中奖号码=489÷100的余数，即为089；</li>
            </ul>
        </div>
        <div class="item">
            <div>开奖通知？</div>
            <ul>
                <li>1、中奖用户将会收到中奖短信；</li>
                <li>2、所有参与活动的用户都可以在“个人中心-我的1元抢购”中查看开奖记录；</li>
            </ul>
        </div>
        <div class="item">
            <div>如何兑奖？</div>
            <ul>
                <li>1、中奖者凭中奖纪录，到会所消费后出示中奖二维码结账即可；</li>
                <li>2、会所保留在法律允许的范围内对上述规则进行解释的权利；</li>
            </ul>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'

    export default {
        created () {
            Global.data.loading = false
            document.title = '活动规则'
        }
    }
</script>
