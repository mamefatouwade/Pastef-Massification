/* ============================================
   PASTEF — Sidebar Generator
   Génère la sidebar selon le rôle, gère navigation SPA
   ============================================ */

(function () {
  'use strict';

  const PASTEF = window.PASTEF || (window.PASTEF = {});

  /* --- ICÔNES SVG --- */
  const I = {
    dashboard: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="4" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/></svg>',
    users: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    sections: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7"/><path d="M3 7l9-4 9 4"/><path d="M9 22V12h6v10"/></svg>',
    activity: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    map: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>',
    chart: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    crown: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M2 20l3-12 6 6 6-10 5 16z"/></svg>',
    report: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    doc: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
    book: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    phone: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    bell: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    history: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><polyline points="12 7 12 12 15 14"/></svg>',
    mic: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>',
    cell: '<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    arrow: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>',
    logout: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
  };

  /* --- DÉFINITION DES MENUS PAR RÔLE --- */
  const MENUS = {
    admin: [
      { section: 'Vue d\'ensemble' },
      { id: 'dashboard', label: 'Tableau de bord', icon: I.dashboard, page: 'dashboard' },
      { id: 'inscriptions', label: 'Inscriptions', icon: I.users, page: 'inscriptions' },
      {
        id: 'sections', label: 'Sections', icon: I.sections, type: 'group',
        children: [
          { id: 'sec-communales', label: 'Communales', page: 'sections-communales' },
          { id: 'sec-departementales', label: 'Départementales', page: 'sections-departementales' },
          { id: 'sec-diaspora', label: 'Diaspora', page: 'sections-diaspora' },
        ],
      },
      { id: 'activites', label: 'Activités', icon: I.activity, page: 'activites' },
      { id: 'carte', label: 'Carte mondiale', icon: I.map, page: 'carte' },
      { id: 'statistiques', label: 'Statistiques', icon: I.chart, page: 'statistiques' },

      { section: 'Gestion' },
      { id: 'coordinateurs', label: 'Coordinateurs', icon: I.crown, page: 'coordinateurs' },
      { id: 'rapports', label: 'Rapports reçus', icon: I.report, page: 'rapports' },
      { id: 'documents', label: 'Documents', icon: I.doc, page: 'documents' },
      { id: 'annuaire', label: 'Annuaire', icon: I.phone, page: 'annuaire' },
      { id: 'alertes', label: 'Alertes', icon: I.bell, page: 'alertes' },
      { id: 'historique', label: 'Mon historique', icon: I.history, page: 'historique' },
    ],

    departemental: [
      { section: 'Mon département' },
      { id: 'dashboard', label: 'Tableau de bord', icon: I.dashboard, page: 'dashboard' },
      { id: 'sections-communales', label: 'Mes sections communales', icon: I.sections, page: 'sections-communales' },
      { id: 'patriotes', label: 'Mes patriotes', icon: I.users, page: 'patriotes' },
      { id: 'activites', label: 'Activités', icon: I.activity, page: 'activites' },
      { id: 'statistiques', label: 'Statistiques', icon: I.chart, page: 'statistiques' },

      { section: 'Gestion' },
      { id: 'coordinateurs', label: 'Coordinateurs communaux', icon: I.crown, page: 'coordinateurs' },
      { id: 'rapport', label: 'Mon rapport mensuel', icon: I.report, page: 'rapport' },
      { id: 'documents', label: 'Documents', icon: I.doc, page: 'documents' },
      { id: 'annuaire', label: 'Annuaire', icon: I.phone, page: 'annuaire' },
      { id: 'historique', label: 'Mon historique', icon: I.history, page: 'historique' },
    ],

    communal: [
      { section: 'Ma commune' },
      { id: 'dashboard', label: 'Tableau de bord', icon: I.dashboard, page: 'dashboard' },
      { id: 'cellules', label: 'Mes cellules de base', icon: I.cell, page: 'cellules' },
      { id: 'patriotes', label: 'Mes patriotes', icon: I.users, page: 'patriotes' },
      { id: 'activites', label: 'Activités', icon: I.activity, page: 'activites' },
      { id: 'audios', label: 'Audios', icon: I.mic, page: 'audios' },
      { id: 'statistiques', label: 'Statistiques', icon: I.chart, page: 'statistiques' },

      { section: 'Communication' },
      { id: 'rapport', label: 'Mon rapport mensuel', icon: I.report, page: 'rapport' },
      { id: 'documents', label: 'Documents', icon: I.doc, page: 'documents' },
      { id: 'annuaire', label: 'Annuaire', icon: I.phone, page: 'annuaire' },
      { id: 'historique', label: 'Mon historique', icon: I.history, page: 'historique' },
    ],

    diaspora: [
      { section: 'Ma cellule diaspora' },
      { id: 'dashboard', label: 'Tableau de bord', icon: I.dashboard, page: 'dashboard' },
      { id: 'patriotes', label: 'Mes patriotes', icon: I.users, page: 'patriotes' },
      { id: 'activites', label: 'Activités', icon: I.activity, page: 'activites' },
      { id: 'audios', label: 'Audios', icon: I.mic, page: 'audios' },
      { id: 'statistiques', label: 'Statistiques', icon: I.chart, page: 'statistiques' },

      { section: 'Communication' },
      { id: 'rapport', label: 'Mon rapport mensuel', icon: I.report, page: 'rapport' },
      { id: 'documents', label: 'Documents', icon: I.doc, page: 'documents' },
      { id: 'annuaire', label: 'Annuaire', icon: I.phone, page: 'annuaire' },
      { id: 'historique', label: 'Mon historique', icon: I.history, page: 'historique' },
    ],
  };

  /**
   * Renders sidebar for a given role.
   * @param {Object} session - { user, role, coordinator }
   * @param {string} currentPage - id of active page
   */
  function render(session, currentPage) {
    const { role } = session;
    const menu = MENUS[role] || MENUS.admin;
    const base = PASTEF.auth.getBasePath();
    const roleDir = role === 'admin' ? 'admin' : role;
    const pagePrefix = `${base}dashboards/${roleDir}/`;

    let html = `
      <div class="sidebar-brand" onclick="PASTEF.sidebar.toggle()">
        <div class="sidebar-logo">
          <img src="${base}assets/logo.jpg" alt="PASTEF" />
        </div>
        <div class="sidebar-brand-text">
          <div class="sidebar-brand-name">PASTEF</div>
          <div class="sidebar-brand-sub">Patriotes du Sénégal</div>
        </div>
      </div>

      <div class="sidebar-role">${PASTEF.auth.getRoleLabel(role)}</div>

      <nav class="sidebar-nav">
    `;

    menu.forEach((item) => {
      if (item.section) {
        html += `<div class="nav-section-title">${item.section}</div>`;
        return;
      }

      if (item.type === 'group') {
        const isOpen = item.children.some((c) => c.id === currentPage);
        html += `
          <div class="nav-group ${isOpen ? 'open' : ''}" data-group="${item.id}">
            <div class="nav-item" onclick="PASTEF.sidebar.toggleGroup('${item.id}')">
              ${item.icon}
              <span class="nav-item-label">${item.label}</span>
              <span class="nav-arrow">${I.arrow}</span>
            </div>
            <div class="nav-submenu">
              ${item.children.map((c) => `
                <a class="nav-subitem ${c.id === currentPage ? 'active' : ''}"
                   href="${pagePrefix}${c.page}.html">
                  <span>${c.label}</span>
                </a>
              `).join('')}
            </div>
          </div>
        `;
        return;
      }

      html += `
        <a class="nav-item ${item.id === currentPage ? 'active' : ''}"
           href="${pagePrefix}${item.page}.html"
           data-page="${item.id}">
          ${item.icon}
          <span class="nav-item-label">${item.label}</span>
        </a>
      `;
    });

    html += `
      </nav>

      <div class="sidebar-footer">
        <button class="logout-btn" onclick="PASTEF.sidebar.logout()">
          ${I.logout}
          <span>Déconnexion</span>
        </button>
        <div class="sidebar-version">MameFatouWade © 2026 PASTEF</div>
      </div>
    `;

    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.innerHTML = html;
  }

  function toggle() {
  const sidebar = document.getElementById('sidebar');

  if (!sidebar) return;

  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('open');
  } else {
    sidebar.classList.toggle('collapsed');
  }
}

  function toggleGroup(groupId) {
    const group = document.querySelector(`[data-group="${groupId}"]`);
    if (group) group.classList.toggle('open');
  }

  async function logout() {
    if (!confirm('Confirmer la déconnexion ?')) return;
    await PASTEF.auth.signOut();
    window.location.href = PASTEF.auth.resolveAdminPath();
  }

  PASTEF.sidebar = { render, toggle, toggleGroup, logout, MENUS };
})();
document.addEventListener('click', (e) => {
  if (window.innerWidth > 768) return;

  const sidebar = document.getElementById('sidebar');
  const toggle = document.querySelector('.topbar-toggle');

  if (
    sidebar &&
    sidebar.classList.contains('open') &&
    !sidebar.contains(e.target) &&
    !toggle?.contains(e.target)
  ) {
    sidebar.classList.remove('open');
  }
});