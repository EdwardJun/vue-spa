/**
 * 限定输入6~20位的密码
 */
export default {
    bind: function (el) {
        el.addEventListener('input', function () {
            var val = el.value
            if (val.length > 20) {
                val = val.substring(0, 20)
            }
            el.value = val
        })
    }
}
