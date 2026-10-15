import { describe, expect, it } from 'vitest'
import type { Profil } from '../types'
import {
  CLE_RECLAMES,
  appliquerReclames,
  avecReclamation,
  badgeReclamation,
  courrielMasque,
  courrielValide,
  ecrireReclames,
  estReclamable,
  lireReclames,
  rechercherAReclamer,
  sansReclamation,
  verifierCode,
  type Reclames,
  type Stockage,
} from './reclamation'

const base = { sousType: 'x', description: 'Desc.', lat: 46.81, lng: -71.22, offres: [], besoins: [], creneaux: [], themes: [], source: 'fictif' as const, origine: 'test' }
const galerie: Profil = { ...base, id: 'p-galerie', role: 'commerce', nom: 'Galerie L’Éclat', reclame: false, verifie: 'sdc', offres: ['espace_interieur'] }
const chorale: Profil = { ...base, id: 'p-chorale', role: 'organisme', nom: 'Chorale Voix du Faubourg', reclame: false, verifie: 'ville' }
const cafe: Profil = { ...base, id: 'p-cafe', role: 'commerce', nom: 'Café Le Petit Détour', reclame: true, verifie: 'sdc' }
const citoyen: Profil = { ...base, id: 'p-cit', role: 'citoyen', nom: 'Personne', reclame: false, verifie: 'non' }
const profils = [galerie, chorale, cafe, citoyen]

function memoire(): Stockage & { data: Record<string, string> } {
  const data: Record<string, string> = {}
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = v },
    removeItem: (k) => { delete data[k] },
  }
}

describe('claim state', () => {
  it('round-trips through storage under maillage.reclames', () => {
    const s = memoire()
    const r = avecReclamation({}, 'p-galerie', { statut: 'active', quand: '2026-10-15', nom: 'Galerie L’Éclat', contactPublic: true })
    ecrireReclames(s, r)
    expect(Object.keys(s.data)).toEqual([CLE_RECLAMES])
    expect(lireReclames(s)).toEqual(r)
  })

  it('removes the key when the last claim is cleared (demo reset)', () => {
    const s = memoire()
    ecrireReclames(s, avecReclamation({}, 'p-galerie', { statut: 'en_attente', quand: '' }))
    ecrireReclames(s, sansReclamation(lireReclames(s), 'p-galerie'))
    expect(s.data[CLE_RECLAMES]).toBeUndefined()
    expect(lireReclames(s)).toEqual({})
  })

  it('ignores missing storage, bad JSON and malformed entries', () => {
    expect(lireReclames(null)).toEqual({})
    const s = memoire()
    s.data[CLE_RECLAMES] = '{oops'
    expect(lireReclames(s)).toEqual({})
    s.data[CLE_RECLAMES] = JSON.stringify({ a: { statut: 'bidon' }, b: 3, c: { statut: 'active', quand: 'x', offres: 'pas un tableau' } })
    expect(lireReclames(s)).toEqual({ c: { statut: 'active', quand: 'x' } })
    const bloque: Stockage = { getItem: () => { throw new Error('bloqué') }, setItem: () => { throw new Error('bloqué') }, removeItem: () => {} }
    expect(lireReclames(bloque)).toEqual({})
    expect(() => ecrireReclames(bloque, { a: { statut: 'active', quand: '' } })).not.toThrow()
  })

  it('an active claim removes « pré-rempli » and applies the edits', () => {
    const r: Reclames = { 'p-galerie': { statut: 'active', quand: '', nom: '  Galerie L’Éclat  ', description: 'Nouvelle.', besoins: ['public'], contactPublic: true } }
    const [g, ch] = appliquerReclames(profils, r)
    expect(g.reclame).toBe(true)
    expect(g.nom).toBe('Galerie L’Éclat')
    expect(g.description).toBe('Nouvelle.')
    expect(g.offres).toEqual(['espace_interieur'])
    expect(g.besoins).toEqual(['public'])
    expect(g.contactPublic).toBe(true)
    expect(ch).toBe(chorale)
  })

  it('a pending request keeps the profile pre-filled; citizens are never touched', () => {
    const r: Reclames = { 'p-galerie': { statut: 'en_attente', quand: '' }, 'p-cit': { statut: 'active', quand: '' } }
    const out = appliquerReclames(profils, r)
    expect(out[0].reclame).toBe(false)
    expect(out[3]).toBe(citoyen)
  })

  it('returns the same array when there is no claim', () => {
    expect(appliquerReclames(profils, {})).toBe(profils)
  })

  it('contact stays private unless the owner opted in', () => {
    const [g] = appliquerReclames(profils, { 'p-galerie': { statut: 'active', quand: '' } })
    expect(g.contactPublic).toBe(false)
  })
})

describe('badge from verifie', () => {
  it('SDC member, City-recognised organisation, or none', () => {
    expect(badgeReclamation({ verifie: 'sdc' })).toBe('sdc')
    expect(badgeReclamation({ verifie: 'ville' })).toBe('ville')
    expect(badgeReclamation({ verifie: 'non' })).toBeNull()
    expect(badgeReclamation({})).toBeNull()
  })
})

describe('code check', () => {
  it('accepts the demo code, with or without the space', () => {
    expect(verifierCode('482913')).toBe('ok')
    expect(verifierCode(' 482 913 ')).toBe('ok')
  })
  it('wrong six digits is incorrect; anything else is a format error', () => {
    expect(verifierCode('123456')).toBe('incorrect')
    expect(verifierCode('48291')).toBe('format')
    expect(verifierCode('4829134')).toBe('format')
    expect(verifierCode('48291a')).toBe('format')
    expect(verifierCode('')).toBe('format')
  })
})

describe('email format', () => {
  it('accepts plausible work addresses', () => {
    expect(courrielValide('nom@commerce.ca')).toBe(true)
    expect(courrielValide(' info@galerie-eclat.qc.ca ')).toBe(true)
    expect(courrielValide('a.b+c@sous.domaine.com')).toBe(true)
  })
  it('rejects malformed ones', () => {
    for (const x of ['', 'nom', 'nom@', '@commerce.ca', 'nom@commerce', 'nom @commerce.ca', 'nom@@commerce.ca', 'nom@commerce.c', 'nom@.ca']) {
      expect(courrielValide(x), x).toBe(false)
    }
  })
  it('the masked address is fictional and derived from the name', () => {
    expect(courrielMasque(galerie)).toBe('g•••@exemple.ca')
    expect(courrielMasque({ nom: 'Équipe Médiation' })).toBe('e•••@exemple.ca')
    expect(courrielMasque({ nom: '123' })).toBe('c•••@exemple.ca')
  })
})

describe('search filter', () => {
  it('lists only pre-filled businesses and organisations, sorted by name', () => {
    expect(rechercherAReclamer(profils, '').map((p) => p.id)).toEqual(['p-chorale', 'p-galerie'])
  })
  it('matches names ignoring accents, case and apostrophe style', () => {
    expect(rechercherAReclamer(profils, 'ECLAT').map((p) => p.id)).toEqual(['p-galerie'])
    expect(rechercherAReclamer(profils, "l'éclat").map((p) => p.id)).toEqual(['p-galerie'])
    expect(rechercherAReclamer(profils, 'faubourg').map((p) => p.id)).toEqual(['p-chorale'])
    expect(rechercherAReclamer(profils, 'zzz')).toEqual([])
  })
  it('drops locally claimed profiles, keeps pending ones', () => {
    const actif: Reclames = { 'p-galerie': { statut: 'active', quand: '' } }
    expect(rechercherAReclamer(profils, '', actif).map((p) => p.id)).toEqual(['p-chorale'])
    expect(rechercherAReclamer(appliquerReclames(profils, actif), '').map((p) => p.id)).toEqual(['p-chorale'])
    const attente: Reclames = { 'p-galerie': { statut: 'en_attente', quand: '' } }
    expect(rechercherAReclamer(profils, '', attente).map((p) => p.id)).toEqual(['p-chorale', 'p-galerie'])
  })
  it('never offers citizens or already claimed profiles', () => {
    expect(estReclamable(citoyen)).toBe(false)
    expect(estReclamable(cafe)).toBe(false)
    expect(estReclamable(galerie)).toBe(true)
  })
})
