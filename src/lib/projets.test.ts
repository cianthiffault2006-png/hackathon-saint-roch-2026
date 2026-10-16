import { describe, expect, it } from 'vitest'
import { estProjet, filtrerProjets, type Projet } from './projets'

const bon: Projet = {
  id: 'prop-x|Exposition', titre: 'Exposition', statut: 'proposee',
  partenaires: [{ nom: 'Café', role: 'commerce', apport: 'Espace' }],
  lieuNom: 'Café', jour: '2026-10-22', heureDebut: 19, heureFin: 22,
  aConfirmer: ['Assurance'], coches: [false],
}

describe('chargement des projets sauvegardés (maillage.projets.v1)', () => {
  it('garde un projet complet tel quel', () => {
    expect(filtrerProjets([bon])).toEqual([bon])
  })

  it('écarte un enregistrement sans date (ancienne version) sans perdre les autres', () => {
    const { jour: _jour, ...sansDate } = bon
    expect(filtrerProjets([sansDate, bon, { id: 'y' }, null, 'texte', 42])).toEqual([bon])
  })

  it('écarte un enregistrement dont la liste de coches manque', () => {
    const { coches: _coches, ...sansCoches } = bon
    expect(estProjet(sansCoches)).toBe(false)
    expect(estProjet({ ...bon, partenaires: 'Café' })).toBe(false)
  })

  it('rend null quand le stockage ne contient pas une liste', () => {
    expect(filtrerProjets({ projets: [bon] })).toBeNull()
    expect(filtrerProjets('[]')).toBeNull()
    expect(filtrerProjets([])).toEqual([])
  })
})
