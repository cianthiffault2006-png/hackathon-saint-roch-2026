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

/**
 * What was typed and ticked, completed by the asker's profile. The profile's standing needs come along only
 * when every chosen need is already one of them (the demo); a need outside the profile is the request, alone.
 * The time slots are the user's when given; the profile's offers stay (what the café has), typed ones first.
 * Offers never go into needs.
 */
export function construireBesoin(
  role: Role,
  texte: string,
  profils: Profil[],
  choix: { cherche: Tag[]; offre: Tag[]; creneaux: Creneau[] },
  sansProfil = false,
): Besoin {
  // « Je démarre »: no existing profile; the engine scores an anonymous asker.
  const asker = sansProfil ? undefined : trouverAsker(role, profils)
  const lu = lireBesoin(texte)
  const besoinsProfil = asker?.besoins ?? []
  const horsProfil = choix.cherche.some((t) => !besoinsProfil.includes(t))
  return {
    auteurRole: role,
    auteurId: sansProfil ? undefined : asker?.id ?? ASKER_PAR_ROLE[role],
    texte,
    besoins: horsProfil ? [...choix.cherche] : union(besoinsProfil, choix.cherche),
    offres: union(choix.offre, asker?.offres ?? []),
    creneaux: choix.creneaux.length ? [...choix.creneaux] : [...(asker?.creneaux ?? [])],
    themes: union(asker?.themes ?? [], lu.themes),
    lat: asker?.lat ?? 46.8135,
    lng: asker?.lng ?? -71.2205,
  }
}

/**
 * Chips read from typed text. A typed "je cherche" tag is dropped when the asker's profile already
 * offers it, and a typed "j'offre" tag when the profile needs it, so the profile stays coherent.
 */
export function choixDepuisTexte(
  role: Role,
  texte: string,
  profils: Profil[],
): { cherche: Tag[]; offre: Tag[]; creneaux: Creneau[] } {
  const asker = trouverAsker(role, profils)
  const lu = lireBesoin(texte)
  return {
    cherche: lu.besoins.filter((t) => !asker?.offres.includes(t)),
    offre: lu.offres.filter((t) => !asker?.besoins.includes(t)),
    creneaux: lu.creneaux,
  }
}

export type Choix = { cherche: Tag[]; offre: Tag[]; creneaux: Creneau[] }

/** Per chip row: what the user turned on by hand (kept when the text stops giving it) and off by hand (never re-added by the text). */
export type Manuels<T> = { mains: Set<T>; retires: Set<T> }
export const manuels = <T,>(): Manuels<T> => ({ mains: new Set<T>(), retires: new Set<T>() })

/** Chips the app adds for the user (e.g. the partner picked in the explorer) count as hand-picked. */
export function marquerMains<T>(m: Manuels<T>, xs: T[]): void {
  for (const x of xs) {
    m.mains.add(x)
    m.retires.delete(x)
  }
}

/** A tap on a chip: returns the new row and records the choice. */
export function basculer<T>(liste: T[], x: T, m: Manuels<T>): T[] {
  if (liste.includes(x)) {
    m.mains.delete(x)
    m.retires.add(x)
    return liste.filter((y) => y !== x)
  }
  marquerMains(m, [x])
  return [...liste, x]
}

/**
 * One keystroke: a chip the previous text gave and this text no longer gives goes, unless picked by hand;
 * chips this text gives are added, unless removed by hand. Without this, « le jeudi » lit « Semaine, jour »
 * mid-typing and it stayed after « soir » arrived.
 */
export function suivreSaisie<T>(actuels: T[], luAvant: T[], luMaintenant: T[], m: Manuels<T> = manuels<T>()): T[] {
  const gardes = actuels.filter((x) => !luAvant.includes(x) || luMaintenant.includes(x) || m.mains.has(x))
  return [...gardes, ...luMaintenant.filter((x) => !gardes.includes(x) && !m.retires.has(x))]
}
