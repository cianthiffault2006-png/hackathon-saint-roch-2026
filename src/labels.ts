import type { Creneau, Role, Tag } from './types'
import { fr } from './i18n/fr'

export const LIBELLE_TAG: Record<Tag, string> = fr.besoin.tags
export const LIBELLE_CRENEAU: Record<Creneau, string> = fr.besoin.creneaux
export const LIBELLE_ROLE: Record<Role, string> = fr.accueil.roles

export const TAGS: Tag[] = Object.keys(LIBELLE_TAG) as Tag[]
export const CRENEAUX: Creneau[] = Object.keys(LIBELLE_CRENEAU) as Creneau[]
