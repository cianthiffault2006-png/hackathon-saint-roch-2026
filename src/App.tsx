import { useEffect, useMemo, useState } from 'react'
import type { Besoin as BesoinType, Proposition as PropositionType, Role } from './types'
import { chargerDonnees, type Donnees } from './lib/data'
import { lireBesoin, proposer } from './engineAdapter'
import Badge from './components/Badge'
import Accueil from './screens/Accueil'
import Besoin from './screens/Besoin'
import Proposition from './screens/Proposition'
import TourBar from './tour/TourBar'
import { useTour } from './tour/useTour'
import { ETAPES, ROLE_VISITE, SAISIE_MS, TEXTE_VISITE, indexDe } from './tour/script'

type Ecran = 'accueil' | 'besoin' | 'proposition'

const VIDE: Donnees = { profils: [], lieux: [], evenements: [] }
const DELAI_PIN_VISITE_MS = 700

export default function App() {
  const [ecran, setEcran] = useState<Ecran>('accueil')
  const [role, setRole] = useState<Role>('commerce')
  const [donnees, setDonnees] = useState<Donnees>(VIDE)
  const [propositions, setPropositions] = useState<PropositionType[]>([])
  const { etat, demarrer, quitter, basculerPause, suivant } = useTour()

  useEffect(() => {
    chargerDonnees().then(setDonnees)
  }, [])

  // The tour runs the café story through the same engine and the same screens.
  const propositionsVisite = useMemo(() => {
    const besoin: BesoinType = {
      auteurRole: ROLE_VISITE,
      auteurId: 'story-cafe',
      texte: TEXTE_VISITE,
      ...lireBesoin(TEXTE_VISITE),
    }
    return proposer(besoin, donnees.profils, donnees.lieux, donnees.evenements)
  }, [donnees])

  function trouver(besoin: BesoinType) {
    setPropositions(proposer(besoin, donnees.profils, donnees.lieux, donnees.evenements))
    setEcran('proposition')
  }

  function quitterVisite() {
    quitter()
    setEcran('accueil')
  }

  const etape = etat ? ETAPES[etat.index] : null
  const ecranActif: Ecran = etape ? etape.ecran : ecran
  const enVisite = etat !== null && etape !== null

  // What the tour asks of each screen, derived from the step and the time elapsed in it.
  let texteGuide: string | undefined
  let pulse = false
  let raisonsVisibles: number | undefined
  let interet = false
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
  }

  return (
    <div className={enVisite ? 'racine tour-actif' : 'racine'}>
      {ecranActif === 'accueil' && (
        <Accueil
          surbrillance={enVisite ? ROLE_VISITE : undefined}
          onRole={(r) => { setRole(r); setEcran('besoin') }}
          onVisite={() => { setRole(ROLE_VISITE); demarrer() }}
        />
      )}
      {ecranActif === 'besoin' && (
        <Besoin
          role={enVisite ? ROLE_VISITE : role}
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
          onRetour={() => setEcran('besoin')}
        />
      )}
      <Badge />
      {etat && <TourBar etat={etat} onPause={basculerPause} onSuivant={suivant} onQuitter={quitterVisite} />}
    </div>
  )
}
