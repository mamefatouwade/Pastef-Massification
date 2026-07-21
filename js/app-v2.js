/* ============================================
   PASTEF — Logique du formulaire v3
   Adapté au schéma normalisé (ref.* + public.*)
   Toutes les valeurs de dropdown = UUID depuis la base
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // ÉTAT GLOBAL
  // ============================================
  const STORAGE_KEY = 'pastef_pending_enrolments_v2';
  const CLIENT_ID_KEY = 'pastef_client_id';

  let isOnline = navigator.onLine;
  let isSubmitting = false;

  // Référence vers le pays Sénégal (chargé à l'init)
  let SENEGAL_ID = null;
  let SENEGAL_PAYS = null;

  // ============================================
  // UTILITAIRES
  // ============================================
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

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

  function esc(text) {
    const d = document.createElement('div');
    d.textContent = String(text);
    return d.innerHTML;
  }

  // ============================================
  // REMPLISSAGE SELECTS (UUID-based)
  // ============================================

  /** Remplit un <select> avec des objets {id, libelle|nom|nom_fr} */
  function fillSelectFromRef(sel, items, placeholder, labelKey) {
    if (!sel) return;
    const key = labelKey || 'libelle';
    sel.innerHTML = `<option value="">${placeholder}</option>`;
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item[key] || item.libelle || item.nom || item.nom_fr || '';
      // Stocker des metadata utiles
      if (item.code) opt.dataset.code = item.code;
      if (item.indicatif) opt.dataset.indicatif = item.indicatif;
      if (item.est_senegal) opt.dataset.senegal = 'true';
      if (item.code_iso2) opt.dataset.iso2 = item.code_iso2;
      sel.appendChild(opt);
    });
  }

  /** Remplit un <select> avec des chaînes simples (pour professions) */
  function fillSelectFromStrings(sel, items, placeholder) {
    if (!sel) return;
    sel.innerHTML = `<option value="">${placeholder}</option>`;
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      sel.appendChild(opt);
    });
  }

  /** Remplit les indicatifs téléphoniques */
  function fillDialCodes(selId) {
    const sel = $(selId);
    if (!sel) return;
    sel.innerHTML = '';
    const codes = PASTEF_DATA.getDialCodes();
    codes.forEach(dc => {
      const opt = document.createElement('option');
      opt.value = dc.code;
      opt.textContent = `${dc.flag} ${dc.code}`;
      opt.dataset.country = dc.name;
      opt.dataset.paysId = dc.id || '';
      sel.appendChild(opt);
    });
    sel.value = '+221';
  }

  /** Remplit un <select> pays avec séparateur Sénégal / Diaspora */
  function fillPaysSelect(sel) {
    if (!sel) return;
    const allPays = PASTEF_DATA.getPays();
    sel.innerHTML = '<option value="">Sélectionnez votre pays</option>';

    // Sénégal en premier
    const senegal = allPays.find(p => p.est_senegal);
    if (senegal) {
      const opt = document.createElement('option');
      opt.value = senegal.id;
      opt.textContent = senegal.nom_fr;
      opt.dataset.senegal = 'true';
      opt.dataset.indicatif = senegal.indicatif;
      sel.appendChild(opt);

      // Séparateur
      const sep = document.createElement('option');
      sep.disabled = true;
      sep.textContent = '— Diaspora —';
      sep.style.fontWeight = '700';
      sep.style.color = '#1B7C3D';
      sel.appendChild(sep);
    }

    // Diaspora
    allPays
      .filter(p => !p.est_senegal)
      .forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.nom_fr;
        opt.dataset.indicatif = p.indicatif;
        sel.appendChild(opt);
      });
  }

  /** ✅ Remplit le select nationalité depuis ref.pays (Sénégal en tête) */
  function fillNationaliteSelect(sel) {
    if (!sel) return;
    const allPays = PASTEF_DATA.getPays();
    sel.innerHTML = '<option value="">Sélectionnez votre nationalité</option>';

    // Sénégal en premier
    const senegal = allPays.find(p => p.est_senegal);
    if (senegal) {
      const opt = document.createElement('option');
      opt.value = senegal.id;
      opt.textContent = senegal.nom_fr;
      opt.dataset.senegal = 'true';
      sel.appendChild(opt);

      const sep = document.createElement('option');
      sep.disabled = true;
      sep.textContent = '— Autre —';
      sep.style.fontWeight = '700';
      sel.appendChild(sep);
    }

    allPays
      .filter(p => !p.est_senegal)
      .forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.nom_fr;
        sel.appendChild(opt);
      });

    // Pré-sélectionner Sénégal
    if (senegal) sel.value = senegal.id;
  }

  // ============================================
  // INITIALISATION DES SELECTS
  // ============================================
  async function initSelects() {
    // Charger toutes les données de référence
    await PASTEF_DATA.init();

    // Identifier le Sénégal
    SENEGAL_PAYS = PASTEF_DATA.getPaysSenegal();
    SENEGAL_ID = SENEGAL_PAYS ? SENEGAL_PAYS.id : null;

    // Remplir les selects
    fillSelectFromRef($('#sexe'), PASTEF_DATA.getSexes(), 'Sélectionnez', 'libelle');
    fillNationaliteSelect($('#nationalite'));  // ✅ ADAPTÉ : select UUID
    fillPaysSelect($('#pays'));
    fillPaysSelect($('#paysEmetteur'));
    fillSelectFromRef($('#typePiece'), PASTEF_DATA.getTypesPieces(), 'Sélectionnez le type', 'libelle');
    fillSelectFromRef($('#fonctionCellule'), PASTEF_DATA.getFonctionsParti(), 'Sélectionnez votre fonction', 'libelle');
    fillSelectFromRef($('#domaine'), PASTEF_DATA.getDomainesProfession(), 'Sélectionnez votre domaine', 'libelle');
    fillSelectFromStrings($('#profession'), PASTEF_DATA.professions, 'Sélectionnez votre profession');
    fillSelectFromRef($('#niveauActivite'), PASTEF_DATA.getNiveauxActivite(), 'Sélectionnez', 'libelle');
    fillSelectFromRef($('#typeUsage'), PASTEF_DATA.getTypesUsage(), 'Sélectionnez', 'libelle');
    fillDialCodes('#dialCode');
    fillDialCodes('#voiceDialCode');

    // Réseaux sociaux (checkboxes dynamiques)
    buildReseauxCheckboxes();
  }

  /** Construit les checkboxes réseaux sociaux depuis ref.reseaux_sociaux */
  function buildReseauxCheckboxes() {
    const container = $('#reseauxContainer');
    if (!container) return;

    container.innerHTML = '';
    const reseaux = PASTEF_DATA.getReseauxSociaux();

    reseaux.forEach(rs => {
      const label = document.createElement('label');
      label.className = 'check-label';
      label.style.cssText = 'flex: 1 1 45%; min-width: 140px;';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'reseaux';
      input.value = rs.id;
      input.dataset.code = rs.code;

      const span = document.createElement('span');
      span.textContent = rs.libelle;

      label.appendChild(input);
      label.appendChild(span);
      container.appendChild(label);
    });

    // Ajouter "Aucun"
    const aucunLabel = document.createElement('label');
    aucunLabel.className = 'check-label';
    aucunLabel.style.cssText = 'flex: 1 1 45%; min-width: 140px;';
    const aucunInput = document.createElement('input');
    aucunInput.type = 'checkbox';
    aucunInput.name = 'reseaux';
    aucunInput.value = 'aucun';
    const aucunSpan = document.createElement('span');
    aucunSpan.textContent = 'Aucun';
    aucunLabel.appendChild(aucunInput);
    aucunLabel.appendChild(aucunSpan);
    container.appendChild(aucunLabel);
  }

  // ============================================
  // AFFICHAGE PROGRESSIF DES SECTIONS
  // ============================================
  function showSectionsAfterCellule() {
    $('#residenceSection').hidden = false;
    $('#contactSection').hidden = false;
    $('#pieceSection').hidden = false;
    $('#electeurSection').hidden = false;
    $('#cartePastefSection').hidden = false;
    $('#professionSection').hidden = false;
    $('#engagementSection').hidden = false;
    $('#numeriqueSection').hidden = false;
    $('#submitSection').hidden = false;
    $('#securityNotice').hidden = false;
  }
// ============================================
// VALIDATION CARTE PASTEF (6 caractères alphanumériques)
// ============================================
function validateCartePastef(value) {
  const cleaned = value.trim().toUpperCase();
  
  if (cleaned.length !== 6) {
    return { valid: false, error: `Le numéro doit contenir exactement 6 caractères (${cleaned.length}/6)` };
  }
  if (!/^[A-Z0-9]{6}$/.test(cleaned)) {
    return { valid: false, error: 'Seules les lettres (A-Z) et chiffres (0-9) sont autorisés' };
  }
  return { valid: true };
}

function showCartePastefError(message) {
  const hint = $('#cartePastefHint');
  const input = $('#numeroCartePastef');
  if (hint) {
    hint.textContent = '⚠️ ' + message;
    hint.style.color = '#e74c3c';
  }
  if (input) input.classList.add('error-input');
}

function clearCartePastefError() {
  const hint = $('#cartePastefHint');
  const input = $('#numeroCartePastef');
  if (hint) {
    hint.textContent = '6 caractères — lettres (A-Z) et chiffres (0-9) uniquement';
    hint.style.color = '';
  }
  if (input) input.classList.remove('error-input');
}
  // ============================================
  // LOGIQUE CONDITIONNELLE
  // ============================================
  function setupConditionalFields() {

    // ─── CELLULE OUI/NON ───
    $$('input[name="appartientCellule"]').forEach(radio => {
      radio.addEventListener('change', e => {
        showSectionsAfterCellule();
        if (e.target.value === 'Oui') {
          $('#celluleOuiBlock').hidden = false;
          $('#celluleNonBlock').hidden = true;
          $('#cellule').required = true;
          $('#fonctionCellule').required = true;
        } else {
          $('#celluleOuiBlock').hidden = true;
          $('#celluleNonBlock').hidden = false;
          $('#cellule').required = false;
          $('#fonctionCellule').required = false;
          $('#cellule').value = '';
          $('#fonctionCellule').value = '';
          $('#celluleAutre').required = false;
          $('#celluleAutre').value = '';
          $('#celluleAutreWrap').hidden = true;
        }
      });
    });

    // ─── PAYS → Sénégal ou Étranger ───
    $('#pays').addEventListener('change', async (e) => {
      const paysId = e.target.value;
      const opt = e.target.selectedOptions[0];
      const isSenegal = opt && opt.dataset.senegal === 'true';
      const indicatif = opt ? opt.dataset.indicatif : null;

      const senegalFields = $('#senegalFields');
      const etrangerFields = $('#etrangerFields');
      const celluleSel = $('#cellule');
      const dialSel = $('#dialCode');
      const isMembre = document.querySelector('input[name="appartientCellule"]:checked');
      const isOui = isMembre && isMembre.value === 'Oui';

      // Auto-update indicatif
      if (indicatif && dialSel) {
        const exists = Array.from(dialSel.options).some(o => o.value === indicatif);
        if (exists) dialSel.value = indicatif;
      }

      // Reset
      senegalFields.hidden = true;
      etrangerFields.hidden = true;
      resetCascading();

      if (!paysId) {
        celluleSel.innerHTML = '<option value="">Sélectionnez d\'abord un pays</option>';
        celluleSel.disabled = true;
        return;
      }

      if (isSenegal) {
        senegalFields.hidden = false;
        $('#region').required = true;
        $('#departement').required = true;
        $('#commune').required = true;
        $('#villeDiaspora').required = false;

        // Remplir les régions
        const regions = PASTEF_DATA.getRegions();
        fillSelectFromRef($('#region'), regions, 'Sélectionnez votre région', 'nom');
        $('#region').disabled = false;

        if (isOui) {
          celluleSel.innerHTML = '<option value="">Choisissez d\'abord votre commune</option>';
          celluleSel.disabled = true;
        }
      } else {
        etrangerFields.hidden = false;
        $('#region').required = false;
        $('#departement').required = false;
        $('#commune').required = false;

        // ✅ ADAPTÉ : charger les villes diaspora depuis ref.villes_diaspora
        const villeSel = $('#villeDiaspora');
        const villeHint = $('#villeDiasporaHint');
        villeSel.innerHTML = '<option value="">Chargement…</option>';
        villeSel.disabled = true;

        const villes = await PASTEF_DATA.getVillesDiaspora(paysId);
        if (villes.length > 0) {
          fillSelectFromRef(villeSel, villes, 'Sélectionnez votre ville', 'nom');
          villeSel.innerHTML += '<option value="autre">Ma ville n\'est pas listée</option>';
          villeSel.disabled = false;
          villeSel.required = true;
          if (villeHint) villeHint.textContent = '';
        } else {
          villeSel.innerHTML = '<option value="">Aucune ville enregistrée</option>'
            + '<option value="autre">Saisir ma ville</option>';
          villeSel.disabled = false;
          villeSel.required = true;
          if (villeHint) villeHint.textContent = 'Aucune ville enregistrée pour ce pays. Saisissez la vôtre.';
        }

        if (isOui) {
          celluleSel.innerHTML = '<option value="">Sélectionnez d\'abord votre ville</option>';
          celluleSel.disabled = true;
        }
      }
    });

    // ─── VILLE DIASPORA → gestion "autre" + chargement cellules ───
    const villeDiasporaSel = $('#villeDiaspora');
    if (villeDiasporaSel) {
      villeDiasporaSel.addEventListener('change', async (e) => {
        const villeId = e.target.value;
        const autreWrap = $('#villeDiasporaAutreWrap');
        const autreInput = $('#villeDiasporaAutre');

        if (villeId === 'autre') {
          autreWrap.hidden = false;
          autreInput.required = true;
        } else {
          autreWrap.hidden = true;
          autreInput.required = false;
          autreInput.value = '';
        }

        // Charger les cellules si membre = Oui
        const isMembre = document.querySelector('input[name="appartientCellule"]:checked');
        if (!isMembre || isMembre.value !== 'Oui') return;

        const celluleSel = $('#cellule');
        const paysId = $('#pays').value;
        if (!paysId) return;

        celluleSel.innerHTML = '<option value="">Chargement…</option>';
        celluleSel.disabled = true;

        const filters = { pays_id: paysId };
        // Si c'est un UUID (pas "autre"), filtrer aussi par ville
        if (villeId && villeId !== 'autre' && /^[0-9a-f]{8}-/.test(villeId)) {
          filters.ville_id = villeId;
        }

        const cellules = await PASTEF_DATA.getCellules(filters);
        renderCelluleOptions(cellules, celluleSel);
      });
    }

    // ─── RÉGION → DÉPARTEMENTS ───
    $('#region').addEventListener('change', async (e) => {
      const regionId = e.target.value;
      const deptSel = $('#departement');
      const communeSel = $('#commune');
      const celluleSel = $('#cellule');

      communeSel.innerHTML = '<option value="">Sélectionnez d\'abord le département</option>';
      communeSel.disabled = true;

      const isMembre = document.querySelector('input[name="appartientCellule"]:checked');
      if (isMembre && isMembre.value === 'Oui') {
        celluleSel.innerHTML = '<option value="">Choisissez d\'abord votre commune</option>';
        celluleSel.disabled = true;
      }

      if (!regionId) {
        deptSel.innerHTML = '<option value="">Sélectionnez d\'abord la région</option>';
        deptSel.disabled = true;
        return;
      }

      deptSel.innerHTML = '<option value="">Chargement…</option>';
      deptSel.disabled = true;

      const depts = await PASTEF_DATA.getDepartements(regionId);
      if (depts.length > 0) {
        fillSelectFromRef(deptSel, depts, 'Sélectionnez votre département', 'nom');
        deptSel.disabled = false;
      } else {
        deptSel.innerHTML = '<option value="">Aucun département trouvé</option>';
        deptSel.disabled = true;
      }
    });

    // ─── DÉPARTEMENT → COMMUNES ───
    $('#departement').addEventListener('change', async (e) => {
      const deptId = e.target.value;
      const communeSel = $('#commune');
      const celluleSel = $('#cellule');

      const isMembre = document.querySelector('input[name="appartientCellule"]:checked');
      if (isMembre && isMembre.value === 'Oui') {
        celluleSel.innerHTML = '<option value="">Choisissez d\'abord votre commune</option>';
        celluleSel.disabled = true;
      }

      if (!deptId) {
        communeSel.innerHTML = '<option value="">Sélectionnez d\'abord le département</option>';
        communeSel.disabled = true;
        return;
      }

      communeSel.innerHTML = '<option value="">Chargement…</option>';
      communeSel.disabled = true;

      const communes = await PASTEF_DATA.getCommunes(deptId);
      if (communes.length > 0) {
        fillSelectFromRef(communeSel, communes, 'Sélectionnez votre commune', 'nom');
        communeSel.disabled = false;
      } else {
        communeSel.innerHTML = '<option value="">Aucune commune trouvée</option>';
        communeSel.disabled = true;
      }
    });

    // ─── COMMUNE → CELLULES (si OUI) ───
    $('#commune').addEventListener('change', async (e) => {
      const communeId = e.target.value;
      const celluleSel = $('#cellule');
      const isMembre = document.querySelector('input[name="appartientCellule"]:checked');
      if (!isMembre || isMembre.value !== 'Oui' || !communeId) return;

      celluleSel.innerHTML = '<option value="">Chargement…</option>';
      celluleSel.disabled = true;

      const cellules = await PASTEF_DATA.getCellules({ commune_id: communeId });
      renderCelluleOptions(cellules, celluleSel);
    });

    // ─── CELLULE → Autre ───
    $('#cellule').addEventListener('change', e => {
      const wrap = $('#celluleAutreWrap');
      const input = $('#celluleAutre');
      wrap.hidden = e.target.value !== 'autre';
      input.required = e.target.value === 'autre';
      if (e.target.value !== 'autre') input.value = '';
    });

    // ─── PROFESSION → Autre ───
    $('#profession').addEventListener('change', e => {
      const wrap = $('#professionAutreWrap');
      const input = $('#professionAutre');
      wrap.hidden = e.target.value !== 'Autre';
      input.required = e.target.value === 'Autre';
      if (e.target.value !== 'Autre') input.value = '';
    });

    // ─── DOMAINE → Autre (si ajouté dans le futur) ───
    $('#domaine').addEventListener('change', e => {
      const wrap = $('#domaineAutreWrap');
      const input = $('#domaineAutre');
      const opt = e.target.selectedOptions[0];
      const isAutre = opt && opt.dataset.code === 'AUTRE';
      wrap.hidden = !isAutre;
      input.required = isAutre;
      if (!isAutre) input.value = '';
    });

    // ─── CARTE ÉLECTEUR ───
    $$('input[name="possedeCarte"]').forEach(radio => {
      radio.addEventListener('change', e => {
        $('#carteElecteurField').hidden = e.target.value !== 'Oui';
      });
    });
        // ─── CARTE PASTEF ───
  // ─── CARTE PASTEF ───
$$('input[name="possedeCartePastef"]').forEach(radio => {
  radio.addEventListener('change', e => {
    const field = $('#cartePastefField');
    const input = $('#numeroCartePastef');
    if (e.target.value === 'Oui') {
      field.hidden = false;
      input.required = true;
    } else {
      field.hidden = true;
      input.required = false;
      input.value = '';
      clearCartePastefError();
    }
  });
});

    // ─── VALIDATION NUMÉRO CARTE PASTEF ───
    const cartePastefInput = $('#numeroCartePastef');
    if (cartePastefInput) {
      // Auto-majuscules + filtrage en temps réel
      cartePastefInput.addEventListener('input', (e) => {
        // Force majuscules et supprime tout ce qui n'est pas alphanumérique
        const cleaned = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (e.target.value !== cleaned) {
          e.target.value = cleaned;
        }
        clearCartePastefError();
      });

      // Validation au blur (quand l'utilisateur quitte le champ)
      cartePastefInput.addEventListener('blur', (e) => {
        const val = e.target.value.trim();
        if (!val) return; // vide = pas d'erreur ici (géré par required)
        
        const validation = validateCartePastef(val);
        if (!validation.valid) {
          showCartePastefError(validation.error);
        } else {
          clearCartePastefError();
        }
      });
    }

    // ─── DATE DE NAISSANCE → ÂGE ───
    $('#dateNaissance').addEventListener('change', e => {
      const age = calculateAge(e.target.value);
      const hint = $('#ageHint');
      if (age !== null && age >= 0 && age <= 120) {
        hint.textContent = `Âge : ${age} ans`;
        if (age < 18) {
          hint.textContent += ' — vous devez avoir 18 ans révolus';
          hint.style.color = 'var(--red)';
        } else {
          hint.style.color = 'var(--text-muted)';
        }
      } else {
        hint.textContent = '';
      }
    });

    // ─── DATE EXPIRATION ───
    const expInput = $('#dateExpiration');
    if (expInput) {
      expInput.addEventListener('change', e => {
        const hint = $('#expirationHint');
        if (e.target.value) {
          hint.textContent = new Date(e.target.value) < new Date() ? '⚠️ Pièce expirée' : '';
          hint.style.color = 'var(--red)';
        } else {
          hint.textContent = '';
        }
      });
    }

    // ─── RÉSEAUX SOCIAUX : Aucun décoche les autres ───
    document.addEventListener('change', e => {
      if (e.target.name !== 'reseaux') return;
      if (e.target.value === 'aucun' && e.target.checked) {
        $$('input[name="reseaux"]').forEach(cb => {
          if (cb.value !== 'aucun') cb.checked = false;
        });
      } else if (e.target.value !== 'aucun' && e.target.checked) {
        const aucun = document.querySelector('input[name="reseaux"][value="aucun"]');
        if (aucun) aucun.checked = false;
      }
    });
  }

  function renderCelluleOptions(cellules, celluleSel) {
    if (cellules.length === 0) {
      celluleSel.innerHTML = '<option value="">Aucune cellule trouvée</option>'
        + '<option value="autre">Autre cellule (préciser)</option>';
      celluleSel.disabled = false;
      return;
    }
    let html = '<option value="">Sélectionnez votre cellule</option>';
    cellules.forEach(c => {
      html += `<option value="${esc(c.id)}" data-nom="${esc(c.nom)}">${esc(c.nom)}</option>`;
    });
    html += '<option value="autre">Autre cellule (préciser)</option>';
    celluleSel.innerHTML = html;
    celluleSel.disabled = false;
  }

  function resetCascading() {
    const region = $('#region');
    const dept = $('#departement');
    const commune = $('#commune');
    const villeDiaspora = $('#villeDiaspora');

    region.innerHTML = '<option value="">Sélectionnez votre région</option>';
    region.disabled = true;
    dept.innerHTML = '<option value="">Sélectionnez d\'abord la région</option>';
    dept.disabled = true;
    commune.innerHTML = '<option value="">Sélectionnez d\'abord le département</option>';
    commune.disabled = true;
    region.required = false;
    dept.required = false;
    commune.required = false;

    // ✅ Reset ville diaspora
    if (villeDiaspora) {
      villeDiaspora.innerHTML = '<option value="">Sélectionnez d\'abord le pays</option>';
      villeDiaspora.disabled = true;
      villeDiaspora.required = false;
    }
    const autreWrap = $('#villeDiasporaAutreWrap');
    if (autreWrap) autreWrap.hidden = true;
    const autreInput = $('#villeDiasporaAutre');
    if (autreInput) { autreInput.required = false; autreInput.value = ''; }
  }

  // ============================================
  // VALIDATION TÉLÉPHONE
  // ============================================
  function validatePhoneNumber(dialCode, phoneNumber) {
    const cleaned = phoneNumber.replace(/[\s\-()+]/g, '');
    const config = PASTEF_DATA.phoneFormats[dialCode];
    if (!config) {
      return /^\d{7,15}$/.test(cleaned)
        ? { valid: true }
        : { valid: false, error: 'Numéro invalide (7 à 15 chiffres)' };
    }
    if (!config.pattern.test(cleaned)) {
      return { valid: false, error: `Format invalide. Exemple : ${config.format}` };
    }
    return { valid: true };
  }

  function showPhoneError(fieldId, message) {
    let el = document.querySelector(`#${fieldId}-error`);
    if (!el) {
      el = document.createElement('span');
      el.id = `${fieldId}-error`;
      el.className = 'error-message';
      el.style.cssText = 'color:#e74c3c;font-size:12px;margin-top:4px;display:block';
      const input = document.getElementById(fieldId);
      if (input && input.parentNode) input.parentNode.insertBefore(el, input.nextSibling);
    }
    el.textContent = message;
    document.getElementById(fieldId)?.classList.add('error-input');
  }

  function clearPhoneError(fieldId) {
    const el = document.querySelector(`#${fieldId}-error`);
    if (el) el.textContent = '';
    document.getElementById(fieldId)?.classList.remove('error-input');
  }

  function setupPhoneValidation() {
    const dialMain = $('#dialCode'), telMain = $('#telephone');
    if (telMain) {
      ['blur', 'change'].forEach(evt => {
        telMain.addEventListener(evt, () => {
          const dc = dialMain ? dialMain.value : '+221';
          if (telMain.value && dc) {
            const v = validatePhoneNumber(dc, telMain.value);
            v.valid ? clearPhoneError('telephone') : showPhoneError('telephone', v.error);
          }
        });
      });
    }
  }

  // ============================================
  // VALIDATION FORMULAIRE
  // ============================================
  function validateForm() {
    const form = $('#enrolmentForm');
    let valid = true;
    let firstError = null;

    $$('.field.has-error').forEach(f => f.classList.remove('has-error'));
    $$('.error-message').forEach(e => e.remove());

    form.querySelectorAll('[required]').forEach(input => {
      if (input.type === 'radio') {
        if (!form.querySelector(`input[name="${input.name}"]:checked`)) {
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
        if (input.closest('[hidden]') || input.disabled) return;
        const field = input.closest('.field');
        if (field) field.classList.add('has-error');
        valid = false;
        if (!firstError) firstError = input;
      }
    });

    // Validation âge
    const dob = $('#dateNaissance').value;
    if (dob && calculateAge(dob) < 18) {
      const field = $('#dateNaissance').closest('.field');
      field.classList.add('has-error');
      showFieldError($('#dateNaissance'), 'Vous devez avoir 18 ans révolus');
      valid = false;
      if (!firstError) firstError = $('#dateNaissance');
    }
// Validation téléphone
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

    // ✅ Validation carte PASTEF (AVANT le scroll)
    const possedeCartePastef = document.querySelector('input[name="possedeCartePastef"]:checked');
    if (possedeCartePastef && possedeCartePastef.value === 'Oui') {
      const cartePastefVal = $('#numeroCartePastef').value.trim();
      if (cartePastefVal) {
        const v = validateCartePastef(cartePastefVal);
        if (!v.valid) {
          const field = $('#numeroCartePastef').closest('.field');
          if (field) field.classList.add('has-error');
          showCartePastefError(v.error);
          valid = false;
          if (!firstError) firstError = $('#numeroCartePastef');
        }
      }
    }

    // ✅ Scroll vers la première erreur (APRÈS toutes les validations)
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => firstError.focus(), 300);
    }

    return valid;
  }

  function showFieldError(input, message) {
    const field = input.closest('.field');
    if (!field || field.querySelector('.error-message')) return;
    const err = document.createElement('span');
    err.className = 'error-message';
    err.textContent = message;
    field.appendChild(err);
  }

  // ============================================
  // COLLECTE DES DONNÉES (format schéma normalisé)
  // ============================================
  function collectFormData() {
    const form = $('#enrolmentForm');
    const fd = new FormData(form);

    const paysId = fd.get('pays');
    const paysOpt = $('#pays').selectedOptions[0];
    const isSenegal = paysOpt && paysOpt.dataset.senegal === 'true';
    const indicatif = paysOpt ? paysOpt.dataset.indicatif : '+221';

    const telLocal = (fd.get('telephone') || '').replace(/\s+/g, ' ').trim();

    // Cellule
    const celluleVal = fd.get('cellule') || '';
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(celluleVal);
    const celluleId = isUUID ? celluleVal : null;
    const celluleAutre = fd.get('celluleAutre')?.trim() || null;

    // Appartient à une cellule
    const appartient = fd.get('appartientCellule') === 'Oui';

    // Mode enrôlement
    const modeTextId = PASTEF_DATA.getModeEnrolementId('TEXT');

    // ✅ Ville diaspora : UUID ou null
    let villeDiasporaId = null;
    if (!isSenegal) {
      const villeVal = fd.get('villeDiaspora') || '';
      if (villeVal && villeVal !== 'autre' && /^[0-9a-f]{8}-/.test(villeVal)) {
        villeDiasporaId = villeVal;
      }
    }

    // ✅ Nationalité : UUID depuis ref.pays
    const nationaliteId = fd.get('nationalite') || SENEGAL_ID;

    // Réseaux sociaux cochés (UUIDs)
    const reseauxIds = [];
    $$('input[name="reseaux"]:checked').forEach(cb => {
      if (cb.value !== 'aucun') reseauxIds.push(cb.value);
    });

    // ─── Payload principal : table patriotes ───
    const patriote = {
      prenom: fd.get('prenom')?.trim(),
      nom: fd.get('nom')?.trim(),
      date_naissance: fd.get('dateNaissance'),
      sexe_id: fd.get('sexe') || null,
      lieu_naissance: fd.get('lieuNaissance')?.trim(),
      nationalite_id: nationaliteId,               // ✅ UUID ref.pays

      pays_residence_id: paysId || null,
      region_id: isSenegal ? (fd.get('region') || null) : null,
      departement_id: isSenegal ? (fd.get('departement') || null) : null,
      commune_id: isSenegal ? (fd.get('commune') || null) : null,
      ville_diaspora_id: villeDiasporaId,           // ✅ UUID ref.villes_diaspora

      cellule_id: celluleId,
      statut_cellule: appartient && celluleId ? 'AUTO' : 'EN_ATTENTE',
      fait_partie_cellule: appartient,
      fonction_parti_id: fd.get('fonctionCellule') || null,

      indicatif: indicatif,
      telephone: telLocal,

      pays_piece_id: fd.get('paysEmetteur') || null,
      type_piece_id: fd.get('typePiece') || null,
      numero_piece: fd.get('numeroPiece')?.trim() || null,
      date_delivrance: fd.get('dateDelivrance') || null,
      date_expiration: fd.get('dateExpiration') || null,

      a_carte_electeur: fd.get('possedeCarte') === 'Oui',
      numero_carte_electeur: fd.get('numeroCartElecteur')?.trim() || null,

      a_carte_pastef: fd.get('possedeCartePastef') === 'Oui',
      numero_carte_pastef: fd.get('numeroCartePastef')?.trim().toUpperCase() || null,

      profession: fd.get('profession') === 'Autre'
        ? fd.get('professionAutre')?.trim()
        : fd.get('profession'),
      domaine_id: fd.get('domaine') || null,

      engagement_soutenir: !!fd.get('engagement1'),
      engagement_participer: !!fd.get('engagement2'),
      engagement_oeuvrer: !!fd.get('engagement3'),

      mode_enrolement_id: modeTextId,
    };

    // ─── Payload présence numérique ───
    const niveauActiviteId = fd.get('niveauActivite') || null;
    const typeUsageId = fd.get('typeUsage') || null;

    const presenceNumerique = (reseauxIds.length > 0 || niveauActiviteId || typeUsageId) ? {
      niveau_activite_id: niveauActiviteId,
      type_usage_id: typeUsageId,
    } : null;

    return {
      patriote,
      presenceNumerique,
      reseauxIds,
      celluleAutre,
      villeDiasporaAutre: fd.get('villeDiasporaAutre')?.trim() || null, // ✅ pour traitement futur
      meta: {
        client_id: getClientId(),
        user_agent: navigator.userAgent,
        submitted_at: new Date().toISOString(),
      },
    };
  }

  // ============================================
  // ENVOI VERS SUPABASE (multi-tables)
  // ============================================
  async function sendToSupabase(data) {
    const sb = window.PASTEF.supabase;
    if (!sb) throw new Error('Client Supabase non initialisé');

    // 1. Insérer le patriote
    const { data: patrioteResult, error: patrioteError } = await sb
      .from('patriotes')
      .insert(data.patriote)
      .select('id')
      .single();

    if (patrioteError) throw new Error('Patriote: ' + patrioteError.message);

    const patrioteId = patrioteResult.id;

    // 2. Insérer la présence numérique (si données)
    if (data.presenceNumerique) {
      const { error: pnError } = await sb
        .from('presence_numerique')
        .insert({ ...data.presenceNumerique, patriote_id: patrioteId });

      if (pnError) console.warn('Présence numérique:', pnError.message);
    }

    // 3. Insérer les réseaux sociaux (many-to-many)
    if (data.reseauxIds.length > 0) {
      const rows = data.reseauxIds.map(rsId => ({
        patriote_id: patrioteId,
        reseau_social_id: rsId,
      }));

      const { error: rsError } = await sb
        .from('patriote_reseaux')
        .insert(rows);

      if (rsError) console.warn('Réseaux sociaux:', rsError.message);
    }

    return patrioteId;
  }

  // ============================================
  // STOCKAGE LOCAL (hors-ligne)
  // ============================================
  function getPending() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function savePending(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    updateNetworkBanner();
  }

  function addToPending(data) {
    const pending = getPending();
    pending.push({
      ...data,
      local_id: 'loc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      saved_at: new Date().toISOString(),
    });
    savePending(pending);
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

    let sent = 0, failed = 0;
    const remaining = [];
    for (const entry of pending) {
      try {
        await sendToSupabase(entry);
        sent++;
      } catch (err) {
        console.error('[Sync]', err);
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

    if (sent > 0) showToast(`${sent} enrôlement(s) synchronisé(s)`, 'success');
    if (failed > 0) showToast(`${failed} échec(s) — réessayez plus tard`, 'warning');
    return { sent, failed };
  }

  // ============================================
  // SOUMISSION
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
        showSuccessModal('Enregistré hors-ligne', 'Vos données sont sauvegardées. Elles seront envoyées dès le retour du réseau.');
      }
      resetForm();
    } catch (err) {
      console.error(err);
      addToPending(data);
      showSuccessModal('Sauvegardé localement',
        `L'envoi direct a échoué (${err.message.slice(0, 80)}). Vos données sont en sécurité.`);
      resetForm();
    } finally {
      isSubmitting = false;
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  }

  function resetForm() {
    $('#enrolmentForm').reset();

    // Masquer sections conditionnelles
    ['celluleOuiBlock', 'celluleNonBlock', 'residenceSection', 'contactSection',
    'pieceSection', 'electeurSection', 'cartePastefSection', 'professionSection',  // ✅ AJOUT
    'engagementSection', 'numeriqueSection', 'submitSection', 'securityNotice',
    'senegalFields', 'etrangerFields', 'professionAutreWrap', 'domaineAutreWrap',
    'celluleAutreWrap', 'carteElecteurField', 'cartePastefField',  // ✅ AJOUT
    'villeDiasporaAutreWrap'
  ].forEach(id => { const el = $('#' + id); if (el) el.hidden = true; });

    $('#ageHint').textContent = '';
    if ($('#expirationHint')) $('#expirationHint').textContent = '';

    resetCascading();
    $('#cellule').disabled = true;
    $('#cellule').innerHTML = '<option value="">Sélectionnez d\'abord votre zone</option>';
    $('#dialCode').value = '+221';
    clearPhoneError('telephone');

    // Remettre Sénégal sélectionné par défaut dans nationalité
    if (SENEGAL_ID && $('#nationalite')) {
      $('#nationalite').value = SENEGAL_ID;
    }
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
    banner.hidden = false;
    text.textContent = message;
    banner.className = 'network-banner ' + (type === 'success' ? 'online' : '');
    setTimeout(() => updateNetworkBanner(), 3500);
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
        text.innerHTML = `Connexion rétablie — <strong>${total}</strong> ${label} <em style="opacity:.75;font-style:normal;font-weight:600;">(toucher pour synchroniser)</em>`;
      } else {
        banner.hidden = true;
      }
    } else {
      banner.hidden = false;
      banner.className = 'network-banner';
      text.textContent = total > 0
        ? `Hors-ligne — ${total} enrôlement(s) sauvegardé(s) localement`
        : 'Hors-ligne — vos données sont sauvegardées localement';
    }
  }

  // ============================================
  // VOCAL (même structure qu'avant)
  // ============================================
  let voiceTimerInterval = null;
  let voiceSeconds = 0;
  let voiceAudioElement = null;

  function formatTime(s) {
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / 1048576).toFixed(1) + ' Mo';
  }

  function openVoiceModal() {
    $('#voiceModal').hidden = false;
    $('#voiceError').hidden = true;
    resetVoiceUI();
    const src = $('#dialCode'), dst = $('#voiceDialCode');
    if (src && dst && dst.options.length === 0) { dst.innerHTML = src.innerHTML; dst.value = src.value; }
  }

  function closeVoiceModal() {
    if (PASTEF_AUDIO.getState() === 'recording') PASTEF_AUDIO.stopRecording();
    if (voiceAudioElement) { voiceAudioElement.pause(); URL.revokeObjectURL(voiceAudioElement.src); voiceAudioElement = null; }
    clearInterval(voiceTimerInterval);
    $('#voiceModal').hidden = true;
  }

  async function handleStartRecording() {
    try {
      $('#voiceError').hidden = true;
      const p = PASTEF_AUDIO.startRecording();
      $('#voiceStatus').textContent = 'Enregistrement en cours…';
      $('#voiceStatus').classList.add('recording');
      $('#voiceTimer').classList.add('recording');
      $('#recordBtn').classList.add('recording');
      $('#recordIcon').innerHTML = '<rect x="6" y="6" width="12" height="12" rx="2" ry="2" fill="white"/>';
      $('#recordHint').textContent = 'Appuyez à nouveau pour arrêter';
      voiceSeconds = 0;
      $('#voiceTimer').textContent = '00:00';
      voiceTimerInterval = setInterval(() => { voiceSeconds++; $('#voiceTimer').textContent = formatTime(voiceSeconds); }, 1000);
      const result = await p;
      clearInterval(voiceTimerInterval);
      showPreview(result);
    } catch (err) {
      clearInterval(voiceTimerInterval);
      $('#voiceError').hidden = false;
      $('#voiceError').textContent = err.name === 'NotAllowedError'
        ? 'Vous devez autoriser l\'accès au microphone.'
        : 'Erreur : ' + err.message;
      resetVoiceUI();
    }
  }

  function resetVoiceUI() {
    $('#voiceStatus').textContent = 'Appuyez sur le micro pour démarrer';
    $('#voiceStatus').classList.remove('recording');
    $('#voiceTimer').textContent = '00:00';
    $('#voiceTimer').classList.remove('recording');
    $('#recordBtn').classList.remove('recording');
    $('#recordIcon').innerHTML = '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>';
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
    if (voiceAudioElement) { voiceAudioElement.pause(); URL.revokeObjectURL(voiceAudioElement.src); }
    voiceAudioElement = new Audio(URL.createObjectURL(blob));
    voiceAudioElement.addEventListener('timeupdate', () => {
      if (!voiceAudioElement?.duration) return;
      $('#audioProgressBar').style.width = ((voiceAudioElement.currentTime / voiceAudioElement.duration) * 100) + '%';
      $('#audioCurrentTime').textContent = formatTime(Math.floor(voiceAudioElement.currentTime));
    });
    voiceAudioElement.addEventListener('ended', () => {
      $('#playIcon').innerHTML = '<path d="M8 5v14l11-7z"/>';
      $('#audioProgressBar').style.width = '0%';
      $('#audioCurrentTime').textContent = '00:00';
    });
    $('#audioProgressWrap').addEventListener('click', function (e) {
      if (!voiceAudioElement?.duration) return;
      const rect = this.getBoundingClientRect();
      voiceAudioElement.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * voiceAudioElement.duration;
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
        telephone_local: $('#voiceTel').value,
      });
      await updateNetworkBanner();
      closeVoiceModal();
      showToast('Enregistrement vocal sauvegardé ✓', 'success');
      if (navigator.onLine) setTimeout(() => syncPending(), 500);
    } catch (err) {
      showToast('Erreur sauvegarde : ' + err.message, 'warning');
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg> Envoyer';
    }
  }

  function setupVoiceModal() {
    $('#voiceFab').addEventListener('click', openVoiceModal);
    $('#voiceModalClose').addEventListener('click', closeVoiceModal);
    $('#voiceModal').addEventListener('click', e => { if (e.target.id === 'voiceModal') closeVoiceModal(); });
    $('#recordBtn').addEventListener('click', () => {
      PASTEF_AUDIO.getState() === 'recording' ? PASTEF_AUDIO.stopRecording() : handleStartRecording();
    });
    $('#voiceRedoBtn').addEventListener('click', () => {
      if (voiceAudioElement) { voiceAudioElement.pause(); URL.revokeObjectURL(voiceAudioElement.src); voiceAudioElement = null; }
      PASTEF_AUDIO.cancelRecording();
      resetVoiceUI();
    });
    $('#voiceSaveBtn').addEventListener('click', handleSaveVoice);
    $('#playBtn').addEventListener('click', togglePlayback);
  }

  // ============================================
  // INITIALISATION
  // ============================================
  async function init() {
    try {
      await initSelects();
    } catch (err) {
      console.error('[PASTEF] Erreur init selects:', err);
    }

    setupConditionalFields();
    setupPhoneValidation();
    setupVoiceModal();
    updateNetworkBanner();

    $('#enrolmentForm').addEventListener('submit', handleSubmit);
    $('#networkBanner').addEventListener('click', () => { if (navigator.onLine) syncPending(); });
    $('#modalCloseBtn').addEventListener('click', closeSuccessModal);

    window.addEventListener('online', () => {
      isOnline = true;
      updateNetworkBanner();
      const n = getPending().length;
      PASTEF_AUDIO.countRecordings().then(a => { if (n + a > 0) syncPending(); });
    });
    window.addEventListener('offline', () => { isOnline = false; updateNetworkBanner(); });

    const today = new Date().toISOString().split('T')[0];
    $('#dateNaissance').setAttribute('max', today);
    $('#dateNaissance').setAttribute('min', '1900-01-01');

    console.log('[PASTEF] Formulaire initialisé — v3 (schéma normalisé)');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
