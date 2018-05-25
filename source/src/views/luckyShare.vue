<style lang="sass">
    @import '../sass/page/luckyShare.scss';
</style>
<template>
    <div class="page" id="lucky-share-page">
        <router-link tag="div" :to="{ name: 'home' }" class="club-title right-arrow-item">
            <div :style="{ 'background-image': 'url('+(clubData.clubImg || global.defaultClubLogo)+')' }"></div>
            <div>{{ clubData.clubName }}</div>
        </router-link>

        <div class="gift-wrap">
            <div><span></span>店内抽奖活动</div>
           <div class="list" :class="'list'+prizeList.length">
               <div v-for="prize in prizeList" class="prize" :class="'prize'+prize.type">
                   <span v-if="prize.type == 0">{{ parseInt(prize.name) }}</span>{{ prize.type == 0 ? '积分' : prize.name }}
               </div>
               <i v-if="prizeList.length>=5"></i>
           </div>
            <div>活动时间：<span v-if="actData.actStartTime && actData.actEndTime">{{ actData.actStartTime + "至" + actData.actEndTime }}</span><span v-else>不限</span></div>
            <div>本活动需到店参与，详情请咨询会所</div>
        </div>

        <div class="loc-wrap">
            <div>
                <div><div>{{ clubData.clubAddress || "无会所地址" }}</div><div @click="doClickMap()">{{ dist }}</div></div>
                <div><div>{{ clubData.clubContact || '暂无电话' }}</div><div @click="doClickTel()"></div></div>
            </div>
        </div>

        <div class="code-wrap"><img :src="clubData.clubQRCodeUrl" v-if="clubData.clubQRCodeUrl"/></div>
        <div class="bottom-wrap">长按二维码关注，获取更多优惠活动</div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import eventHub from '../libs/hub'

    export default {
        data () {
            return {
                global: Global.data,
                actData: {},
                clubData: {},
                actId: '',
                dist: '',
                tels: [],
                prizeList: [] // 礼品列表
            }
        },
        created () {
            var that = this
            var global = that.global
            var query = global.currPage.query
            that.actId = query.actId
            if (!that.actId) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            }
            that.$http.get('../api/v2/user/luckyWheel/once/share', {params: {
                actId: that.actId
            }}).then(function (res) {
                res = res.body
                if (res.statusCode == 200) {
                    res = res.respData
                    var clubData = res.club
                    that.clubData = clubData
                    that.actData = res.activity
                    let prizeList = res.activity.prizeList || []
                    prizeList.forEach(function (prize) {
                        if (prize.type != -1 && prize.type != -2) {
                            that.prizeList.push(prize)
                        }
                    })
                    var clubContact = that.clubData.clubContact
                    if (clubContact) {
                        that.tels = clubContact.split(',')
                    }

                    // 获取与会所的距离
                    if (clubData.clubLongitude && clubData.clubLatitude) {
                        if (!global.currLngx || !global.currLaty) {
                            Util.getLocation(function (position) {
                                let coords = position.coords
                                global.currLngx = coords.longitude
                                global.currLaty = coords.latitude
                                that.setLocation(clubData.clubLongitude, clubData.clubLatitude)
                            })
                        } else {
                            that.setLocation(clubData.clubLongitude, clubData.clubLatitude)
                        }
                    }

                    that.global.loading = false
                } else {
                    Util.tipShow(res.msg || global.loadError)
                    that.$router.back()
                }
            }, function () {
                Util.tipShow(global.loadError)
                that.$router.back()
            })
        },
        methods: {
            /**
             * 点击电话图标的处理
             * @return
             */
            doClickTel () {
                var that = this
                if (that.tels.length > 0) {
                    eventHub.$emit('change-tel-detail', true)
                } else {
                    Util.tipShow('暂无会所联系电话！')
                }
            },
            /**
             * 点击地图图标的处理
             * @return
             */
            doClickMap () {
                let that = this
                let clubData = that.clubData
                if (clubData.clubLongitude && clubData.clubLatitude) {
                    that.$router.push({name: 'map'})
                } else {
                    Util.tipShow('暂无会所位置信息！')
                }
            },
            /**
             * 计算出与会所的距离
             * @return dist
             */
            setLocation (longitude, latitude) {
                let that = this
                let global = that.global
                if (global.currLngx && global.currLaty && longitude && latitude) {
                    var dist = ~~Util.getGreatCircleDistance(global.currLaty, global.currLngx, latitude, longitude)
                    if (dist / 1000 > 1) {
                        dist = (dist / 1000).toFixed(1) + 'km'
                    } else {
                        dist += 'm'
                    }
                    that.dist = dist
                }
            }
        }
    }
</script>
