<template>
    <div class="item" @click="doViewDetail()" v-if="recordData.status==2"><!--router-link-->
        <div :style="{ 'background-image': 'url('+(recordData.imageUrl || global.defaultServiceItemImgUrl)+')' }"></div><!--图片-->
        <div>
            <div>
                <div><div>{{ recordData.activityName }}</div></div>
                <div>赠予: <div>{{ recordData.gainerName }}</div></div>
                <div>
                    <div></div><!--小图标-->
                    <div>{{ recordData.createTime }}</div><!--日期-->
                </div>
            </div>
        </div>
       <!-- <div v-if="recordData.status">已赠送</div>-->
    </div>
</template>
<script>
    import Global from '../libs/global'
    import eventHub from '../libs/hub'

    export default {
        data () {
            return {
                global: Global.data
            }
        },
        props: {
            recordData: {
                type: Object,
                required: true
            }
        },
        methods: {
            /**
             * 跳转到次卡赠送详情
             */
            doViewDetail () {
                var that = this
                var recordData = that.recordData
                eventHub.$emit('jump-view-item-card-record')
                that.$router.push({ name: 'itemCardDonationDetail', query: { id: recordData.id } })
            }
        }
    }
</script>
