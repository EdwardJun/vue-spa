/**
 * 将  明天 19:00  这样的时间格式化为 明天 ( 04-26 ) 19:00
 * @param dt
 */
export default (dt) => {
    if (/^\d{2}:\d{2}$/g.test(dt)) {
        dt = '今天 ' + dt
    }
    if (/今天|明天|后天|大后天/.test(dt)) {
        var start = new Date()
        dt = dt.split(' ')
        var addDay = {'今天': 0, '明天': 1, '后天': 2, '大后天': 3}
        start.setDate(start.getDate() + addDay[dt[0]] || 0)
        return dt[0] + ' ( ' + (start.getMonth() < 9 ? '0' + (start.getMonth() + 1) : (start.getMonth() + 1)) + '-' + (start.getDate() <= 9 ? '0' + start.getDate() : start.getDate()) + ' ) ' + dt[1]
    } else {
        return dt
    }
}
