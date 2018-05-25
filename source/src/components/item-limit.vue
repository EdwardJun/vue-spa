<template>
    <div class="item" v-if="limitData" :class="{ expire : limitData.isExpire }" @click="doViewDetail()">
        <div class="item-img" :style="{ 'background-image': 'url('+(limitData.actLogoUrl || global.defaultServiceItemImgUrl)+')' }"></div><!--图片-->
        <div>
            <div><span>项目名称 : </span> <span>{{ limitData.actSubTitle }}</span></div>
            <div><span>项目价格 : </span> <span>{{ limitData.consumeMoneyFen / 100 }}元</span></div>
            <div><span>项目时长 : </span> <span>{{ limitData.duration }}</span></div>
            <div><span>有效期 : </span> <span>{{ startTime }} 至 {{ endTime }}</span></div>
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
        props: {
            limitData: {
                type: Object,
                required: true
            }
        },
        methods: {
            doViewDetail () {
                let that = this
                let limitData = that.limitData
                that.$router.push({name: 'couponDetail', query: {userActId: limitData.userActId, couponType: limitData.couponType}})
            }
        },
        computed: {
            startTime () { // 开始时间
                return this.limitData.useStartDate.split(' ')[0].replace(/-/g, '-')
            },
            endTime () { // 结束时间
                if (this.limitData.useEndDate == '') {
                    return '长期有效'
                } else {
                    return this.limitData.useEndDate.split(' ')[0].replace(/-/g, '-')
                }
            }
        }
    }
</script>
