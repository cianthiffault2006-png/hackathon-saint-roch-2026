import { fr } from '../i18n/fr'
import { T } from '../textes'

/** Placeholder until the Explorer, project thread and new project views arrive. */
export default function Bientot({ titre, onRetour }: { titre: string; onRetour: () => void }) {
  return (
    <main className="screen">
      <header className="entete">
        <button type="button" className="retour" onClick={onRetour} aria-label={fr.general.retour}>←</button>
        <span className="role-tag">{titre}</span>
      </header>
      <h1 className="fiche-titre">{T.bientot.titre}</h1>
      <p className="fiche-note">{T.bientot.texte}</p>
    </main>
  )
}
