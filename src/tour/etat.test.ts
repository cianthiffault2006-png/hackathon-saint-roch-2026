import { describe, expect, it } from 'vitest'
import { fr } from '../i18n/fr'
import { ETAPES, T, indexDe, legendeDe } from './script'
import { CHAPITRES, DEBUTS, DUREE_TOTALE, arrivee, etapeA, minutes, etatEcrans, lectureMs, motsDe, poseCurseur, poseDefile, tempsGlobal } from './etat'

const i = indexDe

describe('tour clock: step at a time', () => {
  it('starts at step 0 and ends on the last step', () => {
    expect(etapeA(0)).toEqual({ index: 0, ms: 0 })
    expect(etapeA(-50)).toEqual({ index: 0, ms: 0 })
    expect(etapeA(DUREE_TOTALE + 9999).index).toBe(ETAPES.length - 1)
  })

  it('maps every step start and the time inside it, both ways', () => {
    ETAPES.forEach((e, k) => {
      expect(etapeA(DEBUTS[k])).toEqual({ index: k, ms: 0 })
      expect(etapeA(DEBUTS[k] + e.dureeMs - 1)).toEqual({ index: k, ms: e.dureeMs - 1 })
      expect(tempsGlobal(k, 250)).toBe(DEBUTS[k] + 250)
    })
  })

  it('totals the step durations', () => {
    expect(DUREE_TOTALE).toBe(ETAPES.reduce((s, e) => s + e.dureeMs, 0))
  })
})

describe('reading time', () => {
  it('counts words, not punctuation', () => {
    expect(motsDe('Le café dit « Ça m’intéresse ».')).toBe(5)
    expect(lectureMs('un deux trois')).toBe(2500)
  })

  it('gives every caption at least words / 3 + 1.5 s (step 1 kept at 3 s by request)', () => {
    const valeurs = { score: 87, prenom: 'Camille' }
    for (const e of ETAPES) {
      if (e.id === 'role' || e.id === 'fin') continue
      expect(e.dureeMs, e.id).toBeGreaterThanOrEqual(lectureMs(legendeDe(e, valeurs)))
    }
    expect(ETAPES[0].dureeMs).toBe(3000)
  })

  it('names the score and the partner in the captions', () => {
    const valeurs = { score: 87, prenom: 'Camille' }
    expect(legendeDe(ETAPES[i('score')], valeurs)).toContain('87 %')
    expect(legendeDe(ETAPES[i('invitation')], valeurs)).toContain('Camille reçoit')
  })
})

describe('French typography of the tour strings', () => {
  it('uses non-breaking spaces before « : » and « % » and inside guillemets, none before ? or !', () => {
    const valeurs = { score: 87, prenom: 'Camille' }
    const textes = [
      ...ETAPES.filter((e) => e.id !== 'fin').map((e) => legendeDe(e, valeurs)),
      ...Object.values(fr.visite.chapitres), fr.visite.filMessage, fr.visite.filMoi, fr.visite.filReponse, fr.visite.finTitre,
    ]
    for (const t of textes) {
      expect(t, t).not.toMatch(/ [:%»]|« | [?!]/)
      expect(t, t).not.toMatch(/—/)
    }
  })
})

describe('reduced motion', () => {
  it('lands a jump at the step start normally, at its settled end under reduced motion', () => {
    ETAPES.forEach((e, k) => {
      expect(arrivee(k, false)).toBe(0)
      expect(arrivee(k, true)).toBe(e.dureeMs - 1)
    })
  })

  it('shows each step settled at its landing time (the screen matches the caption)', () => {
    const fin = (id: Parameters<typeof i>[0]) => etatEcrans(i(id), arrivee(i(id), true))
    expect(fin('saisie').texte).toBe(1)
    expect(fin('puces').puces).toBe(4)
    expect(fin('score').detail).toBe(true)
    expect(fin('raisons').raisons).toBe(5)
    expect(fin('interet').statut).toBe('interet_envoye')
    expect(fin('accepte').accepte).toBe(true)
    expect(fin('maj').onglet).toBe('maj')
    expect(fin('discussion').fil).toMatchObject({ recus: 2, reponse: true })
    expect(fin('carte').anneau).toBe(true)
  })

  it('speaks the slider time as m:ss', () => {
    expect(minutes(0)).toBe('0:00')
    expect(minutes(44_100)).toBe('0:44')
    expect(minutes(65_000)).toBe('1:05')
  })
})

describe('chapters', () => {
  it('has a title for every chapter, in order, without gaps', () => {
    for (const c of CHAPITRES) expect(fr.visite.chapitres[c.id]).toBeTruthy()
    // Steps of a chapter are contiguous: a chapter never comes back later.
    const vus = new Set<string>()
    ETAPES.forEach((e, k) => {
      if (k > 0 && ETAPES[k - 1].chapitre !== e.chapitre) expect(vus.has(e.chapitre)).toBe(false)
      vus.add(e.chapitre)
    })
    expect(CHAPITRES.map((c) => c.premier)).toEqual(CHAPITRES.map((c) => ETAPES.findIndex((e) => e.chapitre === c.id)))
  })
})

describe('screen state from (index, ms) alone', () => {
  it('is the same whenever it is asked (no hidden state)', () => {
    for (let k = 0; k < ETAPES.length; k++) {
      expect(etatEcrans(k, 1234)).toEqual(etatEcrans(k, 1234))
    }
  })

  it('types the text, then the cursor lights the chips one by one', () => {
    expect(etatEcrans(i('saisie'), 0).texte).toBe(0)
    expect(etatEcrans(i('saisie'), T.saisie / 2).texte).toBeCloseTo(0.5)
    expect(etatEcrans(i('saisie'), T.saisie).texte).toBe(1)
    expect(etatEcrans(i('saisie'), 5000).puces).toBe(0)
    expect(etatEcrans(i('puces'), T.puces[0] - 1).puces).toBe(0)
    expect(etatEcrans(i('puces'), T.puces[0]).puces).toBe(1)
    expect(etatEcrans(i('puces'), T.puces[3]).puces).toBe(4)
    expect(etatEcrans(i('bouton'), 0)).toMatchObject({ texte: 1, puces: 4, pulse: true })
  })

  it('walks the statuses: proposed, interest sent, waiting, confirmed after the partner accepts', () => {
    expect(etatEcrans(i('aConfirmer'), 5000).statut).toBe('proposee')
    expect(etatEcrans(i('interet'), T.interet - 1).statut).toBe('proposee')
    expect(etatEcrans(i('interet'), T.interet).statut).toBe('interet_envoye')
    expect(etatEcrans(i('attente'), 0).statut).toBe('en_attente')
    // Waiting lasts through the whole invitation, until the partner has accepted.
    expect(etatEcrans(i('accepte'), 4000).statut).toBe('en_attente')
    expect(etatEcrans(i('accepte'), T.accepter - 1).accepte).toBe(false)
    expect(etatEcrans(i('accepte'), T.accepter).accepte).toBe(true)
    expect(etatEcrans(i('confirme'), 0).statut).toBe('confirmee')
    expect(etatEcrans(i('projets'), 0).statut).toBe('confirmee')
  })

  it('drops the pins on the first map step only, so coming back from the invitation replays nothing', () => {
    expect(etatEcrans(i('carte'), 0).chute).toBe(true)
    for (const id of ['score', 'raisons', 'aConfirmer', 'interet', 'attente', 'confirme'] as const) {
      expect(etatEcrans(i(id), 0).chute, id).toBe(false)
    }
    expect(etatEcrans(i('carte'), T.anneau - 1).anneau).toBe(false)
    expect(etatEcrans(i('carte'), T.anneau).anneau).toBe(true)
    expect(etatEcrans(i('confirme'), 0).anneau).toBe(true)
  })

  it('opens the score detail, then reveals all 5 reasons one at a time', () => {
    expect(etatEcrans(i('score'), T.score - 1).detail).toBe(false)
    expect(etatEcrans(i('score'), T.score).detail).toBe(true)
    expect(etatEcrans(i('score'), 0).raisons).toBe(0)
    const temps = [0, 1, 2, 3, 4].map((k) => T.raisons.debut + k * T.raisons.pas)
    temps.forEach((t, k) => {
      expect(etatEcrans(i('raisons'), t - 1).raisons).toBe(k)
      expect(etatEcrans(i('raisons'), t).raisons).toBe(k + 1)
    })
    // The last reason stays at least 1.4 s before the step ends.
    expect(ETAPES[i('raisons')].dureeMs - temps[4]).toBeGreaterThanOrEqual(1400)
  })

  it('plays the thread one message at a time', () => {
    const d = i('discussion')
    expect(etatEcrans(d, 0).onglet).toBe('maj')
    expect(etatEcrans(d, T.onglet).onglet).toBe('discussion')
    expect(etatEcrans(d, T.fil.recus[0][0]).fil).toMatchObject({ recus: 0, ecrit: 0 })
    expect(etatEcrans(d, T.fil.recus[0][1]).fil).toMatchObject({ recus: 1, ecrit: null })
    expect(etatEcrans(d, T.fil.recus[1][1]).fil.recus).toBe(2)
    expect(etatEcrans(d, (T.fil.frappe[0] + T.fil.frappe[1]) / 2).fil.frappe).toBeCloseTo(0.5)
    expect(etatEcrans(d, T.fil.envoi).fil).toMatchObject({ frappe: 0, envoyeDepuis: 0, reponse: false })
    expect(etatEcrans(d, T.fil.reponse[0]).fil.reponseEcrit).toBe(true)
    expect(etatEcrans(d, T.fil.reponse[1]).fil).toMatchObject({ reponseEcrit: false, reponse: true })
    expect(etatEcrans(i('participants'), 0).onglet).toBe('participants')
    expect(etatEcrans(i('maj'), T.onglet).onglet).toBe('maj')
  })

  it('ticks the checklist on its step, all ticked afterwards', () => {
    expect(etatEcrans(i('fiche'), 4000).coches).toBe(0)
    expect(etatEcrans(i('coches'), T.coches.debut).coches).toBe(1)
    expect(etatEcrans(i('projets'), 0).coches).toBeGreaterThanOrEqual(3)
  })
})

describe('cursor and scroll from (index, ms) alone', () => {
  it('is hidden on steps without gestures, and fades in on the first target', () => {
    expect(poseCurseur(i('carte'), 3000)).toBeNull()
    const p = poseCurseur(i('puces'), T.puces[0] - 750)
    expect(p).toMatchObject({ de: null, progres: 0 })
  })

  it('moves from one chip to the next and presses each one when it lights up', () => {
    const c = poseCurseur(i('puces'), T.puces[1])
    expect(c?.vers).toContain('contenu_artistique')
    expect(c?.de).toContain('espace_interieur')
    expect(c?.presse).toBe(0)
    expect(poseCurseur(i('puces'), T.puces[1] + 400)?.presse).toBeNull()
  })

  it('rebuilds the scroll of a step from the steps before it on the same screen', () => {
    // Before its own first scroll, « interet » holds where « aConfirmer » ended (the nearby events).
    const p = poseDefile(i('interet'), 0)
    expect(p).toMatchObject({ vers: '[data-visite="evenements"]', progres: 1 })
    // A new screen starts at the top.
    expect(poseDefile(i('invitation'), 0)).toMatchObject({ de: null, vers: null })
    expect(poseDefile(i('confirme'), 0)).toMatchObject({ de: null, vers: null })
    // Mid-scroll: between the two targets.
    const m = poseDefile(i('aConfirmer'), 2800 + 400)
    expect(m.de).toBe('[data-visite="a-confirmer"]')
    expect(m.vers).toBe('[data-visite="evenements"]')
    expect(m.progres).toBeCloseTo(0.5)
  })

  it('keeps every gesture inside its step', () => {
    for (const e of ETAPES) {
      for (const g of e.gestes) {
        expect(g.a, `${e.id} ${g.cible}`).toBeGreaterThanOrEqual(0)
        expect(g.a + (g.type === 'clic' ? 350 : g.duree ?? 600), `${e.id} ${g.cible}`).toBeLessThanOrEqual(e.dureeMs)
      }
    }
  })
})
