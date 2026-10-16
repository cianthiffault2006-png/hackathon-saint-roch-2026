import type { Role } from '../types'
import { fr } from '../i18n/fr'

// Visite guidée: the café story played on the real screens, in chapters.
// Everything the tour shows is a function of (step index, ms elapsed in the step): see etat.ts.

export type ChapitreId = keyof typeof fr.visite.chapitres
export type EtapeId = keyof typeof fr.visite.legendes | 'fin' | 'finSuite'
export type EcranVisite = 'accueil' | 'besoin' | 'proposition' | 'invitation' | 'fiche' | 'fil' | 'projets' | 'explorer' | 'profil' | 'nouveau' | 'sdc'
/** The main tour (about 2 min), then the « Suite de la visite » offered on its end card. */
export type Parcours = 'principal' | 'suite'

/** A scripted gesture: the fake cursor moves to a target, presses it, or the screen scrolls to it. */
export interface Geste {
  type: 'curseur' | 'clic' | 'defile'
  /** Start, in ms from the start of the step. */
  a: number
  /** CSS selector of the target. */
  cible: string
  /** Movement or scroll time (default 600 ms). */
  duree?: number
  /** Where the scroll puts the target (default « center »). */
  bloc?: 'start' | 'center' | 'end'
}

export interface Etape {
  id: EtapeId
  chapitre: ChapitreId
  ecran: EcranVisite
  dureeMs: number
  gestes: Geste[]
  parcours: Parcours
  /** A jump to this step replays the map (pins drop again). */
  rejoue?: boolean
}

export const ROLE_VISITE: Role = 'commerce'

export const TEXTE_VISITE = fr.visite.texteCafe

export const FIN_VISITE = fr.visite.finTitre

// Times inside steps, shared by the gestures below and the screen state in etat.ts.
export const T = {
  /** « saisie »: the text is typed over this time. */
  saisie: 4500,
  /** « puces »: the cursor presses one chip at each of these times. */
  puces: [1000, 2300, 3600, 4900],
  /** « bouton »: press on « Trouver des partenaires ». */
  bouton: 2600,
  /** « carte »: the 5-minute ring shows once the pins have dropped (400 ms apart, see Proposition). */
  anneau: 2600,
  /** « score »: press on « Comment ce score ». */
  score: 1100,
  /** « raisons »: first reason, then one every pas ms (5 reasons). */
  raisons: { debut: 900, pas: 1400 },
  /** « interet »: press on « Ça m’intéresse ». */
  interet: 1300,
  /** « attente »: press on « Voir ce que Camille reçoit ». */
  voir: 3800,
  /** « accepte »: press on « Accepter ». */
  accepter: 1500,
  /** « coches »: first tick, then one every pas ms. */
  coches: { debut: 1200, pas: 900 },
  /** « maj » and « discussion »: press on the tab. */
  onglet: 700,
  /** « discussion » timeline. */
  fil: {
    /** Incoming messages: typing indicator from [0], message shown at [1]. */
    recus: [[1000, 1900], [2200, 3100]] as [number, number][],
    /** Own message: typed between these times, then « Envoyer » is pressed. */
    frappe: [3500, 5000] as [number, number],
    envoi: 5700,
    /** The partner's reply: typing indicator, then the message. */
    reponse: [6500, 8000] as [number, number],
  },
  /** « Suite de la visite ». */
  suite: {
    /** « sofiaCarte »: the ring shows once the pins have dropped. */
    anneau: 2400,
    /** « filtres »: press on « Citoyens ». */
    citoyens: 1300,
    /** « recherche »: the search is typed between these times. */
    frappe: [1100, 2300] as [number, number],
    /** « liste »: press on « Liste », then on the profile's « Voir le profil ». */
    liste: 1000,
    profil: 4600,
    /** « nouveau »: press on « Exemple ». */
    exemple: 1700,
  },
} as const

/** The public profile the suite opens (an organisation recognised by the City). */
export const PROFIL_VISITE = 'p-proprete'
/** The asker of the suite's second story. */
export const SOFIA = 'p-sofia'

// Selectors (data attributes are set by the screens for the tour; classes are the screens' own).
const S = {
  puce: (groupe: string, valeur: string) => `[aria-label="${groupe}"] [data-valeur="${valeur}"]`,
  trouver: '.besoin .pied .btn-primaire',
  detail: '.detail-bouton',
  barres: '.barres',
  pourquoi: '[data-visite="pourquoi"]',
  raison: (i: number) => `[data-visite="raison-${i}"]`,
  aConfirmer: '[data-visite="a-confirmer"]',
  evenements: '[data-visite="evenements"]',
  interet: '.pied-feuille > :first-child',
  voir: '.btn-invitation',
  invitDate: '.p2-date',
  invitPourquoi: '#p2-pourquoi',
  invitActions: '.p2-actions',
  accepter: '.p2-btn-primaire',
  accepte: '.p2-accepte',
  coches: '.fiche .coches',
  actions: '.fiche .actions',
  ongletMaj: '#pj-tab-maj',
  ongletDiscussion: '#pj-tab-discussion',
  filFin: '[data-visite="fil-fin"]',
  champFil: '[data-visite="fil-champ"]',
  envoyer: '[data-visite="fil-envoyer"]',
  partenaires: '[data-visite="partenaires"]',
  exCitoyens: '[data-genre="citoyen"]',
  exRecherche: '.ex-recherche input',
  exListe: '[data-visite="ex-liste"]',
  exProfil: `[data-visite="profil-${PROFIL_VISITE}"]`,
  ppOffre: '#pp-offre',
  exemple: '[data-visite="exemple"]',
  avant: '#pj-avant',
  sdcTypes: '#p2-types',
  sdcImpact: '.p2-sdc-impact',
}

/** The chips the cursor presses, in order: they match what the engine reads in the café's text. */
export const PUCES_VISITE: { groupe: 'offre' | 'cherche' | 'creneaux'; valeur: string }[] = [
  { groupe: 'offre', valeur: 'espace_interieur' },
  { groupe: 'cherche', valeur: 'contenu_artistique' },
  { groupe: 'cherche', valeur: 'animation' },
  { groupe: 'creneaux', valeur: 'semaine_soir' },
]
const GROUPE = { offre: fr.besoin.jOffre, cherche: fr.besoin.jeCherche, creneaux: fr.besoin.puces.titreCreneaux }

const puceSel = (i: number) => S.puce(GROUPE[PUCES_VISITE[i].groupe], PUCES_VISITE[i].valeur)

const PRINCIPAL: Omit<Etape, 'parcours'>[] = [
  // Step 1 is kept exactly as it was (3 s): Cian's call.
  { id: 'role', chapitre: 'ouverture', ecran: 'accueil', dureeMs: 3000, gestes: [] },

  { id: 'saisie', chapitre: 'besoin', ecran: 'besoin', dureeMs: 5500, gestes: [] },
  {
    id: 'puces', chapitre: 'besoin', ecran: 'besoin', dureeMs: 5900,
    // The screen scrolls with the cursor, so each chip is in view when it is pressed.
    gestes: T.puces.flatMap((a, i): Geste[] => [
      { type: 'defile', a: a - 750, cible: puceSel(i), duree: 550, bloc: 'center' },
      { type: 'curseur', a: a - 750, cible: puceSel(i), duree: 600 },
      { type: 'clic', a, cible: puceSel(i) },
    ]),
  },
  {
    id: 'bouton', chapitre: 'besoin', ecran: 'besoin', dureeMs: 3500,
    gestes: [
      { type: 'curseur', a: 300, cible: S.trouver, duree: 800 },
      { type: 'clic', a: T.bouton, cible: S.trouver },
    ],
  },

  { id: 'carte', chapitre: 'proposition', ecran: 'proposition', dureeMs: 6000, gestes: [], rejoue: true },
  {
    id: 'score', chapitre: 'proposition', ecran: 'proposition', dureeMs: 6000,
    gestes: [
      { type: 'curseur', a: 300, cible: S.detail, duree: 700 },
      { type: 'clic', a: T.score, cible: S.detail },
      { type: 'defile', a: T.score + 300, cible: S.barres, duree: 800, bloc: 'center' },
    ],
  },
  {
    id: 'raisons', chapitre: 'proposition', ecran: 'proposition', dureeMs: 8200,
    gestes: [
      { type: 'defile', a: 0, cible: S.pourquoi, duree: 800, bloc: 'start' },
      ...[0, 1, 2, 3, 4].map((i): Geste => ({ type: 'defile', a: T.raisons.debut + i * T.raisons.pas, cible: S.raison(i), duree: 500, bloc: 'end' })),
    ],
  },
  {
    id: 'aConfirmer', chapitre: 'proposition', ecran: 'proposition', dureeMs: 6000,
    gestes: [
      { type: 'defile', a: 0, cible: S.aConfirmer, duree: 800, bloc: 'start' },
      { type: 'defile', a: 2800, cible: S.evenements, duree: 800, bloc: 'start' },
    ],
  },
  {
    id: 'interet', chapitre: 'proposition', ecran: 'proposition', dureeMs: 3600,
    gestes: [
      { type: 'curseur', a: 200, cible: S.interet, duree: 800 },
      { type: 'clic', a: T.interet, cible: S.interet },
    ],
  },
  {
    id: 'attente', chapitre: 'proposition', ecran: 'proposition', dureeMs: 4500,
    gestes: [
      { type: 'curseur', a: 2600, cible: S.voir, duree: 700 },
      { type: 'clic', a: T.voir, cible: S.voir },
    ],
  },

  {
    id: 'invitation', chapitre: 'partenaire', ecran: 'invitation', dureeMs: 6500,
    gestes: [{ type: 'defile', a: 2500, cible: S.invitDate, duree: 900, bloc: 'center' }],
  },
  {
    id: 'pourquoiVous', chapitre: 'partenaire', ecran: 'invitation', dureeMs: 5500,
    gestes: [{ type: 'defile', a: 0, cible: S.invitPourquoi, duree: 900, bloc: 'start' }],
  },
  {
    id: 'accepte', chapitre: 'partenaire', ecran: 'invitation', dureeMs: 4800,
    gestes: [
      { type: 'defile', a: 0, cible: S.invitActions, duree: 700, bloc: 'center' },
      { type: 'curseur', a: 300, cible: S.accepter, duree: 800 },
      { type: 'clic', a: T.accepter, cible: S.accepter },
      { type: 'defile', a: T.accepter + 200, cible: S.accepte, duree: 600, bloc: 'center' },
    ],
  },
  { id: 'confirme', chapitre: 'partenaire', ecran: 'proposition', dureeMs: 4500, gestes: [] },

  { id: 'fiche', chapitre: 'fiche', ecran: 'fiche', dureeMs: 5000, gestes: [] },
  {
    id: 'coches', chapitre: 'fiche', ecran: 'fiche', dureeMs: 5500,
    gestes: [{ type: 'defile', a: 0, cible: S.coches, duree: 800, bloc: 'center' }],
  },
  {
    id: 'actions', chapitre: 'fiche', ecran: 'fiche', dureeMs: 5000,
    gestes: [{ type: 'defile', a: 0, cible: S.actions, duree: 800, bloc: 'center' }],
  },

  { id: 'participants', chapitre: 'fil', ecran: 'fil', dureeMs: 5500, gestes: [] },
  {
    id: 'maj', chapitre: 'fil', ecran: 'fil', dureeMs: 4800,
    gestes: [
      { type: 'curseur', a: 0, cible: S.ongletMaj, duree: 600 },
      { type: 'clic', a: T.onglet, cible: S.ongletMaj },
    ],
  },
  {
    id: 'discussion', chapitre: 'fil', ecran: 'fil', dureeMs: 10500,
    gestes: [
      { type: 'curseur', a: 0, cible: S.ongletDiscussion, duree: 600 },
      { type: 'clic', a: T.onglet, cible: S.ongletDiscussion },
      { type: 'defile', a: T.fil.recus[0][0], cible: S.filFin, duree: 400, bloc: 'end' },
      { type: 'defile', a: T.fil.recus[1][0], cible: S.filFin, duree: 400, bloc: 'end' },
      { type: 'defile', a: T.fil.frappe[0] - 400, cible: S.champFil, duree: 400, bloc: 'center' },
      { type: 'curseur', a: T.fil.frappe[1] - 200, cible: S.envoyer, duree: 600 },
      { type: 'clic', a: T.fil.envoi, cible: S.envoyer },
      { type: 'defile', a: T.fil.reponse[0], cible: S.filFin, duree: 500, bloc: 'end' },
    ],
  },

  { id: 'projets', chapitre: 'projets', ecran: 'projets', dureeMs: 4000, gestes: [] },
  { id: 'fin', chapitre: 'projets', ecran: 'projets', dureeMs: 5000, gestes: [] },
]

/**
 * Hook for the « Réclamer ce profil » step (branch feat/reclamer): one step on the 'profil' screen,
 * chapter 'profil', right after « profil ». Add its caption to fr.visite.legendes and its state to etat.ts.
 */
const RECLAMER: Omit<Etape, 'parcours'>[] = []

const SUITE: Omit<Etape, 'parcours'>[] = [
  { id: 'sofiaCarte', chapitre: 'sofia', ecran: 'proposition', dureeMs: 6500, gestes: [], rejoue: true },
  {
    id: 'sofiaPartenaires', chapitre: 'sofia', ecran: 'proposition', dureeMs: 7000,
    gestes: [{ type: 'defile', a: 300, cible: S.partenaires, duree: 800, bloc: 'start' }],
  },

  { id: 'explorer', chapitre: 'explorer', ecran: 'explorer', dureeMs: 5000, gestes: [] },
  {
    id: 'filtres', chapitre: 'explorer', ecran: 'explorer', dureeMs: 6000,
    gestes: [
      { type: 'curseur', a: 400, cible: S.exCitoyens, duree: 700 },
      { type: 'clic', a: T.suite.citoyens, cible: S.exCitoyens },
    ],
  },
  {
    id: 'recherche', chapitre: 'explorer', ecran: 'explorer', dureeMs: 4600,
    gestes: [
      { type: 'curseur', a: 100, cible: S.exRecherche, duree: 600 },
      { type: 'clic', a: 800, cible: S.exRecherche },
    ],
  },
  {
    id: 'liste', chapitre: 'explorer', ecran: 'explorer', dureeMs: 5300,
    gestes: [
      { type: 'curseur', a: 100, cible: S.exListe, duree: 600 },
      { type: 'clic', a: T.suite.liste, cible: S.exListe },
      { type: 'curseur', a: T.suite.profil - 900, cible: S.exProfil, duree: 700 },
      { type: 'clic', a: T.suite.profil, cible: S.exProfil },
    ],
  },

  {
    id: 'profil', chapitre: 'profil', ecran: 'profil', dureeMs: 6500,
    // No scroll: it pushed the badge under the bar for the last 3.3 s.
    gestes: [],
  },
  ...RECLAMER,

  {
    id: 'nouveau', chapitre: 'projetOuvert', ecran: 'nouveau', dureeMs: 5000,
    gestes: [
      { type: 'curseur', a: 700, cible: S.exemple, duree: 700 },
      { type: 'clic', a: T.suite.exemple, cible: S.exemple },
    ],
  },
  {
    id: 'avant', chapitre: 'projetOuvert', ecran: 'nouveau', dureeMs: 7000,
    gestes: [{ type: 'defile', a: 0, cible: S.avant, duree: 900, bloc: 'center' }],
  },

  {
    id: 'sdc', chapitre: 'sdc', ecran: 'sdc', dureeMs: 6000,
    gestes: [{ type: 'defile', a: 3200, cible: S.sdcTypes, duree: 800, bloc: 'center' }],
  },
  {
    id: 'sdcImpact', chapitre: 'sdc', ecran: 'sdc', dureeMs: 5000,
    gestes: [{ type: 'defile', a: 0, cible: S.sdcImpact, duree: 800, bloc: 'end' }],
  },
  { id: 'finSuite', chapitre: 'sdc', ecran: 'sdc', dureeMs: 5000, gestes: [] },
]

export const ETAPES: Etape[] = [
  ...PRINCIPAL.map((e): Etape => ({ ...e, parcours: 'principal' })),
  ...SUITE.map((e): Etape => ({ ...e, parcours: 'suite' })),
]

/** First step of the « Suite de la visite ». */
export const DEBUT_SUITE = ETAPES.findIndex((e) => e.parcours === 'suite')

/** Last step of each tour: its end card. */
export const estFin = (e: Etape) => e.id === 'fin' || e.id === 'finSuite'

export function indexDe(id: EtapeId): number {
  return ETAPES.findIndex((e) => e.id === id)
}

/** The caption of a step, with the live values it names (the scores, the partner's first name). */
export function legendeDe(etape: Etape, valeurs: { score: number; prenom: string; scoreSofia: number }): string {
  if (etape.id === 'fin') return fr.visite.titre
  if (etape.id === 'finSuite') return fr.visite.suite
  const l: string | ((v: never) => string) = fr.visite.legendes[etape.id]
  if (typeof l === 'string') return l
  if (etape.id === 'score') return (l as (n: number) => string)(valeurs.score)
  if (etape.id === 'sofiaPartenaires') return (l as (n: number) => string)(valeurs.scoreSofia)
  return (l as (p: string) => string)(valeurs.prenom)
}
