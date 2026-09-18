// 抓取 GitHub 公开数据（贡献日历 + 活动流），只读、服务端使用、6 小时缓存
// ponytail: 抓公开 HTML/Atom，GitHub 改版时靠 parse 失败后的空状态兜底；要更稳就换 GraphQL + token

export type GithubEvent = { id: string; kind: string; title: string; date: string; url: string };
export type GithubActivity = { contributions: Record<string, number>; total: number; events: GithubEvent[] };

const REVALIDATE = 6 * 60 * 60;

export function loginFromUrl(url?: string) {
  return url?.match(/github\.com\/([A-Za-z0-9-]+)/)?.[1] || '';
}

function decode(text: string) {
  return text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

/** 从贡献日历 HTML 里取出「日期 -> 当天贡献数」 */
export function parseContributions(html: string) {
  const dateById = new Map<string, string>();
  for (const tag of html.matchAll(/<td[^>]*id="contribution-day-component-(\d+)-(\d+)"[^>]*>/g)) {
    const date = tag[0].match(/data-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
    if (date) dateById.set(`${tag[1]}-${tag[2]}`, date);
  }

  const contributions: Record<string, number> = {};
  for (const tip of html.matchAll(/<tool-tip[^>]*for="contribution-day-component-(\d+)-(\d+)"[^>]*>([\s\S]*?)<\/tool-tip>/g)) {
    const date = dateById.get(`${tip[1]}-${tip[2]}`);
    if (!date) continue;
    const count = tip[3].match(/([\d,]+)\s+contributions?/);
    contributions[date] = count ? Number(count[1].replace(/,/g, '')) : 0;
  }

  const total = Number(html.match(/([\d,]+)\s*contributions?\s+in the last year/)?.[1]?.replace(/,/g, '') || 0);
  return { contributions, total };
}

/** 从 https://github.com/<user>.atom 活动流里取出最近的动态 */
export function parseEvents(xml: string, limit = 12): GithubEvent[] {
  const events: GithubEvent[] = [];
  for (const entry of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const block = entry[1];
    const id = block.match(/<id>([^<]+)<\/id>/)?.[1] || '';
    const title = decode(block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || '').trim();
    const url = block.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/)?.[1] || '';
    const raw = (block.match(/<updated>([^<]+)<\/updated>/)?.[1] || '').trim();
    if (!title) continue;
    events.push({
      id,
      kind: id.replace(/^tag:github\.com,\d+:/, '').replace(/\/.*$/, '').toLowerCase().replace(/event$/, ''),
      title,
      url,
      // "2026-09-17 00:06:14 -0700" / "... UTC" -> ISO
      date: raw.replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/, '$1T$2').replace(/ UTC$/, 'Z').replace(/ ([+-])(\d{2})(\d{2})$/, '$1$2:$3'),
    });
    if (events.length >= limit) break;
  }
  return events;
}

export async function fetchGithubActivity(login: string): Promise<GithubActivity> {
  if (!login) return { contributions: {}, total: 0, events: [] };
  // 5s 硬超时：GitHub 慢/不通时回落到空状态，别把构建或首屏拖住
  // （AbortSignal.timeout 实测没掐断慢连接，所以用 Promise.race 强制到点返回）
  const options: RequestInit & { next: { revalidate: number } } = { next: { revalidate: REVALIDATE } };
  const grab = (url: string) => Promise.race([
    fetch(url, options).then(r => (r.ok ? r.text() : '')).catch(() => ''),
    new Promise<string>(resolve => setTimeout(() => resolve(''), 5000)),
  ]);

  const [calendar, feed] = await Promise.all([
    grab(`https://github.com/users/${login}/contributions`),
    grab(`https://github.com/${login}.atom`),
  ]);

  return { ...parseContributions(calendar), events: parseEvents(feed) };
}
