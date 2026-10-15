import { configFil, idFilValide, useFilDirect } from '../lib/filDirect'
import DiscussionDirecte from './DiscussionDirecte'
import { t } from './textes'
import './projet.css'

/** « Fil du projet » opened from a shared link (#fil/<filId>?t=<titre>), on any device: live mode only. */
export default function FilPartage({ filId, titre, onQuitter }: { filId: string; titre: string; onQuitter(): void }) {
  const valide = idFilValide(filId)
  const config = configFil()
  const fil = useFilDirect(valide && config ? filId : null)
  const indisponible = fil.statut === 'erreur' || (fil.statut === 'hors_ligne' && !fil.chargement && !fil.dejaConnecte)

  return (
    <div className="plein-ecran">
      <main className="pj-page">
        <button type="button" className="pj-retour" onClick={onQuitter}>{t.direct.ouvrirApp}</button>
        <h1 className="pj-titre">{titre || t.direct.sansTitre}</h1>
        <p className="pj-sous">{t.direct.titrePage} · <span className="pj-badge">{t.direct.bascule}</span></p>
        {!valide ? (
          <p className="pj-texte">{t.direct.lienInvalide}</p>
        ) : !config ? (
          <p className="pj-texte">{t.direct.nonOffert}</p>
        ) : (
          <>
            <p className="pj-note">{t.direct.avis}</p>
            {indisponible ? <p className="pj-texte" role="status">{t.direct.indisponiblePage}</p> : <DiscussionDirecte fil={fil} />}
          </>
        )}
      </main>
    </div>
  )
}
