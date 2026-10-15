import type { Profil, Proposition } from '../types'

/** Who receives the invitation: the citizen partner, else the second partner. The asker comes first. */
export function choisirInvite(prop: Proposition, profils: Profil[]): { partenaire: Profil; demandeur: Profil } | null {
  const liste = prop.partenaires
    .map((c) => profils.find((p) => p.id === c.profilId))
    .filter((p): p is Profil => p !== undefined)
  const demandeur = liste[0]
  const autres = liste.slice(1)
  const partenaire = autres.find((p) => p.role === 'citoyen') ?? autres[0]
  return demandeur && partenaire ? { partenaire, demandeur } : null
}

export function prenom(p: Profil): string {
  return p.nom.split(' ')[0]
}
