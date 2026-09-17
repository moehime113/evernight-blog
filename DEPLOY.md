# 部署到 Vercel

仓库位于 `~/evernight-blog`（与旧站 `~/moehime113.github.io` 分离）。部署只使用 `XHBlogs/`，不要上传本地管理后台 `my-blog-manager/`。

当前状态：已部署到 Vercel（项目 `evernight-blog`），域名 `evernight.fun` 已绑定，Git 已关联自动部署。

## 1. 站点信息

- 站点身份集中在 `XHBlogs/siteConfig.ts`（标题、作者、社交、友链格式）。
- 头像、背景和封面沿用模板图片；更换图片时更新两端 `siteConfig.ts`。
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

如果检查失败，先处理报错。类型检查未被忽略；构建成功仍不能代替 lint 和真实登录流程验证。评论接口检查：`node --test lib/security.test.mjs`（Node.js 22.15+）。

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

打开命令返回的预览地址，检查首页、文章、关于页面和手机布局。API 宠物及聊天接口已移除。

### GitHub 登录与评论

在 Vercel 环境变量中配置下列值，并重新部署；本地开发放在未提交的 `XHBlogs/.env.local`，不要把密钥填进 `siteConfig.ts`。

| 变量 | 值 |
| --- | --- |
| `AUTH_URL` | `https://evernight.fun`；本地为 `http://localhost:3000` |
| `AUTH_SECRET` | 至少 32 字符的随机密钥，可运行 `openssl rand -base64 32` 生成 |
| `AUTH_GITHUB_ID` | 自己的 GitHub OAuth App Client ID |
| `AUTH_GITHUB_SECRET` | OAuth App Client Secret |
| `DATABASE_URL` | Neon PostgreSQL 连接串，由 Vercel 集成注入生产环境 |

OAuth App 的 Homepage URL 与 `AUTH_URL` 一致，Authorization callback URL 为 `AUTH_URL` 加 `/api/auth/callback/github`。本地、预览、生产使用各自匹配的 OAuth App，不要混用回调地址。

评论使用 Neon PostgreSQL 免费套餐，不再依赖 GitHub Issues。首次部署前提供 `DATABASE_URL` 并执行 `npm run db:init`；已有表不会被清空。也可执行 `npx vercel env run -e production -- npm run db:init`。开发与预览应连接独立数据库，避免测试数据进入生产环境。

任何 GitHub 用户都可在评论区点击「使用 GitHub 登录」授权后评论（等价于访问 `/login`，导航栏不再单列入口），无需管理员逐页初始化。登录只请求 `read:user`，加密 HttpOnly Cookie 仅保存身份，不保存 GitHub OAuth Token。旧会话需要重新登录；此前已授权的 `public_repo` 不会自动撤销，可在 GitHub 应用授权设置中撤销后重新授权。

评论最多 2000 字符，每个 GitHub 用户 60 秒内仅能提交一条，由数据库原子操作限流。评论公开显示为纯文本；管理或删除评论暂在 Neon 控制台操作。免费套餐有限额，超额会暂停服务，不自动升级付费。

上线验收：完成授权和退出、普通用户发帖、刷新后读取评论，并检查文章与说说评论。`npm test` 默认检查 API 与权限逻辑；可选 PostgreSQL 引擎测试需要 `PGLITE_MODULE`。这些测试不能代替真实 OAuth 回调及线上持久化验收。

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
