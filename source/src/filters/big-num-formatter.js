/**
 * club list viewCount 数字的格式化显示
 * */

export default function (num) {
    if (!num) {
        return '0'
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k'
    } else {
        return num
    }
}
