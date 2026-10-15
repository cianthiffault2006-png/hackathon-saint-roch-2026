import { fr } from '../i18n/fr'
import { T } from '../textes'
import { libelleDate } from '../lib/date'
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
        <button type="button" className="retour" onClick={onRetour} aria-label={T.projets.retour}>←</button>
        <span className="role-tag">{T.projets.titre}</span>
      </header>
      {projets.length === 0 ? (
        <>
          <h1 className="fiche-titre">{T.projets.vide}</h1>
          <p className="fiche-note">{T.projets.videTexte}</p>
        </>
      ) : (
        <ul className="liste-projets">
          {projets.map((p) => (
            <li key={p.id}>
              <button type="button" className="carte-projet" onClick={() => onOuvrir(p.id)}>
                <strong>{p.titre}</strong>
                <span className={`statut-mini statut-${p.statut}`}>{fr.proposition.statuts[p.statut]}</span>
                <span className="carte-projet-ligne">{libelleDate(p)}</span>
                <span className="carte-projet-ligne">{T.fiche.progres(nombreCoches(p), p.aConfirmer.length)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
