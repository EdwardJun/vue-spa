<style lang="sass">
    @import '../sass/page/ilike.scss';
</style>
<template>
    <div class="page" id="ilike-page">
        <div class="title">我喜欢的</div>
        <div class="clear_fix"></div>
        <div class="result-list" :class="{active: techData.length >= 5}">
            <ul class="item-like">
                <li v-for="item in techData">
                    <div :style="{'background-image':'url('+(item.avatarUrl || global.defaultHeader)+')'}" ></div>
                    <div> {{ item.serialNo }} <span @click="doDelete(item.id)"></span></div>
                    <div :class="item.status"></div>
                </li>
            </ul>
        </div>
        <div @click="doClickAppTech()" class="item-return"><span></span><div><span>返回</span><span>全部</span></div></div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    export default {
        data () {
            return {
                global: Global.data,
                techData: []
            }
        },
        created () {
            var that = this
            var global = that.global

            var data = Util.sessionStorage('item_appoint_tech_data')
            that.techData = JSON.parse(data)
            global.loading = false
        },
        methods: {
            doDelete (id) {
                var that = this
                for (var i = 0; i < that.techData.length; i++) {
                    if (that.techData[i].id == id) {
                        that.techData.splice(i, 1)
                    }
                }
            },
            doClickAppTech () {
                let that = this
                Util.sessionStorage('item_appoint_tech_data', JSON.stringify(that.techData))
                that.$router.push({name: 'appointTech'})
            }
        }
    }
</script>
