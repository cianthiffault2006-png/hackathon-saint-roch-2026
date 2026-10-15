import { fr } from '../i18n/fr'
import { libelleDateMaj } from '../lib/date'
import { nombreCoches, type Projet } from '../lib/projets'

interface Props {
  projets: Projet[]
  onRetour: () => void
  onOuvrir: (id: string) => void
}

export default function Projets({ projets, onRetour, onOuvrir }: Props) {
  return (
    <main className="screen projets">
      <header className="entete">
        <button type="button" className="retour" onClick={onRetour} aria-label={fr.general.retour}>←</button>
        <span className="role-tag">{fr.projets.titre}</span>
      </header>
      {projets.length === 0 ? (
        <>
          <h1 className="fiche-titre">{fr.projets.aucun}</h1>
          <p className="fiche-note">{fr.projets.videTexte}</p>
        </>
      ) : (
        <ul className="liste-projets">
          {projets.map((p) => (
            <li key={p.id}>
              <button type="button" className="carte-projet" onClick={() => onOuvrir(p.id)}>
                <strong>{p.titre}</strong>
                <span className={`statut-mini statut-${p.statut}`}>{fr.proposition.statuts[p.statut]}</span>
                <span className="carte-projet-ligne">{libelleDateMaj(p)}</span>
                <span className="carte-projet-ligne">{fr.fiche.progres(nombreCoches(p), p.aConfirmer.length)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
