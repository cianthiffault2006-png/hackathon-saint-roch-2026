import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Besoin as BesoinType, Evenement, Proposition as PropositionType, Role, Statut } from './types'
import { chargerDonnees, type Donnees } from './lib/data'
import { proposer } from './engineAdapter'
import { choixDepuisTexte, construireBesoin } from './lib/besoin'
import { choisirInvite } from './lib/invitation'
import { trouverAsker } from './lib/besoin'
import FilAuto from './tour/FilAuto'
import { fr } from './i18n/fr'
import { chargerProjets, idEvenement, idProjet, projetDepuis, projetDepuisEvenement, sauverProjets, type Projet } from './lib/projets'
import Badge from './components/Badge'
import Accueil from './screens/Accueil'
import Besoin from './screens/Besoin'
import FilProjet from './projet/FilProjet'
import NouveauProjet from './projet/NouveauProjet'
import Explorer from './explorer/Explorer'
import PlusOptions from './explorer/PlusOptions'
import ProfilPublic from './profil/ProfilPublic'
import Fiche from './screens/Fiche'
import Invitation from './screens/Invitation'
import Projets from './screens/Projets'
import Proposition from './screens/Proposition'
import Sdc from './screens/Sdc'
import Sources from './screens/Sources'
import TourBar from './tour/TourBar'
import { useTour } from './tour/useTour'
import { ETAPES, ROLE_VISITE, SAISIE_MS, TEXTE_VISITE, indexDe } from './tour/script'
import Coquille from './layout/Coquille'
import { rubriqueDe } from './layout/rubriques'
import EspaceProjets from './layout/EspaceProjets'
import { useBureau } from './layout/useBureau'
import Dashboard from './screens/Dashboard'

type Ecran = 'accueil' | 'dashboard' | 'besoin' | 'proposition' | 'invitation' | 'fiche' | 'projets' | 'sdc' | 'sources' | 'explorer' | 'profil' | 'plus' | 'fil' | 'nouveau'

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
  const [dernierBesoin, setDernierBesoin] = useState<BesoinType | null>(null)
  const [profilId, setProfilId] = useState<string | null>(null)
  const [voulu, setVoulu] = useState<string | null>(null)
  const [annonce, setAnnonce] = useState('')
  const { etat, demarrer, quitter, basculerPause, suivant } = useTour()
  const bureau = useBureau()

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
    if (!enVisite) setAnnonce(
        ecranActif === 'sources' ? fr.sources.titre
          : ecranActif === 'explorer' ? fr.accueil.explorer
          : ecranActif === 'fil' ? fr.fiche.ouvrirFil
          : ecranActif === 'nouveau' ? fr.accueil.proposer
          : ecranActif === 'profil' ? 'Profil'
          : ecranActif === 'plus' ? fr.options.plus
          : fr.a11y.ecrans[ecranActif],
      )
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
    setDernierBesoin(besoin)
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

  // « Je participe »: a public event joins the list at once, with no acceptance flow.
  function participer(e: Evenement) {
    const cle = idEvenement(e)
    setProjets((prev) => (prev.some((p) => p.id === cle) ? prev : [...prev, projetDepuisEvenement(e, donnees.profils)]))
    setAnnonce(fr.evenement.inscrit)
    ouvrirFiche(cle, 'proposition')
  }

  function retirer(id: string) {
    setProjets((prev) => prev.filter((p) => p.id !== id))
    setStatuts((s) => {
      const suite = { ...s }
      delete suite[id]
      return suite
    })
    // After the screen change, which announces the new screen first.
    window.setTimeout(() => setAnnonce(fr.retirer.fait), 200)
    if (id === ouvertId) setEcran('projets')
  }

  function cocher(index: number) {
    if (enVisite) return
    setProjets((prev) =>
      prev.map((p) => (p.id === ouvertId ? { ...p, coches: p.coches.map((c, i) => (i === index ? !c : c)) } : p)),
    )
  }

  // The tour posts a message in a thread of its own (distinct id), cleared at each start so Camille replies again.
  const propositionFil = useMemo(
    () => (propositionsVisite[0] ? { ...propositionsVisite[0], id: `visite-${propositionsVisite[0].id}` } : null),
    [propositionsVisite],
  )

  function lancerVisite() {
    setRole(ROLE_VISITE)
    setStatutsVisite({})
    if (propositionFil) {
      try {
        window.localStorage.removeItem(`maillage.pj.msg.${idProjet(propositionFil)}`)
      } catch {
        // Storage blocked: nothing was kept either.
      }
    }
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
  let filAuto = -1
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
    if (etape.id === 'fil') filAuto = etat.ms
    if (etape.id === 'coches') cochesVisite = Math.floor(etat.ms / 800)
    if (etat.index > indexDe('coches')) cochesVisite = 3
  }

  const projetAffiche: Projet | null = enVisite
    ? projetVisite && { ...projetVisite, coches: projetVisite.coches.map((_, i) => i < cochesVisite) }
    : (projets.find((p) => p.id === ouvertId) ?? null)
  const projetsAffiches = enVisite ? (projetAffiche ? [projetAffiche] : []) : projets

  const profilPublic = donnees.profils.find((p) => p.id === profilId) ?? null
  const filProposition = enVisite ? propositionFil : (projetAffiche?.proposition ?? null)
  const filMoi = filProposition ? (donnees.profils.find((p) => p.id === filProposition.partenaires[0]?.profilId) ?? null) : null

  function creerProjet(p: PropositionType) {
    const projet = projetDepuis(p, donnees.profils, donnees.lieux, 'proposee')
    setProjets((prev) => (prev.some((x) => x.id === projet.id) ? prev : [...prev, projet]))
    ouvrirFiche(projet.id, 'accueil')
  }

  // Desktop (900 px and up), outside the tour: Mes projets and the Fiche share one space with the project thread.
  const espaceBureau = bureau && !enVisite && (ecranActif === 'projets' || (ecranActif === 'fiche' && projetAffiche !== null))
  // The thread shows the project's current status (a confirmed project lists every partner as accepted).
  const filBureau = espaceBureau && ecranActif === 'fiche' && projetAffiche && filProposition && filMoi
    ? { proposition: { ...filProposition, statut: projetAffiche.statut }, moi: filMoi }
    : null

  const propInvitation = enVisite ? (propositionsVisite[0] ?? null) : invitationProp
  const invite = propInvitation ? choisirInvite(propInvitation, donnees.profils) : null

  return (
    <Coquille rubrique={rubriqueDe(ecranActif)} nbProjets={projets.length} inerte={enVisite} onAller={setEcran}>
    <div className={enVisite ? 'racine tour-actif' : 'racine'}>
      <div className="ecrans" inert={enVisite}>
      {ecranActif === 'accueil' && (
        <Accueil
          surbrillance={enVisite ? ROLE_VISITE : undefined}
          onRole={(r) => { setRole(r); setEcran('besoin') }}
          onVisite={lancerVisite}
          onProjets={!enVisite && projets.length > 0 ? () => setEcran('projets') : undefined}
          onSdc={enVisite ? undefined : () => setEcran('sdc')}
          onSources={enVisite ? undefined : () => setEcran('sources')}
          onExplorer={enVisite ? undefined : () => setEcran('explorer')}
          onProposer={enVisite ? undefined : () => setEcran('nouveau')}
        />
      )}
      {ecranActif === 'besoin' && (
        <Besoin
          role={enVisite ? ROLE_VISITE : role}
          profils={donnees.profils}
          partenaireVoulu={voulu ? donnees.profils.find((p) => p.id === voulu) : undefined}
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
          projets={enVisite ? undefined : projets}
          onParticiper={enVisite ? undefined : participer}
          onPlusOptions={enVisite || !dernierBesoin ? undefined : () => setEcran('plus')}
          onRetour={() => setEcran('besoin')}
        />
      )}
      {ecranActif === 'invitation' && propInvitation && invite && (
        <Invitation
          proposition={propInvitation}
          partenaire={invite.partenaire}
          demandeur={invite.demandeur}
          autre={invite.autre}
          accepterAuto={accepterAuto}
          defilerAuto={defilerInvitation}
          onAccepter={() => accepterInvitation(propInvitation)}
          onRetour={() => setEcran('proposition')}
        />
      )}
      {ecranActif === 'fiche' && projetAffiche && !espaceBureau && (
        <Fiche
          projet={projetAffiche}
          pulse={pulse}
          defilement={defilement}
          onCocher={cocher}
          onRetirer={enVisite ? undefined : () => retirer(projetAffiche.id)}
          onFil={enVisite || !projetAffiche.proposition ? undefined : () => setEcran('fil')}
          onRetour={() => setEcran(retourFiche)}
          onProjets={() => setEcran('projets')}
        />
      )}
      {ecranActif === 'projets' && !espaceBureau && (
        <Projets
          projets={projetsAffiches}
          onRetour={() => setEcran('accueil')}
          onOuvrir={(id) => ouvrirFiche(id, 'projets')}
          onRetirer={enVisite ? undefined : retirer}
        />
      )}
      {ecranActif === 'dashboard' && (
        <Dashboard
          projets={projetsAffiches}
          onVoirProjets={() => setEcran('projets')}
          onOuvrirProjet={(id) => ouvrirFiche(id, 'dashboard')}
          onNouveauProjet={() => setEcran('accueil')}
        />
      )}
      {espaceBureau && (
        <EspaceProjets
          vide={projets.length === 0}
          liste={ecranActif === 'projets' || retourFiche === 'projets' ? (
            <Projets
              projets={projets}
              actifId={ecranActif === 'fiche' ? ouvertId : null}
              incrustee={ecranActif === 'fiche'}
              onRetour={() => setEcran('accueil')}
              onOuvrir={(id) => ouvrirFiche(id, 'projets')}
              onRetirer={retirer}
            />
          ) : null}
          fiche={ecranActif === 'fiche' && projetAffiche ? (
            <Fiche
              key={projetAffiche.id}
              projet={projetAffiche}
              incrustee={filBureau !== null}
              onCocher={cocher}
              onRetirer={() => retirer(projetAffiche.id)}
              onRetour={() => setEcran(retourFiche)}
              onProjets={() => setEcran('projets')}
            />
          ) : null}
          fil={filBureau ? (
            <FilProjet key={idProjet(filBureau.proposition)} proposition={filBureau.proposition} profils={donnees.profils} moi={filBureau.moi} onRetour={() => setEcran('projets')} />
          ) : null}
        />
      )}
      {ecranActif === 'explorer' && (
        <Explorer
          profils={donnees.profils}
          lieux={donnees.lieux}
          evenements={donnees.evenements}
          onRetour={() => setEcran('accueil')}
          onOuvrirProfil={(id) => { setProfilId(id); setEcran('profil') }}
        />
      )}
      {ecranActif === 'profil' && profilPublic && (
        <ProfilPublic
          profil={profilPublic}
          profils={donnees.profils}
          evenements={donnees.evenements}
          onRetour={() => setEcran('explorer')}
          onProposer={(id) => { setVoulu(id); setEcran('besoin') }}
        />
      )}
      {ecranActif === 'plus' && dernierBesoin && (
        <div className="plein-ecran">
          <button type="button" className="retour retour-plein" onClick={() => setEcran('proposition')} aria-label={fr.general.retour}>←</button>
          <PlusOptions
            besoin={dernierBesoin}
            profils={donnees.profils}
            lieux={donnees.lieux}
            evenements={donnees.evenements}
            onChoisir={(p) => { setPropositions([p]); setIndexProp(0); setEcran('proposition') }}
          />
        </div>
      )}
      {ecranActif === 'fil' && filProposition && filMoi && (
        <div className="plein-ecran">
          <FilProjet proposition={filProposition} profils={donnees.profils} moi={filMoi} onRetour={() => setEcran(enVisite ? 'fiche' : 'fiche')} />
          {enVisite && <FilAuto ms={filAuto} />}
        </div>
      )}
      {ecranActif === 'nouveau' && (
        <div className="plein-ecran">
          <NouveauProjet
            profils={donnees.profils}
            lieux={donnees.lieux}
            evenements={donnees.evenements}
            moi={trouverAsker(role, donnees.profils)}
            onRetour={() => setEcran('accueil')}
            onCree={creerProjet}
          />
        </div>
      )}
      {ecranActif === 'sources' && <Sources lieux={donnees.lieux} onRetour={() => setEcran('accueil')} />}
      {ecranActif === 'sdc' && <Sdc profils={donnees.profils} onRetour={() => setEcran('accueil')} />}
      </div>
      <div className="sr-only" role="status" aria-live="polite">{annonce}</div>
      <Badge place={ecranActif === 'explorer' ? 'bas-droite' : ['profil', 'fil', 'nouveau', 'plus', 'sdc', 'invitation'].includes(ecranActif) ? 'haut-droite' : 'defaut'} />
      {etat && <TourBar etat={etat} onPause={basculerPause} onSuivant={suivant} onQuitter={quitterVisite} />}
    </div>
    </Coquille>
  )
}
