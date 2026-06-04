// functions/api/relay.js
// Endpoint: POST /api/relay
// Body: { "relay": 1, "state": "on" }
// Diakses oleh: Web (ubah state relay)

export async function onRequestPost(context) {
  const { request, env } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const body = await request.json();
    const { relay, state } = body;

    // Validasi input
    if (!relay || relay < 1 || relay > 8) {
      return new Response(JSON.stringify({ ok: false, error: 'Relay harus antara 1-8' }), { status: 400, headers });
    }

    if (state !== 'on' && state !== 'off') {
      return new Response(JSON.stringify({ ok: false, error: 'State harus "on" atau "off"' }), { status: 400, headers });
    }

    // Simpan ke KV
    await env.RELAY_STATE.put(`relay_${relay}`, state);

    return new Response(JSON.stringify({ ok: true, relay, state }), { status: 200, headers });

  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'Request tidak valid' }), { status: 400, headers });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
