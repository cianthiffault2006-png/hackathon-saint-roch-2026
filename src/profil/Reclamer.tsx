import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { Creneau, Profil, Tag } from '../types'
import { fr } from '../i18n/fr'
import { CRENEAUX, LIBELLE_CRENEAU, LIBELLE_TAG, TAGS } from '../labels'
import Chips from '../components/Chips'
import { t } from '../explorer/textes'
import { badgeReclamation, courrielMasque, courrielValide, verifierCode } from './reclamation'
import { annulerReclamation, enregistrerReclamation } from './useReclames'
import './Reclamer.css'

const r = fr.reclamer

type Etape = 'choix' | 'code' | 'profil' | 'visibilite' | 'fait' | 'courriel' | 'envoye'
const AVEC_LIEN: Etape[] = ['choix', 'code', 'profil', 'visibilite', 'fait']
const SANS_LIEN: Etape[] = ['choix', 'courriel', 'envoye']

interface Props {
  profil: Profil
  /** Back to the public profile (cancel, done, or after a demo reset). */
  onFermer(): void
}

const basculer = <T,>(liste: T[], v: T) => (liste.includes(v) ? liste.filter((x) => x !== v) : [...liste, v])

export default function Reclamer({ profil, onFermer }: Props) {
  const badge = badgeReclamation(profil)
  const [etape, setEtape] = useState<Etape>(badge ? 'choix' : 'courriel')
  const [chemin, setChemin] = useState<Etape[]>(badge ? AVEC_LIEN : SANS_LIEN)
  const [erreur, setErreur] = useState('')
  const [code, setCode] = useState('')
  const [nom, setNom] = useState(profil.nom)
  const [description, setDescription] = useState(profil.description)
  const [offres, setOffres] = useState<Tag[]>(profil.offres)
  const [besoins, setBesoins] = useState<Tag[]>(profil.besoins)
  const [creneaux, setCreneaux] = useState<Creneau[]>(profil.creneaux)
  const [contactPublic, setContactPublic] = useState(false)
  const [consentement, setConsentement] = useState(false)
  const [courriel, setCourriel] = useState('')
  const titre = useRef<HTMLHeadingElement>(null)
  const ids = useId()
  const idErreur = `${ids}-erreur`

  // Each step announces itself: focus goes to its heading.
  useEffect(() => {
    titre.current?.focus()
  }, [etape])

  function aller(suivante: Etape) {
    setErreur('')
    setEtape(suivante)
  }

  function precedente() {
    const i = chemin.indexOf(etape)
    if (i <= 0) onFermer()
    else aller(chemin[i - 1])
  }

  function choisir(avecLien: boolean) {
    setChemin(avecLien ? AVEC_LIEN : SANS_LIEN)
    aller(avecLien ? 'code' : 'courriel')
  }

  function validerCode(e: FormEvent) {
    e.preventDefault()
    const v = verifierCode(code)
    if (v === 'ok') aller('profil')
    else setErreur(v === 'format' ? r.code.erreurFormat : r.code.erreurIncorrect)
  }

  function validerProfil(e: FormEvent) {
    e.preventDefault()
    if (!nom.trim()) setErreur(r.profil.erreurNom)
    else aller('visibilite')
  }

  function activer(e: FormEvent) {
    e.preventDefault()
    if (!consentement) {
      setErreur(r.visibilite.erreurConsentement)
      return
    }
    enregistrerReclamation(profil.id, {
      statut: 'active',
      nom: nom.trim(),
      description: description.trim(),
      offres,
      besoins,
      creneaux,
      contactPublic,
      quand: new Date().toISOString(),
    })
    aller('fait')
  }

  function envoyerDemande(e: FormEvent) {
    e.preventDefault()
    if (!courrielValide(courriel)) {
      setErreur(r.courriel.erreur)
      return
    }
    // Nothing is sent and the address is not kept: only the pending status is saved.
    enregistrerReclamation(profil.id, { statut: 'en_attente', quand: new Date().toISOString() })
    aller('envoye')
  }

  function reinitialiser() {
    annulerReclamation(profil.id)
    onFermer()
  }

  const terminee = etape === 'fait' || etape === 'envoye'
  const numero = chemin.indexOf(etape) + 1
  const champErreur = (actif: boolean) => (actif && erreur ? { 'aria-invalid': true as const, 'aria-describedby': idErreur } : {})
  const libelleBadge = badge === 'sdc' ? t.membreSdc : badge === 'ville' ? t.reconnuVille : null

  return (
    <main className="rc-racine">
      <div className="rc-contenu">
        <div className="rc-haut">
          {!terminee && (
            <button type="button" className="rc-btn rc-btn-lien" onClick={precedente}>
              ← {numero <= 1 ? r.annuler : r.retour}
            </button>
          )}
        </div>
        <p className="rc-contexte">
          <span>{r.titre}</span>
          <strong>{profil.nom}</strong>
        </p>
        <p className="rc-progres">{r.etape(numero, chemin.length)}</p>
        <div className="rc-barre" aria-hidden="true">
          {chemin.map((e, i) => <span key={e} className={i < numero ? 'rc-point rc-point-on' : 'rc-point'} />)}
        </div>

        {etape === 'choix' && (
          <section className="rc-etape">
            <h2 ref={titre} tabIndex={-1}>{r.choix.titre}</h2>
            <button type="button" className="rc-option" onClick={() => choisir(true)}>
              <strong>{r.choix.lien}</strong>
              <span>{r.choix.lienAide}</span>
            </button>
            <button type="button" className="rc-option" onClick={() => choisir(false)}>
              <strong>{r.choix.sansLien}</strong>
              <span>{r.choix.sansLienAide}</span>
            </button>
          </section>
        )}

        {etape === 'code' && (
          <form className="rc-etape" onSubmit={validerCode} noValidate>
            <h2 ref={titre} tabIndex={-1}>{r.code.titre}</h2>
            <p>{r.code.envoye(courrielMasque(profil))}</p>
            {badge && <p className="rc-aide">{r.code.source[badge]}</p>}
            <label className="rc-champ">
              <span>{r.code.etiquette}</span>
              <input
                className="rc-input rc-input-code"
                value={code}
                onChange={(ev) => { setCode(ev.target.value); setErreur('') }}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9 ]*"
                maxLength={7}
                {...champErreur(true)}
              />
            </label>
            <p className="rc-demo">{r.code.demo}</p>
            <button type="submit" className="rc-btn rc-btn-p">{r.code.verifier}</button>
          </form>
        )}

        {etape === 'profil' && (
          <form className="rc-etape" onSubmit={validerProfil} noValidate>
            <h2 ref={titre} tabIndex={-1}>{r.profil.titre}</h2>
            <p className="rc-aide">{r.profil.intro}</p>
            <label className="rc-champ">
              <span>{r.profil.nom}</span>
              <input className="rc-input" value={nom} onChange={(ev) => { setNom(ev.target.value); setErreur('') }} autoComplete="organization" {...champErreur(!nom.trim())} />
            </label>
            <label className="rc-champ">
              <span>{r.profil.description}</span>
              <textarea className="rc-input" rows={3} value={description} onChange={(ev) => setDescription(ev.target.value)} />
            </label>
            <h3 className="rc-sous">{r.profil.jOffre}</h3>
            <Chips options={TAGS} selected={offres} libelle={LIBELLE_TAG} label={r.profil.jOffre} onToggle={(v) => setOffres((l) => basculer(l, v))} communes={profil.offres.length ? profil.offres : undefined} />
            <h3 className="rc-sous">{r.profil.jeCherche}</h3>
            <Chips options={TAGS} selected={besoins} libelle={LIBELLE_TAG} label={r.profil.jeCherche} onToggle={(v) => setBesoins((l) => basculer(l, v))} communes={profil.besoins.length ? profil.besoins : undefined} />
            <h3 className="rc-sous">{r.profil.disponibilites}</h3>
            <Chips options={CRENEAUX} selected={creneaux} libelle={LIBELLE_CRENEAU} label={r.profil.disponibilites} onToggle={(v) => setCreneaux((l) => basculer(l, v))} />
            <button type="submit" className="rc-btn rc-btn-p">{r.continuer}</button>
          </form>
        )}

        {etape === 'visibilite' && (
          <form className="rc-etape" onSubmit={activer} noValidate>
            <h2 ref={titre} tabIndex={-1}>{r.visibilite.titre}</h2>
            <p className="rc-aide">{r.visibilite.intro}</p>
            <label className="rc-case">
              <input type="checkbox" role="switch" checked={contactPublic} onChange={(ev) => setContactPublic(ev.target.checked)} />
              <span>
                <strong>{r.visibilite.coordonnees}</strong>
                <span className="rc-aide">{r.visibilite.coordonneesAide}</span>
              </span>
            </label>
            <label className="rc-case">
              <input type="checkbox" required checked={consentement} onChange={(ev) => { setConsentement(ev.target.checked); setErreur('') }} {...champErreur(!consentement)} />
              <span>{r.visibilite.consentement}</span>
            </label>
            <button type="submit" className="rc-btn rc-btn-p">{r.visibilite.activer}</button>
          </form>
        )}

        {etape === 'fait' && (
          <section className="rc-etape">
            <h2 ref={titre} tabIndex={-1}>{r.fait.titre}</h2>
            {libelleBadge && <p><span className="pp-badge pp-badge-ok">{libelleBadge}</span></p>}
            <p>{r.fait.texte}</p>
            <p className="rc-aide">{r.fait.simule}</p>
            <button type="button" className="rc-btn rc-btn-p" onClick={onFermer}>{r.fait.voir}</button>
            <button type="button" className="rc-btn rc-btn-lien rc-reset" onClick={reinitialiser}>{r.reinitialiser}</button>
          </section>
        )}

        {etape === 'courriel' && (
          <form className="rc-etape" onSubmit={envoyerDemande} noValidate>
            <h2 ref={titre} tabIndex={-1}>{r.courriel.titre}</h2>
            <p className="rc-aide">{r.courriel.intro(profil.nom)}</p>
            <label className="rc-champ">
              <span>{r.courriel.etiquette}</span>
              <input
                className="rc-input"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={courriel}
                onChange={(ev) => { setCourriel(ev.target.value); setErreur('') }}
                {...champErreur(true)}
              />
            </label>
            <p className="rc-aide">{r.courriel.aide}</p>
            <button type="submit" className="rc-btn rc-btn-p">{r.courriel.envoyer}</button>
          </form>
        )}

        {etape === 'envoye' && (
          <section className="rc-etape">
            <h2 ref={titre} tabIndex={-1}>{r.envoye.titre}</h2>
            <p>{r.envoye.texte}</p>
            <p><span className="pp-badge">{r.demandeEnCours}</span></p>
            <p className="rc-aide">{r.envoye.attente}</p>
            <button type="button" className="rc-btn rc-btn-p" onClick={onFermer}>{r.envoye.retour}</button>
            <button type="button" className="rc-btn rc-btn-lien rc-reset" onClick={reinitialiser}>{r.reinitialiser}</button>
          </section>
        )}

        <p id={idErreur} className="rc-erreur" aria-live="assertive">{erreur}</p>
      </div>
    </main>
  )
}
