import { useSyncExternalStore } from 'react'

/** Same breakpoint as bureau.css: under it, the phone layout stays exactly as it was. */
export const REQUETE_BUREAU = '(min-width: 900px)'

function correspond(requete: string): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(requete).matches
}

/** True while the media query matches; re-renders when it changes (window resized, device rotated). */
export function useMedia(requete: string): boolean {
  return useSyncExternalStore(
    (rappel) => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const liste = window.matchMedia(requete)
      liste.addEventListener('change', rappel)
      return () => liste.removeEventListener('change', rappel)
    },
    () => correspond(requete),
    () => false,
  )
}

/** Desktop layout: sidebar and side-by-side panes. */
export function useBureau(): boolean {
  return useMedia(REQUETE_BUREAU)
}
