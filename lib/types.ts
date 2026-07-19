import type React from 'react';

export type AccentKey = 'ens' | 'eva' | 'pri' | 'tem' | 'ann' | 'ipb' | 'res' | 'slate';
export type Role = 'visiteur' | 'membre' | 'responsable' | 'super_admin';

export interface UserProfile {
  id: string;
  nom_complet: string;
  telephone_whatsapp?: string;
  role: 'membre' | 'responsable' | 'super_admin';
  etudiant_ipb: boolean;
  actif?: boolean;
  notif_email?: boolean;
  notif_whatsapp?: boolean;
}

// Notification reçue par le membre courant (table notifications, par destinataire).
export interface AppNotification {
  id: string;
  type: string;     // priere | temoignage | annonce | enseignement | evangelisation | inscription_ipb
  titre: string;
  message: string;
  lien?: string;    // URL relative vers le contenu
  lu: boolean;
  created_at: string;
}
export type PageKey =
  | 'accueil' | 'recherche' | 'priere' | 'compte'
  | 'enseignements' | 'temoignages' | 'annonces' | 'evangelisation'
  | 'ipb' | 'ressources' | 'librairie' | 'detail';

export type DetailType =
  | 'enseignement' | 'temoignage' | 'annonce' | 'sortie'
  | 'livre' | 'priere' | 'ressource' | 'doc';

export interface StackEntry {
  page: PageKey;
  params?: string;
  type?: DetailType;
  item?: unknown;
}

export interface CSSVars extends React.CSSProperties {
  [key: `--${string}`]: string | number;
}

export interface Verse { t: string; r: string }

export interface Module {
  key: string; label: string; short: string; icon: string;
  c: AccentKey; verse: string; desc: string;
}

export interface Enseignement {
  id: string; serie: string; titre: string; auteur: string;
  date: string; duree: string; type: string; yt?: string;
  theme: string; n: number; total: number; excerpt: string;
  texte?: string;
}

export interface Serie { id: string; titre: string; n: number; c: string; meta: string }

export interface Temoignage {
  id: string; titre: string; auteur: string; date: string;
  cat: string; statut: string; excerpt: string; full: string;
}

export interface Annonce {
  id: string; titre: string; cat: string; date: string;
  urgent: boolean; excerpt: string; full: string; photos?: string[];
}

export interface Priere {
  id: string; sujet: string; auteur: string; date: string;
  cat: string; prie: number; urgent: boolean; full: string;
}

export interface Ressource {
  id: string; titre: string; type: string; fmt: string;
  taille: string; cat: string; date: string; photo?: string; fichier?: string;
}

export interface Livre {
  id: string; titre: string; auteur: string; annee: number;
  pages: number; cat: string; desc: string; extrait: string; couverture?: string; lien_acces?: string;
}

export interface Sortie {
  id: string; titre: string; date: string; heure: string;
  statut: string; theme: string; equipe: number;
  // Nombre réel d'inscrits (table participations_sorties), distinct de `equipe`
  // (taille d'équipe saisie par l'admin/le rapport).
  participants?: number;
  contacts?: number; decisions?: number; full: string; photos?: string[];
}

export interface IPBCours {
  id: string; code: string; titre: string; prof: string;
  prog: number; modules: number; fait: number;
  docs: { t: string; f: string; url?: string }[];
  niveau?: string; desc?: string;
}

export interface IPBProgramme {
  code: string; titre: string; credits: number; niveau: string;
}

export interface DB {
  VERSES: Verse[];
  MODULES: Record<string, Module>;
  HUB_ORDER: string[];
  ENSEIGNEMENTS: Enseignement[];
  SERIES: Serie[];
  TEMOIGNAGES: Temoignage[];
  ANNONCES: Annonce[];
  PRIERES: Priere[];
  RESSOURCES: Ressource[];
  LIVRES: Livre[];
  SORTIES: Sortie[];
  IPB_PROGRAMME: IPBProgramme[];
  IPB_COURS: IPBCours[];
  ACTIVITY: {
    enseignement: Enseignement | null;
    annonce: Annonce | null;
    temoignage: Temoignage | null;
    sortie: Sortie | null;
    ipb: { titre: string; date: string } | null;
  };
}

export interface FavItem {
  type: DetailType;
  id: string;
  item: unknown;
  title: string;
  label: string;
  accent: AccentKey;
  icon: string;
}

export interface FrictionConfig {
  title: string;
  benefit: string;
  ipb?: boolean;
  mod?: string;
}
