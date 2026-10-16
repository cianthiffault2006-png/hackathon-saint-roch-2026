import { describe, expect, it } from 'vitest'
import type { Creneau, Tag } from '../types'
import { lireBesoin } from '../engine/lecture'
import { basculer, choixDepuisTexte, construireBesoin, manuels, marquerMains, suivreSaisie, trouverAsker, type Manuels } from './besoin'
import { profils } from '../fixtures'
import { fr } from '../i18n/fr'

// Mirrors Besoin.tsx: each text is one keystroke state, chips follow it through suivreSaisie.
function rangee<T>(lire: (t: string) => T[]) {
  let chips: T[] = []
  let avant: T[] = []
  const m: Manuels<T> = manuels<T>()
  return {
    m,
    taper(texte: string) {
      const lu = lire(texte)
      chips = suivreSaisie(chips, avant, lu, m)
      avant = lu
      return chips
    },
    taperLettres(texte: string) {
      for (let i = 1; i <= texte.length; i++) this.taper(texte.slice(0, i))
      return chips
    },
    // Like the partenaireVoulu effect in Besoin.tsx.
    partenaire(xs: T[]) {
      marquerMains(m, xs)
      chips = [...chips, ...xs.filter((x) => !chips.includes(x))]
      return chips
    },
    tap(x: T) {
      chips = basculer(chips, x, m)
      return chips
    },
    get chips() {
      return chips
    },
  }
}

const creneaux = () => rangee<Creneau>((t) => lireBesoin(t).creneaux)
const cherche = () => rangee<Tag>((t) => lireBesoin(t).besoins)

describe('suivreSaisie: pastilles et saisie', () => {
  it('le texte seul: « le jeudi » puis « soir » ne laisse que Semaine, soir', () => {
    expect(creneaux().taperLettres('le jeudi soir')).toEqual(['semaine_soir'])
  })

  it('A: une pastille choisie à la main reste quand le texte cesse de la donner', () => {
    const r = creneaux()
    r.tap('semaine_jour')
    r.taperLettres('le jeudi soir')
    expect([...r.chips].sort()).toEqual(['semaine_jour', 'semaine_soir'])
  })

  it('B: une pastille du texte retirée puis remise à la main reste', () => {
    const r = creneaux()
    r.taperLettres('le jeudi')
    expect(r.chips).toEqual(['semaine_jour'])
    r.tap('semaine_jour')
    r.tap('semaine_jour')
    r.taperLettres('le jeudi soir')
    expect([...r.chips].sort()).toEqual(['semaine_jour', 'semaine_soir'])
  })

  it('D: une pastille retirée à la main ne revient pas tant que le texte la donne', () => {
    const r = creneaux()
    r.taperLettres('le jeudi soir')
    r.tap('semaine_soir')
    expect(r.chips).toEqual([])
    r.taperLettres('le jeudi soir, vers 19 h')
    expect(r.chips).toEqual([])
    r.tap('semaine_soir')
    expect(r.chips).toEqual(['semaine_soir'])
  })

  it('partenaire voulu: ses pastilles restent quand le texte cesse de les donner', () => {
    const r = cherche()
    r.partenaire(['animation'])
    r.taper('on cherche de l’animation')
    expect(r.chips).toEqual(['animation'])
    r.taper('on cherche')
    expect(r.chips).toEqual(['animation'])
  })

  it('sans choix à la main, une pastille du texte part quand le texte ne la donne plus', () => {
    const r = cherche()
    r.taper('on cherche de l’animation')
    expect(r.chips).toEqual(['animation'])
    r.taper('on cherche')
    expect(r.chips).toEqual([])
  })
})

// What the user typed or ticked drives the need; the profile fills in only what was not said.
describe('construireBesoin: le besoin tapé passe devant le profil', () => {
  const cafe = trouverAsker('commerce', profils)!
  const vide = { cherche: [], offre: [], creneaux: [] }

  it('rien de tapé: les besoins et créneaux du profil', () => {
    const b = construireBesoin('commerce', '', profils, vide)
    expect(b.besoins).toEqual(cafe.besoins)
    expect(b.creneaux).toEqual(cafe.creneaux)
  })

  it('démo: « animation » est déjà un besoin du café, le profil reste entier', () => {
    const b = construireBesoin('commerce', fr.visite.texteCafe, profils, { cherche: ['animation'], offre: ['espace_interieur'], creneaux: ['semaine_soir'] })
    expect([...b.besoins].sort()).toEqual([...cafe.besoins].sort())
    expect(b.creneaux).toEqual(['semaine_soir'])
  })

  it('un besoin hors profil remplace les besoins du profil', () => {
    const b = construireBesoin('commerce', 'On cherche du matériel pour une soirée', profils, { ...vide, cherche: ['materiel'] })
    expect(b.besoins).toEqual(['materiel'])
  })

  it('le créneau tapé remplace ceux du profil', () => {
    const b = construireBesoin('citoyen', 'samedi', profils, { ...vide, creneaux: ['fin_de_semaine'] })
    expect(b.creneaux).toEqual(['fin_de_semaine'])
  })

  it('les offres du profil restent, les offres tapées devant', () => {
    const b = construireBesoin('commerce', '', profils, { ...vide, offre: ['materiel'] })
    expect(b.offres[0]).toBe('materiel')
    expect(b.offres).toEqual(expect.arrayContaining(cafe.offres))
  })
})

describe('choixDepuisTexte: un besoin tapé reste, même si le profil l’offre', () => {
  it('organisme: « nous cherchons des cuisiniers bénévoles » garde Bénévoles', () => {
    const c = choixDepuisTexte('organisme', 'Nous cherchons des cuisiniers bénévoles pour une soupe populaire le lundi matin', profils)
    expect(c.cherche).toEqual(expect.arrayContaining(['benevoles', 'nourriture']))
  })
  it('café: le café nommé sans « je cherche » ne devient pas un besoin', () => {
    const c = choixDepuisTexte('commerce', "Je viens d'ouvrir un café sur Saint-Joseph, je cherche des musiciens le samedi", profils)
    expect(c.cherche).toEqual(['animation'])
  })
})

describe('construireBesoin: « Je démarre » sans profil', () => {
  it('pas d’adresse, donc pas de distances « Depuis chez vous »', () => {
    const b = construireBesoin('commerce', '', profils, { cherche: ['animation'], offre: [], creneaux: [] }, true)
    expect(b.lat).toBeUndefined()
    expect(b.besoins).toEqual(['animation'])
  })
})
