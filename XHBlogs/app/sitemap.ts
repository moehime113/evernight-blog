import type { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BASE_URL = 'https://evernight.fun';

// 静态页面 + 全部文章，文章的 lastModified 取自 frontmatter 的 date
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ['', '/projects', '/timeline', '/photowall', '/music', '/moments', '/friends', '/about'].map(route => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.7,
  }));

  const postsDirectory = path.join(process.cwd(), 'posts');
  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    if (fs.existsSync(postsDirectory)) {
      postRoutes = fs.readdirSync(postsDirectory)
        .filter(f => f.endsWith('.md'))
        .map(f => {
          const { data } = matter(fs.readFileSync(path.join(postsDirectory, f), 'utf8'));
          return {
            url: `${BASE_URL}/posts/${f.replace(/\.md$/, '')}`,
            lastModified: data.date ? new Date(data.date) : new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
          };
        });
    }
  } catch { /* posts 目录缺失时只返回静态页 */ }

  return [...staticRoutes, ...postRoutes];
}
