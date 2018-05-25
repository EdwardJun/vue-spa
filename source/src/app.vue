<style lang="sass">
    @import './sass/page/index.scss';
</style>
<template>
    <div id="page-container">
        <transition name="fade" mode="out-in">
            <router-view></router-view>
        </transition>
        <div v-if="global.pageMode=='club'" v-show="global.showAppMenu && !global.loading" class="menu-container club">
            <router-link v-for="(item,index) in global.clubHomeConfig.bottom_menu" :key="index" :class="item.code" :to="{ name : item.code }">
                <div v-if="item.code == 'message'"><i v-show="total>0">{{ total }}</i></div>
                <div v-else-if="item.code == 'personal'"><i v-show="global.reminds.total>0">{{ global.reminds.total }}</i></div>
                <div v-else></div>
                <div>{{ item.title }}</div>
            </router-link>
        </div>
        <div v-else v-show="global.show9358Menu" class="menu-container public">
            <router-link class="clubList" :to="{ name : 'clubList' }"><div></div><div>首页</div></router-link>
            <router-link class="message" :to="{ name : 'message' }"><div><i v-show="total>0">{{ total }}</i></div><div>聊天</div></router-link>
            <router-link class="personal" :to="{ name : 'personal' }"><div><i v-show="global.reminds.total>0">{{ global.reminds.total }}</i></div><div>个人中心</div></router-link>
        </div>
        <ServiceBtn v-if="hasServicer"></ServiceBtn>
        <ServiceTipPop></ServiceTipPop>
        <!--电话号码-->
        <TelDetail v-if="global.clubTelephone.length>0" :telephone="global.clubTelephone"></TelDetail>
        <div class="event-mask" v-show="global.eventMask"></div>
        <RewardPop></RewardPop>
        <BindPhonePop></BindPhonePop>
        <Spinner v-show="global.loading"></Spinner>
    </div>
</template>
<script>
    import Global from './libs/global'
    import ServiceBtn from './components/service-btn'
    import ServiceTipPop from './components/service-tip-pop'
    import Spinner from './components/spinner'
    import TelDetail from './components/tel-detail'
    import RewardPop from './components/reward-pop'
    import BindPhonePop from './components/bind-phone-pop'

    export default {
        data () {
            return {
                global: Global.data,
                hasServicer: false
            }
        },
        computed: {
            total () {
                return this.$store.state.newMessageTotal
            }
        },
        components: {
            ServiceBtn, ServiceTipPop, Spinner, TelDetail, RewardPop, BindPhonePop
        },
        watch: {
            // 监听userToken的变化
            'global.token': function (newVal) {
                let that = this
                let data = that.global
                if (newVal && data.clubId) {
                    that.$http.post('../api/v2/log/add', {
                        clubId: data.clubId,
                        timestamp: (+new Date()),
                        token: newVal,
                        module: 'LOGIN',
                        remark: ''
                    })
                    Global.bindClubTech(newVal)
                }
            }
        },
        created () {
            let that = this
            let global = that.global
            const win = window

            // 查询是否存在客服
            that.hasServicer = true

            // 外网增加百度统计
            if (/(spa.93wifi.com|sdcm165.stonebean.com)/.test(location.hostname)) {
                let js = document.createElement('script')
                js.onload = function () {
                    win['_hmt'] = win['_hmt'] || []
                }
                js.src = 'http://hm.baidu.com/h.js?2b7f463ac6f2cf5b303005839e722cdc'
                document.querySelector('head').appendChild(js)
            }
            global.router = that.$router

            // 窗口的resize
            win.addEventListener('resize', () => {
                Global.resizeWidth()
            })
            Global.resizeWidth()
        }
    }
</script>
