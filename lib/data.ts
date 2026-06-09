import type { DB } from './types';

const DB: DB = {
  VERSES: [
    { t: "Car c'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c'est le don de Dieu.", r: 'Éphésiens 2:8' },
    { t: "L'Éternel est mon berger : je ne manquerai de rien.", r: 'Psaume 23:1' },
    { t: 'Je puis tout par celui qui me fortifie.', r: 'Philippiens 4:13' },
    { t: 'Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.', r: 'Psaume 119:105' },
  ],

  MODULES: {
    enseignements: { key:'enseignements', label:'Enseignements', short:'Enseignements', icon:'book',    c:'ens', verse:'block',  desc:'Séries, études bibliques et messages' },
    evangelisation:{ key:'evangelisation',label:'Évangélisation',short:'Évangélisation',icon:'compass',c:'eva', verse:'block',  desc:'Sorties, programmes et rapports' },
    priere:        { key:'priere',        label:'Prière',        short:'Prière',        icon:'flame',   c:'pri', verse:'banner', desc:'Sujets de prière de la communauté' },
    temoignages:   { key:'temoignages',   label:'Témoignages',   short:'Témoignages',   icon:'quote',   c:'tem', verse:'banner', desc:'Ce que Dieu a fait dans nos vies' },
    annonces:      { key:'annonces',      label:'Annonces',      short:'Annonces',      icon:'mega',    c:'ann', verse:'banner', desc:"Vie de l'église et évènements" },
    ipb:           { key:'ipb',           label:'IPB',           short:'Institut',      icon:'cap',     c:'ipb', verse:'none',   desc:'Institut de Pédagogie Biblique' },
    ressources:    { key:'ressources',    label:'Ressources',    short:'Ressources',    icon:'folder',  c:'res', verse:'banner', desc:'PDF, audio, partitions, plans' },
    librairie:     { key:'librairie',     label:'Librairie',     short:'Librairie',     icon:'books',   c:'res', verse:'banner', desc:'Livres écrits par la communauté' },
  },

  HUB_ORDER: ['enseignements','priere','temoignages','evangelisation','annonces','ipb','ressources','librairie'],

  ENSEIGNEMENTS: [
    { id:'e1', serie:'Marcher par la foi', titre:'La foi qui déplace les montagnes', auteur:'Pasteur Daniel Mbarga', date:'4 juin 2026', duree:'38 min', type:'video', yt:'wpcCm8YnD7w', theme:'Foi', n:3, total:6,
      excerpt:"Une foi vivante ne se mesure pas à son intensité émotionnelle mais à son objet : Christ. Dans ce message, nous explorons comment une confiance ancrée transforme l'épreuve en témoignage." },
    { id:'e2', serie:'Marcher par la foi', titre:'Quand Dieu semble silencieux', auteur:'Pasteur Daniel Mbarga', date:'28 mai 2026', duree:'41 min', type:'text', theme:'Foi', n:2, total:6,
      excerpt:"Le silence de Dieu n'est pas son absence. À travers la vie de Job, découvrons la fidélité qui demeure quand les réponses tardent." },
    { id:'e3', serie:'Fondations', titre:'Comprendre la grâce', auteur:'Past. Esther Nguema', date:'21 mai 2026', duree:'33 min', type:'video', yt:'wpcCm8YnD7w', theme:'Grâce', n:1, total:4,
      excerpt:"La grâce n'est pas une faiblesse de Dieu envers le péché, mais la puissance qui nous relève et nous restaure." },
    { id:'e4', serie:'Vie de prière', titre:'Prier selon la volonté de Dieu', auteur:'Frère Samuel Owona', date:'14 mai 2026', duree:'29 min', type:'text', theme:'Prière', n:1, total:5,
      excerpt:"Apprendre à prier, ce n'est pas trouver les bons mots, mais aligner notre cœur sur celui du Père." },
    { id:'e5', serie:'Fondations', titre:"L'autorité des Écritures", auteur:'Past. Esther Nguema', date:'7 mai 2026', duree:'45 min', type:'text', theme:'Doctrine', n:2, total:4,
      excerpt:"Pourquoi la Bible fait-elle autorité dans nos vies ? Un fondement pour tout disciple." },
  ],

  SERIES: [
    { id:'s1', titre:'Marcher par la foi', n:6, c:'Foi', meta:'Série en cours' },
    { id:'s2', titre:'Fondations', n:4, c:'Doctrine', meta:'4 messages' },
    { id:'s3', titre:'Vie de prière', n:5, c:'Prière', meta:'5 messages' },
  ],

  TEMOIGNAGES: [
    { id:'t1', titre:'Guéri contre toute attente', auteur:'Marie-Claire T.', date:'2 juin 2026', cat:'Guérison', statut:'publie',
      excerpt:"Les médecins n'avaient plus d'espoir. Mais la communauté a prié, et aujourd'hui je marche de nouveau. Je veux rendre gloire à Dieu.",
      full:"En janvier, on m'a diagnostiqué une affection que les médecins jugeaient irréversible. J'ai demandé à la cellule de prière de m'accompagner. Pendant trois mois, chaque mercredi, des frères et sœurs ont intercédé. Lors du dernier contrôle, le spécialiste lui-même n'a pas pu expliquer ce qu'il voyait. Je marche, je travaille, je vis. Tout est grâce." },
    { id:'t2', titre:'Restauration de mon foyer', auteur:'Jean & Pauline N.', date:'27 mai 2026', cat:'Famille', statut:'publie',
      excerpt:"Notre mariage était au bord de la rupture. Dieu a fait ce que nous croyions impossible.",
      full:"Après huit ans, nous ne nous parlions presque plus. Un couple de l'église nous a accompagnés dans la prière et l'écoute. Petit à petit, le pardon est revenu. Nous célébrons aujourd'hui dix ans, réconciliés." },
    { id:'t3', titre:'De la rue à la lumière', auteur:'Anonyme', date:'19 mai 2026', cat:'Conversion', statut:'publie',
      excerpt:"J'ai connu la rue et la dépendance. Une sortie d'évangélisation a croisé mon chemin un soir.",
      full:"Je dormais sous un pont. Un soir, une équipe MIEC est venue partager un repas et la Parole. Ils ne m'ont pas jugé. Six mois plus tard, je suis sobre, logé, et je sers dans cette même équipe." },
    { id:'t4', titre:'Un emploi après deux ans', auteur:'Thomas E.', date:'11 mai 2026', cat:'Provision', statut:'publie',
      excerpt:"Deux ans de recherche, de doute. La provision de Dieu est arrivée au moment exact.",
      full:"J'ai failli abandonner. La cellule m'a encouragé à persévérer dans la prière et l'effort. L'offre est venue d'un contact rencontré… à l'église." },
  ],

  ANNONCES: [
    { id:'a1', titre:'Culte de reconnaissance — Dimanche 15 juin', cat:'Culte', date:'15 juin 2026', urgent:true,
      excerpt:"Un culte spécial d'action de grâce à 9h30. Invitez largement autour de vous.",
      full:"Nous vous convions à un culte de reconnaissance pour clôturer le semestre. Louange renouvelée, témoignages et sainte cène. Rendez-vous au temple central à 9h30. Un repas fraternel suivra." },
    { id:'a2', titre:'Retraite spirituelle des jeunes', cat:'Évènement', date:'27–29 juin 2026', urgent:false,
      excerpt:"Trois jours de ressourcement pour les 16–30 ans. Inscriptions ouvertes.",
      full:"Le département jeunesse organise sa retraite annuelle sur le thème « Enracinés ». Hébergement, ateliers, veillées. Places limitées à 80. Participation : 15 000 FCFA." },
    { id:'a3', titre:'Nouvelle cellule de quartier — Bonapriso', cat:"Vie d'église", date:'10 juin 2026', urgent:false,
      excerpt:"Une cellule ouvre ses portes chaque jeudi à 19h. Bienvenue à tous.",
      full:"Pour rapprocher la communauté, une nouvelle cellule de maison démarre à Bonapriso. Rencontres chaque jeudi : louange, étude et prière. Contactez le frère responsable pour l'adresse." },
    { id:'a4', titre:'Collecte solidaire — fournitures scolaires', cat:'Solidarité', date:'5 juin 2026', urgent:false,
      excerpt:"Aidons 50 enfants à faire leur rentrée. Points de dépôt à l'accueil.",
      full:"L'action sociale MIEC lance sa collecte annuelle. Cahiers, stylos, cartables. Déposez vos dons à l'accueil jusqu'au 30 juin." },
  ],

  PRIERES: [
    { id:'p1', sujet:'Pour la santé de ma mère hospitalisée', auteur:'Grâce M.', date:'il y a 2 h', cat:'Santé', prie:34, urgent:true,
      full:"Ma mère est hospitalisée depuis lundi. Les examens sont en cours. Je demande à la communauté de s'unir pour sa guérison et la paix de notre famille." },
    { id:'p2', sujet:"Examens de fin d'année de mes enfants", auteur:'Daniel O.', date:'il y a 5 h', cat:'Famille', prie:21, urgent:false,
      full:"Mes trois enfants passent des examens décisifs cette semaine. Priez pour la sérénité, la concentration et la réussite." },
    { id:'p3', sujet:'Direction pour un choix de carrière', auteur:'Anonyme', date:'hier', cat:'Direction', prie:18, urgent:false,
      full:"Je dois choisir entre deux opportunités. Je cherche la volonté de Dieu et la sagesse pour décider." },
    { id:'p4', sujet:'Reconnaissance — contrat signé', auteur:'Esther K.', date:'hier', cat:'Action de grâce', prie:47, urgent:false,
      full:"Après des mois d'attente, le contrat est signé ! Je rends grâce et je prie pour ceux qui attendent encore." },
  ],

  RESSOURCES: [
    { id:'r1', titre:'Plan de lecture — La Bible en 1 an', type:'plan', fmt:'Plan', taille:'12 étapes', cat:'Plans de lecture', date:'Mai 2026' },
    { id:'r2', titre:'Étude : les noms de Dieu', type:'pdf', fmt:'PDF', taille:'2,4 Mo', cat:'Études', date:'Mai 2026' },
    { id:'r3', titre:'Louange — « Tu es fidèle » (live)', type:'audio', fmt:'Audio', taille:'6 min 12', cat:'Audio', date:'Avr. 2026' },
    { id:'r4', titre:'Partition — « Saint, Saint, Saint »', type:'partition', fmt:'Partition', taille:'PDF · 3 p.', cat:'Partitions', date:'Avr. 2026' },
    { id:'r5', titre:'Guide du nouveau converti', type:'pdf', fmt:'PDF', taille:'1,1 Mo', cat:'Études', date:'Mar. 2026' },
    { id:'r6', titre:'Méditation audio — Psaume 23', type:'audio', fmt:'Audio', taille:'9 min 40', cat:'Audio', date:'Mar. 2026' },
  ],

  LIVRES: [
    { id:'b1', titre:'Enracinés en Christ', auteur:'Pasteur Daniel Mbarga', annee:2025, pages:184, cat:'Vie chrétienne',
      desc:"Un parcours en douze étapes pour bâtir une foi solide et durable, ancrée dans la Parole et la communauté.",
      extrait:"« Être enraciné, ce n'est pas être immobile. C'est puiser en profondeur ce qui nous permet de porter du fruit en saison. »" },
    { id:'b2', titre:'Le silence et la voix', auteur:'Past. Esther Nguema', annee:2024, pages:142, cat:'Prière',
      desc:"Méditations sur l'écoute de Dieu dans une époque saturée de bruit.",
      extrait:"« Dieu murmure plus souvent qu'il ne tonne. Encore faut-il faire taire le tumulte pour l'entendre. »" },
    { id:'b3', titre:'Aux carrefours de la ville', auteur:'Frère Samuel Owona', annee:2024, pages:96, cat:'Évangélisation',
      desc:"Récits et principes d'une évangélisation urbaine incarnée et respectueuse.",
      extrait:"« L'Évangile ne se crie pas du haut d'une estrade ; il se partage à hauteur de regard. »" },
  ],

  SORTIES: [
    { id:'so1', titre:'Marché central de Mvog-Mbi', date:'14 juin 2026', heure:'08h00', statut:'a_venir', theme:'Espérance', equipe:12,
      full:"Sortie d'évangélisation de proximité au marché central. Distribution de tracts, échanges et prière pour les commerçants. Point de rassemblement : parvis du temple à 8h." },
    { id:'so2', titre:'Quartier Bonabéri', date:'21 juin 2026', heure:'15h00', statut:'a_venir', theme:'Pardon', equipe:8,
      full:"Porte-à-porte fraternel et soutien aux familles. Préparation spirituelle samedi 18h." },
    { id:'so3', titre:'Campus universitaire', date:'30 mai 2026', heure:'10h00', statut:'passee', theme:'Identité', equipe:15, contacts:23, decisions:5,
      full:"Une matinée riche sur le campus. 23 conversations engagées, 5 personnes ont souhaité en savoir plus et seront recontactées par la cellule étudiante." },
    { id:'so4', titre:'Gare routière', date:'16 mai 2026', heure:'07h00', statut:'passee', theme:'Paix', equipe:10, contacts:31, decisions:8,
      full:"Forte affluence. L'équipe a distribué 200 portions d'Évangile et prié avec de nombreux voyageurs. 8 décisions enregistrées." },
  ],

  IPB_PROGRAMME: [
    { code:'BIB-101', titre:"Introduction à l'Ancien Testament", credits:3, niveau:'Année 1' },
    { code:'BIB-102', titre:'Introduction au Nouveau Testament', credits:3, niveau:'Année 1' },
    { code:'THE-110', titre:'Doctrines fondamentales', credits:4, niveau:'Année 1' },
    { code:'HER-201', titre:'Herméneutique biblique', credits:3, niveau:'Année 2' },
    { code:'HIS-210', titre:"Histoire de l'Église", credits:3, niveau:'Année 2' },
    { code:'MIN-301', titre:'Théologie pastorale', credits:4, niveau:'Année 3' },
  ],

  IPB_COURS: [
    { id:'c1', code:'BIB-101', titre:"Introduction à l'Ancien Testament", prof:'Past. Esther Nguema', prog:62, modules:8, fait:5,
      docs:[{t:'Syllabus du cours',f:'PDF · 8 p.'},{t:'Module 5 — Les Prophètes',f:'PDF · 24 p.'},{t:"Lecture : Ésaïe 40–55",f:'Texte'},{t:'Devoir 3 — à rendre le 20 juin',f:'PDF · 2 p.'}] },
    { id:'c2', code:'THE-110', titre:'Doctrines fondamentales', prof:'Pasteur Daniel Mbarga', prog:38, modules:10, fait:4,
      docs:[{t:'Syllabus du cours',f:'PDF · 10 p.'},{t:'Module 4 — La Trinité',f:'PDF · 18 p.'},{t:'Notes de cours — Christologie',f:'Texte'}] },
    { id:'c3', code:'HER-201', titre:'Herméneutique biblique', prof:'Frère Samuel Owona', prog:15, modules:9, fait:1,
      docs:[{t:'Syllabus du cours',f:'PDF · 6 p.'},{t:'Module 1 — Contexte et genre',f:'PDF · 14 p.'}] },
  ],

  ACTIVITY: {
    enseignement: {} as never, // set below
    annonce: {} as never,
    temoignage: {} as never,
    sortie: {} as never,
    ipb: { titre:"Rentrée académique 2026–2027", date:"Inscriptions jusqu'au 15 août" },
  },
};

// circular references resolved after definition
DB.ACTIVITY.enseignement = DB.ENSEIGNEMENTS[0];
DB.ACTIVITY.annonce      = DB.ANNONCES[0];
DB.ACTIVITY.temoignage   = DB.TEMOIGNAGES[0];
DB.ACTIVITY.sortie       = DB.SORTIES[0];

export default DB;
