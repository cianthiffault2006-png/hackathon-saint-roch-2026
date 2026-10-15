import { describe, expect, it } from 'vitest'
import { contenuIcs, lienGoogleAgenda } from './calendrier'
import { libelleDate, prochaineDate } from './date'
import type { Projet } from './projets'

const projet: Projet = {
  id: 'prop-1|Exposition, au café',
  titre: 'Exposition collaborative, au café',
  statut: 'confirmee',
  partenaires: [{ nom: 'Café Le Petit Détour', role: 'commerce', apport: 'accueille; expose' }],
  lieuNom: 'Café Le Petit Détour',
  aConfirmer: ['Assurance', 'Date du vernissage'],
  coches: [true, false],
  jour: '2026-10-22',
  heureDebut: 19,
  heureFin: 22,
}

describe('prochaineDate', () => {
  it('gives a Thursday evening at least 2 days ahead', () => {
    // Wed 2026-10-14 noon Toronto: Thursday is 1 day away, so the next one is a week later.
    const o = prochaineDate('semaine_soir', new Date('2026-10-14T16:00:00Z'))
    expect(o).toEqual({ jour: '2026-10-22', heureDebut: 19, heureFin: 22 })
    expect(libelleDate(o)).toBe('jeudi 22 octobre, 19 h à 22 h')
  })
  it('gives a Saturday afternoon for the weekend slot', () => {
    const o = prochaineDate('fin_de_semaine', new Date('2026-10-15T16:00:00Z'))
    expect(o).toEqual({ jour: '2026-10-17', heureDebut: 13, heureFin: 17 })
  })
})

describe('contenuIcs', () => {
  const ics = contenuIcs(projet, new Date('2026-10-15T12:00:00Z'))
  it('is a calendar with an event, a time zone and a 1-day reminder', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics).toContain('DTSTART;TZID=America/Toronto:20261022T190000')
    expect(ics).toContain('DTEND;TZID=America/Toronto:20261022T220000')
    expect(ics).toContain('TRIGGER:-P1D')
    expect(ics).toContain('BEGIN:VTIMEZONE')
  })
  it('escapes commas and semicolons and folds long lines', () => {
    expect(ics).toContain('SUMMARY:Exposition collaborative\\, au café')
    for (const ligne of ics.split('\r\n')) expect(ligne.length).toBeLessThanOrEqual(61)
  })
})

describe('lienGoogleAgenda', () => {
  it('uses local dates with the Toronto zone', () => {
    const url = new URL(lienGoogleAgenda(projet))
    expect(url.searchParams.get('dates')).toBe('20261022T190000/20261022T220000')
    expect(url.searchParams.get('ctz')).toBe('America/Toronto')
  })
})
