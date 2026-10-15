import { useState, type ReactNode } from 'react'
import { configFil, ecrireBascule, estDemo, lienFil, lireBascule, partagerLien, useFilDirect } from '../lib/filDirect'
import DiscussionDirecte from './DiscussionDirecte'
import { t } from './textes'

interface Props {
  propositionId: string
  /** Project key (`<id>|<titre>`), as used for the local thread. */
  cle: string
  titre: string
  nomSuggere?: string
  /** The local (simulated) thread. */
  children: ReactNode
}

/**
 * Discussion data source: the local thread, or « Fil en direct (bêta) » when this project's toggle
 * is on. Demo projects render the local thread untouched; without Supabase, a quiet note.
 */
export default function BasculeDirect({ propositionId, cle, titre, nomSuggere, children }: Props) {
  const demo = estDemo(propositionId)
  const config = demo ? null : configFil()
  const [bascule, setBascule] = useState(() => lireBascule(cle))
  const [info, setInfo] = useState('')
  const [lienManuel, setLienManuel] = useState('')
  const actif = config !== null && bascule?.actif === true
  const fil = useFilDirect(actif && bascule ? bascule.filId : null)

  if (demo) return <>{children}</>
  if (!config) {
    return (
      <>
        <p className="pj-note">{t.direct.nonConfigure}</p>
        {children}
      </>
    )
  }

  function basculer(actif: boolean) {
    setBascule(ecrireBascule(cle, actif))
    setInfo('')
    setLienManuel('')
  }

  async function partager() {
    if (!bascule) return
    const url = lienFil(bascule.filId, titre)
    const r = await partagerLien(url, t.direct.objetPartage(titre), t.direct.textePartage(titre))
    setInfo(r === 'copie' ? t.direct.lienCopie : '')
    setLienManuel(r === 'manuel' ? url : '')
  }

  // Never reached the server: the local thread keeps working below a quiet note.
  const repli = actif && !fil.chargement && !fil.dejaConnecte && fil.statut !== 'connecte'

  return (
    <>
      <div className="pj-carte pj-direct">
        <label className="pj-bascule">
          <input type="checkbox" role="switch" checked={actif} onChange={(e) => basculer(e.target.checked)} />
          {t.direct.bascule}
        </label>
        {actif && (
          <>
            <p className="pj-note">{t.direct.avis}</p>
            <button type="button" className="pj-btn" onClick={partager}>{t.direct.partager}</button>
            {info && <p className="pj-note" role="status">{info}</p>}
            {lienManuel && (
              <label className="pj-champ pj-lien-manuel">
                {t.direct.lienACopier}
                <input readOnly value={lienManuel} onFocus={(e) => e.currentTarget.select()} />
              </label>
            )}
          </>
        )}
      </div>
      {!actif ? (
        children
      ) : repli ? (
        <>
          <p className="pj-note" role="status">{t.direct.indisponible}</p>
          {children}
        </>
      ) : (
        <DiscussionDirecte fil={fil} nomSuggere={nomSuggere} />
      )}
    </>
  )
}
