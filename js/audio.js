/* ============================================
   PASTEF — Module Audio
   - Enregistrement via MediaRecorder
   - Compatible iOS Safari (audio/mp4) + Android/Chrome (audio/webm)
   - Stockage IndexedDB hors-ligne
   - Sync Supabase Storage + table enrolments
   - Gestion des erreurs partielles (upload OK / insert KO)
   - Limite de retry pour éviter les boucles infinies
   ============================================ */

(function() {
  'use strict';

  // ============================================
  // INDEXEDDB
  // ============================================
  const DB_NAME    = 'pastef_audio_db';
  const DB_VERSION = 2; // ← version 2 : ajout retry_count + upload_path
  const STORE      = 'recordings';

  const MAX_BLOB_SIZE_MB = 20; // limite upload (bucket Supabase = 25 MB)
  const MAX_RETRY        = 5;  // nombre max de tentatives avant abandon

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = e => {
        const db = e.target.result;
        // Créer le store s'il n'existe pas
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('created_at', 'created_at', { unique: false });
        }
        // Migration v1 → v2 : les anciens enregistrements n'ont pas retry_count
        // IndexedDB gère ça automatiquement (champ absent = undefined → on défausse à 0)
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror  = () => reject(req.error);
    });
  }

  async function dbSave(record) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve(record);
      tx.onerror    = () => reject(tx.error);
    });
  }

  async function dbGetAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = () => reject(req.error);
    });
  }

  async function dbDelete(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  }

  async function dbUpdate(id, changes) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const req   = store.get(id);
      req.onsuccess = () => {
        const record = req.result;
        if (!record) return resolve(null);
        Object.assign(record, changes);
        store.put(record);
        tx.oncomplete = () => resolve(record);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async function dbCount() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }

  // ============================================
  // DÉTECTION PLATEFORME
  // ============================================
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function isAndroid() {
    return /Android/.test(navigator.userAgent);
  }

  // ============================================
  // UPLOAD VERS SUPABASE STORAGE
  // Retourne le path stocké dans le bucket
  // Lance une exception si échec
  // ============================================
  async function uploadAudioToStorage(blob, filename) {
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg || cfg.url.includes('VOTRE-PROJET')) {
      throw new Error('Configuration Supabase manquante');
    }

    // Vérification taille avant envoi
    const sizeMB = blob.size / (1024 * 1024);
    if (sizeMB > MAX_BLOB_SIZE_MB) {
      throw new Error(`Fichier trop volumineux (${sizeMB.toFixed(1)} Mo > ${MAX_BLOB_SIZE_MB} Mo)`);
    }

    const bucket = cfg.audioBucket || 'enrolments-audio';
    const path   = `${bucket}/${filename}`;
    const url    = `${cfg.url}/storage/v1/object/${path}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey'        : cfg.anonKey,
        'Authorization' : `Bearer ${cfg.anonKey}`,
        'Content-Type'  : blob.type || 'audio/mp4',
        'x-upsert'      : 'false'
      },
      body: blob
    });

    if (!response.ok) {
      const txt = await response.text().catch(() => '');
      // 409 = fichier déjà uploadé (doublon) → on considère comme succès
      if (response.status === 409) {
        console.warn('[Audio] Fichier déjà présent dans le bucket :', filename);
        return path;
      }
      throw new Error(`Upload audio (${response.status}): ${txt}`);
    }

    return path;
  }

  // ============================================
  // INSERTION EN BASE (table enrolments)
  // ============================================
  async function createAudioEnrolmentRecord(record, storagePath) {
    const cfg = window.SUPABASE_CONFIG;

    const payload = {
      // Audio
      has_audio            : true,
      audio_path           : storagePath,
      transcription_status : 'pending',
      audio_duration_sec   : record.duration_sec,

      // Identité capturée à l'enregistrement (peut être partielle)
      prenom         : (record.nom || '').trim() || 'À transcrire',
      nom            : 'À transcrire',
      date_naissance : '1900-01-01',   // placeholder — sera mis à jour après transcription
      sexe           : 'À transcrire',
      lieu_naissance : 'À transcrire',
      telephone      : record.telephone_complet || 'À transcrire',
      telephone_indicatif : record.telephone_indicatif || null,
      telephone_local     : record.telephone_local     || null,

      // Champs requis non connus → placeholder
      profession        : 'À transcrire',
      domaine           : 'À transcrire',
      pays              : 'À transcrire',
      region            : 'À transcrire',
      quartier          : 'À transcrire',
      appartient_cellule: 'à_déterminer',

      // Engagements non applicables pour l'audio
      engagement_soutenir  : false,
      engagement_participer: false,
      engagement_oeuvrer   : false,
      certification        : false,

      // Métadonnées
      client_id   : record.client_id,
      user_agent  : navigator.userAgent,
      submitted_at: record.created_at
    };

    const response = await fetch(`${cfg.url}/rest/v1/${cfg.table}`, {
      method : 'POST',
      headers: {
        'apikey'       : cfg.anonKey,
        'Authorization': `Bearer ${cfg.anonKey}`,
        'Content-Type' : 'application/json',
        'Prefer'       : 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const txt = await response.text().catch(() => '');
      throw new Error(`INSERT audio (${response.status}): ${txt}`);
    }

    return true;
  }

  // ============================================
  // SYNCHRONISATION AUDIO
  //
  // Flux en 3 étapes pour éviter les pertes :
  //   1) Upload blob → Supabase Storage  → on note upload_path dans IndexedDB
  //   2) INSERT row → table enrolments   → si OK, on supprime d'IndexedDB
  //   3) Si upload OK mais INSERT KO     → on retente l'INSERT à la prochaine sync
  //      (pas de re-upload car upload_path est déjà stocké)
  // ============================================
  async function syncAllAudio() {
    const all = await dbGetAll();
    if (!all.length) return { sent: 0, failed: 0, abandoned: 0 };

    let sent      = 0;
    let failed    = 0;
    let abandoned = 0;

    for (const rec of all) {
      const retryCount = rec.retry_count || 0;

      // Abandon après MAX_RETRY tentatives (fichier corrompu ou erreur permanente)
      if (retryCount >= MAX_RETRY) {
        console.warn('[Audio Sync] Abandon après', MAX_RETRY, 'tentatives :', rec.id);
        await dbDelete(rec.id);
        abandoned++;
        continue;
      }

      try {
        let storagePath = rec.upload_path || null;

        // Étape 1 : Upload si pas encore fait
        if (!storagePath) {
          const filename = `${rec.id}.${rec.extension || 'mp4'}`;
          storagePath    = await uploadAudioToStorage(rec.blob, filename);
          // On sauvegarde le path immédiatement → si l'INSERT plante après,
          // la prochaine sync saute directement à l'étape 2
          await dbUpdate(rec.id, { upload_path: storagePath, retry_count: retryCount + 1 });
        }

        // Étape 2 : INSERT en base
        await createAudioEnrolmentRecord(rec, storagePath);

        // Tout OK → supprimer d'IndexedDB
        await dbDelete(rec.id);
        sent++;

      } catch (err) {
        console.error('[Audio Sync] Échec (tentative', retryCount + 1, '/', MAX_RETRY, ')', rec.id, err.message);
        // Incrémenter le compteur de retry
        await dbUpdate(rec.id, { retry_count: retryCount + 1 }).catch(() => {});
        failed++;
      }
    }

    return { sent, failed, abandoned };
  }

  // ============================================
  // SÉLECTION DU FORMAT AUDIO
  // ============================================
  function pickMimeType() {
    const candidates = isIOS()
      ? ['audio/mp4', 'audio/aac', 'audio/mp4;codecs=mp4a.40.2']
      : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg'];

    if (typeof MediaRecorder === 'undefined') return '';

    for (const m of candidates) {
      try {
        if (MediaRecorder.isTypeSupported(m)) return m;
      } catch (e) { /* Safari peut throw */ }
    }
    return '';
  }

  function mimeToExtension(mime) {
    if (!mime) return isIOS() ? 'm4a' : 'webm';
    if (mime.includes('mp4') || mime.includes('aac')) return 'm4a';
    if (mime.includes('webm')) return 'webm';
    if (mime.includes('ogg'))  return 'ogg';
    if (mime.includes('mpeg')) return 'mp3';
    return isIOS() ? 'm4a' : 'webm';
  }

  // ============================================
  // ENREGISTREMENT (MediaRecorder)
  // ============================================
  const recorder = {
    mediaRecorder : null,
    stream        : null,
    chunks        : [],
    startTime     : 0,
    state         : 'idle', // idle | recording | preview
    lastBlob      : null,
    lastDuration  : 0,
    lastExtension : 'm4a'
  };

  function isSupported() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      typeof MediaRecorder !== 'undefined'
    );
  }

  async function startRecording() {
    if (!isSupported()) {
      throw new Error('Votre navigateur ne supporte pas l\'enregistrement audio');
    }

    const constraints = isIOS()
      ? { audio: { echoCancellation: true, noiseSuppression: true } }
      : { audio: true };

    recorder.stream = await navigator.mediaDevices.getUserMedia(constraints);
    const mimeType  = pickMimeType();

    try {
      recorder.mediaRecorder = mimeType
        ? new MediaRecorder(recorder.stream, { mimeType })
        : new MediaRecorder(recorder.stream);
    } catch (e) {
      console.warn('[Audio] mimeType rejeté, fallback :', e.message);
      recorder.mediaRecorder = new MediaRecorder(recorder.stream);
    }

    recorder.chunks       = [];
    recorder.lastExtension = mimeToExtension(recorder.mediaRecorder.mimeType);

    recorder.mediaRecorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) recorder.chunks.push(e.data);
    };

    return new Promise((resolve, reject) => {
      recorder.mediaRecorder.onerror = e => {
        reject(new Error('Erreur enregistrement : ' + (e.error?.message || 'inconnue')));
      };

      recorder.mediaRecorder.onstop = () => {
        const mimeUsed = recorder.mediaRecorder.mimeType || (isIOS() ? 'audio/mp4' : 'audio/webm');
        const blob     = new Blob(recorder.chunks, { type: mimeUsed });

        recorder.lastBlob     = blob;
        recorder.lastDuration = Math.round((Date.now() - recorder.startTime) / 1000);
        recorder.state        = 'preview';

        if (recorder.stream) {
          recorder.stream.getTracks().forEach(t => t.stop());
          recorder.stream = null;
        }

        resolve({ blob, duration: recorder.lastDuration, extension: recorder.lastExtension });
      };

      // iOS a besoin d'un timeslice pour ne pas perdre les chunks
      if (isIOS()) {
        recorder.mediaRecorder.start(1000);
      } else {
        recorder.mediaRecorder.start();
      }

      recorder.startTime = Date.now();
      recorder.state     = 'recording';
    });
  }

  function stopRecording() {
    if (recorder.mediaRecorder && recorder.mediaRecorder.state !== 'inactive') {
      recorder.mediaRecorder.stop();
    }
  }

  function cancelRecording() {
    if (recorder.stream) {
      recorder.stream.getTracks().forEach(t => t.stop());
      recorder.stream = null;
    }
    recorder.mediaRecorder = null;
    recorder.chunks        = [];
    recorder.state         = 'idle';
    recorder.lastBlob      = null;
  }

  function getElapsedSeconds() {
    if (recorder.state !== 'recording') return 0;
    return Math.floor((Date.now() - recorder.startTime) / 1000);
  }

  // ============================================
  // SAUVEGARDE LOCALE (IndexedDB)
  // ============================================
  function getClientId() {
    let id = localStorage.getItem('pastef_client_id');
    if (!id) {
      id = 'cli_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('pastef_client_id', id);
    }
    return id;
  }

  async function saveRecording({ blob, duration, extension, nom, telephone_indicatif, telephone_local }) {
    // Vérification taille avant de stocker en local
    const sizeMB = blob.size / (1024 * 1024);
    if (sizeMB > MAX_BLOB_SIZE_MB) {
      throw new Error(`Enregistrement trop long (${sizeMB.toFixed(1)} Mo). Limitez à ${MAX_BLOB_SIZE_MB} Mo.`);
    }

    const id       = 'aud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    const telLocal = (telephone_local || '').trim();
    const telComplet = telLocal ? `${telephone_indicatif || '+221'} ${telLocal}` : null;

    const record = {
      id,
      blob,
      extension,
      mime        : blob.type,
      size_bytes  : blob.size,
      duration_sec: duration,
      nom         : (nom || '').trim() || null,
      telephone_indicatif : telLocal ? telephone_indicatif : null,
      telephone_local     : telLocal || null,
      telephone_complet   : telComplet,
      client_id   : getClientId(),
      created_at  : new Date().toISOString(),
      // Champs de suivi sync
      retry_count : 0,
      upload_path : null  // sera rempli après l'upload Supabase Storage
    };

    await dbSave(record);
    return record;
  }

  // ============================================
  // EXPORT
  // ============================================
  window.PASTEF_AUDIO = {
    // Enregistrement
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    getElapsedSeconds,
    // Stockage local
    saveRecording,
    getAllRecordings : dbGetAll,
    deleteRecording  : dbDelete,
    countRecordings  : dbCount,
    // Sync vers Supabase
    syncAll : syncAllAudio,
    // État courant
    getState        : () => recorder.state,
    getLastBlob     : () => recorder.lastBlob,
    getLastDuration : () => recorder.lastDuration,
    getLastExtension: () => recorder.lastExtension,
    // Debug
    isIOS,
    isAndroid
  };

})();