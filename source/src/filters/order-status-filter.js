/**
 * 订单状态过滤器
 *
 * Created by Administrator on 2016/9/29.
 *
 */
var statusObj = {
    unpaid: {tag: 'unpaid', name: '待支付'},
    submit: {tag: 'fail', name: '待接受'},
    accept: {tag: 'normal', name: '已接受'},
    cancel: {tag: 'fail', name: '取消'},
    reject: {tag: 'fail', name: '拒接'},
    locked: {tag: 'fail', name: '冻结'},
    complete: {tag: 'normal', name: '完成'},
    failure: {tag: 'fail', name: '失效'},
    overtime: {tag: 'fail', name: '超时'},
    refund: {tag: 'refund', name: '退款中'},
    refunded: {tag: 'refunded', name: '退款完成'},
    refundfailure: {tag: 'refunded', name: '退款失败'},
    error: {tag: 'error', name: '下单失败'},
    expire: {tag: 'expire', name: '过期'},
    process: {tag: 'process', name: '付款处理中'}
}

/**
 *
 * @param status    状态值
 * @param type      取tag值，还是name值
 */
export default (status, type) => {
    if (!status || !statusObj[status]) return '状态值错误'
    return statusObj[status][type]
}
