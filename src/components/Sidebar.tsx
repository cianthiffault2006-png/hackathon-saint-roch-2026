import { fr } from '../i18n/fr'
import type { Rubrique } from '../layout/rubriques'

// Sidebar by Nana-Lexis (origin/enhance). Desktop only (src/layout/bureau.css): the phone keeps its own screens.
export type PageSidebar = Rubrique

interface Props {
  pageActive: PageSidebar
  onNaviguer: (page: PageSidebar) => void
  nombreProjets: number
  /** Guided tour: the sidebar is inert, like the screens. */
  inerte?: boolean
}

const elements = [
  { id: 'accueil', icone: '⌂', texte: fr.nav.accueil },
  { id: 'dashboard', icone: '▦', texte: fr.nav.dashboard },
  { id: 'projets', icone: '▣', texte: fr.nav.projets },
  { id: 'explorer', icone: '◎', texte: fr.nav.explorer },
  { id: 'nouveau', icone: '⊕', texte: fr.nav.proposer },
  { id: 'sources', icone: '≡', texte: fr.nav.sources },
  { id: 'sdc', icone: '▥', texte: fr.nav.sdc },
] as const

export default function Sidebar({
  pageActive,
  onNaviguer,
  nombreProjets,
  inerte = false,
}: Props) {
  return (
    <aside id="navigation-maillage" className="sidebar" inert={inerte}>
      <div className="sidebar-entete">
        <div className="sidebar-logo">{fr.accueil.titre}</div>
        <p>{fr.nav.slogan}</p>
      </div>

      <nav aria-label={fr.nav.etiquette}>
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
              onClick={() => onNaviguer(element.id)}
            >
              <span
                className="sidebar-icone"
                aria-hidden="true"
              >
                {element.icone}
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
  )
}
