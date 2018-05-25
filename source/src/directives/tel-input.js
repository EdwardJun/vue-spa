/**
 * 限定只能输入11位的手机号码
 */
export default {
    bind: function (el) {
        el.addEventListener('input', function () {
            var val = el.value
            if (/\D/.test(val)) {
                val = val.replace(/\D/g, '')
            }
            if (val.length == 1 && val != 1) {
                val = ''
            }
            if (val.length == 2 && !/^1[3456789]$/.test(val)) {
                val = 1
            }
            if (val.length > 11) {
                val = val.substring(0, 11)
            }
            el.value = val
        })
    }
}
