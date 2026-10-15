import { useEffect, useState } from 'react'
import type { Besoin as BesoinType, Creneau, Profil, Role, Tag } from '../types'
import { choixDepuisTexte, construireBesoin, trouverAsker } from '../lib/besoin'
import { fr } from '../i18n/fr'
import { CRENEAUX, LIBELLE_CRENEAU, LIBELLE_ROLE, LIBELLE_TAG, TAGS } from '../labels'
import Chips from '../components/Chips'

interface Props {
  role: Role
  profils: Profil[]
  onRetour: () => void
  onTrouver: (besoin: BesoinType) => void
  /** Text typed by the guided tour; chips follow it like real typing. */
  texteGuide?: string
  pulse?: boolean
}

const COMMUNES: Tag[] = ['espace_interieur', 'visibilite', 'public', 'contenu_artistique', 'animation', 'benevoles']

function liste(tags: Tag[]): string {
  return tags.map((t) => LIBELLE_TAG[t].toLowerCase()).join(', ')
}

function bascule<T>(liste: T[], v: T): T[] {
  return liste.includes(v) ? liste.filter((x) => x !== v) : [...liste, v]
}

function ajouter<T>(prev: T[], plus: T[]): T[] {
  return Array.from(new Set([...prev, ...plus]))
}

export default function Besoin({ role, profils, onRetour, onTrouver, texteGuide, pulse }: Props) {
  const [texte, setTexte] = useState('')
  const [cherche, setCherche] = useState<Tag[]>([])
  const [offre, setOffre] = useState<Tag[]>([])
  const [creneaux, setCreneaux] = useState<Creneau[]>([])
  const asker = trouverAsker(role, profils)

  // Typing refreshes the chips: keywords found are added, the user can still toggle any chip.
  function surSaisie(valeur: string) {
    setTexte(valeur)
    const lu = choixDepuisTexte(role, valeur, profils)
    setCherche((prev) => ajouter(prev, lu.cherche))
    setOffre((prev) => ajouter(prev, lu.offre))
    setCreneaux((prev) => ajouter(prev, lu.creneaux))
  }

  useEffect(() => {
    if (texteGuide !== undefined) surSaisie(texteGuide)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texteGuide])

  function soumettre() {
    onTrouver(construireBesoin(role, texte, profils, { cherche, offre, creneaux }))
  }

  const pret = texte.trim().length > 0 || cherche.length > 0 || offre.length > 0

  return (
    <main className="screen besoin">
      <header className="entete">
        <button type="button" className="retour" onClick={onRetour} aria-label={fr.besoin.boutonRetour}>←</button>
        <span className="role-tag">{LIBELLE_ROLE[role]}</span>
      </header>
      {asker && (
        <p className="profil-ligne">
          Votre profil : <strong>{asker.nom}</strong>
          <span className="profil-resume">{fr.besoin.jOffre} : {liste(asker.offres)}</span>
          <span className="profil-resume">{fr.besoin.jeCherche} : {liste(asker.besoins)}</span>
        </p>
      )}
      <label htmlFor="besoin-texte" className="titre-champ">
        {fr.besoin.etiquette}
      </label>
      <textarea
        id="besoin-texte"
        className="champ"
        rows={5}
        value={texte}
        placeholder={fr.besoin.placeholders[role]}
        onChange={(e) => surSaisie(e.target.value)}
      />
      <h2 className="sous-titre">{fr.besoin.jOffre}</h2>
      <Chips options={TAGS} selected={offre} libelle={LIBELLE_TAG} label={fr.besoin.jOffre} communes={COMMUNES} onToggle={(t) => setOffre((p) => bascule(p, t))} />
      <h2 className="sous-titre">{fr.besoin.jeCherche}</h2>
      <Chips options={TAGS} selected={cherche} libelle={LIBELLE_TAG} label={fr.besoin.jeCherche} communes={COMMUNES} onToggle={(t) => setCherche((p) => bascule(p, t))} />
      <h2 className="sous-titre">{fr.besoin.puces.titreCreneaux}</h2>
      <Chips options={CRENEAUX} selected={creneaux} libelle={LIBELLE_CRENEAU} label={fr.besoin.puces.titreCreneaux} onToggle={(c) => setCreneaux((p) => bascule(p, c))} />
      <div className="pied">
        <button type="button" className={pulse ? 'btn btn-primaire pulse' : 'btn btn-primaire'} disabled={!pret} onClick={soumettre}>
          {fr.besoin.bouton}
        </button>
      </div>
    </main>
  )
}
