/* ============================================
   PASTEF — Client Supabase partagé
   Doit être chargé APRÈS supabase-js et supabase-config.js
   ============================================ */

(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('[PASTEF] supabase-js non chargé — vérifie le CDN dans index.html');
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

  /* ─────────────────────────────────────────────
     Parseur de filtres PostgREST → client JS
     ─────────────────────────────────────────────
     Convertit { col: 'eq.true' } / { col: 'is.null' } / etc.
     en appels chainés .eq() / .is() / .in() / ...
  */
  function coerce(raw) {
    if (raw === 'true')  return true;
    if (raw === 'false') return false;
    if (raw === 'null')  return null;
    return raw;
  }

  function applyFilter(query, col, expr) {
    // Si la valeur n'est pas une string ou n'a pas de '.', égalité directe
    if (typeof expr !== 'string' || !expr.includes('.')) {
      return query.eq(col, expr);
    }
    const dotIdx = expr.indexOf('.');
    const op  = expr.slice(0, dotIdx);
    const val = coerce(expr.slice(dotIdx + 1));

    switch (op) {
      case 'eq':    return query.eq(col, val);
      case 'neq':   return query.neq(col, val);
      case 'gt':    return query.gt(col, val);
      case 'gte':   return query.gte(col, val);
      case 'lt':    return query.lt(col, val);
      case 'lte':   return query.lte(col, val);
      case 'is':    return query.is(col, val);            // null, true, false
      case 'like':  return query.like(col, val);
      case 'ilike': return query.ilike(col, val);
      case 'in':    return query.in(col, String(val).split(','));
      default:      return query.eq(col, expr);           // fallback tolérant
    }
  }

  /* ─────────────────────────────────────────────
     fetchRef — requête générique sur ref.* ou public.*
     ─────────────────────────────────────────────
     tableName : 'ref.sexes', 'ref.pays', 'cellules', 'patriotes', ...
     options   : { select, filter, order, limit }
       - select : string PostgREST (defaults '*')
       - filter : { col: 'eq.value', col2: 'is.null', ... }
       - order  : 'col.asc'  ou  'col1.desc,col2.asc'
       - limit  : number
  */
  async function fetchRef(tableName, options = {}) {
    // 1. Résoudre schéma + nom de table
    let schema = 'public';
    let table  = tableName;
    if (tableName.includes('.')) {
      const idx = tableName.indexOf('.');
      schema = tableName.slice(0, idx);
      table  = tableName.slice(idx + 1);
    }

    // 2. Construire la requête (schema public par défaut, sinon .schema())
    let query = (schema === 'public')
      ? client.from(table)
      : client.schema(schema).from(table);

    query = query.select(options.select || '*');

    // 3. Filtres — un appel par entrée
    if (options.filter && typeof options.filter === 'object') {
      for (const [col, expr] of Object.entries(options.filter)) {
        query = applyFilter(query, col, expr);
      }
    }

    // 4. Tri — supporte le multi-colonnes 'a.asc,b.desc'
    if (options.order) {
      const parts = options.order.split(',');
      for (const p of parts) {
        const trimmed = p.trim();
        if (!trimmed) continue;
        const dotIdx = trimmed.lastIndexOf('.');
        const col = dotIdx === -1 ? trimmed : trimmed.slice(0, dotIdx);
        const dir = dotIdx === -1 ? 'asc'   : trimmed.slice(dotIdx + 1);
        query = query.order(col, { ascending: dir !== 'desc' });
      }
    }

    // 5. Limite
    if (options.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) {
      console.error(`[PASTEF.fetchRef] ${schema}.${table} :`, error.message || error);
      throw error;
    }
    return data || [];
  }

  // ─── Exposition ───
  window.PASTEF = window.PASTEF || {};
  window.PASTEF.supabase = client;
  window.PASTEF.fetchRef = fetchRef;

  console.log('✓ [PASTEF] Supabase client initialisé');
})();