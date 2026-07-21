/* ============================================
   PASTEF — Configuration Supabase
   Adapté au schéma normalisé (ref.* + public.*)
   ============================================ */

const SUPABASE_CONFIG = {

  // URL du projet Supabase
  url: 'https://dxozjaumqdjovesuwsew.supabase.co',

  // Clé publique anon
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4b3pqYXVtcWRqb3Zlc3V3c2V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwODk1ODksImV4cCI6MjA5ODY2NTU4OX0.i_vDhNA2n7WuIq1M0gkOeU8nrimY191BClt6gBFshjA',

  // Clé Gemini pour transcription audio
  geminiKey: 'AQ.Ab8RN6KrkvX_0GvLfasDEmKdf48vGkFD5x4toV125f5JcrXTKg',

  // ─── Tables principales ───
  tables: {
    patriotes:          'patriotes',
    cellules:           'cellules',
    affectations:       'affectations',
    enrolements_audio:  'enrolements_audio',
    coordinateurs:      'coordinateurs', 
    presence_numerique: 'presence_numerique',
    patriote_reseaux:   'patriote_reseaux',
  },

  // ─── Tables de référence (schema ref) ───
  ref: {
    regions:            'ref.regions',
    departements:       'ref.departements',
    communes:           'ref.communes',
    pays:               'ref.pays',
    villes_diaspora:    'ref.villes_diaspora',
    sexes:              'ref.sexes',
    fonctions_parti:    'ref.fonctions_parti',
    types_pieces:       'ref.types_pieces',
    domaines_profession:'ref.domaines_profession',
    reseaux_sociaux:    'ref.reseaux_sociaux',
    niveaux_activite:   'ref.niveaux_activite',
    types_usage:        'ref.types_usage',
    modes_enrolement:   'ref.modes_enrolement',
    types_cellules:     'ref.types_cellules',
    roles_coordinateur: 'ref.roles_coordinateur',
  },

  // Bucket Supabase Storage pour les fichiers audio
  audioBucket: 'enrolments-audio',
};

if (typeof window !== 'undefined') {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}

/* ============================================
   📋 POLITIQUES RLS SUPPLÉMENTAIRES À EXÉCUTER
   (pour permettre l'enrôlement anonyme via le formulaire)
   ============================================

-- Permettre l'INSERT anonyme dans patriotes
CREATE POLICY anon_insert_patriotes ON public.patriotes
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Permettre l'INSERT anonyme dans enrolements_audio
CREATE POLICY anon_insert_audio ON public.enrolements_audio
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Permettre l'INSERT anonyme dans presence_numerique
CREATE POLICY anon_insert_presence_num ON public.presence_numerique
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Permettre l'INSERT anonyme dans patriote_reseaux
CREATE POLICY anon_insert_reseaux ON public.patriote_reseaux
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Permettre l'INSERT anonyme dans affectations
CREATE POLICY anon_insert_affectations ON public.affectations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Permettre l'INSERT anonyme dans cellules (pour les cellules auto-créées)
CREATE POLICY anon_insert_cellules ON public.cellules
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Permettre la LECTURE anonyme des cellules (pour le formulaire)
CREATE POLICY anon_read_cellules ON public.cellules
  FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL);

-- ⚠️ Les tables ref.* ont déjà une policy authenticated_read.
-- Il faut aussi ajouter la lecture pour anon :

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ref.regions', 'ref.departements', 'ref.communes',
    'ref.pays', 'ref.villes_diaspora', 'ref.fonctions_parti',
    'ref.types_pieces', 'ref.reseaux_sociaux', 'ref.niveaux_activite',
    'ref.types_usage', 'ref.types_activites', 'ref.types_cellules',
    'ref.sexes', 'ref.domaines_profession', 'ref.roles_coordinateur',
    'ref.modes_enrolement'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY anon_read ON %s FOR SELECT TO anon USING (true)', t
    );
  END LOOP;
END $$;

-- Storage : upload audio anonyme
CREATE POLICY "Anon upload audio"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'enrolments-audio');

============================================ */