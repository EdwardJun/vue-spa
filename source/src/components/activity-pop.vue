<template>
    <div class="pop-modal activity-pop" :class="{ active : show }">
        <div class="center-wrap" :class="clsName">
            <div>
                <div @click="doJump()">{{ actData.activityType == 'user_invite_user' ? '一大波礼物正在向您靠近~' : '' }}</div>
            </div>
            <div @click="doClose()">&times;</div>
        </div>
    </div>
</template>

<script>
    import eventHub from '../libs/hub'
    import Global from '../libs/global'

    export default {
        data () {
            return {
                global: Global.data,
                show: false
            }
        },
        props: {
            actData: {
                type: Object,
                required: true
            }
        },
        computed: {
            clsName () {
                var actData = this.actData
                var actType = actData.activityType
                if (actType == 'paid_service_item') { // 限时抢
                    return 'timeLimit'
                } else if (actType == 'paid_plumflowe' || actType == 'one_yuan') { // 一元夺
                    return 'oneYuan'
                } else if (actType == 'user_invite_user') {
                    return 'userInvite' // 邀请有礼
                } else {
                    return actType // luckyWheel journal
                }
            }
        },
        created () {
            eventHub.$on('change-activity-pop', this.doChange)
        },
        methods: {
            doClose () {
                this.show = false
            },
            doChange (type) {
                this.show = type
            },
            doJump () {
                var that = this
                var actData = that.actData
                var actType = actData.activityType
                var router = that.$router

                if (actType == 'paid_service_item') {
                    router.push({name: 'robProjectDetail', query: {robProjectId: actData.activityId}})
                } else if (actType == 'paid_plumflowe') {
                    router.push({name: 'plumflowers', query: {id: actData.activityId}})
                } else if (actType == 'one_yuan') {
                    router.push({name: 'oneYuanDetail', query: {oneYuanBaseId: actData.activityId}})
                } else if (actType == 'luckyWheel') {
                    router.push({name: 'luckyWheel', query: {actId: actData.activityId}})
                } else if (actType == 'journal') {
                    location.href = that.global.prefixPathname.replace('/spa/', '/journal/') + '#/' + actData.extra + '/?id=' + actData.activityId
                } else if (actType == 'user_invite_user') {
                    router.push({name: 'inviteActivity'})
                }
            }
        },
        beforeDestroy () {
            eventHub.$off('change-activity-pop', this.doChange)
        }
    }
</script>
