// functions/api/state.js
// Endpoint: GET /api/state
// Response: { "relay_1": "on", "relay_2": "off", ... }
// Diakses oleh: ESP32 (baca semua state relay)

export async function onRequestGet(context) {
  const { env } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  };

  try {
    // Baca semua relay dari KV secara paralel (lebih cepat)
    const keys = [1, 2, 3, 4, 5, 6, 7, 8];
    const values = await Promise.all(
      keys.map(i => env.RELAY_STATE.get(`relay_${i}`))
    );

    const result = {};
    keys.forEach((i, idx) => {
      result[`relay_${i}`] = values[idx] || 'off'; // default off jika belum pernah di-set
    });

    return new Response(JSON.stringify(result), { status: 200, headers });

  } catch (e) {
    return new Response(JSON.stringify({ error: 'Gagal membaca state' }), { status: 500, headers });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
