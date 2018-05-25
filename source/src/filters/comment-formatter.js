/**
 * 依据评价分值显示评价语
 * */

export default function (value, type) {
    var starTexts = [['非常差', '很差', '一般', '很好', '非常好'], ['非常严重', '很严重', '一般', '无偷钟', '认真负责']]
    return starTexts[type][Math.ceil(value / 20) - 1]
}
