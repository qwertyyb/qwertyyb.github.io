import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "木旁随笔",
  description: "Hello World",
  srcDir: "src",
  themeConfig: {
    logo: {
      light: '/static/logo.light.png',
      dark: '/static/logo.dark.png'
    },
    aside: 'left',
    footer: {
      message: `<a href="https://beian.miit.gov.cn/" rel="noopener" target="_blank">豫ICP备18003010号-2</a><br><a class="gongan-beian" href="https://beian.mps.gov.cn/#/query/webSearch?code=41138102000324" target="_blank">
        <img src="/static/备案图标.png" class="icon" alt="" style="width:14px;margin-right:8px;display:inline-block;vertical-align:middle">
        <a href="https://beian.mps.gov.cn/#/query/webSearch?code=41138102000324" rel="noreferrer" target="_blank">豫公网安备41138102000324号</a>
    </a><br>`,
      copyright: '原创内容版权所有，保留所有权利'
    }
  }
})
