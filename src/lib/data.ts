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

// Typographic apostrophe in every displayed text field (names, descriptions, event titles), as the engine already does in titles.
// Straight apostrophes, « (Charest ) » → « (Charest) », « L’OEil » → « L’Œil ».
const apo = (s: string) => s.replace(/'/g, '’').replace(/\s+\)/g, ')').replace(/\bOE(?=[a-zé])/g, 'Œ')
const typo = <T extends object>(xs: T[], champs: (keyof T)[]): T[] =>
  xs.map((x) => { const y = { ...x }; for (const c of champs) if (typeof y[c] === 'string') (y[c] as string) = apo(y[c] as string); return y })

export async function chargerDonnees(): Promise<Donnees> {
  const [profils, lieux, evenements] = await Promise.all([
    charger('profils', fixtures.profils),
    charger('lieux', fixtures.lieux),
    charger('evenements', fixtures.evenements),
  ])
  const presentation = presentationDemandee() ? await chargerPresentation(import.meta.env.BASE_URL) : null
  return {
    profils: typo(profils, ['nom', 'description', 'sousType']),
    lieux: typo(lieux, ['nom']),
    evenements: typo(evenements, ['titre', 'lieuNom']),
    presentation,
  }
}
