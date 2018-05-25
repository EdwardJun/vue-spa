/**
 * 日期的格式化
 * */
import Util from '../libs/util'

export default function (longtime, type) {
    if (typeof longtime == 'string') {
        longtime = (+new Date(longtime.replace(/-/g, '/')))
    }
    return Util.parseDateFormat(longtime, type)
}
