export async function onRequestGet() {
  return Response.json({
    ok: true,
    service: 'nonfictionfooty',
    timestamp: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
