import { describe, expect, it } from 'vitest'
import type { Creneau, Tag } from '../types'
import { lireBesoin } from '../engine/lecture'
import { basculer, manuels, marquerMains, suivreSaisie, type Manuels } from './besoin'

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
