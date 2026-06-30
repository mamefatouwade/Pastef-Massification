/* ============================================
   PASTEF — Authentification & Rôles
   ============================================ */

(function () {
  'use strict';

  const PASTEF = window.PASTEF || (window.PASTEF = {});

  /**
   * Récupère la session courante.
   * @returns {Promise<{user, session, role} | null>}
   */
  async function getCurrentSession() {
    if (!PASTEF.supabase) return null;

    try {
      const { data: { session } } = await PASTEF.supabase.auth.getSession();
      if (!session?.user) return null;

      // Récupère le rôle depuis coordinator_accounts (si la table existe)
      // Sinon fallback : si email = admin principal, role = 'admin'
      let role = 'admin'; // par défaut pour la phase actuelle
      let coordinator = null;

      try {
        const { data, error } = await PASTEF.supabase
          .from('coordinator_accounts')
          .select('*, cellule:cellule_id(*)')
          .eq('id', session.user.id)
          .eq('active', true)
          .maybeSingle();

        if (!error && data) {
          role = data.role;
          coordinator = data;
        }
      } catch (e) {
        // Table pas encore créée — on garde admin par défaut
      }

      return { user: session.user, session, role, coordinator };
    } catch (e) {
      console.error('[PASTEF Auth] getCurrentSession error:', e);
      return null;
    }
  }

  /**
   * Connecte un utilisateur avec email/mot de passe.
   */
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

  /**
   * Déconnecte l'utilisateur courant.
   */
  async function signOut() {
    if (!PASTEF.supabase) return;
    await PASTEF.supabase.auth.signOut();
    sessionStorage.clear();
  }

  /**
   * Protège une page : redirige vers admin.html si non connecté
   * ou si le rôle n'est pas autorisé.
   */
  async function requireAuth(allowedRoles = null) {
    const session = await getCurrentSession();

    if (!session) {
      window.location.href = resolveAdminPath();
      return null;
    }

    if (allowedRoles && !allowedRoles.includes(session.role)) {
      // Rôle non autorisé → redirige vers son dashboard
      window.location.href = getDashboardPath(session.role);
      return null;
    }

    return session;
  }

  /**
   * Retourne le chemin du dashboard selon le rôle.
   */
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

  /**
   * Détermine la racine du site (utile pour GitHub Pages avec sous-dossier).
   */
  function getBasePath() {
    const path = window.location.pathname;
    const idx = path.indexOf('/dashboards/');
    if (idx !== -1) return path.substring(0, idx + 1);
    // Sinon, on suppose qu'on est à la racine ou sur admin.html
    const lastSlash = path.lastIndexOf('/');
    return path.substring(0, lastSlash + 1);
  }

  /**
   * Chemin vers admin.html (page login).
   */
  function resolveAdminPath() {
    return `${getBasePath()}admin.html`;
  }

  /**
   * Libellé humain du rôle.
   */
  function getRoleLabel(role) {
    const labels = {
      admin: 'Admin Principal',
      departemental: 'Coord. Départemental',
      communal: 'Coord. Communal',
      diaspora: 'Coord. Diaspora',
    };
    return labels[role] || role;
  }

  // Expose
  PASTEF.auth = {
    getCurrentSession,
    signIn,
    signOut,
    requireAuth,
    getDashboardPath,
    getBasePath,
    resolveAdminPath,
    getRoleLabel,
  };
})();
