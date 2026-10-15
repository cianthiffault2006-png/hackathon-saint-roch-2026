import type { Role } from '../types'
import { fr } from '../i18n/fr'

// Visite guidée: the café story played on the real screens. Durations in ms, about 56 s in total.
export type EtapeId =
  | 'role' | 'saisie' | 'bouton' | 'carte' | 'raisons' | 'interet' | 'fiche' | 'coches' | 'projets' | 'fin'

export type LegendeId = 'role' | 'besoin' | 'proposition' | 'interet' | 'fiche' | 'coches' | 'projets'

export interface Etape {
  id: EtapeId
  ecran: 'accueil' | 'besoin' | 'proposition' | 'fiche' | 'projets'
  dureeMs: number
  /** Caption: a key of fr.visite.etapes, or one of the tour's own lines in textes.ts. */
  legende: LegendeId | null
  puis?: { apresMs: number; legende: 'confirme' }
}

export const ROLE_VISITE: Role = 'commerce'

export const TEXTE_VISITE = fr.visite.texteCafe

/** The typing takes this long at the start of the « saisie » step. */
export const SAISIE_MS = 4500

export const FIN_VISITE = fr.visite.finTitre

export const ETAPES: Etape[] = [
  { id: 'role', ecran: 'accueil', dureeMs: 4000, legende: 'role' },
  { id: 'saisie', ecran: 'besoin', dureeMs: 7000, legende: 'besoin' },
  { id: 'bouton', ecran: 'besoin', dureeMs: 3000, legende: 'besoin' },
  { id: 'carte', ecran: 'proposition', dureeMs: 7000, legende: 'proposition' },
  { id: 'raisons', ecran: 'proposition', dureeMs: 5000, legende: 'proposition' },
  { id: 'interet', ecran: 'proposition', dureeMs: 9000, legende: 'interet', puis: { apresMs: 5200, legende: 'confirme' } },
  { id: 'fiche', ecran: 'fiche', dureeMs: 5000, legende: 'fiche' },
  { id: 'coches', ecran: 'fiche', dureeMs: 5000, legende: 'coches' },
  { id: 'projets', ecran: 'projets', dureeMs: 5000, legende: 'projets' },
  { id: 'fin', ecran: 'projets', dureeMs: 6000, legende: null },
]

export function indexDe(id: EtapeId): number {
  return ETAPES.findIndex((e) => e.id === id)
}
