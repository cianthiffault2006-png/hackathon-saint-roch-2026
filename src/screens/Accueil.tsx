import type { CSSProperties } from 'react'
import type { Role } from '../types'
import { LIBELLE_ROLE } from '../labels'
import { fr } from '../i18n/fr'
import { MarqueBoucle, PinForme } from '../components/Icones'

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
  onDashboard?: () => void
}

export default function Accueil({ onRole, onVisite, surbrillance, onProjets, onSdc, onSources, onExplorer, onProposer, onDashboard }: Props) {
  const liens = [
    { cle: 'proposer', libelle: fr.accueil.proposer, action: onProposer },
    { cle: 'dashboard', libelle: fr.nav.dashboard, action: onDashboard },
    { cle: 'sdc', libelle: fr.accueil.tableauSdc, action: onSdc },
    { cle: 'sources', libelle: fr.sources.titre, action: onSources },
    { cle: 'projets', libelle: fr.projets.titre, action: onProjets },
  ].filter((l) => l.action)

  return (
    <main className="screen accueil">
      <div className="accueil-haut">
        <div className="marque">
          <MarqueBoucle />
          <h1 className="logo">{fr.accueil.titre}</h1>
        </div>
        <p className="lieu">{fr.accueil.lieu}</p>
        <p className="pitch">
          {fr.accueil.accroche}
        </p>
        <hr className="couture" />
      </div>
      <div className="accueil-bas">
        <p className="consigne">{fr.accueil.question}</p>
        {(['commerce', 'organisme', 'citoyen'] as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            className={r === surbrillance ? 'btn btn-role surbrillance' : 'btn btn-role'}
            style={{ '--c': `var(--couleur-${r})` } as CSSProperties}
            onClick={() => onRole(r)}
          >
            <PinForme nom={r} taille={30} />
            <span className="role-nom">{LIBELLE_ROLE[r]}</span>
            <small className="role-indice">{fr.accueil.indices[r]}</small>
          </button>
        ))}
        <hr className="couture" />
        <button type="button" className="btn btn-lien" data-visite onClick={onVisite}>
          {fr.accueil.visiteGuidee}
        </button>
        {onExplorer && (
          <button type="button" className="btn btn-lien" onClick={onExplorer}>
            {fr.accueil.explorer}
          </button>
        )}
        {liens.length > 0 && (
          <div className="liens-accueil">
            {liens.map((l) => (
              <button key={l.cle} type="button" className="btn btn-texte btn-petit" onClick={l.action}>
                {l.libelle}
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
