import { useState } from 'react'
import { fr } from '../i18n/fr'
import { T } from '../textes'
import { libelleDateMaj } from '../lib/date'
import { nombreCoches, type Projet } from '../lib/projets'

interface Props {
  projets: Projet[]
  onRetour: () => void
  onOuvrir: (id: string) => void
  /** Removes a project; hidden in the guided tour. */
  onRetirer?: (id: string) => void
}

export default function Projets({ projets, onRetour, onOuvrir, onRetirer }: Props) {
  const [aRetirer, setARetirer] = useState<string | null>(null)
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
                <span className={`statut-mini statut-${p.statut}`}>{p.inscrit ? T.evenement.inscrit : fr.proposition.statuts[p.statut]}</span>
                <span className="carte-projet-ligne">{libelleDateMaj(p)}</span>
                <span className="carte-projet-ligne">{fr.fiche.progres(nombreCoches(p), p.aConfirmer.length)}</span>
              </button>
              {onRetirer && aRetirer !== p.id && (
                <button type="button" className="btn btn-texte btn-petit btn-retirer" onClick={() => setARetirer(p.id)}>
                  {p.inscrit ? T.retirer.boutonEvenement : T.retirer.bouton}
                </button>
              )}
              {onRetirer && aRetirer === p.id && (
                <div className="confirmation" role="alertdialog" aria-label={T.retirer.bouton}>
                  <p>{p.inscrit ? T.retirer.questionEvenement : T.retirer.question}</p>
                  <div className="confirmation-actions">
                    <button type="button" className="btn btn-danger" onClick={() => { onRetirer(p.id); setARetirer(null) }}>{T.retirer.confirmer}</button>
                    <button type="button" className="btn btn-lien" onClick={() => setARetirer(null)}>{T.retirer.annuler}</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
