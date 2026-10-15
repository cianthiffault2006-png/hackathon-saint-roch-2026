
import { useState } from 'react'

export type PageSidebar =
  | 'accueil'
  | 'dashboard'
  | 'projets'
  | 'sources'
  | 'sdc'
interface Props {
  pageActive: PageSidebar
  onNaviguer: (page: PageSidebar) => void
  nombreProjets: number
}

export default function Sidebar({
  pageActive,
  onNaviguer,
  nombreProjets,
}: Props) {
  const [ouvert, setOuvert] = useState(false)

  const elements = [
  { id: 'accueil', icone: '⌂', texte: 'Accueil' },
  { id: 'dashboard', icone: '▦', texte: 'Tableau de bord' },
  { id: 'projets', icone: '▣', texte: 'Mes projets' },
  { id: 'sources', icone: '≡', texte: 'Sources des données' },
  { id: 'sdc', icone: '▥', texte: 'Tableau SDC' },
] as const

  function naviguer(page: PageSidebar) {
    onNaviguer(page)
    setOuvert(false)
  }

  return (
    <>
      <button
        type="button"
        className="sidebar-mobile-btn"
        aria-label={
          ouvert ? 'Fermer le menu' : 'Ouvrir le menu'
        }
        aria-expanded={ouvert}
        aria-controls="navigation-maillage"
        onClick={() => setOuvert(!ouvert)}
      >
        {ouvert ? '✕' : '☰'}
      </button>

      {ouvert && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Fermer le menu"
          onClick={() => setOuvert(false)}
        />
      )}

      <aside
        id="navigation-maillage"
        className={
          ouvert ? 'sidebar sidebar-ouverte' : 'sidebar'
        }
      >
        <div className="sidebar-entete">
          <div className="sidebar-logo">Maillage</div>
          <p>Connecter Saint-Roch</p>
        </div>

        <nav aria-label="Navigation principale">
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
                  {element.icone}
                </span>

                <span>{element.texte}</span>

                {element.id === 'projets' && (
                  <span className="sidebar-compteur">
                    {nombreProjets}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bas">
          <span>Prototype de démonstration</span>
        </div>
      </aside>
    </>
  )
}