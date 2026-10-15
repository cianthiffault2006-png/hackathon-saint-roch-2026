import type { Profil } from '../types'
import { fr } from '../i18n/fr'
import TableauSdc from '../sdc/TableauSdc'

export default function Sdc({ profils, onRetour }: { profils: Profil[]; onRetour: () => void }) {
  return (
    <div className="plein-ecran">
      <button type="button" className="retour retour-plein" onClick={onRetour} aria-label={fr.general.retour}>←</button>
      <TableauSdc profils={profils} />
    </div>
  )
}
