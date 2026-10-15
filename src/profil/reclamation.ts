// « Réclamer ce profil » (simulé): pure logic and the localStorage format. No network, no real email.
import type { Creneau, Profil, Tag } from '../types'

export const CLE_RECLAMES = 'maillage.reclames'
/** Shown on screen so the jury can follow; nothing is ever sent. */
export const CODE_DEMO = '482913'

export type StatutReclamation = 'active' | 'en_attente'

export interface Reclamation {
  statut: StatutReclamation
  /** Edits made while claiming (active claims only). */
  nom?: string
  description?: string
  offres?: Tag[]
  besoins?: Tag[]
  creneaux?: Creneau[]
  contactPublic?: boolean
  /** ISO date of the simulated claim. */
  quand: string
}

export type Reclames = Record<string, Reclamation>

export interface Stockage {
  getItem(cle: string): string | null
  setItem(cle: string, valeur: string): void
  removeItem(cle: string): void
}

const STATUTS: StatutReclamation[] = ['active', 'en_attente']
const estTableau = (x: unknown): x is string[] => Array.isArray(x) && x.every((v) => typeof v === 'string')

/** Reads the saved claims; anything unreadable or malformed is ignored, never thrown. */
export function lireReclames(s: Stockage | null): Reclames {
  if (!s) return {}
  let brut: string | null
  try {
    brut = s.getItem(CLE_RECLAMES)
  } catch {
    return {}
  }
  if (!brut) return {}
  let json: unknown
  try {
    json = JSON.parse(brut)
  } catch {
    return {}
  }
  if (!json || typeof json !== 'object' || Array.isArray(json)) return {}
  const out: Reclames = {}
  for (const [id, v] of Object.entries(json as Record<string, unknown>)) {
    if (!v || typeof v !== 'object') continue
    const r = v as Partial<Reclamation>
    if (!r.statut || !STATUTS.includes(r.statut)) continue
    out[id] = {
      statut: r.statut,
      quand: typeof r.quand === 'string' ? r.quand : '',
      ...(typeof r.nom === 'string' ? { nom: r.nom } : {}),
      ...(typeof r.description === 'string' ? { description: r.description } : {}),
      ...(estTableau(r.offres) ? { offres: r.offres as Tag[] } : {}),
      ...(estTableau(r.besoins) ? { besoins: r.besoins as Tag[] } : {}),
      ...(estTableau(r.creneaux) ? { creneaux: r.creneaux as Creneau[] } : {}),
      ...(typeof r.contactPublic === 'boolean' ? { contactPublic: r.contactPublic } : {}),
    }
  }
  return out
}

export function ecrireReclames(s: Stockage | null, r: Reclames): void {
  if (!s) return
  try {
    if (Object.keys(r).length === 0) s.removeItem(CLE_RECLAMES)
    else s.setItem(CLE_RECLAMES, JSON.stringify(r))
  } catch {
    // Storage blocked or full: the claim lives in memory for this visit.
  }
}

export function avecReclamation(r: Reclames, id: string, rec: Reclamation): Reclames {
  return { ...r, [id]: rec }
}

export function sansReclamation(r: Reclames, id: string): Reclames {
  if (!(id in r)) return r
  const suite = { ...r }
  delete suite[id]
  return suite
}

/**
 * The one place where « pré-rempli » meets the local claim: an active claim turns `reclame` on and applies
 * the owner's edits. Citizens are never pre-filled, so they are never touched. Same array back when nothing applies.
 */
export function appliquerReclames(profils: Profil[], r: Reclames): Profil[] {
  if (Object.keys(r).length === 0) return profils
  return profils.map((p) => {
    const rec = r[p.id]
    if (!rec || rec.statut !== 'active' || p.role === 'citoyen') return p
    return {
      ...p,
      nom: rec.nom?.trim() || p.nom,
      description: rec.description?.trim() || p.description,
      offres: rec.offres ?? p.offres,
      besoins: rec.besoins ?? p.besoins,
      creneaux: rec.creneaux ?? p.creneaux,
      contactPublic: rec.contactPublic ?? false,
      reclame: true,
    }
  })
}

export type BadgeReclamation = 'sdc' | 'ville'

/** Which badge an activated profile gets, from the list that vouches for it. Null: on no list (no-link path only). */
export function badgeReclamation(p: Pick<Profil, 'verifie'>): BadgeReclamation | null {
  return p.verifie === 'sdc' ? 'sdc' : p.verifie === 'ville' ? 'ville' : null
}

/** Pre-filled business or organisation with no active local claim (a pending request still counts as not claimed). */
export function estReclamable(p: Profil, r: Reclames = {}): boolean {
  return p.role !== 'citoyen' && !p.reclame && r[p.id]?.statut !== 'active'
}

export function normaliser(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘`]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Search by name over businesses and organisations not yet claimed, accents and case ignored. */
export function rechercherAReclamer(profils: Profil[], requete: string, r: Reclames = {}): Profil[] {
  const q = normaliser(requete)
  return profils
    .filter((p) => estReclamable(p, r) && (!q || normaliser(p.nom).includes(q)))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr-CA'))
}

export type VerifCode = 'ok' | 'format' | 'incorrect'

/** Six digits, spaces allowed (« 482 913 »). */
export function verifierCode(saisie: string): VerifCode {
  const c = saisie.replace(/\s/g, '')
  if (!/^\d{6}$/.test(c)) return 'format'
  return c === CODE_DEMO ? 'ok' : 'incorrect'
}

/** Format only: nothing is sent, nothing is looked up. */
export function courrielValide(s: string): boolean {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(s.trim())
}

/** A masked fictional address derived from the profile name, never a real one: « r•••@exemple.ca ». */
export function courrielMasque(p: Pick<Profil, 'nom'>): string {
  const premiere = normaliser(p.nom).replace(/[^a-z]/g, '').charAt(0) || 'c'
  return `${premiere}•••@exemple.ca`
}
