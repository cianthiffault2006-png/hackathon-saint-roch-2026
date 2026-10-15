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
  const cle = etape.puis && etat.ms >= etape.puis.apresMs ? etape.puis.legende : etape.legende
  const progres = ((etat.index + etat.ms / etape.dureeMs) / ETAPES.length) * 100
  const fin = etape.id === 'fin'

  return (
    <>
      {fin && (
        <div className="carte-fin" role="dialog" aria-label={fr.visite.titre}>
          <p>{FIN_VISITE}</p>
          <button type="button" className="btn btn-primaire" onClick={onQuitter}>
            {fr.visite.quitter}
          </button>
        </div>
      )}
      <div className="visite-barre" role="region" aria-label={fr.visite.titre}>
        <p className="visite-legende" aria-live="polite">
          {cle ? fr.visite.etapes[cle] : fr.visite.titre}
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
