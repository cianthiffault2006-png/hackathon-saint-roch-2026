import { useMemo, useState } from 'react'
import type { Contribution, Creneau, Evenement, Lieu, Profil, Proposition, Tag, Theme, TypeProjet } from '../types'
import { fr } from '../i18n/fr'
import { CRENEAUX, LIBELLE_CRENEAU, LIBELLE_TAG, TAGS } from '../labels'
import Chips from '../components/Chips'
import { listeAvant, mentionneDanger, t } from './textes'
import './projet.css'

interface Props {
  profils: Profil[]
  lieux: Lieu[]
  evenements: Evenement[]
  moi?: Profil
  onRetour(): void
  onCree(p: Proposition): void
}

const TYPES = Object.keys(fr.proposition.typesProjet) as TypeProjet[]
const LIBELLE_TYPE: Record<TypeProjet, string> = fr.proposition.typesProjet
const CENTRE = { lat: 46.8165, lng: -71.2214 } // Saint-Roch, only when no place or profile is known

const THEMES_TYPE: Record<TypeProjet, Theme[]> = {
  exposition: ['art', 'culture'],
  spectacle: ['culture', 'art'],
  atelier: ['jeunesse', 'communautaire', 'art'],
  marche_ephemere: ['commerce_local', 'alimentation'],
  animation_de_rue: ['communautaire', 'culture'],
  verdissement: ['environnement'],
  conference: ['communautaire', 'etudiants'],
  collecte: ['communautaire', 'environnement'],
  corvee_proprete: ['environnement', 'securite'],
}

const rad = (d: number) => (d * Math.PI) / 180
function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(h))
}

function pertinence(p: Profil, type: TypeProjet): number {
  let pts = 0
  if (p.themes.some((x) => THEMES_TYPE[type].includes(x))) pts += 3
  if (p.verifie === 'ville' || p.verifie === 'sdc') pts += 2
  if (p.reclame) pts += 1
  return pts
}

export default function NouveauProjet({ profils, lieux, moi, onRetour, onCree }: Props) {
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TypeProjet>('atelier')
  const [creneau, setCreneau] = useState<Creneau>('fin_de_semaine')
  const [lieuId, setLieuId] = useState('')
  const [roles, setRoles] = useState<Tag[]>([])
  const [cherche, setCherche] = useState(false)
  const [invites, setInvites] = useState<Record<string, Tag[]>>({})
  const [erreur, setErreur] = useState('')
  const [proposeurId, setProposeurId] = useState('')

  const lieuxUtiles = useMemo(() => lieux.filter((l) => l.offres.length > 0), [lieux])
  const lieu = lieux.find((l) => l.id === lieuId)
  const ref = lieu ?? moi ?? CENTRE
  const danger = mentionneDanger(`${titre} ${description}`)
  const avant = useMemo(() => listeAvant(type, `${titre} ${description}`), [type, titre, description])

  const candidats = useMemo(() => {
    const res = {} as Record<Tag, { profil: Profil; m: number }[]>
    for (const tag of roles) {
      res[tag] = profils
        .filter((p) => p.id !== moi?.id && p.id !== proposeurId && p.offres.includes(tag))
        .map((profil) => ({ profil, m: distanceM(profil, ref), pts: pertinence(profil, type) }))
        .sort((a, b) => b.pts - a.pts || a.m - b.m)
        .slice(0, 3)
    }
    return res
  }, [roles, profils, moi, proposeurId, type, ref])

  function exemple() {
    setTitre(t.exemple.titre)
    setDescription(t.exemple.description)
    setType('corvee_proprete')
    setProposeurId('p-sofia')
    setCreneau('fin_de_semaine')
    setLieuId('')
    setRoles(['benevoles', 'materiel', 'expertise', 'visibilite'])
    setCherche(false)
    setInvites({})
    setErreur('')
  }

  function basculerRole(tag: Tag) {
    setRoles((r) => (r.includes(tag) ? r.filter((x) => x !== tag) : [...r, tag]))
  }

  function inviter(id: string, tag: Tag) {
    setInvites((cur) => {
      const tags = cur[id] ?? []
      if (tags.includes(tag)) {
        const reste = tags.filter((x) => x !== tag)
        const { [id]: _omis, ...autres } = cur
        return reste.length > 0 ? { ...autres, [id]: reste } : autres
      }
      return { ...cur, [id]: [...tags, tag] }
    })
  }

  function creer() {
    if (!titre.trim()) {
      setErreur(t.nouveau.titreRequis)
      return
    }
    const partenaires: Contribution[] = []
    if (moi) partenaires.push({ profilId: moi.id, apport: t.nouveau.apportVous, tags: [] })
    for (const [profilId, tags] of Object.entries(invites)) {
      partenaires.push({ profilId, apport: t.nouveau.apportPour(tags.map((x) => LIBELLE_TAG[x]).join(', ')), tags })
    }
    const couverts = roles.filter((r) => Object.values(invites).some((tags) => tags.includes(r))).length
    const score = roles.length === 0 ? 0 : Math.round((couverts / roles.length) * 100)
    const aConfirmer = [t.nouveau.aConfirmerDate, ...(lieu ? [] : [t.nouveau.aConfirmerLieu]), ...avant.slice(0, 3)]
    onCree({
      id: `ouvert-${Date.now()}`,
      titre: titre.trim(),
      type,
      partenaires,
      lieuId: lieu?.id,
      creneau,
      score,
      raisons: roles.map((r) => `Rôle recherché : ${LIBELLE_TAG[r].toLowerCase()}`),
      aConfirmer,
      evenementsProches: [],
      statut: 'proposee',
    })
  }

  return (
    <main className="pj-page">
      <button type="button" className="pj-retour" onClick={onRetour}>{t.retour}</button>
      <h1 className="pj-titre">{t.nouveau.titre}</h1>
      <p className="pj-texte">{t.nouveau.intro} <span className="pj-badge">{t.demo}</span></p>

      <button type="button" className="pj-btn" onClick={exemple}>{t.nouveau.exemple}</button>

      <form className="pj-carte" style={{ marginTop: 12 }} onSubmit={(e) => { e.preventDefault(); setCherche(true) }}>
        <label className="pj-champ">{t.nouveau.champTitre}
          <input value={titre} onChange={(e) => { setTitre(e.target.value); setErreur('') }} maxLength={100} />
        </label>
        <label className="pj-champ">{t.nouveau.champDescription}
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} />
        </label>

        {danger && <p className="pj-urgence" role="alert">{t.nouveau.urgence}</p>}

        <label className="pj-champ">{t.nouveau.champType}
          <select value={type} onChange={(e) => setType(e.target.value as TypeProjet)}>
            {TYPES.map((x) => <option key={x} value={x}>{LIBELLE_TYPE[x]}</option>)}
          </select>
        </label>
        <label className="pj-champ">{t.nouveau.champCreneau}
          <select value={creneau} onChange={(e) => setCreneau(e.target.value as Creneau)}>
            {CRENEAUX.map((x) => <option key={x} value={x}>{LIBELLE_CRENEAU[x]}</option>)}
          </select>
        </label>
        <label className="pj-champ">{t.nouveau.champLieu}
          <select value={lieuId} onChange={(e) => setLieuId(e.target.value)}>
            <option value="">{t.nouveau.lieuTbd}</option>
            {lieuxUtiles.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
          </select>
        </label>

        <h2 className="pj-h2" id="pj-roles">{t.nouveau.roles}</h2>
        <Chips options={TAGS} selected={roles} libelle={LIBELLE_TAG} onToggle={basculerRole} label={t.nouveau.roles} />

        <div style={{ marginTop: 14 }}>
          <button type="submit" className="pj-btn pj-btn-cta" disabled={roles.length === 0}>{t.nouveau.trouver}</button>
          {roles.length === 0 && <p className="pj-note">{t.nouveau.pasDeNom}</p>}
        </div>
      </form>

      {cherche && roles.length > 0 && (
        <section aria-label={t.nouveau.partenaires}>
          <h2 className="pj-h2">{t.nouveau.partenaires}</h2>
          {roles.map((tag) => (
            <div key={tag} className="pj-carte">
              <h3 className="pj-nom">{LIBELLE_TAG[tag]}</h3>
              {candidats[tag].length === 0 && <p className="pj-note">{t.nouveau.aucun}</p>}
              {candidats[tag].map(({ profil, m }) => {
                const invite = invites[profil.id]?.includes(tag) ?? false
                return (
                  <div key={profil.id} className="pj-ligne" style={{ marginTop: 8 }}>
                    <div>
                      <strong>{profil.nom}</strong>
                      <p className="pj-note">
                        {profil.sousType} · {t.nouveau.distance(m)}
                        {!profil.reclame && ` · ${fr.profil.tagNonReclame}`}
                      </p>
                    </div>
                    <button type="button" className={invite ? 'pj-btn pj-btn-cta' : 'pj-btn'} aria-pressed={invite} onClick={() => inviter(profil.id, tag)}>
                      {invite ? t.nouveau.invite : t.nouveau.inviter}
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </section>
      )}

      <section className="pj-carte" aria-labelledby="pj-avant">
        <h2 className="pj-nom" id="pj-avant">{t.nouveau.avant}</h2>
        <ul className="pj-liste">
          {avant.map((x) => <li key={x}>{x}</li>)}
        </ul>
      </section>

      {erreur && <p className="pj-compte" role="alert">{erreur}</p>}
      <button type="button" className="pj-btn pj-btn-cta" onClick={creer}>{t.nouveau.creer}</button>
    </main>
  )
}
