import { fr } from '../i18n/fr'
import { t } from '../projet/textes'
import type { EtatFil } from './etat'

interface Props {
  fil: EtatFil
  /** The café (the viewer's side in the tour). */
  moi: string
  /** The partner who replies (Camille in the café story). */
  partenaire: string
  /** The third partner. */
  autre: string
}

/**
 * Guided tour only: the Discussion tab played from the tour clock, with the real thread's look.
 * Shown on screen only: nothing is saved and nothing reaches a shared thread.
 */
export default function FilVisite({ fil, moi, partenaire, autre }: Props) {
  const recus = [
    { auteur: autre, texte: t.fil.msgOuverture },
    { auteur: partenaire, texte: fr.visite.filMessage },
  ]
  const ecritPar = fil.ecrit !== null ? recus[fil.ecrit].auteur : fil.reponseEcrit ? partenaire : null
  const saisie = fr.visite.filMoi.slice(0, Math.ceil(fr.visite.filMoi.length * fil.frappe))

  return (
    <section aria-label={t.fil.onglets.discussion}>
      <p className="pj-note"><span className="pj-badge">{t.demo}</span> {t.fil.moderation}</p>
      <ul className="pj-fil">
        {recus.slice(0, fil.recus).map((m) => (
          <li key={m.texte} className="pj-msg visite-msg">
            <div className="pj-msg-tete">
              <span><strong>{m.auteur}</strong> · {t.fil.simule}</span>
              <span className="pj-signaler">{t.fil.signaler}</span>
            </div>
            <p>{m.texte}</p>
          </li>
        ))}
        {fil.envoyeDepuis !== null && (
          <li className="pj-msg pj-msg-moi visite-msg">
            <div className="pj-msg-tete">
              <span><strong>{moi}</strong></span>
            </div>
            <p>{fr.visite.filMoi}</p>
          </li>
        )}
        {fil.reponse && (
          <li className="pj-msg visite-msg">
            <div className="pj-msg-tete">
              <span><strong>{partenaire}</strong> · {t.fil.simule}</span>
              <span className="pj-signaler">{t.fil.signaler}</span>
            </div>
            <p>{fr.visite.filReponse}</p>
          </li>
        )}
        {ecritPar && (
          <li className="pj-msg visite-ecrit">
            <span className="sr-only">{fr.visite.ecrit(ecritPar)}</span>
            <span aria-hidden="true">
              <strong>{ecritPar}</strong> <span className="visite-points"><i /><i /><i /></span>
            </span>
          </li>
        )}
        <li data-visite="fil-fin" aria-hidden="true" />
      </ul>
      <form className="pj-carte" onSubmit={(e) => e.preventDefault()}>
        <label className="pj-champ">
          {t.fil.msgPlaceholder}
          <textarea data-visite="fil-champ" value={saisie} readOnly />
        </label>
        <p className="pj-note">{t.fil.msgLimite(saisie.length)}</p>
        {/* No slow-mode timer in the tour: the real thread keeps it. */}
        <button type="submit" data-visite="fil-envoyer" className="pj-btn pj-btn-cta" disabled={saisie.length === 0}>
          {t.fil.msgEnvoyer}
        </button>
      </form>
    </section>
  )
}
