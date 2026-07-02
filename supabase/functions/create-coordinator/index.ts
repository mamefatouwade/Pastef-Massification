// supabase/functions/create-coordinator/index.ts
//
// PASTEF — Désignation d'un coordinateur
//
// Toujours une Edge Function pour la même raison qu'avant (clé
// service_role uniquement côté serveur). Nouveauté : l'email de
// bienvenue avec les identifiants est maintenant envoyé automatiquement
// via Resend, depuis ce même serveur — la clé Resend ne doit, elle
// non plus, jamais atterrir dans le navigateur.
//
// Déploiement :
//   npx supabase functions deploy create-coordinator
//
// Configuration requise (une seule fois) :
//   npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
//
// Optionnel — adresse d'expédition personnalisée une fois votre
// domaine vérifié sur Resend (sinon, utilise le domaine de test
// onboarding@resend.dev, qui fonctionne sans configuration mais
// n'est pas destiné à un usage en production durable) :
//   npx supabase secrets set RESEND_FROM_EMAIL="PASTEF <noreply@pastef.sn>"
//
// SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY sont
// injectées automatiquement, pas besoin de les configurer.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function generatePassword(length = 14) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let pw = '';
  for (let i = 0; i < length; i++) pw += chars[bytes[i] % chars.length];
  return pw;
}

function roleLabel(role) {
  return { admin: 'Administrateur', departemental: 'Coordinateur départemental', communal: 'Coordinateur communal', diaspora: 'Coordinateur diaspora' }[role] || role;
}

function buildWelcomeEmailHtml({ prenom, nom, email, password, role, celluleNom }) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;background:#F5F8F6;padding:24px;">
    <div style="background:#1B7C3D;border-radius:12px 12px 0 0;padding:24px;text-align:center;">
      <h1 style="color:#fff;font-size:18px;margin:0;">Bienvenue chez PASTEF</h1>
    </div>
    <div style="background:#fff;border-radius:0 0 12px 12px;padding:24px;">
      <p style="font-size:14px;color:#1A2E22;">Bonjour ${prenom} ${nom},</p>
      <p style="font-size:14px;color:#1A2E22;line-height:1.6;">
        Vous avez été désigné(e) <strong>${roleLabel(role)}</strong>${celluleNom ? ` pour <strong>${celluleNom}</strong>` : ''}.
        Voici vos identifiants de connexion à l'espace coordinateur :
      </p>
      <div style="background:#ECFDF5;border:1px solid #1B7C3D;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 8px;font-size:12px;color:#6B7B72;text-transform:uppercase;letter-spacing:0.04em;">Email</p>
        <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1A2E22;">${email}</p>
        <p style="margin:0 0 8px;font-size:12px;color:#6B7B72;text-transform:uppercase;letter-spacing:0.04em;">Mot de passe temporaire</p>
        <p style="margin:0;font-size:14px;font-weight:700;color:#1A2E22;font-family:monospace;">${password}</p>
      </div>
      <p style="font-size:12px;color:#C42528;line-height:1.5;">
        Pour votre sécurité, changez ce mot de passe dès votre première connexion.
        Ne partagez ces identifiants avec personne.
      </p>
    </div>
  </div>
  `;
}

async function sendWelcomeEmail({ resendApiKey, fromEmail, to, prenom, nom, password, role, celluleNom }) {
  if (!resendApiKey) {
    return { sent: false, error: 'RESEND_API_KEY non configurée' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to,
        subject: 'Vos identifiants coordinateur PASTEF',
        html: buildWelcomeEmailHtml({ prenom, nom, email: to, password, role, celluleNom }),
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('[Resend] Échec envoi', response.status, text);
      return { sent: false, error: `Resend a répondu ${response.status}` };
    }

    return { sent: true, error: null };
  } catch (err) {
    console.error('[Resend] Exception', err);
    return { sent: false, error: err.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return jsonResponse({ error: 'Méthode non autorisée' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonResponse({ error: 'Non authentifié' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'PASTEF <onboarding@resend.dev>';

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
  if (callerErr || !caller) return jsonResponse({ error: 'Session invalide' }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerAccount } = await adminClient
    .from('coordinator_accounts')
    .select('active')
    .eq('id', caller.id)
    .maybeSingle();

  if (callerAccount && !callerAccount.active) {
    return jsonResponse({ error: 'Votre compte est désactivé' }, 403);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Corps de requête JSON invalide' }, 400);
  }

  const { email, role, cellule_id, enrolment_id } = body || {};

  if (!email || !role || !enrolment_id) {
    return jsonResponse({ error: 'Champs manquants : email, role et enrolment_id sont requis' }, 400);
  }

  const validRoles = ['admin', 'departemental', 'communal', 'diaspora'];
  if (!validRoles.includes(role)) {
    return jsonResponse({ error: `Rôle invalide : ${role}` }, 400);
  }

  const { data: enrolment, error: enrolErr } = await adminClient
    .from('enrolments')
    .select('id, prenom, nom, telephone')
    .eq('id', enrolment_id)
    .maybeSingle();

  if (enrolErr || !enrolment) {
    return jsonResponse({ error: 'Inscrit introuvable' }, 404);
  }

  // 🆕 Nom de la cellule (pour l'email et le log), si une cellule a été choisie
  let celluleNom = null;
  if (cellule_id) {
    const { data: cellule } = await adminClient.from('cellules').select('nom').eq('id', cellule_id).maybeSingle();
    celluleNom = cellule?.nom || null;
  }

  const password = generatePassword();

  // 1) Créer le compte Auth
  const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr) {
    const msg = createErr.message?.includes('already been registered')
      ? 'Cet email est déjà utilisé par un compte existant'
      : createErr.message;
    return jsonResponse({ error: msg }, 400);
  }

  // 2) Créer la ligne coordinator_accounts
  const { error: insertErr } = await adminClient.from('coordinator_accounts').insert({
    id: newUser.user.id,
    enrolment_id,
    cellule_id: cellule_id || null,
    role,
    email,
    created_by: caller.id,
    active: true,
  });

  if (insertErr) {
    await adminClient.auth.admin.deleteUser(newUser.user.id);
    return jsonResponse({ error: insertErr.message }, 400);
  }

  // 3) Relier la cellule à ce coordinateur, si une cellule a été choisie
  if (cellule_id) {
    await adminClient.from('cellules').update({ coordinator_user_id: newUser.user.id }).eq('id', cellule_id);
  }

  // 4) 🆕 Envoi de l'email de bienvenue via Resend (best-effort : un échec
  // d'envoi ne fait PAS échouer la création du compte — l'admin garde
  // les identifiants affichés à l'écran en repli)
  const emailResult = await sendWelcomeEmail({
    resendApiKey,
    fromEmail,
    to: email,
    prenom: enrolment.prenom,
    nom: enrolment.nom,
    password,
    role,
    celluleNom,
  });

  // 5) Log d'audit
  await adminClient.from('audit_log').insert({
    user_id: caller.id,
    action: 'create_coordinator',
    target_table: 'coordinator_accounts',
    target_id: newUser.user.id,
    details: {
      email, role, cellule_id, enrolment_id,
      enrolment_nom: `${enrolment.prenom} ${enrolment.nom}`,
      email_sent: emailResult.sent,
      email_error: emailResult.error,
    },
  }).catch(() => {});

  return jsonResponse({
    success: true,
    user_id: newUser.user.id,
    email,
    password,
    prenom: enrolment.prenom,
    nom: enrolment.nom,
    emailSent: emailResult.sent,
    emailError: emailResult.error,
  });
});