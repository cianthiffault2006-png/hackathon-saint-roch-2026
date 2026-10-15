import { useCallback, useEffect, useState } from 'react'
import { ETAPES } from './script'

export interface EtatVisite {
  index: number
  /** Time elapsed in the current step. */
  ms: number
  pause: boolean
}

const PAS_MS = 100

export function useTour() {
  const [etat, setEtat] = useState<EtatVisite | null>(null)

  const actif = etat !== null
  const enPause = etat?.pause ?? false

  useEffect(() => {
    if (!actif || enPause) return
    // Real elapsed time between ticks, so a throttled background tab does not slow the tour.
    let dernier = performance.now()
    const t = window.setInterval(() => {
      const maintenant = performance.now()
      const delta = Math.min(maintenant - dernier, 1000)
      dernier = maintenant
      setEtat((e) => {
        if (!e || e.pause) return e
        const ms = e.ms + delta
        if (ms < ETAPES[e.index].dureeMs) return { ...e, ms }
        // The last step stays on screen until the viewer quits.
        if (e.index >= ETAPES.length - 1) return { ...e, ms: ETAPES[e.index].dureeMs, pause: true }
        return { index: e.index + 1, ms: 0, pause: false }
      })
    }, PAS_MS)
    return () => window.clearInterval(t)
  }, [actif, enPause])

  const demarrer = useCallback(() => setEtat({ index: 0, ms: 0, pause: false }), [])
  const quitter = useCallback(() => setEtat(null), [])
  const basculerPause = useCallback(() => setEtat((e) => (e ? { ...e, pause: !e.pause } : e)), [])
  const suivant = useCallback(
    () => setEtat((e) => (e && e.index < ETAPES.length - 1 ? { index: e.index + 1, ms: 0, pause: false } : e)),
    [],
  )

  return { etat, demarrer, quitter, basculerPause, suivant }
}
