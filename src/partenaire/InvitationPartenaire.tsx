import { useState } from 'react'
import type { Profil, Proposition } from '../types'
import { CRENEAU_TXT, lib } from '../engine/proposer'
import { libelleDate } from '../lib/date'
import { dateProposee } from '../lib/projets'
import { nomCourt } from '../lib/invitation'
import './InvitationPartenaire.css'

interface Props {
  proposition: Proposition
  partenaire: Profil
  demandeur: Profil
  /** The third partner, to show their name (optional). */
  autre?: Profil
  onAccepter(): void
  onDecliner(): void
  /** Guided tour: accepted or not, set by the tour clock instead of a tap. */
  accepteVisite?: boolean
}

const rad = (d: number) => (d * Math.PI) / 180
function distanceM(a: Profil, b: Profil): number {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(h))
}

// Reasons written from the partner's side (the engine's raisons are the asker's side).
function construireRaisons(prop: Proposition, part: Profil, dem: Profil): string[] {
  // Same article-aware labels as the engine (« du public », « de l’animation », « le soir en semaine »).
  const res: string[] = []
  const commun = dem.offres.filter((t) => part.besoins.includes(t))
  if (commun.length > 0) res.push(`${dem.nom} offre ${lib(commun)}, ce que vous cherchez`)
  const tags = prop.partenaires.find((c) => c.profilId === part.id)?.tags ?? []
  if (tags.length > 0) res.push(`Vous apportez ${lib(tags)}`)
  const min = Math.max(1, Math.round(distanceM(part, dem) / 80))
  res.push(`À ${min} minute${min > 1 ? 's' : ''} à pied de chez vous`)
  const cren = part.creneaux.find((c) => dem.creneaux.includes(c)) ?? prop.creneau
  // « vous » de politesse: singulier pour une personne, pluriel pour un commerce ou un organisme.
  res.push(`Vous êtes disponible${part.role === 'citoyen' ? '' : 's'} ${CRENEAU_TXT[cren]}`)
  return res
}

// The engine writes « apporte… » / « accueille… »; « Votre rôle » speaks to the partner like « Pourquoi vous ».
const aVous = (apport: string) => apport.replace(/^apporte(nt)?/, 'Vous apportez').replace(/^accueille(nt)?/, 'Vous accueillez')

export default function InvitationPartenaire({ proposition, partenaire, demandeur, autre, onAccepter, onDecliner, accepteVisite }: Props) {
  const [accepteMoi, setAccepte] = useState(false)
  const accepte = accepteVisite ?? accepteMoi

  const sonApport = proposition.partenaires.find((c) => c.profilId === partenaire.id)?.apport
  const autreContribution = proposition.partenaires.find((c) => c.profilId !== partenaire.id && c.profilId !== demandeur.id)
  const raisons = construireRaisons(proposition, partenaire, demandeur)
  const salut = nomCourt(partenaire)

  function accepter() {
    setAccepte(true)
    onAccepter()
  }

  return (
    <main className="p2-invit">
      <header className="p2-invit-entete">
        <p className="p2-invit-badge">Nouvelle invitation Maillage</p>
        <h1 className="p2-invit-titre">
          Bonjour {salut}, {demandeur.nom} vous propose : {proposition.titre}
        </h1>
      </header>

      <section className="p2-carte" aria-labelledby="p2-role">
        <h2 id="p2-role" className="p2-sous-titre">Votre rôle</h2>
        <p className="p2-texte">{sonApport ? aVous(sonApport) : 'À préciser avec les partenaires.'}</p>
        {autreContribution && (
          <>
            <h2 className="p2-sous-titre">L’autre partenaire</h2>
            <p className="p2-texte"><strong>{autre?.nom ?? 'Partenaire'}</strong> : {autreContribution.apport}</p>
          </>
        )}
        <p className="p2-date">Date proposée : {libelleDate(dateProposee(proposition))} (à confirmer)</p>
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
          <p>Vous avez accepté. Le projet est confirmé quand chaque partenaire a accepté. Dans la démo, les réponses des autres partenaires sont simulées.</p>
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
