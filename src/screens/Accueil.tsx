import type { Role } from '../types'
import { LIBELLE_ROLE } from '../labels'
import { fr } from '../i18n/fr'
import Icone from '../components/Icones'

interface Props {
  onRole: (role: Role) => void
  onVisite: () => void
  /** Role highlighted by the guided tour. */
  surbrillance?: Role
  /** Opens the project list; the link only shows once a project exists. */
  onProjets?: () => void
  onSdc?: () => void
  onSources?: () => void
  onExplorer?: () => void
  onProposer?: () => void
}

export default function Accueil({ onRole, onVisite, surbrillance, onProjets, onSdc, onSources, onExplorer, onProposer }: Props) {
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
          <button key={r} type="button" className={r === surbrillance ? 'btn btn-role surbrillance' : 'btn btn-role'} onClick={() => onRole(r)}>
            <span className="icone"><Icone nom={r} taille={26} /></span>
            {LIBELLE_ROLE[r]}
          </button>
        ))}
        <button type="button" className="btn btn-lien" data-visite onClick={onVisite}>
          {fr.accueil.visiteGuidee}
        </button>
        {onExplorer && (
          <button type="button" className="btn btn-lien" onClick={onExplorer}>
            {fr.accueil.explorer}
          </button>
        )}
        {onProposer && (
          <button type="button" className="btn btn-texte btn-petit" onClick={onProposer}>
            {fr.accueil.proposer}
          </button>
        )}
        {onSdc && (
          <button type="button" className="btn btn-texte btn-petit" onClick={onSdc}>
            {fr.accueil.tableauSdc}
          </button>
        )}
        {onSources && (
          <button type="button" className="btn btn-texte btn-petit" onClick={onSources}>
            {fr.sources.titre}
          </button>
        )}
        {onProjets && (
          <button type="button" className="btn btn-texte" onClick={onProjets}>
            {fr.projets.titre}
          </button>
        )}
      </div>
    </main>
  )
}
