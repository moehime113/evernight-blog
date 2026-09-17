import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import ts from 'typescript';
import { neon } from '@neondatabase/serverless';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(candidate)) return next(candidate.href, context);
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.ts') && !url.includes('/node_modules/')) {
      return { format: 'module', shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText };
    }
    return next(url, context);
  },
});

const thread = `/__database_check/${randomUUID()}`;
const identity = { id: `9${BigInt(`0x${randomUUID().replaceAll('-', '').slice(0, 15)}`)}`, login: 'database-check' };
let sql;
try {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required');
  sql = neon(process.env.DATABASE_URL);
  const { commentsBackend } = await import('./comments-backend.ts');
  const existing = await sql`SELECT github_user_id FROM comment_rate_limits WHERE github_user_id = ${identity.id}`;
  assert.equal(existing.length, 0);
  const attempts = await Promise.allSettled(Array.from({ length: 3 }, () => commentsBackend().post(thread, 'Temporary database verification', identity)));
  assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
  assert.ok(attempts.filter(result => result.status === 'rejected').every(result => result.reason.status === 429));
  const saved = await commentsBackend().read(thread, 1);
  assert.equal(saved.comments.length, 1);
  assert.equal(saved.comments[0].user.login, identity.login);
  assert.equal(saved.comments[0].body, 'Temporary database verification');
  console.log('Neon check passed: persisted read/write and concurrent rate limiting.');
} catch {
  console.error('Neon check failed; database credentials are not displayed.');
  process.exitCode = 1;
} finally {
  if (sql) {
    try {
      await sql.transaction([
        sql`DELETE FROM comments WHERE thread = ${thread} AND github_user_id = ${identity.id}`,
        sql`DELETE FROM comment_rate_limits WHERE github_user_id = ${identity.id}`,
      ]);
      console.log('Temporary database verification rows removed.');
    } catch {
      console.error(`Cleanup failed for database-check thread ${thread}; remove only its test rows manually.`);
      process.exitCode = 1;
    }
  }
}
