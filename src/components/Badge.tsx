import { fr } from '../i18n/fr'

/** Where the badge sits so it never covers a back button, a search field or a heading. */
export type PlaceBadge = 'defaut' | 'haut-droite' | 'bas-droite'

export default function Badge({ place = 'defaut' }: { place?: PlaceBadge }) {
  return <div className={place === 'defaut' ? 'badge-demo' : `badge-demo badge-${place}`}>{fr.accueil.badgeDemo}</div>
}
