import { useEffect, useRef } from 'react'
import { fr } from '../i18n/fr'
import { ETAPES, FIN_VISITE } from './script'
import { CHAPITRES, DUREE_TOTALE, tempsGlobal } from './etat'
import type { EtatVisite } from './useTour'
import './visite.css'

interface Props {
  etat: EtatVisite
  /** The caption of the current step, with its live values. */
  legende: string
  onPause: () => void
  onSuivant: () => void
  onPrecedent: () => void
  /** Jumps to the start of a step. */
  onAller: (index: number) => void
  /** Jumps to the step playing at a time of the tour (ms). */
  onAllerAuTemps: (t: number) => void
  onQuitter: () => void
}

export default function TourBar({ etat, legende, onPause, onSuivant, onPrecedent, onAller, onAllerAuTemps, onQuitter }: Props) {
  const etape = ETAPES[etat.index]
  const progres = (tempsGlobal(etat.index, Math.min(etat.ms, etape.dureeMs)) / DUREE_TOTALE) * 100
  const fin = etape.id === 'fin'
  const chapitre = CHAPITRES.findIndex((c) => c.id === etape.chapitre)
  const titreChapitre = fr.visite.chapitres[etape.chapitre]
  const barre = useRef<HTMLDivElement>(null)
  const boutonFin = useRef<HTMLButtonElement>(null)

  // The screens are inert during the tour, so focus moves to the bar, then to the end card.
  useEffect(() => {
    barre.current?.focus()
  }, [])
  useEffect(() => {
    if (fin) boutonFin.current?.focus()
  }, [fin])

  function surPiste(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const part = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
    onAllerAuTemps(part * DUREE_TOTALE)
  }

  return (
    <>
      {fin && (
        <div className="carte-fin" role="dialog" aria-modal="true" aria-label={fr.visite.titre}>
          <p>{FIN_VISITE}</p>
          <button type="button" className="btn btn-primaire" ref={boutonFin} onClick={onQuitter}>
            {fr.visite.quitter}
          </button>
          <button type="button" className="visite-revoir" onClick={() => onAller(etat.index - 1)}>
            {fr.visite.precedent}
          </button>
        </div>
      )}
      <div className="visite-barre" role="region" aria-label={fr.visite.titre} ref={barre} tabIndex={-1}>
        <div className="visite-tete">
          <p className="visite-chapitre">
            <span className="sr-only">{fr.visite.chapitreN(chapitre + 1, CHAPITRES.length, titreChapitre)}</span>
            <span aria-hidden="true">{chapitre + 1}/{CHAPITRES.length} · {titreChapitre}</span>
          </p>
          <div className="visite-chapitres">
            {CHAPITRES.map((c, i) => (
              <button
                key={c.id}
                type="button"
                className={i === chapitre ? 'visite-point visite-point-on' : i < chapitre ? 'visite-point visite-point-vu' : 'visite-point'}
                aria-label={fr.visite.allerAuChapitre(fr.visite.chapitres[c.id])}
                aria-current={i === chapitre ? 'step' : undefined}
                onClick={() => onAller(c.premier)}
              />
            ))}
          </div>
        </div>
        <p className="visite-legende" aria-live="polite">{legende}</p>
        {/* Pointer shortcut; the chapter buttons above and Précédent / Suivant do the same from the keyboard. */}
        <div className="visite-piste" onClick={surPiste} aria-hidden="true">
          <div className="visite-progres">
            <div className="visite-progres-rempli" style={{ width: `${progres}%` }} />
            {CHAPITRES.slice(1).map((c) => (
              <span key={c.id} className="visite-cran" style={{ left: `${(tempsGlobal(c.premier, 0) / DUREE_TOTALE) * 100}%` }} />
            ))}
          </div>
        </div>
        <div className="visite-actions">
          <button type="button" className="visite-btn" onClick={onPrecedent} disabled={etat.index === 0}>
            {fr.visite.precedent}
          </button>
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
