import { useState } from 'react'
import type { Besoin as BesoinType, Creneau, Role, Tag } from '../types'
import { lireBesoin } from '../engineAdapter'
import { CRENEAUX, LIBELLE_CRENEAU, LIBELLE_ROLE, LIBELLE_TAG, TAGS } from '../labels'
import Chips from '../components/Chips'

interface Props {
  role: Role
  onRetour: () => void
  onTrouver: (besoin: BesoinType) => void
}

function bascule<T>(liste: T[], v: T): T[] {
  return liste.includes(v) ? liste.filter((x) => x !== v) : [...liste, v]
}

export default function Besoin({ role, onRetour, onTrouver }: Props) {
  const [texte, setTexte] = useState('')
  const [tags, setTags] = useState<Tag[]>([])
  const [creneaux, setCreneaux] = useState<Creneau[]>([])

  // Typing refreshes the chips: keywords found are added, the user can still toggle any chip.
  function surSaisie(valeur: string) {
    setTexte(valeur)
    const lu = lireBesoin(valeur)
    const trouves = [...lu.besoins, ...lu.offres]
    setTags((prev) => Array.from(new Set([...prev, ...trouves])))
    setCreneaux((prev) => Array.from(new Set([...prev, ...lu.creneaux])))
  }

  function soumettre() {
    const lu = lireBesoin(texte)
    onTrouver({
      auteurRole: role,
      auteurId: role === 'commerce' ? 'story-cafe' : role === 'citoyen' ? 'story-artiste' : 'story-organisme',
      texte,
      besoins: tags,
      offres: lu.offres,
      creneaux,
      themes: lu.themes,
    })
  }

  const pret = texte.trim().length > 0 || tags.length > 0

  return (
    <main className="screen besoin">
      <header className="entete">
        <button type="button" className="retour" onClick={onRetour} aria-label="Retour">←</button>
        <span className="role-tag">{LIBELLE_ROLE[role]}</span>
      </header>
      <label htmlFor="besoin-texte" className="titre-champ">
        Décrivez ce que vous cherchez ou offrez
      </label>
      <textarea
        id="besoin-texte"
        className="champ"
        rows={5}
        value={texte}
        placeholder="Ex. : Je cherche un artiste pour exposer sur le mur du café, le jeudi soir."
        onChange={(e) => surSaisie(e.target.value)}
      />
      <h2 className="sous-titre">Ressources</h2>
      <Chips options={TAGS} selected={tags} libelle={LIBELLE_TAG} label="Ressources" onToggle={(t) => setTags((p) => bascule(p, t))} />
      <h2 className="sous-titre">Créneaux</h2>
      <Chips options={CRENEAUX} selected={creneaux} libelle={LIBELLE_CRENEAU} label="Créneaux" onToggle={(c) => setCreneaux((p) => bascule(p, c))} />
      <div className="pied">
        <button type="button" className="btn btn-primaire" disabled={!pret} onClick={soumettre}>
          Trouver des partenaires
        </button>
      </div>
    </main>
  )
}
