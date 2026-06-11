import type { DB } from './types';

const DB: DB = {
  VERSES: [
    { t: "Car c'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c'est le don de Dieu.", r: 'Éphésiens 2:8' },
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

  // ── Données de contenu : VIDÉES. Les vraies données viennent de Supabase.
  //    Les loaders (lib/queries.ts) renvoient ces tableaux vides en repli, donc
  //    plus aucune donnée fictive ne s'affiche tant que Supabase est vide.
  ENSEIGNEMENTS: [],
  SERIES: [],
  TEMOIGNAGES: [],
  ANNONCES: [],
  PRIERES: [],
  RESSOURCES: [],
  LIVRES: [],
  SORTIES: [],
  IPB_PROGRAMME: [],
  IPB_COURS: [],

  // Activité « Cette semaine » : null tant qu'aucune vraie donnée Supabase.
  ACTIVITY: {
    enseignement: null,
    annonce: null,
    temoignage: null,
    sortie: null,
    ipb: null,
  },
};

export default DB;
