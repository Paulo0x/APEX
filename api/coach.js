/**
 * APEX — Proxy Claude API (Vercel Edge Function)
 * 
 * Pourquoi ce fichier existe :
 * - La clé API Anthropic ne peut pas être dans le HTML (visible par tout le monde)
 * - Ce fichier tourne sur les serveurs Vercel, côté serveur, invisible
 * - Il reçoit les messages du client, ajoute la clé API secrète, et transmet à Claude
 * 
 * Configuration requise dans Vercel :
 * → Settings → Environment Variables → ajouter ANTHROPIC_API_KEY = sk-ant-...
 */
export const config = { runtime: 'edge' };

export default async function handler(req) {
  // Autoriser seulement les requêtes POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), { status: 405 });
  }

  // Récupérer les données envoyées par le client (messages, system prompt, etc.)
  const { system, messages, max_tokens = 1500 } = await req.json();

  // Appel à l'API Claude avec la clé secrète côté serveur
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,   // clé secrète dans les env vars Vercel
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'messages-2023-12-15',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',                    // modèle Claude le plus capable
      max_tokens,
      system,
      messages,
      stream: true,                                   // streaming pour réponse en temps réel
    }),
  });

  // Si Claude renvoie une erreur, la transmettre au client
  if (!response.ok) {
    const err = await response.text();
    return new Response(JSON.stringify({ error: err }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Streamer la réponse de Claude directement vers le client
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
