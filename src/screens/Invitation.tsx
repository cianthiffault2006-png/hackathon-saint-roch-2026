import type { Profil, Proposition } from '../types'
import { fr } from '../i18n/fr'
import InvitationPartenaire from '../partenaire/InvitationPartenaire'

interface Props {
  proposition: Proposition
  partenaire: Profil
  demandeur: Profil
  autre?: Profil
  onAccepter: () => void
  /** « Pas cette fois »: a simulated decline, back to the proposal (the tour ignores it). */
  onDecliner: () => void
  onRetour: () => void
  /** Guided tour: shows the invitation as accepted (set by the tour clock; the tour scrolls on its own). */
  accepteVisite?: boolean
}

export default function Invitation({ proposition, partenaire, demandeur, autre, onAccepter, onDecliner, onRetour, accepteVisite }: Props) {
  return (
    <div className="plein-ecran">
      <button type="button" className="retour retour-plein" onClick={onRetour} aria-label={fr.general.retour}>←</button>
      <InvitationPartenaire
        proposition={proposition}
        partenaire={partenaire}
        demandeur={demandeur}
        autre={autre}
        onAccepter={onAccepter}
        onDecliner={onDecliner}
        accepteVisite={accepteVisite}
      />
    </div>
  )
}
