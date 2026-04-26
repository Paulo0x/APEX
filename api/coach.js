/**
 * APEX — Proxy Claude API (Vercel Edge Function)
 * La clé ANTHROPIC_API_KEY est dans les env vars Vercel
 */
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // Vérifier que la clé est bien présente côté serveur
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY manquante dans les variables Vercel' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { system, messages, max_tokens = 1500 } = await req.json();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens,
      system,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    return new Response(errText, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
