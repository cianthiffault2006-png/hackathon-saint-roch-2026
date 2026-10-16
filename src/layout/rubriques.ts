/** A sidebar entry: each one opens an existing screen. */
export type Rubrique = 'accueil' | 'dashboard' | 'explorer' | 'nouveau' | 'ajout' | 'projets' | 'sources' | 'sdc'

/** The sidebar entry a screen belongs to (for aria-current). */
export function rubriqueDe(ecran: string): Rubrique {
  switch (ecran) {
    case 'dashboard':
      return 'dashboard'
    case 'explorer':
    case 'profil':
      return 'explorer'
    case 'ajout':
      return 'ajout'
    case 'nouveau':
      return 'nouveau'
    case 'projets':
    case 'fiche':
    case 'fil':
      return 'projets'
    case 'sources':
      return 'sources'
    case 'sdc':
      return 'sdc'
    default:
      return 'accueil'
  }
}

/** Outside the tour: the proposal flow (Besoin, Proposition, Invitation, more options) belongs to no entry, and a
 *  Fiche opened from the dashboard keeps the dashboard lit. The tour keeps rubriqueDe as is. */
export function rubriqueHorsVisite(ecran: string, retourFiche: string): Rubrique | null {
  if (['besoin', 'proposition', 'invitation', 'plus'].includes(ecran)) return null
  if (ecran === 'fiche' && retourFiche === 'dashboard') return 'dashboard'
  return rubriqueDe(ecran)
}
