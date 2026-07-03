/* ============================================
   PASTEF — Data Loader v2
   Charge toutes les données de référence depuis
   les tables ref.* de Supabase.
   Cache localStorage pour le mode hors-ligne.
   ============================================ */

(function () {
  'use strict';

  const CACHE_KEY = 'pastef_ref_cache';
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

  // ─── Cache local ───
  let _cache = loadCache();

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (Date.now() - (parsed._ts || 0) > CACHE_TTL) return {};
      return parsed;
    } catch { return {}; }
  }

  function saveCache() {
    try {
      _cache._ts = Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify(_cache));
    } catch (e) {
      console.warn('[DataLoader] Impossible de sauvegarder le cache', e);
    }
  }

  // ─── Fetch générique avec cache ───
  async function fetchAndCache(key, table, params) {
    // Si en cache et pas de forceRefresh, retourner
    if (_cache[key] && _cache[key].length > 0) return _cache[key];

    try {
      const data = await window.PASTEF.fetchRef(table, params);
      _cache[key] = data;
      saveCache();
      return data;
    } catch (err) {
      console.warn(`[DataLoader] Échec fetch ${key}:`, err.message);
      return _cache[key] || [];
    }
  }

  // ============================================
  // CHARGEMENT INITIAL (toutes les petites tables)
  // ============================================
  async function initAll() {
    const promises = [
      fetchAndCache('sexes',              'ref.sexes',               { order: 'code.asc' }),
      fetchAndCache('pays',               'ref.pays',                { order: 'est_senegal.desc,nom_fr.asc' }),
      fetchAndCache('fonctions_parti',    'ref.fonctions_parti',     { order: 'rang.asc', filter: { est_actif: 'eq.true' } }),
      fetchAndCache('types_pieces',       'ref.types_pieces',        { order: 'code.asc', filter: { est_actif: 'eq.true' } }),
      fetchAndCache('domaines_profession','ref.domaines_profession', { order: 'rang.asc', filter: { est_actif: 'eq.true' } }),
      fetchAndCache('reseaux_sociaux',    'ref.reseaux_sociaux',     { order: 'rang.asc', filter: { est_actif: 'eq.true' } }),
      fetchAndCache('niveaux_activite',   'ref.niveaux_activite',    { order: 'rang.asc' }),
      fetchAndCache('types_usage',        'ref.types_usage',         { order: 'rang.asc' }),
      fetchAndCache('modes_enrolement',   'ref.modes_enrolement',    { order: 'code.asc' }),
      fetchAndCache('regions',            'ref.regions',             { order: 'nom.asc' }),
    ];

    await Promise.allSettled(promises);
    console.log('[DataLoader] Données de référence chargées');
  }

  // ============================================
  // GETTERS (retournent [{id, code?, libelle/nom, ...}])
  // ============================================

  function getSexes() {
    return _cache.sexes || [];
  }

  function getPays() {
    return _cache.pays || [];
  }

  function getPaysSenegal() {
    return (getPays()).find(p => p.est_senegal === true) || null;
  }

  function getPaysDiaspora() {
    return (getPays()).filter(p => p.est_senegal !== true);
  }

  function getFonctionsParti() {
    return _cache.fonctions_parti || [];
  }

  function getTypesPieces() {
    return _cache.types_pieces || [];
  }

  function getDomainesProfession() {
    return _cache.domaines_profession || [];
  }

  function getReseauxSociaux() {
    return _cache.reseaux_sociaux || [];
  }

  function getNiveauxActivite() {
    return _cache.niveaux_activite || [];
  }

  function getTypesUsage() {
    return _cache.types_usage || [];
  }

  function getModesEnrolement() {
    return _cache.modes_enrolement || [];
  }

  function getRegions() {
    return _cache.regions || [];
  }

  // ============================================
  // CASCADING : Départements par région
  // ============================================
  async function getDepartements(regionId) {
    if (!regionId) return [];
    const key = 'dept_' + regionId;
    return fetchAndCache(key, 'ref.departements', {
      order: 'nom.asc',
      filter: { region_id: 'eq.' + regionId },
    });
  }

  // ============================================
  // CASCADING : Communes par département
  // ============================================
  async function getCommunes(departementId) {
    if (!departementId) return [];
    const key = 'comm_' + departementId;
    return fetchAndCache(key, 'ref.communes', {
      order: 'nom.asc',
      filter: { departement_id: 'eq.' + departementId },
    });
  }

  // ============================================
  // CASCADING : Villes diaspora par pays
  // ============================================
  async function getVillesDiaspora(paysId) {
    if (!paysId) return [];
    const key = 'villes_' + paysId;
    return fetchAndCache(key, 'ref.villes_diaspora', {
      order: 'nom.asc',
      filter: { pays_id: 'eq.' + paysId },
    });
  }

  // ============================================
  // CELLULES par commune ou par pays+ville
  // ============================================
  async function getCellules(filters) {
    const params = {
      select: 'id,nom,type_cellule_id,commune_id,pays_id,ville_id,statut',
      order: 'nom.asc',
      filter: { statut: 'eq.ACTIVE', 'deleted_at': 'is.null' },
    };
    if (filters.commune_id) {
      params.filter.commune_id = 'eq.' + filters.commune_id;
    }
    if (filters.pays_id) {
      params.filter.pays_id = 'eq.' + filters.pays_id;
    }
    if (filters.ville_id) {
      params.filter.ville_id = 'eq.' + filters.ville_id;
    }

    try {
      return await window.PASTEF.fetchRef('cellules', params);
    } catch {
      return [];
    }
  }

  // ============================================
  // INDICATIFS TÉLÉPHONIQUES (dérivés de ref.pays)
  // ============================================
  function getDialCodes() {
    const pays = getPays();
    if (!pays.length) return FALLBACK_DIAL_CODES;

    return pays
      .filter(p => p.indicatif)
      .map(p => ({
        id: p.id,
        code: p.indicatif,
        name: p.nom_fr,
        iso2: p.code_iso2,
        flag: countryFlag(p.code_iso2),
      }));
  }

  function getIndicatifByPaysId(paysId) {
    const pays = getPays().find(p => p.id === paysId);
    return pays ? pays.indicatif : '+221';
  }

  // ============================================
  // LOOKUP par ID
  // ============================================
  function findById(collection, id) {
    const data = _cache[collection] || [];
    return data.find(item => item.id === id) || null;
  }

  function getModeEnrolementId(code) {
    const modes = getModesEnrolement();
    const m = modes.find(x => x.code === code);
    return m ? m.id : null;
  }

  // ============================================
  // PROFESSIONS (texte libre — liste de suggestion)
  // Pas de table ref, mais utile pour l'UX
  // ============================================
  const PROFESSIONS = [
    'Étudiant(e)', 'Élève', 'Enseignant(e) / Professeur', 'Médecin',
    'Infirmier / Infirmière', 'Sage-femme', 'Pharmacien(ne)',
    'Ingénieur(e)', 'Technicien(ne)', 'Informaticien(ne)',
    'Développeur / Développeuse', 'Architecte', 'Avocat(e)',
    'Magistrat(e)', 'Notaire', 'Comptable', 'Banquier / Banquière',
    'Économiste', 'Journaliste', 'Commerçant(e)',
    'Entrepreneur(e) / Chef d\'entreprise', 'Artisan(e)',
    'Ouvrier / Ouvrière', 'Agriculteur / Agricultrice',
    'Éleveur / Éleveuse', 'Pêcheur / Pêcheuse', 'Chauffeur',
    'Transporteur', 'Mécanicien(ne)', 'Électricien(ne)',
    'Maçon(ne)', 'Menuisier / Menuisière', 'Plombier / Plombière',
    'Tailleur / Couturière', 'Coiffeur / Coiffeuse',
    'Cuisinier / Cuisinière', 'Restaurateur / Restauratrice',
    'Hôtelier / Hôtelière', 'Agent commercial', 'Vendeur / Vendeuse',
    'Fonctionnaire', 'Militaire', 'Policier / Policière', 'Gendarme',
    'Douanier / Douanière', 'Pompier', 'Religieux / Imam / Pasteur',
    'Artiste', 'Musicien(ne)', 'Sportif / Sportive', 'Retraité(e)',
    'Sans emploi', 'Au foyer', 'Autre',
  ];

  // ============================================
  // FORMATS TÉLÉPHONE PAR INDICATIF
  // ============================================
  const PHONE_FORMATS = {
    '+221': { pattern: /^(77|78|70|76|75)\d{7}$/, format: '77 000 00 00' },
    '+33':  { pattern: /^[1-9]\d{8}$/,            format: '6 12 34 56 78' },
    '+39':  { pattern: /^[3]\d{8,9}$/,            format: '3 12 345 678' },
    '+34':  { pattern: /^[6-9]\d{8}$/,            format: '6 12 345 678' },
    '+1':   { pattern: /^\d{10}$/,                 format: '202 555 0173' },
    '+32':  { pattern: /^[4]\d{8}$/,               format: '470 12 34 56' },
    '+49':  { pattern: /^[1]\d{10,11}$/,           format: '151 23456789' },
    '+44':  { pattern: /^[7]\d{9}$/,               format: '7700 900123' },
    '+212': { pattern: /^(6|7)\d{8}$/,             format: '6 12 345 678' },
    '+222': { pattern: /^[2-4]\d{7}$/,             format: '2 12 34 56' },
    '+223': { pattern: /^[267]\d{7}$/,             format: '6 70 12 34' },
    '+225': { pattern: /^(0?[578])\d{7}$/,         format: '07 12 34 56' },
    '+220': { pattern: /^[3679]\d{6}$/,            format: '7 123456' },
    '+224': { pattern: /^[6]\d{8}$/,               format: '6 20 12 34' },
    '+237': { pattern: /^[6]\d{8}$/,               format: '6 70 123456' },
    '+241': { pattern: /^[0-9]\d{6}$/,             format: '0 74 12 34' },
    '+90':  { pattern: /^[5]\d{9}$/,               format: '501 234 56 78' },
    '+86':  { pattern: /^1[3-9]\d{9}$/,            format: '131 2345 6789' },
    '+971': { pattern: /^5[0-9]\d{7}$/,            format: '50 123 4567' },
  };

  // ============================================
  // HELPER : drapeau emoji depuis code ISO2
  // ============================================
  function countryFlag(iso2) {
    if (!iso2 || iso2.length !== 2) return '🏳️';
    const A = 0x1F1E6;
    return String.fromCodePoint(
      A + iso2.charCodeAt(0) - 65,
      A + iso2.charCodeAt(1) - 65
    );
  }

  // ============================================
  // FALLBACK indicatifs (si ref.pays pas chargé)
  // ============================================
  const FALLBACK_DIAL_CODES = [
    { code: '+221', name: 'Sénégal',  iso2: 'SN', flag: '🇸🇳' },
    { code: '+33',  name: 'France',   iso2: 'FR', flag: '🇫🇷' },
    { code: '+39',  name: 'Italie',   iso2: 'IT', flag: '🇮🇹' },
    { code: '+34',  name: 'Espagne',  iso2: 'ES', flag: '🇪🇸' },
    { code: '+1',   name: 'USA',      iso2: 'US', flag: '🇺🇸' },
  ];

  // ============================================
  // EXPORT
  // ============================================
  window.PASTEF_DATA = {
    // Init
    init: initAll,

    // Getters synchrones (depuis le cache)
    getSexes,
    getPays,
    getPaysSenegal,
    getPaysDiaspora,
    getFonctionsParti,
    getTypesPieces,
    getDomainesProfession,
    getReseauxSociaux,
    getNiveauxActivite,
    getTypesUsage,
    getModesEnrolement,
    getRegions,
    getDialCodes,
    getIndicatifByPaysId,
    getModeEnrolementId,

    // Getters asynchrones (cascading — fetch si pas en cache)
    getDepartements,
    getCommunes,
    getVillesDiaspora,
    getCellules,

    // Lookup
    findById,
    countryFlag,

    // Données statiques (pas de table ref)
    professions: PROFESSIONS,
    phoneFormats: PHONE_FORMATS,
  };

})();