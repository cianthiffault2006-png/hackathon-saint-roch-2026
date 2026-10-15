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
          <h1>{fr.dashboard.titre}</h1>
          <p>{fr.dashboard.intro}</p>
        </div>
      </header>

      <section aria-label={fr.dashboard.stats}>
        <div className="dashboard-stats">
          <div className="dashboard-stat">
            <span>{fr.dashboard.total}</span>
            <strong>{total}</strong>
          </div>

          <div className="dashboard-stat">
            <span>{fr.dashboard.enAttente}</span>
            <strong>{enAttente}</strong>
          </div>

          <div className="dashboard-stat">
            <span>{fr.dashboard.confirmes}</span>
            <strong>{confirmes}</strong>
          </div>

          <div className="dashboard-stat">
            <span>{fr.dashboard.proposes}</span>
            <strong>{proposes}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-entete">
          <h2>{fr.dashboard.recents}</h2>

          {total > 0 && (
            <button
              type="button"
              className="dashboard-lien"
              onClick={onVoirProjets}
            >
              {fr.dashboard.voirTous}
            </button>
          )}
        </div>

        {total === 0 ? (
          <div className="dashboard-vide">
            <h3>{fr.dashboard.videTitre}</h3>
            <p>{fr.dashboard.videTexte}</p>

            <button
              type="button"
              className="btn btn-primaire"
              onClick={onNouveauProjet}
            >
              {fr.dashboard.decouvrir}
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
                    {projet.inscrit ? fr.evenement.inscrit : fr.proposition.statuts[projet.statut]}
                  </span>
                </div>

                <p>{fr.dashboard.partenaires(projet.partenaires.length)}</p>

                <button
                  type="button"
                  className="dashboard-lien"
                  onClick={() => onOuvrirProjet(projet.id)}
                >
                  {fr.dashboard.ouvrir}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="note-simulation">{fr.dashboard.simulation}</p>
    </main>
  )
}