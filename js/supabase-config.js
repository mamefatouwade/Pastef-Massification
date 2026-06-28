/* ============================================
   PASTEF — Configuration Supabase
   ⚠️ REMPLACEZ ces valeurs par vos vraies clés
   ============================================ */

const SUPABASE_CONFIG = {

  // 🔧 À MODIFIER : URL de votre projet Supabase
  // Trouvez-la dans : Supabase Dashboard > Settings > API > Project URL
  url: 'https://hdydydlumhywaaiiklxb.supabase.co',

  // 🔧 À MODIFIER : Clé publique (anon key) de votre projet
  // Trouvez-la dans : Supabase Dashboard > Settings > API > Project API keys > anon public
  // ⚠️ N'utilisez JAMAIS la "service_role" key ici, elle est dangereuse côté client
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkeWR5ZGx1bWh5d2FhaWlrbHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NjQzODIsImV4cCI6MjA5ODI0MDM4Mn0.byxtIjrjNX0mSC26zMUbXz0hmNMeFsg7FE3H1cITjYk',

  // Nom de la table dans Supabase
  table: 'enrolments',

  // Nom du bucket Supabase Storage pour les fichiers audio
  audioBucket: 'enrolments-audio'
};

/* ============================================
   📋 SCHÉMA SQL À EXÉCUTER DANS SUPABASE
   (SQL Editor > New query)
   ============================================

-- 1) Création de la table
create table public.enrolments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Identité
  prenom text not null,
  nom text not null,
  date_naissance date not null,
  sexe text not null,
  lieu_naissance text not null,
  telephone text not null,
  telephone_indicatif text,
  telephone_local text,

  -- Activité
  profession text not null,
  profession_autre text,
  domaine text not null,
  domaine_autre text,

  -- Résidence
  pays text not null,
  region text not null,
  quartier text not null,

  -- Cellule
  appartient_cellule text not null,
  cellule text,
  cellule_autre text,
  fonction_cellule text,

  -- Engagement
  engagement_soutenir boolean not null,
  engagement_participer boolean not null,
  engagement_oeuvrer boolean not null,
  certification boolean not null,

  -- Audio (pour les enrôlements vocaux)
  has_audio boolean not null default false,
  audio_path text,
  audio_duration_sec integer,
  transcription_status text default 'not_applicable',
  -- valeurs : 'not_applicable' | 'pending' | 'in_progress' | 'done' | 'failed'

  -- Métadonnées
  client_id text,
  user_agent text,
  submitted_at timestamptz not null default now()
);

-- 2) Activer Row Level Security sur la table
alter table public.enrolments enable row level security;

-- 3) Politique : tout le monde peut INSÉRER
create policy "Anyone can insert enrolment"
  on public.enrolments
  for insert
  to anon, authenticated
  with check (true);

-- 4) AUCUNE politique SELECT → personne ne peut lire depuis le client

-- 5) Index utiles
create index idx_enrolments_pays on public.enrolments(pays);
create index idx_enrolments_region on public.enrolments(region);
create index idx_enrolments_created on public.enrolments(created_at desc);
create index idx_enrolments_has_audio on public.enrolments(has_audio);
create index idx_enrolments_transcription on public.enrolments(transcription_status)
  where has_audio = true;

============================================

   📦 CONFIGURATION SUPABASE STORAGE (pour l'audio)
   ============================================

1) Dans Supabase Dashboard : Storage → New bucket
   - Nom : enrolments-audio
   - Public : NON (privé)
   - File size limit : 25 MB

2) Politiques RLS du bucket (SQL Editor) :

-- Permettre l'upload anonyme (mais pas la lecture)
create policy "Anyone can upload audio"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'enrolments-audio');

-- AUCUNE politique select → personne ne peut lire depuis le navigateur
-- Les admins accèdent aux fichiers via le dashboard Supabase

============================================ */

if (typeof window !== 'undefined') {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}
