import type { Profil, Proposition } from '../types'
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
  const aActiver = profils.filter((p) => !p.reclame).length
  const max = Math.max(...TYPES.map((t) => t.n))

  return (
    <main className="p2-sdc">
      <h1 className="p2-sdc-titre">Tableau de bord du quartier (pilote SDC)</h1>
      <p className="p2-sdc-fictif">Données fictives de pilote</p>

      <section aria-labelledby="p2-kpi">
        <h2 id="p2-kpi" className="p2-sdc-h2">Indicateurs</h2>
        <ul className="p2-kpis">
          {KPI.map((k) => (
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
      </section>

      <p className="p2-sdc-impact">Mesurer l’impact : projets confirmés, participation, achalandage déclaré par les commerçants</p>
    </main>
  )
}
