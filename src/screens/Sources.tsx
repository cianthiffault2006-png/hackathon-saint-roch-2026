import type { Lieu } from '../types'
import { fr } from '../i18n/fr'

export default function Sources({ lieux, onRetour }: { lieux: Lieu[]; onRetour: () => void }) {
  // The culture line comes from the attribution carried by the data itself.
  const culture = Array.from(new Set(lieux.map((l) => l.attribution).filter((a) => a.includes('SIT'))))
  return (
    <main className="screen sources">
      <header className="entete">
        <button type="button" className="retour" onClick={onRetour} aria-label={fr.general.retour}>←</button>
        <span className="role-tag">{fr.sources.titre}</span>
      </header>
      <h1 className="sr-only">{fr.sources.titre}</h1>
      <ul className="liste liste-sources">
        <li>{fr.sources.carte}</li>
        <li>{fr.sources.lieux}</li>
        <li>
          {fr.sources.culture} {culture.length ? culture.join(' ') : 'SIT Québec, licence CC BY 4.0.'}
        </li>
        <li>{fr.sources.profils}</li>
      </ul>
    </main>
  )
}
