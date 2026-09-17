import { readdirSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export class CommentsError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function allowedThreads(root = process.cwd()) {
  const threads = new Set<string>(['/', '/about', '/friends', '/music']);
  function entries(directory: string) {
    try {
      return readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }
  for (const [directory, prefix] of [
    [path.join(root, 'posts'), '/posts'],
    [path.join(root, 'chatters'), '/chatter'],
    [path.join(root, 'moments'), '/moments'],
    [path.join(root, 'posts', 'moments'), '/moments'],
  ]) {
    for (const entry of entries(directory)) {
      if (entry.isFile() && entry.name.endsWith('.md')) threads.add(`${prefix}/${entry.name.slice(0, -3)}`);
    }
  }
  return threads;
}

export function validateThread(value: unknown, threads: Set<string>) {
  if (typeof value !== 'string' || !value || value.length > 1024) throw new CommentsError(400, 'Invalid thread');
  const thread = value.replace(/\/$/, '') || '/';
  let decoded: string;
  try {
    decoded = decodeURIComponent(thread);
  } catch {
    throw new CommentsError(400, 'Invalid thread');
  }
  if (!threads.has(thread) && !threads.has(decoded) && !/^workshop-\d{4}-(0[1-9]|1[0-2])$/.test(thread)) {
    throw new CommentsError(400, 'Unknown thread');
  }
  return thread;
}

export function threadLabels(thread: string) {
  const legacy = thread.substring(0, 49);
  const primary = thread.length > 49 ? `xh-${createHash('sha256').update(thread).digest('hex').slice(0, 40)}` : legacy;
  return { legacy, primary };
}

export function validateOrigin(request: Request) {
  let origin: string;
  try {
    origin = new URL(process.env.AUTH_URL || '').origin;
  } catch {
    throw new CommentsError(503, 'GitHub login is not configured');
  }
  if (request.headers.get('origin') !== origin ||
    (request.headers.has('sec-fetch-site') && request.headers.get('sec-fetch-site') !== 'same-origin')) {
    throw new CommentsError(403, 'Same-origin request required');
  }
}

export async function readComment(request: Request) {
  const limit = 16384;
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > limit)) throw new CommentsError(413, 'Request body too large');
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new CommentsError(415, 'JSON body required');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new CommentsError(400, 'Body required');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        void reader.cancel().catch(() => {});
        throw new CommentsError(413, 'Request body too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  let data;
  try {
    data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new CommentsError(400, 'Invalid JSON');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
    Object.keys(data).some(key => !['thread', 'body'].includes(key)) ||
    typeof data.thread !== 'string' || typeof data.body !== 'string' ||
    !data.body.trim() || data.body.length > 2000) {
    throw new CommentsError(400, 'Expected thread and nonempty body of at most 2000 characters');
  }
  return { thread: data.thread as string, body: data.body.trim() as string };
}

export function validatePage(value: string | null) {
  if (value === null) return 1;
  if (!/^[1-9]\d{0,4}$/.test(value)) throw new CommentsError(400, 'Invalid page');
  return Number(value);
}
