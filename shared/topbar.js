/* ============================================
   PASTEF — Topbar Generator
   ============================================ */

(function () {
  'use strict';

  const PASTEF = window.PASTEF || (window.PASTEF = {});

  /**
   * Renders the top bar.
   * @param {Object} options - { session, title, breadcrumb }
   */
  function render({ session, title = '', breadcrumb = '' }) {
    const topbar = document.getElementById('topbar');
    if (!topbar) return;

    const user = session?.user;
    const role = PASTEF.auth.getRoleLabel(session?.role || 'admin');
    const name = user?.email || 'Utilisateur';
    const initial = (name.charAt(0) || '?').toUpperCase();

    const dateStr = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    topbar.innerHTML = `
      <div class="topbar-left">
        <button class="topbar-toggle" onclick="PASTEF.sidebar.toggle()" aria-label="Menu">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div>
          <div class="topbar-title">${PASTEF.utils.escapeHtml(title)}</div>
          ${breadcrumb ? `<div class="topbar-breadcrumb">${PASTEF.utils.escapeHtml(breadcrumb)}</div>` : ''}
        </div>
      </div>

      <div class="topbar-right">
        <span class="topbar-date">${dateStr}</span>
        <div class="topbar-user" onclick="PASTEF.topbar.openMenu()">
          <div class="topbar-user-info">
            <div class="topbar-user-name">${PASTEF.utils.escapeHtml(name)}</div>
            <div class="topbar-user-role">${role}</div>
          </div>
          <div class="topbar-avatar">${initial}</div>
        </div>
      </div>
    `;
  }

  function openMenu() {
    // Pour V1 simple : juste déconnexion
    if (confirm('Voulez-vous vous déconnecter ?')) {
      PASTEF.sidebar.logout();
    }
  }

  PASTEF.topbar = { render, openMenu };
})();
