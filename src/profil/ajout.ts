// « Ajouter ma fiche » (simulé): a business or organisation on no directory asks the SDC to add it.
// Pure logic and the localStorage format. No network, no real email. A pending request is never public:
// it goes neither on the map nor in the partner pool; only its owner previews it.
import type { Profil, Tag } from '../types'
import { courrielValide } from './reclamation'

export const CLE_AJOUTS = 'maillage.ajouts'
/** Shown on the SDC dashboard next to the local requests: the pilot's fictional backlog. */
export const AJOUTS_FICTIFS = 2

export type TypeAjout = 'commerce' | 'organisme' | 'citoyen'

/** What the form collects. The email is checked, never stored (same rule as the claim flow). */
export interface Formulaire {
  nom: string
  type: TypeAjout
  adresse: string
  courriel: string
  phrase: string
  offres: Tag[]
  besoins: Tag[]
  consentement: boolean
}

export interface DemandeAjout {
  id: string
  type: 'commerce' | 'organisme'
  nom: string
  adresse: string
  phrase: string
  offres: Tag[]
  besoins: Tag[]
  /** ISO date of the simulated request. */
  quand: string
}

export interface Stockage {
  getItem(cle: string): string | null
  setItem(cle: string, valeur: string): void
  removeItem(cle: string): void
}

export const FORMULAIRE_VIDE: Formulaire = { nom: '', type: 'commerce', adresse: '', courriel: '', phrase: '', offres: [], besoins: [], consentement: false }

export type ErreurAjout = 'nom' | 'adresse' | 'courriel' | 'consentement' | 'citoyen'

/** First problem in form order, or null. Citizens never get a fiche, so a person cannot send the request. */
export function validerFormulaire(f: Formulaire): ErreurAjout | null {
  if (f.type === 'citoyen') return 'citoyen'
  if (!f.nom.trim()) return 'nom'
  if (!f.adresse.trim()) return 'adresse'
  if (!courrielValide(f.courriel)) return 'courriel'
  if (!f.consentement) return 'consentement'
  return null
}

/** The request saved from a valid form: trimmed, without the email. */
export function demandeDepuis(f: Formulaire, quand: string, id = `ajout-${Date.now()}`): DemandeAjout {
  if (f.type === 'citoyen') throw new Error('Un citoyen n’a pas de fiche publique')
  return { id, type: f.type, nom: f.nom.trim(), adresse: f.adresse.trim(), phrase: f.phrase.trim(), offres: f.offres, besoins: f.besoins, quand }
}

/** Saint-Roch, place Jacques-Cartier: the preview needs a position, never a real one. */
const CENTRE = { lat: 46.8128, lng: -71.2246 }

/** How the fiche will look once the SDC confirms it: a profile for the preview only, never added to the data. */
export function profilApercu(d: DemandeAjout): Profil {
  return {
    id: d.id,
    role: d.type,
    sousType: d.adresse,
    nom: d.nom,
    description: d.phrase,
    lat: CENTRE.lat,
    lng: CENTRE.lng,
    offres: d.offres,
    besoins: d.besoins,
    creneaux: [],
    themes: [],
    source: 'utilisateur',
    origine: 'Demande d’ajout (démo)',
    reclame: true,
    verifie: 'non',
    contactPublic: false,
  }
}

const TYPES: DemandeAjout['type'][] = ['commerce', 'organisme']
const estTableau = (x: unknown): x is string[] => Array.isArray(x) && x.every((v) => typeof v === 'string')

/** Reads the saved requests; anything unreadable or malformed is ignored, never thrown. */
export function lireAjouts(s: Stockage | null): DemandeAjout[] {
  if (!s) return []
  let brut: string | null
  try {
    brut = s.getItem(CLE_AJOUTS)
  } catch {
    return []
  }
  if (!brut) return []
  let json: unknown
  try {
    json = JSON.parse(brut)
  } catch {
    return []
  }
  if (!Array.isArray(json)) return []
  const out: DemandeAjout[] = []
  for (const v of json) {
    if (!v || typeof v !== 'object') continue
    const d = v as Partial<DemandeAjout>
    if (typeof d.id !== 'string' || typeof d.nom !== 'string' || !d.type || !TYPES.includes(d.type)) continue
    out.push({
      id: d.id,
      type: d.type,
      nom: d.nom,
      adresse: typeof d.adresse === 'string' ? d.adresse : '',
      phrase: typeof d.phrase === 'string' ? d.phrase : '',
      offres: estTableau(d.offres) ? (d.offres as Tag[]) : [],
      besoins: estTableau(d.besoins) ? (d.besoins as Tag[]) : [],
      quand: typeof d.quand === 'string' ? d.quand : '',
    })
  }
  return out
}

export function ecrireAjouts(s: Stockage | null, liste: DemandeAjout[]): void {
  if (!s) return
  try {
    if (liste.length === 0) s.removeItem(CLE_AJOUTS)
    else s.setItem(CLE_AJOUTS, JSON.stringify(liste))
  } catch {
    // Storage blocked or full: the request lives in memory for this visit.
  }
}
