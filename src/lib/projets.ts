import type { Evenement, Lieu, Profil, Proposition, Role, Statut } from '../types'
import { prochaineDate, type Occurrence } from './date'

export interface PartenaireProjet {
  nom: string
  role: Role
  apport: string
}

/** A saved project: self-contained text, so the list works without the engine or the data files. */
export interface Projet extends Occurrence {
  id: string
  titre: string
  statut: Statut
  partenaires: PartenaireProjet[]
  lieuNom: string
  aConfirmer: string[]
  coches: boolean[]
  /** True for a public event the viewer joined (no approval): shown as « Inscrit ». */
  inscrit?: boolean
  evenementId?: string
  /** The proposition behind the project, for the project thread. */
  proposition?: Proposition
}

/** Id of the « Exemple » project of Nouveau projet (Sofia's corvée) when its title is left as is. */
export const ID_DEMO_SOFIA = 'ouvert-demo-sofia'

/**
 * The scripted demo projects shown to the jury get fixed dates (what prochaineDate gives on pitch day,
 * Oct 16), so their .ics can be prebuilt in public/ics and iOS opens its native calendar sheet.
 * Keyed by proposition id.
 */
export const DEMOS: Record<string, { fichier: string; date: Occurrence }> = {
  'prop-story-cafe-story-artiste+story-organisme': { fichier: 'demo-cafe', date: { jour: '2026-10-22', heureDebut: 19, heureFin: 22 } },
  [ID_DEMO_SOFIA]: { fichier: 'demo-corvee', date: { jour: '2026-10-24', heureDebut: 13, heureFin: 17 } },
}

const CLE = 'maillage.projets.v1'
let memoire: Projet[] = []

/** A stored record Mes projets can render: the fields every screen reads without a guard (date, partners, checklist). */
export function estProjet(x: unknown): x is Projet {
  if (typeof x !== 'object' || x === null) return false
  const p = x as Record<string, unknown>
  return typeof p.id === 'string' && typeof p.titre === 'string' && typeof p.statut === 'string'
    && typeof p.jour === 'string' && typeof p.heureDebut === 'number' && typeof p.heureFin === 'number'
    && typeof p.lieuNom === 'string' && Array.isArray(p.partenaires) && Array.isArray(p.aConfirmer) && Array.isArray(p.coches)
}

/** What the store holds, minus records from an older build or a hand edit: one bad row must not blank the screen. */
export function filtrerProjets(json: unknown): Projet[] | null {
  return Array.isArray(json) ? json.filter(estProjet) : null
}

export function chargerProjets(): Projet[] {
  try {
    const brut = window.localStorage.getItem(CLE)
    if (!brut) return memoire
    return filtrerProjets(JSON.parse(brut)) ?? memoire
  } catch {
    return memoire
  }
}

export function sauverProjets(projets: Projet[]): void {
  memoire = projets
  try {
    window.localStorage.setItem(CLE, JSON.stringify(projets))
  } catch {
    // Private mode or storage blocked: the list stays in memory for this visit.
  }
}

/** The proposed date of a suggestion: the fixed demo date, else the next matching slot. Shared by the Fiche and the partner invitation. */
export function dateProposee(p: Proposition): Occurrence {
  return DEMOS[p.id]?.date ?? prochaineDate(p.creneau)
}

export function idProjet(p: Proposition): string {
  return `${p.id}|${p.titre}`
}

export function projetDepuis(p: Proposition, profils: Profil[], lieux: Lieu[], statut: Statut): Projet {
  const partenaires: PartenaireProjet[] = []
  let hote = ''
  for (const c of p.partenaires) {
    const profil = profils.find((x) => x.id === c.profilId)
    if (!profil) continue
    partenaires.push({ nom: profil.nom, role: profil.role, apport: c.apport })
    if (!hote && (c.tags.includes('espace_interieur') || c.tags.includes('espace_exterieur'))) hote = profil.nom
  }
  const lieu = lieux.find((l) => l.id === p.lieuId)
  return {
    id: idProjet(p),
    titre: p.titre,
    statut,
    partenaires,
    lieuNom: lieu?.nom ?? hote,
    ...dateProposee(p),
    aConfirmer: p.aConfirmer,
    coches: p.aConfirmer.map(() => false),
    proposition: p,
  }
}

export function idEvenement(e: Evenement): string {
  return `evt|${e.id}`
}

function heureDe(iso: string): number {
  const [h, m] = iso.slice(11, 16).split(':').map(Number)
  return h + (m || 0) / 60
}

/** A public event joined with « Je participe »: a project that needs no acceptance. */
export function projetDepuisEvenement(e: Evenement, profils: Profil[]): Projet {
  const promoteur = profils.find((p) => p.id === e.promoteurId)
  return {
    id: idEvenement(e),
    titre: e.titre,
    statut: 'confirmee',
    partenaires: promoteur ? [{ nom: promoteur.nom, role: promoteur.role, apport: 'Organise l’événement' }] : [],
    lieuNom: e.lieuNom,
    jour: e.debut.slice(0, 10),
    heureDebut: heureDe(e.debut),
    heureFin: heureDe(e.fin),
    aConfirmer: [],
    coches: [],
    inscrit: true,
    evenementId: e.id,
  }
}

export function nombreCoches(p: Projet): number {
  return p.coches.filter(Boolean).length
}
