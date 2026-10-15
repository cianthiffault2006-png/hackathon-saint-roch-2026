import type { Lieu } from '../types'
import { fr } from '../i18n/fr'

// Strings inline until copy adds them to fr.ts (suggested keys: sources.titre, sources.carte, ...).
const TEXTE = {
  titre: 'Sources des données',
  carte: 'Fond de carte : OpenFreeMap © OpenMapTiles, données © contributeurs OpenStreetMap.',
  lieux: 'Lieux publics et quartiers : Ville de Québec, Données Québec, licence CC BY 4.0.',
  culture: 'Culture :',
  profils: 'Profils et événements : fictifs, construits sur la structure des répertoires de la Ville (données réelles confidentielles non utilisées).',
}

export default function Sources({ lieux, onRetour }: { lieux: Lieu[]; onRetour: () => void }) {
  // The culture line comes from the attribution carried by the data itself.
  const culture = Array.from(new Set(lieux.map((l) => l.attribution).filter((a) => a.includes('SIT'))))
  return (
    <main className="screen sources">
      <header className="entete">
        <button type="button" className="retour" onClick={onRetour} aria-label={fr.general.retour}>←</button>
        <span className="role-tag">{TEXTE.titre}</span>
      </header>
      <h1 className="sr-only">{TEXTE.titre}</h1>
      <ul className="liste liste-sources">
        <li>{TEXTE.carte}</li>
        <li>{TEXTE.lieux}</li>
        <li>
          {TEXTE.culture} {culture.length ? culture.join(' ') : 'SIT Québec, licence CC BY 4.0.'}
        </li>
        <li>{TEXTE.profils}</li>
      </ul>
    </main>
  )
}
