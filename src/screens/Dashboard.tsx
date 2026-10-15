
import type { Projet } from '../lib/projets'
import { fr } from '../i18n/fr'

interface Props {
  projets: Projet[]
  onVoirProjets: () => void
  onOuvrirProjet: (id: string) => void
  onNouveauProjet: () => void
}

export default function Dashboard({
  projets,
  onVoirProjets,
  onOuvrirProjet,
  onNouveauProjet,
}: Props) {
  const total = projets.length

  const enAttente = projets.filter(
    (p) => p.statut === 'interet_envoye' ||
           p.statut === 'en_attente'
  ).length

  const confirmes = projets.filter(
    (p) => p.statut === 'confirmee'
  ).length

  const proposes = projets.filter(
    (p) => p.statut === 'proposee'
  ).length

  const recents = [...projets].reverse().slice(0, 3)

  return (
    <main className="screen dashboard">
      <header className="dashboard-entete">
        <div>
          <h1>Tableau de bord</h1>
          <p>
            Retrouvez vos initiatives et suivez
            vos collaborations à Saint-Roch.
          </p>
        </div>
      </header>

      <section aria-label="Statistiques de mes projets">
        <div className="dashboard-stats">
          <div className="dashboard-stat">
            <span>Mes projets</span>
            <strong>{total}</strong>
          </div>

          <div className="dashboard-stat">
            <span>En attente</span>
            <strong>{enAttente}</strong>
          </div>

          <div className="dashboard-stat">
            <span>Confirmés (simulation)</span>
            <strong>{confirmes}</strong>
          </div>

          <div className="dashboard-stat">
            <span>Proposés</span>
            <strong>{proposes}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-entete">
          <h2>Mes projets récents</h2>

          {total > 0 && (
            <button
              type="button"
              className="dashboard-lien"
              onClick={onVoirProjets}
            >
              Voir tous les projets →
            </button>
          )}
        </div>

        {total === 0 ? (
          <div className="dashboard-vide">
            <h3>Aucun projet pour le moment</h3>
            <p>
              Exprimez votre besoin pour découvrir
              des partenaires potentiels.
            </p>

            <button
              type="button"
              className="btn btn-primaire"
              onClick={onNouveauProjet}
            >
              Découvrir des collaborations
            </button>
          </div>
        ) : (
          <div className="dashboard-projets">
            {recents.map((projet) => (
              <article
                key={projet.id}
                className="dashboard-carte-projet"
              >
                <div className="dashboard-carte-haut">
                  <h3>{projet.titre}</h3>

                  <span
                    className={
                      `statut-mini statut-${projet.statut}`
                    }
                  >
                    {fr.proposition.statuts[projet.statut]}
                  </span>
                </div>

                <p>
                  {projet.partenaires.length} partenaire(s)
                </p>

                <button
                  type="button"
                  className="dashboard-lien"
                  onClick={() => onOuvrirProjet(projet.id)}
                >
                  Ouvrir la fiche →
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="note-simulation">
        Les collaborations et confirmations sont
        simulées dans ce prototype.
      </p>
    </main>
  )
}