# Evernight の 宝藏之地

Evernight 的个人博客，记录学习、代码与生活。站点地址：https://evernight.fun

[English](README_en.md)

## 项目结构

- `XHBlogs/`：Next.js 16、React 19、Tailwind CSS 4 公共站点，部署到 Vercel。
- `my-blog-manager/`：可选的本地内容管理工具，不部署到公网。
- `scripts/checkConfig.mjs`：补齐两端站点配置默认值。

文章使用 Markdown；站点信息与图片在两端 `siteConfig.ts` 中维护，关于页内容位于 `app/about/about.md`。保留模板图片与视觉风格，不沿用原作者个人资料。API 宠物及其聊天接口已移除。

## 本地开发

使用 Node.js 22.15 或更高版本，在 `XHBlogs/` 下执行：

```sh
npm ci
npm run dev
```

提交前可运行 `npm run lint`、`npm run typecheck`、`npm test` 和 `npm run build`。

## 评论与部署

评论保存在 **Neon PostgreSQL Free** 数据库，受免费套餐配额限制。任何 GitHub 用户均可登录留言；登录只请求 `read:user`，不需要仓库权限、专用评论仓库或逐页初始化 Issue。

1. 创建 Neon 数据库，将连接串作为本地环境变量 `DATABASE_URL`，然后在 `XHBlogs/` 执行一次 `npm run db:init` 初始化评论表。
2. 创建 GitHub OAuth App，主页填 `https://evernight.fun`，回调填 `https://evernight.fun/api/auth/callback/github`。本地调试使用独立 OAuth App，回调为 `http://localhost:3000/api/auth/callback/github`。
3. 在 Vercel 导入仓库，Root Directory 选择 `XHBlogs`，Framework Preset 选择 Next.js，配置以下服务端环境变量后部署：

| 环境变量 | 用途 |
| --- | --- |
| `DATABASE_URL` | Neon PostgreSQL 连接串 |
| `AUTH_URL` | 站点源地址，生产为 `https://evernight.fun`，本地为 `http://localhost:3000` |
| `AUTH_SECRET` | 安全生成的随机会话密钥 |
| `AUTH_GITHUB_ID` | GitHub OAuth App Client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Client Secret |

不要将连接串或密钥写入源码、公开配置或 `NEXT_PUBLIC_*` 变量。环境变量变更后重新部署。完整部署说明见 [DEPLOY.md](DEPLOY.md)；以上为配置步骤，不代表线上验证已完成。

本地管理器的配置同步会覆盖公共站点配置，请保持两端一致。不要直接运行旧模板更新器覆盖此个人修改版；更新前备份并审查差异。

## 来源与许可

基于 [XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs)，原作者 **XingHuiSama**；由 **Evernight** 修改站点信息、内容与功能。

本项目遵循 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)，详见 [LICENSE](LICENSE)。分享或修改后发布须保留署名、许可链接并说明修改，禁止商业使用。模板图片保留原链接，其权利归相应权利人所有。
