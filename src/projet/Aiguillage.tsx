import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { lireLienFil } from '../lib/filDirect'

const FilPartage = lazy(() => import('./FilPartage'))

/**
 * The app has no router. One hash route only: #fil/<filId>?t=<titre> opens the shared live thread
 * instead of the app; anything else renders the app unchanged.
 */
export default function Aiguillage({ children }: { children: ReactNode }) {
  const [lien, setLien] = useState(() => lireLienFil(window.location.hash))

  useEffect(() => {
    const suivre = () => setLien(lireLienFil(window.location.hash))
    window.addEventListener('hashchange', suivre)
    return () => window.removeEventListener('hashchange', suivre)
  }, [])

  function quitter() {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    setLien(null)
  }

  if (!lien) return <>{children}</>
  return (
    <Suspense fallback={null}>
      <FilPartage filId={lien.filId} titre={lien.titre} onQuitter={quitter} />
    </Suspense>
  )
}
