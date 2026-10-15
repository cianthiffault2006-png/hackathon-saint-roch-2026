import type { Role } from '../types'
import { LIBELLE_ROLE } from '../labels'
import { fr } from '../i18n/fr'

const ICONES: Record<Role, string> = { commerce: '☕', organisme: '🤝', citoyen: '🧑' }

interface Props {
  onRole: (role: Role) => void
  onVisite: () => void
}

export default function Accueil({ onRole, onVisite }: Props) {
  return (
    <main className="screen accueil">
      <div className="accueil-haut">
        <h1 className="logo">{fr.accueil.titre}</h1>
        <p className="pitch">
          {fr.accueil.accroche}
        </p>
      </div>
      <div className="accueil-bas">
        <p className="consigne">{fr.accueil.question}</p>
        {(['commerce', 'organisme', 'citoyen'] as Role[]).map((r) => (
          <button key={r} type="button" className="btn btn-role" onClick={() => onRole(r)}>
            <span aria-hidden="true" className="icone">{ICONES[r]}</span>
            {LIBELLE_ROLE[r]}
          </button>
        ))}
        <button type="button" className="btn btn-lien" onClick={onVisite}>
          {fr.accueil.visiteGuidee}
        </button>
      </div>
    </main>
  )
}
