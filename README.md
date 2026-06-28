# 🇸🇳 Enrôlement Patriote — PASTEF

Formulaire web progressif (PWA) pour l'enrôlement des Patriotes du Sénégal.
Fonctionne **hors-ligne** sur le terrain et synchronise avec **Supabase** dès que le réseau revient.

---

## 📂 Structure du projet

```
pastef-enrolment/
├── index.html              # Page principale
├── styles.css              # Styles (fidèle à la maquette)
├── manifest.json           # PWA (installation sur écran d'accueil)
├── sw.js                   # Service Worker (offline)
├── README.md
├── assets/
│   ├── logo.jpg
│   ├── couverture.png
│   └── pattern.png
└── js/
    ├── data.js             # Listes (pays, régions, professions, cellules)
    ├── supabase-config.js  # ⚠️ À configurer
    └── app.js              # Logique du formulaire
```

---

## 🚀 Déploiement en 4 étapes

### 1️⃣ Créer la base Supabase

1. Crée un compte sur [supabase.com](https://supabase.com) (gratuit)
2. Nouveau projet → choisis un mot de passe & une région (Europe West conseillé)
3. Va dans **SQL Editor** → **New query** → colle le SQL ci-dessous :

```sql
-- Création de la table
create table public.enrolments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  prenom text not null,
  nom text not null,
  date_naissance date not null,
  sexe text not null,
  lieu_naissance text not null,
  telephone text not null,
  telephone_indicatif text,
  telephone_local text,
  profession text not null,
  profession_autre text,
  domaine text not null,
  domaine_autre text,
  pays text not null,
  region text not null,
  quartier text not null,
  appartient_cellule text not null,
  cellule text,
  cellule_autre text,
  fonction_cellule text,
  engagement_soutenir boolean not null,
  engagement_participer boolean not null,
  engagement_oeuvrer boolean not null,
  certification boolean not null,
  -- Audio (enrôlements vocaux pour analphabètes)
  has_audio boolean not null default false,
  audio_path text,
  audio_duration_sec integer,
  transcription_status text default 'not_applicable',
  client_id text,
  user_agent text,
  submitted_at timestamptz not null default now()
);

-- Activer RLS (sécurité)
alter table public.enrolments enable row level security;

-- Politique : tout le monde peut INSÉRER
create policy "Anyone can insert enrolment"
  on public.enrolments for insert
  to anon, authenticated
  with check (true);

-- AUCUNE politique SELECT → personne ne peut lire depuis le navigateur

-- Index utiles
create index idx_enrolments_pays on public.enrolments(pays);
create index idx_enrolments_region on public.enrolments(region);
create index idx_enrolments_created on public.enrolments(created_at desc);
create index idx_enrolments_has_audio on public.enrolments(has_audio);
create index idx_enrolments_transcription on public.enrolments(transcription_status)
  where has_audio = true;
```

### 🎙️ Configurer Supabase Storage pour les vocaux

1. Dans Supabase Dashboard : **Storage → New bucket**
   - **Nom** : `enrolments-audio`
   - **Public** : ❌ NON (privé)
   - **File size limit** : 25 MB

2. Dans **SQL Editor**, ajoute la politique d'upload :

```sql
create policy "Anyone can upload audio"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'enrolments-audio');
```

4. Va dans **Settings → API** et récupère :
   - **Project URL** (ex : `https://xxxxx.supabase.co`)
   - **anon public key** (la longue clé qui commence par `eyJ...`)

### 2️⃣ Configurer le code

Ouvre `js/supabase-config.js` et remplace :

```javascript
url: 'https://VOTRE-PROJET.supabase.co',   // ← ton Project URL
anonKey: 'VOTRE_ANON_KEY',                  // ← ta clé anon public
```

### 3️⃣ Déployer sur GitHub Pages

```bash
# Dans le dossier du projet
git init
git add .
git commit -m "Initial : enrôlement PASTEF"
git branch -M main
git remote add origin https://github.com/TON-COMPTE/pastef-enrolment.git
git push -u origin main
```

Puis sur GitHub :
- Va sur ton repo → **Settings → Pages**
- **Source** : `Deploy from a branch`
- **Branch** : `main` / `/ (root)` → **Save**
- Attends 1-2 minutes → ton site est sur `https://TON-COMPTE.github.io/pastef-enrolment/`

### 4️⃣ Générer le QR Code

- Va sur [qr-code-generator.com](https://www.qr-code-generator.com/)
- Colle l'URL GitHub Pages
- Télécharge en PNG haute résolution → imprime pour les collecteurs

---

## 📱 Comment les collecteurs l'utilisent

1. Scanner le QR Code → la page s'ouvre dans le navigateur
2. Cliquer sur **« Ajouter à l'écran d'accueil »** (menu navigateur)
3. Une icône PASTEF apparaît, comme une vraie appli
4. **Au bureau, avec WiFi** : ouvrir l'appli une fois pour charger les fichiers en cache
5. **Sur le terrain, sans réseau** : remplir les formulaires → un compteur apparaît en bas à droite
6. **De retour au bureau** : le réseau est détecté automatiquement, ou cliquer sur **« Synchroniser »**

---

## 🔒 Sécurité

- ✅ La clé **anon** est publique par design — c'est OK car la RLS bloque tout sauf l'insertion
- ✅ Personne ne peut lire ou modifier les données depuis le navigateur
- ✅ Les admins consultent les données via le **Dashboard Supabase** (Table Editor)
- ✅ Les données locales (hors-ligne) restent dans le téléphone du collecteur tant qu'elles ne sont pas envoyées

---

## 📊 Consulter & exporter les données

Dans Supabase :
- **Table Editor** → enrolments → tu vois toutes les inscriptions
- **Export CSV** : clic droit sur la table → Export → CSV
- Pour des analyses avancées : utilise l'**API REST** ou la connexion **Postgres** directe avec un outil comme Metabase

---

## 🛠️ Pistes d'évolution

- [ ] Dashboard admin sécurisé (avec login)
- [ ] Statistiques en temps réel (carte des enrôlements par région)
- [ ] Export Excel automatique
- [ ] Vérification du numéro de téléphone par SMS
- [ ] Photo d'identité optionnelle
- [ ] Multilingue (Wolof, Anglais)

---

**Made with ❤️ pour le Sénégal**
