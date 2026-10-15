import { useState } from 'react'
import type { Profil, Proposition } from '../types'
import './InvitationPartenaire.css'

interface Props {
  proposition: Proposition
  partenaire: Profil
  demandeur: Profil
  onAccepter(): void
  onDecliner(): void
}

export default function InvitationPartenaire({ proposition, partenaire, demandeur, onAccepter, onDecliner }: Props) {
  const [accepte, setAccepte] = useState(false)

  const sonApport = proposition.partenaires.find((c) => c.profilId === partenaire.id)?.apport
  const autreContribution = proposition.partenaires.find((c) => c.profilId !== partenaire.id && c.profilId !== demandeur.id)
  const prenom = partenaire.nom.split(' ')[0].toLowerCase()
  const mentionnent = proposition.raisons.filter((r) => r.toLowerCase().includes(prenom))
  const raisons = mentionnent.length > 0 ? mentionnent : proposition.raisons.slice(0, 2)

  function accepter() {
    setAccepte(true)
    onAccepter()
  }

  return (
    <main className="p2-invit">
      <header className="p2-invit-entete">
        <p className="p2-invit-badge">Nouvelle invitation Maillage</p>
        <h1 className="p2-invit-titre">
          {demandeur.nom} vous propose : {proposition.titre}
        </h1>
      </header>

      <section className="p2-carte" aria-labelledby="p2-role">
        <h2 id="p2-role" className="p2-sous-titre">Votre rôle</h2>
        <p className="p2-texte">{sonApport ?? 'À préciser avec les partenaires.'}</p>
        {autreContribution && (
          <>
            <h2 className="p2-sous-titre">L’autre partenaire</h2>
            <p className="p2-texte">{autreContribution.apport}</p>
          </>
        )}
        <p className="p2-date">Date proposée, à confirmer</p>
      </section>

      <section className="p2-carte" aria-labelledby="p2-pourquoi">
        <h2 id="p2-pourquoi" className="p2-sous-titre">Pourquoi vous</h2>
        <ul className="p2-liste">
          {raisons.map((r) => <li key={r}>{r}</li>)}
        </ul>
      </section>

      {accepte ? (
        <div className="p2-accepte" role="status" aria-live="polite">
          <span className="p2-coche" aria-hidden="true">✓</span>
          <p>Vous avez accepté. Le projet est confirmé quand les trois partenaires acceptent.</p>
        </div>
      ) : (
        <div className="p2-actions">
          <button type="button" className="p2-btn p2-btn-primaire" onClick={accepter}>Accepter</button>
          <button type="button" className="p2-btn p2-btn-second" onClick={onDecliner}>Pas cette fois</button>
        </div>
      )}
      <p className="p2-note">Démo simulée</p>
    </main>
  )
}
