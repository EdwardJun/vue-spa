<template>
    <div class="page" id="test-page" style="text-align:center;padding:2rem 0">
        <audio ref="au" controls="controls" autoplay src="./static/22.mp3"></audio>
    </div>
</template>
<script>
    import Global from '../libs/global'
    export default {
        data () {
            return {
                global: Global.data
            }
        },
        mounted () {
            let that = this
            let global = that.global
            // src="./static/11.mp3"
            // let url = 'https://a1.easemob.com/xiaomodo/spa/chatfiles/d5154f00-275f-11e8-8581-276581f528ea'
            // let url = 'http://183.3.253.81/asn.com/stddownload_common_file?authkey=3043020101043c303a02010102010102040c576dd202037a1db9020451fd03b7020451fd03b702037a1afd02041d16a3b402041116a3b402045ab0a7dc02045ae7cd4a0400&bid=10001&subbid=1400063117&fileid=305d02010004563054020100041231343431313532313033373339373538363902037a1afd02042616a3b402045aa8c8730424373337323532363836393338343035343930305f33299c8b6f544bf79d6d228ebb8bb1960201000201000400&filetype=2106&openid=eceff60ead80b37bfb1a91eba081ffee&ver=0'
            let url = './static/11.mp3'
            that.$nextTick(() => {
                that.$refs.au.onerror = function (err) {
                    // console.log('play error：', err, 'error code：', that.$refs.au.error.code)
                }
                var xhr = new XMLHttpRequest()
                xhr.open('GET', url, true)
                xhr.responseType = 'blob'
                xhr.onload = function () {
                    if (xhr.readyState === 4) {
                        if (this.status === 200) {
                            // console.log('.............', this.response)
                            that.$refs.au.src = URL.createObjectURL(this.response)
                        } else {
                            // console.log('44444444')
                        }
                    }
                }
                // xhr.setRequestHeader('Accept', 'audio/mp3')
                // xhr.setRequestHeader('Authorization', 'Bearer YWMtynG88CdfEeiVpiW489I6Lvi2VYDJbxHlgbTr3lPj6uYeMKdq2TQR5b07R3eWpPb_AwMAAAFiI5OiNgBPGgAoU76TQNbqpucoH2F7GCaC5Vd3eOiruYUXuqQRRbqsQw')
                // xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
                // xhr.send()
            })
            global.loading = false
        }
    }
</script>
