export function POST() {
  return Response.json({ error: 'Token proxy retired. Use GitHub site login.' }, { status: 410, headers: { 'Cache-Control': 'no-store' } });
}
