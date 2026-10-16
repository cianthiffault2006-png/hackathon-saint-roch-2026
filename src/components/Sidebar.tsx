import { useEffect, useRef, useState } from 'react'
import { fr } from '../i18n/fr'
import type { Rubrique } from '../layout/rubriques'
import Icone, { type NomIconeUi } from './Icones'
import '../layout/tiroir.css'

// Sidebar and phone drawer by Nana-Lexis (origin/enhance, 77bac20).
// From 900 px it is the desktop sidebar (src/layout/bureau.css); under 900 px a menu button (top right) opens it as a drawer (src/layout/tiroir.css).
export type PageSidebar = Rubrique

interface Props {
  pageActive: PageSidebar | null
  onNaviguer: (page: PageSidebar) => void
  nombreProjets: number
  /** Guided tour: the sidebar is inert, like the screens; the phone menu is hidden. */
  inerte?: boolean
}

const elements: ReadonlyArray<{ id: Rubrique; icone: NomIconeUi; texte: string }> = [
  { id: 'accueil', icone: 'maison', texte: fr.nav.accueil },
  { id: 'dashboard', icone: 'barres', texte: fr.nav.dashboard },
  { id: 'projets', icone: 'liste', texte: fr.nav.projets },
  { id: 'explorer', icone: 'boussole', texte: fr.nav.explorer },
  { id: 'nouveau', icone: 'plus', texte: fr.nav.proposer },
  { id: 'ajout', icone: 'magasin', texte: fr.nav.ajout },
  { id: 'sources', icone: 'sources', texte: fr.nav.sources },
  { id: 'sdc', icone: 'barres', texte: fr.nav.sdc },
]

export default function Sidebar({
  pageActive,
  onNaviguer,
  nombreProjets,
  inerte = false,
}: Props) {
  const [ouvert, setOuvert] = useState(false)
  const boutonRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const etaitOuvert = useRef(false)

  // Closes on navigation and during the guided tour.
  useEffect(() => {
    setOuvert(false)
  }, [pageActive, inerte])

  // Focus: first entry when it opens, back to the menu button when it closes.
  useEffect(() => {
    if (ouvert) {
      navRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    } else if (etaitOuvert.current && !inerte) {
      boutonRef.current?.focus()
    }
    etaitOuvert.current = ouvert
  }, [ouvert, inerte])

  // Escape closes it.
  useEffect(() => {
    if (!ouvert) return
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOuvert(false)
    }
    document.addEventListener('keydown', auClavier)
    return () => document.removeEventListener('keydown', auClavier)
  }, [ouvert])

  function naviguer(page: PageSidebar) {
    onNaviguer(page)
    setOuvert(false)
  }

  const ouverte = ouvert && !inerte

  return (
    <>
      <button
        ref={boutonRef}
        type="button"
        className="sidebar-mobile-btn"
        aria-label={ouverte ? fr.nav.fermerMenu : fr.nav.ouvrirMenu}
        aria-expanded={ouverte}
        aria-controls="navigation-maillage"
        hidden={inerte}
        inert={inerte}
        onClick={() => setOuvert(!ouvert)}
      >
        <Icone nom={ouverte ? 'fermer' : 'menu'} taille={24} />
      </button>

      {ouverte && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label={fr.nav.fermerMenu}
          tabIndex={-1}
          onClick={() => setOuvert(false)}
        />
      )}

      <aside
        id="navigation-maillage"
        className={ouverte ? 'sidebar sidebar-ouverte' : 'sidebar'}
        inert={inerte}
      >
        <div className="sidebar-entete">
          <div className="sidebar-logo">{fr.accueil.titre}</div>
          <p>{fr.nav.slogan}</p>
        </div>

        <nav ref={navRef} aria-label={fr.nav.etiquette}>
          {elements.map((element) => {
            const actif = pageActive === element.id

            return (
              <button
                key={element.id}
                type="button"
                className={
                  actif
                    ? 'sidebar-lien sidebar-lien-actif'
                    : 'sidebar-lien'
                }
                aria-current={actif ? 'page' : undefined}
                onClick={() => naviguer(element.id)}
              >
                <span
                  className="sidebar-icone"
                  aria-hidden="true"
                >
                  <Icone nom={element.icone} />
                </span>

                <span>{element.texte}</span>

                {element.id === 'projets' && (
                  <span className="sidebar-compteur">
                    <span aria-hidden="true">{nombreProjets}</span>
                    <span className="sr-only">{`, ${fr.nav.nbProjets(nombreProjets)}`}</span>
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bas">
          <span>{fr.nav.prototype}</span>
        </div>
      </aside>
    </>
  )
}
