/* ============================================
   PASTEF — Utilitaires partagés
   ============================================ */

(function () {
  'use strict';

  const PASTEF = window.PASTEF || (window.PASTEF = {});

  /**
   * Formate une date en français lisible.
   */
  function formatDate(value, opts = {}) {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d)) return '—';

    const options = opts.long
      ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      : { day: 'numeric', month: 'short', year: 'numeric' };

    return d.toLocaleDateString('fr-FR', options);
  }

  function formatDateTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d)) return '—';
    return d.toLocaleString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  /**
   * Calcule l'âge à partir d'une date de naissance.
   */
  function computeAge(dateNaissance) {
    if (!dateNaissance || dateNaissance === '1900-01-01') return null;
    const d = new Date(dateNaissance);
    if (isNaN(d)) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  }

  /**
   * Initiales pour avatar.
   */
  function initials(first, last) {
    const a = (first || '').trim().charAt(0).toUpperCase();
    const b = (last || '').trim().charAt(0).toUpperCase();
    return (a + b) || '?';
  }

  /**
   * Échappe le HTML pour éviter les injections XSS.
   */
  function escapeHtml(value) {
    if (value == null) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Format nombre avec séparateurs de milliers.
   */
  function formatNumber(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('fr-FR');
  }

  /**
   * Toast notification.
   */
  function toast(title, text = '', opts = {}) {
    const existing = document.getElementById('pastef-toast');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'pastef-toast';
    el.className = 'toast';
    el.innerHTML = `
      <div class="toast-icon" style="background:${opts.color || 'var(--pastef-green)'}">
        <svg width="16" height="16" fill="none" stroke="white" stroke-width="2.5" viewBox="0 0 24 24">
          ${opts.icon || '<polyline points="20 6 9 17 4 12"/>'}
        </svg>
      </div>
      <div>
        <div class="toast-title">${escapeHtml(title)}</div>
        ${text ? `<div class="toast-text">${escapeHtml(text)}</div>` : ''}
      </div>
    `;
    document.body.appendChild(el);

    requestAnimationFrame(() => el.classList.add('show'));

    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, opts.duration || 4000);
  }

  /**
   * Debounce.
   */
  function debounce(fn, delay = 250) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * Génère un mot de passe temporaire fort.
   */
  function generateTempPassword(length = 14) {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '!@#$%&*';
    const all = upper + lower + digits + special;

    let pwd = '';
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += digits[Math.floor(Math.random() * digits.length)];
    pwd += special[Math.floor(Math.random() * special.length)];

    for (let i = pwd.length; i < length; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }

    return pwd.split('').sort(() => Math.random() - 0.5).join('');
  }

  PASTEF.utils = {
    formatDate,
    formatDateTime,
    computeAge,
    initials,
    escapeHtml,
    formatNumber,
    toast,
    debounce,
    generateTempPassword,
  };
})();
