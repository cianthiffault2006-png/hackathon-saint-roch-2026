import type { Evenement, Lieu, Profil } from '../types'

/** Rows from the organizers' provided files, built on the laptop by scripts/build_presentation.py (never deployed). */
export interface Presentation {
  profils: Profil[]
  lieux: Lieu[]
  evenements: Evenement[]
}

/** `?presentation=1` in the URL asks for the local rows; without it the app never requests them. */
export function presentationDemandee(search: string = typeof location === 'undefined' ? '' : location.search): boolean {
  return new URLSearchParams(search).get('presentation') === '1'
}

/** Fetches the three local files served by Vite in dev/preview only; null when absent (production, or script not run). */
export async function chargerPresentation(base: string): Promise<Presentation | null> {
  const lire = async <T,>(nom: string): Promise<T[]> => {
    try {
      const rep = await fetch(`${base}presentation/${nom}.json`)
      if (!rep.ok) return []
      const json: unknown = await rep.json()
      return Array.isArray(json) ? (json as T[]) : []
    } catch {
      return []
    }
  }
  const [profils, lieux, evenements] = await Promise.all([lire<Profil>('profils-reels'), lire<Lieu>('lieux-reels'), lire<Evenement>('evenements-reels')])
  if (profils.length + lieux.length + evenements.length === 0) return null
  return { profils, lieux, evenements }
}

/**
 * Display data = app data plus the provided rows. The engine keeps `profils`/`lieux`/`evenements` untouched,
 * so the two tour stories are identical in presentation mode; the real rows appear in the explorer and the public profiles.
 */
export function fusionnerAffichage<T extends { profils: Profil[]; lieux: Lieu[]; evenements: Evenement[] }>(d: T, p: Presentation | null | undefined): Presentation {
  if (!p) return { profils: d.profils, lieux: d.lieux, evenements: d.evenements }
  const ids = new Set(d.profils.map((x) => x.id))
  return {
    profils: [...d.profils, ...p.profils.filter((x) => !ids.has(x.id) && x.role !== 'citoyen' && x.reclame === false)],
    lieux: [...d.lieux, ...p.lieux],
    evenements: [...d.evenements, ...p.evenements],
  }
}
