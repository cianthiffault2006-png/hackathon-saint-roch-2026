import { useEffect, useRef } from 'react'
import { ETAPES } from './script'
import { poseCurseur, poseDefile } from './etat'

interface Props {
  index: number
  /** Exact time in the step, read at every frame (frozen while paused). */
  lireMs: () => number
}

const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2)

// Scroll container of each screen when there is no target to start from.
const CONTENEUR: Record<string, string> = {
  proposition: '.feuille-defile',
  invitation: '.plein-ecran',
  fil: '.plein-ecran',
}

const racineDoc = () => (document.scrollingElement as HTMLElement) ?? document.documentElement

const defile = (n: Element) => {
  const o = getComputedStyle(n).overflowY
  return (o === 'auto' || o === 'scroll') && n.scrollHeight > n.clientHeight
}

function defilable(el: Element | null): HTMLElement {
  for (let n = el?.parentElement ?? null; n; n = n.parentElement) {
    if (defile(n)) return n
  }
  return racineDoc()
}

/** Where a screen scrolls when there is no target: its own scroller, the screen itself (desktop), or the page (phone). */
function conteneurParDefaut(ecran: string): HTMLElement | null {
  if (CONTENEUR[ecran]) return document.querySelector<HTMLElement>(CONTENEUR[ecran])
  const ecranEl = document.querySelector<HTMLElement>('.ecrans .screen')
  return ecranEl && defile(ecranEl) ? ecranEl : racineDoc()
}

/** The scrollTop of a container that puts an element at the top, middle or bottom of what is visible. */
function cibleScroll(conteneur: HTMLElement, el: Element, bloc: 'start' | 'center' | 'end'): number {
  const racine = conteneur === document.scrollingElement || conteneur === document.documentElement
  const c = racine ? { top: 0, bottom: window.innerHeight } : conteneur.getBoundingClientRect()
  // The tour bar covers the top of the screen: what is under it does not count as visible.
  const barre = document.querySelector('.visite-barre')?.getBoundingClientRect().bottom ?? 0
  const haut = Math.max(c.top, barre + 8)
  let bas = Math.min(c.bottom, window.innerHeight) - 8
  // A sticky footer (« Trouver des partenaires ») covers the bottom of the screen too.
  for (const pied of document.querySelectorAll('.pied')) {
    const pos = getComputedStyle(pied).position
    if (pos === 'sticky' || pos === 'fixed') bas = Math.min(bas, pied.getBoundingClientRect().top - 8)
  }
  const r = el.getBoundingClientRect()
  const delta = bloc === 'start' ? r.top - haut : bloc === 'end' ? r.bottom - bas : (r.top + r.bottom) / 2 - (haut + bas) / 2
  const max = conteneur.scrollHeight - conteneur.clientHeight
  return Math.max(0, Math.min(max, conteneur.scrollTop + delta))
}

/**
 * Guided tour only: a fake cursor that moves to each target and presses it, and the scroll of
 * each screen. Both are computed at every frame from the tour clock, so Pause freezes them and a
 * jump rebuilds them. The cursor is decoration: aria-hidden, and still under reduced motion.
 */
export default function Regie({ index, lireMs }: Props) {
  const curseur = useRef<HTMLDivElement>(null)
  const origine = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const calme = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let image = 0
    const ecran = ETAPES[index].ecran

    const tour = () => {
      const ms = lireMs()

      // Scroll.
      const d = poseDefile(index, ms)
      const vers = d.vers ? document.querySelector(d.vers) : null
      const de = d.de ? document.querySelector(d.de) : null
      const ref = vers ?? de
      const conteneur = ref ? defilable(ref) : conteneurParDefaut(ecran)
      if (conteneur && (vers || !d.vers) && (de || !d.de)) {
        const fin = vers ? cibleScroll(conteneur, vers, d.bloc) : 0
        const debut = de ? cibleScroll(conteneur, de, d.deBloc) : d.de ? fin : 0
        const p = calme ? 1 : ease(d.progres)
        const y = Math.round(debut + (fin - debut) * p)
        if (Math.abs(conteneur.scrollTop - y) >= 1) conteneur.scrollTop = y
      }

      // Cursor.
      const el = curseur.current
      const c = poseCurseur(index, ms)
      const cible = c ? document.querySelector(c.vers) : null
      if (el) {
        if (!c || !cible) {
          el.style.opacity = '0'
        } else {
          const r = cible.getBoundingClientRect()
          let x = r.left + r.width / 2
          let y = r.top + r.height / 2
          const avant = c.de ? document.querySelector(c.de) : null
          const p = calme ? 1 : ease(c.progres)
          if (avant) {
            const a = avant.getBoundingClientRect()
            x = a.left + a.width / 2 + (x - (a.left + a.width / 2)) * p
            y = a.top + a.height / 2 + (y - (a.top + a.height / 2)) * p
          }
          // On a desktop the app pane (right of the sidebar) is the containing block of fixed elements.
          const o = origine.current?.getBoundingClientRect()
          x -= o?.left ?? 0
          y -= o?.top ?? 0
          const echelle = c.presse !== null && !calme ? 1 - 0.18 * Math.sin((c.presse / 350) * Math.PI) : 1
          el.style.opacity = avant || calme ? '1' : String(Math.min(1, c.progres * 3))
          el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) scale(${echelle.toFixed(3)})`
          el.classList.toggle('visite-curseur-presse', c.presse !== null && !calme)
        }
      }
      image = requestAnimationFrame(tour)
    }
    image = requestAnimationFrame(tour)
    return () => cancelAnimationFrame(image)
  }, [index, lireMs])

  return (
    <>
    <span className="visite-origine" ref={origine} aria-hidden="true" />
    <div className="visite-curseur" ref={curseur} aria-hidden="true">
      <svg width="28" height="28" viewBox="0 0 28 28" focusable="false">
        <path d="M4 2 L4 22 L9.5 17 L13 25 L16.5 23.5 L13 15.8 L20.5 15.8 Z" fill="#fff" stroke="#1c2b25" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <span className="visite-curseur-onde" />
    </div>
    </>
  )
}
