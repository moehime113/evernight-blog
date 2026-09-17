# Evernight's Blog

Evernight's personal notes on learning, code, and everyday life. Site: https://evernight.fun

[中文](README.md)

## Structure

- `XHBlogs/`: public site built with Next.js 16, React 19, and Tailwind CSS 4, deployed on Vercel.
- `my-blog-manager/`: optional local content manager; do not deploy it publicly.
- `scripts/checkConfig.mjs`: fills missing configuration defaults for both apps.

Posts use Markdown. Maintain site details and images in both `siteConfig.ts` files, and the about page in `app/about/about.md`. The template images and visual style are retained, not the original author's personal profile. The API pet and its chat endpoints have been removed.

## Local development

Use Node.js 22.15 or newer. Run inside `XHBlogs/`:

```sh
npm ci
npm run dev
```

Available checks: `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

## Comments and deployment

Comments use **Neon PostgreSQL Free**, subject to the plan's quotas. Any GitHub user can sign in and comment. Login requests only `read:user`; no repository permissions, dedicated comment repository, or per-page Issue initialization are required.

1. Create a Neon database, set its connection string as the local `DATABASE_URL` environment variable, and run `npm run db:init` once inside `XHBlogs/` to initialize the comment tables.
2. Create a GitHub OAuth App with homepage `https://evernight.fun` and callback `https://evernight.fun/api/auth/callback/github`. Use a separate OAuth App for local development with callback `http://localhost:3000/api/auth/callback/github`.
3. Import the repository into Vercel, select `XHBlogs` as Root Directory and Next.js as Framework Preset, then configure these server-side variables before deploying:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_URL` | Site origin: `https://evernight.fun` in production, `http://localhost:3000` locally |
| `AUTH_SECRET` | Securely generated random session secret |
| `AUTH_GITHUB_ID` | GitHub OAuth App Client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Client Secret |

Never put connection strings or secrets in source code, public configuration, or `NEXT_PUBLIC_*` variables. Redeploy after changing environment variables. See [DEPLOY.md](DEPLOY.md) for deployment details. These are setup instructions, not a claim of live verification.

The local manager can overwrite public site configuration during sync; keep both copies aligned. Do not run the old template updater over this customized site without a backup and a diff review.

## Attribution and license

Based on [XinghuisamaBlogs](https://github.com/heiehiehi/XinghuisamaBlogs) by **XingHuiSama**. **Evernight** modified the site identity, content, and features.

Licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/); see [LICENSE](LICENSE). Retain attribution and the license link, indicate modifications when sharing, and do not use commercially. Template images retain their original URLs; image rights belong to their respective owners.
