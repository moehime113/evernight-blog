# 部署到 Vercel

仓库位于 `~/evernight-blog`（与旧站 `~/moehime113.github.io` 分离）。部署只使用 `XHBlogs/`，不要上传本地管理后台 `my-blog-manager/`。

当前状态：已部署到 Vercel（项目 `evernight-blog`），域名 `evernight.fun` 已绑定，Git 已关联自动部署。

## 1. 站点信息

- 站点身份集中在 `XHBlogs/siteConfig.ts`（标题、作者、社交、友链格式）。
- 头像/背景/封面仍是模板图床链接，替换成自己的图片后更新 `siteConfig.ts`。
- `public/CNAME` 仅对 GitHub Pages 有意义，Vercel 域名在项目 Settings → Domains 管理。

保留项目根目录的 `LICENSE`。模板采用 CC BY-NC 4.0，仅允许非商业用途；在网站页脚加上可见署名，例如：

> 基于 [XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs)，作者 XingHuiSama；[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)。由 Evernight 修改站点信息与内容。

## 2. 本地检查

安装 Node.js 22 LTS，然后在终端执行：

```sh
cd /home/evernight/evernight-blog/XHBlogs
npm ci
npm run lint
npx tsc --noEmit --incremental false
npm run build
```

如果检查失败，先处理报错。模板启用了 `typescript.ignoreBuildErrors`，因此构建成功不代表类型检查通过；不要仅凭构建结果判断可发布。

## 3. 登录并创建预览部署

仍在 `XHBlogs` 目录执行：

```sh
npx vercel login
npx vercel
```

按提示在浏览器登录并授权，无需把密码或 Token 发给任何人。交互选项：

- 选择自己的 Vercel 账号或团队。
- 首次部署时选择创建新项目，不关联无关的已有项目。
- 项目名使用 `evernight-blog`，如已占用则换名。
- 代码目录选择 `./`。
- 接受自动识别的 Next.js 设置；不要选择静态导出，也不要把输出目录指定为 `out`。

这种方式直接上传本地前端项目，不需要 `gh`、GitHub 推送或先创建 GitHub 仓库。只安装 Vercel CLI 本身不能代替账号授权。

打开命令返回的预览地址，检查首页、文章、关于页面和手机布局。评论、AI 和天气未配置时不保证可用；不要把 Gitalk client secret 或其他密钥填进 `siteConfig.ts`，该文件会进入浏览器代码。首次上线先不启用这些需要凭据的功能；AI 接口配置付费密钥前还需补充请求校验和限流。

## 4. 发布生产版本

确认预览符合预期后执行：

```sh
npx vercel --prod
```

以命令返回的生产地址和 Vercel 部署状态为准；本说明不代表部署已经完成。

## 5. 绑定 evernight.fun

1. 打开 Vercel 中的 `evernight-blog` 项目，进入 **Settings → Domains**。
2. 添加 `evernight.fun`。如需要 `www.evernight.fun`，另行添加并选择重定向到主域名。
3. 登录域名的 DNS 管理平台，根据 Vercel 为该域名实际显示的记录类型、主机名和记录值填写解析；不要套用旧教程中的固定 IP。
4. 如同一主机名已有冲突的 A、AAAA 或 CNAME 记录，先记下旧值，再按 Vercel 提示替换；不要删除邮件用的 MX/TXT 等无关记录。如要求 TXT 所有权验证，也按提示添加。
5. 等待 Vercel 显示域名配置有效且 HTTPS 证书就绪，再访问 `https://evernight.fun` 验证。

切换 DNS 会影响该域名现有流量，因此先验证 Vercel 生产地址。旧 GitHub Pages 仓库和默认访问地址可继续保留作为回退。

## 6. 后续更新与备份

修改源码、重新检查后，在 `XHBlogs` 目录运行 `npx vercel --prod` 即可更新。部署并不等于源码备份：请另建自己的源码仓库或做可靠备份，不要把这个嵌套仓库误当成旧部署仓库的一部分直接提交。
