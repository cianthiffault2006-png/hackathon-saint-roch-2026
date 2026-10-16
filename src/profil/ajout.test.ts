import { describe, expect, it } from 'vitest'
import type { Profil } from '../types'
import { CLE_AJOUTS, FORMULAIRE_VIDE, demandeDepuis, ecrireAjouts, lireAjouts, profilApercu, validerFormulaire, type Formulaire, type Stockage } from './ajout'
import { appliquerReclames, estReclamable, rechercherAReclamer } from './reclamation'

const valide: Formulaire = {
  nom: ' Atelier Brique ',
  type: 'organisme',
  adresse: '500, rue Saint-Joseph Est',
  courriel: 'info@atelierbrique.ca',
  phrase: 'Nous offrons un local.',
  offres: ['espace_interieur'],
  besoins: ['public'],
  consentement: true,
}

function memoire(): Stockage & { data: Record<string, string> } {
  const data: Record<string, string> = {}
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = v },
    removeItem: (k) => { delete data[k] },
  }
}

describe('form check', () => {
  it('accepts a complete business or organisation', () => {
    expect(validerFormulaire(valide)).toBeNull()
    expect(validerFormulaire({ ...valide, type: 'commerce' })).toBeNull()
  })
  it('reports the first problem in form order', () => {
    expect(validerFormulaire(FORMULAIRE_VIDE)).toBe('nom')
    expect(validerFormulaire({ ...valide, adresse: '  ' })).toBe('adresse')
    expect(validerFormulaire({ ...valide, courriel: 'nom@commerce' })).toBe('courriel')
    expect(validerFormulaire({ ...valide, consentement: false })).toBe('consentement')
  })
  it('a person never gets a fiche, whatever else is filled', () => {
    expect(validerFormulaire({ ...valide, type: 'citoyen' })).toBe('citoyen')
    expect(() => demandeDepuis({ ...valide, type: 'citoyen' }, '')).toThrow()
  })
})

describe('request and preview', () => {
  const d = demandeDepuis(valide, '2026-10-16T10:00:00', 'ajout-1')
  it('trims the fields and never keeps the email', () => {
    expect(d.nom).toBe('Atelier Brique')
    expect(JSON.stringify(d)).not.toContain('atelierbrique.ca')
  })
  it('previews as an activated, self-registered profile that is on no list', () => {
    const p = profilApercu(d)
    expect(p.role).toBe('organisme')
    expect(p.reclame).toBe(true)
    expect(p.verifie).toBe('non')
    expect(p.contactPublic).toBe(false)
    expect(p.source).toBe('utilisateur')
    expect(p.offres).toEqual(['espace_interieur'])
  })
  it('stays out of the claim search and untouched by the claims', () => {
    const profils: Profil[] = [profilApercu(d)]
    expect(estReclamable(profils[0])).toBe(false)
    expect(rechercherAReclamer(profils, '')).toEqual([])
    expect(appliquerReclames(profils, { 'ajout-1': { statut: 'active', quand: '' } })[0].nom).toBe('Atelier Brique')
  })
})

describe('storage under maillage.ajouts', () => {
  it('round-trips and removes the key when the list is emptied (demo reset)', () => {
    const s = memoire()
    const liste = [demandeDepuis(valide, '2026-10-16', 'ajout-1')]
    ecrireAjouts(s, liste)
    expect(Object.keys(s.data)).toEqual([CLE_AJOUTS])
    expect(lireAjouts(s)).toEqual(liste)
    ecrireAjouts(s, [])
    expect(s.data[CLE_AJOUTS]).toBeUndefined()
  })
  it('ignores missing storage, bad JSON and malformed entries', () => {
    expect(lireAjouts(null)).toEqual([])
    const s = memoire()
    s.data[CLE_AJOUTS] = '{oops'
    expect(lireAjouts(s)).toEqual([])
    s.data[CLE_AJOUTS] = JSON.stringify({ pas: 'un tableau' })
    expect(lireAjouts(s)).toEqual([])
    s.data[CLE_AJOUTS] = JSON.stringify([3, { id: 'a' }, { id: 'c', nom: 'C', type: 'citoyen' }, { id: 'd', nom: 'D', type: 'commerce', offres: 'x' }])
    expect(lireAjouts(s)).toEqual([{ id: 'd', nom: 'D', type: 'commerce', adresse: '', phrase: '', offres: [], besoins: [], quand: '' }])
    const bloque: Stockage = { getItem: () => { throw new Error('bloqué') }, setItem: () => { throw new Error('bloqué') }, removeItem: () => {} }
    expect(lireAjouts(bloque)).toEqual([])
    expect(() => ecrireAjouts(bloque, [demandeDepuis(valide, '')])).not.toThrow()
  })
})
