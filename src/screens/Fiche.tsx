import { useEffect, useRef, useState } from 'react'
import { fr } from '../i18n/fr'
import { libelleDateMaj } from '../lib/date'
import { lienGoogleAgenda, resumePartage, telechargerIcs } from '../lib/calendrier'
import { nombreCoches, type Projet } from '../lib/projets'
import Icone from '../components/Icones'

interface Props {
  projet: Projet
  onRetour: () => void
  onProjets: () => void
  onCocher: (index: number) => void
  /** Guided tour: the calendar and share buttons pulse. */
  pulse?: boolean
  /** Guided tour: scrolls the sheet to the action buttons or to the checklist. */
  defilement?: 'actions' | 'liste'
}

export default function Fiche({ projet, onRetour, onProjets, onCocher, pulse, defilement }: Props) {
  const [telecharge, setTelecharge] = useState(false)
  const [repli, setRepli] = useState(false)
  const refActions = useRef<HTMLDivElement>(null)
  const refListe = useRef<HTMLUListElement>(null)
  const resume = resumePartage(projet)
  const fait = nombreCoches(projet)

  useEffect(() => {
    if (!defilement) return
    const cible = defilement === 'actions' ? refActions.current : refListe.current
    cible?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [defilement])

  async function partager() {
    const donnees = { title: resume.objet, text: resume.texte, url: window.location.origin }
    if (typeof navigator.share !== 'function') {
      setRepli(true)
      return
    }
    try {
      await navigator.share(donnees)
    } catch (e) {
      // Closing the share sheet is not an error; anything else falls back to the links.
      if (!(e instanceof DOMException && e.name === 'AbortError')) setRepli(true)
    }
  }

  function ajouterAuCalendrier() {
    telechargerIcs(projet)
    setTelecharge(true)
  }

  const classeAction = pulse ? 'btn btn-action pulse' : 'btn btn-action'

  return (
    <main className="screen fiche">
      <header className="entete">
        <button type="button" className="retour" onClick={onRetour} aria-label={fr.general.retour}>←</button>
        <span className="role-tag">{fr.fiche.titre}</span>
      </header>

      <h1 className="fiche-titre">{projet.titre}</h1>
      <p className="fiche-date">
        <Icone nom="evenement" taille={20} />
        <span>{libelleDateMaj(projet)}</span>
      </p>
      <p className="fiche-note">{fr.fiche.dateProposee}</p>
      <p className="fiche-lieu">
        <Icone nom="lieu" taille={20} />
        <span>{projet.lieuNom || fr.fiche.lieuAConfirmer}</span>
      </p>
      <p className="fiche-statut">{fr.proposition.statuts[projet.statut]}</p>

      <h2 className="sous-titre">{fr.proposition.partenaires}</h2>
      <ul className="liste-part">
        {projet.partenaires.map((p) => (
          <li key={p.nom} className="partenaire">
            <strong>{p.nom}</strong>
            <span className="apport">{p.apport}</span>
          </li>
        ))}
      </ul>

      <h2 className="sous-titre">
        {fr.fiche.aConfirmerAvant} <span className="progres">{fr.fiche.progres(fait, projet.aConfirmer.length)}</span>
      </h2>
      <ul className="coches" ref={refListe}>
        {projet.aConfirmer.map((texte, i) => (
          <li key={texte}>
            <label className="coche">
              <input type="checkbox" checked={projet.coches[i] ?? false} onChange={() => onCocher(i)} />
              <span>{texte}</span>
            </label>
          </li>
        ))}
      </ul>

      <div className="actions" ref={refActions}>
        <button type="button" className={classeAction} onClick={ajouterAuCalendrier}>
          {fr.fiche.ajouterCalendrier}
        </button>
        {telecharge && <p className="action-note" role="status">{fr.fiche.calendrierFait}</p>}
        <a className="lien-action" href={lienGoogleAgenda(projet)} target="_blank" rel="noreferrer">
          {fr.fiche.googleAgenda}
        </a>

        <button type="button" className={classeAction} onClick={partager}>
          {fr.fiche.partager}
        </button>
        {repli && (
          <p className="action-note">
            <a href={`mailto:?subject=${encodeURIComponent(resume.objet)}&body=${encodeURIComponent(resume.texte)}`}>{fr.fiche.courriel}</a>
            {' · '}
            <a href={`sms:?&body=${encodeURIComponent(resume.texte)}`}>{fr.fiche.texto}</a>
          </p>
        )}

        <button type="button" className="btn btn-lien" onClick={onProjets}>
          {fr.projets.titre}
        </button>
        <p className="note-simulation">{fr.fiche.rien}</p>
      </div>
    </main>
  )
}
