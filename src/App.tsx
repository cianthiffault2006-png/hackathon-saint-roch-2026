import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Besoin as BesoinType, Proposition as PropositionType, Role, Statut } from './types'
import { chargerDonnees, type Donnees } from './lib/data'
import { proposer } from './engineAdapter'
import { choixDepuisTexte, construireBesoin } from './lib/besoin'
import { choisirInvite } from './lib/invitation'
import { T } from './textes'
import { fr } from './i18n/fr'
import { chargerProjets, idProjet, projetDepuis, sauverProjets, type Projet } from './lib/projets'
import Badge from './components/Badge'
import Accueil from './screens/Accueil'
import Besoin from './screens/Besoin'
import Fiche from './screens/Fiche'
import Invitation from './screens/Invitation'
import Projets from './screens/Projets'
import Proposition from './screens/Proposition'
import Sdc from './screens/Sdc'
import TourBar from './tour/TourBar'
import { useTour } from './tour/useTour'
import { ETAPES, ROLE_VISITE, SAISIE_MS, TEXTE_VISITE, indexDe } from './tour/script'

type Ecran = 'accueil' | 'besoin' | 'proposition' | 'invitation' | 'fiche' | 'projets' | 'sdc'

const VIDE: Donnees = { profils: [], lieux: [], evenements: [] }
const DELAI_PIN_VISITE_MS = 700

export default function App() {
  const [ecran, setEcran] = useState<Ecran>('accueil')
  const [retourFiche, setRetourFiche] = useState<Ecran>('projets')
  const [role, setRole] = useState<Role>('commerce')
  const [donnees, setDonnees] = useState<Donnees>(VIDE)
  const [propositions, setPropositions] = useState<PropositionType[]>([])
  const [indexProp, setIndexProp] = useState(0)
  const [statuts, setStatuts] = useState<Record<string, Statut>>({})
  const [statutsVisite, setStatutsVisite] = useState<Record<string, Statut>>({})
  const [invitationProp, setInvitationProp] = useState<PropositionType | null>(null)
  const [projets, setProjets] = useState<Projet[]>(chargerProjets)
  const [ouvertId, setOuvertId] = useState<string | null>(null)
  const [annonce, setAnnonce] = useState('')
  const { etat, demarrer, quitter, basculerPause, suivant } = useTour()

  useEffect(() => {
    chargerDonnees().then(setDonnees)
  }, [])

  useEffect(() => {
    sauverProjets(projets)
  }, [projets])

  // The tour runs the café story through the same engine and the same screens.
  const propositionsVisite = useMemo(() => {
    const besoin = construireBesoin(ROLE_VISITE, TEXTE_VISITE, donnees.profils, choixDepuisTexte(ROLE_VISITE, TEXTE_VISITE, donnees.profils))
    return proposer(besoin, donnees.profils, donnees.lieux, donnees.evenements)
  }, [donnees])

  // A throwaway project for the tour: never saved, never mixed with the viewer's own projects.
  const projetVisite = useMemo(() => {
    const prop = propositionsVisite[0]
    return prop ? projetDepuis(prop, donnees.profils, donnees.lieux, 'confirmee') : null
  }, [propositionsVisite, donnees])

  const etape = etat ? ETAPES[etat.index] : null
  const enVisite = etat !== null && etape !== null
  const ecranActif: Ecran = etape ? etape.ecran : ecran

  // One permanent polite live region: its text changes when the screen or the result changes.
  useEffect(() => {
    if (!enVisite) setAnnonce(T.a11y.ecrans[ecranActif])
  }, [ecranActif, enVisite])

  // One place for every status change: the screen state and, outside the tour, the saved project.
  const changerStatut = useCallback(
    (prop: PropositionType, statut: Statut) => {
      const cle = idProjet(prop)
      if (enVisite) {
        setStatutsVisite((s) => ({ ...s, [cle]: statut }))
        return
      }
      setStatuts((s) => ({ ...s, [cle]: statut }))
      setAnnonce(fr.proposition.statuts[statut])
      setProjets((prev) => {
        const existant = prev.find((p) => p.id === cle)
        if (!existant) return [...prev, projetDepuis(prop, donnees.profils, donnees.lieux, statut)]
        if (existant.statut === statut) return prev
        return prev.map((p) => (p.id === cle ? { ...p, statut } : p))
      })
    },
    [enVisite, donnees],
  )

  function trouver(besoin: BesoinType) {
    const trouvees = proposer(besoin, donnees.profils, donnees.lieux, donnees.evenements)
    setPropositions(trouvees)
    setAnnonce(fr.proposition.nombreTrouvees(trouvees.length))
    setIndexProp(0)
    setEcran('proposition')
  }

  function ouvrirFiche(id: string, depuis: Ecran) {
    setOuvertId(id)
    setRetourFiche(depuis)
    setEcran('fiche')
  }

  function cocher(index: number) {
    if (enVisite) return
    setProjets((prev) =>
      prev.map((p) => (p.id === ouvertId ? { ...p, coches: p.coches.map((c, i) => (i === index ? !c : c)) } : p)),
    )
  }

  function lancerVisite() {
    setRole(ROLE_VISITE)
    setStatutsVisite({})
    demarrer()
  }

  function quitterVisite() {
    quitter()
    setEcran('accueil')
    window.setTimeout(() => document.querySelector<HTMLElement>('[data-visite]')?.focus(), 50)
  }

  function accepterInvitation(prop: PropositionType) {
    changerStatut(prop, 'confirmee')
    // Outside the tour, leave a moment to read the partner's confirmation, then go back.
    if (!enVisite) window.setTimeout(() => setEcran('proposition'), 2400)
  }

  // What the tour asks of each screen, derived from the step and the time elapsed in it.
  let texteGuide: string | undefined
  let pulse = false
  let raisonsVisibles: number | undefined
  let interet = false
  let cochesVisite = 0
  let defilement: 'actions' | 'liste' | undefined
  let accepterAuto = false
  let defilerInvitation = false
  if (etat && etape) {
    if (etape.id === 'saisie') {
      texteGuide = TEXTE_VISITE.slice(0, Math.ceil(TEXTE_VISITE.length * Math.min(1, etat.ms / SAISIE_MS)))
    } else if (etape.id === 'bouton') {
      texteGuide = TEXTE_VISITE
      pulse = true
    }
    if (etape.id === 'carte') raisonsVisibles = 0
    if (etape.id === 'raisons') raisonsVisibles = 1 + Math.floor(etat.ms / 1300)
    interet = etat.index >= indexDe('interet')
    if (etape.id === 'invitation') {
      defilerInvitation = etat.ms > 1200
      accepterAuto = etat.ms > 3000
    }
    if (etape.id === 'fiche') {
      pulse = true
      if (etat.ms > 1800) defilement = 'actions'
    }
    if (etape.id === 'coches') defilement = 'liste'
    if (etape.id === 'coches') cochesVisite = Math.floor(etat.ms / 800)
    if (etat.index > indexDe('coches')) cochesVisite = 3
  }

  const projetAffiche: Projet | null = enVisite
    ? projetVisite && { ...projetVisite, coches: projetVisite.coches.map((_, i) => i < cochesVisite) }
    : (projets.find((p) => p.id === ouvertId) ?? null)
  const projetsAffiches = enVisite ? (projetAffiche ? [projetAffiche] : []) : projets

  const propInvitation = enVisite ? (propositionsVisite[0] ?? null) : invitationProp
  const invite = propInvitation ? choisirInvite(propInvitation, donnees.profils) : null

  return (
    <div className={enVisite ? 'racine tour-actif' : 'racine'}>
      <div className="ecrans" inert={enVisite}>
      {ecranActif === 'accueil' && (
        <Accueil
          surbrillance={enVisite ? ROLE_VISITE : undefined}
          onRole={(r) => { setRole(r); setEcran('besoin') }}
          onVisite={lancerVisite}
          onProjets={!enVisite && projets.length > 0 ? () => setEcran('projets') : undefined}
          onSdc={enVisite ? undefined : () => setEcran('sdc')}
        />
      )}
      {ecranActif === 'besoin' && (
        <Besoin
          role={enVisite ? ROLE_VISITE : role}
          profils={donnees.profils}
          texteGuide={texteGuide}
          pulse={pulse}
          onRetour={() => setEcran('accueil')}
          onTrouver={trouver}
        />
      )}
      {ecranActif === 'proposition' && (
        <Proposition
          propositions={enVisite ? propositionsVisite : propositions}
          profils={donnees.profils}
          lieux={donnees.lieux}
          evenements={donnees.evenements}
          delaiPinMs={enVisite ? DELAI_PIN_VISITE_MS : undefined}
          raisonsVisibles={raisonsVisibles}
          interetAuto={interet}
          statuts={enVisite ? statutsVisite : statuts}
          onChangerStatut={changerStatut}
          index={enVisite ? 0 : indexProp}
          onIndex={setIndexProp}
          onFiche={(prop) => ouvrirFiche(idProjet(prop), 'proposition')}
          onInvitation={(prop) => { setInvitationProp(prop); setEcran('invitation') }}
          onRetour={() => setEcran('besoin')}
        />
      )}
      {ecranActif === 'invitation' && propInvitation && invite && (
        <Invitation
          proposition={propInvitation}
          partenaire={invite.partenaire}
          demandeur={invite.demandeur}
          accepterAuto={accepterAuto}
          defilerAuto={defilerInvitation}
          onAccepter={() => accepterInvitation(propInvitation)}
          onRetour={() => setEcran('proposition')}
        />
      )}
      {ecranActif === 'fiche' && projetAffiche && (
        <Fiche
          projet={projetAffiche}
          pulse={pulse}
          defilement={defilement}
          onCocher={cocher}
          onRetour={() => setEcran(retourFiche)}
          onProjets={() => setEcran('projets')}
        />
      )}
      {ecranActif === 'projets' && (
        <Projets
          projets={projetsAffiches}
          onRetour={() => setEcran('accueil')}
          onOuvrir={(id) => ouvrirFiche(id, 'projets')}
        />
      )}
      {ecranActif === 'sdc' && <Sdc profils={donnees.profils} onRetour={() => setEcran('accueil')} />}
      </div>
      <div className="sr-only" role="status" aria-live="polite">{annonce}</div>
      <Badge />
      {etat && <TourBar etat={etat} onPause={basculerPause} onSuivant={suivant} onQuitter={quitterVisite} />}
    </div>
  )
}
