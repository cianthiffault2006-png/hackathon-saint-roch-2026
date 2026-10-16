import { useEffect, useRef, useState } from 'react'
import type { Evenement, Profil } from '../types'
import { fr } from '../i18n/fr'
import { LIBELLE_CRENEAU, LIBELLE_TAG } from '../labels'
import { t } from '../explorer/textes'
import Reclamer from './Reclamer'
import { estReclamable } from './reclamation'
import { annulerReclamation, useReclames } from './useReclames'
import './ProfilPublic.css'
import './Reclamer.css'

interface Props {
  profil: Profil
  profils: Profil[]
  evenements: Evenement[]
  onRetour(): void
  onProposer(profilId: string): void
  /** Preview of a pending add request: the owner sees the fiche as it will appear, nobody else does. */
  apercu?: boolean
}

const THEMES = fr.besoin.themes
const commun = <T,>(a: T[], b: T[]) => a.filter((x) => b.includes(x))

function dateCourte(iso: string): string {
  return new Intl.DateTimeFormat('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }).format(new Date(iso))
}

export default function ProfilPublic({ profil, profils, evenements, onRetour, onProposer, apercu = false }: Props) {
  const reclames = useReclames()
  const [flux, setFlux] = useState(false)
  const titre = useRef<HTMLHeadingElement>(null)
  const sortiDuFlux = useRef(false)
  // Back from the claim flow: focus returns to the profile heading.
  useEffect(() => {
    if (!flux && sortiDuFlux.current) titre.current?.focus()
    sortiDuFlux.current = flux
  }, [flux])
  // The badge comes with activation: a pre-filled profile shows « Profil pré-rempli » only.
  const verif = !profil.reclame ? null : profil.verifie === 'sdc' ? t.membreSdc : profil.verifie === 'ville' ? t.reconnuVille : null
  const local = reclames[profil.id]
  const enAttente = !profil.reclame && local?.statut === 'en_attente'
  const reclamable = estReclamable(profil, reclames) && !enAttente
  const maintenant = Date.now()
  const prochains = evenements
    .filter((e) => e.promoteurId === profil.id && new Date(e.fin).getTime() >= maintenant)
    .sort((a, b) => a.debut.localeCompare(b.debut))
  // Même rôle et (au moins un thème commun ou même sous-type); profils pré-remplis et citoyens non réclamés exclus (Loi 25).
  const semblables = profils
    .filter((p) => p.id !== profil.id && p.role === profil.role && p.reclame && (p.sousType === profil.sousType || commun(p.themes, profil.themes).length >= 1))
    .map((p) => ({ p, n: commun(p.themes, profil.themes).length + (p.sousType === profil.sousType ? 2 : 0) }))
    .sort((a, b) => b.n - a.n || a.p.nom.localeCompare(b.p.nom))
    .slice(0, 3)
    .map((x) => x.p)
  const citoyen = profil.role === 'citoyen'
  const nom = citoyen ? t.citoyen : profil.nom

  if (flux) return <Reclamer profil={profil} onFermer={() => setFlux(false)} />

  return (
    <div className="pp-defile">
    <main className="pp-racine">
      <button type="button" className="pp-btn" onClick={onRetour}>← {t.retour}</button>
      <h1 className="pp-titre" ref={titre} tabIndex={-1}>{nom}</h1>
      <p className="pp-sous">{profil.sousType}</p>
      <div className="pp-badges">
        {verif && <span className="pp-badge pp-badge-ok">{verif}</span>}
        {!profil.reclame && <span className="pp-badge">{t.preRempli}</span>}
        {enAttente && <span className="pp-badge">{fr.reclamer.demandeEnCours}</span>}
        {apercu && <span className="pp-badge">{fr.ajout.enAttente}</span>}
      </div>
      {apercu && <p className="pp-note" role="note">{fr.ajout.apercu}</p>}
      <p>{profil.description}</p>
      {profil.source === 'ouvert' && <p className="pp-note">{profil.origine}</p>}

      {reclamable && profil.role !== 'citoyen' && (
        <section className="pp-reclamer" aria-labelledby="pp-reclamer-q">
          <p id="pp-reclamer-q" className="pp-reclamer-q">{fr.reclamer.question[profil.role]}</p>
          <p>{fr.reclamer.ctaAide}</p>
          <button type="button" className="pp-btn pp-btn-p" onClick={() => setFlux(true)}>{fr.reclamer.cta}</button>
        </section>
      )}
      {enAttente && (
        <div className="pp-attente">
          <p>{fr.reclamer.demandeTexte}</p>
          <button type="button" className="pp-btn pp-lien" onClick={() => annulerReclamation(profil.id)}>{fr.reclamer.reinitialiser}</button>
        </div>
      )}

      <section aria-labelledby="pp-offre">
        <h2 id="pp-offre">{t.jOffre}</h2>
        <ul className="pp-chips">{profil.offres.map((o) => <li key={o} className="pp-chip">{LIBELLE_TAG[o]}</li>)}</ul>
      </section>
      <section aria-labelledby="pp-cherche">
        <h2 id="pp-cherche">{t.jeCherche}</h2>
        <ul className="pp-chips">{profil.besoins.map((o) => <li key={o} className="pp-chip">{LIBELLE_TAG[o]}</li>)}</ul>
      </section>
      <section aria-labelledby="pp-creneaux">
        <h2 id="pp-creneaux">{t.creneaux}</h2>
        <ul className="pp-chips">{profil.creneaux.map((c) => <li key={c} className="pp-chip">{LIBELLE_CRENEAU[c]}</li>)}</ul>
      </section>
      <section aria-labelledby="pp-themes">
        <h2 id="pp-themes">{t.themes}</h2>
        <ul className="pp-chips">{profil.themes.map((x) => <li key={x} className="pp-chip">{THEMES[x]}</li>)}</ul>
      </section>

      <section aria-labelledby="pp-events">
        <h2 id="pp-events">{t.evenements}</h2>
        {prochains.length === 0 ? <p>{t.aucunEvenement}</p> : (
          <ul className="pp-liste">
            {prochains.map((e) => (
              <li key={e.id} className="pp-carte">
                <strong>{e.titre}</strong>
                <span>{dateCourte(e.debut)} · {e.lieuNom}</span>
                {e.ouvertAuPublic && <span className="pp-badge pp-badge-ok">{t.ouvertPublic}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="pp-sembl">
        <h2 id="pp-sembl">{t.semblables}</h2>
        {semblables.length === 0 ? <p>{t.aucunSemblable}</p> : (
          <ul className="pp-liste">
            {semblables.map((p) => (
              <li key={p.id} className="pp-carte"><strong>{p.nom}</strong><span>{p.sousType}</span></li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="pp-contact">
        <h2 id="pp-contact">{t.contact}</h2>
        {profil.contactPublic ? (
          <>
            <div className="pp-actions">
              <a className="pp-btn" href={`mailto:${t.courrielFictif}`}>{t.ecrire}</a>
              <a className="pp-btn" href={`sms:${t.telFictif.replace(/-/g, '')}`}>{t.texto}</a>
            </div>
            <p className="pp-note">({t.fictif})</p>
          </>
        ) : (
          <p>{t.contactPrive}</p>
        )}
      </section>

      {!apercu && <button type="button" className="pp-btn pp-btn-p" onClick={() => onProposer(profil.id)}>{t.proposer}</button>}
      {local?.statut === 'active' && (
        <button type="button" className="pp-btn pp-lien" onClick={() => annulerReclamation(profil.id)}>{fr.reclamer.reinitialiser}</button>
      )}
    </main>
    </div>
  )
}
