import { describe, expect, it } from 'vitest'
import { cheminIcsStatique, cleIcs, contenuIcs, estIos, fichierIcs, lienGoogleAgenda, modeCalendrier } from './calendrier'
import { CATALOGUE_ICS } from './icsCatalogue'
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

describe('iOS and line endings', () => {
  it('uses CRLF everywhere, never a bare LF', () => {
    const ics = contenuIcs(projet, new Date('2026-10-15T12:00:00Z'))
    expect(/(?<!\r)\n/.test(ics)).toBe(false)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })
  it('detects iPhone, iPad and touch Macs but not desktops', () => {
    expect(estIos({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', platform: 'iPhone', maxTouchPoints: 5 })).toBe(true)
    expect(estIos({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true)
    expect(estIos({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false)
    expect(estIos({ userAgent: 'Mozilla/5.0 (Windows NT 10.0)', platform: 'Win32', maxTouchPoints: 0 })).toBe(false)
  })
  it('handles half hours in the event time', () => {
    const ics = contenuIcs({ ...projet, heureDebut: 16.5, heureFin: 18 }, new Date('2026-10-15T12:00:00Z'))
    expect(ics).toContain('DTSTART;TZID=America/Toronto:20261022T163000')
    expect(libelleDate({ jour: '2026-10-22', heureDebut: 16.5, heureFin: 18 })).toBe('jeudi 22 octobre, 16 h 30 à 18 h')
  })
})

describe('lienGoogleAgenda', () => {
  it('uses local dates with the Toronto zone', () => {
    const url = new URL(lienGoogleAgenda(projet))
    expect(url.searchParams.get('dates')).toBe('20261022T190000/20261022T220000')
    expect(url.searchParams.get('ctz')).toBe('America/Toronto')
  })
})

describe('modeCalendrier (never a data: URL on iOS)', () => {
  const evenement = { evenementId: 'ev-01' }
  it('downloads a Blob on desktop and Android, whatever the project', () => {
    expect(modeCalendrier(projet, false, true)).toBe('telechargement')
    expect(modeCalendrier(evenement, false, false)).toBe('telechargement')
  })
  it('opens the prebuilt https file on iOS for a public event', () => {
    expect(modeCalendrier(evenement, true, true)).toBe('fichier')
    expect(cheminIcsStatique(evenement)).toBe('ics/ev-01.ics')
  })
  it('opens the prebuilt file on iOS for the scripted demo projects', () => {
    const cafe = { proposition: { id: 'prop-story-cafe-story-artiste+story-organisme' } }
    expect(modeCalendrier(cafe, true, true)).toBe('fichier')
    expect(cheminIcsStatique(cafe)).toBe('ics/demo-cafe.ics')
    expect(cheminIcsStatique({ proposition: { id: 'ouvert-demo-sofia' } })).toBe('ics/demo-corvee.ics')
    expect(cheminIcsStatique({ proposition: { id: 'ouvert-1760000000000' } })).toBeNull()
  })
  it('the static description points to the app instead of the live checklist', () => {
    const ics = contenuIcs(projet, new Date('2026-10-15T12:00:00Z'), true)
    expect(ics.replace(/\r\n /g, '')).toContain('Partenaires et liste à cocher dans Maillage.')
    expect(ics).not.toContain('[x]')
  })
  it('uses the share sheet on iOS for a project with a computed date, else Google Agenda', () => {
    expect(modeCalendrier(projet, true, true)).toBe('partage')
    expect(modeCalendrier(projet, true, false)).toBe('google')
    expect(cheminIcsStatique(projet)).toBeNull()
  })
  // Every engine proposal of the catalogue (title, pitch-day date, place) has a prebuilt file named by its key.
  const cafe = CATALOGUE_ICS.find((e) => e.titre === 'Exposition collaborative au Café Le Petit Détour') ?? CATALOGUE_ICS[0]
  const engin: Projet = { ...projet, ...cafe, id: `prop-story-cafe-p-galerie+p-salle|${cafe.titre}`, proposition: { id: 'prop-story-cafe-p-galerie+p-salle' } as Projet['proposition'] }
  it('opens the prebuilt file on iOS for an engine proposal of the catalogue', () => {
    expect(cafe).toBeDefined()
    expect(cheminIcsStatique(engin)).toBe(`ics/prop-${cleIcs(cafe)}.ics`)
    expect(modeCalendrier(engin, true, true)).toBe('fichier')
    expect(modeCalendrier(engin, false, true)).toBe('telechargement')
  })
  it('falls back to the share sheet when the date is not the prebuilt one or the project is user-created', () => {
    expect(cheminIcsStatique({ ...engin, jour: '2026-10-29' })).toBeNull()
    expect(cheminIcsStatique({ ...engin, lieuNom: 'Ailleurs' })).toBeNull()
    expect(cheminIcsStatique({ ...engin, proposition: { id: 'ouvert-1760000000000' } as Projet['proposition'] })).toBeNull()
    expect(cheminIcsStatique({ ...engin, proposition: undefined })).toBeNull()
  })
})

describe('cleIcs', () => {
  const base = { titre: 'Atelier ouvert au Café Le Petit Détour', jour: '2026-10-22', heureDebut: 19, heureFin: 22, lieuNom: 'Café Le Petit Détour' }
  it('is 8 hex characters, stable, and follows title, date and place', () => {
    expect(cleIcs(base)).toMatch(/^[0-9a-f]{8}$/)
    expect(cleIcs({ ...base })).toBe(cleIcs(base))
    expect(cleIcs({ ...base, jour: '2026-10-29' })).not.toBe(cleIcs(base))
    expect(cleIcs({ ...base, heureDebut: 18 })).not.toBe(cleIcs(base))
    expect(cleIcs({ ...base, lieuNom: '' })).not.toBe(cleIcs(base))
  })
  it('has no collision in the catalogue, and each entry sits on a pitch-day slot', () => {
    const cles = CATALOGUE_ICS.map(cleIcs)
    expect(new Set(cles).size).toBe(cles.length)
    for (const e of CATALOGUE_ICS) expect(['2026-10-21', '2026-10-22', '2026-10-24']).toContain(e.jour)
  })
  it('shares a text/calendar file with the same content', async () => {
    const f = fichierIcs(projet)
    expect(f.type).toBe('text/calendar')
    expect(f.name.endsWith('.ics')).toBe(true)
    expect(await f.text()).toContain('DTSTART;TZID=America/Toronto:20261022T190000')
  })
})
