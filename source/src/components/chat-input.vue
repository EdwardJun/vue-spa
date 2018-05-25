<style lang="sass">
    @import '../sass/components/chatInput.scss';
</style>
<template>
    <div class="chat-input-wrap" ref="expressionBtn">
        <div class="input">
            <div contenteditable="true" ref="txtInput" @focus="onTextInputFocus()" @blur="onTextInputBlur()" @click="onClickOfTextInput($event)" @input="onInputOfText()"></div>
            <span v-show="showInputTip" @click="onClickInputTip()">在此输入...</span>
            <a :class="sendBtnStatus" @click="doClickSendBtn()">发送</a>
        </div>
        <div class="menu">
            <div class="pic"><form><input type="file" accept="image/*" ref="imgFile" @change="doChangeFileInput()"/></form></div>
            <div class="expression" :class="{ active : showExpression }" @click="doClickExpressionBtn()"></div>
            <div class="reward" @click="doClickRewardBtn()" v-show="talker.type!='manager' && canReward"></div>
            <div class="coupon" @click="doClickCouponBtn()" :class="{ active : showCoupons }" v-show="talker.type!='manager'">
                <ul><li v-for="coupon in coupons" @click="doClickCouponItem(coupon)">{{ coupon.actTitle }}</li></ul>
            </div>
            <div class="gift" v-show="creditConfig.creditSwitch && talker.type!='servicer'" @click="doClickGiftBtn()" :class="{ active : showGiftList }"></div>
            <div class='service' v-show="talker.type=='servicer'" @click="doClickServiceBtn()"></div>
        </div>
        <!--:options="swiperOption"-->
        <swiper v-show="showExpression" :options="swiperOption">
            <swiper-slide class="exp-wrap-0">
                <div v-for="exp in exps[0]" @click="doSelectedExp($event)"><div :data-exp="exp"></div></div>
            </swiper-slide>
            <swiper-slide class="exp-wrap-1">
                <div v-for="exp in exps[1]" @click="doSelectedExp($event)"><div :data-exp="exp"></div></div>
            </swiper-slide>
            <div class="swiper-pagination" slot="pagination"></div>
        </swiper>
        <div class="gift-list" v-show="showGiftList">
            <div class="list" :style="{ width : gifts.length*5+'rem' }">
                <div class='gift-item' @click="doClickGiftItem(gift)" v-for="gift in gifts" :class="{ active : currSelectGift == gift }">
                    <img :src='gift.iconUrl'/>
                    <div><span>{{ gift.ratio }}</span>积分</div>
                </div>
            </div>
            <div class="info"><span>*</span>&nbsp;当前剩余<b>{{ integralAccount }}</b>积分</div>
        </div>
    </div>
</template>

<script>
    import Global from '../libs/global'
    import im from '../libs/im'
    import eventHub from '../libs/hub'
    import Util from '../libs/util'
    import ExpressionCode from '../libs/expression'

    const win = window
    export default {
        data () {
            return {
                global: Global.data,
                exps: [[], []], // 表情数据
                lastSelection: { node: null, offset: null },
                initHeight: 0,
                initDelay: 500,
                divNode: document.createElement('div'), // 用于表情图片转文本
                swiperOption: {
                    loop: true,
                    slidesPerView: 1,
                    pagination: '.swiper-pagination'
                },
                showExpression: false, // 显示表情区域
                showGiftList: false, // 显示积分礼物区域
                showInputTip: true, // 显示在此输入的提示语
                isTxtInputFocus: false,
                showCoupons: false, // 显示优惠券列表
                sendBtnStatus: 'disabled', // 发送按钮的状态
                currSelectGift: null // 当前选择的积分礼物
            }
        },
        computed: {
            integralAccount () { // 当前账户积分
                return this.currIntegralAccount
            },
            talker () {
                return this.$store.state.talker
            }
        },
        props: {
            creditConfig: { // 系统积分配置
                type: Object
            },
            gifts: { // 积分礼物数据
                type: Array,
                default: []
            },
            coupons: { // 优惠券数据
                type: Array,
                default: []
            },
            currIntegralAccount: { // 当前账户积分
                type: Number,
                default: 0
            },
            canReward: { // 打赏开关
                type: Boolean,
                default: false
            }
        },
        created () {
            let that = this
            let global = that.global

            // 构造exps
            Object.keys(ExpressionCode).forEach((key, index) => {
                that.exps[parseInt(index / 14)].push(key)
            })
            that.initHeight = global.winHeight

            // event on
            eventHub.$on('goto-reward-tech', that.doClickRewardBtn) // 跳转到打赏页面
            eventHub.$on('change-tool-state', that.changeToolClosed)
        },
        methods: {
            // 点击打赏按钮
            doClickRewardBtn () {
                let that = this
                that.changeToolClosed('reward')
                that.$router.push({ name: 'techReward', query: { techId: that.talker.userId } })
                eventHub.$emit('change-wrap-height', 'normal')
            },
            // 输入框的on focus
            onTextInputFocus () {
                let that = this
                let global = that.global
                let txtInput = that.$refs.txtInput
                if (txtInput.innerHTML.length == 0) {
                    that.showInputTip = false
                }
                if (that.showGiftList) { // 如果积分礼物列表打开了，则关闭之
                    that.doClickGiftBtn()
                }
                if (that.showExpression) { // 如果表情打开了，则关闭之
                    that.doClickExpressionBtn()
                }
                if (that.showCoupons) { // 如果优惠券打开了，则关闭之
                    that.doClickCouponBtn()
                }
                that.isTxtInputFocus = true
                if (global.userAgent.isiPhone) {
                    setTimeout(() => {
                        that.$refs.txtInput.scrollIntoView(true)
                        that.$refs.txtInput.scrollIntoViewIfNeeded()
                        that.initDelay = 300
                    }, that.initDelay)
                } else {
                    setTimeout(() => {
                        if (that.initHeight - global.winHeight < 100) {
                            txtInput.scrollIntoView(true)
                        }
                    }, 500)
                }
            },
            // 输入框的on blur
            onTextInputBlur () {
                let that = this
                let txtInput = that.$refs.txtInput
                if (txtInput && txtInput.innerHTML.replace(/<br>/, '').length == 0) {
                    txtInput.innerHTML = ''
                    that.showInputTip = true
                    that.sendBtnStatus = 'disabled'
                }
                that.isTxtInputFocus = false
            },
            // 输入框的 on click
            onClickOfTextInput (event) {
                let that = this
                if (event.target.tagName.toLowerCase() == 'img') {
                    let currNode = event.target
                    let pNode = currNode.parentNode
                    let currIndex
                    for (let j = 0; j < pNode.childNodes.length; j++) {
                        if (currNode == pNode.childNodes[j]) {
                            currIndex = j + 1
                            break
                        }
                    }
                    if (document.createRange && win.getSelection && currIndex) {
                        that.setCursorPosition(pNode, currIndex)
                    }
                }
                let sel = win.getSelection()
                that.lastSelection.node = sel.focusNode
                that.lastSelection.offset = sel.focusOffset
            },
            // 输入框的on input
            onInputOfText () {
                let that = this
                let txtInput = that.$refs.txtInput
                if (that.showInputTip) {
                    that.showInputTip = false
                }
                if (txtInput.innerHTML.length == 0) {
                    that.sendBtnStatus = 'disabled'
                } else {
                    that.sendBtnStatus = ''
                }
                let lastSelection = that.lastSelection
                let sel = win.getSelection()
                lastSelection.node = sel.focusNode
                lastSelection.offset = sel.focusOffset
            },
            // 点击输入提示
            onClickInputTip () {
                let that = this
                that.showInputTip = false
                that.$refs.txtInput.focus()
            },
            // 设定光标的位置
            setCursorPosition (pNode, cursorIndex) {
                let that = this
                let range = document.createRange()
                let selection = win.getSelection()

                range.selectNodeContents(pNode)
                range.collapse(true)
                range.setEnd(pNode, cursorIndex)
                range.setStart(pNode, cursorIndex)
                selection.removeAllRanges()
                selection.addRange(range)
                that.lastSelection.offset = cursorIndex
                that.lastSelection.node = pNode
            },
            // 递归检查当前节点是否在div.input节点下(上溯4层)
            isFocusInText (node, layer) {
                let that = this
                if (!node || layer > 4) return false
                if (node == that.$refs.txtInput) return true
                else {
                    node = node.parentNode
                    return that.isFocusInText(node, layer + 1)
                }
            },
            // 点击表情按钮
            doClickExpressionBtn () {
                let that = this
                let txtInput = that.$refs.txtInput
                let lastSelection = that.lastSelection
                if (!that.showExpression) {
                    that.changeToolClosed('expression')
                    lastSelection.offset = txtInput.childNodes.length
                    lastSelection.node = txtInput
                    eventHub.$emit('change-wrap-height', 'expression')
                } else {
                    eventHub.$emit('change-wrap-height', 'normal')
                }
                that.showExpression = !that.showExpression
            },
            // 点击客服按钮，弹出预约时间选择窗口
            doClickServiceBtn () {
                eventHub.$emit('change-order-time-pop', true)
            },
            // 选择表情的时候
            doSelectedExp (event) {
                let that = this
                let lastSelection = that.lastSelection
                let item = event.currentTarget
                let txtInput = that.$refs.txtInput

                if (lastSelection.node && that.isFocusInText(lastSelection.node)) {
                    let expressionNode = item.children[0] // 选择的表情节点
                    let oldNode
                    let newNode
                    let currNode
                    let nodeText
                    let nextSibling
                    let cursorIndex
                    let splitNode

                    newNode = document.createElement('img')
                    let imgData = win.getComputedStyle(expressionNode, null)['backgroundImage']
                    if (imgData.charAt(4) == '"' || imgData.charAt(4) == '\'') {
                        imgData = imgData.slice(5, -2)
                    } else {
                        imgData = imgData.slice(4, -1)
                    }
                    newNode.src = imgData
                    newNode.setAttribute('data-exp', expressionNode.getAttribute('data-exp'))
                    if (lastSelection.node.nodeType == 3) { // 在文本节点中插入表情
                        oldNode = lastSelection.node
                        if (lastSelection.offset == 0) { // 在文本节点之前插入img节点
                            oldNode.parentNode.insertBefore(newNode, oldNode)
                        } else if (lastSelection.offset == oldNode.nodeValue.length) { // 在文本节点之后插入img节点
                            if (oldNode.nextSibling) { // 当前文本节点是否还有下一个兄弟节点
                                oldNode.parentNode.insertBefore(newNode, oldNode.nextSibling)
                            } else {
                                oldNode.parentNode.appendChild(newNode)
                            }
                        } else { // 原文本节点被img节点截断成两个节点
                            nodeText = oldNode.nodeValue
                            oldNode.nodeValue = nodeText.substr(0, lastSelection.offset)
                            nextSibling = oldNode.nextSibling
                            if (nextSibling) { // 当前文本节点是否还有下一个兄弟节点
                                oldNode.parentNode.insertBefore(newNode, nextSibling)
                                splitNode = document.createTextNode(nodeText.substr(lastSelection.offset))
                                oldNode.parentNode.insertBefore(splitNode, nextSibling)
                            } else { // 直接append到最后
                                oldNode.parentNode.appendChild(newNode)
                                splitNode = document.createTextNode(nodeText.substr(lastSelection.offset))
                                oldNode.parentNode.appendChild(splitNode)
                            }
                        }
                    } else if (lastSelection.node.nodeType == 1) { // div节点
                        if (lastSelection.offset == lastSelection.node.childNodes.length) {
                            lastSelection.node.appendChild(newNode)
                        } else {
                            currNode = lastSelection.node.childNodes[lastSelection.offset]
                            lastSelection.node.insertBefore(newNode, currNode)
                        }
                    }

                    if (txtInput.innerHTML != '') {
                        that.showInputTip = false
                        that.sendBtnStatus = ''
                    } else {
                        that.showInputTip = true
                        that.sendBtnStatus = 'disabled'
                    }

                    // 将光标定位到当前newNode之后
                    if (document.createRange) {
                        let parentNode = newNode.parentNode
                        for (let j = 0; j < parentNode.childNodes.length; j++) {
                            if (parentNode.childNodes[j] == newNode) {
                                cursorIndex = j + 1
                                break
                            }
                        }
                        if (cursorIndex) {
                            if (that.isTxtInputFocus) {
                                that.setCursorPosition(parentNode, cursorIndex)
                            } else {
                                lastSelection.offset = cursorIndex
                                lastSelection.node = parentNode
                            }
                        }
                    }
                }
            },
            // 点击优惠券
            doClickCouponItem (couponData) {
                let that = this
                let talker = that.talker
                let global = that.global
                if (couponData.couponType == 'paid') { // 点钟券
                    that.$router.push({
                        name: 'paidCoupon',
                        query: {
                            actId: couponData.actId, techCode: talker.inviteCode
                        }
                    })
                } else { // 优惠券
                    if (!global.userTel) {
                        return Global.bindTelPhone()
                    }
                    let errorInfo = '未能成功领取优惠券！'
                    that.$http.get('../api/v2/club/get/redpacket', { params: {
                        actId: couponData.actId,
                        phoneNum: global.userTel,
                        openId: global.openId,
                        userCode: '',
                        techCode: talker.inviteCode || '',
                        chanel: 'link'
                    }}).then(res => {
                        res = res.body
                        if (res.statusCode == 200) {
                            Util.tipShow('成功领取一张优惠券！') // 发送领取优惠券的消息
                            im.doSendCouponGetTipMessage({
                                to: talker.id,
                                data: {
                                    name: couponData.actTitle,
                                    techName: talker.name
                                }
                            })
                        } else {
                            Util.tipShow(res.msg || errorInfo)
                        }
                    }, () => {
                        Util.tipShow(errorInfo)
                    })
                }
            },
            // 点击优惠券图标
            doClickCouponBtn () {
                let that = this
                that.changeToolClosed('coupon')

                if (that.coupons.length == 0) {
                    Util.tipShow('抱歉！暂无优惠券！')
                } else {
                    that.showCoupons = !that.showCoupons
                }
                eventHub.$emit('change-wrap-height', 'normal')
            },
            // 点击礼物
            doClickGiftItem (gift) {
                let that = this
                let txtInput = that.$refs.txtInput
                if (that.currSelectGift == gift) {
                    that.currSelectGift = null
                    that.showInputTip = true
                    txtInput.innerHTML = ''
                    that.sendBtnStatus = 'disabled'
                } else {
                    that.currSelectGift = gift
                    txtInput.innerHTML = '[礼物：' + gift.name + ']'
                    that.showInputTip = false
                    that.sendBtnStatus = ''
                }
            },
            // 点击积分礼物按钮
            doClickGiftBtn () {
                let that = this
                let txtInput = that.$refs.txtInput
                if (that.gifts.length == 0) {
                    eventHub.$emit('change-wrap-height', 'normal')
                    return Util.tipShow('当前无积分礼物可发送！')
                }
                if (that.showGiftList) {
                    txtInput.innerHTML = ''
                    eventHub.$emit('change-wrap-height', 'normal')
                } else {
                    that.changeToolClosed('gift')
                    eventHub.$emit('change-wrap-height', 'gift')
                }
                that.showGiftList = !that.showGiftList
            },
            // image input 发送图片按钮
            doChangeFileInput () {
                let that = this
                let imgFile = that.$refs.imgFile
                let file = imgFile.files[0]

                that.changeToolClosed('pic')
                eventHub.$emit('change-wrap-height', 'normal')
                if (file.size > 30 * 1024 * 1024) {
                    return Util.tipShow('抱歉！所选图片超过30M，太大无法发送！')
                }
                let fileName = file.name
                let dotIndex = fileName.lastIndexOf('.')
                let fileType
                if (dotIndex < 0) return
                fileType = fileName.substring(dotIndex + 1)
                if (!/^(jpg|jpeg|gif|png|bmp|webp)$/i.test(fileType)) {
                    return Util.tipShow('请选择图片进行发送！')
                }
                im.doSendImageMessage({
                    file: file, to: that.talker.id, imgFile: imgFile
                })
            },
            changeToolClosed (type) {
                let that = this
                if (type != 'expression') {
                    that.showExpression = false
                }
                if (type != 'coupon') {
                    that.showCoupons = false
                }
                if (type != 'gift') {
                    that.showGiftList = false
                    that.currSelectGift = null
                    // that.showInputTip = true
                    // that.$refs.txtInput.innerHTML = ''
                    // that.sendBtnStatus = 'disabled'
                }
            },
            // 点击发送按钮
            doClickSendBtn () {
                let that = this
                let talker = that.talker
                if (that.sendBtnStatus == 'disabled') return
                if (that.showGiftList && that.currSelectGift) { // 发送积分礼物
                    let giftVal = that.currSelectGift.ratio || 0
                    if (giftVal > 0) {
                        Global.getCreditAccount(talker.clubId).then(res => {
                            that.$emit('update:curr-integral-account', parseInt(res[0] ? res[0].amount : 0)) // 更新当前积分数
                            if (that.integralAccount <= 0 || giftVal > that.integralAccount) {
                                eventHub.$emit('set-credit-tip', { amount: giftVal, show: true, type: 'gift' })
                            } else {
                                that.sendGift()
                            }
                        })
                    } else {
                        that.sendGift()
                    }
                } else {
                    that.sendText()
                }
            },
            // 发送礼物
            sendGift () {
                let that = this
                let talker = that.talker
                let txtInput = that.$refs.txtInput
                let currSelectGift = that.currSelectGift
                let lastSelection = that.lastSelection

                txtInput.innerHTML = ''
                that.sendBtnStatus = 'disabled'

                im.doSendGiftRewardMessage({
                    to: talker.id,
                    data: {
                        giftId: currSelectGift.id, giftValue: currSelectGift.ratio, giftName: currSelectGift.name
                    },
                    success () { // 发送成功之后的回调
                        that.$http.get('../api/v2/credit/gift/send', {
                            params: {
                                clubId: talker.clubId, emchatId: talker.id, giftId: currSelectGift.id, num: 1
                            }
                        }).then(res => {
                            res = res.body
                            that.currSelectGift = null
                            if (res.statusCode == 200) {
                                eventHub.$emit('update-credit-account')
                            } else {
                                Util.tipShow(res.msg || '礼物发送失败！')
                            }
                        })
                    }
                })
                lastSelection.node = txtInput
                lastSelection.offset = 0
            },
            // 发送普通文本消息
            sendText () {
                let that = this
                let talker = that.talker
                let txtInput = that.$refs.txtInput
                let lastSelection = that.lastSelection
                let divNode = that.divNode

                divNode.innerHTML = txtInput.innerHTML.replace(/<\/div>/g, '').replace(/<div>/g, '<br/>')
                let imgNodes = divNode.getElementsByTagName('img')
                let textNode
                let imgNodesLen = imgNodes.length
                for (let i = imgNodesLen - 1; i >= 0; i--) {
                    textNode = document.createTextNode(imgNodes[i].getAttribute('data-exp'))
                    divNode.replaceChild(textNode, imgNodes[i])
                }
                if (divNode.innerHTML.length > 1000) {
                    return Util.tipShow('您输入的太多了，无法发送！')
                }
                if (divNode.innerHTML.length != imgNodesLen * 4) {
                    txtInput.focus()
                }
                txtInput.innerHTML = ''
                that.sendBtnStatus = 'disabled'
                im.doSendTextMessage({
                    to: talker.id, data: divNode.innerHTML.trim()
                })
                lastSelection.node = txtInput
                lastSelection.offset = 0
            }
        },
        beforeDestroy () {
            let that = this
            eventHub.$off('goto-reward-tech', that.doClickRewardBtn)
            eventHub.$off('change-tool-state', that.changeToolClosed)
        }
    }
</script>
