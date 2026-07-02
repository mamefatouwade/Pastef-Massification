// supabase/functions/create-coordinator/index.ts
//
// PASTEF — Désignation d'un coordinateur
//
// Pourquoi une Edge Function et pas un simple appel depuis le
// navigateur ? Parce que créer un compte Supabase Auth pour un tiers
// nécessite auth.admin.createUser(), qui exige la clé "service_role".
// Cette clé donne un accès total à la base et ne doit JAMAIS être
// envoyée au navigateur. Cette fonction tourne côté serveur Supabase :
// la clé y reste, seul le résultat (email + mot de passe généré)
// revient au front.
//
// Déploiement :
//   supabase functions deploy create-coordinator
//
// Aucune configuration de secret à faire à la main : SUPABASE_URL,
// SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY sont injectées
// automatiquement par Supabase dans toutes les Edge Functions du
// projet.

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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return jsonResponse({ error: 'Méthode non autorisée' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonResponse({ error: 'Non authentifié' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  // Client "appelant" — vérifie QUI fait la demande, avec ses propres droits
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
  if (callerErr || !caller) return jsonResponse({ error: 'Session invalide' }, 401);

  // Client privilégié — pour les opérations que seul le serveur peut faire
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Autorisation : même règle que les policies RLS (pas de ligne dans
  // coordinator_accounts = admin par défaut, sinon il faut active=true)
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

  // Vérifie que l'inscrit existe bel et bien
  const { data: enrolment, error: enrolErr } = await adminClient
    .from('enrolments')
    .select('id, prenom, nom, telephone')
    .eq('id', enrolment_id)
    .maybeSingle();

  if (enrolErr || !enrolment) {
    return jsonResponse({ error: 'Inscrit introuvable' }, 404);
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
    // Rollback : on ne laisse pas un compte Auth orphelin sans ligne
    await adminClient.auth.admin.deleteUser(newUser.user.id);
    return jsonResponse({ error: insertErr.message }, 400);
  }

  // 3) Relier la cellule à ce coordinateur, si une cellule a été choisie
  if (cellule_id) {
    await adminClient.from('cellules').update({ coordinator_user_id: newUser.user.id }).eq('id', cellule_id);
  }

  // 4) Log d'audit (best-effort, ne bloque pas la réponse en cas d'échec)
  await adminClient.from('audit_log').insert({
    user_id: caller.id,
    action: 'create_coordinator',
    target_table: 'coordinator_accounts',
    target_id: newUser.user.id,
    details: { email, role, cellule_id, enrolment_id, enrolment_nom: `${enrolment.prenom} ${enrolment.nom}` },
  }).catch(() => {});

  return jsonResponse({
    success: true,
    user_id: newUser.user.id,
    email,
    password,
    prenom: enrolment.prenom,
    nom: enrolment.nom,
  });
});