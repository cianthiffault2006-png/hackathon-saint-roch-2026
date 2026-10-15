import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Besoin as BesoinType, Proposition as PropositionType, Role, Statut } from './types'
import { chargerDonnees, type Donnees } from './lib/data'
import { proposer } from './engineAdapter'
import { choixDepuisTexte, construireBesoin } from './lib/besoin'
import { chargerProjets, idProjet, projetDepuis, sauverProjets, type Projet } from './lib/projets'
import Badge from './components/Badge'
import Accueil from './screens/Accueil'
import Besoin from './screens/Besoin'
import Fiche from './screens/Fiche'
import Projets from './screens/Projets'
import Proposition from './screens/Proposition'
import TourBar from './tour/TourBar'
import { useTour } from './tour/useTour'
import { ETAPES, ROLE_VISITE, SAISIE_MS, TEXTE_VISITE, indexDe } from './tour/script'

type Ecran = 'accueil' | 'besoin' | 'proposition' | 'fiche' | 'projets'

const VIDE: Donnees = { profils: [], lieux: [], evenements: [] }
const DELAI_PIN_VISITE_MS = 700

export default function App() {
  const [ecran, setEcran] = useState<Ecran>('accueil')
  const [retourFiche, setRetourFiche] = useState<Ecran>('projets')
  const [role, setRole] = useState<Role>('commerce')
  const [donnees, setDonnees] = useState<Donnees>(VIDE)
  const [propositions, setPropositions] = useState<PropositionType[]>([])
  const [projets, setProjets] = useState<Projet[]>(chargerProjets)
  const [ouvertId, setOuvertId] = useState<string | null>(null)
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

  const enregistrerStatut = useCallback(
    (prop: PropositionType, statut: Statut) => {
      if (enVisite) return
      setProjets((prev) => {
        const id = idProjet(prop)
        const existant = prev.find((p) => p.id === id)
        if (!existant) return [...prev, projetDepuis(prop, donnees.profils, donnees.lieux, statut)]
        if (existant.statut === statut) return prev
        return prev.map((p) => (p.id === id ? { ...p, statut } : p))
      })
    },
    [enVisite, donnees],
  )

  function trouver(besoin: BesoinType) {
    setPropositions(proposer(besoin, donnees.profils, donnees.lieux, donnees.evenements))
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

  function quitterVisite() {
    quitter()
    setEcran('accueil')
  }

  // What the tour asks of each screen, derived from the step and the time elapsed in it.
  let texteGuide: string | undefined
  let pulse = false
  let raisonsVisibles: number | undefined
  let interet = false
  let cochesVisite = 0
  let defilement: 'actions' | 'liste' | undefined
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

  return (
    <div className={enVisite ? 'racine tour-actif' : 'racine'}>
      {ecranActif === 'accueil' && (
        <Accueil
          surbrillance={enVisite ? ROLE_VISITE : undefined}
          onRole={(r) => { setRole(r); setEcran('besoin') }}
          onVisite={() => { setRole(ROLE_VISITE); demarrer() }}
          onProjets={!enVisite && projets.length > 0 ? () => setEcran('projets') : undefined}
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
          onStatut={enregistrerStatut}
          onFiche={(prop) => ouvrirFiche(idProjet(prop), 'proposition')}
          onRetour={() => setEcran('besoin')}
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
      <Badge />
      {etat && <TourBar etat={etat} onPause={basculerPause} onSuivant={suivant} onQuitter={quitterVisite} />}
    </div>
  )
}
