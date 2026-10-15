import { useEffect, useRef } from 'react'
import { fr } from '../i18n/fr'
import { ETAPES, FIN_VISITE, estFin } from './script'
import { CHAPITRES, bornes, dureeParcours, minutes, tempsGlobal } from './etat'
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
  /** Jumps to the step playing at a time of the current tour (ms). */
  onAllerAuTemps: (t: number) => void
  /** End card of the main tour: plays the « Suite de la visite ». Absent when its story can't be built (fallback data). */
  onContinuer?: () => void
  onQuitter: () => void
}

export default function TourBar({ etat, legende, onPause, onSuivant, onPrecedent, onAller, onAllerAuTemps, onContinuer, onQuitter }: Props) {
  const etape = ETAPES[etat.index]
  // The main tour and its suite each have their own bar and chapters.
  const total = dureeParcours(etape.parcours)
  const chapitres = CHAPITRES.filter((c) => c.parcours === etape.parcours)
  const progres = (tempsGlobal(etat.index, Math.min(etat.ms, etape.dureeMs)) / total) * 100
  const fin = estFin(etape)
  const premiere = etat.index === chapitres[0].premier
  const chapitre = chapitres.findIndex((c) => c.id === etape.chapitre)
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
    onAllerAuTemps(part * total)
  }

  // The progress bar is a slider over the steps of the current tour: arrows move by one step, Home and End to the ends.
  const { premier, dernier } = bornes(etape.parcours)
  function surTouche(e: React.KeyboardEvent<HTMLDivElement>) {
    const cible =
      e.key === 'ArrowRight' || e.key === 'ArrowUp' ? etat.index + 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? etat.index - 1
          : e.key === 'Home' ? premier
            : e.key === 'End' ? dernier
              : null
    if (cible === null) return
    e.preventDefault()
    if (cible >= premier && cible <= dernier && cible !== etat.index) onAller(cible)
  }

  // The end card is modal: Tab stays on its buttons.
  function piegeFocus(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Tab') return
    const boutons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button'))
    if (boutons.length === 0) return
    const i = boutons.indexOf(document.activeElement as HTMLButtonElement)
    const suivantI = e.shiftKey ? (i <= 0 ? boutons.length - 1 : i - 1) : (i === boutons.length - 1 ? 0 : i + 1)
    e.preventDefault()
    boutons[suivantI].focus()
  }

  return (
    <>
      {fin && (
        <div className="carte-fin" role="dialog" aria-modal="true" aria-label={etape.parcours === 'suite' ? fr.visite.suite : fr.visite.titre} onKeyDown={piegeFocus}>
          <p>{etape.parcours === 'suite' ? fr.visite.finSuite : FIN_VISITE}</p>
          {etape.parcours === 'principal' && onContinuer && (
            <button type="button" className="btn btn-primaire" ref={boutonFin} onClick={onContinuer}>
              {fr.visite.continuer}
            </button>
          )}
          <button
            type="button"
            className={etape.parcours === 'principal' ? 'btn visite-quitter-fin' : 'btn btn-primaire'}
            ref={etape.parcours === 'suite' || !onContinuer ? boutonFin : undefined}
            onClick={onQuitter}
          >
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
            <span className="sr-only">{fr.visite.chapitreN(chapitre + 1, chapitres.length, titreChapitre)}</span>
            <span aria-hidden="true">
              {etape.parcours === 'suite' ? `${fr.visite.suite} · ` : ''}{chapitre + 1}/{chapitres.length} · {titreChapitre}
            </span>
          </p>
          <div className="visite-chapitres">
            {chapitres.map((c, i) => (
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
        <div
          className="visite-piste"
          role="slider"
          tabIndex={0}
          aria-label={fr.visite.progression}
          aria-valuemin={1}
          aria-valuemax={dernier - premier + 1}
          aria-valuenow={etat.index - premier + 1}
          aria-valuetext={fr.visite.etapeN(etat.index - premier + 1, dernier - premier + 1, minutes(tempsGlobal(etat.index, Math.min(etat.ms, etape.dureeMs))))}
          onClick={surPiste}
          onKeyDown={surTouche}
        >
          <div className="visite-progres">
            <div className="visite-progres-rempli" style={{ width: `${progres}%` }} />
            {chapitres.slice(1).map((c) => (
              <span key={c.id} className="visite-cran" style={{ left: `${(tempsGlobal(c.premier, 0) / total) * 100}%` }} />
            ))}
          </div>
        </div>
        <div className="visite-actions">
          <button type="button" className="visite-btn" onClick={onPrecedent} disabled={premiere}>
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
