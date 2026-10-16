import { useEffect, useMemo, useRef, useState } from 'react'
import type { Evenement, Profil } from '../types'
import { fr } from '../i18n/fr'
import { t } from '../explorer/textes'
import ProfilPublic from './ProfilPublic'
import AjouterFiche from './AjouterFiche'
import { profilApercu } from './ajout'
import { rechercherAReclamer } from './reclamation'
import { useReclames } from './useReclames'
import { annulerAjout, useAjouts } from './useAjouts'
import './Reclamer.css'

const r = fr.reclamer.recherche
const DELAI_ANNONCE_MS = 500

interface Props {
  /** Profiles with local claims already applied. */
  profils: Profil[]
  evenements: Evenement[]
  onRetour(): void
  onProposer(profilId: string): void
}

/** From the accueil: find your pre-filled business or organisation by name, then open its profile to claim it. */
export default function RechercheReclamer({ profils, evenements, onRetour, onProposer }: Props) {
  const reclames = useReclames()
  const ajouts = useAjouts()
  const [requete, setRequete] = useState('')
  const [choisiId, setChoisiId] = useState<string | null>(null)
  // Not in any directory: the add request form, then the preview of a pending request (never public).
  const [ajout, setAjout] = useState(false)
  const [apercuId, setApercuId] = useState<string | null>(null)
  const titre = useRef<HTMLHeadingElement>(null)
  const resultats = useMemo(() => rechercherAReclamer(profils, requete, reclames), [profils, requete, reclames])
  const choisi = choisiId ? (profils.find((p) => p.id === choisiId) ?? null) : null
  const nb = r.nb(resultats.length)
  // Screen readers hear the count once typing pauses, not on every key.
  const [annonce, setAnnonce] = useState(nb)
  useEffect(() => {
    const minuterie = window.setTimeout(() => setAnnonce(nb), DELAI_ANNONCE_MS)
    return () => window.clearTimeout(minuterie)
  }, [nb])

  const apercu = apercuId ? (ajouts.find((d) => d.id === apercuId) ?? null) : null

  useEffect(() => {
    if (!choisi && !ajout && !apercu) titre.current?.focus()
  }, [choisi, ajout, apercu])

  if (choisi) {
    return <ProfilPublic key={choisi.id} profil={choisi} profils={profils} evenements={evenements} onRetour={() => setChoisiId(null)} onProposer={onProposer} />
  }
  if (ajout) {
    return <AjouterFiche profils={profils} evenements={evenements} onFermer={() => setAjout(false)} />
  }
  if (apercu) {
    return <ProfilPublic key={apercu.id} profil={profilApercu(apercu)} profils={profils} evenements={evenements} apercu onRetour={() => setApercuId(null)} onProposer={() => undefined} />
  }

  return (
    <main className="screen rc-recherche">
      <button type="button" className="rc-btn rc-btn-lien" onClick={onRetour}>← {fr.reclamer.retour}</button>
      <h1 ref={titre} tabIndex={-1}>{r.titre}</h1>
      <p>{r.intro}</p>
      <label className="rc-champ">
        <span>{r.etiquette}</span>
        <input className="rc-input" type="search" value={requete} onChange={(ev) => setRequete(ev.target.value)} autoComplete="off" />
      </label>
      <p className="rc-aide" aria-hidden="true">{nb}</p>
      <p className="sr-only" role="status">{annonce}</p>
      <ul className="rc-liste">
        {resultats.map((p) => (
          <li key={p.id}>
            <button type="button" className="rc-resultat" onClick={() => setChoisiId(p.id)}>
              <span className="rc-resultat-texte">
                <strong>{p.nom}</strong>
                <span>{p.sousType}</span>
                <span className="rc-resultat-tags">
                  <span className="pp-badge">{t.preRempli}</span>
                  {reclames[p.id]?.statut === 'en_attente' && <span className="pp-badge">{fr.reclamer.demandeEnCours}</span>}
                </span>
              </span>
              <span className="rc-fleche" aria-hidden="true">→</span>
              <span className="sr-only">{r.ouvrir}</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="rc-ajouter" onClick={() => setAjout(true)}>
        <strong>{r.pasDansListe}</strong>
        <span>{r.pasDansListeAide}</span>
      </button>
      {ajouts.length > 0 && (
        <section className="rc-demandes" aria-labelledby="rc-demandes-titre">
          <h2 id="rc-demandes-titre">{fr.ajout.mesDemandes}</h2>
          <ul className="rc-liste">
            {ajouts.map((d) => (
              <li key={d.id}>
                <button type="button" className="rc-resultat" onClick={() => setApercuId(d.id)}>
                  <span className="rc-resultat-texte">
                    <strong>{d.nom}</strong>
                    <span>{fr.ajout.types[d.type]} · {d.adresse}</span>
                    <span className="rc-resultat-tags"><span className="pp-badge">{fr.ajout.enAttente}</span></span>
                  </span>
                  <span className="rc-fleche" aria-hidden="true">→</span>
                  <span className="sr-only">{fr.ajout.envoye.voir}</span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="rc-btn rc-btn-lien rc-reset" onClick={() => ajouts.forEach((d) => annulerAjout(d.id))}>{fr.reclamer.reinitialiser}</button>
        </section>
      )}
    </main>
  )
}
