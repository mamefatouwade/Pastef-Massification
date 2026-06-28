/* ============================================
   PASTEF — Données de référence
   Toutes les listes de sélection du formulaire
   ============================================ */

const DATA = {

  /* ----------------------------------------
     PROFESSIONS
     ---------------------------------------- */
  professions: [
    'Étudiant(e)',
    'Élève',
    'Enseignant(e) / Professeur',
    'Médecin',
    'Infirmier / Infirmière',
    'Sage-femme',
    'Pharmacien(ne)',
    'Ingénieur(e)',
    'Technicien(ne)',
    'Informaticien(ne)',
    'Développeur / Développeuse',
    'Architecte',
    'Avocat(e)',
    'Magistrat(e)',
    'Notaire',
    'Comptable',
    'Banquier / Banquière',
    'Économiste',
    'Journaliste',
    'Commerçant(e)',
    'Entrepreneur(e) / Chef d\'entreprise',
    'Artisan(e)',
    'Ouvrier / Ouvrière',
    'Agriculteur / Agricultrice',
    'Éleveur / Éleveuse',
    'Pêcheur / Pêcheuse',
    'Chauffeur',
    'Transporteur',
    'Mécanicien(ne)',
    'Électricien(ne)',
    'Maçon(ne)',
    'Menuisier / Menuisière',
    'Plombier / Plombière',
    'Tailleur / Couturière',
    'Coiffeur / Coiffeuse',
    'Cuisinier / Cuisinière',
    'Restaurateur / Restauratrice',
    'Hôtelier / Hôtelière',
    'Agent commercial',
    'Vendeur / Vendeuse',
    'Fonctionnaire',
    'Militaire',
    'Policier / Policière',
    'Gendarme',
    'Douanier / Douanière',
    'Pompier',
    'Religieux / Imam / Pasteur',
    'Artiste',
    'Musicien(ne)',
    'Sportif / Sportive',
    'Retraité(e)',
    'Sans emploi',
    'Au foyer',
    'Autre'
  ],

  /* ----------------------------------------
     DOMAINES D'ACTIVITÉ
     ---------------------------------------- */
  domaines: [
    'Administration publique',
    'Agriculture & Élevage',
    'Pêche & Aquaculture',
    'Artisanat',
    'Banque & Finance',
    'Assurance',
    'Bâtiment & Construction (BTP)',
    'Commerce',
    'Communication & Médias',
    'Culture & Arts',
    'Défense & Sécurité',
    'Droit & Justice',
    'Éducation & Enseignement',
    'Énergie',
    'Environnement & Développement durable',
    'Hôtellerie & Restauration',
    'Industrie & Manufacture',
    'Informatique & Numérique',
    'Logistique & Transport',
    'Mines & Carrières',
    'Recherche scientifique',
    'Religion',
    'Santé',
    'Services publics',
    'Sport',
    'Télécommunications',
    'Textile & Mode',
    'Tourisme',
    'Étudiant / Formation',
    'Sans activité',
    'Autre'
  ],

  /* ----------------------------------------
     PAYS
     ---------------------------------------- */
  pays: [
    'Sénégal',
    '— Diaspora —',
    'Algérie',
    'Allemagne',
    'Arabie Saoudite',
    'Belgique',
    'Bénin',
    'Burkina Faso',
    'Cameroun',
    'Canada',
    'Cap-Vert',
    'Chine',
    'Côte d\'Ivoire',
    'Émirats Arabes Unis',
    'Espagne',
    'États-Unis',
    'France',
    'Gabon',
    'Gambie',
    'Ghana',
    'Guinée',
    'Guinée-Bissau',
    'Italie',
    'Mali',
    'Maroc',
    'Mauritanie',
    'Niger',
    'Nigéria',
    'Pays-Bas',
    'Portugal',
    'Royaume-Uni',
    'Suisse',
    'Tunisie',
    'Turquie',
    'Autre'
  ],

  /* ----------------------------------------
     RÉGIONS PAR PAYS
     ---------------------------------------- */
  regions: {
    'Sénégal': [
      'Dakar', 'Diourbel', 'Fatick', 'Kaffrine', 'Kaolack',
      'Kédougou', 'Kolda', 'Louga', 'Matam', 'Saint-Louis',
      'Sédhiou', 'Tambacounda', 'Thiès', 'Ziguinchor'
    ],
    'France': [
      'Île-de-France (Paris)', 'Auvergne-Rhône-Alpes', 'Hauts-de-France',
      'Provence-Alpes-Côte d\'Azur', 'Occitanie', 'Nouvelle-Aquitaine',
      'Grand Est', 'Bretagne', 'Normandie', 'Pays de la Loire',
      'Bourgogne-Franche-Comté', 'Centre-Val de Loire', 'Corse',
      'Outre-Mer', 'Autre'
    ],
    'Italie': [
      'Lombardie (Milan)', 'Latium (Rome)', 'Toscane', 'Vénétie',
      'Émilie-Romagne', 'Campanie (Naples)', 'Sicile', 'Pouilles',
      'Piémont', 'Autre'
    ],
    'Espagne': [
      'Madrid', 'Catalogne (Barcelone)', 'Andalousie', 'Valence',
      'Pays Basque', 'Galice', 'Canaries', 'Autre'
    ],
    'États-Unis': [
      'New York', 'Washington DC', 'Maryland', 'Virginia',
      'Géorgie (Atlanta)', 'Texas', 'Californie', 'Floride',
      'Ohio', 'Illinois', 'Massachusetts', 'New Jersey', 'Autre'
    ],
    'Canada': [
      'Québec (Montréal)', 'Ontario (Toronto)', 'Alberta',
      'Colombie-Britannique', 'Manitoba', 'Nouvelle-Écosse', 'Autre'
    ],
    'Belgique': ['Bruxelles', 'Wallonie', 'Flandre', 'Autre'],
    'Allemagne': ['Berlin', 'Hambourg', 'Bavière', 'Rhénanie-du-Nord-Westphalie', 'Hesse', 'Autre'],
    'Royaume-Uni': ['Londres', 'Manchester', 'Birmingham', 'Écosse', 'Pays de Galles', 'Autre'],
    'Suisse': ['Genève', 'Zurich', 'Berne', 'Lausanne', 'Bâle', 'Autre'],
    'Maroc': ['Casablanca-Settat', 'Rabat-Salé-Kénitra', 'Marrakech-Safi', 'Fès-Meknès', 'Tanger-Tétouan', 'Autre'],
    'Mauritanie': ['Nouakchott', 'Nouadhibou', 'Rosso', 'Kaédi', 'Autre'],
    'Mali': ['Bamako', 'Kayes', 'Sikasso', 'Ségou', 'Mopti', 'Autre'],
    'Côte d\'Ivoire': ['Abidjan', 'Yamoussoukro', 'Bouaké', 'Daloa', 'Autre'],
    'Gambie': ['Banjul', 'Serrekunda', 'Brikama', 'Autre'],
    'Guinée': ['Conakry', 'Kindia', 'Boké', 'Labé', 'Autre'],
    'Guinée-Bissau': ['Bissau', 'Bafatá', 'Gabú', 'Autre']
  },

  /* ----------------------------------------
     CELLULES PAR PAYS
     Pour Sénégal : organisées par région
     Pour diaspora : organisées par ville
     ---------------------------------------- */
  cellules: {
    'Sénégal': [
      '— Dakar —',
      'Cellule Dakar-Plateau',
      'Cellule Médina',
      'Cellule Sicap-Liberté',
      'Cellule HLM',
      'Cellule Grand-Yoff',
      'Cellule Parcelles Assainies',
      'Cellule Pikine',
      'Cellule Guédiawaye',
      'Cellule Rufisque',
      'Cellule Bargny',
      'Cellule Keur Massar',
      'Cellule Yeumbeul',
      'Cellule Thiaroye',
      '— Thiès —',
      'Cellule Thiès Ville',
      'Cellule Mbour',
      'Cellule Tivaouane',
      'Cellule Joal-Fadiouth',
      '— Saint-Louis —',
      'Cellule Saint-Louis Ville',
      'Cellule Dagana',
      'Cellule Podor',
      '— Ziguinchor —',
      'Cellule Ziguinchor Ville',
      'Cellule Oussouye',
      'Cellule Bignona',
      '— Kaolack —',
      'Cellule Kaolack Ville',
      'Cellule Nioro du Rip',
      'Cellule Guinguinéo',
      '— Autres régions —',
      'Cellule Diourbel',
      'Cellule Touba',
      'Cellule Mbacké',
      'Cellule Louga',
      'Cellule Linguère',
      'Cellule Fatick',
      'Cellule Foundiougne',
      'Cellule Tambacounda',
      'Cellule Bakel',
      'Cellule Kédougou',
      'Cellule Kolda',
      'Cellule Vélingara',
      'Cellule Matam',
      'Cellule Ourossogui',
      'Cellule Sédhiou',
      'Cellule Kaffrine',
      'Autre cellule (préciser)'
    ],
    'France': [
      'Cellule Paris',
      'Cellule Île-de-France Nord',
      'Cellule Île-de-France Sud',
      'Cellule Lyon',
      'Cellule Marseille',
      'Cellule Bordeaux',
      'Cellule Lille',
      'Cellule Toulouse',
      'Cellule Strasbourg',
      'Cellule Nice',
      'Cellule Nantes',
      'Cellule Rennes',
      'Cellule Montpellier',
      'Cellule Rouen',
      'Autre cellule (préciser)'
    ],
    'Italie': [
      'Cellule Rome',
      'Cellule Milan',
      'Cellule Turin',
      'Cellule Naples',
      'Cellule Bergame',
      'Cellule Brescia',
      'Cellule Florence',
      'Cellule Bologne',
      'Cellule Vérone',
      'Cellule Padoue',
      'Autre cellule (préciser)'
    ],
    'Espagne': [
      'Cellule Madrid',
      'Cellule Barcelone',
      'Cellule Valence',
      'Cellule Séville',
      'Cellule Bilbao',
      'Cellule Las Palmas',
      'Autre cellule (préciser)'
    ],
    'États-Unis': [
      'Cellule New York',
      'Cellule Washington DC',
      'Cellule Atlanta',
      'Cellule Houston',
      'Cellule Los Angeles',
      'Cellule Chicago',
      'Cellule Boston',
      'Cellule Columbus (Ohio)',
      'Autre cellule (préciser)'
    ],
    'Canada': [
      'Cellule Montréal',
      'Cellule Toronto',
      'Cellule Ottawa',
      'Cellule Calgary',
      'Cellule Vancouver',
      'Cellule Québec',
      'Autre cellule (préciser)'
    ],
    'Belgique': [
      'Cellule Bruxelles',
      'Cellule Liège',
      'Cellule Anvers',
      'Cellule Charleroi',
      'Autre cellule (préciser)'
    ],
    'Allemagne': [
      'Cellule Berlin',
      'Cellule Hambourg',
      'Cellule Munich',
      'Cellule Francfort',
      'Cellule Cologne',
      'Autre cellule (préciser)'
    ],
    'Royaume-Uni': [
      'Cellule Londres',
      'Cellule Manchester',
      'Cellule Birmingham',
      'Cellule Liverpool',
      'Autre cellule (préciser)'
    ],
    'Suisse': [
      'Cellule Genève',
      'Cellule Zurich',
      'Cellule Lausanne',
      'Cellule Berne',
      'Autre cellule (préciser)'
    ],
    'Mauritanie': [
      'Cellule Nouakchott',
      'Cellule Nouadhibou',
      'Autre cellule (préciser)'
    ],
    'Maroc': [
      'Cellule Casablanca',
      'Cellule Rabat',
      'Cellule Tanger',
      'Cellule Marrakech',
      'Autre cellule (préciser)'
    ],
    'Côte d\'Ivoire': [
      'Cellule Abidjan',
      'Cellule Yamoussoukro',
      'Autre cellule (préciser)'
    ],
    'Mali': [
      'Cellule Bamako',
      'Autre cellule (préciser)'
    ],
    'Gambie': [
      'Cellule Banjul',
      'Cellule Serrekunda',
      'Autre cellule (préciser)'
    ]
  },

  /* Pour les pays sans cellules listées, on retombe sur ceci */
  cellulesDefaut: [
    'Cellule diaspora générale',
    'Autre cellule (préciser)'
  ],

  /* ----------------------------------------
     INDICATIFS TÉLÉPHONIQUES
     Liste affichée dans le sélecteur
     ---------------------------------------- */
  dialCodes: [
    { flag: '🇸🇳', code: '+221', name: 'Sénégal' },
    { flag: '🇫🇷', code: '+33',  name: 'France' },
    { flag: '🇮🇹', code: '+39',  name: 'Italie' },
    { flag: '🇪🇸', code: '+34',  name: 'Espagne' },
    { flag: '🇺🇸', code: '+1',   name: 'États-Unis' },
    { flag: '🇨🇦', code: '+1',   name: 'Canada' },
    { flag: '🇧🇪', code: '+32',  name: 'Belgique' },
    { flag: '🇩🇪', code: '+49',  name: 'Allemagne' },
    { flag: '🇬🇧', code: '+44',  name: 'Royaume-Uni' },
    { flag: '🇨🇭', code: '+41',  name: 'Suisse' },
    { flag: '🇳🇱', code: '+31',  name: 'Pays-Bas' },
    { flag: '🇵🇹', code: '+351', name: 'Portugal' },
    { flag: '🇲🇦', code: '+212', name: 'Maroc' },
    { flag: '🇲🇷', code: '+222', name: 'Mauritanie' },
    { flag: '🇲🇱', code: '+223', name: 'Mali' },
    { flag: '🇨🇮', code: '+225', name: 'Côte d\'Ivoire' },
    { flag: '🇬🇲', code: '+220', name: 'Gambie' },
    { flag: '🇬🇳', code: '+224', name: 'Guinée' },
    { flag: '🇬🇼', code: '+245', name: 'Guinée-Bissau' },
    { flag: '🇧🇫', code: '+226', name: 'Burkina Faso' },
    { flag: '🇧🇯', code: '+229', name: 'Bénin' },
    { flag: '🇨🇲', code: '+237', name: 'Cameroun' },
    { flag: '🇬🇦', code: '+241', name: 'Gabon' },
    { flag: '🇳🇪', code: '+227', name: 'Niger' },
    { flag: '🇳🇬', code: '+234', name: 'Nigéria' },
    { flag: '🇬🇭', code: '+233', name: 'Ghana' },
    { flag: '🇨🇻', code: '+238', name: 'Cap-Vert' },
    { flag: '🇩🇿', code: '+213', name: 'Algérie' },
    { flag: '🇹🇳', code: '+216', name: 'Tunisie' },
    { flag: '🇸🇦', code: '+966', name: 'Arabie Saoudite' },
    { flag: '🇦🇪', code: '+971', name: 'Émirats Arabes Unis' },
    { flag: '🇹🇷', code: '+90',  name: 'Turquie' },
    { flag: '🇨🇳', code: '+86',  name: 'Chine' }
  ],

  /* Correspondance pays → indicatif (pour auto-update du préfixe) */
  paysToDialCode: {
    'Sénégal': '+221',
    'France': '+33',
    'Italie': '+39',
    'Espagne': '+34',
    'États-Unis': '+1',
    'Canada': '+1',
    'Belgique': '+32',
    'Allemagne': '+49',
    'Royaume-Uni': '+44',
    'Suisse': '+41',
    'Pays-Bas': '+31',
    'Portugal': '+351',
    'Maroc': '+212',
    'Mauritanie': '+222',
    'Mali': '+223',
    'Côte d\'Ivoire': '+225',
    'Gambie': '+220',
    'Guinée': '+224',
    'Guinée-Bissau': '+245',
    'Burkina Faso': '+226',
    'Bénin': '+229',
    'Cameroun': '+237',
    'Gabon': '+241',
    'Niger': '+227',
    'Nigéria': '+234',
    'Ghana': '+233',
    'Cap-Vert': '+238',
    'Algérie': '+213',
    'Tunisie': '+216',
    'Arabie Saoudite': '+966',
    'Émirats Arabes Unis': '+971',
    'Turquie': '+90',
    'Chine': '+86'
  }
};

// Export pour module si besoin (compatible navigateur natif)
if (typeof window !== 'undefined') {
  window.PASTEF_DATA = DATA;
}
