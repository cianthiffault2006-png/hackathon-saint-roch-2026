import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { Evenement, Profil, Tag } from '../types'
import { fr } from '../i18n/fr'
import { LIBELLE_TAG, TAGS } from '../labels'
import Chips from '../components/Chips'
import ProfilPublic from './ProfilPublic'
import { FORMULAIRE_VIDE, demandeDepuis, profilApercu, validerFormulaire, type DemandeAjout, type ErreurAjout, type Formulaire, type TypeAjout } from './ajout'
import { annulerAjout, enregistrerAjout } from './useAjouts'
import './Reclamer.css'

const a = fr.ajout
const r = fr.reclamer
const TYPES: TypeAjout[] = ['commerce', 'organisme', 'citoyen']

interface Props {
  profils: Profil[]
  evenements: Evenement[]
  /** Back to the claim search (cancel, done, or after a demo reset). */
  onFermer(): void
}

const basculer = <T,>(liste: T[], v: T) => (liste.includes(v) ? liste.filter((x) => x !== v) : [...liste, v])

/** Form → « Demande envoyée (simulée) » → preview of the fiche as it will appear. The request never reaches the map or the partner pool. */
export default function AjouterFiche({ profils, evenements, onFermer }: Props) {
  const [f, setF] = useState<Formulaire>(FORMULAIRE_VIDE)
  const [envoyee, setEnvoyee] = useState<DemandeAjout | null>(null)
  const [apercu, setApercu] = useState(false)
  const [erreur, setErreur] = useState<ErreurAjout | null>(null)
  const titre = useRef<HTMLHeadingElement>(null)
  const formulaire = useRef<HTMLFormElement>(null)
  const ids = useId()
  const idErreur = `${ids}-erreur`
  const idType = `${ids}-type`
  const citoyen = f.type === 'citoyen'

  // Each step announces itself: focus goes to its heading (also back from the preview).
  useEffect(() => {
    if (!apercu) titre.current?.focus()
  }, [envoyee, apercu])

  // The error line sits under the form: focus goes to the field it names.
  useEffect(() => {
    if (erreur && erreur !== 'citoyen') formulaire.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [erreur])

  const champ = <K extends keyof Formulaire>(cle: K) => (valeur: Formulaire[K]) => {
    setF((prev) => ({ ...prev, [cle]: valeur }))
    setErreur(null)
  }

  function envoyer(e: FormEvent) {
    e.preventDefault()
    const probleme = validerFormulaire(f)
    if (probleme) {
      setErreur(probleme)
      return
    }
    // Nothing is sent and the email is not kept: only the pending request is saved, locally.
    const d = demandeDepuis(f, new Date().toISOString())
    enregistrerAjout(d)
    setEnvoyee(d)
  }

  function reinitialiser() {
    if (envoyee) annulerAjout(envoyee.id)
    onFermer()
  }

  if (envoyee && apercu) {
    return <ProfilPublic profil={profilApercu(envoyee)} profils={profils} evenements={evenements} apercu onRetour={() => setApercu(false)} onProposer={() => undefined} />
  }

  const invalide = (cle: ErreurAjout) => (erreur === cle ? { 'aria-invalid': true as const, 'aria-describedby': idErreur } : {})

  return (
    <main className="rc-racine">
      <div className="rc-contenu">
        <div className="rc-haut">
          {!envoyee && <button type="button" className="rc-btn rc-btn-lien" onClick={onFermer}>← {r.annuler}</button>}
        </div>
        <p className="rc-contexte">
          <span>{a.contexte}</span>
          <strong>{a.titre}</strong>
        </p>
        {/* One form, then a confirmation: no « Étape 1 sur 2 » counter. */}

        {!envoyee && (
          <form ref={formulaire} className="rc-etape" onSubmit={envoyer} noValidate>
            <h2 ref={titre} tabIndex={-1}>{a.formulaire}</h2>
            <p className="rc-aide">{a.intro}</p>
            <fieldset className="rc-types" aria-describedby={citoyen ? idType : undefined}>
              <legend className="rc-sous">{a.type}</legend>
              <div className="chips" role="group" aria-label={a.type}>
                {TYPES.map((type) => (
                  <button key={type} type="button" className={f.type === type ? 'chip chip-on' : 'chip'} aria-pressed={f.type === type} onClick={() => champ('type')(type)}>
                    {a.types[type]}
                  </button>
                ))}
              </div>
            </fieldset>
            {citoyen ? (
              <p id={idType} className="rc-demo rc-citoyen" role="status">{a.citoyen}</p>
            ) : (
              <>
                <label className="rc-champ">
                  <span>{a.nom}</span>
                  <input className="rc-input" value={f.nom} onChange={(ev) => champ('nom')(ev.target.value)} autoComplete="organization" {...invalide('nom')} />
                </label>
                <label className="rc-champ">
                  <span>{a.adresse}</span>
                  <input className="rc-input" value={f.adresse} onChange={(ev) => champ('adresse')(ev.target.value)} autoComplete="street-address" {...invalide('adresse')} />
                </label>
                <p className="rc-aide">{a.adresseAide}</p>
                <label className="rc-champ">
                  <span>{a.courriel}</span>
                  <input className="rc-input" type="email" inputMode="email" autoComplete="email" value={f.courriel} onChange={(ev) => champ('courriel')(ev.target.value)} {...invalide('courriel')} />
                </label>
                <p className="rc-aide">{a.courrielAide}</p>
                <label className="rc-champ">
                  <span>{a.phrase}</span>
                  <textarea className="rc-input" rows={2} value={f.phrase} onChange={(ev) => champ('phrase')(ev.target.value)} />
                </label>
                <p className="rc-aide">{a.phraseAide}</p>
                <h3 className="rc-sous">{a.jOffre}</h3>
                <Chips options={TAGS} selected={f.offres} libelle={LIBELLE_TAG} label={a.jOffre} onToggle={(v: Tag) => champ('offres')(basculer(f.offres, v))} />
                <h3 className="rc-sous">{a.jeCherche}</h3>
                <Chips options={TAGS} selected={f.besoins} libelle={LIBELLE_TAG} label={a.jeCherche} onToggle={(v: Tag) => champ('besoins')(basculer(f.besoins, v))} />
                <label className="rc-case">
                  <input type="checkbox" required checked={f.consentement} onChange={(ev) => champ('consentement')(ev.target.checked)} {...invalide('consentement')} />
                  <span>{r.visibilite.consentement}</span>
                </label>
                <button type="submit" className="rc-btn rc-btn-p">{a.envoyer}</button>
              </>
            )}
          </form>
        )}

        {envoyee && (
          <section className="rc-etape">
            <h2 ref={titre} tabIndex={-1}>{a.envoye.titre}</h2>
            <p>{a.envoye.texte}</p>
            <p><span className="pp-badge">{a.enAttente}</span></p>
            <p className="rc-aide">{a.envoye.attente}</p>
            <button type="button" className="rc-btn rc-btn-p" onClick={() => setApercu(true)}>{a.envoye.voir}</button>
            <button type="button" className="rc-btn" onClick={onFermer}>{a.envoye.retour}</button>
            <button type="button" className="rc-btn rc-btn-lien rc-reset" onClick={reinitialiser}>{r.reinitialiser}</button>
          </section>
        )}

        <p id={idErreur} className="rc-erreur" aria-live="assertive">{erreur && erreur !== 'citoyen' ? a.erreurs[erreur] : ''}</p>
      </div>
    </main>
  )
}
