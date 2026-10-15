import type { Evenement, Profil } from '../types'
import { fr } from '../i18n/fr'
import { LIBELLE_CRENEAU, LIBELLE_TAG } from '../labels'
import { t } from '../explorer/textes'
import './ProfilPublic.css'

interface Props {
  profil: Profil
  profils: Profil[]
  evenements: Evenement[]
  onRetour(): void
  onProposer(profilId: string): void
}

const THEMES = fr.besoin.themes
const commun = <T,>(a: T[], b: T[]) => a.filter((x) => b.includes(x))

function dateCourte(iso: string): string {
  return new Intl.DateTimeFormat('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' }).format(new Date(iso))
}

export default function ProfilPublic({ profil, profils, evenements, onRetour, onProposer }: Props) {
  const verif = profil.verifie === 'sdc' ? t.membreSdc : profil.verifie === 'ville' ? t.reconnuVille : null
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

  return (
    <main className="pp-racine">
      <button type="button" className="pp-btn" onClick={onRetour}>← {t.retour}</button>
      <h1 className="pp-titre">{nom}</h1>
      <p className="pp-sous">{profil.sousType}</p>
      <div className="pp-badges">
        {verif && <span className="pp-badge pp-badge-ok">{verif}</span>}
        {!profil.reclame && <span className="pp-badge">{t.preRempli}</span>}
      </div>
      <p>{profil.description}</p>

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

      <button type="button" className="pp-btn pp-btn-p" onClick={() => onProposer(profil.id)}>{t.proposer}</button>
    </main>
  )
}
