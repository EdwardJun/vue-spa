webpackJsonp([79],{a6jq:function(e,i,r){"use strict";Object.defineProperty(i,"__esModule",{value:!0});var n=r("vbKY"),t=r("TVG1"),a=(r("4IlM"),{filters:{CodeFormatter:r("7Nka").a},data:function(){return{global:n.a.data,requestTag:0,clubName:"",prizeName:"",prizeTime:"-",verifyCode:"",codeUrl:"",actDesc:"",prizeType:""}},created:function(){var e=this.global,i=e.currPage.query,r=i.recordId,n=i.cardId,a=i.prizeType,d=i.actId;if(this.prizeType=a,document.title="中奖详情",!r||!a||!d)return t.a.tipShow(e.visitError),this.$router.back();this.queryData(r,d,n,a)},methods:{init:function(e){this.clubName=e.clubName,this.prizeTime=e.prizeTime,this.prizeName=e.prizeName,this.actDesc=e.actDesp||"无",this.verifyCode=e.verifyCode,e.qrCode&&(e.qrCode=JSON.parse(e.qrCode),this.codeUrl=jrQrcode.getQrBase64(e.qrCode.qrNo,{padding:0}))},queryData:function(e,i,r,n){var a=this,d=a.global;a.$http.post("../api/v2/user/luckyWheel/cardPrizeDetail",{recordId:e,actId:i,cardId:r,prizeType:n}).then(function(o){o=o.body,a.requestTag++,200==o.statusCode?(a.init(o.respData),d.loading=!1):307==o.statusCode&&a.requestTag<3?setTimeout(function(){a.queryData(e,i,r,n)},300):(t.a.tipShow(o.msg||d.loadError),a.$router.back())},function(){t.a.tipShow(d.loadError),a.$router.back()})}}}),d={render:function(){var e=this,i=e.$createElement,r=e._self._c||i;return r("div",{staticClass:"page",attrs:{id:"lucky-detail-page"}},[r("div",{staticClass:"club-name"},[e._v(e._s(e.clubName))]),e._v(" "),r("div",{staticClass:"prize-wrap"},[r("div",[e._v(e._s(e.prizeName)),r("span",[e._v("大转盘")])]),e._v(" "),r("div",[e._v("中奖时间："+e._s(e.prizeTime))])]),e._v(" "),r("div",{staticClass:"code-wrap"},[r("div",[e._v("电子票号(使用时请出示"+e._s(1==e.prizeType?"兑换码":"二维码，或者优惠码")+")")]),e._v(" "),e.codeUrl&&1!=e.prizeType?r("img",{attrs:{src:e.codeUrl}}):e._e(),e._v(" "),r("div",{class:{big:1==e.prizeType}},[e._v(e._s(e._f("CodeFormatter")(e.verifyCode)))])]),e._v(" "),r("div",{staticClass:"desc-wrap"},[r("div",[e._v("抽奖说明")]),e._v(" "),r("div",{domProps:{innerHTML:e._s(e.actDesc)}})])])},staticRenderFns:[]};var o=r("Z0/y")(a,d,!1,function(e){r("kGhB")},null,null);i.default=o.exports},jW63:function(e,i,r){(e.exports=r("XLS9")(!1)).push([e.i,'\n.clearfix {\n  display: inline-block;\n}\n.clearfix:after {\n    display: block;\n    content: ".";\n    height: 0;\n    line-height: 0;\n    clear: both;\n    visibility: hidden;\n}\n@media (-webkit-min-device-pixel-ratio: 1.5), (min-device-pixel-ratio: 1.5) {\n.border-1px::after {\n    -webkit-transform: scaleY(0.7);\n    transform: scaleY(0.7);\n}\n}\n@media (-webkit-min-device-pixel-ratio: 2), (min-device-pixel-ratio: 2) {\n.border-1px::after {\n    -webkit-transform: scaleY(0.5);\n    transform: scaleY(0.5);\n}\n}\ndiv#lucky-detail-page .club-name {\n  line-height: 2.444rem;\n  background: #fff0d9;\n  color: #666;\n  text-align: center;\n  font-size: 0.889rem;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\ndiv#lucky-detail-page .prize-wrap {\n  background: #fff;\n  padding: 0.667rem 0.667rem 0.3rem;\n}\ndiv#lucky-detail-page .prize-wrap > div:nth-of-type(1) {\n    color: #4d4d4d;\n    font-size: 1.167rem;\n    margin-bottom: 0.2rem;\n}\ndiv#lucky-detail-page .prize-wrap > div:nth-of-type(1) > span {\n      float: right;\n      color: #f66;\n      font-size: 0.889rem;\n}\ndiv#lucky-detail-page .prize-wrap > div:nth-of-type(2) {\n    color: #999;\n    font-size: 0.778rem;\n}\ndiv#lucky-detail-page .code-wrap {\n  margin-top: 0.666rem;\n  padding: 0.694rem 0.886rem 0.722rem;\n  background: #fff;\n  border-top: 1px solid #d9d9d9;\n}\ndiv#lucky-detail-page .code-wrap > div {\n    color: #4d4d4d;\n}\ndiv#lucky-detail-page .code-wrap > div:nth-of-type(1) {\n      font-size: 0.778rem;\n      margin-bottom: 0.25rem;\n}\ndiv#lucky-detail-page .code-wrap > div:nth-of-type(2) {\n      text-align: center;\n      font-size: 0.889rem;\n}\ndiv#lucky-detail-page .code-wrap > div:nth-of-type(2).big {\n        margin-top: 0.2rem;\n        line-height: 2;\n        color: #4a4a4a;\n        font-size: 2.056rem;\n        border-radius: 0.35rem;\n        border: 1px dashed #d7d7d7;\n}\ndiv#lucky-detail-page .code-wrap > img {\n    display: block;\n    margin: 0.5rem auto;\n    width: 6.444rem;\n    height: 6.444rem;\n}\ndiv#lucky-detail-page .desc-wrap {\n  background: #fff;\n  border-top: 1px solid #d9d9d9;\n  margin-top: 0.666rem;\n  padding: 0.3rem 0 0.5rem 1rem;\n}\ndiv#lucky-detail-page .desc-wrap > div:nth-of-type(1) {\n    color: #ff9c0a;\n    font-size: 0.889rem;\n    border-bottom: 1px solid #d9d9d9;\n    line-height: 2.0;\n}\ndiv#lucky-detail-page .desc-wrap > div:nth-of-type(2) {\n    font-size: 0.833rem;\n    color: #616161;\n    line-height: 1.8rem;\n    padding-top: 0.2rem;\n    padding-right: 0.5rem;\n}\n',""])},kGhB:function(e,i,r){var n=r("jW63");"string"==typeof n&&(n=[[e.i,n,""]]),n.locals&&(e.exports=n.locals);r("FIqI")("6d597e68",n,!0,{})}});