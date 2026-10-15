import type { Besoin, Creneau, Profil, Role, Tag } from '../types'
import { lireBesoin } from '../engineAdapter'

// Demo rule: each role is played by its story profile.
export const ASKER_PAR_ROLE: Record<Role, string> = {
  commerce: 'story-cafe',
  citoyen: 'story-artiste',
  organisme: 'story-organisme',
}

export function trouverAsker(role: Role, profils: Profil[]): Profil | undefined {
  return profils.find((p) => p.id === ASKER_PAR_ROLE[role])
}

function union<T>(...listes: T[][]): T[] {
  return Array.from(new Set(listes.flat()))
}

/** The asker's profile plus what was typed and chosen. Offers never go into needs. */
export function construireBesoin(
  role: Role,
  texte: string,
  profils: Profil[],
  choix: { cherche: Tag[]; offre: Tag[]; creneaux: Creneau[] },
): Besoin {
  const asker = trouverAsker(role, profils)
  const lu = lireBesoin(texte)
  return {
    auteurRole: role,
    auteurId: asker?.id ?? ASKER_PAR_ROLE[role],
    texte,
    besoins: union(asker?.besoins ?? [], choix.cherche),
    offres: union(asker?.offres ?? [], choix.offre),
    creneaux: union(asker?.creneaux ?? [], choix.creneaux),
    themes: union(asker?.themes ?? [], lu.themes),
    lat: asker?.lat ?? 46.8135,
    lng: asker?.lng ?? -71.2205,
  }
}
