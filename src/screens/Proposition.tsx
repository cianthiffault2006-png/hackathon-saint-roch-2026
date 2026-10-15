import { useEffect, useMemo, useRef, useState } from 'react'
import type { Evenement, Lieu, Profil, Proposition as PropositionType, Statut } from '../types'
import { fr } from '../i18n/fr'
import { T } from '../textes'
import { PinForme, type NomIcone } from '../components/Icones'
import MapView, { type Pin } from '../components/MapView'
import { choisirInvite, prenom } from '../lib/invitation'
import { idProjet } from '../lib/projets'

interface Props {
  propositions: PropositionType[]
  profils: Profil[]
  lieux: Lieu[]
  evenements: Evenement[]
  onRetour: () => void
  delaiPinMs?: number
  /** Guided tour: how many pourquoi lines to show (all when undefined). */
  raisonsVisibles?: number
  /** Guided tour: presses the interest button once true. */
  interetAuto?: boolean
  /** Status per project id and the way to change it: the state lives in App so other screens can advance it. */
  statuts: Record<string, Statut>
  onChangerStatut: (prop: PropositionType, statut: Statut) => void
  index: number
  onIndex: (index: number) => void
  onFiche?: (prop: PropositionType) => void
  onInvitation?: (prop: PropositionType) => void
}

const LEGENDE: [NomIcone, string][] = [
  ['commerce', fr.proposition.rolesPartenaire.commerce],
  ['organisme', fr.proposition.rolesPartenaire.organisme],
  ['citoyen', fr.proposition.rolesPartenaire.citoyen],
  ['lieu', fr.carte.lieuPublic],
  ['evenement', fr.carte.evenement],
]

const LIBELLE_STATUT: Record<Statut, string> = fr.proposition.statuts

function formaterDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export default function Proposition({ propositions, profils, lieux, evenements, onRetour, delaiPinMs, raisonsVisibles, interetAuto, statuts, onChangerStatut, index, onIndex, onFiche, onInvitation }: Props) {
  const enVisite = delaiPinMs !== undefined
  const departX = useRef<number | null>(null)
  const feuilleRef = useRef<HTMLElement>(null)
  const [detailOuvert, setDetailOuvert] = useState(false)

  const prop = propositions[index]
  const statut: Statut = (prop && statuts[idProjet(prop)]) || 'proposee'
  const invite = prop ? choisirInvite(prop, profils) : null

  useEffect(() => {
    if (interetAuto && prop && !statuts[idProjet(prop)]) onChangerStatut(prop, 'interet_envoye')
  }, [interetAuto, prop, statuts, onChangerStatut])

  // Simulated confirmation chain: 2 s then 3 s. The timer is cleared if the screen or proposal changes.
  useEffect(() => {
    if (!prop) return
    const courant = prop
    let delai: number
    let suivant: Statut
    if (statut === 'interet_envoye') {
      delai = 2000
      suivant = 'en_attente'
    } else if (statut === 'en_attente') {
      delai = 3000
      suivant = 'confirmee'
    } else return
    const t = window.setTimeout(() => onChangerStatut(courant, suivant), delai)
    return () => window.clearTimeout(t)
  }, [prop, statut, onChangerStatut])

  const pins: Pin[] = useMemo(() => {
    if (!prop) return []
    const res: Pin[] = []
    for (const c of prop.partenaires) {
      const p = profils.find((x) => x.id === c.profilId)
      if (p) res.push({ id: p.id, lat: p.lat, lng: p.lng, type: 'partenaire', label: p.nom, role: p.role, detail: fr.proposition.rolesPartenaire[p.role] })
    }
    const lieu = lieux.find((l) => l.id === prop.lieuId)
    if (lieu) res.push({ id: lieu.id, lat: lieu.lat, lng: lieu.lng, type: 'lieu', label: lieu.nom, detail: fr.proposition.lieuSuggere })
    for (const id of prop.evenementsProches) {
      const e = evenements.find((x) => x.id === id)
      if (e) res.push({ id: e.id, lat: e.lat, lng: e.lng, type: 'evenement', label: e.titre, detail: e.categorie })
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
    onIndex(Math.min(propositions.length - 1, Math.max(0, index + delta)))
  }

  function surFin(x: number) {
    if (departX.current === null) return
    const dx = x - departX.current
    departX.current = null
    if (Math.abs(dx) > 50) aller(dx < 0 ? 1 : -1)
  }

  return (
    <div className="screen-carte">
      <MapView
        pins={pins}
        margeBas={Math.round(window.innerHeight * (enVisite ? 0.5 : 0.58))}
        margeHaut={enVisite ? 190 : 70}
        delaiPinMs={delaiPinMs}
      />
      <ul className="legende" style={{ bottom: `calc(${enVisite ? 50 : 58}dvh + 8px)` }} aria-label={fr.carte.legende}>
        {LEGENDE.map(([nom, libelle]) => (
          <li key={nom}>
            <PinForme nom={nom} taille={22} />
            {libelle}
          </li>
        ))}
      </ul>
      <button type="button" className="lien-evitement" onClick={() => feuilleRef.current?.focus()}>
        {T.carte.voirListe}
      </button>
      <button type="button" className="retour retour-carte" onClick={onRetour} aria-label={fr.general.retour}>←</button>
      <section
        className="feuille"
        ref={feuilleRef}
        id="liste-proposition"
        tabIndex={-1}
        style={{ animationDelay: `${(pins.length + 1) * (delaiPinMs ?? 300)}ms` }}
        aria-label={fr.proposition.titre}
        onTouchStart={(e) => { departX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => surFin(e.changedTouches[0].clientX)}
      >
        <div className="feuille-nav">
          <button type="button" className="nav-btn" onClick={() => aller(-1)} disabled={index === 0} aria-label={fr.proposition.precedente}>‹</button>
          <span className="points">
            <span className="sr-only" aria-live="polite">{T.a11y.pagination(index + 1, propositions.length)}</span>
            {propositions.map((p, i) => (
              <span key={p.id} className={i === index ? 'point point-on' : 'point'} />
            ))}
          </span>
          <button type="button" className="nav-btn" onClick={() => aller(1)} disabled={index === propositions.length - 1} aria-label={fr.proposition.suivante}>›</button>
        </div>
        <h1 className="feuille-titre">{prop.titre}</h1>
        <p className="score">{fr.proposition.score(prop.score)}</p>
        {prop.detailScore && (
          <div className="detail-score">
            <button type="button" className="detail-bouton" aria-expanded={detailOuvert} onClick={() => setDetailOuvert(!detailOuvert)}>
              {fr.proposition.commentScore}
            </button>
            {detailOuvert && (
              <ul className="barres">
                {(['complementarite', 'reciprocite', 'proximite', 'creneau', 'theme'] as const).map((cle) => (
                  <li key={cle}>
                    <span className="barre-nom">{T.a11y.detail[cle]}</span>
                    <span className="barre" aria-hidden="true"><span style={{ width: `${prop.detailScore?.[cle] ?? 0}%` }} /></span>
                    <span className="barre-val">{prop.detailScore?.[cle]} %</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <h2 className="sous-titre">{fr.proposition.partenaires}</h2>
        <ul className="liste-part">
          {prop.partenaires.map((c) => {
            const p = profils.find((x) => x.id === c.profilId)
            return (
              <li key={c.profilId} className="partenaire">
                <strong>{p?.nom ?? c.profilId}</strong>
                {p && !p.reclame && <span className="tag-prerempli">{fr.profil.tagNonReclame}</span>}
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
        <ul className="liste">{prop.raisons.slice(0, raisonsVisibles ?? prop.raisons.length).map((r) => <li key={r} className="apparait">{r}</li>)}</ul>

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
              onClick={() => onChangerStatut(prop, 'interet_envoye')}
            >
              {fr.proposition.interet}
            </button>
          ) : (
            <div className={`statut statut-${statut}`} role="status" aria-live="polite">
              {LIBELLE_STATUT[statut]}
            </div>
          )}
          {statut === 'confirmee' && (
            <div className="confettis" aria-hidden="true">
              {Array.from({ length: 16 }, (_, i) => (
                <span
                  key={i}
                  style={{ left: `${6 + i * 6}%`, animationDelay: `${(i % 5) * 120}ms`, background: i % 2 ? 'var(--orange)' : 'var(--vert)' }}
                />
              ))}
            </div>
          )}
          {statut === 'en_attente' && onInvitation && invite && (
            <button type="button" className="btn btn-texte btn-invitation" onClick={() => onInvitation(prop)}>
              Voir ce que {prenom(invite.partenaire)} reçoit
            </button>
          )}
          {statut === 'confirmee' && onFiche && (
            <button type="button" className="btn btn-lien btn-fiche" onClick={() => onFiche(prop)}>
              {fr.fiche.voir}
            </button>
          )}
          <p className="note-simulation">{fr.proposition.noteSimulation}</p>
        </div>
      </section>
    </div>
  )
}
