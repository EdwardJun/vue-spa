<style lang="sass">
    @import '../sass/page/cacheClean.scss';
</style>
<template>
    <div class="page" id="cache-clean-page">
        <div class="list" style="height: 100%;">
            <div class="list-item tool-item clear-fix" v-show="dataList.length!=0">
                <i :class="{ active: isAll && dataList.length!=0 }" @click="doSelectAll()"></i>
                <span>全选</span>
                <a @click="doDel()">删除</a>
                <a @click="doDelIDB()">删除iDB</a>
            </div>
            <div class="list-item" v-for="(item, index) in dataList" :key="item.key" @click="doViewDetail(item)">
                <i :class="{ active: item.selected }" @click="doSelectItem(item, index, $event)"></i>
                <div>{{ item.key }}</div>
                <div>{{ item.value }}</div>
            </div>
            <div class="nullData" v-show="dataList.length==0">
                <div v-show="!global.loading"></div>
                <div>{{ global.loading ? '数据加载中...' : '缓存已被清理...' }}</div>
            </div>
        </div>

        <div class="pop-modal" :class="{ active: isPop }" @click="doClosePop()">
            <div @click="doClickPopContent($event)">
                <div>{{ currItem.key }}</div>
                <textarea v-model="currItem.value"></textarea>
            </div>
        </div>
    </div>
</template>
<script>
    import Global from '../libs/global'
    import Util from '../libs/util'
    import idb from '../libs/idb'

    export default {
        data () {
            return {
                global: Global.data,
                dataList: [],
                isPop: false,
                isAll: true,
                currItem: {
                    key: '',
                    value: ''
                }
            }
        },
        created () {
            let that = this
            let ls = window.localStorage
            let dataList = []
            let key = ''
            document.title = '小摩豆缓存项'
            for (let i = 0; i < ls.length; i++) {
                key = ls.key(i)
                dataList.push({
                    key: key,
                    value: ls.getItem(key),
                    selected: true
                })
            }
            that.global.loading = false
            that.dataList = dataList
        },
        methods: {
            doViewDetail (item) {
                let that = this
                that.currItem = item
                that.isPop = true
            },
            doClosePop () {
                this.isPop = false
            },
            doClickPopContent (e) {
                e.stopPropagation()
            },
            doSelectItem (item, index, e) {
                e.stopPropagation()
                item.selected = !item.selected
                let that = this
                that.dataList.splice(index, 1, item)
                if (!item.selected) {
                    that.isAll = false
                } else {
                    let k = 0
                    for (; k < that.dataList.length; k++) {
                        if (!that.dataList[k].selected) {
                            break
                        }
                    }
                    that.isAll = (k == that.dataList.length)
                }
            },
            doSelectAll () {
                let that = this
                that.isAll = !that.isAll
                var list = []
                that.dataList.forEach((item) => {
                    item.selected = that.isAll
                    list.push(item)
                })
                that.dataList = list
            },
            doDel () {
                let that = this
                let k = 0
                let dataList = that.dataList
                for (; k < dataList.length;) {
                    if (dataList[k].selected) {
                        localStorage.removeItem(dataList[k].key)
                        dataList.splice(k, 1)
                    } else {
                        k++
                    }
                }
                Util.tipShow('删除成功！')
                for (k = 0; k < dataList.length; k++) {
                    if (!dataList[k].selected) {
                        break
                    }
                }
                that.isAll = (k && k == that.dataList.length)
            },
            doDelIDB () {
                idb.closeDB()
                indexedDB.deleteDatabase('spadb-t' + idb.userId)
                Util.tipShow('success')
            }
        }
    }
</script>
