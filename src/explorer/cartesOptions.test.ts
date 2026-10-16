import { describe, expect, it } from 'vitest'
import type { Profil, Proposition } from '../types'
import { nomPublic, retenirCartes } from './cartesOptions'

const prop = (id: string, titre: string, ids: string[], score: number): Proposition => ({
  id, titre, type: 'exposition', partenaires: ids.map((profilId) => ({ profilId, apport: '', tags: [] })), creneau: 'semaine_soir', score, raisons: [], aConfirmer: [], evenementsProches: [], statut: 'proposee',
})

describe('Plus d’options cards', () => {
  it('keeps one card per title and partner set, order and score untouched', () => {
    const cartes = [
      { p: prop('a', 'Exposition au café', ['cafe', 'c1', 'c2'], 80) },
      { p: prop('b', 'Exposition au café', ['cafe', 'c2', 'c1'], 70) },
      { p: prop('c', 'Exposition au café', ['cafe', 'c1', 'c3'], 60) },
      { p: prop('d', 'Spectacle au café', ['cafe', 'c1', 'c2'], 50) },
    ]
    expect(retenirCartes(cartes).map((c) => c.p.id)).toEqual(['a', 'c', 'd'])
  })
  it('caps the list', () => {
    const cartes = Array.from({ length: 43 }, (_, i) => ({ p: prop(`p${i}`, `Titre ${i}`, ['cafe', `x${i}`], 100 - i) }))
    expect(retenirCartes(cartes)).toHaveLength(12)
    expect(retenirCartes(cartes, 3).map((c) => c.p.id)).toEqual(['p0', 'p1', 'p2'])
  })
  it('names a citizen by role and sub-type only', () => {
    const base = { id: 'x', description: '', lat: 0, lng: 0, offres: [], besoins: [], creneaux: [], themes: [], source: 'fictif' as const, origine: '', reclame: true }
    const cit: Profil = { ...base, role: 'citoyen', nom: 'Alix R., sculptrice', sousType: 'artiste' }
    const com: Profil = { ...base, role: 'commerce', nom: 'Café Le Petit Détour', sousType: 'café' }
    expect(nomPublic(cit, 'x')).toBe('Citoyen · artiste')
    expect(nomPublic(com, 'x')).toBe('Café Le Petit Détour')
    expect(nomPublic(undefined, 'p-inconnu')).toBe('p-inconnu')
  })
})
