/* 考公补给站 — Cloudflare Worker: SRS data sync
   Deploy to: shanganbujizhan.top/sync
   Requires KV namespace: SRS_KV
*/
export default {
  async fetch(request, env) {
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
    const uid = url.searchParams.get('uid');

    if (!uid || uid.length < 5 || uid.length > 64) {
      return new Response(JSON.stringify({ error: 'invalid uid' }), { status: 400, headers });
    }

    // GET: retrieve synced data
    if (request.method === 'GET') {
      try {
        const raw = await env.SRS_KV.get(uid);
        const data = raw ? JSON.parse(raw) : null;
        return new Response(JSON.stringify(data || {}), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'kv read error' }), { status: 500, headers });
      }
    }

    // POST: push synced data
    if (request.method === 'POST') {
      try {
        const body = await request.json();

        // Basic validation
        if (!body || typeof body !== 'object') {
          return new Response(JSON.stringify({ error: 'invalid body' }), { status: 400, headers });
        }

        // Size limit: 1MB
        const json = JSON.stringify(body);
        if (json.length > 1024 * 1024) {
          return new Response(JSON.stringify({ error: 'payload too large' }), { status: 413, headers });
        }

        // Stamp update time
        body.serverUpdatedAt = Date.now();

        await env.SRS_KV.put(uid, JSON.stringify(body));
        return new Response(JSON.stringify({ ok: true }), { headers });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'kv write error' }), { status: 500, headers });
      }
    }

    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers });
  },
};
