import { useEffect, useRef, useState } from 'react'
import { fr } from '../i18n/fr'
import { libelleDateMaj } from '../lib/date'
import { ajouterAuCalendrier as ajouterIcs, lienGoogleAgenda, resumePartage, type ResultatCalendrier } from '../lib/calendrier'
import { nombreCoches, type Projet } from '../lib/projets'
import Icone from '../components/Icones'

interface Props {
  projet: Projet
  onRetour: () => void
  onProjets: () => void
  onCocher: (index: number) => void
  /** Removes the project; hidden in the guided tour. */
  onRetirer?: () => void
  onFil?: () => void
  /** Guided tour: the calendar and share buttons pulse. */
  pulse?: boolean
  /** Guided tour: scrolls the sheet to the action buttons or to the checklist. */
  defilement?: 'actions' | 'liste'
  /** Desktop: the project thread is open beside the fiche, so the fiche is a section, not a second main landmark. */
  incrustee?: boolean
}

export default function Fiche({ projet, onRetour, onProjets, onCocher, onRetirer, onFil, pulse, defilement, incrustee }: Props) {
  const [calendrier, setCalendrier] = useState<ResultatCalendrier | null>(null)
  const [repli, setRepli] = useState(false)
  const [confirmerRetrait, setConfirmerRetrait] = useState(false)
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

  async function ajouterAuCalendrier() {
    setCalendrier(await ajouterIcs(projet))
  }

  const noteCalendrier: Record<ResultatCalendrier, string | null> = {
    telecharge: fr.fiche.calendrierFait,
    ouvert: fr.fiche.calendrierOuvert,
    partage: fr.fiche.calendrierPartage,
    google: fr.fiche.calendrierGoogle,
    annule: null,
  }

  const classeAction = pulse ? 'btn btn-action pulse' : 'btn btn-action'
  const Balise = incrustee ? 'section' : 'main'

  return (
    <Balise className="screen fiche" aria-labelledby={incrustee ? 'fiche-titre' : undefined}>
      <header className="entete">
        <button type="button" className="retour" onClick={onRetour} aria-label={fr.general.retour}>←</button>
        <span className="role-tag">{fr.fiche.titre}</span>
      </header>

      <h1 className="fiche-titre" id="fiche-titre">{projet.titre}</h1>
      <p className="fiche-date">
        <Icone nom="evenement" taille={20} />
        <span>{libelleDateMaj(projet)}</span>
      </p>
      {!projet.inscrit && <p className="fiche-note">{fr.fiche.dateProposee}</p>}
      <p className="fiche-lieu">
        <Icone nom="lieu" taille={20} />
        <span>{projet.lieuNom || fr.fiche.lieuAConfirmer}</span>
      </p>
      {projet.proposition?.lieuId && projet.lieuNom && <p className="fiche-note">{fr.proposition.lieuSuggere}</p>}
      <p className="fiche-statut">{projet.inscrit ? fr.evenement.inscrit : fr.proposition.statuts[projet.statut]}</p>

      <h2 className="sous-titre">{projet.inscrit ? fr.evenement.organisateur : fr.proposition.partenairesN(projet.partenaires.length)}</h2>
      <ul className="liste-part">
        {projet.partenaires.map((p) => (
          <li key={p.nom} className="partenaire">
            <strong>{p.nom}</strong>
            <span className="apport">{p.apport}</span>
          </li>
        ))}
      </ul>

      {projet.aConfirmer.length > 0 && (
      <>
      <h2 className="sous-titre">
        {fr.fiche.aConfirmerAvant} <span className="progres">{fr.fiche.progres(fait, projet.aConfirmer.length)}</span>
      </h2>
      <div className="progres-couture" aria-hidden="true">
        <span style={{ width: `${(fait / projet.aConfirmer.length) * 100}%` }} />
      </div>
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
      </>
      )}

      <div className="actions" ref={refActions}>
        <button type="button" className={classeAction} onClick={ajouterAuCalendrier}>
          {fr.fiche.ajouterCalendrier}
        </button>
        {calendrier && noteCalendrier[calendrier] && <p className="action-note" role="status">{noteCalendrier[calendrier]}</p>}
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
        {onFil && (
          <button type="button" className="btn btn-lien" onClick={onFil}>
            {fr.fiche.ouvrirFil}
          </button>
        )}
        {onRetirer && !confirmerRetrait && (
          <button type="button" className="btn btn-texte btn-retirer" onClick={() => setConfirmerRetrait(true)}>
            {projet.inscrit ? fr.retirer.boutonEvenement : fr.retirer.bouton}
          </button>
        )}
        {onRetirer && confirmerRetrait && (
          <div className="confirmation" role="alertdialog" aria-label={fr.retirer.bouton}>
            <p>{projet.inscrit ? fr.retirer.questionEvenement : fr.retirer.question}</p>
            <div className="confirmation-actions">
              <button type="button" className="btn btn-danger" onClick={onRetirer}>{fr.retirer.confirmer}</button>
              <button type="button" className="btn btn-lien" onClick={() => setConfirmerRetrait(false)}>{fr.retirer.annuler}</button>
            </div>
          </div>
        )}
        <p className="note-simulation">{fr.fiche.rien}</p>
      </div>
    </Balise>
  )
}
