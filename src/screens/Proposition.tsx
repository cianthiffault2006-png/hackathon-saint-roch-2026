import { useEffect, useMemo, useRef, useState } from 'react'
import type { Evenement, Lieu, Profil, Proposition as PropositionType, Statut } from '../types'
import { fr } from '../i18n/fr'
import { PinForme, type NomIcone } from '../components/Icones'
import MapView, { type Pin } from '../components/MapView'
import { choisirInvite, nomCourt } from '../lib/invitation'
import { idEvenement, idProjet, type Projet } from '../lib/projets'

interface Props {
  propositions: PropositionType[]
  profils: Profil[]
  lieux: Lieu[]
  evenements: Evenement[]
  onRetour: () => void
  /** Guided tour: what the tour clock shows on this screen. The statuses come in `statuts`. */
  visite?: GuideProposition
  /** Status per project id and the way to change it: the state lives in App so other screens can advance it. */
  statuts: Record<string, Statut>
  onChangerStatut: (prop: PropositionType, statut: Statut) => void
  index: number
  onIndex: (index: number) => void
  onFiche?: (prop: PropositionType) => void
  onInvitation?: (prop: PropositionType) => void
  /** Project id → partner's first name, for proposals whose invitation was declined (simulated): a note, and no invitation link. */
  declins?: Record<string, string>
  /** The viewer's projects, to show which public events are already joined. */
  projets?: Projet[]
  onParticiper?: (e: Evenement) => void
  onPlusOptions?: () => void
  /** After « Ça m’intéresse »: leave the proposal for the neighbourhood map. */
  onExplorer?: () => void
}

const LEGENDE: [NomIcone, string][] = [
  ['commerce', fr.proposition.rolesPartenaire.commerce],
  ['organisme', fr.proposition.rolesPartenaire.organisme],
  ['citoyen', fr.proposition.rolesPartenaire.citoyen],
  ['lieu', fr.carte.lieuPublic],
  ['evenement', fr.carte.evenement],
]

export interface GuideProposition {
  /** The pins drop and the sheet slides in (first step on the map only). */
  animer: boolean
  anneau: boolean
  /** « Comment ce score » is open. */
  detail: boolean
  /** How many pourquoi lines show. */
  raisons: number
}

/** Shared empty list: a new [] on every render made the pins, then every marker, change each time. */
const AUCUN_PROJET: Projet[] = []
const AUCUN_DECLIN: Record<string, string> = {}

const DELAI_PIN_VISITE_MS = 400

const LIBELLE_STATUT: Record<Statut, string> = fr.proposition.statuts

function formaterDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export default function Proposition({ propositions, profils, lieux, evenements, onRetour, visite, statuts, onChangerStatut, index, onIndex, onFiche, onInvitation, declins = AUCUN_DECLIN, projets = AUCUN_PROJET, onParticiper, onPlusOptions, onExplorer }: Props) {
  const enVisite = visite !== undefined
  const departX = useRef<number | null>(null)
  const feuilleRef = useRef<HTMLDivElement>(null)
  const [detailOuvert, setDetailOuvert] = useState(false)

  const prop = propositions[index]
  const statut: Statut = (prop && statuts[idProjet(prop)]) || 'proposee'
  const declin = prop ? declins[idProjet(prop)] : undefined
  const invite = prop ? choisirInvite(prop, profils) : null

  // « Intérêt envoyé » becomes « En attente » after 2 s. It then stays there until the partner accepts
  // in the invitation, or « Simuler la réponse des partenaires » is pressed: no timer confirms it,
  // so a presenter who talks keeps the invitation link. The guided tour sets every status from its clock.
  useEffect(() => {
    if (!prop || enVisite || statut !== 'interet_envoye') return
    const courant = prop
    const t = window.setTimeout(() => onChangerStatut(courant, 'en_attente'), 2000)
    return () => window.clearTimeout(t)
  }, [prop, statut, onChangerStatut, enVisite])

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
      if (e) {
        res.push({
          id: e.id, lat: e.lat, lng: e.lng, type: 'evenement', label: e.titre, detail: e.categorie,
          evenement: { id: e.id, ouvert: e.ouvertAuPublic === true, inscrits: e.inscrits ?? 0, inscrit: projets.some((p) => p.id === idEvenement(e)) },
        })
      }
    }
    return res
  }, [prop, profils, lieux, evenements, projets])

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
    <div className={visite && !visite.animer ? 'screen-carte sans-anim' : 'screen-carte'}>
      <MapView
        pins={pins}
        margeBas={Math.round(window.innerHeight * (enVisite ? 0.5 : 0.58))}
        margeHaut={enVisite ? 215 : 70}
        delaiPinMs={enVisite ? DELAI_PIN_VISITE_MS : undefined}
        animerPins={visite?.animer}
        anneauVisible={visite?.anneau}
        onParticiper={(id) => {
          const e = evenements.find((x) => x.id === id)
          if (e) onParticiper?.(e)
        }}
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
        {fr.carte.voirListe}
      </button>
      <button type="button" className="retour retour-carte" onClick={onRetour} aria-label={fr.general.retour}>←</button>
      {/* The white card does not scroll; a transparent inner element does. An opaque scroll
          container over the WebGL canvas made Chrome skip repainting the map above the sheet. */}
      <section
        className="feuille"
        style={{ animationDelay: `${(pins.length + 1) * (enVisite ? DELAI_PIN_VISITE_MS : 300)}ms` }}
        aria-label={fr.proposition.titre}
        onTouchStart={(e) => { departX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => surFin(e.changedTouches[0].clientX)}
      >
        <div className="feuille-defile" ref={feuilleRef} id="liste-proposition" tabIndex={-1}>
          <div className="feuille-nav">
            <button type="button" className="nav-btn" onClick={() => aller(-1)} disabled={index === 0} aria-label={fr.proposition.precedente}>‹</button>
            <span className="points">
              <span className="sr-only" aria-live="polite">{fr.proposition.paginationN(index + 1, propositions.length)}</span>
              {propositions.map((p, i) => (
                <span key={p.id} className={i === index ? 'point point-on' : 'point'} />
              ))}
            </span>
            <button type="button" className="nav-btn" onClick={() => aller(1)} disabled={index === propositions.length - 1} aria-label={fr.proposition.suivante}>›</button>
          </div>
          <h1 className="feuille-titre">{prop.titre}</h1>
          {statut !== 'confirmee' && <p className="etiquette-collab">{fr.evenement.collab}</p>}
          <p className="score">{fr.proposition.score(prop.score)}</p>
          {prop.detailScore && (
            <div className="detail-score">
              <button type="button" className="detail-bouton" aria-expanded={visite ? visite.detail : detailOuvert} onClick={() => setDetailOuvert(!detailOuvert)}>
                {fr.proposition.commentScore}
              </button>
              {(visite ? visite.detail : detailOuvert) && (
                <ul className="barres">
                  {(['complementarite', 'reciprocite', 'proximite', 'creneau', 'theme'] as const).map((cle) => (
                    <li key={cle}>
                      <span className="barre-nom">{fr.proposition.detailScore[cle]}</span>
                      <span className="barre" aria-hidden="true"><span style={{ width: `${prop.detailScore?.[cle] ?? 0}%` }} /></span>
                      <span className="barre-val">{prop.detailScore?.[cle]} %</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <h2 className="sous-titre" data-visite="partenaires">{fr.proposition.partenaires}</h2>
          <ul className="liste-part">
            {prop.partenaires.map((c) => {
              const p = profils.find((x) => x.id === c.profilId)
              return (
                <li key={c.profilId} className="partenaire">
                  <strong>{p?.nom ?? c.profilId}</strong>
                  {p && !p.reclame && <span className="tag-prerempli">{fr.profil.tagNonReclame}</span>}
                  <span className="apport">{c.apport}</span>
                  {p?.source === 'ouvert' && <span className="apport apport-source">{p.origine}</span>}
                </li>
              )
            })}
            {lieu && (
              <li className="partenaire">
                <strong>{lieu.nom}</strong>
                <span className="apport">{fr.proposition.lieuSuggere}</span>
                <span className="apport apport-source">Lieu public : {lieu.attribution}</span>
              </li>
            )}
          </ul>

          <h2 className="sous-titre" data-visite="pourquoi">{fr.proposition.pourquoi}</h2>
          <ul className="liste">
            {prop.raisons.slice(0, visite ? visite.raisons : prop.raisons.length).map((r, i) => (
              <li key={r} className="apparait" data-visite={`raison-${i}`}>{r}</li>
            ))}
          </ul>

          <h2 className="sous-titre" data-visite="a-confirmer">{fr.proposition.aConfirmer}</h2>
          <ul className="liste liste-orange">{prop.aConfirmer.map((r) => <li key={r}>{r}</li>)}</ul>

          {proches.length > 0 && (
            <>
              <h2 className="sous-titre" data-visite="evenements">{fr.proposition.evenementsProches}</h2>
              <ul className="liste">
                {proches.map((e) => {
                  const inscrit = projets.some((p) => p.id === idEvenement(e))
                  return (
                    <li key={e.id} className={e.ouvertAuPublic ? 'evenement-ouvert' : undefined}>
                      {e.titre}, {formaterDate(e.debut)}
                      {e.ouvertAuPublic && (
                        <span className="evenement-bloc">
                          <span className="tag-ouvert">{fr.evenement.ouvert}</span>
                          <span className="evenement-nb">{fr.evenement.nbPersonnes((e.inscrits ?? 0) + (inscrit ? 1 : 0))}</span>
                          {onParticiper && (
                            <button type="button" className="btn btn-participe" onClick={() => onParticiper(e)}>
                              {inscrit ? fr.evenement.inscritMoi : fr.evenement.participe}
                            </button>
                          )}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {onPlusOptions && (
            <button type="button" className="btn btn-texte btn-petit btn-plus-options" onClick={onPlusOptions}>
              {fr.options.plus}
            </button>
          )}
        </div>
        <div className="pied-feuille">
          {statut === 'proposee' && declin && (
            <p className="note-declin" role="status">{fr.proposition.decline(declin)}</p>
          )}
          {statut === 'proposee' ? (
            !declin && <button
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
          {statut === 'en_attente' && onInvitation && invite && !declin && (
            <button type="button" className="btn btn-texte btn-invitation" onClick={() => onInvitation(prop)}>
              {fr.proposition.voirInvitation(nomCourt(invite.partenaire))}
            </button>
          )}
          {statut === 'en_attente' && !enVisite && (
            <button type="button" className="btn btn-texte btn-petit btn-simuler" onClick={() => onChangerStatut(prop, 'confirmee')}>
              {fr.proposition.simulerReponse}
            </button>
          )}
          {statut === 'confirmee' && onFiche && (
            <button type="button" className="btn btn-lien btn-fiche" onClick={() => onFiche(prop)}>
              {fr.fiche.voir}
            </button>
          )}
          {(statut === 'en_attente' || statut === 'confirmee') && !enVisite && (onPlusOptions || onExplorer) && (
            <div className="liens-apres-interet">
              {onPlusOptions && (
                <button type="button" className="btn btn-texte btn-petit" onClick={onPlusOptions}>
                  {fr.proposition.autresOptions}
                </button>
              )}
              {onExplorer && (
                <button type="button" className="btn btn-texte btn-petit" onClick={onExplorer}>
                  {fr.nav.explorer}
                </button>
              )}
            </div>
          )}
          <p className="note-simulation">{fr.proposition.noteSimulation}</p>
        </div>
      </section>
    </div>
  )
}
