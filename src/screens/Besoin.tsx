import { useEffect, useRef, useState } from 'react'
import type { Besoin as BesoinType, Creneau, Profil, Role, Tag } from '../types'
import { basculer, choixDepuisTexte, construireBesoin, manuels, marquerMains, suivreSaisie, trouverAsker, type Choix } from '../lib/besoin'
import { fr } from '../i18n/fr'
import { CRENEAUX, LIBELLE_CRENEAU, LIBELLE_ROLE, LIBELLE_TAG, TAGS } from '../labels'
import Chips from '../components/Chips'

/** What was typed and tapped, as is: given back with the need so « ← » from the proposal restores it. */
export interface Brouillon extends Choix {
  texte: string
  /** « Je démarre »: acting with no existing profile. */
  nouveau?: boolean
}

interface Props {
  role: Role
  profils: Profil[]
  onRetour: () => void
  onTrouver: (besoin: BesoinType, brouillon: Brouillon) => void
  /** Guided tour: the text and the chips come from the tour clock (the screen shows them as given). */
  guide?: GuideBesoin
  /** A profile opened in the explorer: its offers become needs, and its name shows above the field. */
  partenaireVoulu?: Profil
  /** The previous draft for this role, when coming back from the proposal. */
  initial?: Brouillon
}

export interface GuideBesoin {
  texte: string
  offre: Tag[]
  cherche: Tag[]
  creneaux: Creneau[]
  /** « Trouver des partenaires » pulses. */
  pulse: boolean
}

const ROLES: Role[] = ['commerce', 'organisme', 'citoyen']

const COMMUNES: Tag[] = ['espace_interieur', 'visibilite', 'public', 'contenu_artistique', 'animation', 'benevoles']

function liste(tags: Tag[]): string {
  return tags.map((t) => LIBELLE_TAG[t].toLowerCase()).join(', ')
}

function ajouter<T>(prev: T[], plus: T[]): T[] {
  return Array.from(new Set([...prev, ...plus]))
}

export default function Besoin({ role, profils, onRetour, onTrouver, guide, partenaireVoulu, initial }: Props) {
  const [texte, setTexte] = useState(initial?.texte ?? '')
  const [cherche, setCherche] = useState<Tag[]>(initial?.cherche ?? [])
  const [offre, setOffre] = useState<Tag[]>(initial?.offre ?? [])
  const [creneaux, setCreneaux] = useState<Creneau[]>(initial?.creneaux ?? [])
  // Coming from the explorer, the user says who they act as (a demo profile, or « Je démarre » with none); otherwise the role given.
  const [acteur, setActeur] = useState<{ role: Role; nouveau: boolean }>({ role, nouveau: initial?.nouveau ?? false })
  const r = guide ? role : acteur.role
  const asker = acteur.nouveau && !guide ? undefined : trouverAsker(r, profils)
  // What the text gave at the previous keystroke, so chips it no longer gives can be taken off.
  const luAvant = useRef<Choix>(initial ? choixDepuisTexte(r, initial.texte, profils) : { cherche: [], offre: [], creneaux: [] })
  const main = useRef({ cherche: manuels<Tag>(), offre: manuels<Tag>(), creneaux: manuels<Creneau>() }).current

  useEffect(() => {
    if (!partenaireVoulu) return
    const voulus = partenaireVoulu.offres.filter((t) => !asker?.offres.includes(t))
    marquerMains(main.cherche, voulus)
    setCherche((prev) => ajouter(prev, voulus))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partenaireVoulu, asker])

  // Typing refreshes the chips from the whole text; a chip tapped on stays, a chip tapped off stays off.
  function surSaisie(valeur: string) {
    setTexte(valeur)
    const lu = choixDepuisTexte(r, valeur, profils)
    const avant = luAvant.current
    luAvant.current = lu
    setCherche((prev) => suivreSaisie(prev, avant.cherche, lu.cherche, main.cherche))
    setOffre((prev) => suivreSaisie(prev, avant.offre, lu.offre, main.offre))
    setCreneaux((prev) => suivreSaisie(prev, avant.creneaux, lu.creneaux, main.creneaux))
  }

  function soumettre() {
    // The wanted partner goes to the engine too, so every proposition includes them.
    onTrouver({ ...construireBesoin(r, texte, profils, { cherche, offre, creneaux }, acteur.nouveau), ...(partenaireVoulu ? { voulu: partenaireVoulu.id } : {}) }, { texte, cherche, offre, creneaux, ...(acteur.nouveau ? { nouveau: true } : {}) })
  }

  // During the tour the screen only shows what the tour sets; nothing is kept in its own state.
  const vue = guide ?? { texte, offre, cherche, creneaux, pulse: false }
  // A wanted partner is a need in itself: the engine builds around them even when their offers add no chip (same trade).
  const pret = vue.texte.trim().length > 0 || vue.cherche.length > 0 || vue.offre.length > 0 || partenaireVoulu !== undefined

  return (
    <main className="screen besoin">
      <header className="entete">
        <button type="button" className="retour" onClick={onRetour} aria-label={fr.besoin.boutonRetour}>←</button>
        <span className="role-tag">{LIBELLE_ROLE[r]}</span>
      </header>
      <h1 className="sr-only">{fr.besoin.titre}</h1>
      {partenaireVoulu && (
        <p className="profil-ligne">
          {fr.options.voulu} <strong>{partenaireVoulu.role === 'citoyen' ? 'Citoyen' : partenaireVoulu.nom}</strong>
        </p>
      )}
      {partenaireVoulu && !guide && (
        <p className="agir-comme">
          <label htmlFor="agir-comme">{fr.besoin.agirComme}</label>
          <select
            id="agir-comme"
            value={`${acteur.role}:${acteur.nouveau ? 'nouveau' : 'profil'}`}
            onChange={(e) => {
              const [ro, mode] = e.target.value.split(':')
              setActeur({ role: ro as Role, nouveau: mode === 'nouveau' })
            }}
          >
            {ROLES.map((ro) => {
              const demo = trouverAsker(ro, profils)
              return demo ? <option key={ro} value={`${ro}:profil`}>{demo.nom} ({LIBELLE_ROLE[ro].toLowerCase()})</option> : null
            })}
            {ROLES.map((ro) => <option key={`${ro}-n`} value={`${ro}:nouveau`}>{fr.besoin.jeDemarre[ro]}</option>)}
          </select>
        </p>
      )}
      {!asker && acteur.nouveau && !guide && <p className="profil-resume">{fr.besoin.sansProfil}</p>}
      {asker && (
        <p className="profil-ligne">
          {fr.besoin.votreProfil} <strong>{asker.nom}</strong>
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
        value={vue.texte}
        placeholder={fr.besoin.placeholders[r]}
        onChange={(e) => surSaisie(e.target.value)}
      />
      <h2 className="sous-titre">{fr.besoin.jOffre}</h2>
      <Chips options={TAGS} selected={vue.offre} libelle={LIBELLE_TAG} label={fr.besoin.jOffre} communes={COMMUNES} onToggle={(t) => setOffre(basculer(offre, t, main.offre))} />
      <h2 className="sous-titre">{fr.besoin.jeCherche}</h2>
      <Chips options={TAGS} selected={vue.cherche} libelle={LIBELLE_TAG} label={fr.besoin.jeCherche} communes={COMMUNES} onToggle={(t) => setCherche(basculer(cherche, t, main.cherche))} />
      <h2 className="sous-titre">{fr.besoin.puces.titreCreneaux}</h2>
      <Chips options={CRENEAUX} selected={vue.creneaux} libelle={LIBELLE_CRENEAU} label={fr.besoin.puces.titreCreneaux} onToggle={(c) => setCreneaux(basculer(creneaux, c, main.creneaux))} />
      <div className="pied">
        <button
          type="button"
          className={vue.pulse ? 'btn btn-primaire pulse' : 'btn btn-primaire'}
          aria-disabled={!pret}
          aria-describedby={pret ? undefined : 'aide-besoin'}
          onClick={() => { if (pret) soumettre() }}
        >
          {fr.besoin.bouton}
        </button>
        {/* Visible while the button is disabled, so the grey button never stays unexplained. */}
        <p id="aide-besoin" className={pret ? 'sr-only' : 'profil-resume'}>{fr.besoin.aideBouton}</p>
      </div>
    </main>
  )
}
