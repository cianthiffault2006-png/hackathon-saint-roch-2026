import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Evenement, Lieu, Profil } from '../types'
import { proposerAu } from '../engine'
import { choixDepuisTexte, construireBesoin } from '../lib/besoin'
import { besoinSofia } from './histoires'
import { PROFIL_VISITE, ROLE_VISITE, TEXTE_VISITE } from './script'

const lire = <T,>(f: string) => JSON.parse(readFileSync(join('public', 'data', f), 'utf8')) as T
const profils = lire<Profil[]>('profils.json')
const lieux = lire<Lieu[]>('lieux.json')
const evenements = lire<Evenement[]>('evenements.json')
const jour = new Date('2026-10-16T12:00:00')

describe('the two stories the tours show', () => {
  it('café: 87 % with Camille Vézina and Collectif Les Voisins en Scène', () => {
    const besoin = construireBesoin(ROLE_VISITE, TEXTE_VISITE, profils, choixDepuisTexte(ROLE_VISITE, TEXTE_VISITE, profils))
    const p = proposerAu(besoin, profils, lieux, evenements, jour)[0]
    expect(p.score).toBe(87)
  })

  it('Sofia: corvée at 74 % with Équipe Propreté du Faubourg and Malik A., as the captions say', () => {
    const besoin = besoinSofia(profils)
    expect(besoin).not.toBeNull()
    const p = proposerAu(besoin!, profils, lieux, evenements, jour)[0]
    expect(p.titre).toBe('Corvée de propreté avec Équipe Propreté du Faubourg')
    expect(p.score).toBe(74)
    expect(p.partenaires.map((x) => x.profilId)).toEqual(expect.arrayContaining(['p-sofia', 'p-proprete', 'p-etu-genie']))
  })

  it('the suite opens a profile recognised by the City', () => {
    expect(profils.find((p) => p.id === PROFIL_VISITE)?.verifie).toBe('ville')
  })
})
