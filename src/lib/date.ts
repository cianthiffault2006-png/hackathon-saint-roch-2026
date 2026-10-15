import type { Creneau } from '../types'

// Dates are kept as Toronto wall-clock values (day + hours), so they stay right on any phone time zone.
export interface Occurrence {
  jour: string // YYYY-MM-DD
  heureDebut: number
  heureFin: number
}

// getUTCDay(): 0 = Sunday. Thursday evening is the story slot.
const REGLES: Record<Creneau, { jourSemaine: number; debut: number; fin: number }> = {
  semaine_soir: { jourSemaine: 4, debut: 19, fin: 22 },
  semaine_jour: { jourSemaine: 3, debut: 12, fin: 15 },
  fin_de_semaine: { jourSemaine: 6, debut: 13, fin: 17 },
}

function aujourdhuiToronto(maintenant: Date): number {
  const iso = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(maintenant)
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** Next day matching the slot, at least 2 days ahead so partners have time to answer. */
export function prochaineDate(creneau: Creneau, maintenant: Date = new Date()): Occurrence {
  const regle = REGLES[creneau]
  const base = aujourdhuiToronto(maintenant)
  const jourActuel = new Date(base).getUTCDay()
  let delta = (regle.jourSemaine - jourActuel + 7) % 7
  if (delta < 2) delta += 7
  const jour = new Date(base + delta * 86400000).toISOString().slice(0, 10)
  return { jour, heureDebut: regle.debut, heureFin: regle.fin }
}

export function libelleDate(o: Occurrence): string {
  const [y, m, d] = o.jour.split('-').map(Number)
  const texte = new Intl.DateTimeFormat('fr-CA', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d, 12)))
  return `${texte}, ${o.heureDebut} h à ${o.heureFin} h`
}

export function libelleDateMaj(o: Occurrence): string {
  const t = libelleDate(o)
  return t.charAt(0).toUpperCase() + t.slice(1)
}
