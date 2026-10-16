import type { Lieu, Profil } from '../types'
import { fr } from '../i18n/fr'

export default function Sources({ lieux, profils = [], onRetour }: { lieux: Lieu[]; profils?: Profil[]; onRetour: () => void }) {
  // The culture line comes from the attribution carried by the data itself.
  const culture = Array.from(new Set(lieux.map((l) => l.attribution).filter((a) => a.includes('SIT'))))
  // Other open rows (places of worship, real establishments): licence lines carried by the rows themselves.
  const autresLieux = Array.from(new Set(lieux.filter((l) => l.source === 'ouvert' && !l.attribution.includes('SIT') && !l.attribution.includes('Lieux publics')).map((l) => l.attribution)))
  const fiches = Array.from(new Set(profils.filter((p) => p.source === 'ouvert').map((p) => p.origine)))
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
        {autresLieux.map((a) => <li key={a}>{a}</li>)}
        {fiches.length > 0 && <li>Fiches réelles d’établissements (profils pré-remplis, à activer par leur responsable) : {fiches.join(' ')}</li>}
        <li>{fr.sources.profils}</li>
      </ul>
      {/* The on-device model experiment (public/labo) is reachable from here only: it downloads 129 MB. */}
      <p className="profil-resume"><a href="labo/">{fr.sources.labo}</a></p>
    </main>
  )
}
