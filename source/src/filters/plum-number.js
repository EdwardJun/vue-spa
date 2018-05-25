/**
 * 一元夺美女页面号码的显示
 * */

export default function (nos, winningNo) {
    var tempArr = []
    var k = 0
    nos = nos.split(',')
    for (; k < nos.length; k++) {
        if (nos[k] === winningNo) {
            tempArr.push('<strong>' + nos[k] + '</strong>')
        } else {
            tempArr.push('<span>' + nos[k] + '</span>')
        }
    }
    return tempArr.join('')
}
