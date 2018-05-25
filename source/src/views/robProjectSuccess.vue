<style lang="sass">
    @import '../sass/page/robProjectSuccess.scss';
</style>
<template>
    <div class="page" id="rob-project-success-page">
        <router-link :to="{ path : '/'+clubId+'/home' }" class="club-info" tag="div">
            <div :style="{ backgroundImage : 'url('+clubLogoUrl+')' }"></div>
            <div>{{ clubName }}</div>
            <div></div>
        </router-link>
        <div class="success-tip">
            <div></div>
            <div>恭喜你，抢购成功！</div>
        </div>

        <router-link v-for="(couponNo, index) in couponNoList" :key="index" class="paid-info" :to="{ name : 'couponDetail' , query : { userActId : resData.id, couponType : 'paid_service_item', couponNo:  couponNo.replace(/\s/g, '') } }" tag="div">
            <div>
                <div>优惠码：<span>{{ couponNo }}</span></div>
                <div>查看详情</div>
                <div></div>
            </div>
            <div>凭优惠码到会所消费</div>
        </router-link>

        <div class="tech-list" v-if="clubObj.techs.length>0">
            <div class="title">
                <div>推荐技师</div>
                <router-link :to="{ path: '/'+clubId+'/technicianList' }" tag="div">查看全部</router-link>
            </div>
            <swiper class="club-techs" v-if="clubObj.techs.length>0 && swiperOption.loop!=undefined" :options="swiperOption">
                <swiper-slide v-for="tech in clubObj.techs" :key="tech.id">
                    <div :techId="tech.id" :style="{ backgroundImage : 'url('+(tech.avatarUrl || global.defaultHeader )+')' }"></div>
                    <div>{{ tech.name }}</div>
                </swiper-slide>
            </swiper>
        </div>
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
                clubId: '',
                clubLogoUrl: '',
                clubName: '',
                bizId: '',
                isIntegral: true,
                couponType: '',
                resData: {},
                shareUrl: '',
                couponNoList: [],
                clubObj: {
                    id: '',
                    techs: []
                },
                swiperOption: {}
            }
        },
        created () {
            var that = this
            var global = Global.data
            var query = global.currPage.query
            that.clubId = query.clubId || global.clubId

            document.title = '抢购成功'
            if (!query.id) {
                Util.tipShow(global.visitError)
                return that.$router.back()
            } else {
                that.init()
            }
        },
        methods: {
            init () {
                var that = this
                var global = that.global
                var query = global.currPage.query

                that.isIntegral = query.isIntegral == 'true'
                that.couponType = query.couponType || 'paid_service_item'
                that.bizId = query.id
                var params = {}
                params.id = that.bizId
                params.techId = query.techId || ''

                that.$http.get('../api/v2/club/user_paid_service_item/pay/view', {params: params}).then(function (res) {
                    res = res.body
                    if (res.statusCode == 200) {
                        res = res.respData
                        var couponNos = res.couponNo.split(',')
                        couponNos.forEach(function (item) {
                            that.couponNoList.push(Util.spaceFormat(item) || '支付处理中...')
                        })
                        that.shareUrl = res.shareUrl
                        that.resData = res
                        if (global.userAgent.isWX) {
                            that.shareSetting()
                        }
                        global.loading = false
                    } else {
                        Util.tipShow(res.msg || '查询数据出错！')
                        return that.$router.back()
                    }
                }, function () {
                    Util.tipShow('查询数据出错！')
                    return that.$router.back()
                })

                // 查询会所的信息
                if (that.clubId != global.clubId) {
                    that.$http.get('../api/v2/club/' + that.clubId + '/clubName').then(function (clubInfoRes) {
                        clubInfoRes = clubInfoRes.body
                        that.clubLogoUrl = clubInfoRes.logo || global.defaultClubLogo
                        that.clubName = clubInfoRes.name
                    })
                } else {
                    that.clubLogoUrl = global.clubLogoUrl
                    that.clubName = global.clubName
                }

                // 查询推荐技师
                that.$http.get('../api/v2/club/top/techs', {params: {clubId: that.clubId}}).then(function (techRes) {
                    techRes = techRes.body
                    if (techRes.statusCode == 200) {
                        that.clubObj.id = that.clubId
                        that.clubObj.techs = techRes.respData
                        that.swiperOption = {
                            loop: that.clubObj.techs.length > 3,
                            observeParents: true,
                            slidesPerView: 'auto',
                            onInit (swiper) {
                                setTimeout(function () {
                                    if (that.clubObj.techs.length > 3) {
                                        swiper.reLoop()
                                    }
                                }, 600)
                            },
                            onTap (swiper, event) {
                                var techId = swiper.clickedSlide.querySelector('div:nth-of-type(1)').getAttribute('techId')
                                if (techId) {
                                    that.doClickViewTech(techId, event)
                                }
                            }
                        }
                    }
                })
            },
            /**
             * 点击推荐技师头像
             * @param techId
             */
            doClickViewTech (techId) {
                var that = this
                that.$router.push({path: '/' + that.clubObj.id + '/technicianDetail', query: {id: techId}})
            },
            // 点击'告诉朋友'
            doClickPopShare () {
                eventHub.$emit('change-share-pop', true)
            },
            shareSetting () {
                var that = this
                var resData = that.resData
                Global.shareConfig({
                    title: that.clubName + '-' + resData.name + '限时抢购就等你来',
                    desc: '据说这个项目一般人抢不到，但是我觉得你可以！抢项目，约技师，享人间极乐。',
                    link: that.shareUrl,
                    imgUrl: resData.imageUrl,
                    success () {
                        eventHub.$emit('change-share-pop', false)
                    },
                    fail () {
                        Util.tipShow('分享失败！请刷新页面后再试！')
                    }
                })
            }
        }
    }
</script>
