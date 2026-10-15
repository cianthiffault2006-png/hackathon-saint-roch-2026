import { useState } from 'react'
import { fr } from '../i18n/fr'
import { libelleDateMaj } from '../lib/date'
import { nombreCoches, type Projet } from '../lib/projets'

interface Props {
  projets: Projet[]
  onRetour: () => void
  onOuvrir: (id: string) => void
  /** Removes a project; hidden in the guided tour. */
  onRetirer?: (id: string) => void
  /** Desktop: the project whose fiche is open next to the list. */
  actifId?: string | null
  /** Desktop: a fiche is open beside the list, so the list is a section, not the page's main landmark. */
  incrustee?: boolean
  onDiscuter?: (id: string) => void
}

export default function Projets({ projets, onRetour, onOuvrir, onRetirer, onDiscuter, actifId, incrustee }: Props) {
  const [aRetirer, setARetirer] = useState<string | null>(null)
  const Balise = incrustee ? 'section' : 'main'
  return (
    <Balise className="screen projets" aria-label={incrustee ? fr.nav.listeProjets : undefined}>
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
              <button type="button" className="carte-projet" aria-current={p.id === actifId ? 'true' : undefined} onClick={() => onOuvrir(p.id)}>
                <strong>{p.titre}</strong>
                <span className={`statut-mini statut-${p.statut}`}>{p.inscrit ? fr.evenement.inscrit : fr.proposition.statuts[p.statut]}</span>
                <span className="carte-projet-ligne">{libelleDateMaj(p)}</span>
                {p.aConfirmer.length > 0 && <span className="carte-projet-ligne">{fr.fiche.progres(nombreCoches(p), p.aConfirmer.length)}</span>}
              </button>      
          {onDiscuter && p.proposition && (
            <button
              type="button"
              className="btn-discussion-projet"
              onClick={() => onDiscuter(p.id)}
              aria-label={`Ouvrir la discussion du projet ${p.titre}`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
              </svg>
              Discussion
            </button>
          )}

              {onRetirer && aRetirer !== p.id && (
                <button type="button" className="btn btn-texte btn-petit btn-retirer" onClick={() => setARetirer(p.id)}>
                  {p.inscrit ? fr.retirer.boutonEvenement : fr.retirer.bouton}
                </button>
              )}
              {onRetirer && aRetirer === p.id && (
                <div className="confirmation" role="alertdialog" aria-label={fr.retirer.bouton}>
                  <p>{p.inscrit ? fr.retirer.questionEvenement : fr.retirer.question}</p>
                  <div className="confirmation-actions">
                    <button type="button" className="btn btn-danger" onClick={() => { onRetirer(p.id); setARetirer(null) }}>{fr.retirer.confirmer}</button>
                    <button type="button" className="btn btn-lien" onClick={() => setARetirer(null)}>{fr.retirer.annuler}</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Balise>
  )
}
