import { useEffect, useRef, useState } from 'react'
import { ecrireNom, lireNom, type FilDirect } from '../lib/filDirect'
import { t } from './textes'

// Same client-side slow mode as the local thread; the server enforces its own rules too.
const DELAI_S = 15
const PAUSE_S = 60
const MAX = 500

const heure = (ts: number) => new Date(ts).toLocaleString('fr-CA', { weekday: 'short', hour: 'numeric', minute: '2-digit' })

/** The live thread's messages and composer (Fil en direct). The display name is asked once per device. */
export default function DiscussionDirecte({ fil, nomSuggere = '' }: { fil: FilDirect; nomSuggere?: string }) {
  const [nom, setNom] = useState(lireNom)
  const [brouillonNom, setBrouillonNom] = useState(() => nomSuggere.slice(0, 40))
  const [texte, setTexte] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [maintenant, setMaintenant] = useState(() => Date.now())
  const [prochainA, setProchainA] = useState(0)
  const [pauseJusqua, setPauseJusqua] = useState(0)
  const derniers = useRef<string[]>([])
  const fin = useRef<HTMLLIElement>(null)

  useEffect(() => {
    const id = window.setInterval(() => setMaintenant(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'nearest' })
  }, [fil.messages.length])

  const attenteS = Math.max(0, Math.ceil((prochainA - maintenant) / 1000))
  const pauseS = Math.max(0, Math.ceil((pauseJusqua - maintenant) / 1000))
  const bloque = attenteS > 0 || pauseS > 0 || envoi

  async function envoyer(e: React.FormEvent) {
    e.preventDefault()
    const brut = texte.trim()
    const now = Date.now()
    if (!brut || envoi || now < prochainA || now < pauseJusqua) return
    setEnvoi(true)
    setErreur('')
    const r = await fil.envoyer(brut)
    setEnvoi(false)
    if (!r.ok) {
      setErreur(t.direct.erreurs[r.code])
      if (r.code === 'fil_delai') setProchainA(Date.now() + DELAI_S * 1000)
      return
    }
    derniers.current = [...derniers.current, brut].slice(-3)
    if (derniers.current.length === 3 && derniers.current.every((x) => x === brut)) setPauseJusqua(Date.now() + PAUSE_S * 1000)
    setProchainA(Date.now() + DELAI_S * 1000)
    setTexte('')
  }

  async function signaler(id: string) {
    setErreur('')
    const r = await fil.signaler(id)
    if (!r.ok) setErreur(r.code === 'signal_limite' ? t.direct.erreurs.signal_limite : t.direct.signalerEchec)
  }

  function choisirNom(e: React.FormEvent) {
    e.preventDefault()
    const propre = ecrireNom(brouillonNom)
    if (propre) setNom(propre)
  }

  return (
    <section aria-label={t.fil.onglets.discussion}>
      {fil.chargement ? (
        <p className="pj-note" role="status">{t.direct.connexion}</p>
      ) : fil.statut === 'connecte' ? (
        <p className="pj-note"><span className="pj-badge pj-badge-direct">{t.direct.enDirect}</span></p>
      ) : (
        <p className="pj-note" role="status">{fil.dejaConnecte ? t.direct.reconnexion : t.direct.indisponible}</p>
      )}
      <ul className="pj-fil" aria-live="polite">
        {fil.messages.length === 0 && !fil.chargement && <li className="pj-texte">{t.direct.aucunMsg}</li>}
        {fil.messages.map((m) => {
          const moi = m.deMoi
          return (
            <li key={m.id} className={moi ? 'pj-msg pj-msg-moi' : 'pj-msg'}>
              <div className="pj-msg-tete">
                <span><strong>{m.auteur}</strong> · <time dateTime={new Date(m.ts).toISOString()}>{heure(m.ts)}</time></span>
                {!moi && (
                  <button type="button" className="pj-signaler" onClick={() => signaler(m.id)} aria-label={`${t.fil.signaler} : message de ${m.auteur}`}>
                    {t.fil.signaler}
                  </button>
                )}
              </div>
              <p>{m.texte}</p>
            </li>
          )
        })}
        <li ref={fin} aria-hidden="true" />
      </ul>
      {erreur && <p className="pj-compte" role="alert">{erreur}</p>}
      {!nom ? (
        <form className="pj-carte" onSubmit={choisirNom}>
          <label className="pj-champ">
            {t.direct.nomTitre}
            <input value={brouillonNom} onChange={(e) => setBrouillonNom(e.target.value.slice(0, 40))} maxLength={40} autoComplete="nickname" required />
          </label>
          <p className="pj-note">{t.direct.nomAide}</p>
          <button type="submit" className="pj-btn pj-btn-cta" disabled={!brouillonNom.trim()}>{t.direct.nomContinuer}</button>
        </form>
      ) : (
        <form className="pj-carte" onSubmit={envoyer}>
          <label className="pj-champ">
            {t.fil.msgPlaceholder}
            <textarea value={texte} onChange={(e) => setTexte(e.target.value.slice(0, MAX))} maxLength={MAX} />
          </label>
          <p className="pj-note">{t.fil.msgLimite(texte.length)}</p>
          {pauseS > 0 ? (
            <p className="pj-compte" role="status">{t.fil.pause(pauseS)}</p>
          ) : attenteS > 0 ? (
            <p className="pj-compte" role="timer" aria-live="off">{t.fil.prochain(attenteS)}</p>
          ) : null}
          <button type="submit" className="pj-btn pj-btn-cta" disabled={bloque || texte.trim().length === 0}>{t.fil.msgEnvoyer}</button>
        </form>
      )}
    </section>
  )
}
