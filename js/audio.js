/* ============================================
   PASTEF — Module Audio v2
   Adapté au schéma normalisé :
   - Crée un patriote minimal (mode_enrolement = AUDIO)
   - Puis insère dans enrolements_audio
   ============================================ */

(function () {
  'use strict';

  // ─── IndexedDB ───
  const DB_NAME = 'pastef_audio_db';
  const DB_VERSION = 3;
  const STORE = 'recordings';
  const MAX_BLOB_SIZE_MB = 20;
  const MAX_RETRY = 5;

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('created_at', 'created_at', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbSave(record) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete = () => resolve(record);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function dbGetAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbDelete(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function dbUpdate(id, changes) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const req = store.get(id);
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
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // ─── Plateforme ───
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  // ─── Upload Storage ───
  async function uploadAudioToStorage(blob, filename) {
  // ─── 2. Construire l'URL publique ───
const cfg = window.SUPABASE_CONFIG;
const bucket = cfg.audioBucket || 'enrolments-audio';
const cleanPath = storagePath.startsWith(bucket + '/')
  ? storagePath.slice(bucket.length + 1)
  : storagePath;
const fichierUrl = `${cfg.url}/storage/v1/object/public/${bucket}/${cleanPath}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': cfg.anonKey,
        'Authorization': `Bearer ${cfg.anonKey}`,
        'Content-Type': blob.type || 'audio/mp4',
        'x-upsert': 'false',
      },
      body: blob,
    });

    if (!response.ok) {
      if (response.status === 409) return path; // déjà uploadé
      const txt = await response.text().catch(() => '');
      throw new Error(`Upload audio (${response.status}): ${txt}`);
    }
    return path;
  }

  // ─── Création patriote minimal + enrolements_audio ───
  // ─── Création patriote minimal + enrolements_audio ───
async function createAudioEnrolment(record, storagePath) {
  const sb = window.PASTEF?.supabase;
  if (!sb) throw new Error('Client Supabase non initialisé');

  // ─── Récupération des IDs de référence ───
  const modeAudioId = PASTEF_DATA.getModeEnrolementId('AUDIO');
  if (!modeAudioId) throw new Error('Mode AUDIO introuvable dans ref.modes_enrolement');

  const sexes = PASTEF_DATA.getSexes();
  const sexeDefaut = sexes.length > 0 ? sexes[0].id : null;
  if (!sexeDefaut) throw new Error('Aucun sexe en référence');

  const senegal = PASTEF_DATA.getPaysSenegal();
  const senegalId = senegal ? senegal.id : null;
  if (!senegalId) throw new Error('Sénégal introuvable dans ref.pays');

  // ─── 1. Créer un patriote minimal ───
  // ⚠️ Ne PAS définir commune_id ni ville_diaspora_id 
  //     (contrainte chk_patriote_residence : les deux peuvent être NULL)
  const { data: patrioteResult, error: patrioteError } = await sb
    .from('patriotes')
    .insert({
      prenom: (record.nom || '').trim() || 'À transcrire',
      nom: 'À transcrire',
      date_naissance: '1900-01-01',
      sexe_id: sexeDefaut,
      lieu_naissance: 'À transcrire',
      nationalite_id: senegalId,
      pays_residence_id: senegalId,
      indicatif: record.telephone_indicatif || '+221',
      telephone: record.telephone_local || '000000000',
      fait_partie_cellule: false,
      statut_cellule: 'EN_ATTENTE',
      engagement_soutenir: false,
      engagement_participer: false,
      engagement_oeuvrer: false,
      mode_enrolement_id: modeAudioId,
    })
    .select('id')
    .single();

  if (patrioteError) throw new Error('Patriote audio: ' + patrioteError.message);

  // ─── 2. Construire l'URL de référence (bucket privé) ───
  // Le bucket est privé → on stocke le chemin interne comme fichier_url.
  // Le back-office générera une signed URL au moment de la lecture.
  const cfg = window.SUPABASE_CONFIG;
  const bucket = cfg.audioBucket || 'enrolments-audio';
  const cleanPath = storagePath.startsWith(bucket + '/')
    ? storagePath.slice(bucket.length + 1)
    : storagePath;
  const fichierUrl = `${cfg.url}/storage/v1/object/${bucket}/${cleanPath}`;

  // ─── 3. Créer l'entrée enrolements_audio ───
  const { error: audioError } = await sb
    .from('enrolements_audio')
    .insert({
      patriote_id: patrioteResult.id,
      fichier_url: fichierUrl,      // ✅ URL interne (privée, à signer par l'admin)
      fichier_path: cleanPath,      // ✅ chemin nu, sans le bucket
      duree_secondes: record.duration_sec,
      statut: 'EN_ATTENTE',
    });

  if (audioError) throw new Error('Audio record: ' + audioError.message);

  return true;
}

  // ─── Sync ───
  async function syncAllAudio() {
    const all = await dbGetAll();
    if (!all.length) return { sent: 0, failed: 0, abandoned: 0 };

    let sent = 0, failed = 0, abandoned = 0;

    for (const rec of all) {
      const retryCount = rec.retry_count || 0;

      if (retryCount >= MAX_RETRY) {
        await dbDelete(rec.id);
        abandoned++;
        continue;
      }

      try {
        let storagePath = rec.upload_path || null;

        if (!storagePath) {
          const filename = `${rec.id}.${rec.extension || 'mp4'}`;
          storagePath = await uploadAudioToStorage(rec.blob, filename);
          await dbUpdate(rec.id, { upload_path: storagePath, retry_count: retryCount + 1 });
        }

        await createAudioEnrolment(rec, storagePath);
        await dbDelete(rec.id);
        sent++;
      } catch (err) {
        console.error('[Audio Sync]', rec.id, err.message);
        await dbUpdate(rec.id, { retry_count: retryCount + 1 }).catch(() => {});
        failed++;
      }
    }

    return { sent, failed, abandoned };
  }

  // ─── Format audio ───
  function pickMimeType() {
    const candidates = isIOS()
      ? ['audio/mp4', 'audio/aac', 'audio/mp4;codecs=mp4a.40.2']
      : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    if (typeof MediaRecorder === 'undefined') return '';
    for (const m of candidates) {
      try { if (MediaRecorder.isTypeSupported(m)) return m; } catch {}
    }
    return '';
  }

  function mimeToExtension(mime) {
    if (!mime) return isIOS() ? 'm4a' : 'webm';
    if (mime.includes('mp4') || mime.includes('aac')) return 'm4a';
    if (mime.includes('webm')) return 'webm';
    if (mime.includes('ogg')) return 'ogg';
    return isIOS() ? 'm4a' : 'webm';
  }

  // ─── MediaRecorder ───
  const recorder = {
    mediaRecorder: null, stream: null, chunks: [],
    startTime: 0, state: 'idle',
    lastBlob: null, lastDuration: 0, lastExtension: 'm4a',
  };

  function isSupported() {
    return !!(navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined');
  }

  async function startRecording() {
    if (!isSupported()) throw new Error('Enregistrement audio non supporté');

    const constraints = isIOS()
      ? { audio: { echoCancellation: true, noiseSuppression: true } }
      : { audio: true };

    recorder.stream = await navigator.mediaDevices.getUserMedia(constraints);
    const mimeType = pickMimeType();

    try {
      recorder.mediaRecorder = mimeType
        ? new MediaRecorder(recorder.stream, { mimeType })
        : new MediaRecorder(recorder.stream);
    } catch {
      recorder.mediaRecorder = new MediaRecorder(recorder.stream);
    }

    recorder.chunks = [];
    recorder.lastExtension = mimeToExtension(recorder.mediaRecorder.mimeType);
    recorder.mediaRecorder.ondataavailable = e => { if (e.data?.size > 0) recorder.chunks.push(e.data); };

    return new Promise((resolve, reject) => {
      recorder.mediaRecorder.onerror = e => reject(new Error('Erreur enregistrement'));
      recorder.mediaRecorder.onstop = () => {
        const mimeUsed = recorder.mediaRecorder.mimeType || (isIOS() ? 'audio/mp4' : 'audio/webm');
        const blob = new Blob(recorder.chunks, { type: mimeUsed });
        recorder.lastBlob = blob;
        recorder.lastDuration = Math.round((Date.now() - recorder.startTime) / 1000);
        recorder.state = 'preview';
        if (recorder.stream) { recorder.stream.getTracks().forEach(t => t.stop()); recorder.stream = null; }
        resolve({ blob, duration: recorder.lastDuration, extension: recorder.lastExtension });
      };

      isIOS() ? recorder.mediaRecorder.start(1000) : recorder.mediaRecorder.start();
      recorder.startTime = Date.now();
      recorder.state = 'recording';
    });
  }

  function stopRecording() {
    if (recorder.mediaRecorder?.state !== 'inactive') recorder.mediaRecorder?.stop();
  }

  function cancelRecording() {
    if (recorder.stream) { recorder.stream.getTracks().forEach(t => t.stop()); recorder.stream = null; }
    recorder.mediaRecorder = null;
    recorder.chunks = [];
    recorder.state = 'idle';
    recorder.lastBlob = null;
  }

  function getClientId() {
    let id = localStorage.getItem('pastef_client_id');
    if (!id) {
      id = 'cli_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('pastef_client_id', id);
    }
    return id;
  }

  async function saveRecording({ blob, duration, extension, nom, telephone_indicatif, telephone_local }) {
    const sizeMB = blob.size / (1024 * 1024);
    if (sizeMB > MAX_BLOB_SIZE_MB) throw new Error(`Trop volumineux (${sizeMB.toFixed(1)} Mo)`);

    const id = 'aud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    const telLocal = (telephone_local || '').trim();

    const record = {
      id, blob, extension,
      mime: blob.type,
      size_bytes: blob.size,
      duration_sec: duration,
      nom: (nom || '').trim() || null,
      telephone_indicatif: telLocal ? telephone_indicatif : null,
      telephone_local: telLocal || null,
      telephone_complet: telLocal ? `${telephone_indicatif || '+221'} ${telLocal}` : null,
      client_id: getClientId(),
      created_at: new Date().toISOString(),
      retry_count: 0,
      upload_path: null,
    };

    await dbSave(record);
    return record;
  }

  // ─── Export ───
  window.PASTEF_AUDIO = {
    isSupported, startRecording, stopRecording, cancelRecording,
    saveRecording,
    getAllRecordings: dbGetAll,
    deleteRecording: dbDelete,
    countRecordings: dbCount,
    syncAll: syncAllAudio,
    getState: () => recorder.state,
    getLastBlob: () => recorder.lastBlob,
    getLastDuration: () => recorder.lastDuration,
    getLastExtension: () => recorder.lastExtension,
    isIOS,
  };

})();