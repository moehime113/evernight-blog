// Run against a local preview: node scripts/check-visuals.mjs [base URL]
import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://localhost:3000';
for (const route of ['/', '/photowall']) {
  const response = await fetch(new URL(route, base));
  assert.equal(response.status, 200, route);
  const html = await response.text();
  const footer = html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/)?.[1];
  assert.ok(footer?.includes('CC BY-NC 4.0'), 'Keep attribution and license');
  assert.doesNotMatch(footer, /<nav|<button|快速通道|站点状态|正在听/, 'No duplicate footer widgets');
  assert.doesNotMatch(html, /#app-mount-root\s*\{[^}]*visibility:\s*hidden/, 'Content must not depend on intro JS');
  assert.ok(html.includes('page-arrival'), 'Route arrival animation');
  assert.ok(html.includes(route === '/' ? 'photo-drift' : 'photo-album'), 'Photo animation');
}
console.log('Visual smoke check passed: compact footer, visible content, photo and page arrival hooks.');
