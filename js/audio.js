/* ============================================
   PASTEF — Module Audio
   - Enregistrement via MediaRecorder
   - Stockage dans IndexedDB (capacité > LocalStorage)
   - Upload vers Supabase Storage
   ============================================ */

(function() {
  'use strict';

  // ============================================
  // INDEXEDDB
  // ============================================
  const DB_NAME = 'pastef_audio_db';
  const DB_VERSION = 1;
  const STORE = 'recordings';

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

  async function dbCount() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // ============================================
  // UPLOAD VERS SUPABASE STORAGE
  // ============================================
  async function uploadAudioToStorage(blob, filename) {
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg || cfg.url.includes('VOTRE-PROJET')) {
      throw new Error('Configuration Supabase manquante');
    }

    const bucket = cfg.audioBucket || 'enrolments-audio';
    const url = `${cfg.url}/storage/v1/object/${bucket}/${filename}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': cfg.anonKey,
        'Authorization': `Bearer ${cfg.anonKey}`,
        'Content-Type': blob.type || 'audio/webm',
        'x-upsert': 'false'
      },
      body: blob
    });

    if (!response.ok) {
      const txt = await response.text().catch(() => '');
      throw new Error(`Upload audio (${response.status}): ${txt}`);
    }

    // URL publique (lecture via signed URL côté admin uniquement, mais on stocke le chemin)
    return `${bucket}/${filename}`;
  }

  async function createAudioEnrolmentRecord(record, storagePath) {
    const cfg = window.SUPABASE_CONFIG;
    const payload = {
      // Métadonnées audio
      has_audio: true,
      audio_path: storagePath,
      transcription_status: 'pending',
      audio_duration_sec: record.duration_sec,

      // Infos optionnelles capturées
      prenom: record.nom || 'À transcrire',
      nom: 'À transcrire',
      date_naissance: '1900-01-01', // placeholder, à mettre à jour après transcription
      sexe: 'À transcrire',
      lieu_naissance: 'À transcrire',
      telephone: record.telephone_complet || 'À transcrire',
      telephone_indicatif: record.telephone_indicatif || null,
      telephone_local: record.telephone_local || null,
      profession: 'À transcrire',
      domaine: 'À transcrire',
      pays: 'À transcrire',
      region: 'À transcrire',
      quartier: 'À transcrire',
      appartient_cellule: 'à_déterminer',

      engagement_soutenir: false,
      engagement_participer: false,
      engagement_oeuvrer: false,
      certification: false,

      client_id: record.client_id,
      user_agent: navigator.userAgent,
      submitted_at: record.created_at
    };

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
      const txt = await response.text().catch(() => '');
      throw new Error(`Création enregistrement audio (${response.status}): ${txt}`);
    }
    return true;
  }

  async function syncAllAudio() {
    const all = await dbGetAll();
    if (!all.length) return { sent: 0, failed: 0 };

    let sent = 0;
    let failed = 0;

    for (const rec of all) {
      try {
        const filename = `${rec.id}.${rec.extension || 'webm'}`;
        const storagePath = await uploadAudioToStorage(rec.blob, filename);
        await createAudioEnrolmentRecord(rec, storagePath);
        await dbDelete(rec.id);
        sent++;
      } catch (err) {
        console.error('[Audio Sync] échec', rec.id, err);
        failed++;
      }
    }

    return { sent, failed };
  }

  // ============================================
  // ENREGISTREMENT (MediaRecorder)
  // ============================================
  const recorder = {
    mediaRecorder: null,
    stream: null,
    chunks: [],
    startTime: 0,
    timerInterval: null,
    state: 'idle', // idle | recording | preview
    lastBlob: null,
    lastDuration: 0,
    lastExtension: 'webm'
  };

  function isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  function pickMimeType() {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ];
    for (const m of candidates) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) return m;
    }
    return ''; // laisse le navigateur choisir
  }

  function mimeToExtension(mime) {
    if (!mime) return 'webm';
    if (mime.includes('webm')) return 'webm';
    if (mime.includes('mp4'))  return 'm4a';
    if (mime.includes('ogg'))  return 'ogg';
    if (mime.includes('mpeg')) return 'mp3';
    return 'webm';
  }

  async function startRecording() {
    if (!isSupported()) {
      throw new Error('Votre navigateur ne supporte pas l\'enregistrement audio');
    }

    recorder.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = pickMimeType();
    recorder.mediaRecorder = mimeType
      ? new MediaRecorder(recorder.stream, { mimeType })
      : new MediaRecorder(recorder.stream);

    recorder.chunks = [];
    recorder.lastExtension = mimeToExtension(recorder.mediaRecorder.mimeType);

    recorder.mediaRecorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) recorder.chunks.push(e.data);
    };

    return new Promise((resolve) => {
      recorder.mediaRecorder.onstop = () => {
        const blob = new Blob(recorder.chunks, { type: recorder.mediaRecorder.mimeType || 'audio/webm' });
        recorder.lastBlob = blob;
        recorder.lastDuration = Math.round((Date.now() - recorder.startTime) / 1000);
        recorder.state = 'preview';

        // Arrêt du flux micro
        if (recorder.stream) {
          recorder.stream.getTracks().forEach(t => t.stop());
          recorder.stream = null;
        }
        resolve({ blob, duration: recorder.lastDuration, extension: recorder.lastExtension });
      };

      recorder.mediaRecorder.start();
      recorder.startTime = Date.now();
      recorder.state = 'recording';
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
    recorder.chunks = [];
    recorder.state = 'idle';
    recorder.lastBlob = null;
  }

  function getElapsedSeconds() {
    if (recorder.state !== 'recording') return 0;
    return Math.floor((Date.now() - recorder.startTime) / 1000);
  }

  // ============================================
  // SAUVEGARDE LOCALE
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
    const id = 'aud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    const telLocal = (telephone_local || '').trim();
    const telComplet = telLocal ? `${telephone_indicatif || '+221'} ${telLocal}` : null;

    const record = {
      id,
      blob,
      extension,
      mime: blob.type,
      size_bytes: blob.size,
      duration_sec: duration,
      nom: (nom || '').trim() || null,
      telephone_indicatif: telLocal ? telephone_indicatif : null,
      telephone_local: telLocal || null,
      telephone_complet: telComplet,
      client_id: getClientId(),
      created_at: new Date().toISOString()
    };

    await dbSave(record);
    return record;
  }

  // ============================================
  // EXPORT
  // ============================================
  window.PASTEF_AUDIO = {
    // Recording
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    getElapsedSeconds,
    // Storage local
    saveRecording,
    getAllRecordings: dbGetAll,
    deleteRecording: dbDelete,
    countRecordings: dbCount,
    // Sync
    syncAll: syncAllAudio,
    // État courant
    getState: () => recorder.state,
    getLastBlob: () => recorder.lastBlob,
    getLastDuration: () => recorder.lastDuration,
    getLastExtension: () => recorder.lastExtension
  };

})();
