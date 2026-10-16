import type { Profil, Proposition } from '../types'

/** Who receives the invitation: the citizen partner, else the second partner. The asker comes first. */
export function choisirInvite(prop: Proposition, profils: Profil[]): { partenaire: Profil; demandeur: Profil; autre?: Profil } | null {
  const liste = prop.partenaires
    .map((c) => profils.find((p) => p.id === c.profilId))
    .filter((p): p is Profil => p !== undefined)
  const demandeur = liste[0]
  const autres = liste.slice(1)
  const partenaire = autres.find((p) => p.role === 'citoyen') ?? autres[0]
  const autre = liste.find((p) => p !== demandeur && p !== partenaire)
  return demandeur && partenaire ? { partenaire, demandeur, autre } : null
}

/** How a partner is addressed: a citizen by first name (« Camille »), a business or organisation by its full name. */
export function nomCourt(p: Pick<Profil, 'nom' | 'role'>): string {
  return p.role === 'citoyen' ? p.nom.split(' ')[0] : p.nom
}
