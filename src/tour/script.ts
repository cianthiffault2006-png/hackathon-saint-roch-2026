import type { Role } from '../types'
import { fr } from '../i18n/fr'

// Visite guidée: the café story played on the real screens. Durations in ms, about 56 s in total.
export type EtapeId =
  | 'role' | 'saisie' | 'bouton' | 'carte' | 'raisons' | 'interet' | 'invitation' | 'confirme' | 'fiche' | 'coches' | 'fil' | 'projets' | 'fin'

export type LegendeId = 'role' | 'besoin' | 'proposition' | 'interet' | 'invitation' | 'confirme' | 'fiche' | 'coches' | 'fil' | 'projets'

export interface Etape {
  id: EtapeId
  ecran: 'accueil' | 'besoin' | 'proposition' | 'invitation' | 'fiche' | 'fil' | 'projets'
  dureeMs: number
  /** Caption: a key of fr.visite.etapes. */
  legende: LegendeId | null
}

export const ROLE_VISITE: Role = 'commerce'

export const TEXTE_VISITE = fr.visite.texteCafe

/** The typing takes this long at the start of the « saisie » step. */
export const SAISIE_MS = 4500

export const FIN_VISITE = fr.visite.finTitre

export const ETAPES: Etape[] = [
  { id: 'role', ecran: 'accueil', dureeMs: 3000, legende: 'role' },
  { id: 'saisie', ecran: 'besoin', dureeMs: 6000, legende: 'besoin' },
  { id: 'bouton', ecran: 'besoin', dureeMs: 2500, legende: 'besoin' },
  { id: 'carte', ecran: 'proposition', dureeMs: 6000, legende: 'proposition' },
  { id: 'raisons', ecran: 'proposition', dureeMs: 4500, legende: 'proposition' },
  { id: 'interet', ecran: 'proposition', dureeMs: 4500, legende: 'interet' },
  { id: 'invitation', ecran: 'invitation', dureeMs: 4500, legende: 'invitation' },
  { id: 'confirme', ecran: 'proposition', dureeMs: 3000, legende: 'confirme' },
  { id: 'fiche', ecran: 'fiche', dureeMs: 4000, legende: 'fiche' },
  { id: 'coches', ecran: 'fiche', dureeMs: 4000, legende: 'coches' },
  { id: 'fil', ecran: 'fil', dureeMs: 6000, legende: 'fil' },
  { id: 'projets', ecran: 'projets', dureeMs: 4000, legende: 'projets' },
  { id: 'fin', ecran: 'projets', dureeMs: 5000, legende: null },
]

export function indexDe(id: EtapeId): number {
  return ETAPES.findIndex((e) => e.id === id)
}
