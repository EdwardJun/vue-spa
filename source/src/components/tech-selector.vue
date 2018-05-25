<style lang="sass">
    @import '../sass/components/tech-selector.scss';
</style>
<template>
    <div class="tech-selector pop-modal" :class="{ active: isPop }">
        <div class="center-wrap">
            <div>选择销售人员</div>
            <input placeholder="请输入编号或昵称" maxlength="40" v-model="techSearchText" @input="refreshTechList()"/>
            <h4>或选择</h4>
            <div>
                <div class="tech-selector-wrap" v-for="tech in techSearchRes" :class="{ active: currSelectedTechId==tech.techId }" @click="doSelectTech(tech)">
                    <div :style="{ 'background-image': 'url('+(tech.avatarUrl || global.defaultHeader)+')' }"></div>
                    <div v-html="tech.techNameStr"></div>
                    <div v-if="tech.techNo" v-html="tech.techNoStr"></div>
                </div>
            </div>
            <div>
                <div @click="doUnSelect()">不选</div>
                <div @click="doSubmit()">确定</div>
            </div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'

    export default {
        props: {
            techId: {
                type: String
            },
            isShow: {
                type: Boolean,
                default: false
            }
        },
        computed: {
            isPop () {
                let that = this
                if (that.isShow) {
                    if (!that.lastStatus) {
                        that.techSearchText = ''
                        that.refreshTechList()
                    }
                    that.lastStatus = true
                } else {
                    that.lastStatus = false
                }
                return that.isShow
            }
        },
        data () {
            return {
                global: Global.data,
                techSearchText: '可选', // 搜索Input
                techList: [], // 所有可选的技师
                currSelectedTechId: '', // 当前在列表上选择的技师ID
                currSelectedTechAvatar: '',
                currSelectedTechNum: '',
                currSelectedTechName: '',
                lastStatus: false,
                techSearchRes: [] // 过滤条件所的技师列表
            }
        },
        created () {
            let that = this
            let global = that.global
            let query = global.currPage.query
            let clubId = query.clubId || global.clubId
            // 获取销售人员列表
            that.$http.get('../api/v2/club/select/tech/list', {params: {clubId: clubId}}).then((techRes) => {
                techRes = techRes.body
                if (techRes.statusCode == 200) {
                    that.techList = techRes.respData || []
                    that.doSyncSelector()
                }
            })
        },
        methods: {
            doSyncSelector () {
                let that = this
                let tech
                if (that.techId) {
                    for (let k = 0; k < that.techList.length; k++) {
                        tech = that.techList[k]
                        if (that.techList[k].techId == that.techId) {
                            that.currSelectedTechAvatar = tech.avatarUrl
                            that.currSelectedTechNum = tech.techNo
                            that.currSelectedTechId = that.techId
                            that.currSelectedTechName = tech.techName
                            break
                        }
                    }
                } else {
                    that.currSelectedTechAvatar = ''
                    that.currSelectedTechNum = ''
                    that.currSelectedTechId = ''
                    that.currSelectedTechName = ''
                }
                that.emitCommit()
            },
            emitCommit () {
                let that = this
                that.$emit('commit', {
                    techAvatar: that.currSelectedTechAvatar,
                    techNum: that.currSelectedTechNum,
                    techId: that.currSelectedTechId,
                    techName: that.currSelectedTechName
                })
            },
            doUnSelect () {
                let that = this
                that.techSearchText = '可选'
                that.currSelectedTechId = ''
                that.currSelectedTechAvatar = ''
                that.currSelectedTechNum = ''
                that.currSelectedTechName = ''
                that.emitCommit()
                that.$emit('close')
            },
            doSubmit () {
                let that = this
                if (that.currSelectedTechId) {
                    that.emitCommit()
                    that.$emit('close')
                } else {
                    Util.tipShow('没有选择技师或者楼面！')
                }
            },
            // 在列表上选择技师
            doSelectTech (tech) {
                var that = this
                that.techSearchText = tech.techName
                that.currSelectedTechId = tech.techId
                that.currSelectedTechAvatar = tech.avatarUrl
                that.currSelectedTechNum = tech.techNo
                that.currSelectedTechName = tech.techName
            },
            //  依据输入刷新技师列表
            refreshTechList () {
                let that = this
                let global = that.global
                let techList = that.techList
                let searchRes = []
                let techItem
                let searchText = that.techSearchText.trim()
                let reg = new RegExp(searchText, 'g')
                for (let i = 0; i < techList.length; i++) {
                    techItem = techList[i]
                    if (!techItem.techName) {
                        techItem.techName = global.defaultTechName
                    }
                    if (!searchText) {
                        techItem.techNameStr = techItem.techName
                        techItem.techNoStr = techItem.techNo
                        searchRes.push(techItem)
                    } else if (techItem.techName.indexOf(searchText) >= 0 || (techItem.techNo && techItem.techNo.indexOf(searchText) >= 0)) {
                        techItem.techNameStr = techItem.techName.replace(reg, '<strong>' + searchText + '</strong>')
                        if (techItem.techNo) {
                            techItem.techNoStr = techItem.techNo.replace(reg, '<strong>' + searchText + '</strong>')
                        }
                        searchRes.push(techItem)
                    }
                }
                if (searchRes.length == 1) {
                    that.currSelectedTechId = searchRes[0].techId
                    that.currSelectedTechAvatar = searchRes[0].avatarUrl
                    that.currSelectedTechNum = searchRes[0].techNo
                }
                that.techSearchRes = searchRes
            }
        }
    }
</script>