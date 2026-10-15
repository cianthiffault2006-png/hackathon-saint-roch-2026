import type { Lieu, Profil, Proposition, Role, Statut } from '../types'
import { prochaineDate, type Occurrence } from './date'

export interface PartenaireProjet {
  nom: string
  role: Role
  apport: string
}

/** A saved project: self-contained text, so the list works without the engine or the data files. */
export interface Projet extends Occurrence {
  id: string
  titre: string
  statut: Statut
  partenaires: PartenaireProjet[]
  lieuNom: string
  aConfirmer: string[]
  coches: boolean[]
}

const CLE = 'maillage.projets.v1'
let memoire: Projet[] = []

export function chargerProjets(): Projet[] {
  try {
    const brut = window.localStorage.getItem(CLE)
    if (!brut) return memoire
    const json: unknown = JSON.parse(brut)
    return Array.isArray(json) ? (json as Projet[]) : memoire
  } catch {
    return memoire
  }
}

export function sauverProjets(projets: Projet[]): void {
  memoire = projets
  try {
    window.localStorage.setItem(CLE, JSON.stringify(projets))
  } catch {
    // Private mode or storage blocked: the list stays in memory for this visit.
  }
}

export function idProjet(p: Proposition): string {
  return `${p.id}|${p.titre}`
}

export function projetDepuis(p: Proposition, profils: Profil[], lieux: Lieu[], statut: Statut): Projet {
  const partenaires: PartenaireProjet[] = []
  let hote = ''
  for (const c of p.partenaires) {
    const profil = profils.find((x) => x.id === c.profilId)
    if (!profil) continue
    partenaires.push({ nom: profil.nom, role: profil.role, apport: c.apport })
    if (!hote && (c.tags.includes('espace_interieur') || c.tags.includes('espace_exterieur'))) hote = profil.nom
  }
  const lieu = lieux.find((l) => l.id === p.lieuId)
  return {
    id: idProjet(p),
    titre: p.titre,
    statut,
    partenaires,
    lieuNom: lieu?.nom ?? hote,
    ...prochaineDate(p.creneau),
    aConfirmer: p.aConfirmer,
    coches: p.aConfirmer.map(() => false),
  }
}

export function nombreCoches(p: Projet): number {
  return p.coches.filter(Boolean).length
}
