<template>
    <div>
        <div class="telDetail pop-modal" :class="{ active : show }" v-if="telephone.length>0" @click="doChange(false)">
            <div @click="doClickWrap($event)">
                <a :class="{techTel: !showPrefix}" v-for="tel in telephone" :href="'tel:'+tel">{{showPrefix ?  '会所电话:'+tel : tel}}</a>
                <a :class="{techTel: !showPrefix}" @click="doChange(false)">取消</a>
            </div>
        </div>
    </div>
</template>

<script>
    import eventHub from '../libs/hub'

    export default {
        name: 'tel-detail',
        data () {
            return {
                show: false
            }
        },
        props: {
            telephone: {
                type: Array,
                default: []
            },
            showPrefix: {
                type: Boolean,
                default: true
            }
        },
        created () {
            eventHub.$on('change-tel-detail', this.doChange)
            if (!this.showPrefix) {
                eventHub.$on('change-tel-detail-of-tech', this.doChange)
            }
        },
        methods: {
            doChange (type) {
                this.show = type
            },
            doClickWrap (e) {
                e.stopPropagation()
            }
        },
        beforeDestroy () {
            eventHub.$off('change-tel-detail', this.doChange)
            if (!this.showPrefix) {
                eventHub.$off('change-tel-detail-of-tech', this.doChange)
            }
        }
    }
</script>
