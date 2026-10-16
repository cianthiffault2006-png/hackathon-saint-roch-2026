import { useMemo, useState } from 'react'
import type { Besoin, Evenement, Lieu, Profil, Proposition } from '../types'
import { proposer } from '../engine'
import { LIBELLE_CRENEAU, LIBELLE_TAG } from '../labels'
import { CENTRE_SAINT_ROCH, distanceM, minutesAPied } from './geo'
import { t } from './textes'
import { nomPublic, retenirCartes } from './cartesOptions'
import './PlusOptions.css'

interface Props {
  besoin: Besoin
  profils: Profil[]
  lieux: Lieu[]
  evenements: Evenement[]
  onChoisir(p: Proposition): void
}

const PALIERS = [5, 10, 20]

/** Toutes les propositions: l'engin n'en rend que 3, donc on relance sans les partenaires déjà proposés. */
function toutesLesPropositions(besoin: Besoin, profils: Profil[], lieux: Lieu[], evenements: Evenement[]): Proposition[] {
  const vues = new Map<string, Proposition>()
  let premier: Proposition[] = []
  let reste = profils
  for (let tour = 0; tour < 8; tour++) {
    const lot = proposer(besoin, reste, lieux, evenements)
    const nouvelles = lot.filter((p) => !vues.has(p.id))
    if (nouvelles.length === 0) break
    nouvelles.forEach((p) => vues.set(p.id, p))
    if (tour === 0) premier = nouvelles
    const retires = new Set(nouvelles.flatMap((p) => p.partenaires.map((c) => c.profilId)))
    retires.delete(besoin.auteurId ?? '')
    retires.delete(besoin.voulu ?? '') // the wanted partner stays in every round
    reste = reste.filter((p) => !retires.has(p.id))
  }
  // The cards' own order first, so entry 1 is proposal 1; then the others by score.
  const autres = [...vues.values()].filter((p) => !premier.includes(p)).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
  return [...premier, ...autres]
}

export default function PlusOptions({ besoin, profils, lieux, evenements, onChoisir }: Props) {
  const origine = useMemo(() => {
    if (besoin.lat !== undefined && besoin.lng !== undefined) return { lat: besoin.lat, lng: besoin.lng }
    return profils.find((p) => p.id === besoin.auteurId) ?? CENTRE_SAINT_ROCH
  }, [besoin, profils])
  const minutesDe = (p: { lat: number; lng: number }) => minutesAPied(distanceM(origine, p))

  const propositions = useMemo(() => toutesLesPropositions(besoin, profils, lieux, evenements), [besoin, profils, lieux, evenements])
  const parId = useMemo(() => new Map(profils.map((p) => [p.id, p])), [profils])
  // Default reach covers the proposals the sheet just showed (proposer's first lot), 10 minutes at least.
  const [minMax, setMinMax] = useState(() => {
    const loin = Math.max(0, ...proposer(besoin, profils, lieux, evenements).flatMap((p) => p.partenaires)
      .filter((c) => c.profilId !== besoin.auteurId)
      .map((c) => { const pr = parId.get(c.profilId); return pr ? minutesDe(pr) : 0 }))
    return PALIERS.find((x) => x >= Math.max(10, loin)) ?? PALIERS[PALIERS.length - 1]
  })

  // Within reach, then one card per title and partner set, at most MAX_CARTES by score.
  const cartes = useMemo(() => retenirCartes(propositions
    .map((p) => {
      const partenaires = p.partenaires.filter((c) => c.profilId !== besoin.auteurId)
      const loin = Math.max(0, ...partenaires.map((c) => { const pr = parId.get(c.profilId); return pr ? minutesDe(pr) : 0 }))
      return { p, loin }
    })
    .filter((x) => x.loin <= minMax))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    , [propositions, minMax, origine])

  // Partenaires compatibles un à un: ils offrent au moins un des besoins et partagent un créneau.
  const individuels = useMemo(() => profils
    .filter((p) => p.id !== besoin.auteurId && p.reclame)
    .map((p) => {
      const offre = p.offres.filter((o) => besoin.besoins.includes(o))
      const creneaux = p.creneaux.filter((c) => !besoin.creneaux.length || besoin.creneaux.includes(c))
      return { p, offre, creneaux, min: minutesDe(p) }
    })
    .filter((x) => x.offre.length > 0 && x.creneaux.length > 0 && x.min <= minMax)
    .sort((a, b) => b.offre.length - a.offre.length || a.min - b.min || a.p.id.localeCompare(b.p.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    , [profils, besoin, minMax, origine])

  return (
    <section className="po-racine" aria-labelledby="po-titre">
      <h2 id="po-titre" className="po-titre">{t.plusTitre}</h2>
      <p>{t.plusIntro}</p>
      <label className="po-curseur">
        <span>{t.curseur} : <strong>{t.curseurValeur(minMax)}</strong></span>
        <input
          type="range" min={0} max={PALIERS.length - 1} step={1}
          value={PALIERS.indexOf(minMax)}
          aria-valuetext={t.curseurValeur(minMax)}
          onChange={(e) => setMinMax(PALIERS[Number(e.target.value)])}
        />
        <span className="po-paliers" aria-hidden="true">{PALIERS.map((n) => <span key={n}>{n} min</span>)}</span>
      </label>

      {cartes.length === 0 ? <p role="status">{t.aucunProjet}</p> : (
        <ul className="po-liste">
          {cartes.map(({ p, loin }) => (
            <li key={p.id} className="po-carte">
              <strong>{p.titre}</strong>
              <span>{t.score(p.score)} · {t.minPartenaires(loin)}</span>
              <span>{p.partenaires.map((c) => nomPublic(parId.get(c.profilId), c.profilId)).join(', ')}</span>
              <button type="button" className="po-btn" onClick={() => onChoisir(p)}>{t.choisir}<span className="po-sr"> : {p.titre}</span></button>
            </li>
          ))}
        </ul>
      )}

      <h3>{t.partenairesSeuls}</h3>
      {individuels.length === 0 ? <p role="status">{t.aucunPartenaire}</p> : (
        <ul className="po-liste">
          {individuels.map(({ p, offre, creneaux, min }) => (
            <li key={p.id} className="po-carte">
              <strong>{nomPublic(p, p.id)}</strong>
              <span>{p.sousType} · {t.aPied(min)}</span>
              <span>{t.raisonPartenaire(offre.map((o) => LIBELLE_TAG[o]).join(', '), creneaux.map((c) => LIBELLE_CRENEAU[c]).join(', '))}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
