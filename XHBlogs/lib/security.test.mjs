import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';
import { registerHooks } from 'node:module';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) specifier = pathToFileURL(join(root, specifier.slice(2))).href;
    if ((specifier.startsWith('.') || specifier.startsWith('file:')) && context.parentURL && !specifier.endsWith('.ts')) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(candidate)) return next(candidate.href, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(pathToFileURL(root).href) && url.endsWith('.ts') && !url.includes('/node_modules/')) {
      return { format: 'module', shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText };
    }
    return next(url, context);
  },
});

const { allowedThreads, validateThread, threadLabels, readComment, validatePage } = await import('../lib/comments-policy.ts');
const { authConfig, authConfigured } = await import('../lib/auth-config.ts');
const { githubSession } = await import('../lib/github-session.ts');
const { commentsBackend } = await import('../lib/comments-backend.ts');
const { GET, POST } = await import('../app/api/comments/route.ts');
const { POST: retiredProxy } = await import('../app/api/github/route.ts');
const { encode } = await import('next-auth/jwt');
const { neonConfig } = await import('@neondatabase/serverless');
neonConfig.fetchFunction = () => { throw new Error('Unexpected database access'); };
const originalFetch = globalThis.fetch;
const envKeys = ['AUTH_URL', 'AUTH_SECRET', 'AUTH_GITHUB_ID', 'AUTH_GITHUB_SECRET', 'DATABASE_URL'];
const originalEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
afterEach(() => {
  globalThis.fetch = originalFetch;
  neonConfig.fetchFunction = () => { throw new Error('Unexpected database access'); };
  for (const key of envKeys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});
function configure() {
  Object.assign(process.env, {
    AUTH_URL: 'https://blog.example', AUTH_SECRET: 'test-only-secret-'.repeat(4),
    AUTH_GITHUB_ID: 'test-id', AUTH_GITHUB_SECRET: 'test-secret',
    DATABASE_URL: 'postgresql://test:test@db.example.test/comments',
  });
}
async function cookie(login = 'reader', token = { githubId: '1', githubLogin: login, name: login }) {
  const name = '__Secure-authjs.session-token';
  const value = await encode({ token, secret: process.env.AUTH_SECRET, salt: name, maxAge: 3600 });
  return `${name}=${value}`;
}
function post(body, session = '', origin = 'https://blog.example') {
  return new Request('https://blog.example/api/comments', { method: 'POST', headers: {
    origin, cookie: session, 'content-type': 'application/json',
  }, body: JSON.stringify(body) });
}
function mockDatabase(handler = () => []) {
  const calls = [];
  neonConfig.fetchFunction = async (input, init) => {
    assert.equal(new URL(input).hostname, 'api.example.test');
    assert.equal(init.cache, 'no-store');
    const call = JSON.parse(init.body);
    calls.push(call);
    const rows = await handler(call);
    return Response.json({
      fields: ['id', 'body', 'github_login', 'created_at'].map(name => ({ name, dataTypeID: 25 })),
      rows: rows.map(row => [String(row.id), row.body, row.github_login, row.created_at]),
      rowCount: rows.length, command: 'SELECT',
    });
  };
  return calls;
}
const comment = { id: 12, body: 'Persisted', github_login: 'reader', created_at: '2026-09-17T12:00:00.000Z' };
const publicComment = { id: 12, body: 'Persisted', user: { login: 'reader' }, created_at: comment.created_at };

test('auth exposes only public profile, encrypts cookie and rejects tampering/bearer tokens', async () => {
  configure();
  assert.equal(authConfigured(), true);
  const token = authConfig.callbacks.jwt({ token: { email: 'private@example.test' }, account: { provider: 'github', access_token: 'secret-token' }, profile: { login: 'reader', id: 1, avatar_url: 'https://avatars.githubusercontent.com/u/1' } });
  const session = authConfig.callbacks.session({ session: { expires: 'later', user: { email: 'private' } }, token });
  assert.deepEqual(session, { expires: 'later', user: { name: 'reader', image: 'https://avatars.githubusercontent.com/u/1' } });
  assert.equal(JSON.stringify(session).includes('secret-token'), false);
  assert.equal(token.email, undefined);
  const encrypted = await cookie();
  assert.equal(encrypted.includes('github-test-token'), false);
  assert.deepEqual(await githubSession(post({}, encrypted)), { id: '1', login: 'reader' });
  assert.equal(JSON.stringify(token).includes('secret-token'), false);
  assert.equal(token.githubId, '1');
  assert.equal(token.githubLogin, 'reader');
  assert.equal(authConfig.callbacks.jwt({ token: { sub: '1', name: 'reader', accessToken: 'old' } }), null);
  assert.equal(await githubSession(post({}, await cookie('reader', { sub: '1', name: 'reader', accessToken: 'old' }))), null);
  assert.equal(authConfig.callbacks.jwt({ token: {}, account: { provider: 'github' }, profile: { login: 'reader' } }), null);
  assert.equal(authConfig.callbacks.jwt({ token: {}, account: { provider: 'github' }, profile: { id: 1, login: '../bad' } }), null);
  assert.equal(authConfig.callbacks.jwt({ token: { ...token, accessToken: 'old', email: 'private' } }).accessToken, undefined);
  assert.equal(await githubSession(post({}, `${encrypted}broken`)), null);
  assert.equal(await githubSession(new Request('https://blog.example', { headers: { authorization: `Bearer ${encrypted.split('=')[1]}` } })), null);
  assert.equal(authConfig.callbacks.redirect({ url: 'https://elsewhere.example', baseUrl: process.env.AUTH_URL }), process.env.AUTH_URL);
  assert.equal(authConfig.callbacks.redirect({ url: '/about', baseUrl: process.env.AUTH_URL }), 'https://blog.example/about');
  assert.deepEqual(authConfig.providers[0].options.checks, ['pkce', 'state']);
  assert.equal(authConfig.providers[0].options.authorization.params.scope, 'read:user');
});

test('whitelist accepts static boards without app sources and actual markdown, separates long IDs', () => {
  const directory = mkdtempSync(join(tmpdir(), 'xh-comments-'));
  try {
    for (const folder of ['posts/moments', 'chatters', 'moments']) mkdirSync(join(directory, folder), { recursive: true });
    for (const file of ['posts/hello.md', 'chatters/note.md', 'moments/one.md', 'posts/moments/two.md']) writeFileSync(join(directory, file), '');
    const threads = allowedThreads(directory);
    for (const thread of ['/about', '/posts/hello', '/chatter/note', '/moments/one', '/moments/two', 'workshop-2026-09']) assert.equal(validateThread(thread, threads), thread);
    for (const thread of ['/posts/[slug]', '/posts/missing', '../about', 'https://evil.example', 'workshop-2026-13']) assert.throws(() => validateThread(thread, threads));
    assert.equal(validateThread('/about/', threads), '/about');
    const a = threadLabels(`/posts/${'a'.repeat(70)}`);
    const b = threadLabels(`/posts/${'a'.repeat(69)}b`);
    assert.equal(a.legacy, b.legacy);
    assert.notEqual(a.primary, b.primary);
    assert.ok(a.primary.length < 50);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('payload is bounded before JSON parsing and only accepts expected fields', async () => {
  for (const body of [{ thread: '/', body: 'x'.repeat(2001) }, { thread: '/', body: ' ' }, { thread: '/', body: 'ok', url: 'https://evil.example' }]) await assert.rejects(readComment(post(body)), { status: 400 });
  await assert.rejects(readComment(post({ thread: '/', body: 'x'.repeat(17000) })), { status: 413 });
  await assert.rejects(readComment(new Request('https://blog.example', { method: 'POST', headers: { 'content-length': '999999' }, body: '{}' })), { status: 413 });
  assert.equal((await readComment(post({ thread: '/', body: 'x'.repeat(2000) }))).body.length, 2000);
  for (const page of ['0', '-1', '1x', '1.5', '100000']) assert.throws(() => validatePage(page));
});

test('routes fail closed without config/session, reject cross-origin and never proxy tokens', async () => {
  configure();
  globalThis.fetch = () => { throw new Error('Must not fetch'); };
  delete process.env.DATABASE_URL;
  assert.equal((await POST(post({ thread: '/', body: 'ok' }))).status, 503);
  assert.equal((await GET(new Request('https://blog.example/api/comments?thread=/'))).status, 503);
  configure();
  assert.equal((await POST(post({ thread: '/', body: 'ok' }, '', 'https://evil.example'))).status, 403);
  assert.equal((await POST(post({ thread: '/', body: 'ok' }))).status, 401);
  assert.equal((await POST(post({ thread: '/invented', body: 'ok' }))).status, 400);
  assert.equal(retiredProxy().status, 410);
});

test('public GET is SELECT-only, stably ordered and bounded with one lookahead row', async () => {
  configure();
  delete process.env.AUTH_SECRET;
  const calls = mockDatabase(() => Array.from({ length: 31 }, (_, index) => ({ ...comment, id: index + 1 })));
  await commentsBackend().read('/about', 2);
  calls.length = 0;
  const response = await GET(new Request('https://blog.example/api/comments?thread=/about&page=2'));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.comments.length, 30);
  assert.deepEqual(result.comments[11], publicComment);
  assert.equal(result.nextPage, 3);
  assert.equal(result.initialized, true);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(calls.length, 1);
  assert.match(calls[0].query, /^\s*SELECT/);
  assert.doesNotMatch(calls[0].query, /\b(INSERT|UPDATE|CREATE|DELETE|ALTER)\b/i);
  assert.match(calls[0].query, /ORDER BY created_at ASC, id ASC LIMIT 31 OFFSET \$2/);
  assert.deepEqual(calls[0].params, ['/about', '30']);
  assert.equal((await commentsBackend().read('/about', 99999)).nextPage, null);
  await assert.rejects(commentsBackend().read('/about', 100000), { status: 400 });
  mockDatabase();
  assert.deepEqual(await commentsBackend().read('/about', 1), { comments: [], initialized: true, nextPage: null });
  mockDatabase(() => Array(30).fill(comment));
  assert.equal((await commentsBackend().read('/about', 1)).nextPage, null);
});

test('any authenticated reader can post with parameterized identity and body in one atomic statement', async () => {
  configure();
  const calls = mockDatabase(() => [comment]);
  const body = "It's plain text; $1";
  const response = await POST(post({ thread: '/about', body }, await cookie()));
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), publicComment);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].params, ['1', '/about', body, 'reader']);
  assert.ok(!calls[0].query.includes(body));
  assert.match(calls[0].query, /WITH admitted AS/);
  assert.match(calls[0].query, /ON CONFLICT \(github_user_id\) DO UPDATE/);
  assert.match(calls[0].query, /SET last_posted_at = EXCLUDED.last_posted_at/);
  assert.match(calls[0].query, /WHERE comment_rate_limits.last_posted_at <= EXCLUDED.last_posted_at - INTERVAL '60 seconds'/);
  assert.match(calls[0].query, /SELECT \$2, \$3, github_user_id, \$4, last_posted_at FROM admitted/);
  assert.doesNotMatch(calls[0].query, /advisory|\bCREATE\b|github_login\) DO UPDATE/i);
});

test('database denial maps to 429; failures never expose database details', async () => {
  configure();
  const calls = mockDatabase();
  const response = await POST(post({ thread: '/', body: 'again' }, await cookie()));
  assert.equal(response.status, 429);
  assert.equal(calls.length, 1);
  mockDatabase(() => { throw new Error('postgresql://private-secret'); });
  for (const response of [await GET(new Request('https://blog.example/api/comments?thread=/')), await POST(post({ thread: '/', body: 'ok' }, await cookie()))]) {
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: 'Comments service unavailable' });
  }
});

test('trust boundaries reject malformed inputs before database access', async () => {
  configure();
  const session = await cookie();
  for (const body of [null, [], {}, { thread: '/', body: 1 }, { thread: '/', body: 'ok', githubId: '2' }]) {
    assert.equal((await POST(post(body, session))).status, 400);
  }
  for (const query of ['thread=/unknown', 'thread=%25', 'thread=/&page=100000', 'page=1']) {
    assert.equal((await GET(new Request(`https://blog.example/api/comments?${query}`))).status, 400);
  }
  const crossSite = post({ thread: '/', body: 'ok' }, session);
  crossSite.headers.set('sec-fetch-site', 'cross-site');
  assert.equal((await POST(crossSite)).status, 403);
  assert.equal((await POST(post({ thread: '/', body: 'ok' }, session, ''))).status, 403);
  for (const [headers, body, status] of [
    [{ 'content-type': 'text/plain' }, '{}', 415],
    [{ 'content-type': 'application/json' }, '{', 400],
    [{ 'content-length': '-1' }, '{}', 413],
  ]) await assert.rejects(readComment(new Request('https://blog.example', { method: 'POST', headers, body })), { status });
  assert.equal((await POST(post({ thread: '/', body: 'ok' }, await cookie('reader', { name: 'reader', sub: '1' })))).status, 401);
  delete process.env.AUTH_GITHUB_ID;
  assert.equal((await POST(post({ thread: '/', body: 'ok' }, session))).status, 503);
});

test('PostgreSQL engine executes migration, rate gate and atomic rollback', { skip: !process.env.PGLITE_MODULE }, async () => {
  const { PGlite } = await import(process.env.PGLITE_MODULE);
  const db = new PGlite();
  configure();
  try {
    const migration = readFileSync(new URL('./comments-migration.sql', import.meta.url), 'utf8');
    await db.exec(migration);
    await db.exec(migration);
    mockDatabase(async ({ query, params }) => (await db.query(query, params)).rows);
    const identity = { id: '1', login: 'reader' };
    const attempts = await Promise.allSettled(Array.from({ length: 10 }, () => commentsBackend().post('/about', 'ok', identity)));
    assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
    assert.ok(attempts.filter(result => result.status === 'rejected').every(result => result.reason.status === 429));
    await assert.rejects(commentsBackend().post('/', 'ok', { ...identity, login: 'renamed' }), { status: 429 });
    await commentsBackend().post('/', 'ok', { id: '2', login: 'reader' });
    await db.exec("UPDATE comment_rate_limits SET last_posted_at = statement_timestamp() - INTERVAL '59 seconds' WHERE github_user_id = '1'");
    await assert.rejects(commentsBackend().post('/', 'ok', identity), { status: 429 });
    await db.exec("UPDATE comment_rate_limits SET last_posted_at = statement_timestamp() - INTERVAL '60 seconds' WHERE github_user_id = '1'");
    await commentsBackend().post('/', 'ok', identity);
    await assert.rejects(commentsBackend().post('/', '', { id: '3', login: 'reader' }));
    assert.equal((await db.query("SELECT * FROM comment_rate_limits WHERE github_user_id = '3'")).rows.length, 0);
    await commentsBackend().post('/', 'ok', { id: '3', login: 'reader' });
    await db.exec("UPDATE comment_rate_limits SET last_posted_at = statement_timestamp() - INTERVAL '61 seconds' WHERE github_user_id = '1'");
    const before = (await db.query("SELECT last_posted_at FROM comment_rate_limits WHERE github_user_id = '1'")).rows;
    await assert.rejects(commentsBackend().post('/', '', identity));
    assert.deepEqual((await db.query("SELECT last_posted_at FROM comment_rate_limits WHERE github_user_id = '1'")).rows, before);
    await commentsBackend().post('/', 'ok', identity);
    assert.equal((await commentsBackend().read('/about', 1)).comments.length, 1);
  } finally {
    await db.close();
  }
});

test('migration provides safe IDs, persistent per-user gate and pagination index', () => {
  const migration = readFileSync(new URL('./comments-migration.sql', import.meta.url), 'utf8');
  assert.match(migration, /GENERATED ALWAYS AS IDENTITY \(MAXVALUE 9007199254740991\)/);
  assert.match(migration, /comments \(thread, created_at, id\)/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS comment_rate_limits/);
  assert.match(migration, /github_user_id text PRIMARY KEY/);
});
