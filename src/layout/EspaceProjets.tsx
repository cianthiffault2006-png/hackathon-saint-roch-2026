import type { ReactNode } from 'react'
import { fr } from '../i18n/fr'

interface Props {
  /** The project list; null when the fiche was opened from elsewhere (a proposal, a new project). */
  liste: ReactNode | null
  /** The open project's fiche, or null while none is chosen. */
  fiche: ReactNode | null
  /** The project thread (FilProjet) next to the fiche; null for a public event, which has none. */
  fil: ReactNode | null
  /** No project yet: the list's empty state takes the whole pane. */
  vide: boolean
}

/**
 * Desktop « Mes projets » (bureau.css): list | fiche | fil from 1280 px. From 900 to 1279 px the list folds away
 * while a fiche is open, so the fiche and its thread stay side by side; same when the fiche was opened from a proposal.
 */
export default function EspaceProjets({ liste, fiche, fil, vide }: Props) {
  const classes = ['espace-projets', liste ? 'avec-liste' : 'sans-liste', fiche ? 'avec-fiche' : '', fil ? 'avec-fil' : 'sans-fil', vide && !fiche ? 'liste-seule' : '']
  return (
    <div className={classes.filter(Boolean).join(' ')}>
      {liste && <div className="espace-liste">{liste}</div>}
      {!(vide && !fiche) && (
        <div className="espace-detail">
          {fiche ? (
            <>
              <div className="espace-fiche">{fiche}</div>
              {fil && <div className="espace-fil">{fil}</div>}
            </>
          ) : (
            <div className="espace-vide">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M8 9h8M8 13h8M8 17h5" />
              </svg>
              <p>{fr.nav.choisirProjet}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
