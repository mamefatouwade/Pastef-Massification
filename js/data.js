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
     FONCTIONS DANS UNE CELLULE
     Graine locale (fallback hors-ligne) — la source de
     vérité est la table Supabase fonctions_cellule
     ---------------------------------------- */
  fonctionsCellule: [
    'Chef du Parti',
    'Vice-Président / Vice-Présidente',
    'Coordinateur / Coordinatrice',
    'Coordinateur Adjoint',
    'Secrétaire Général',
    'Trésorier',
    'Chargé de Communication',
    'Chargé de Mobilisation',
    'Chargé de la Jeunesse',
    'Chargée des Femmes',
    'Membre simple',
    'Sympathisant'
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
  },

  /* ----------------------------------------
     SÉNÉGAL — Hiérarchie Administrative
     Régions → Départements → Communes
     ---------------------------------------- */
  senegalStructure: {
    "Dakar": {
      "Dakar": ["Dakar-Plateau", "Médina", "Gorée", "Grand Dakar", "Fann Point E", "Ouakam", "Ngor", "Yoff", "Hann Bel-Air", "Sicap-Liberté", "Dieuppeul-Derklé", "Biscuiterie", "HLM", "Grand Yoff", "Cambérène", "Parcelles Assainies", "Patte d'Oie", "Mermoz-Sacré-Cœur", "Baobabs Mermoz"],
      "Pikine": ["Pikine Ouest", "Pikine Est", "Pikine Nord", "Dalifort", "Djiddah Thiaroye Kao", "Guinaw Rail Nord", "Guinaw Rail Sud", "Thiaroye sur Mer", "Thiaroye Gare", "Mbao", "Diamaguène Sicap Mbao", "Yeumbeul Sud"],
      "Guédiawaye": ["Golf Sud", "Sahm Notaire", "Ndiarème Limamoulaye", "Wakhinane Nimzatt", "Médina Gounass"],
      "Rufisque": ["Rufisque Est", "Rufisque Ouest", "Rufisque Nord", "Bargny", "Sébikotane", "Diamniadio", "Sangalkam", "Bambilor", "Yenne", "Sendou", "Cherif Lo", "Jaxaay Parcelles"],
      "Keur Massar": ["Keur Massar Nord", "Keur Massar Sud", "Malika", "Yeumbeul Nord"]
    },
    "Thiès": {
      "Thiès": ["Thiès Est", "Thiès Ouest", "Thiès Nord", "Khombole", "Pout", "Fandène", "Cayar", "Keur Moussa", "Diender", "Notto Diobass", "Thiénaba", "Ngoundiane", "Touba Toul", "Tassette", "Cherif Lo"],
      "Mbour": ["Mbour", "Joal-Fadiouth", "Nguékhokh", "Thiadiaye", "Saly Portudal", "Ngaparou", "Somone", "Popenguine-Ndayane", "Diass", "Sindia", "Malicounda", "Fissel", "Sessène", "Ndiaganiao", "Sandiara", "Nguéniène"],
      "Tivaouane": ["Tivaouane", "Mékhé", "Mboro", "Meouane", "Darou Khoudoss", "Taïba Ndiaye", "Notto Gouye Diama", "Pambal", "Pire Goureye", "Koul", "Mérina Dakhar", "Niakhène", "Ngandiouf", "Mont-Rolland"]
    },
    "Diourbel": {
      "Diourbel": ["Diourbel", "Ndindy", "Ndoulo", "Ngohe", "Patar", "Tocky Gare", "Touré Mbonde", "Dankhe Sene", "Gade Escale", "Keur Ngalgou", "Ndankh Sene", "Taïba Moutoupha"],
      "Bambey": ["Bambey", "Baba Garage", "Dinguiraye", "Gawane", "Keur Samba Kane", "Lambaye", "Ngogom", "Ngoye", "Réfane", "Dangalma", "Ndondol", "Thiakhar"],
      "Mbacké": ["Mbacké", "Touba Mosquée", "Dalla Ngabou", "Darou Salam Typ", "Kael", "Madina", "Ndame", "Sadio", "Taïba Thiékène", "Touba Fall", "Missirah", "Ngabi", "Taïba Moutoupha"]
    },
    "Saint-Louis": {
      "Saint-Louis": ["Saint-Louis", "Fass Ngom", "Gandon", "Mpal", "Ndiébène Gandiole"],
      "Dagana": ["Dagana", "Richard-Toll", "Rosso Sénégal", "Gaé", "Ndombo Alarar", "Ndiathène", "Ronkh", "Mbane", "Diama", "Bokhol", "Gnith"],
      "Podor": ["Podor", "Ndioum", "Guédé Chantier", "Golléré", "Mboumba", "Demette", "Galoya Toucouleur", "Aéré Lao", "Pété", "Walaldé", "Cas-Cas", "Gamadji Saré", "Shallah", "Guédé Village", "Doué", "Dodel", "Méry", "Fanaye", "Ndiayene Pendao", "Bodé Lao"]
    },
    "Louga": {
      "Louga": ["Louga", "Ndiagne", "Niomré", "Coki", "Keur Momar Sarr", "Sakal", "Syer", "Mbédiène", "Kéller", "Ndorto", "Nguidile", "Nguith", "Pété Ouarack"],
      "Kébémer": ["Kébémer", "Guéoul", "Ndande", "Sagatta Gueth", "Darou Mousti", "Touba Mérina", "Ngourane", "Darou Marnane", "Diokoul Diawrigne", "Kab Gaye", "Kanène Ndiob", "Loro", "Thiolom Fall", "Sam Yabal"],
      "Linguère": ["Linguère", "Dahra", "Barkédji", "Dodji", "Ouarkhokh", "Sagatta Djoloff", "Yang-Yang", "Mbeuleukhé", "Affé Djoloff", "Kamb", "Labgar", "Mboula", "Tessékéré", "Thiamène Djoloff"]
    },
    "Fatick": {
      "Fatick": ["Fatick", "Diakhao", "Diofior", "Diarrère", "Diouroup", "Fimela", "Loul Sessène", "Niakhar", "Palmarin", "Tattaguine", "Djilasse", "Mbélacadiao", "Ndiob", "Ngayokhème", "Patar"],
      "Foundiougne": ["Foundiougne", "Karang Poste", "Passy", "Sokone", "Soum", "Bassoul", "Dionewar", "Djilor", "Djirnda", "Keur Samba Guèye", "Toubacouta", "Mbam", "Niodior", "Diossong", "Keur Saloum Diané"],
      "Gossas": ["Gossas", "Colobane", "Mbar", "Ndiène Lagane", "Ouadiour", "Patar Lia"]
    },
    "Kaolack": {
      "Kaolack": ["Kaolack", "Gandiaye", "Kahone", "Ndoffane", "Sibassor", "Latmingué", "Ndiaffate", "Ndiédieng", "Thiomby", "Dya", "Keur Baka", "Keur Socé", "Thiaré", "Ndiebel"],
      "Guinguinéo": ["Guinguinéo", "Mboss", "Fass", "Gagnick", "Khelcom Birame", "Ngathie Naoudé", "Ourour", "Dara Mboss", "Ndiago", "Panal Wolof", "Mbadakhoune"],
      "Nioro du Rip": ["Nioro du Rip", "Keur Madiabel", "Médina Sabakh", "Paoskoto", "Porokhane", "Taïba Niassène", "Wack Ngouna", "Gainthe Kaye", "Kayemor", "Ngayène", "Mandakh", "Darou Salam"]
    },
    "Kaffrine": {
      "Kaffrine": ["Kaffrine", "Nganda", "Boulel", "Gniby", "Kahi", "Kathiote", "Diamagadio", "Diokoul Mbelbouck", "Medinatoul Salam"],
      "Birkelane": ["Birkelane", "Diamal", "Mabo", "Mboss", "Ndiognick", "Ségre Gatta", "Touba Mbellas", "Keur Mbouki"],
      "Koungheul": ["Koungheul", "Gainth Pathé", "Ida Mouride", "Lour Escale", "Maka Yop", "Ribot Escale", "Saly Escale", "Missirah Wadene", "Fass Thiekene"],
      "Malem Hoddar": ["Malem Hoddar", "Darou Minam 2", "Dianké Souf", "Ndiobène Samba Lamo", "Sagna", "Ngainthe Dioum"]
    },
    "Matam": {
      "Matam": ["Matam", "Ourossogui", "Nabadji Civol", "Ogo", "Bokidiawé", "Agnam Civol", "Thilogne", "Orefondé", "Dabia", "Kanel"],
      "Kanel": ["Kanel", "Waoundé", "Dembancané", "Sinthiou Bamambé Banadji", "Hamady Ounaré", "Ndendory", "Orchadié", "Wouro Sidy", "Bokiladji", "Odobéré", "Aouré"],
      "Ranérou-Ferlo": ["Ranérou", "Oudalaye", "Lougré Thiolly"]
    },
    "Tambacounda": {
      "Tambacounda": ["Tambacounda", "Missirah", "Maka Coulibantang", "Koussanar", "Ndoga Babacar", "Niani Toucouleur", "Dialacoto"],
      "Bakel": ["Bakel", "Diawara", "Kidira", "Gabou", "Moudéry", "Sadatou", "Bélé", "Sinthiou Fissa", "Bamba Ndiayene", "Gathiary", "Madina Sacko"],
      "Goudiry": ["Goudiry", "Kothiary", "Bala", "Boynguel Bamba", "Dianké Makha", "Dougué", "Koulor", "Sinthiou Mamadou Boubou", "Bani Israel", "Komoti"],
      "Koumpentoum": ["Koumpentoum", "Malem Niani", "Bamba Thialène", "Mereto", "Ndama", "Pass Koto", "Payar"]
    },
    "Kédougou": {
      "Kédougou": ["Kédougou", "Bandafassi", "Dimboli", "Dindéfélo", "Fongolimbi", "Tomboronkoto", "Ninéfécha"],
      "Saraya": ["Saraya", "Bembou", "Khossanto", "Sabodala", "Missirah Sirimana", "Medina Baffé"],
      "Salémata": ["Salémata", "Dakatéli", "Dar Salam", "Ethiolo", "Oubadji", "Kevoye"]
    },
    "Kolda": {
      "Kolda": ["Kolda", "Dabo", "Salikégné", "Saré Yoba Diéga", "Dioulacolon", "Médina El Hadji", "Mampatim", "Bagadadji", "Coumbacara", "Dialambéré", "Guiro Yéro Bocar"],
      "Vélingara": ["Vélingara", "Kounkané", "Diaobé-Kabendou", "Bonconto", "Linkéring", "Médina Gounass", "Néttéboulou", "Kandia", "Paroumba", "Wassadou", "Pakour"],
      "Médina Yoro Foulah": ["Médina Yoro Foulah", "Pata", "Badion", "Fafacourou", "Niaming", "Bourouco", "Kéréwane", "Ndorna", "Dinguilaye"]
    },
    "Sédhiou": {
      "Sédhiou": ["Sédhiou", "Diannah Malary", "Marsassoum", "Bambali", "Diendé", "Djibabouya", "Oudoucar", "Sakar", "Koussy", "Same Kanta"],
      "Bounkiling": ["Bounkiling", "Madina Wandifa", "Bona", "Diaroumé", "Ndiamacouta", "Bogal", "Djinnany", "Faoune", "Inor", "Kandion Mangana"],
      "Goudomp": ["Goudomp", "Samine", "Tanaff", "Diattacounda", "Karantaba", "Simbandi Brassou", "Simbandi Balante", "Djibanar", "Kaour", "Mangaroungou", "Nimzat"]
    },
    "Ziguinchor": {
      "Ziguinchor": ["Ziguinchor", "Niaguis", "Adéane", "Boutoupha Camaracounda", "Nyassia", "Enampore"],
      "Bignona": ["Bignona", "Thionck-Essyl", "Diouloulou", "Kafountine", "Kataba 1", "Sindian", "Tenghory", "Suelle", "Oulampane", "Balingore", "Coubalan", "Diegoune", "Djibidione", "Djinaki", "Karthiack", "Niamone", "Ouonck"],
      "Oussouye": ["Oussouye", "Djembéring", "Mlomp", "Oukout", "Santhiaba Manjacque"]
    }
  }
};

// Export pour module si besoin (compatible navigateur natif)
if (typeof window !== 'undefined') {
  window.PASTEF_DATA = DATA;
}