import type { Statut } from '../types'
import { ETAPES, PUCES_VISITE, T, indexDe, type EtapeId, type Parcours } from './script'

// Pure functions of the tour clock: the step at a time, and the state of every screen at (step, ms).
// Nothing here reads the DOM or a timer, so pausing, resuming and jumping are exact.
// The main tour and the « Suite de la visite » each have their own timeline (and progress bar).

/** First and last step of a tour. */
export function bornes(parcours: Parcours): { premier: number; dernier: number } {
  const premier = ETAPES.findIndex((e) => e.parcours === parcours)
  let dernier = premier
  while (dernier + 1 < ETAPES.length && ETAPES[dernier + 1].parcours === parcours) dernier++
  return { premier, dernier }
}

/** Start of each step, in ms from the start of its own tour. */
export const DEBUTS: number[] = ETAPES.reduce<number[]>(
  (acc, e, i) => [...acc, i === 0 || ETAPES[i - 1].parcours !== e.parcours ? 0 : acc[i - 1] + ETAPES[i - 1].dureeMs],
  [],
)

export function dureeParcours(parcours: Parcours): number {
  const { dernier } = bornes(parcours)
  return DEBUTS[dernier] + ETAPES[dernier].dureeMs
}

/** Length of the main tour. */
export const DUREE_TOTALE = dureeParcours('principal')

/** The step playing at time t (ms from the start of that tour), and the time elapsed in it. */
export function etapeA(t: number, parcours: Parcours = 'principal'): { index: number; ms: number } {
  const { premier, dernier } = bornes(parcours)
  const temps = Math.max(0, Math.min(t, dureeParcours(parcours)))
  let index = premier
  while (index < dernier && DEBUTS[index + 1] <= temps) index++
  return { index, ms: temps - DEBUTS[index] }
}

/** Time from the start of the step's own tour. */
export function tempsGlobal(index: number, ms: number): number {
  return DEBUTS[index] + ms
}

/** Words in a caption: tokens that hold a letter or a digit (« : » and « » » do not count). */
export function motsDe(texte: string): number {
  return texte.split(/\s+/).filter((m) => /[\p{L}\p{N}]/u.test(m)).length
}

/** Minimum time on screen for a caption: words / 3 + 1.5 seconds. */
export function lectureMs(texte: string): number {
  return Math.ceil((motsDe(texte) / 3 + 1.5) * 1000)
}

export type OngletVisite = 'participants' | 'maj' | 'discussion'

export interface EtatFil {
  /** Incoming messages shown (0 to 2). */
  recus: number
  /** Index of the incoming message being typed (typing indicator), or null. */
  ecrit: number | null
  /** Share of the tour's own message typed in the field (0 to 1). */
  frappe: number
  /** The own message has been sent; ms since then (for the 15 s countdown), or null. */
  envoyeDepuis: number | null
  /** The partner is typing the reply. */
  reponseEcrit: boolean
  reponse: boolean
}

export interface EtatEcrans {
  /** Share of the café's text typed (0 to 1). */
  texte: number
  /** Chips pressed so far, in the order of PUCES_VISITE. */
  puces: number
  /** « Trouver des partenaires » (besoin) or the calendar and share buttons (fiche) pulse. */
  pulse: boolean
  statut: Statut
  /** The pins drop (first step on the map only). */
  chute: boolean
  anneau: boolean
  detail: boolean
  raisons: number
  accepte: boolean
  coches: number
  onglet: OngletVisite
  fil: EtatFil
  /** Suite: the explorer's filters, search (share typed) and list view. */
  explorer: { citoyens: boolean; frappe: number; liste: boolean }
  /** Suite: « Proposer un projet ouvert » shows the Exemple. */
  exemple: boolean
}

const avant = (i: number, id: EtapeId) => i < indexDe(id)
const apres = (i: number, id: EtapeId) => i > indexDe(id)
const compte = (temps: readonly number[], ms: number) => temps.filter((t) => t <= ms).length
const borne = (x: number) => Math.max(0, Math.min(1, x))

/** Everything the screens show at (step index, ms in the step). Rebuildable from the index alone. */
export function etatEcrans(index: number, ms: number): EtatEcrans {
  const id = ETAPES[index].id
  const ici = (e: EtapeId) => id === e

  const texte = avant(index, 'saisie') ? 0 : ici('saisie') ? borne(ms / T.saisie) : 1
  const puces = avant(index, 'puces') ? 0 : ici('puces') ? compte(T.puces, ms) : PUCES_VISITE.length

  let statut: Statut = 'proposee'
  if (ici('interet')) statut = ms >= T.interet ? 'interet_envoye' : 'proposee'
  else if (index >= indexDe('attente') && index < indexDe('confirme')) statut = 'en_attente'
  else if (index >= indexDe('confirme')) statut = 'confirmee'

  const raisonsTemps = [0, 1, 2, 3, 4].map((k) => T.raisons.debut + k * T.raisons.pas)
  const raisons = avant(index, 'raisons') ? 0 : ici('raisons') ? compte(raisonsTemps, ms) : 99

  const cochesTemps = Array.from({ length: 8 }, (_, k) => T.coches.debut + k * T.coches.pas)
  const coches = avant(index, 'coches') ? 0 : ici('coches') ? compte(cochesTemps, ms) : 99

  let onglet: OngletVisite = 'participants'
  if (ici('maj')) onglet = ms >= T.onglet ? 'maj' : 'participants'
  else if (ici('discussion')) onglet = ms >= T.onglet ? 'discussion' : 'maj'

  const f = T.fil
  const fil: EtatFil = ici('discussion')
    ? {
        recus: compte(f.recus.map((r) => r[1]), ms),
        ecrit: f.recus.findIndex((r) => r[0] <= ms && ms < r[1]) >= 0 ? f.recus.findIndex((r) => r[0] <= ms && ms < r[1]) : null,
        frappe: ms >= f.envoi ? 0 : borne((ms - f.frappe[0]) / (f.frappe[1] - f.frappe[0])),
        envoyeDepuis: ms >= f.envoi ? ms - f.envoi : null,
        reponseEcrit: f.reponse[0] <= ms && ms < f.reponse[1],
        reponse: ms >= f.reponse[1],
      }
    : { recus: 0, ecrit: null, frappe: 0, envoyeDepuis: null, reponseEcrit: false, reponse: false }

  const S = T.suite
  const suite = ETAPES[index].parcours === 'suite'
  const explorer = {
    citoyens: apres(index, 'filtres') || (ici('filtres') && ms >= S.citoyens),
    frappe: avant(index, 'recherche') ? 0 : ici('recherche') ? borne((ms - S.frappe[0]) / (S.frappe[1] - S.frappe[0])) : 1,
    liste: apres(index, 'liste') || (ici('liste') && ms >= S.liste),
  }

  return {
    texte,
    puces,
    pulse: ici('bouton') || ici('actions'),
    statut,
    chute: ici('carte') || ici('sofiaCarte'),
    anneau: ici('carte') ? ms >= T.anneau : ici('sofiaCarte') ? ms >= S.anneau : true,
    // The score detail belongs to the café's proposal; Sofia's shows closed.
    detail: !suite && (apres(index, 'score') || (ici('score') && ms >= T.score)),
    raisons,
    accepte: apres(index, 'accepte') || (ici('accepte') && ms >= T.accepter),
    coches,
    onglet,
    fil,
    explorer,
    exemple: apres(index, 'nouveau') || (ici('nouveau') && ms >= S.exemple),
  }
}

export interface PoseCurseur {
  /** Previous target (null: the cursor fades in at the target). */
  de: string | null
  vers: string
  /** Progress of the move (0 to 1). */
  progres: number
  /** ms since the last press, while it shows (under 350 ms), or null. */
  presse: number | null
}

/** Where the fake cursor is at (step, ms), or null when it is hidden. */
export function poseCurseur(index: number, ms: number): PoseCurseur | null {
  const gestes = ETAPES[index].gestes
  const moves = gestes.filter((g) => g.type === 'curseur')
  let k = -1
  moves.forEach((g, i) => {
    if (g.a <= ms) k = i
  })
  if (k < 0) return null
  const g = moves[k]
  const clic = gestes.filter((c) => c.type === 'clic' && c.a <= ms).pop()
  const presse = clic && ms - clic.a < 350 ? ms - clic.a : null
  return { de: k > 0 ? moves[k - 1].cible : null, vers: g.cible, progres: borne((ms - g.a) / (g.duree ?? 600)), presse }
}

export interface PoseDefile {
  /** Target where the scroll starts (null: top). */
  de: string | null
  deBloc: 'start' | 'center' | 'end'
  /** Target where it ends (null: top). */
  vers: string | null
  bloc: 'start' | 'center' | 'end'
  progres: number
}

/** Last scroll target of the steps before this one on the same screen (null: top of the screen). */
function departDefile(index: number): { cible: string | null; bloc: 'start' | 'center' | 'end' } {
  const ecran = ETAPES[index].ecran
  for (let j = index - 1; j >= 0 && ETAPES[j].ecran === ecran; j--) {
    const d = ETAPES[j].gestes.filter((g) => g.type === 'defile').pop()
    if (d) return { cible: d.cible, bloc: d.bloc ?? 'center' }
  }
  return { cible: null, bloc: 'start' }
}

/** The scroll position at (step, ms): between two targets, so a jump rebuilds it exactly. */
export function poseDefile(index: number, ms: number): PoseDefile {
  const defs = ETAPES[index].gestes.filter((g) => g.type === 'defile')
  const depart = departDefile(index)
  let k = -1
  defs.forEach((g, i) => {
    if (g.a <= ms) k = i
  })
  if (k < 0) return { de: depart.cible, deBloc: depart.bloc, vers: depart.cible, bloc: depart.bloc, progres: 1 }
  const g = defs[k]
  const prec = k > 0 ? { cible: defs[k - 1].cible, bloc: defs[k - 1].bloc ?? 'center' } : depart
  return { de: prec.cible, deBloc: prec.bloc, vers: g.cible, bloc: g.bloc ?? 'center', progres: borne((ms - g.a) / (g.duree ?? 600)) }
}

/** Chapter list in order, with the first step of each and its tour. */
export const CHAPITRES = ETAPES.reduce<{ id: (typeof ETAPES)[number]['chapitre']; premier: number; parcours: Parcours }[]>((acc, e, i) => {
  if (!acc.some((c) => c.id === e.chapitre)) acc.push({ id: e.chapitre, premier: i, parcours: e.parcours })
  return acc
}, [])
