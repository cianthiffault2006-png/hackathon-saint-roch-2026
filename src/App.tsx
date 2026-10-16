import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Besoin as BesoinType, Creneau, Evenement, Profil, Proposition as PropositionType, Role, Statut, Tag } from './types'
import { chargerDonnees, type Donnees } from './lib/data'
import { fusionnerAffichage } from './lib/presentation'
import { proposer } from './engineAdapter'
import { choixDepuisTexte, construireBesoin } from './lib/besoin'
import { choisirInvite, nomCourt } from './lib/invitation'
import { ASKER_PAR_ROLE, departDepuisBesoin, trouverAsker, type Depart } from './lib/besoin'
import FilVisite from './tour/FilVisite'
import Regie from './tour/Regie'
import { etatEcrans } from './tour/etat'
import { fr } from './i18n/fr'
import { chargerProjets, idEvenement, idProjet, projetDepuis, projetDepuisEvenement, sauverProjets, type Projet } from './lib/projets'
import Badge from './components/Badge'
import Accueil from './screens/Accueil'
import Besoin, { type Brouillon } from './screens/Besoin'
import FilProjet from './projet/FilProjet'
import NouveauProjet from './projet/NouveauProjet'
import Explorer from './explorer/Explorer'
import PlusOptions from './explorer/PlusOptions'
import ProfilPublic from './profil/ProfilPublic'
import RechercheReclamer from './profil/RechercheReclamer'
import AjouterFiche from './profil/AjouterFiche'
import { appliquerReclames } from './profil/reclamation'
import { useReclames } from './profil/useReclames'
import Fiche from './screens/Fiche'
import Invitation from './screens/Invitation'
import Projets from './screens/Projets'
import Proposition from './screens/Proposition'
import Sdc from './screens/Sdc'
import Sources from './screens/Sources'
import TourBar from './tour/TourBar'
import { useTour } from './tour/useTour'
import { ETAPES, PROFIL_VISITE, PUCES_VISITE, ROLE_VISITE, TEXTE_VISITE, legendeDe } from './tour/script'
import { besoinSofia } from './tour/histoires'
import Coquille from './layout/Coquille'
import { rubriqueDe, rubriqueHorsVisite } from './layout/rubriques'
import EspaceProjets from './layout/EspaceProjets'
import { useBureau } from './layout/useBureau'
import Dashboard from './screens/Dashboard'

type Ecran = 'accueil' | 'dashboard' | 'besoin' | 'proposition' | 'invitation' | 'fiche' | 'projets' | 'sdc' | 'sources' | 'explorer' | 'profil' | 'plus' | 'fil' | 'nouveau' | 'reclamer' | 'ajout'

const VIDE: Donnees = { profils: [], lieux: [], evenements: [] }

export default function App() {
  const [ecran, setEcran] = useState<Ecran>('accueil')
  const [retourFiche, setRetourFiche] = useState<Ecran>('projets')
  const [role, setRole] = useState<Role>('commerce')
  const [brutes, setDonnees] = useState<Donnees>(VIDE)
  // Local « Réclamer ce profil » claims (maillage.reclames) applied once here, so every screen sees the same « pré-rempli ».
  const reclames = useReclames()
  const donnees = useMemo(() => ({ ...brutes, profils: appliquerReclames(brutes.profils, reclames) }), [brutes, reclames])
  // Explorer and public profiles also show the provided rows in presentation mode; the engine never sees them.
  const affichage = useMemo(() => fusionnerAffichage(donnees, donnees.presentation), [donnees])
  const [propositions, setPropositions] = useState<PropositionType[]>([])
  const [indexProp, setIndexProp] = useState(0)
  const [statuts, setStatuts] = useState<Record<string, Statut>>({})
  const [invitationProp, setInvitationProp] = useState<PropositionType | null>(null)
  // Project id → partner's first name once « Pas cette fois » was pressed (simulated decline).
  const [declins, setDeclins] = useState<Record<string, string>>({})
  const [projets, setProjets] = useState<Projet[]>(chargerProjets)
  const [ouvertId, setOuvertId] = useState<string | null>(null)
  const [discussionId, setDiscussionId] = useState<string | null>(null)
  const [dernierBesoin, setDernierBesoin] = useState<BesoinType | null>(null)
  // « Créer le projet quand même »: the « Proposer un projet » form starts from the last need.
  const [depart, setDepart] = useState<Depart | null>(null)
  // What was typed for that need, so « ← » from the proposal brings it back; a new role from the accueil starts blank.
  const [brouillon, setBrouillon] = useState<(Brouillon & { role: Role; voulu?: string }) | null>(null)
  const [profilId, setProfilId] = useState<string | null>(null)
  const [voulu, setVoulu] = useState<string | null>(null)
  // Where Besoin's « ← » goes: the profile or claim search that pressed « Proposer une collaboration », else Accueil.
  const [retourBesoin, setRetourBesoin] = useState<Ecran>('accueil')
  const [annonce, setAnnonce] = useState('')
  const { etat, saut, lireMs, demarrer, quitter, basculerPause, suivant, precedent, allerA, allerAuTemps, continuer } = useTour()
  const bureau = useBureau()

  useEffect(() => {
    chargerDonnees().then(setDonnees)
  }, [])

  useEffect(() => {
    sauverProjets(projets)
  }, [projets])

  // The tour runs the café story through the same engine and the same screens, on the raw data: local claims never change it.
  const propositionsVisite = useMemo(() => {
    const besoin = construireBesoin(ROLE_VISITE, TEXTE_VISITE, brutes.profils, choixDepuisTexte(ROLE_VISITE, TEXTE_VISITE, brutes.profils))
    return proposer(besoin, brutes.profils, brutes.lieux, brutes.evenements)
  }, [brutes])

  // The suite's second story: Sofia's corvée, through the same engine, on the raw data like the café's.
  const propositionsSofia = useMemo(() => {
    const besoin = besoinSofia(brutes.profils)
    return besoin ? proposer(besoin, brutes.profils, brutes.lieux, brutes.evenements).slice(0, 1) : []
  }, [brutes])

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
      // The tour sets its statuses from its clock and never saves anything.
      if (enVisite) return
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

  function trouver(besoin: BesoinType, brouillon: Brouillon) {
    setDernierBesoin(besoin)
    setBrouillon({ role: besoin.auteurRole, voulu: besoin.voulu, ...brouillon })
    // From the explorer the user may act as another role (Besoin's « Vous proposez en tant que »): it becomes theirs.
    if (besoin.voulu && !enVisite) setRole(besoin.auteurRole)
    const trouvees = proposer(besoin, donnees.profils, donnees.lieux, donnees.evenements)
    setPropositions(trouvees)
    setAnnonce(fr.proposition.nombreTrouvees(trouvees.length))
    setIndexProp(0)
    setEcran('proposition')
  }

  // « Choisir » in Plus d'options: the chosen proposal joins the list in front, so the first three stay one swipe away.
  function choisirOption(p: PropositionType) {
    const i = propositions.findIndex((x) => x.id === p.id)
    if (i >= 0) setIndexProp(i)
    else {
      setPropositions([p, ...propositions])
      setIndexProp(0)
    }
    setEcran('proposition')
  }

  function ouvrirFiche(id: string, depuis: Ecran) {
    setDiscussionId(null)
    setOuvertId(id)
    setRetourFiche(depuis)
    setEcran('fiche')
  }
  function ouvrirDiscussion(id: string) {
    setOuvertId(id)
    setRetourFiche('projets')
    setDiscussionId(id)

    if (bureau) {
      setEcran('fiche')
    } else {
      setEcran('fil')
    }
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

  // The tour's thread has an id of its own; its Discussion tab is played by FilVisite and never saved.
  const propositionFil = useMemo(
    // Confirmed: in the story every partner has accepted, so all of them show as accepted.
    () => (propositionsVisite[0] ? { ...propositionsVisite[0], id: `visite-${propositionsVisite[0].id}`, statut: 'confirmee' as const } : null),
    [propositionsVisite],
  )

  function lancerVisite() {
    setRole(ROLE_VISITE)
    demarrer()
  }

  function quitterVisite() {
    quitter()
    setEcran('accueil')
    window.setTimeout(() => document.querySelector<HTMLElement>('[data-visite]')?.focus(), 50)
  }

  // Browser Back (phone back gesture) stays in the app: one guard entry, re-pushed on every popstate,
  // then Back quits the tour or goes one step back like the screen's own « ← ».
  const surRetour = useRef<() => void>(() => {})
  surRetour.current = () => {
    if (enVisite) { quitterVisite(); return }
    if (ecran === 'accueil') return
    if (ecran === 'besoin') { setVoulu(null); setEcran(retourBesoin) }
    else if (ecran === 'proposition') setEcran('besoin')
    else if (ecran === 'fiche') setEcran(retourFiche)
    else if (ecran === 'profil') setEcran('explorer')
    else if (ecran === 'plus' || ecran === 'invitation') setEcran('proposition')
    else if (ecran === 'fil') { setDiscussionId(null); setEcran('fiche') }
    else setEcran('accueil')
  }
  useEffect(() => {
    history.pushState({ maillage: 1 }, '')
    const retour = () => {
      history.pushState({ maillage: 1 }, '')
      surRetour.current()
    }
    window.addEventListener('popstate', retour)
    return () => window.removeEventListener('popstate', retour)
  }, [])

  function accepterInvitation(prop: PropositionType) {
    if (enVisite) return
    changerStatut(prop, 'confirmee')
    // Leave a moment to read the partner's confirmation, then go back.
    window.setTimeout(() => setEcran('proposition'), 2400)
  }

  // « Pas cette fois »: the trio leaves Mes projets; its card keeps a note and no « Ça m'intéresse ».
  function declinerInvitation(prop: PropositionType, partenaire: Profil) {
    if (enVisite) return
    const cle = idProjet(prop)
    setStatuts((s) => ({ ...s, [cle]: 'proposee' }))
    setProjets((prev) => prev.filter((p) => p.id !== cle))
    setAnnonce(fr.proposition.decline(nomCourt(partenaire)))
    setDeclins((d) => ({ ...d, [idProjet(prop)]: nomCourt(partenaire) }))
    setEcran('proposition')
  }

  // What the tour asks of each screen: a pure function of the step and the time elapsed in it
  // (src/tour/etat.ts), so Pause holds everything and a jump rebuilds it from the index alone.
  const ee = etat ? etatEcrans(etat.index, etat.ms) : null
  const propVisite = propositionsVisite[0] ?? null
  const statutsVisite: Record<string, Statut> = ee && propVisite ? { [idProjet(propVisite)]: ee.statut } : {}
  const pucesVisite = ee ? PUCES_VISITE.slice(0, ee.puces) : []
  const guideBesoin = ee
    ? {
        texte: TEXTE_VISITE.slice(0, Math.ceil(TEXTE_VISITE.length * ee.texte)),
        offre: pucesVisite.filter((p) => p.groupe === 'offre').map((p) => p.valeur as Tag),
        cherche: pucesVisite.filter((p) => p.groupe === 'cherche').map((p) => p.valeur as Tag),
        creneaux: pucesVisite.filter((p) => p.groupe === 'creneaux').map((p) => p.valeur as Creneau),
        pulse: ee.pulse,
      }
    : undefined
  const cochesVisite = ee?.coches ?? 0

  const projetAffiche: Projet | null = enVisite
    ? projetVisite && { ...projetVisite, coches: projetVisite.coches.map((_, i) => i < cochesVisite) }
    : (projets.find((p) => p.id === ouvertId) ?? null)
  const projetsAffiches = enVisite ? (projetAffiche ? [projetAffiche] : []) : projets

  // The tour shows its profile and the explorer as in the raw data: the viewer's own claims never change it.
  const profilPublic = (enVisite ? brutes.profils.find((p) => p.id === PROFIL_VISITE) : affichage.profils.find((p) => p.id === profilId)) ?? null
  const suiteVisite = etape?.parcours === 'suite'
  const filProposition = enVisite ? propositionFil : (projetAffiche?.proposition ? { ...projetAffiche.proposition, statut: projetAffiche.statut } : null)
  const filMoi = filProposition ? (donnees.profils.find((p) => p.id === filProposition.partenaires[0]?.profilId) ?? null) : null

  function creerProjet(p: PropositionType) {
    const projet = projetDepuis(p, donnees.profils, donnees.lieux, 'proposee')
    setProjets((prev) => (prev.some((x) => x.id === projet.id) ? prev : [...prev, projet]))
    ouvrirFiche(projet.id, 'accueil')
  }

  // Desktop (900 px and up), outside the tour: Mes projets and the Fiche share one space with the project thread.
  const espaceBureau = bureau && !enVisite && (ecranActif === 'projets' || (ecranActif === 'fiche' && projetAffiche !== null))
  const filBureau = espaceBureau && ecranActif === 'fiche' && filProposition && filMoi ? { proposition: filProposition, moi: filMoi } : null

  const propInvitation = enVisite ? propVisite : invitationProp
  const invite = propInvitation ? choisirInvite(propInvitation, donnees.profils) : null
  const legende = etape
    ? legendeDe(etape, { score: propVisite?.score ?? 0, prenom: invite ? nomCourt(invite.partenaire) : '', scoreSofia: propositionsSofia[0]?.score ?? 0 })
    : ''

  return (
    <Coquille rubrique={enVisite ? rubriqueDe(ecranActif) : rubriqueHorsVisite(ecranActif, retourFiche)} nbProjets={enVisite ? 1 : projets.length} inerte={enVisite} onAller={setEcran}>
    <div className={enVisite ? (etat.pause ? 'racine tour-actif tour-pause' : 'racine tour-actif') : 'racine'}>
      <div className="ecrans" inert={enVisite}>
      {ecranActif === 'accueil' && (
        <Accueil
          surbrillance={enVisite ? ROLE_VISITE : undefined}
          onRole={(r) => { setRole(r); setVoulu(null); setBrouillon(null); setRetourBesoin('accueil'); setEcran('besoin') }}
          onVisite={lancerVisite}
          onProjets={!enVisite && projets.length > 0 ? () => setEcran('projets') : undefined}
          onSdc={enVisite ? undefined : () => setEcran('sdc')}
          onSources={enVisite ? undefined : () => setEcran('sources')}
          onExplorer={enVisite ? undefined : () => setEcran('explorer')}
          onProposer={enVisite ? undefined : () => { setDepart(null); setEcran('nouveau') }}
          onDashboard={enVisite ? undefined : () => setEcran('dashboard')}
          onReclamer={enVisite ? undefined : () => setEcran('reclamer')}
        />
      )}
      {ecranActif === 'reclamer' && (
        <RechercheReclamer
          profils={donnees.profils}
          evenements={donnees.evenements}
          onRetour={() => setEcran('accueil')}
          onProposer={(id) => { setVoulu(id); setRetourBesoin('reclamer'); setEcran('besoin') }}
        />
      )}
      {/* From the menu: the add-request form directly; done or cancelled, it lands on the claim search, which lists pending requests. */}
      {ecranActif === 'ajout' && (
        <AjouterFiche profils={donnees.profils} evenements={donnees.evenements} onFermer={() => setEcran('reclamer')} />
      )}
      {ecranActif === 'besoin' && (
        <Besoin
          role={enVisite ? ROLE_VISITE : role}
          profils={donnees.profils}
          partenaireVoulu={voulu ? donnees.profils.find((p) => p.id === voulu) : undefined}
          // A draft comes back only for the same role and the same wanted partner: a new partner starts a clean form (only their offers ticked).
          initial={!enVisite && brouillon && brouillon.role === role && brouillon.voulu === (voulu ?? undefined) ? brouillon : undefined}
          guide={guideBesoin}
          onRetour={() => { setVoulu(null); setEcran(retourBesoin) }}
          onTrouver={trouver}
        />
      )}
      {/* During the tour the proposal stays mounted under the invitation, so coming back replays nothing. */}
      {(ecranActif === 'proposition' || (enVisite && ecranActif === 'invitation')) && (
        <Proposition
          key={enVisite ? `visite-${saut}` : 'app'}
          propositions={enVisite ? (suiteVisite ? propositionsSofia : propositionsVisite) : propositions}
          profils={donnees.profils}
          lieux={donnees.lieux}
          evenements={donnees.evenements}
          visite={ee ? { animer: ee.chute, anneau: ee.anneau, detail: ee.detail, raisons: ee.raisons } : undefined}
          statuts={enVisite ? (suiteVisite ? {} : statutsVisite) : statuts}
          onChangerStatut={changerStatut}
          index={enVisite ? 0 : indexProp}
          onIndex={setIndexProp}
          onFiche={(prop) => ouvrirFiche(idProjet(prop), 'proposition')}
          onInvitation={(prop) => { setInvitationProp(prop); setEcran('invitation') }}
          declins={enVisite ? undefined : declins}
          projets={enVisite ? undefined : projets}
          onParticiper={enVisite ? undefined : participer}
          onPlusOptions={enVisite || !dernierBesoin ? undefined : () => setEcran('plus')}
          onExplorer={enVisite ? undefined : () => setEcran('explorer')}
          onCreer={enVisite || !dernierBesoin ? undefined : () => { setDepart(departDepuisBesoin(dernierBesoin, donnees.profils)); setEcran('nouveau') }}
          onRetour={() => setEcran('besoin')}
        />
      )}
      {ecranActif === 'invitation' && propInvitation && invite && (
        <Invitation
          proposition={propInvitation}
          partenaire={invite.partenaire}
          demandeur={invite.demandeur}
          autre={invite.autre}
          accepteVisite={ee ? ee.accepte : undefined}
          onAccepter={() => accepterInvitation(propInvitation)}
          onDecliner={() => declinerInvitation(propInvitation, invite.partenaire)}
          onRetour={() => setEcran('proposition')}
        />
      )}
      {ecranActif === 'fiche' && projetAffiche && !espaceBureau && (
        <Fiche
          projet={projetAffiche}
          pulse={ee?.pulse}
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
          onDiscuter={enVisite ? undefined : ouvrirDiscussion}
        />
      )}
      {ecranActif === 'dashboard' && (
        <Dashboard
          projets={projetsAffiches}
          onVoirProjets={() => setEcran('projets')}
          onOuvrirProjet={(id) => ouvrirFiche(id, 'dashboard')}
          onNouveauProjet={() => setEcran('accueil')}
          onRetour={bureau ? undefined : () => setEcran('accueil')}
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
              onDiscuter={ouvrirDiscussion}
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
            
<FilProjet
  key={`${idProjet(filBureau.proposition)}-${discussionId === projetAffiche?.id ? 'discussion' : 'normal'}`}
  proposition={filBureau.proposition}
  profils={donnees.profils}
  moi={filBureau.moi}
  ongletInitial={
    discussionId === projetAffiche?.id
      ? 'discussion'
      : 'participants'
  }
  onRetour={() => setEcran('projets')}
/>

          ) : null}
        />
      )}
      {/* Outside the tour the explorer stays mounted, hidden, under a public profile: « ← Retour » finds it as left. */}
      {(ecranActif === 'explorer' || (ecranActif === 'profil' && !enVisite)) && (
        <Explorer
          masque={ecranActif === 'profil'}
          profils={enVisite ? brutes.profils : affichage.profils}
          lieux={enVisite ? donnees.lieux : affichage.lieux}
          evenements={enVisite ? donnees.evenements : affichage.evenements}
          onRetour={() => setEcran('accueil')}
          onOuvrirProfil={(id) => { setProfilId(id); setEcran('profil') }}
          visite={ee ? {
            actifs: { commerce: true, organisme: true, citoyen: ee.explorer.citoyens, lieu: true, evenement: true },
            requete: fr.visite.rechercheVisite.slice(0, Math.ceil(fr.visite.rechercheVisite.length * ee.explorer.frappe)),
            liste: ee.explorer.liste,
          } : undefined}
        />
      )}
      {ecranActif === 'profil' && profilPublic && (
        <ProfilPublic
          profil={profilPublic}
          profils={affichage.profils}
          evenements={affichage.evenements}
          moi={profilPublic.id === ASKER_PAR_ROLE[role]}
          onRetour={() => setEcran('explorer')}
          onProposer={(id) => { setVoulu(id); setRetourBesoin('profil'); setEcran('besoin') }}
          onOuvrirProfil={enVisite ? undefined : (id) => { setProfilId(id); window.scrollTo(0, 0) }}
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
            onChoisir={choisirOption}
          />
        </div>
      )}
      {ecranActif === 'fil' && filProposition && filMoi && (
        <div className="plein-ecran">
          <FilProjet
            key={`${idProjet(filProposition)}-${discussionId === ouvertId ? 'discussion' : 'normal'}`}
            ongletInitial={
              discussionId === ouvertId ? 'discussion' : 'participants'
            }
            proposition={filProposition}
            profils={donnees.profils}
            moi={filMoi}
            onRetour={() => { setDiscussionId(null); setEcran('fiche') }}
            visite={ee && invite ? {
              onglet: ee.onglet,
              discussion: <FilVisite fil={ee.fil} moi={invite.demandeur.nom} partenaire={invite.partenaire.nom} autre={invite.autre?.nom ?? ''} />,
            } : undefined}
          />
        </div>
      )}
      {ecranActif === 'nouveau' && (
        <div className="plein-ecran">
          <NouveauProjet
            key={ee ? `visite-${ee.exemple}` : depart ? `depart-${depart.description}` : 'app'}
            exemple={ee?.exemple}
            profils={donnees.profils}
            lieux={donnees.lieux}
            evenements={donnees.evenements}
            moi={depart && !ee ? donnees.profils.find((p) => p.id === depart.auteurId) : trouverAsker(role, donnees.profils)}
            depart={ee ? undefined : depart ?? undefined}
            onRetour={() => setEcran(depart && !ee ? 'proposition' : 'accueil')}
            onCree={enVisite ? () => undefined : creerProjet}
          />
        </div>
      )}
      {ecranActif === 'sources' && <Sources lieux={donnees.lieux} profils={donnees.profils} onRetour={() => setEcran('accueil')} />}
      {ecranActif === 'sdc' && <Sdc profils={enVisite ? brutes.profils : donnees.profils} onRetour={() => setEcran('accueil')} />}
      </div>
      {donnees.presentation && <div className="bandeau-presentation" role="note">Données fournies par la Ville et l’UQ, sous entente de confidentialité : affichage local pour la présentation seulement</div>}
      <div className="sr-only" role="status" aria-live="polite">{annonce}</div>
      <Badge place={ecranActif === 'explorer' ? 'bas-droite' : ['profil', 'fil', 'nouveau', 'plus', 'sdc', 'invitation', 'reclamer', 'ajout'].includes(ecranActif) ? 'haut-droite' : 'defaut'} />
      {etat && <Regie index={etat.index} lireMs={lireMs} />}
      {etat && (
        <TourBar
          etat={etat}
          legende={legende}
          onPause={basculerPause}
          onSuivant={suivant}
          onPrecedent={precedent}
          onAller={allerA}
          onAllerAuTemps={allerAuTemps}
          onContinuer={propositionsSofia.length > 0 ? continuer : undefined}
          onQuitter={quitterVisite}
        />
      )}
    </div>
    </Coquille>
  )
}
