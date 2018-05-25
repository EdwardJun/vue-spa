/**
 * 日期格式化
 * */

export default function (start, end, splitChar) {
    if (!splitChar) splitChar = '—'
    if (!start) start = ''
    if (!end) end = ''
    if (start && end) {
        return start + splitChar + end
    } else if (end) {
        return '截止至' + end
    }
    return '长期有效'
}
