import Vue from 'vue'
import router from './router'
import VueResource from 'vue-resource'
import App from './app.vue'
import Global from './libs/global'
import Util from './libs/util'
import store from './store/index'
import AwesomeSwiper from 'vue-awesome-swiper'

Vue.use(VueResource)
Vue.use(AwesomeSwiper)
Vue.http.options.emulateJSON = true
Vue.config.productionTip = false
Global.beforeInit()

var _global = Global.data
var win = window
win._g = Global
win._u = Util
win._store = store

// 设置vue-resource的inteceptor
Vue.http.interceptors.push((request, next) => {
    // 设置全局的请求参数
    var requestParam
    if (request.method.toLowerCase() === 'get') {
        requestParam = request.params
        requestParam['_'] = (+new Date()) // 时间戳
    } else {
        requestParam = request.body
    }
    requestParam.sessionType = _global.sessionType
    if (!requestParam.token) {
        requestParam.token = _global.token
    }
    if (!requestParam.tokenId) {
        requestParam.tokenId = Util.generateUUID()
    }
    request.headers.set('xmdAppId', _global.xmdAppId)
    request.headers.set('appId', _global.appId)

    // 回调响应函数之前的处理
    next((response) => {
        if (response.status == 401 || response.body.statusCode == 401) { // 401状态需要重新登录
            if (!_global.userAgent.isWX) {
                Global.login()
            } else {
                Util.tipShow('请求异常！401')
            }
        } else {
            var resBody = response.body
            if (typeof resBody === 'string') {
                try {
                    response.body = resBody = JSON.parse(resBody)
                } catch (e) {}
            }

            if (resBody && resBody.statusCode === 500) {
                console.log('req error：' + response.url)
            }
            return response
        }
    })
})

Global.init().then(() => {
    Global.getClubData().then(() => {
        /* eslint-disable no-new */
        new Vue({ el: '#_app', router, store, render: h => h(App) })
    })
})
