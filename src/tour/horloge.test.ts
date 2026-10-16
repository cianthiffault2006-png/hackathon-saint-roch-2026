import { describe, expect, it } from 'vitest'
import { ETAPES, indexDe } from './script'
import { DEBUTS, DUREE_TOTALE, avancer, basculer, bornes, etapeA, lire, tic, type Horloge } from './etat'

// QA, production 8bd2bea: pause right after « Ça m’intéresse » for about 6 s, resume, and in a
// possibly throttled tab the tour was seen going back a chapter, then to the accueil at about 104 s.
// These tests drive the clock exactly as useTour does (tic every 100 ms, or rarely when throttled).

const depart = (index = 0): Horloge => ({ index, base: 0, depuis: 0, pause: false })
const tempsTour = (h: Horloge, maintenant: number) => DEBUTS[h.index] + lire(h, maintenant)

function jouer(h: Horloge, de: number, a: number, pas: number, vus: number[]): Horloge {
  let cur = h
  for (let t = de; t <= a; t += pas) {
    const n = tic(cur, t)
    if (n) {
      expect(n.index, `t=${t}`).toBeGreaterThanOrEqual(cur.index)
      cur = n
      vus.push(cur.index)
    }
  }
  return cur
}

describe('tour clock: pause, resume and throttled ticks', () => {
  it('QA scenario: pause 6 s after « Ça m’intéresse », resume, then only forward to the end card', () => {
    const vus: number[] = []
    const pauseA = DEBUTS[indexDe('interet')] + 1500
    let h = jouer(depart(), 0, pauseA, 100, vus)
    h = basculer(h, pauseA)
    expect(h.pause).toBe(true)
    const avant = tempsTour(h, pauseA)
    // Paused: ticks change nothing, the time stays put.
    expect(tic(h, pauseA + 3000)).toBeNull()
    expect(tempsTour(h, pauseA + 6000)).toBe(avant)
    const reprise = pauseA + 6000
    h = basculer(h, reprise)
    expect(h.pause).toBe(false)
    expect(tempsTour(h, reprise)).toBe(avant)
    // From there the clock only moves forward and stops, paused, on the end card.
    h = jouer(h, reprise, reprise + DUREE_TOTALE, 100, vus)
    expect(ETAPES[h.index].id).toBe('fin')
    expect(h.pause).toBe(true)
    for (let k = 1; k < vus.length; k++) expect(vus[k]).toBeGreaterThanOrEqual(vus[k - 1])
    // Chapter 6 (the thread) is followed by chapter 7, never by 5.
    const chapitres = vus.map((i) => ETAPES[i].chapitre)
    const premierFil = chapitres.indexOf('fil')
    expect(chapitres.slice(premierFil).includes('fiche')).toBe(false)
  })

  it('a throttled tab (one tick a second, or one a minute) skips steps but never goes back', () => {
    for (const pas of [1000, 7000, 60_000]) {
      const vus: number[] = []
      const h = jouer(depart(), 0, DUREE_TOTALE + 60_000, pas, vus)
      expect(ETAPES[h.index].id, `pas ${pas}`).toBe('fin')
      expect(h.pause).toBe(true)
    }
  })

  it('a tab asleep past the end lands on the end card of its own tour, paused, not on the next tour', () => {
    const n = tic(depart(indexDe('discussion')), 10 * 60_000)!
    expect(ETAPES[n.index].id).toBe('fin')
    expect(n.pause).toBe(true)
    expect(n.index).toBe(bornes('principal').dernier)
  })

  it('a clock that reads backwards, NaN or Infinity keeps the step (no jump to the start)', () => {
    const d = indexDe('discussion')
    expect(avancer(d, -500)).toEqual({ index: d, ms: 0, fin: false })
    expect(avancer(d, Number.NaN)).toEqual({ index: d, ms: 0, fin: false })
    expect(avancer(d, Number.POSITIVE_INFINITY)).toEqual({ index: d, ms: 0, fin: false })
    // performance.now() going backwards (it does not, but a wrong offset could) cannot move the step back.
    const h: Horloge = { index: d, base: 2000, depuis: 5000, pause: false }
    expect(tic(h, 1000)!.index).toBe(d)
  })

  it('a bar click that computes NaN (bar of width 0) lands on the start of the tour, never an invalid step', () => {
    expect(etapeA(Number.NaN)).toEqual({ index: 0, ms: 0 })
    expect(etapeA(Number.POSITIVE_INFINITY).index).toBe(0)
  })
})
