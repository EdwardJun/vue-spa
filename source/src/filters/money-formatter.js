/**
 * 金额的格式化
 * */

export default function (money) {
    return ((money - 0) / 100).toFixed(2)
}
