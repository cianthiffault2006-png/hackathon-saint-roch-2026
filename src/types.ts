// Maillage: data contract (frozen at gate 1, 2026-10-15 10:50; changes need Cian's OK and a BOARD line)

export type Role = 'commerce' | 'organisme' | 'citoyen';

/** What a profile or a place can offer, or needs. */
export type Tag =
  | 'espace_interieur' | 'espace_exterieur' | 'visibilite' | 'affichage'
  | 'benevoles' | 'public' | 'contenu_artistique' | 'animation'
  | 'materiel' | 'expertise' | 'financement' | 'nourriture';

export type Creneau = 'semaine_jour' | 'semaine_soir' | 'fin_de_semaine';

export type Theme =
  | 'culture' | 'art' | 'communautaire' | 'jeunesse' | 'etudiants'
  | 'environnement' | 'commerce_local' | 'securite' | 'sport' | 'alimentation';

export type TypeProjet =
  | 'exposition' | 'spectacle' | 'atelier' | 'marche_ephemere'
  | 'animation_de_rue' | 'verdissement' | 'conference' | 'collecte' | 'corvee_proprete';

/** fictif = fake row using the columns of a City file; ouvert = open data; utilisateur = typed in the app */
export type Source = 'fictif' | 'ouvert' | 'utilisateur' | 'fourni';  // fourni = provided file row, laptop presentation mode only (added day 2)

export interface Profil {
  id: string;
  role: Role;
  sousType: string;          // e.g. 'café', 'artiste', 'étudiant', 'organisme culturel'
  nom: string;               // fictional names only
  description: string;       // one sentence, French
  lat: number;
  lng: number;
  offres: Tag[];
  besoins: Tag[];
  creneaux: Creneau[];
  themes: Theme[];
  source: Source;
  origine: string;           // City file whose columns it mimics, e.g. 'Liste organismes reconnus LSVC'
  reclame: boolean;          // false = pre-filled, hidden until the owner claims it
  verifie?: 'sdc' | 'ville' | 'non';  // who vouches: SDC member, organism recognized by the City, or self-registered (added 12:55)
  contactPublic?: boolean;   // opt-in: contact buttons shown to others only when true (Loi 25)
}

export interface Lieu {
  id: string;
  nom: string;
  type: 'parc' | 'salle' | 'lieu_culturel' | 'place_publique' | 'stationnement' | 'colonne_morris';
  lat: number;
  lng: number;
  offres: Tag[];
  source: Source;
  attribution: string;       // licence line shown in the app
}

export interface Evenement {
  id: string;
  titre: string;
  promoteurId?: string;      // a Profil id when the promoter is in the app
  lieuNom: string;
  lat: number;
  lng: number;
  debut: string;             // ISO 8601, local time
  fin: string;
  categorie: string;
  themes: Theme[];
  source: Source;
  ouvertAuPublic?: boolean;  // true = anyone can say « Je participe » without approval (added 12:55)
  inscrits?: number;         // fictional RSVP count shown on public events
}

/** A need typed by a user, after lireBesoin() and the chips. */
export interface Besoin {
  auteurRole: Role;
  auteurId?: string;
  texte: string;
  besoins: Tag[];
  offres: Tag[];
  creneaux: Creneau[];
  themes: Theme[];
  lat?: number;
  lng?: number;
}

export interface Contribution {
  profilId: string;
  apport: string;            // French, e.g. 'accueille l’exposition le jeudi soir'
  tags: Tag[];
}

export interface DetailScore {
  complementarite: number;   // each 0..100, with its weight in the total
  reciprocite: number;
  proximite: number;
  creneau: number;
  theme: number;
  poids: { complementarite: number; reciprocite: number; proximite: number; creneau: number; theme: number };
}

export type Statut = 'proposee' | 'interet_envoye' | 'en_attente' | 'confirmee';

export interface Proposition {
  id: string;
  titre: string;             // French, e.g. 'Exposition collaborative au café'
  type: TypeProjet;
  partenaires: Contribution[];  // the asker first, then 2 partners
  lieuId?: string;           // a Lieu when no partner offers the space
  creneau: Creneau;
  score: number;             // 0..100
  detailScore?: DetailScore; // optional breakdown shown in « Comment ce score » (added 11:35, Cian's jury review)
  raisons: string[];         // 'Pourquoi cette suggestion' lines, French
  aConfirmer: string[];      // 'À confirmer' lines, French
  evenementsProches: string[]; // Evenement ids nearby in time and place
  statut: Statut;
}

/** Engine API (src/engine/). Phase 2 swaps lireBesoin for a language model; screens do not change. */
export type LireBesoin = (texte: string) => Pick<Besoin, 'besoins' | 'offres' | 'creneaux' | 'themes'>;
export type Proposer = (besoin: Besoin, profils: Profil[], lieux: Lieu[], evenements: Evenement[]) => Proposition[];
