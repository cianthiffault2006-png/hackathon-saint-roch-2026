import { useCallback, useEffect, useRef, useState } from 'react'
import { ETAPES } from './script'
import { arrivee, etapeA } from './etat'

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
  const horloge = useRef({ index: 0, base: 0, depuis: 0, pause: true })

  const actif = etat !== null
  const enPause = etat?.pause ?? false

  const lireMs = useCallback(() => {
    const h = horloge.current
    return h.pause ? h.base : h.base + (performance.now() - h.depuis)
  }, [])

  const poser = useCallback((index: number, ms: number, pause: boolean) => {
    horloge.current = { index, base: ms, depuis: performance.now(), pause }
    setEtat({ index, ms, pause })
  }, [])

  useEffect(() => {
    if (!actif || enPause) return
    const t = window.setInterval(() => {
      const h = horloge.current
      if (h.pause) return
      let index = h.index
      let ms = lireMs()
      // Real time: a throttled background tab skips steps instead of slowing the tour.
      while (ms >= ETAPES[index].dureeMs && index < ETAPES.length - 1) {
        ms -= ETAPES[index].dureeMs
        index++
      }
      // The last step stays on screen until the viewer quits.
      if (ms >= ETAPES[index].dureeMs) {
        poser(index, ETAPES[index].dureeMs, true)
        return
      }
      if (index !== h.index) horloge.current = { index, base: ms, depuis: performance.now(), pause: false }
      setEtat({ index, ms, pause: false })
    }, PAS_MS)
    return () => window.clearInterval(t)
  }, [actif, enPause, lireMs, poser])

  const allerA = useCallback(
    (index: number) => {
      const i = Math.max(0, Math.min(ETAPES.length - 1, index))
      if (ETAPES[i].id === 'carte') setSaut((s) => s + 1)
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
    const h = horloge.current
    poser(h.index, lireMs(), !h.pause)
  }, [lireMs, poser])
  const suivant = useCallback(() => allerA(horloge.current.index + 1), [allerA])
  const precedent = useCallback(() => allerA(horloge.current.index - 1), [allerA])
  /** Jumps to the start of the step playing at time t (ms from the start of the tour). */
  const allerAuTemps = useCallback((t: number) => allerA(etapeA(t).index), [allerA])

  return { etat, saut, lireMs, demarrer, quitter, basculerPause, suivant, precedent, allerA, allerAuTemps }
}
