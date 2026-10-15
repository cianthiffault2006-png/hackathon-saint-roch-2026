import { useEffect, useMemo, useRef, useState } from 'react'
import type { Evenement, Lieu, Profil, Proposition as PropositionType, Statut } from '../types'
import { fr } from '../i18n/fr'
import MapView, { type Pin } from '../components/MapView'

interface Props {
  propositions: PropositionType[]
  profils: Profil[]
  lieux: Lieu[]
  evenements: Evenement[]
  onRetour: () => void
}

const LIBELLE_STATUT: Record<Statut, string> = fr.proposition.statuts

const MARGE_FEUILLE = 360

function formaterDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export default function Proposition({ propositions, profils, lieux, evenements, onRetour }: Props) {
  const [index, setIndex] = useState(0)
  const [statuts, setStatuts] = useState<Record<string, Statut>>({})
  const departX = useRef<number | null>(null)

  const prop = propositions[index]
  const statut: Statut = (prop && statuts[prop.id]) || 'proposee'

  // Simulated confirmation chain: 2 s then 3 s. The timer is cleared if the screen or proposal changes.
  useEffect(() => {
    if (!prop) return
    const id = prop.id
    let delai: number
    let suivant: Statut
    if (statut === 'interet_envoye') {
      delai = 2000
      suivant = 'en_attente'
    } else if (statut === 'en_attente') {
      delai = 3000
      suivant = 'confirmee'
    } else return
    const t = window.setTimeout(() => setStatuts((s) => ({ ...s, [id]: suivant })), delai)
    return () => window.clearTimeout(t)
  }, [prop, statut])

  const pins: Pin[] = useMemo(() => {
    if (!prop) return []
    const res: Pin[] = []
    for (const c of prop.partenaires) {
      const p = profils.find((x) => x.id === c.profilId)
      if (p) res.push({ id: p.id, lat: p.lat, lng: p.lng, type: 'partenaire', label: p.nom })
    }
    const lieu = lieux.find((l) => l.id === prop.lieuId) ?? lieux[0]
    if (lieu) res.push({ id: lieu.id, lat: lieu.lat, lng: lieu.lng, type: 'lieu', label: lieu.nom })
    for (const id of prop.evenementsProches) {
      const e = evenements.find((x) => x.id === id)
      if (e) res.push({ id: e.id, lat: e.lat, lng: e.lng, type: 'evenement', label: e.titre })
    }
    return res
  }, [prop, profils, lieux, evenements])

  if (!prop) {
    return (
      <main className="screen">
        <h1>{fr.etats.vide.titre}</h1>
        <p>{fr.etats.vide.texte}</p>
        <button type="button" className="btn btn-primaire" onClick={onRetour}>{fr.general.retour}</button>
      </main>
    )
  }

  const proches = prop.evenementsProches
    .map((id) => evenements.find((e) => e.id === id))
    .filter((e): e is Evenement => e !== undefined)
  const lieu = lieux.find((l) => l.id === prop.lieuId)

  function aller(delta: number) {
    setIndex((i) => Math.min(propositions.length - 1, Math.max(0, i + delta)))
  }

  function surFin(x: number) {
    if (departX.current === null) return
    const dx = x - departX.current
    departX.current = null
    if (Math.abs(dx) > 50) aller(dx < 0 ? 1 : -1)
  }

  return (
    <div className="screen-carte">
      <MapView pins={pins} margeBas={MARGE_FEUILLE} />
      <button type="button" className="retour retour-carte" onClick={onRetour} aria-label={fr.general.retour}>←</button>
      <section
        className="feuille"
        aria-label={fr.proposition.titre}
        onTouchStart={(e) => { departX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => surFin(e.changedTouches[0].clientX)}
      >
        <div className="feuille-nav">
          <button type="button" className="nav-btn" onClick={() => aller(-1)} disabled={index === 0} aria-label={fr.visite.precedent}>‹</button>
          <span className="points" aria-label={`Proposition ${index + 1} sur ${propositions.length}`}>
            {propositions.map((p, i) => (
              <span key={p.id} className={i === index ? 'point point-on' : 'point'} />
            ))}
          </span>
          <button type="button" className="nav-btn" onClick={() => aller(1)} disabled={index === propositions.length - 1} aria-label={fr.visite.suivant}>›</button>
        </div>
        <h1 className="feuille-titre">{prop.titre}</h1>
        <p className="score">{fr.proposition.score(prop.score)}</p>

        <h2 className="sous-titre">{fr.proposition.partenaires}</h2>
        <ul className="liste-part">
          {prop.partenaires.map((c) => {
            const p = profils.find((x) => x.id === c.profilId)
            return (
              <li key={c.profilId} className="partenaire">
                <strong>{p?.nom ?? c.profilId}</strong>
                {p && !p.reclame && <span className="tag-prerempli">Profil pré-rempli</span>}
                <span className="apport">{c.apport}</span>
              </li>
            )
          })}
          {lieu && (
            <li className="partenaire">
              <strong>{lieu.nom}</strong>
              <span className="apport">{fr.proposition.lieuSuggere}</span>
            </li>
          )}
        </ul>

        <h2 className="sous-titre">{fr.proposition.pourquoi}</h2>
        <ul className="liste">{prop.raisons.map((r) => <li key={r}>{r}</li>)}</ul>

        <h2 className="sous-titre">{fr.proposition.aConfirmer}</h2>
        <ul className="liste liste-orange">{prop.aConfirmer.map((r) => <li key={r}>{r}</li>)}</ul>

        {proches.length > 0 && (
          <>
            <h2 className="sous-titre">{fr.proposition.evenementsProches}</h2>
            <ul className="liste">
              {proches.map((e) => <li key={e.id}>{e.titre}, {formaterDate(e.debut)}</li>)}
            </ul>
          </>
        )}

        <div className="pied-feuille">
          {statut === 'proposee' ? (
            <button
              type="button"
              className="btn btn-primaire"
              onClick={() => setStatuts((s) => ({ ...s, [prop.id]: 'interet_envoye' }))}
            >
              {fr.proposition.interet}
            </button>
          ) : (
            <div className={`statut statut-${statut}`} role="status" aria-live="polite">
              {LIBELLE_STATUT[statut]}
            </div>
          )}
          <p className="note-simulation">{fr.proposition.noteSimulation}</p>
        </div>
      </section>
    </div>
  )
}
