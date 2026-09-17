---
title: "从 Hexo 到 Nuxt：博客迁移全记录"
date: "2026-05-03"
description: "记录将个人博客从 Hexo + Butterfly 迁移到 Nuxt 4 SSG 的过程和体验"
cover: "/img/dusays-69c24230de927.jpg"
---

## 为什么要离开 Hexo？

Hexo + Butterfly 颜值没得说，Butterfly 的设计审美我很喜欢。但随着博客越折腾越复杂，痛点逐渐暴露出来。

### PJAX 与 PWA 的相爱相杀

Butterfly 内置了 PJAX 局部刷新和 PWA 离线缓存。单独看每个都是好东西，合在一起就变成了玄学——发布新文章后，读者看到的永远是旧版。无痕模式打开是新的，正常模式死活不刷新。

问题根源在于：**Hexo 生成的静态页面是黑盒，精确控制缓存行为非常困难**。Service Worker 缓存策略、CDN 边缘缓存、浏览器缓存层层叠加，调试起来如同开盲盒。

### 构建速度与生态

文章数量上来之后，`hexo g` 的时间肉眼可见地变长。Hexo 的机制是**全量生成**，每次都要把所有页面重新渲染一遍。插件生态虽然丰富，但质量参差不齐，主题和插件之间的耦合经常让人头疼。

---

## 为什么选 Nuxt？

看过 VitePress、Astro、Next.js，最终选了 **Nuxt 4 SSG**。核心考量：

HexoNuxt 4**构建机制**CLI 全量生成静态文件Nitro 引擎预渲染 + 增量构建**模板/组件**EJS/Pug，无组件化Vue 3 组件，自动导入**内容管理**front-matter + markdown@nuxt/content v3，类型安全查询**交互**内联 script，靠 CDN完整的 Vue 响应式生态**路由**`_config.yml` permalink 配置文件系统路由，动态参数

### 最大的吸引力：内容格式不变

@nuxt/content v3 直接读取 markdown，frontmatter 字段几乎不用改。这意味着**迁移成本大头不在内容，只在工程搭建**。所有文章原封不动搬过来就能用。

### Vue 生态的开发体验

组件化意味着每个 UI 单元独立、可复用、可测试。`useAsyncData` + `queryCollection` 这套数据获取模式比 Hexo 的散落配置清晰太多。写交互不需要 hack，不需要往 HTML 里塞 `<script>` 标签。

---

## 迁移过程

### 内容层：零改动搬过来

所有 markdown 文件从 Hexo 的 `source/_posts/` 复制到 Nuxt 的 `content/posts/`。frontmatter 稍微做了统一：

```text

```

多了 `description` 字段用于 SEO 和列表摘要，暂时去掉 `tags`。内容正文一个字没改。

### 路由：从 permalink 到文件系统

Hexo 的 URL 靠 `_config.yml` 里的 permalink 模式定义。Nuxt 直接用文件系统路由：

```text

```

Nuxt 路由由 `pages/` 目录结构决定，`posts/[...slug].vue` 处理所有文章详情页。`trailingSlash: true` 保证 URL 一致性，`[...slug].vue` 兜底 404。

### 设计系统：从 Stylus 到 CSS 自定义属性

Hexo + Butterfly 用 Stylus 预处理器定义主题变量，迁移后直接使用 CSS 自定义属性，不需要编译，主题切换是即时的。

### 部署：CI 保持不变

GitHub Actions 流程基本沿用原配置，只将构建命令从 `hexo g` 替换为 `npm run build`。

---

## 架构对比

### Hexo 的架构

```text

```

Hexo 是**生成器模式**：CLI 触发后读取配置 + 文章 + 主题，全量渲染成 HTML。主题和内容分离，但数据流是隐式的——配置散落在 `_config.yml`、`_config.butterfly.yml`、frontmatter 三处，模板里用不同变量名访问。

### Nuxt 的架构

```text

```

Nuxt 是**框架模式**：内容、组件、路由、构建都被统一管理。数据流是显式的——`queryCollection` 查询内容，`useAsyncData` 管理异步数据，`useTheme()` 封装主题逻辑。每一层职责清晰。

### 数据流对比

环节HexoNuxt内容获取读文件 → 模板注入变量`queryCollection('posts').all()`数据管理无，模板即数据`useAsyncData` + 响应式站点配置`_config.yml` + 主题 config`useSite()` composable主题Stylus 变量 → 编译到 CSSCSS 自定义属性 → 运行时切换交互状态全局变量 + DOM 操作Vue 响应式 + composables

### 预渲染策略

Hexo 每次 `hexo g` 都是全量重新生成所有页面。文章多了之后，构建时间变得不可忽视。

Nitro 的 `crawlLinks: true` 从 seed routes 出发，按 `<a href>` 链接爬取需要预渲染的页面，只渲染可被发现的页面。但 **crawlLinks 不能替代显式 routes 声明**——如果导航是客户端 JS 动态生成的，或某些页面没有直接的 `<a>` 链接指向，crawlLinks 可能漏掉它们。在 `nitro.prerender.routes` 里显式声明关键路由是好习惯：

```ts

```

## 迁移成本远低于预期

说实话出发前还挺忐忑的，担心工程量会很大。结果发现 markdown 内容零改动，核心工作量只在：

1. 搭建 Nuxt 项目骨架
2. 设计 CSS token 系统
3. 编写几个核心组件

借助 Claude Code 辅助，两天完成。框架升级收益是长期的，成本是一次性的。

---

## 总结

迁移之前，在折腾 Hexo 各种"魔改"时经常想——"要是能直接用 Vue 写就好了"。Node.js 生态的 SSG 方案已经非常成熟，对于内容驱动的博客站点，用 Nuxt + @nuxt/content 几乎是最佳实践。

**如果你的博客内容主要是 markdown，而你又有点前端基础，迁移到 Nuxt 绝对值得。** 内容不用动，开发体验质变，交互能力完全释放。

html pre.shiki code .sVyAn, html code.shiki .sVyAn{--shiki-default:#E06C75}html pre.shiki code .sn6KH, html code.shiki .sn6KH{--shiki-default:#ABB2BF}html pre.shiki code .sVC51, html code.shiki .sVC51{--shiki-default:#D19A66}html pre.shiki code .subq3, html code.shiki .subq3{--shiki-default:#98C379}html .default .shiki span {color: var(--shiki-default);background: var(--shiki-default-bg);font-style: var(--shiki-default-font-style);font-weight: var(--shiki-default-font-weight);text-decoration: var(--shiki-default-text-decoration);}html .shiki span {color: var(--shiki-default);background: var(--shiki-default-bg);font-style: var(--shiki-default-font-style);font-weight: var(--shiki-default-font-weight);text-decoration: var(--shiki-default-text-decoration);}

