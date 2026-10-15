import type { Role } from '../types'

// Visite guidée: the café story played on the real screens. Durations in ms, about 46 s in total.
export type EtapeId = 'role' | 'saisie' | 'bouton' | 'carte' | 'raisons' | 'interet' | 'fin'

export interface Etape {
  id: EtapeId
  ecran: 'accueil' | 'besoin' | 'proposition'
  dureeMs: number
  /** Key of fr.visite.etapes shown as the caption; `puis` swaps it after a delay. */
  legende: 'role' | 'besoin' | 'proposition' | 'interet' | null
  puis?: { apresMs: number; legende: 'confirme' }
}

export const ROLE_VISITE: Role = 'commerce'

export const TEXTE_VISITE =
  'Je suis un café de Saint-Roch. Je cherche un artiste pour exposer sur mon mur le jeudi soir.'

/** The typing takes this long at the start of the « saisie » step. */
export const SAISIE_MS = 4500

export const FIN_VISITE = 'Maillage : les ressources du quartier, enfin connectées'

export const ETAPES: Etape[] = [
  { id: 'role', ecran: 'accueil', dureeMs: 5000, legende: 'role' },
  { id: 'saisie', ecran: 'besoin', dureeMs: 8000, legende: 'besoin' },
  { id: 'bouton', ecran: 'besoin', dureeMs: 4000, legende: 'besoin' },
  { id: 'carte', ecran: 'proposition', dureeMs: 8000, legende: 'proposition' },
  { id: 'raisons', ecran: 'proposition', dureeMs: 6000, legende: 'proposition' },
  { id: 'interet', ecran: 'proposition', dureeMs: 9000, legende: 'interet', puis: { apresMs: 5200, legende: 'confirme' } },
  { id: 'fin', ecran: 'proposition', dureeMs: 7000, legende: null },
]

export function indexDe(id: EtapeId): number {
  return ETAPES.findIndex((e) => e.id === id)
}
