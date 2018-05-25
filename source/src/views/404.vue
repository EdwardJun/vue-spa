<style>
    #error-page {
        background: #646f86;
        color: #fff;
        font-size: 2.5rem;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        font-weight: bold;
        text-shadow: 2px 2px 3px rgba(0,0,0,0.3);
        letter-spacing: 3px;
    }
    .page>div{
        font-size: 0.778rem;
        line-height: 4;
        letter-spacing: 0;
        margin-top: 0.6rem;
    }
</style>
<template>
    <div class="page" id="error-page">404<div>Sorry！您访问的页面不存在！</div></div>
</template>
<script>
    import Global from '../libs/global'
    export default {
        name: '404',
        created () {
            Global.data.loading = false
        }
    }
</script>