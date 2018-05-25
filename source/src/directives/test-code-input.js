/**
 * 限定只能输入4位的数字
 */
export default {
    bind: function (el) {
        el.addEventListener('input', function () {
            var val = el.value
            if (/\D/.test(val)) {
                val = val.replace(/\D/g, '')
            }
            if (val.length > 4) {
                val = val.substring(0, 4)
            }
            el.value = val
        })
    }
}
