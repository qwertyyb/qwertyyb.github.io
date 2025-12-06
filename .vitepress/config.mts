import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Hello World",
  description: "Hello World",
  srcDir: "src",
  themeConfig: {
    logo: './assets/logo.png',
    aside: 'left',
    footer: {
      message: `<a href="https://beian.miit.gov.cn/" rel="noopener" target="_blank">豫ICP备18003010号-2</a><div class="gongan-beian" style="display:flex;justify-content:center;align-items:center;">
        <img src="./assets/备案图标.png" class="icon" alt="" style="width:18px;margin-right:8px">
        <a href="https://beian.mps.gov.cn/#/query/webSearch?code=41138102000324" rel="noreferrer" target="_blank">豫公网安备41138102000324号</a>
    </div><br>`,
      copyright: '原创内容版权所有，保留所有权利'
    }
  }
})
