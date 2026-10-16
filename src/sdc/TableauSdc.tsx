import type { Profil, Proposition } from '../types'
import { fr } from '../i18n/fr'
import { AJOUTS_FICTIFS } from '../profil/ajout'
import { useAjouts } from '../profil/useAjouts'
import './TableauSdc.css'

interface Props {
  profils: Profil[]
  propositions?: Proposition[]
}

const KPI = [
  { libelle: 'Membres invités', valeur: 120 },
  { libelle: 'Profils réclamés', valeur: 47 },
  { libelle: 'Projets proposés', valeur: 31 },
  { libelle: 'Projets confirmés', valeur: 9 },
]

const TYPES = [
  { libelle: 'Exposition', n: 11 },
  { libelle: 'Spectacle', n: 7 },
  { libelle: 'Marché éphémère', n: 6 },
  { libelle: 'Animation de rue', n: 4 },
  { libelle: 'Atelier', n: 3 },
]

export default function TableauSdc({ profils }: Props) {
  // Fictional backlog plus the add requests made in this browser (pending: on no map, in no partner pool).
  const ajouts = AJOUTS_FICTIFS + useAjouts().length
  const reclames = profils.filter((p) => p.reclame).length
  const aActiver = profils.length - reclames
  const kpis = KPI.map((k) => (k.libelle === 'Profils réclamés' ? { ...k, valeur: reclames } : k))
  const max = Math.max(...TYPES.map((t) => t.n))

  return (
    <main className="p2-sdc">
      <p className="p2-sdc-fictif" role="note">Exemple de tableau : données fictives de pilote</p>
      <h1 className="p2-sdc-titre">Tableau du quartier (SDC, pilote)</h1>

      <section aria-labelledby="p2-kpi">
        <h2 id="p2-kpi" className="p2-sdc-h2">Indicateurs</h2>
        <ul className="p2-kpis">
          {kpis.map((k) => (
            <li key={k.libelle} className="p2-kpi">
              <span className="p2-kpi-n">{k.valeur}</span>
              <span className="p2-kpi-l">{k.libelle}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="p2-types" className="p2-sdc-carte">
        <h2 id="p2-types" className="p2-sdc-h2">Types de projets</h2>
        <ul className="p2-barres">
          {TYPES.map((t) => (
            <li key={t.libelle} className="p2-barre">
              <span className="p2-barre-l">{t.libelle}</span>
              <span className="p2-barre-piste" aria-hidden="true">
                <span className="p2-barre-rempli" style={{ width: `${(t.n / max) * 100}%` }} />
              </span>
              <span className="p2-barre-n">{t.n}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="p2-pre" className="p2-sdc-carte">
        <h2 id="p2-pre" className="p2-sdc-h2">Profils pré-remplis à activer</h2>
        <p className="p2-pre-n">{aActiver}</p>
        {/* The two live counts are named as such, next to the fictional pilot KPIs. */}
        <p className="p2-pre-aide">Compté en direct dans ce prototype, comme les profils réclamés : une fiche réclamée passe de l’un à l’autre.</p>
      </section>

      <section aria-labelledby="p2-ajouts" className="p2-sdc-carte">
        <h2 id="p2-ajouts" className="p2-sdc-h2">{fr.ajout.sdc.titre}</h2>
        <p className="p2-pre-n">{ajouts}</p>
        <p className="p2-pre-aide">{fr.ajout.sdc.aide}</p>
      </section>

      <p className="p2-sdc-impact">Mesurer l’impact : projets confirmés, participation, achalandage déclaré par les commerçants</p>
    </main>
  )
}
