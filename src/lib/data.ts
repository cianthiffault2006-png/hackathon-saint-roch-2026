import type { Evenement, Lieu, Profil } from '../types'
import * as fixtures from '../fixtures'

export interface Donnees {
  profils: Profil[]
  lieux: Lieu[]
  evenements: Evenement[]
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
  return { profils, lieux, evenements }
}
