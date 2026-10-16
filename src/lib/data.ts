import type { Evenement, Lieu, Profil } from '../types'
import * as fixtures from '../fixtures'
import { chargerPresentation, presentationDemandee, type Presentation } from './presentation'

export interface Donnees {
  profils: Profil[]
  lieux: Lieu[]
  evenements: Evenement[]
  /** Provided rows for the laptop presentation mode (?presentation=1, local files only); never in production. */
  presentation?: Presentation | null
}

async function charger<T>(nom: string, repli: T[]): Promise<T[]> {
  try {
    const rep = await fetch(`${import.meta.env.BASE_URL}data/${nom}.json`)
    if (!rep.ok) return repli
    const json: unknown = await rep.json()
    return Array.isArray(json) && json.length > 0 ? (json as T[]) : repli
  } catch {
    return repli
  }
}

export async function chargerDonnees(): Promise<Donnees> {
  const [profils, lieux, evenements] = await Promise.all([
    charger('profils', fixtures.profils),
    charger('lieux', fixtures.lieux),
    charger('evenements', fixtures.evenements),
  ])
  const presentation = presentationDemandee() ? await chargerPresentation(import.meta.env.BASE_URL) : null
  return { profils, lieux, evenements, presentation }
}
