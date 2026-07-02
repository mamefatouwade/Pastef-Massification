/* ============================================
   PASTEF — Logique du formulaire
   - Remplissage dynamique des selects
   - Validation
   - Stockage hors-ligne (LocalStorage)
   - Synchronisation Supabase
   - Validation téléphone par pays
   - 🆕 Cellules chargées depuis Supabase
   ============================================ */

(function() {
  'use strict';

  // ============================================
  // ÉTAT GLOBAL
  // ============================================
  const STORAGE_KEY = 'pastef_pending_enrolments';
  const CLIENT_ID_KEY = 'pastef_client_id';
  const SNAPSHOT_KEY = 'pastef_sync_snapshot'; // 🆕 fallback auto-régénéré (remplace les copies en dur)

  let isOnline = navigator.onLine;
  let isSubmitting = false;

  // Cache des cellules pour éviter trop d'appels API
  let celluleCache = {};

  // 🆕 Cache des départements / communes (remplace senegalStructure en dur)
  let departementCache = {};
  let communeCache = {};

  // ============================================
  // FORMATS TÉLÉPHONE PAR PAYS
  // Pour les indicatifs non listés ici, la validation
  // se fait uniquement sur la longueur minimale (7 chiffres).
  // ============================================
  const phoneFormats = {
    '+221': { country: 'Sénégal',           pattern: /^(77|78|70|76|75)\d{7}$/,  format: '77 000 00 00' },
    '+33':  { country: 'France',            pattern: /^[1-9]\d{8}$/,             format: '6 12 34 56 78' },
    '+39':  { country: 'Italie',            pattern: /^[3]\d{8,9}$/,             format: '3 12 345 678' },
    '+34':  { country: 'Espagne',           pattern: /^[6-9]\d{8}$/,             format: '6 12 345 678' },
    '+1':   { country: 'USA/Canada',        pattern: /^\d{10}$/,                 format: '202 555 0173' },
    '+32':  { country: 'Belgique',          pattern: /^[4]\d{8}$/,               format: '470 12 34 56' },
    '+49':  { country: 'Allemagne',         pattern: /^[1]\d{10,11}$/,           format: '151 23456789' },
    '+44':  { country: 'Royaume-Uni',       pattern: /^[7]\d{9}$/,               format: '7700 900123' },
    '+41':  { country: 'Suisse',            pattern: /^[7][5-9]\d{7}$/,          format: '78 123 45 67' },
    '+31':  { country: 'Pays-Bas',          pattern: /^[6]\d{8}$/,               format: '6 12345678' },
    '+351': { country: 'Portugal',          pattern: /^9[1236]\d{7}$/,           format: '91 234 5678' },
    '+212': { country: 'Maroc',             pattern: /^(6|7)\d{8}$/,             format: '6 12 345 678' },
    '+222': { country: 'Mauritanie',        pattern: /^[2-4]\d{7}$/,             format: '2 2 12 34 56' },
    '+223': { country: 'Mali',              pattern: /^[267]\d{7}$/,             format: '6 70 12 34 56' },
    '+225': { country: "Côte d'Ivoire",     pattern: /^(0?[578])\d{7}$/,         format: '07 12 34 56' },
    '+220': { country: 'Gambie',            pattern: /^[3679]\d{6}$/,            format: '7 123456' },
    '+224': { country: 'Guinée',            pattern: /^[6]\d{8}$/,               format: '6 20 12 34 56' },
    '+245': { country: 'Guinée-Bissau',     pattern: /^[5-9]\d{6}$/,             format: '9 555123' },
    '+226': { country: 'Burkina Faso',      pattern: /^[567]\d{7}$/,             format: '70 123456' },
    '+229': { country: 'Bénin',             pattern: /^[4-9]\d{7}$/,             format: '90 123456' },
    '+237': { country: 'Cameroun',          pattern: /^[6]\d{8}$/,               format: '6 70 123456' },
    '+241': { country: 'Gabon',             pattern: /^[0-9]\d{6}$/,             format: '0 74 12 34' },
    '+227': { country: 'Niger',             pattern: /^[89]\d{7}$/,              format: '90 123456' },
    '+234': { country: 'Nigéria',           pattern: /^[789]\d{9}$/,             format: '801 234 5678' },
    '+233': { country: 'Ghana',             pattern: /^[235]\d{8}$/,             format: '20 123 4567' },
    '+238': { country: 'Cap-Vert',          pattern: /^[59]\d{6}$/,              format: '9 91 12 34' },
    '+213': { country: 'Algérie',           pattern: /^[567]\d{8}$/,             format: '5 55 12 34 56' },
    '+216': { country: 'Tunisie',           pattern: /^[2-9]\d{7}$/,             format: '20 123 456' },
    '+966': { country: 'Arabie Saoudite',   pattern: /^5\d{8}$/,                 format: '50 123 4567' },
    '+971': { country: 'Émirats Arabes Unis', pattern: /^5[0-9]\d{7}$/,          format: '50 123 4567' },
    '+90':  { country: 'Turquie',           pattern: /^[5]\d{9}$/,               format: '501 234 56 78' },
    '+86':  { country: 'Chine',             pattern: /^1[3-9]\d{9}$/,            format: '131 2345 6789' }
  };

  // ============================================
  // UTILITAIRES
  // ============================================
  function $(selector) { return document.querySelector(selector); }
  function $$(selector) { return document.querySelectorAll(selector); }

  function getClientId() {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = 'cli_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  }

  function calculateAge(birthDateStr) {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

  // ============================================
  // 🆕 SNAPSHOT LOCAL (fallback auto-régénéré)
  // À chaque appel réussi à Supabase, on sauvegarde le résultat
  // dans localStorage. C'est CE snapshot qui sert de repli
  // hors-ligne — plus une copie codée en dur qui se désynchronise
  // silencieusement de la base. Les tableaux statiques dans
  // data.js (cellules, cellulesDefaut, senegalStructure) ne
  // servent plus que de « graine » avant la toute première
  // synchronisation (premier lancement, jamais été en ligne).
  // ============================================
  function readSnapshotStore() {
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('[PASTEF] Snapshot local illisible, réinitialisation', e);
      return {};
    }
  }

  function writeSnapshotEntry(section, key, data) {
    try {
      const store = readSnapshotStore();
      if (!store[section]) store[section] = {};
      store[section][key] = { data, updated_at: new Date().toISOString() };
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(store));
    } catch (e) {
      console.warn(`[PASTEF] Impossible d'écrire le snapshot (${section}::${key})`, e);
    }
  }

  function readSnapshotEntry(section, key) {
    const store = readSnapshotStore();
    const entry = store[section] && store[section][key];
    return entry && Array.isArray(entry.data) && entry.data.length ? entry : null;
  }

  // ============================================
  // 🆕 CHARGER LES CELLULES DEPUIS SUPABASE
  // ============================================
  async function loadCellulesFromDB(pays, filters = {}) {
    const { region = null, departement = null, commune = null } = filters;

    // Clé cache incluant tous les filtres actifs
    const cacheKey = [pays, region, departement, commune].filter(Boolean).join('::');

    try {
      // Vérifier que la config Supabase est présente
      if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url) {
        console.warn('[PASTEF] SUPABASE_CONFIG manquant');
        return getFallbackCellules(pays, commune);
      }

      // Vérifier le cache mémoire
      if (celluleCache[cacheKey]) {
        console.log(`[PASTEF] Cellules du cache: ${cacheKey}`);
        return celluleCache[cacheKey];
      }

      console.log(`[PASTEF] Chargement cellules depuis BD pour: ${cacheKey}`);

      const cfg = window.SUPABASE_CONFIG;
      // Appel REST direct (comme sendToSupabase) — pas besoin du client JS
      let url = `${cfg.url}/rest/v1/cellules?select=id,nom,type,pays,region,departement,commune`
        + `&pays=eq.${encodeURIComponent(pays)}`
        + `&active=eq.true`;

      if (region) url += `&region=eq.${encodeURIComponent(region)}`;
      if (departement) url += `&departement=eq.${encodeURIComponent(departement)}`;
      if (commune) url += `&commune=eq.${encodeURIComponent(commune)}`;

      url += `&order=nom.asc`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': cfg.anonKey,
          'Authorization': `Bearer ${cfg.anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error(`[PASTEF] Erreur REST cellules (${response.status}):`, text);
        return getFallbackCellules(pays, commune);
      }

      const data = await response.json();

      // Mettre en cache mémoire + snapshot local (= fallback hors-ligne
      // toujours à jour, régénéré automatiquement à chaque succès)
      celluleCache[cacheKey] = data || [];
      if (data && data.length) writeSnapshotEntry('cellules', cacheKey, data);
      console.log(`[PASTEF] ${(data || []).length} cellule(s) trouvée(s) pour ${cacheKey}`);

      return data || [];
    } catch (err) {
      console.error('[PASTEF] Erreur chargement cellules:', err);
      return getFallbackCellules(pays, commune);
    }
  }

  // Fallback : d'abord le snapshot local (auto-régénéré à chaque sync
  // réussie), et seulement si aucun snapshot n'existe encore (tout
  // premier lancement, jamais eu de connexion) on retombe sur la
  // graine statique embarquée dans data.js.
  function getFallbackCellules(pays, commune = null) {
    const cacheKey = commune ? `${pays}::${commune}` : pays;

    const snap = readSnapshotEntry('cellules', cacheKey);
    if (snap) {
      console.log(`[PASTEF] Fallback cellules (snapshot local, sync. le ${snap.updated_at}) : ${cacheKey}`);
      return snap.data;
    }

    console.warn(`[PASTEF] Aucun snapshot local pour ${cacheKey} — repli sur la graine statique (data.js)`);
    const liste = PASTEF_DATA.cellules[pays] || PASTEF_DATA.cellulesDefaut;
    // Transformer en objets {id, nom} pour garder le même format
    return liste
      .filter(nom => !nom.startsWith('—') && nom !== 'Autre cellule (préciser)')
      .map(nom => ({ id: nom, nom: nom, type: 'base', pays: pays }));
  }

  // 🆕 ÉLARGISSEMENT AUTOMATIQUE : toutes les communes n'ont pas encore
  // leur propre cellule. Plutôt que d'afficher "aucune cellule" et de
  // bloquer le patriote, on élargit progressivement la recherche :
  // commune → département → région → pays. Cohérent avec le message
  // déjà affiché ailleurs dans le formulaire ("la cellule la plus
  // proche de votre zone de résidence").
  async function loadCellulesWithFallbackChain(pays, region, departement, commune) {
    if (commune) {
      const exact = await loadCellulesFromDB(pays, { region, departement, commune });
      if (exact && exact.length) return { cellules: exact, level: 'commune' };
    }
    if (departement) {
      const dep = await loadCellulesFromDB(pays, { region, departement });
      if (dep && dep.length) return { cellules: dep, level: 'departement' };
    }
    if (region) {
      const reg = await loadCellulesFromDB(pays, { region });
      if (reg && reg.length) return { cellules: reg, level: 'region' };
    }
    const base = await loadCellulesFromDB(pays, {});
    return { cellules: base, level: 'pays' };
  }


  // ============================================
  // 🆕 CHARGER LES DÉPARTEMENTS DEPUIS SUPABASE
  // (remplace Object.keys(PASTEF_DATA.senegalStructure[region]))
  // ============================================
  async function loadDepartementsFromDB(region) {
    try {
      if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url) {
        console.warn('[PASTEF] SUPABASE_CONFIG manquant');
        return getFallbackDepartements(region);
      }

      if (departementCache[region]) {
        console.log(`[PASTEF] Départements du cache: ${region}`);
        return departementCache[region];
      }

      console.log(`[PASTEF] Chargement départements depuis BD pour: ${region}`);

      const cfg = window.SUPABASE_CONFIG;
      const url = `${cfg.url}/rest/v1/communes?select=departement`
        + `&region=eq.${encodeURIComponent(region)}`
        + `&active=eq.true`
        + `&order=departement.asc`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': cfg.anonKey,
          'Authorization': `Bearer ${cfg.anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error(`[PASTEF] Erreur REST départements (${response.status}):`, text);
        return getFallbackDepartements(region);
      }

      const rows = await response.json();
      // Dédupliquer (plusieurs communes partagent le même département)
      const departements = [...new Set((rows || []).map(r => r.departement))].sort();

      departementCache[region] = departements;
      if (departements.length) writeSnapshotEntry('departements', region, departements);
      console.log(`[PASTEF] ${departements.length} département(s) trouvé(s) pour ${region}`);

      return departements;
    } catch (err) {
      console.error('[PASTEF] Erreur chargement départements:', err);
      return getFallbackDepartements(region);
    }
  }

  function getFallbackDepartements(region) {
    const snap = readSnapshotEntry('departements', region);
    if (snap) {
      console.log(`[PASTEF] Fallback départements (snapshot local, sync. le ${snap.updated_at}) : ${region}`);
      return snap.data;
    }
    console.warn(`[PASTEF] Aucun snapshot local pour départements/${region} — repli sur la graine statique (data.js)`);
    const struct = PASTEF_DATA.senegalStructure[region];
    return struct ? Object.keys(struct).sort() : [];
  }

  // ============================================
  // 🆕 CHARGER LES COMMUNES DEPUIS SUPABASE
  // (remplace PASTEF_DATA.senegalStructure[region][departement])
  // ============================================
  async function loadCommunesFromDB(region, departement) {
    try {
      if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url) {
        console.warn('[PASTEF] SUPABASE_CONFIG manquant');
        return getFallbackCommunes(region, departement);
      }

      const cacheKey = `${region}::${departement}`;
      if (communeCache[cacheKey]) {
        console.log(`[PASTEF] Communes du cache: ${cacheKey}`);
        return communeCache[cacheKey];
      }

      console.log(`[PASTEF] Chargement communes depuis BD pour: ${cacheKey}`);

      const cfg = window.SUPABASE_CONFIG;
      const url = `${cfg.url}/rest/v1/communes?select=commune`
        + `&region=eq.${encodeURIComponent(region)}`
        + `&departement=eq.${encodeURIComponent(departement)}`
        + `&active=eq.true`
        + `&order=commune.asc`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': cfg.anonKey,
          'Authorization': `Bearer ${cfg.anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error(`[PASTEF] Erreur REST communes (${response.status}):`, text);
        return getFallbackCommunes(region, departement);
      }

      const rows = await response.json();
      const communes = (rows || []).map(r => r.commune);

      communeCache[cacheKey] = communes;
      if (communes.length) writeSnapshotEntry('communes', cacheKey, communes);
      console.log(`[PASTEF] ${communes.length} commune(s) trouvée(s) pour ${cacheKey}`);

      return communes;
    } catch (err) {
      console.error('[PASTEF] Erreur chargement communes:', err);
      return getFallbackCommunes(region, departement);
    }
  }

  function getFallbackCommunes(region, departement) {
    const cacheKey = `${region}::${departement}`;
    const snap = readSnapshotEntry('communes', cacheKey);
    if (snap) {
      console.log(`[PASTEF] Fallback communes (snapshot local, sync. le ${snap.updated_at}) : ${cacheKey}`);
      return snap.data;
    }
    console.warn(`[PASTEF] Aucun snapshot local pour communes/${cacheKey} — repli sur la graine statique (data.js)`);
    const struct = PASTEF_DATA.senegalStructure[region];
    return struct?.[departement] || [];
  }

  // ============================================
  // VALIDATION TÉLÉPHONE
  // ============================================
  function validatePhoneNumber(dialCode, phoneNumber) {
    const cleanedNumber = phoneNumber.replace(/[\s\-()+]/g, '');

    const config = phoneFormats[dialCode];

    // Indicatif non répertorié → on accepte si le numéro a au moins 7 chiffres
    if (!config) {
      if (/^\d{7,15}$/.test(cleanedNumber)) {
        return { valid: true, error: null };
      }
      return { valid: false, error: 'Numéro invalide (7 à 15 chiffres attendus)' };
    }

    if (!config.pattern.test(cleanedNumber)) {
      return {
        valid: false,
        error: `Format invalide pour ${config.country}. Exemple : ${config.format}`
      };
    }

    return { valid: true, error: null };
  }

  function showPhoneError(fieldId, message) {
    let errorElement = document.querySelector(`#${fieldId}-error`);

    if (!errorElement) {
      errorElement = document.createElement('span');
      errorElement.id = `${fieldId}-error`;
      errorElement.className = 'error-message';
      errorElement.style.color = '#e74c3c';
      errorElement.style.fontSize = '12px';
      errorElement.style.marginTop = '4px';
      errorElement.style.display = 'block';

      const phoneInput = document.getElementById(fieldId);
      if (phoneInput && phoneInput.parentNode) {
        phoneInput.parentNode.insertBefore(errorElement, phoneInput.nextSibling);
      }
    }

    errorElement.textContent = message;
    const input = document.getElementById(fieldId);
    if (input) input.classList.add('error-input');
  }

  function clearPhoneError(fieldId) {
    const errorElement = document.querySelector(`#${fieldId}-error`);
    if (errorElement) errorElement.textContent = '';
    const input = document.getElementById(fieldId);
    if (input) input.classList.remove('error-input');
  }

  function setupPhoneValidation() {
    // Formulaire principal
    const dialCodeMain = $('#dialCode');
    const telMain = $('#telephone');

    if (dialCodeMain) {
      dialCodeMain.addEventListener('change', () => {
        if (telMain && telMain.value) {
          const v = validatePhoneNumber(dialCodeMain.value, telMain.value);
          v.valid ? clearPhoneError('telephone') : showPhoneError('telephone', v.error);
        }
      });
    }

    if (telMain) {
      ['blur', 'change'].forEach(evt => {
        telMain.addEventListener(evt, () => {
          const dialCode = dialCodeMain ? dialCodeMain.value : '+221';
          if (telMain.value && dialCode) {
            const v = validatePhoneNumber(dialCode, telMain.value);
            v.valid ? clearPhoneError('telephone') : showPhoneError('telephone', v.error);
          }
        });
      });
    }

    // Formulaire vocal
    const voiceDialCode = $('#voiceDialCode');
    const voiceTel = $('#voiceTel');

    if (voiceDialCode) {
      voiceDialCode.addEventListener('change', () => {
        if (voiceTel && voiceTel.value) {
          const v = validatePhoneNumber(voiceDialCode.value, voiceTel.value);
          v.valid ? clearPhoneError('voiceTel') : showPhoneError('voiceTel', v.error);
        }
      });
    }

    if (voiceTel) {
      ['blur', 'change'].forEach(evt => {
        voiceTel.addEventListener(evt, () => {
          const dialCode = voiceDialCode ? voiceDialCode.value : '+221';
          if (voiceTel.value && dialCode) {
            const v = validatePhoneNumber(dialCode, voiceTel.value);
            v.valid ? clearPhoneError('voiceTel') : showPhoneError('voiceTel', v.error);
          }
        });
      });
    }
  }

  // ============================================
  // 🆕 CHARGER PROFESSIONS / DOMAINES DEPUIS SUPABASE
  // (remplace PASTEF_DATA.professions / PASTEF_DATA.domaines)
  // Listes plates, faible volume : un seul appel, mis en cache mémoire.
  // ============================================
  let professionsCache = null;
  let domainesCache = null;

  async function loadFlatListFromDB(table) {
    try {
      if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url) {
        console.warn('[PASTEF] SUPABASE_CONFIG manquant');
        return getFallbackFlatList(table);
      }

      const cfg = window.SUPABASE_CONFIG;
      const url = `${cfg.url}/rest/v1/${table}?select=nom`
        + `&active=eq.true`
        + `&order=ordre.asc`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': cfg.anonKey,
          'Authorization': `Bearer ${cfg.anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error(`[PASTEF] Erreur REST ${table} (${response.status}):`, text);
        return getFallbackFlatList(table);
      }

      const rows = await response.json();
      const liste = (rows || []).map(r => r.nom);

      if (liste.length) writeSnapshotEntry(table, 'all', liste);
      console.log(`[PASTEF] ${liste.length} entrée(s) chargée(s) pour ${table}`);

      return liste;
    } catch (err) {
      console.error(`[PASTEF] Erreur chargement ${table}:`, err);
      return getFallbackFlatList(table);
    }
  }

  // Correspondance nom de table Supabase → clé dans PASTEF_DATA
  // (les noms ne matchent pas toujours : fonctions_cellule / fonctionsCellule)
  const FLAT_LIST_DATA_KEY = {
    professions: 'professions',
    domaines: 'domaines',
    fonctions_cellule: 'fonctionsCellule'
  };

  function getFallbackFlatList(table) {
    const snap = readSnapshotEntry(table, 'all');
    if (snap) {
      console.log(`[PASTEF] Fallback ${table} (snapshot local, sync. le ${snap.updated_at})`);
      return snap.data;
    }
    console.warn(`[PASTEF] Aucun snapshot local pour ${table} — repli sur la graine statique (data.js)`);
    return PASTEF_DATA[FLAT_LIST_DATA_KEY[table] || table] || [];
  }

  async function loadProfessionsFromDB() {
    if (professionsCache) return professionsCache;
    professionsCache = await loadFlatListFromDB('professions');
    return professionsCache;
  }

  async function loadDomainesFromDB() {
    if (domainesCache) return domainesCache;
    domainesCache = await loadFlatListFromDB('domaines');
    return domainesCache;
  }

  let fonctionsCelluleCache = null;
  async function loadFonctionsCelluleFromDB() {
    if (fonctionsCelluleCache) return fonctionsCelluleCache;
    fonctionsCelluleCache = await loadFlatListFromDB('fonctions_cellule');
    return fonctionsCelluleCache;
  }

  // ============================================
  // REMPLISSAGE DES SELECTS
  // ============================================
  function fillSelect(selectEl, items, placeholder) {
    if (!selectEl) return;
    selectEl.innerHTML = `<option value="">${placeholder}</option>`;
    items.forEach(item => {
      const opt = document.createElement('option');
      if (item.startsWith('—')) {
        opt.disabled = true;
        opt.textContent = item;
        opt.style.fontWeight = '700';
        opt.style.color = '#1B7C3D';
      } else {
        opt.value = item;
        opt.textContent = item;
      }
      selectEl.appendChild(opt);
    });
  }

  function initSelects() {
    // Affichage immédiat depuis la graine locale (zéro latence au chargement)
    fillSelect($('#profession'), PASTEF_DATA.professions, 'Sélectionnez votre profession');
    fillSelect($('#domaine'), PASTEF_DATA.domaines, 'Sélectionnez votre domaine');
    fillSelect($('#pays'), PASTEF_DATA.pays, 'Sélectionnez votre pays');
    fillSelect($('#fonctionCellule'), PASTEF_DATA.fonctionsCellule, 'Sélectionnez votre fonction');
    fillDialCodes();

    // 🆕 Rafraîchissement silencieux depuis Supabase, sans bloquer l'affichage
    refreshFlatSelectFromDB('profession', loadProfessionsFromDB, 'Sélectionnez votre profession');
    refreshFlatSelectFromDB('domaine', loadDomainesFromDB, 'Sélectionnez votre domaine');
    refreshFlatSelectFromDB('fonctionCellule', loadFonctionsCelluleFromDB, 'Sélectionnez votre fonction');
  }

  // 🆕 Remplace le contenu d'un select déjà affiché par la liste venue de
  // la BD, en conservant la sélection en cours si elle est toujours valide.
  async function refreshFlatSelectFromDB(selectId, loader, placeholder) {
    const sel = $(`#${selectId}`);
    if (!sel) return;

    const liste = await loader();
    if (!liste || !liste.length) return;

    const current = sel.value;
    fillSelect(sel, liste, placeholder);

    if (current && liste.includes(current)) {
      sel.value = current;
    } else if (current) {
      // La valeur choisie n'existe plus dans la liste à jour (rare) :
      // on la garde affichée en la ré-ajoutant, pour ne pas effacer
      // silencieusement un choix déjà fait par le patriote.
      const opt = document.createElement('option');
      opt.value = current;
      opt.textContent = current;
      sel.appendChild(opt);
      sel.value = current;
    }
  }

  function fillDialCodes() {
    const sel = $('#dialCode');
    if (!sel) return;
    sel.innerHTML = '';
    PASTEF_DATA.dialCodes.forEach(dc => {
      const opt = document.createElement('option');
      opt.value = dc.code;
      opt.textContent = `${dc.flag} ${dc.code}`;
      opt.setAttribute('data-country', dc.name);
      sel.appendChild(opt);
    });
    sel.value = '+221';
  }

  // ============================================
  // LOGIQUE CONDITIONNELLE
  // ============================================
  function setupConditionalFields() {

    // Profession → Autre
    $('#profession').addEventListener('change', e => {
      const wrap = $('#professionAutreWrap');
      const input = $('#professionAutre');
      if (e.target.value === 'Autre') {
        wrap.hidden = false;
        input.required = true;
      } else {
        wrap.hidden = true;
        input.required = false;
        input.value = '';
      }
    });

    // Domaine → Autre
    $('#domaine').addEventListener('change', e => {
      const wrap = $('#domaineAutreWrap');
      const input = $('#domaineAutre');
      if (e.target.value === 'Autre') {
        wrap.hidden = false;
        input.required = true;
      } else {
        wrap.hidden = true;
        input.required = false;
        input.value = '';
      }
    });

    // 🆕 Pays → Région + Cellule (depuis Supabase) + Indicatif tél
    $('#pays').addEventListener('change', async (e) => {
      const pays = e.target.value;
      const regionSel = $('#region');
      const departementField = $('#departementField');
      const departementSel = $('#departement');
      const communeSelectField = $('#communeSelectField');
      const communeSel = $('#commune');
      const communeTextField = $('#communeTextField');
      const communeText = $('#communeText');
      const celluleSel = $('#cellule');
      const dialSel = $('#dialCode');

      // Auto-update indicatif téléphonique (GARDE CETTE PARTIE)
      const dialCode = PASTEF_DATA.paysToDialCode[pays];
      if (dialCode && dialSel) {
        const exists = Array.from(dialSel.options).some(o => o.value === dialCode);
        if (exists) dialSel.value = dialCode;
      }

      // 🆕 Sénégal : afficher Département + Commune (select)
      //    Autres pays : masquer Département, afficher Localité (texte libre)
      if (pays === 'Sénégal') {
        departementField.hidden = false;
        departementSel.required = true;
        departementSel.disabled = true;
        departementSel.innerHTML = '<option value="">Sélectionnez d\'abord la région</option>';

        communeSelectField.hidden = false;
        communeSel.required = true;
        communeSel.disabled = true;
        communeSel.innerHTML = '<option value="">Sélectionnez d\'abord le département</option>';

        communeTextField.hidden = true;
        communeText.required = false;
        communeText.value = '';
      } else {
        departementField.hidden = true;
        departementSel.required = false;
        departementSel.value = '';

        communeSelectField.hidden = true;
        communeSel.required = false;

        communeTextField.hidden = false;
        communeText.required = true;
      }

      // Régions depuis JS (GARDE CETTE PARTIE — c'est bon)
      const regions = PASTEF_DATA.regions[pays];
      if (regions && regions.length) {
        fillSelect(regionSel, regions, 'Sélectionnez votre région');
        regionSel.disabled = false;
      } else if (pays && pays !== '— Diaspora —') {
        regionSel.innerHTML = '<option value="Autre">Préciser dans la localité</option>';
        regionSel.value = 'Autre';
        regionSel.disabled = false;
      } else {
        regionSel.innerHTML = '<option value="">Sélectionnez d\'abord le pays</option>';
        regionSel.disabled = true;
      }

      // 🆕 CELLULES DEPUIS SUPABASE (REMPLACE LA PARTIE STATIQUE)
      if (!pays || pays === '— Diaspora —') {
        celluleSel.innerHTML = '<option value="">Sélectionnez d\'abord un vrai pays</option>';
        celluleSel.disabled = true;
        return;
      }

      celluleSel.innerHTML = '<option value="">Chargement des cellules...</option>';
      celluleSel.disabled = true;

      const cellules = await loadCellulesFromDB(pays);

      if (cellules.length === 0) {
        celluleSel.innerHTML = '<option value="">Aucune cellule pré-définie</option>'
          + '<option value="autre">Autre cellule (préciser)</option>';
        celluleSel.disabled = false;
        return;
      }

      let html = '<option value="">Sélectionnez votre cellule</option>';
      cellules.forEach(c => {
        html += `<option value="${escapeHtml(c.id)}" data-nom="${escapeHtml(c.nom)}">${escapeHtml(c.nom)}</option>`;
      });
      html += '<option value="autre">Autre cellule (préciser)</option>';

      celluleSel.innerHTML = html;
      celluleSel.disabled = false;
    });

    // 🆕 RÉGION → DÉPARTEMENT (seulement pour Sénégal) — depuis Supabase
    $('#region').addEventListener('change', async e => {
      const pays = $('#pays').value;
      const region = e.target.value;
      const departementSel = $('#departement');
      const communeSel = $('#commune');

      // Reset commune & département
      communeSel.innerHTML = '<option value="">Sélectionnez d\'abord le département</option>';
      communeSel.disabled = true;

      if (pays !== 'Sénégal' || !region) {
        departementSel.innerHTML = '<option value="">Pas de département pour ce pays</option>';
        departementSel.disabled = true;
        return;
      }

      departementSel.innerHTML = '<option value="">Chargement des départements...</option>';
      departementSel.disabled = true;

      const departments = await loadDepartementsFromDB(region);

      if (departments.length > 0) {
        fillSelect(departementSel, departments, 'Sélectionnez votre département');
        departementSel.disabled = false;
      } else {
        departementSel.innerHTML = '<option value="">Aucun département trouvé</option>';
        departementSel.disabled = true;
      }
    });

    // 🆕 DÉPARTEMENT → COMMUNE (seulement pour Sénégal) — depuis Supabase
    $('#departement').addEventListener('change', async e => {
      const pays = $('#pays').value;
      const region = $('#region').value;
      const departement = e.target.value;
      const communeSel = $('#commune');

      if (pays !== 'Sénégal' || !region || !departement) {
        communeSel.innerHTML = '<option value="">Sélectionnez d\'abord le département</option>';
        communeSel.disabled = true;
        return;
      }

      communeSel.innerHTML = '<option value="">Chargement des communes...</option>';
      communeSel.disabled = true;

      const communes = await loadCommunesFromDB(region, departement);

      if (communes.length > 0) {
        let html = '<option value="">Sélectionnez votre commune</option>';
        communes.forEach(c => {
          html += `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;
        });
        communeSel.innerHTML = html;
        communeSel.disabled = false;
        console.log(`[PASTEF] ${communes.length} commune(s) chargée(s) pour ${departement}`);
      } else {
        communeSel.innerHTML = '<option value="">Aucune commune trouvée</option>';
        communeSel.disabled = true;
      }
    });

    // 🆕 COMMUNE → CELLULES (recharger les cellules, avec élargissement
    // automatique si aucune cellule n'est encore rattachée précisément
    // à cette commune)
    $('#commune').addEventListener('change', async (e) => {
      const pays = $('#pays').value;
      const region = $('#region').value;
      const departement = $('#departement').value;
      const commune = e.target.value;
      const celluleSel = $('#cellule');

      if (!pays || !commune) return;

      celluleSel.innerHTML = '<option value="">Chargement des cellules...</option>';
      celluleSel.disabled = true;
      const { cellules, level } = await loadCellulesWithFallbackChain(pays, region, departement, commune);
      renderCelluleOptions(cellules, celluleSel, level, { region, departement, commune });
    });

    // 🆕 Fonction utilitaire pour rendre les options du select des cellules
    // `level` indique jusqu'où on a dû élargir la recherche (commune,
    // departement, region ou pays) — affiche une petite info si on
    // n'a pas trouvé de cellule exactement dans la commune choisie.
    function renderCelluleOptions(cellules, celluleSel, level = 'commune', location = {}) {
      if (cellules.length === 0) {
        celluleSel.innerHTML = '<option value="">Aucune cellule pré-définie</option>'
          + '<option value="autre">Autre cellule (préciser)</option>';
        celluleSel.disabled = false;
        return;
      }

      let html = '<option value="">Sélectionnez votre cellule</option>';

      if (level && level !== 'commune') {
        const labels = {
          departement: `Pas encore de cellule dans ${location.commune || 'votre commune'} — cellules du département`,
          region: `Pas encore de cellule dans votre département — cellules de la région`,
          pays: `Pas encore de cellule dans votre région — cellules disponibles`
        };
        html += `<option value="" disabled>— ${labels[level] || 'Cellules les plus proches'} —</option>`;
      }

      cellules.forEach(c => {
        html += `<option value="${escapeHtml(c.id)}" data-nom="${escapeHtml(c.nom)}">${escapeHtml(c.nom)}</option>`;
      });
      html += '<option value="autre">Autre cellule (préciser)</option>';

      celluleSel.innerHTML = html;
      celluleSel.disabled = false;
    }

    // Cellule → Autre
    $('#cellule').addEventListener('change', e => {
      const wrap = $('#celluleAutreWrap');
      const input = $('#celluleAutre');
      if (e.target.value === 'autre') {
        wrap.hidden = false;
        input.required = true;
      } else {
        wrap.hidden = true;
        input.required = false;
        input.value = '';
      }
    });

    // Appartient cellule → Oui / Non
    $$('input[name="appartientCellule"]').forEach(radio => {
      radio.addEventListener('change', e => {
        const ouiBlock = $('#celluleOuiBlock');
        const nonBlock = $('#celluleNonBlock');
        const celluleSel = $('#cellule');
        const fonctionSel = $('#fonctionCellule');

        if (e.target.value === 'Oui') {
          ouiBlock.hidden = false;
          nonBlock.hidden = true;
          celluleSel.required = true;
          fonctionSel.required = true;
        } else {
          ouiBlock.hidden = true;
          nonBlock.hidden = false;
          celluleSel.required = false;
          fonctionSel.required = false;
          celluleSel.value = '';
          fonctionSel.value = '';
          $('#celluleAutre').required = false;
          $('#celluleAutre').value = '';
          $('#celluleAutreWrap').hidden = true;
        }
      });
    });

    // Date de naissance → âge calculé
    $('#dateNaissance').addEventListener('change', e => {
      const age = calculateAge(e.target.value);
      const hint = $('#ageHint');
      if (age !== null && age >= 0 && age <= 120) {
        hint.textContent = `Âge : ${age} ans`;
        if (age < 18) {
          hint.textContent += ' — vous devez avoir 18 ans révolus pour vous enrôler';
          hint.style.color = 'var(--red)';
        } else {
          hint.style.color = 'var(--text-muted)';
        }
      } else {
        hint.textContent = '';
      }
    });
  }

  // ============================================
  // VALIDATION
  // ============================================
  function validateForm() {
    const form = $('#enrolmentForm');
    let valid = true;
    let firstError = null;

    // Nettoyer les erreurs précédentes
    $$('.field.has-error').forEach(f => f.classList.remove('has-error'));
    $$('.error-message').forEach(e => e.remove());

    // Champs requis
    const required = form.querySelectorAll('[required]');
    required.forEach(input => {
      if (input.type === 'radio') {
        const name = input.name;
        const checked = form.querySelector(`input[name="${name}"]:checked`);
        if (!checked) {
          valid = false;
          if (!firstError) firstError = input;
        }
      } else if (input.type === 'checkbox') {
        if (!input.checked) {
          valid = false;
          showFieldError(input, 'Vous devez cocher cette case');
          if (!firstError) firstError = input;
        }
      } else if (!input.value || !input.value.trim()) {
        const field = input.closest('.field');
        if (field) field.classList.add('has-error');
        valid = false;
        if (!firstError) firstError = input;
      }
    });

    // Validation âge minimum
    const dateNaissance = $('#dateNaissance').value;
    if (dateNaissance) {
      const age = calculateAge(dateNaissance);
      if (age < 18) {
        const field = $('#dateNaissance').closest('.field');
        field.classList.add('has-error');
        showFieldError($('#dateNaissance'), 'Vous devez avoir 18 ans révolus');
        valid = false;
        if (!firstError) firstError = $('#dateNaissance');
      }
    }

    // Validation téléphone avec indicatif
    const dialCode = $('#dialCode').value;
    const tel = $('#telephone').value.trim();
    if (tel && dialCode) {
      const v = validatePhoneNumber(dialCode, tel);
      if (!v.valid) {
        const field = $('#telephone').closest('.field');
        if (field) field.classList.add('has-error');
        showPhoneError('telephone', v.error);
        valid = false;
        if (!firstError) firstError = $('#telephone');
      }
    }

    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => firstError.focus(), 300);
    }

    return valid;
  }

  function showFieldError(input, message) {
    const field = input.closest('.field');
    if (!field) return;
    if (field.querySelector('.error-message')) return;
    const err = document.createElement('span');
    err.className = 'error-message';
    err.textContent = message;
    field.appendChild(err);
  }

  // ============================================
  // 🆕 COLLECTE DES DONNÉES (avec cellule_id)
  // ============================================
  function collectFormData() {
    const form = $('#enrolmentForm');
    const fd = new FormData(form);

    const dialCode = fd.get('dialCode') || '+221';
    const telLocal = (fd.get('telephone') || '').replace(/\s+/g, ' ').trim();
    const telephoneComplet = `${dialCode} ${telLocal}`.trim();

    // 🆕 Récupérer cellule_id (UUID) et nom
    const celluleSel = $('#cellule');
    const celluleValue = celluleSel.value;
    let celluleId = null;
    let celluleNom = null;

    if (celluleValue && celluleValue !== 'autre') {
      // Vérifier si c'est un UUID (depuis la BD) ou un nom (fallback hors-ligne)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(celluleValue);
      if (isUUID) {
        celluleId = celluleValue;
        celluleNom = celluleSel.options[celluleSel.selectedIndex].dataset.nom;
      } else {
        celluleId = null;
        celluleNom = celluleValue;
      }
    }

    return {
      prenom: fd.get('prenom')?.trim(),
      nom: fd.get('nom')?.trim(),
      date_naissance: fd.get('dateNaissance'),
      sexe: fd.get('sexe'),
      lieu_naissance: fd.get('lieuNaissance')?.trim(),
      telephone: telephoneComplet,
      telephone_indicatif: dialCode,
      telephone_local: telLocal,

      profession: fd.get('profession'),
      profession_autre: fd.get('professionAutre')?.trim() || null,
      domaine: fd.get('domaine'),
      domaine_autre: fd.get('domaineAutre')?.trim() || null,

      pays: fd.get('pays'),
      region: fd.get('region'),
      // 🆕 Colonnes dédiées (utilisées pour le filtrage précis des cellules
      // côté admin). Uniquement renseignées pour le Sénégal, où la
      // hiérarchie région → département → commune existe.
      departement: fd.get('pays') === 'Sénégal' ? (fd.get('departement') || null) : null,
      commune: fd.get('pays') === 'Sénégal' ? (fd.get('commune') || null) : null,
      // La colonne 'quartier' reste renseignée pour compatibilité avec
      // l'existant (elle contient la commune pour le Sénégal, la localité
      // libre pour la diaspora).
      quartier: fd.get('pays') === 'Sénégal'
        ? fd.get('commune')
        : fd.get('communeText')?.trim(),

      appartient_cellule: fd.get('appartientCellule'),
      cellule_id: celluleId,          // 🆕 UUID depuis Supabase
      cellule: celluleNom,             // Nom pour rétro-compatibilité
      cellule_autre: fd.get('celluleAutre')?.trim() || null,
      fonction_cellule: fd.get('fonctionCellule') || null,

      engagement_soutenir: !!fd.get('engagement1'),
      engagement_participer: !!fd.get('engagement2'),
      engagement_oeuvrer: !!fd.get('engagement3'),
      certification: !!fd.get('certification'),

      client_id: getClientId(),
      user_agent: navigator.userAgent,
      submitted_at: new Date().toISOString()
    };
  }

  // ============================================
  // STOCKAGE LOCAL
  // ============================================
  function getPending() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Erreur lecture storage', e);
      return [];
    }
  }

  function savePending(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    updatePendingBadge();
  }

  function addToPending(data) {
    const pending = getPending();
    pending.push({
      ...data,
      local_id: 'loc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      saved_at: new Date().toISOString()
    });
    savePending(pending);
  }

  async function updatePendingBadge() {
    await updateNetworkBanner();
  }

  // ============================================
  // ENVOI À SUPABASE
  // ============================================
  async function sendToSupabase(data) {
    if (!window.SUPABASE_CONFIG) {
      throw new Error('Configuration Supabase manquante');
    }
    const cfg = window.SUPABASE_CONFIG;

    if (cfg.url.includes('VOTRE-PROJET')) {
      throw new Error('⚠️ Configurez Supabase dans js/supabase-config.js avant utilisation');
    }

    const { local_id, saved_at, ...payload } = data;

    const response = await fetch(`${cfg.url}/rest/v1/${cfg.table}`, {
      method: 'POST',
      headers: {
        'apikey': cfg.anonKey,
        'Authorization': `Bearer ${cfg.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Erreur Supabase (${response.status}): ${text}`);
    }

    return true;
  }

  // ============================================
  // SYNCHRONISATION
  // ============================================
  async function syncPending() {
    const pending = getPending();
    const audioCount = await PASTEF_AUDIO.countRecordings().catch(() => 0);

    if (pending.length === 0 && audioCount === 0) return { sent: 0, failed: 0 };

    if (!navigator.onLine) {
      showToast('Pas de connexion internet', 'warning');
      return { sent: 0, failed: pending.length + audioCount };
    }

    let sent = 0;
    let failed = 0;

    const remaining = [];
    for (const entry of pending) {
      try {
        await sendToSupabase(entry);
        sent++;
      } catch (err) {
        console.error('Échec sync texte', err);
        failed++;
        remaining.push(entry);
      }
    }
    savePending(remaining);

    try {
      const audioResult = await PASTEF_AUDIO.syncAll();
      sent += audioResult.sent;
      failed += audioResult.failed;
    } catch (err) {
      console.error('Échec sync audio', err);
    }

    await updatePendingBadge();

    if (sent > 0) showToast(`${sent} enrôlement(s) synchronisé(s)`, 'success');
    if (failed > 0) showToast(`${failed} échec(s) — réessayez plus tard`, 'warning');

    return { sent, failed };
  }

  // ============================================
  // SOUMISSION DU FORMULAIRE
  // ============================================
  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      showToast('Veuillez compléter tous les champs requis', 'warning');
      return;
    }

    isSubmitting = true;
    const btn = $('#submitBtn');
    btn.disabled = true;
    btn.classList.add('loading');

    const data = collectFormData();

    try {
      if (navigator.onLine) {
        await sendToSupabase(data);
        showSuccessModal('Enrôlement enregistré !', 'Bienvenue parmi les Patriotes du Sénégal. Vos informations ont été transmises.');
      } else {
        addToPending(data);
        showSuccessModal('Enregistré hors-ligne', 'Vos données sont sauvegardées sur cet appareil. Elles seront envoyées dès le retour du réseau.');
      }
      resetForm();
    } catch (err) {
      console.error(err);
      addToPending(data);
      showSuccessModal(
        'Sauvegardé localement',
        `L'envoi direct a échoué (${err.message.slice(0, 80)}). Vos données sont en sécurité sur cet appareil — cliquez sur "Synchroniser" plus tard.`
      );
      resetForm();
    } finally {
      isSubmitting = false;
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  }

  function resetForm() {
    $('#enrolmentForm').reset();
    $('#celluleOuiBlock').hidden = true;
    $('#celluleNonBlock').hidden = true;
    $('#professionAutreWrap').hidden = true;
    $('#domaineAutreWrap').hidden = true;
    $('#celluleAutreWrap').hidden = true;
    $('#ageHint').textContent = '';
    $('#region').disabled = true;
    $('#region').innerHTML = '<option value="">Sélectionnez d\'abord le pays</option>';
    // 🆕 Reset département et commune
    $('#departementField').hidden = true;
    $('#departement').disabled = true;
    $('#departement').innerHTML = '<option value="">Sélectionnez d\'abord la région</option>';
    $('#communeSelectField').hidden = true;
    $('#commune').disabled = true;
    $('#commune').innerHTML = '<option value="">Sélectionnez d\'abord le département</option>';
    $('#communeTextField').hidden = false;
    $('#communeText').required = true;

    $('#dialCode').value = '+221';
    clearPhoneError('telephone');
  }

  // ============================================
  // MODALE & TOAST
  // ============================================
  function showSuccessModal(title, message) {
    $('#modalTitle').textContent = title;
    $('#modalMessage').textContent = message;
    $('#successModal').hidden = false;
  }

  function closeSuccessModal() {
    $('#successModal').hidden = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showToast(message, type) {
    const banner = $('#networkBanner');
    const text = $('#networkBannerText');
    const originalText = text.textContent;
    const originalClass = banner.className;

    banner.hidden = false;
    text.textContent = message;
    banner.className = 'network-banner ' + (type === 'success' ? 'online' : '');

    setTimeout(() => {
      text.textContent = originalText;
      banner.className = originalClass;
      updateNetworkBanner();
    }, 3500);
  }

  // ============================================
  // RÉSEAU
  // ============================================
  async function updateNetworkBanner() {
    const banner = $('#networkBanner');
    const text = $('#networkBannerText');
    if (!banner || !text) return;

    const pendingText = getPending().length;
    const pendingAudio = await PASTEF_AUDIO.countRecordings().catch(() => 0);
    const total = pendingText + pendingAudio;

    if (navigator.onLine) {
      if (total > 0) {
        banner.hidden = false;
        banner.className = 'network-banner online has-pending';
        const label = total === 1 ? 'enrôlement en attente' : 'enrôlements en attente';
        text.innerHTML = `Connexion rétablie — <strong>${total}</strong> ${label} de synchronisation <em style="opacity:.75;font-style:normal;font-weight:600;">(toucher pour synchroniser)</em>`;
      } else {
        banner.hidden = true;
      }
    } else {
      banner.hidden = false;
      banner.className = 'network-banner';
      if (total > 0) {
        const label = total === 1 ? 'enrôlement sauvegardé' : 'enrôlements sauvegardés';
        text.innerHTML = `Hors-ligne — <strong>${total}</strong> ${label} localement`;
      } else {
        text.textContent = 'Hors-ligne — vos données sont sauvegardées localement';
      }
    }
  }

  function handleOnline() {
    isOnline = true;
    updateNetworkBanner();
    setTimeout(async () => {
      const pendingText = getPending().length;
      const pendingAudio = await PASTEF_AUDIO.countRecordings().catch(() => 0);
      if (pendingText + pendingAudio > 0) syncPending();
    }, 1000);
  }

  function handleOffline() {
    isOnline = false;
    updateNetworkBanner();
  }

  // ============================================
  // MODALE VOCALE
  // ============================================
  let voiceTimerInterval = null;
  let voiceAudioElement = null;

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(2) + ' Mo';
  }

  function openVoiceModal() {
    if (!PASTEF_AUDIO.isSupported()) {
      $('#voiceError').hidden = false;
      $('#voiceError').textContent = 'Votre navigateur ne supporte pas l\'enregistrement audio. Essayez Chrome ou Safari récent.';
      $('#voiceRecorder').style.display = 'none';
    } else {
      $('#voiceError').hidden = true;
      $('#voiceRecorder').style.display = '';
    }

    $('#voicePreview').classList.remove('active');
    $('#voiceRecorder').classList.remove('hidden-during-preview');
    $('#voiceTimer').textContent = '00:00';
    $('#voiceTimer').classList.remove('recording');
    $('#voiceStatus').textContent = 'Appuyez sur le micro pour démarrer';
    $('#voiceStatus').classList.remove('recording');
    $('#recordBtn').classList.remove('recording');
    $('#voiceNom').value = '';
    $('#voiceTel').value = '';

    const voiceDial = $('#voiceDialCode');
    if (voiceDial && voiceDial.options.length === 0) {
      PASTEF_DATA.dialCodes.forEach(dc => {
        const opt = document.createElement('option');
        opt.value = dc.code;
        opt.textContent = `${dc.flag} ${dc.code}`;
        voiceDial.appendChild(opt);
      });
      voiceDial.value = '+221';
    }

    $('#voiceModal').hidden = false;
  }

  function closeVoiceModal() {
    if (PASTEF_AUDIO.getState() === 'recording') PASTEF_AUDIO.cancelRecording();
    stopVoiceTimer();
    if (voiceAudioElement) {
      voiceAudioElement.pause();
      voiceAudioElement = null;
    }
    $('#voiceModal').hidden = true;
  }

  function startVoiceTimer() {
    stopVoiceTimer();
    voiceTimerInterval = setInterval(() => {
      const elapsed = PASTEF_AUDIO.getElapsedSeconds();
      $('#voiceTimer').textContent = formatTime(elapsed);
      if (elapsed >= 300) handleStopRecording();
    }, 250);
  }

  function stopVoiceTimer() {
    if (voiceTimerInterval) {
      clearInterval(voiceTimerInterval);
      voiceTimerInterval = null;
    }
  }

  async function handleStartRecording() {
    try {
      $('#voiceStatus').textContent = 'Demande d\'accès au microphone...';
      const recordingPromise = PASTEF_AUDIO.startRecording();

      await new Promise(r => setTimeout(r, 100));

      $('#voiceStatus').textContent = '🔴 Enregistrement en cours…';
      $('#voiceStatus').classList.add('recording');
      $('#voiceTimer').classList.add('recording');
      $('#recordBtn').classList.add('recording');
      $('#recordIcon').innerHTML = '<rect x="6" y="6" width="12" height="12" rx="2" ry="2" fill="currentColor"/>';
      $('#recordHint').textContent = 'Appuyez à nouveau pour arrêter';

      startVoiceTimer();

      const result = await recordingPromise;
      stopVoiceTimer();
      showPreview(result);
    } catch (err) {
      console.error(err);
      stopVoiceTimer();
      $('#voiceError').hidden = false;
      $('#voiceError').textContent = err.name === 'NotAllowedError'
        ? 'Vous devez autoriser l\'accès au microphone pour enregistrer.'
        : 'Erreur : ' + err.message;
      resetVoiceUI();
    }
  }

  function handleStopRecording() {
    PASTEF_AUDIO.stopRecording();
  }

  function resetVoiceUI() {
    $('#voiceStatus').textContent = 'Appuyez sur le micro pour démarrer';
    $('#voiceStatus').classList.remove('recording');
    $('#voiceTimer').textContent = '00:00';
    $('#voiceTimer').classList.remove('recording');
    $('#recordBtn').classList.remove('recording');
    $('#recordIcon').innerHTML = `
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>`;
    $('#recordHint').textContent = 'Durée recommandée : 1 à 3 minutes';
    $('#voicePreview').classList.remove('active');
    $('#voiceRecorder').classList.remove('hidden-during-preview');
    $('#audioProgressBar').style.width = '0%';
    $('#audioCurrentTime').textContent = '00:00';
    const saveBtn = $('#voiceSaveBtn');
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg> Envoyer';
  }

  function showPreview({ blob, duration, extension }) {
    $('#voiceRecorder').classList.add('hidden-during-preview');
    $('#voicePreview').classList.add('active');
    $('#previewDuration').textContent = formatTime(duration);
    $('#previewSize').textContent = formatSize(blob.size);
    $('#audioCurrentTime').textContent = '00:00';
    $('#audioProgressBar').style.width = '0%';

    if (voiceAudioElement) {
      voiceAudioElement.pause();
      URL.revokeObjectURL(voiceAudioElement.src);
    }
    voiceAudioElement = new Audio(URL.createObjectURL(blob));

    voiceAudioElement.addEventListener('timeupdate', () => {
      if (!voiceAudioElement || !voiceAudioElement.duration) return;
      const pct = (voiceAudioElement.currentTime / voiceAudioElement.duration) * 100;
      $('#audioProgressBar').style.width = pct + '%';
      $('#audioCurrentTime').textContent = formatTime(Math.floor(voiceAudioElement.currentTime));
    });

    voiceAudioElement.addEventListener('ended', () => {
      $('#playIcon').innerHTML = '<path d="M8 5v14l11-7z"/>';
      $('#audioProgressBar').style.width = '0%';
      $('#audioCurrentTime').textContent = '00:00';
    });

    // Seek en cliquant sur la barre de progression
    $('#audioProgressWrap').addEventListener('click', function(e) {
      if (!voiceAudioElement || !voiceAudioElement.duration) return;
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      voiceAudioElement.currentTime = pct * voiceAudioElement.duration;
    });
  }

  function togglePlayback() {
    if (!voiceAudioElement) return;
    if (voiceAudioElement.paused) {
      voiceAudioElement.play();
      $('#playIcon').innerHTML = '<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>';
    } else {
      voiceAudioElement.pause();
      $('#playIcon').innerHTML = '<path d="M8 5v14l11-7z"/>';
    }
  }

  async function handleSaveVoice() {
    const blob = PASTEF_AUDIO.getLastBlob();
    if (!blob) return;

    const saveBtn = $('#voiceSaveBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg> Envoi...';

    try {
      await PASTEF_AUDIO.saveRecording({
        blob,
        duration: PASTEF_AUDIO.getLastDuration(),
        extension: PASTEF_AUDIO.getLastExtension(),
        nom: $('#voiceNom').value,
        telephone_indicatif: $('#voiceDialCode').value,
        telephone_local: $('#voiceTel').value
      });

      await updatePendingBadge();
      closeVoiceModal();
      showToast('Enregistrement vocal sauvegardé ✓', 'success');

      if (navigator.onLine && !window.SUPABASE_CONFIG.url.includes('VOTRE-PROJET')) {
        setTimeout(() => syncPending(), 500);
      }
    } catch (err) {
      console.error(err);
      showToast('Erreur sauvegarde : ' + err.message, 'warning');
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg> Envoyer';
    }
  }

  function setupVoiceModal() {
    $('#voiceFab').addEventListener('click', openVoiceModal);
    $('#voiceModalClose').addEventListener('click', closeVoiceModal);
    $('#voiceModal').addEventListener('click', e => {
      if (e.target.id === 'voiceModal') closeVoiceModal();
    });

    $('#recordBtn').addEventListener('click', () => {
      const state = PASTEF_AUDIO.getState();
      if (state === 'recording') handleStopRecording();
      else handleStartRecording();
    });

    $('#voiceRedoBtn').addEventListener('click', () => {
      if (voiceAudioElement) {
        voiceAudioElement.pause();
        URL.revokeObjectURL(voiceAudioElement.src);
        voiceAudioElement = null;
      }
      PASTEF_AUDIO.cancelRecording();
      resetVoiceUI();
    });

    $('#voiceSaveBtn').addEventListener('click', handleSaveVoice);
    $('#playBtn').addEventListener('click', togglePlayback);
  }

  // ============================================
  // INITIALISATION
  // ============================================
  function init() {
    initSelects();
    setupConditionalFields();
    setupPhoneValidation();
    setupVoiceModal();
    updatePendingBadge();
    updateNetworkBanner();

    $('#enrolmentForm').addEventListener('submit', handleSubmit);
    $('#networkBanner').addEventListener('click', () => {
      if (navigator.onLine) syncPending();
    });
    $('#modalCloseBtn').addEventListener('click', closeSuccessModal);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const today = new Date().toISOString().split('T')[0];
    $('#dateNaissance').setAttribute('max', today);
    $('#dateNaissance').setAttribute('min', '1900-01-01');

    console.log('[PASTEF] Formulaire initialisé — v6 (avec cellules Supabase)');
    console.log('[PASTEF] Mode :', navigator.onLine ? 'En ligne' : 'Hors-ligne');
    console.log('[PASTEF] En attente texte :', getPending().length);
    PASTEF_AUDIO.countRecordings().then(n => console.log('[PASTEF] En attente audio :', n));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();