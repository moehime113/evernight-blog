import type { NextRequest } from 'next/server';
import { handlers } from '@/auth';
import { authConfigured } from '@/lib/auth-config';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!authConfigured()) return Response.json({ error: 'GitHub login is not configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  if (!authConfigured()) return Response.json({ error: 'GitHub login is not configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  return handlers.POST(request);
}
