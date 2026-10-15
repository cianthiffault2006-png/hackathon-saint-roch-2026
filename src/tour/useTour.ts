import { useCallback, useEffect, useRef, useState } from 'react'
import { DEBUT_SUITE, ETAPES } from './script'
import { bornes, etapeA } from './etat'

export interface EtatVisite {
  index: number
  /** Time elapsed in the current step. */
  ms: number
  pause: boolean
}

const PAS_MS = 100

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
      // Each tour stops on its own last step (the main tour's end card offers the suite).
      const { dernier } = bornes(ETAPES[h.index].parcours)
      while (ms >= ETAPES[index].dureeMs && index < dernier) {
        ms -= ETAPES[index].dureeMs
        index++
      }
      // The last step stays on screen until the viewer quits or continues.
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
      if (ETAPES[i].rejoue) setSaut((s) => s + 1)
      poser(i, 0, horloge.current.pause)
    },
    [poser],
  )

  // Under reduced motion the tour starts paused: the viewer moves on with « Suivant ».
  const demarrer = useCallback(() => {
    const calme = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setSaut((s) => s + 1)
    poser(0, 0, calme)
  }, [poser])
  const quitter = useCallback(() => setEtat(null), [])
  const basculerPause = useCallback(() => {
    const h = horloge.current
    poser(h.index, lireMs(), !h.pause)
  }, [lireMs, poser])
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
  const allerAuTemps = useCallback((t: number) => allerA(etapeA(t, ETAPES[horloge.current.index].parcours).index), [allerA])
  /** From the main tour's end card: plays the « Suite de la visite ». */
  const continuer = useCallback(() => {
    const calme = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setSaut((s) => s + 1)
    poser(DEBUT_SUITE, 0, calme)
  }, [poser])

  return { etat, saut, lireMs, demarrer, quitter, basculerPause, suivant, precedent, allerA, allerAuTemps, continuer }
}
