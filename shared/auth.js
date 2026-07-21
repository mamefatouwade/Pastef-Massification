/* ============================================
   PASTEF — Authentification & Rôles (v2)
   Adapté au schéma normalisé
   ============================================ */

(function () {
  'use strict';

  const PASTEF = window.PASTEF || (window.PASTEF = {});

  // Mapping codes DB → codes frontend (utilisés pour le routing)
  const ROLE_CODE_MAP = {
    'ADMIN_PRINCIPAL': 'admin',
    'DEPARTEMENTAL':   'departemental',
    'COMMUNAL':        'communal',
    'DIASPORA':        'diaspora',
  };

  // Mapping inverse : frontend → DB
  const ROLE_CODE_MAP_REVERSE = {
    'admin':          'ADMIN_PRINCIPAL',
    'departemental':  'DEPARTEMENTAL',
    'communal':       'COMMUNAL',
    'diaspora':       'DIASPORA',
  };

  async function getCurrentSession() {
    if (!PASTEF.supabase) return null;

    try {
      const { data: { session } } = await PASTEF.supabase.auth.getSession();
      if (!session?.user) return null;

      let role = null;
      let coordinator = null;

      try {
        const { data, error } = await PASTEF.supabase
          .from('coordinateurs')
          .select('id, auth_user_id, prenom, nom, email, telephone, statut, role_id, region_id, departement_id, commune_id, pays_id, ville_id')
          .eq('auth_user_id', session.user.id)
          .eq('statut', 'ACTIF')
          .maybeSingle();

        if (!error && data) {
          coordinator = data;

          // Résoudre le rôle depuis le UUID role_id
          const ROLE_UUID_MAP = {
            'fec76acc-f42a-4def-ab2f-b09aefbfcb60': 'admin',
            'd9da9308-ec62-4301-a1c2-284ebd4c6fd2': 'departemental',
            'c149d628-6e4f-41ab-b097-19f25603f2ed': 'communal',
            '5d2109e3-f559-489a-aeba-68184f0d745e': 'diaspora',
          };
          role = ROLE_UUID_MAP[data.role_id] || null;
        } else if (error) {
          console.warn('[PASTEF Auth] Lookup coord error:', error.message);
        }
      } catch (e) {
        console.warn('[PASTEF Auth] Exception lookup:', e.message);
      }

      // Si aucun coordinateur trouvé mais session valide → admin par défaut (fallback initial setup)
      if (!role) role = 'admin';

      return { user: session.user, session, role, coordinator };
    } catch (e) {
      console.error('[PASTEF Auth] getCurrentSession error:', e);
      return null;
    }
  }

  async function signIn(email, password) {
    if (!PASTEF.supabase) throw new Error('Supabase non disponible');
    const { data, error } = await PASTEF.supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      if (error.message?.includes('Invalid login')) {
        throw new Error('Email ou mot de passe incorrect');
      }
      throw error;
    }
    return data;
  }

  async function signOut() {
    if (!PASTEF.supabase) return;
    await PASTEF.supabase.auth.signOut();
    sessionStorage.clear();
  }

  async function requireAuth(allowedRoles = null) {
    const session = await getCurrentSession();
    if (!session) {
      window.location.href = resolveAdminPath();
      return null;
    }
    if (allowedRoles && !allowedRoles.includes(session.role)) {
      window.location.href = getDashboardPath(session.role);
      return null;
    }
    return session;
  }

  function getDashboardPath(role) {
    const base = getBasePath();
    const map = {
      admin: `${base}dashboards/admin/dashboard.html`,
      departemental: `${base}dashboards/departemental/dashboard.html`,
      communal: `${base}dashboards/communal/dashboard.html`,
      diaspora: `${base}dashboards/diaspora/dashboard.html`,
    };
    return map[role] || map.admin;
  }

  function getBasePath() {
    const path = window.location.pathname;
    const idx = path.indexOf('/dashboards/');
    if (idx !== -1) return path.substring(0, idx + 1);
    const lastSlash = path.lastIndexOf('/');
    return path.substring(0, lastSlash + 1);
  }

  function resolveAdminPath() {
    return `${getBasePath()}admin.html`;
  }

  function getRoleLabel(role) {
    const labels = {
      admin: 'Admin Principal',
      departemental: 'Coord. Départemental',
      communal: 'Coord. Communal',
      diaspora: 'Coord. Diaspora',
    };
    return labels[role] || role;
  }

  function getRoleIdByCode(code) {
    // Utilisé au moment de créer un coordinateur : convertit 'communal' → UUID
    // Cache local rempli par PASTEF_DATA (à condition qu'il ait chargé roles_coordinateur)
    const roles = window.PASTEF_DATA?.getRolesCoordinateur?.() || [];
    const dbCode = ROLE_CODE_MAP_REVERSE[code] || code.toUpperCase();
    const found = roles.find(r => r.code === dbCode);
    return found ? found.id : null;
  }

  PASTEF.auth = {
    getCurrentSession,
    signIn,
    signOut,
    requireAuth,
    getDashboardPath,
    getBasePath,
    resolveAdminPath,
    getRoleLabel,
    getRoleIdByCode,
    ROLE_CODE_MAP,
    ROLE_CODE_MAP_REVERSE,
  };
})();