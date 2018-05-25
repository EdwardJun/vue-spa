/**
 * util.js
 */
var defaultPrefix = 'spa_'
const DayMap = {
    'Mon': '周一', 'Tues': '周二', 'Wed': '周三', 'Thur': '周四', 'Fri': '周五', 'Sat': '周六', 'Sun': '周日'
}
export default {
    data: {
        tip: document.querySelector('#app-tip')
    },
    tipShow (content, time) {
        let tip = this.data.tip
        if (!tip) {
            tip = this.data.tip = document.querySelector('#app-tip')
        }
        tip.children[0].innerHTML = content
        tip.classList.add('active')
        setTimeout(() => {
            tip.classList.remove('active')
        }, (time || 3000))
    },
    localStorage (key, value, prefix) {
        key = (prefix || defaultPrefix) + key
        if (value) {
            localStorage.setItem(key, value)
        } else {
            return localStorage.getItem(key) || ''
        }
    },
    removeLocalStorage (key, prefix) {
        if (key) {
            localStorage.removeItem((prefix || defaultPrefix) + key)
        }
    },
    sessionStorage (key, value, prefix) {
        key = (prefix || defaultPrefix) + key
        if (value) {
            sessionStorage.setItem(key, value)
        } else {
            return sessionStorage.getItem(key)
        }
    },
    removeSessionStorage (key, prefix) {
        if (key) sessionStorage.removeItem((prefix || defaultPrefix) + key)
    },
    // 生成唯一标识UUID
    generateUUID () {
        let d = (+new Date())
        let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = (d + Math.random() * 16) % 16 | 0
            d = Math.floor(d / 16)
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16)
        })
        return uuid
    },
    dateFormat (date, format = 'yyyy-MM-dd hh:mm:ss') {
        let o = {
            'M+': date.getMonth() + 1,
            'd+': date.getDate(),
            'h+': date.getHours(),
            'm+': date.getMinutes(),
            's+': date.getSeconds(),
            'q+': Math.floor((date.getMonth() + 3) / 3),
            'S': date.getMilliseconds()
        }
        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
        }
        for (let k in o) {
            if (new RegExp('(' + k + ')').test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
            }
        }
        return format
    },
    parseDateFormat (longtime, type) { // 格式化Date.parse的时间类型
        let d = new Date(longtime)
        let month = d.getMonth() + 1
        let day = d.getDate()
        let hour = d.getHours()
        let min = d.getMinutes()
        let sec = d.getSeconds()
        hour = (hour > 9 ? hour : '0' + hour)
        min = (min > 9 ? min : '0' + min)
        sec = (sec < 10 ? '0' + sec : sec)
        let str = d.getFullYear() + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day)
        return type == 'long' ? (str + ' ' + hour + ':' + min + ':' + sec) : str
    },
    // 字符串YYYY-MM-DD hh:mm:ss 转日期Date类型
    stringToDate (str) {
        if (!str) return
        let tArr = str.split(' ')
        let dateArr = tArr[0].split('-')
        let timeArr
        let date = new Date()
        if (dateArr.length == 3) {
            date.setFullYear(dateArr[0] - 0, dateArr[1] - 1, dateArr[2] - 0)
        }
        if (tArr[1]) {
            timeArr = tArr[1].split(':')
            if (timeArr[0]) {
                date.setHours(timeArr[0] - 0)
            }
            if (timeArr[1]) {
                date.setMinutes(timeArr[1] - 0)
            }
            if (timeArr[2]) {
                date.setSeconds(timeArr[2] - 0)
            }
        }
        return date
    },
    spaceFormat (str, last, num, space, spaceChar) {
        if (!str) return
        let spaceStr = ''
        last = last === true
        num = Math.abs(num || 4)
        space = Math.abs(space || 1)
        spaceChar = spaceChar || ' '
        let reg = new RegExp('(\\S{' + num + '})', 'g')
        if (last) {
            reg = new RegExp('(\\S)(?=(\\S{' + num + '})+$)', 'g') // 反向,使用零宽断言
        }
        for (let j = space; j > 0; j--) {
            spaceStr += spaceChar
        }
        return str.replace(reg, '$1' + spaceStr)
    },
    urlFormat (url) {
        let baseStr = url.split('?')
        let paramStr = baseStr[1]
        let tempStr = paramStr
        let queryStr = paramStr.split('#')
        let k
        let paramObj = {}
        let queryObj = null
        let tempArr
        let page

        paramStr = queryStr[0]
        queryStr = queryStr[1]

        if (paramStr) {
            let paramArr = paramStr.split('&')
            for (k = 0; k < paramArr.length; k++) {
                tempArr = paramArr[k].split('=')
                if (tempArr.length == 2) {
                    paramObj[tempArr[0]] = tempArr[1]
                }
            }
        }

        if (queryStr) {
            let queryArr = queryStr.split('&')
            for (k = 0; k < queryArr.length; k++) {
                tempArr = queryArr[k].split('=')
                if (tempArr.length == 1 && tempStr.indexOf('#' + tempArr[0]) >= 0) {
                    page = tempArr[0]
                } else if (tempArr.length == 2) {
                    if (!queryObj) {
                        queryObj = {}
                    }
                    queryObj[tempArr[0]] = tempArr[1]
                }
            }
        }
        let path = '/' + (paramObj.club ? paramObj.club + '/' : '') + page
        return {
            path: path, page: page || '', params: paramObj, query: queryObj
        }
    },
    // 获取页面参数，传入参数名返回对应的值，否则返回全部参数
    getPageParams (name) {
        /* eslint-disable */
        let reg = new RegExp('(^|&)?([\da-zA-Z_]+)=([^&\\?#\/\\\\]*)(\\?|#|\/|\\\\|&|$)', 'ig')
        let loc = location
        let strs = [loc.search.substring(1), loc.hash.substring(1)]
        let results = {}
        let tmpExec = ''
        let _tmp
        strs.forEach(function (s) {
            tmpExec = reg.exec(s)
            while (tmpExec) {
                _tmp = tmpExec[3]
                results[tmpExec[2]] = _tmp
                tmpExec = reg.exec(s)
            }
        })
        return name ? (results[name] || '') : results
    },
    /**
     * 获取当前位置（经纬度）
     * @param  {Function} callback [回调函数]
     */
    getLocation (successFunc, failedFunc) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(successFunc, function (error) {
                let errorMsg = ''
                switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = '用户拒绝对获取地理位置的请求。'
                    break
                case error.POSITION_UNAVAILABLE:
                    errorMsg = '位置信息是不可用的。'
                    break
                case error.TIMEOUT:
                    errorMsg = '请求用户地理位置超时。'
                    break
                case error.UNKNOWN_ERROR:
                    errorMsg = '未知错误。'
                }
                typeof failedFunc === 'function' && failedFunc(errorMsg, error.code)
            })
        } else {
            typeof failedFunc === 'function' && failedFunc('该浏览器不支持定位。')
        }
    },
    // 计算两个经纬度之间的距离
    getGreatCircleDistance (lat1, lng1, lat2, lng2) {
        let radLat1 = lat1 * Math.PI / 180.0
        let radLat2 = lat2 * Math.PI / 180.0
        let a = radLat1 - radLat2
        let b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0
        let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)))
        s = Math.round(s * 6378.137 * 10000) / 10
        return s
    },
    distanceFormat (d) {
        if (!d || d == Number.MAX_VALUE) {
            return '- m'
        }
        d = parseFloat(d, 10) * 1000
        if (isNaN(d) || d == 1000000 * 1000) {
            return '- m'
        }
        if (d > 1000) {
            return (d / 1000.0).toFixed(1) + 'km'
        }
        return (d).toFixed(0) + 'm'
    },
    paddingTime (t) {
        return t < 10 ? '0' + t : t
    },
    getCustomActTime (timeStr) {
        return timeStr.replace(/,/g, '，').replace(/(Mon|Tues|Wed|Thur|Fri|Sat|Sun)/g, function () {
            return DayMap[arguments[0]] || arguments[0]
        })
    }
}
