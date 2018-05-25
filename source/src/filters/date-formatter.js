/**
 * 日期的格式化
 * */
import Util from '../libs/util'

export default function (timeStr, formatStr) {
    let time
    if (typeof timeStr == 'number') {
        time = new Date(timeStr)
    } else {
        time = new Date(timeStr.replace(/-/g, '/'))
    }
    return Util.dateFormat(time, formatStr)
}
