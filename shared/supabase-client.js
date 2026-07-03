/* ============================================
   PASTEF — Client Supabase partagé
   Doit être chargé APRÈS supabase-js et supabase-config.js
   ============================================ */

(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('[PASTEF] supabase-js non chargé — ajoutez le CDN dans index.html');
    return;
  }

  if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url) {
    console.error('[PASTEF] SUPABASE_CONFIG manquant');
    return;
  }

  const { url, anonKey } = window.SUPABASE_CONFIG;

  const client = window.supabase.createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public',
    },
  });

  // ─── Helper : requête sur le schema ref ───
  // Supabase JS client ne supporte pas schema: 'ref' directement.
  // On utilise l'API REST pour les tables ref.*
  async function fetchRef(table, params) {
    const query = new URLSearchParams(params || {});
    query.set('select', params?.select || '*');
    if (params?.order) query.set('order', params.order);
    if (params?.filter) {
      Object.entries(params.filter).forEach(([k, v]) => query.set(k, v));
    }

    const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`fetchRef(${table}) ${res.status}: ${txt}`);
    }

    return res.json();
  }

  // Exposition
  window.PASTEF = window.PASTEF || {};
  window.PASTEF.supabase = client;
  window.PASTEF.fetchRef = fetchRef;

  console.log('✓ [PASTEF] Supabase client initialisé');
})();