import { useEffect } from 'react'
import type { Profil, Proposition } from '../types'
import { fr } from '../i18n/fr'
import InvitationPartenaire from '../partenaire/InvitationPartenaire'

interface Props {
  proposition: Proposition
  partenaire: Profil
  demandeur: Profil
  onAccepter: () => void
  onRetour: () => void
  /** Guided tour: presses « Accepter » by itself once true. */
  accepterAuto?: boolean
  /** Guided tour: scrolls to the buttons first. */
  defilerAuto?: boolean
}

export default function Invitation({ proposition, partenaire, demandeur, onAccepter, onRetour, accepterAuto, defilerAuto }: Props) {
  useEffect(() => {
    if (defilerAuto) document.querySelector('.p2-actions')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [defilerAuto])

  useEffect(() => {
    if (!accepterAuto) return
    document.querySelector<HTMLButtonElement>('.p2-btn-primaire')?.click()
    const t = window.setTimeout(() => document.querySelector('.p2-accepte')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150)
    return () => window.clearTimeout(t)
  }, [accepterAuto])

  return (
    <div className="plein-ecran">
      <button type="button" className="retour retour-plein" onClick={onRetour} aria-label={fr.general.retour}>←</button>
      <InvitationPartenaire
        proposition={proposition}
        partenaire={partenaire}
        demandeur={demandeur}
        onAccepter={onAccepter}
        onDecliner={onRetour}
      />
    </div>
  )
}
