import { useEffect, useRef } from 'react'
import { fr } from '../i18n/fr'
import { ETAPES, FIN_VISITE } from './script'
import type { EtatVisite } from './useTour'

interface Props {
  etat: EtatVisite
  onPause: () => void
  onSuivant: () => void
  onQuitter: () => void
}

export default function TourBar({ etat, onPause, onSuivant, onQuitter }: Props) {
  const etape = ETAPES[etat.index]
  const cle = etape.legende
  const progres = ((etat.index + etat.ms / etape.dureeMs) / ETAPES.length) * 100
  const fin = etape.id === 'fin'
  const barre = useRef<HTMLDivElement>(null)
  const boutonFin = useRef<HTMLButtonElement>(null)

  // The screens are inert during the tour, so focus moves to the bar, then to the end card.
  useEffect(() => {
    barre.current?.focus()
  }, [])
  useEffect(() => {
    if (fin) boutonFin.current?.focus()
  }, [fin])

  return (
    <>
      {fin && (
        <div className="carte-fin" role="dialog" aria-modal="true" aria-label={fr.visite.titre}>
          <p>{FIN_VISITE}</p>
          <button type="button" className="btn btn-primaire" ref={boutonFin} onClick={onQuitter}>
            {fr.visite.quitter}
          </button>
        </div>
      )}
      <div className="visite-barre" role="region" aria-label={fr.visite.titre} ref={barre} tabIndex={-1}>
        <p className="visite-legende" aria-live="polite">
          {cle === null ? fr.visite.titre : fr.visite.etapes[cle]}
        </p>
        <div className="visite-progres" aria-hidden="true">
          <div className="visite-progres-rempli" style={{ width: `${progres}%` }} />
        </div>
        <div className="visite-actions">
          <button type="button" className="visite-btn" onClick={onPause}>
            {etat.pause ? fr.visite.reprendre : fr.visite.pause}
          </button>
          <button type="button" className="visite-btn" onClick={onSuivant} disabled={fin}>
            {fr.visite.suivant}
          </button>
          <button type="button" className="visite-btn visite-quitter" onClick={onQuitter}>
            {fr.visite.quitter}
          </button>
        </div>
      </div>
    </>
  )
}
