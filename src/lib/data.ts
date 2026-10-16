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

// Typographic apostrophe in every displayed name (cards, partner lists, pins), as the engine already does in titles.
const typo = <T extends { nom: string }>(xs: T[]): T[] => xs.map((x) => (x.nom.includes("'") ? { ...x, nom: x.nom.replace(/'/g, '’') } : x))

export async function chargerDonnees(): Promise<Donnees> {
  const [profils, lieux, evenements] = await Promise.all([
    charger('profils', fixtures.profils),
    charger('lieux', fixtures.lieux),
    charger('evenements', fixtures.evenements),
  ])
  const presentation = presentationDemandee() ? await chargerPresentation(import.meta.env.BASE_URL) : null
  return { profils: typo(profils), lieux: typo(lieux), evenements, presentation }
}
