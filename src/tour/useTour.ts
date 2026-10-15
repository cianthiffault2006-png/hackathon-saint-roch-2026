import { useCallback, useEffect, useRef, useState } from 'react'
import { DEBUT_SUITE, ETAPES } from './script'
import { arrivee, basculer, bornes, etapeA, lire, tic, type Horloge } from './etat'

export interface EtatVisite {
  index: number
  /** Time elapsed in the current step. */
  ms: number
  pause: boolean
}

const PAS_MS = 100

const mouvementReduit = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * The tour clock. React state moves every 100 ms (enough for the screens); `lireMs` gives the exact
 * time for the cursor and the scroll, which follow it at every frame. Pause freezes both.
 */
export function useTour() {
  const [etat, setEtat] = useState<EtatVisite | null>(null)
  /** Changes on each jump to the map's first step, so the pins drop again. */
  const [saut, setSaut] = useState(0)
  const horloge = useRef<Horloge>({ index: 0, base: 0, depuis: 0, pause: true })

  const actif = etat !== null
  const enPause = etat?.pause ?? false

  const lireMs = useCallback(() => lire(horloge.current, performance.now()), [])

  const poser = useCallback((index: number, ms: number, pause: boolean) => {
    horloge.current = { index, base: ms, depuis: performance.now(), pause }
    setEtat({ index, ms, pause })
  }, [])

  useEffect(() => {
    if (!actif || enPause) return
    const t = window.setInterval(() => {
      // Real time: a throttled background tab skips steps instead of slowing the tour. Each tour
      // stops, paused, on its own last step (the main tour's end card offers the suite).
      const suite = tic(horloge.current, performance.now())
      if (!suite) return
      horloge.current = suite
      setEtat({ index: suite.index, ms: suite.base, pause: suite.pause })
    }, PAS_MS)
    return () => window.clearInterval(t)
  }, [actif, enPause, lireMs, poser])

  const allerA = useCallback(
    (index: number) => {
      const i = Math.max(0, Math.min(ETAPES.length - 1, index))
      if (ETAPES[i].rejoue) setSaut((s) => s + 1)
      poser(i, arrivee(i, mouvementReduit()), horloge.current.pause)
    },
    [poser],
  )

  // Under reduced motion the tour starts paused, each step shown settled: the viewer moves on with « Suivant ».
  const demarrer = useCallback(() => {
    const calme = mouvementReduit()
    setSaut((s) => s + 1)
    poser(0, arrivee(0, calme), calme)
  }, [poser])
  const quitter = useCallback(() => setEtat(null), [])
  const basculerPause = useCallback(() => {
    const h = basculer(horloge.current, performance.now())
    horloge.current = h
    setEtat({ index: h.index, ms: h.base, pause: h.pause })
  }, [])
  // Suivant and Précédent stay inside the current tour.
  const suivant = useCallback(() => {
    const i = horloge.current.index
    if (i < bornes(ETAPES[i].parcours).dernier) allerA(i + 1)
  }, [allerA])
  const precedent = useCallback(() => {
    const i = horloge.current.index
    if (i > bornes(ETAPES[i].parcours).premier) allerA(i - 1)
  }, [allerA])
  /** Jumps to the start of the step playing at time t (ms from the start of the current tour). */
  const allerAuTemps = useCallback(
    (t: number) => {
      if (Number.isFinite(t)) allerA(etapeA(t, ETAPES[horloge.current.index].parcours).index)
    },
    [allerA],
  )
  /** From the main tour's end card: plays the « Suite de la visite ». */
  const continuer = useCallback(() => {
    const calme = mouvementReduit()
    setSaut((s) => s + 1)
    poser(DEBUT_SUITE, arrivee(DEBUT_SUITE, calme), calme)
  }, [poser])

  return { etat, saut, lireMs, demarrer, quitter, basculerPause, suivant, precedent, allerA, allerAuTemps, continuer }
}
