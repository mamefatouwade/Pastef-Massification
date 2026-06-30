/* ============================================
   PASTEF — Client Supabase partagé
   Doit être chargé APRÈS supabase-js et supabase-config.js
   ============================================ */

(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  // Vérifications
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('[PASTEF] supabase-js non chargé');
    return;
  }

  if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url) {
    console.error('[PASTEF] SUPABASE_CONFIG manquant');
    return;
  }

  const { url, anonKey } = window.SUPABASE_CONFIG;

  // Création du client unique
  const client = window.supabase.createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  // Exposition
  window.PASTEF = window.PASTEF || {};
  window.PASTEF.supabase = client;
  window.PASTEF.TABLE = window.SUPABASE_CONFIG.table || 'enrolments';
  window.PASTEF.AUDIO_BUCKET = window.SUPABASE_CONFIG.audioBucket || 'enrolments-audio';

  console.log('✓ [PASTEF] Supabase client initialisé');
})();
