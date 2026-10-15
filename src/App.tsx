import { useEffect, useState } from 'react'
import type { Besoin as BesoinType, Proposition as PropositionType, Role } from './types'
import { chargerDonnees, type Donnees } from './lib/data'
import { proposer } from './engineAdapter'
import Badge from './components/Badge'
import Accueil from './screens/Accueil'
import Besoin from './screens/Besoin'
import Proposition from './screens/Proposition'

type Ecran = 'accueil' | 'besoin' | 'proposition'

const VIDE: Donnees = { profils: [], lieux: [], evenements: [] }

export default function App() {
  const [ecran, setEcran] = useState<Ecran>('accueil')
  const [role, setRole] = useState<Role>('commerce')
  const [donnees, setDonnees] = useState<Donnees>(VIDE)
  const [propositions, setPropositions] = useState<PropositionType[]>([])

  useEffect(() => {
    chargerDonnees().then(setDonnees)
  }, [])

  function trouver(besoin: BesoinType) {
    setPropositions(proposer(besoin, donnees.profils, donnees.lieux, donnees.evenements))
    setEcran('proposition')
  }

  return (
    <>
      {ecran === 'accueil' && (
        <Accueil
          onRole={(r) => { setRole(r); setEcran('besoin') }}
          onVisite={() => { /* Visite guidée: later job */ }}
        />
      )}
      {ecran === 'besoin' && <Besoin role={role} onRetour={() => setEcran('accueil')} onTrouver={trouver} />}
      {ecran === 'proposition' && (
        <Proposition
          propositions={propositions}
          profils={donnees.profils}
          lieux={donnees.lieux}
          evenements={donnees.evenements}
          onRetour={() => setEcran('besoin')}
        />
      )}
      <Badge />
    </>
  )
}
