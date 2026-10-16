import type { Besoin, Creneau, Profil, Role, Tag, TypeProjet } from '../types'
import { besoinsExplicites, lireBesoin } from '../engineAdapter'
import { typeDemande } from '../engine/proposer'
import { fr } from '../i18n/fr'

/** « Créer le projet quand même »: the « Proposer un projet » form filled from the need (and the wanted partner, invited). */
export interface Depart {
  titre: string
  description: string
  type?: TypeProjet
  creneau?: Creneau
  roles: Tag[]
  invites: Record<string, Tag[]>
  auteurId?: string
}

export function departDepuisBesoin(besoin: Besoin, profils: Profil[]): Depart {
  const type = typeDemande(besoin.texte)
  const texte = besoin.texte.trim()
  const roles = [...besoin.besoins]
  const invites: Record<string, Tag[]> = {}
  const voulu = besoin.voulu ? profils.find((p) => p.id === besoin.voulu && p.id !== besoin.auteurId) : undefined
  if (voulu) {
    let tags = voulu.offres.filter((t) => roles.includes(t))
    // Nothing they offer is asked for: their first offer becomes an open role, so they still have a place.
    if (!tags.length && voulu.offres.length) {
      roles.push(voulu.offres[0])
      tags = [voulu.offres[0]]
    }
    // Invited once, for the first matching role (one row in the list, not one per role).
    if (tags.length) invites[voulu.id] = [tags[0]]
  }
  return {
    // A title, not the need sentence: the type when the text names one, else a neutral one. The sentence stays in the description.
    titre: type ? fr.proposition.typesProjet[type] : fr.proposition.nouveauProjet,
    description: texte,
    type,
    creneau: besoin.creneaux[0],
    roles,
    invites,
    auteurId: besoin.auteurId,
  }
}

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
    // No profile, no address: no « Depuis chez vous » distances.
    ...(sansProfil ? {} : { lat: asker?.lat ?? 46.8135, lng: asker?.lng ?? -71.2205 }),
  }
}

/**
 * Chips read from typed text. A need tag is dropped when the asker's profile already offers it, unless
 * the text asks for it in so many words (« nous cherchons des bénévoles »), and a typed "j'offre" tag when the profile needs it, so the profile stays coherent.
 */
export function choixDepuisTexte(
  role: Role,
  texte: string,
  profils: Profil[],
): { cherche: Tag[]; offre: Tag[]; creneaux: Creneau[] } {
  const asker = trouverAsker(role, profils)
  const lu = lireBesoin(texte)
  const demandes = besoinsExplicites(texte)
  return {
    cherche: lu.besoins.filter((t) => !asker?.offres.includes(t) || demandes.includes(t)),
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
