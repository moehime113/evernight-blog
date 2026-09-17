export default function CommentSection() {
  return (
    <section className="rounded-3xl border border-white/50 bg-white/40 p-8 shadow-xl dark:border-slate-800/50 dark:bg-slate-900/40 space-y-4">
      <h2 className="text-2xl font-bold">评论与登录配置</h2>
      <p>网站已改用 GitHub 登录和服务端评论接口。请在 XHBlogs 的部署环境中设置以下变量，不要把密钥保存到 siteConfig.ts。</p>
      <ul className="list-inside list-disc font-mono text-sm space-y-2">
        <li>AUTH_URL</li>
        <li>AUTH_SECRET</li>
        <li>AUTH_GITHUB_ID</li>
        <li>AUTH_GITHUB_SECRET</li>
        <li>DATABASE_URL</li>
      </ul>
      <p className="text-sm">OAuth 回调路径：/api/auth/callback/github。评论保存在 Neon PostgreSQL；首次部署前执行 npm run db:init。任何 GitHub 用户均可评论，无需仓库或管理员初始化。后台不保存登录凭据。</p>
    </section>
  );
}
