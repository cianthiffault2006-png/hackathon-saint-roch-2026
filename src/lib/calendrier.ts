import { fr } from '../i18n/fr'
import { libelleDate } from './date'
import type { Projet } from './projets'

function heure(h: number): string {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return String(hh).padStart(2, '0') + String(mm).padStart(2, '0') + '00'
}

function debutFin(p: Projet): { debut: string; fin: string } {
  const jour = p.jour.replace(/-/g, '')
  return { debut: `${jour}T${heure(p.heureDebut)}`, fin: `${jour}T${heure(p.heureFin)}` }
}

export function lieuComplet(p: Projet): string {
  return p.lieuNom ? `${p.lieuNom}, Saint-Roch, Québec` : 'Saint-Roch, Québec'
}

export function descriptionProjet(p: Projet): string {
  const partenaires = p.partenaires.map((x) => `- ${x.nom} : ${x.apport}`).join('\n')
  const points = p.aConfirmer.map((x, i) => `${p.coches[i] ? '[x]' : '[ ]'} ${x}`).join('\n')
  return `${fr.ics.description}\n\n${fr.ics.partenaires} :\n${partenaires}\n\n${fr.ics.aConfirmer} :\n${points}`
}

function echapper(texte: string): string {
  return texte.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

// Lines over 75 octets must be folded; 60 characters keeps accented text safely under the limit.
function plier(ligne: string): string {
  const morceaux: string[] = []
  for (let i = 0; i < ligne.length; i += 60) morceaux.push(ligne.slice(i, i + 60))
  return morceaux.join('\r\n ')
}

const FUSEAU = [
  'BEGIN:VTIMEZONE',
  'TZID:America/Toronto',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:-0500',
  'TZOFFSETTO:-0400',
  'TZNAME:EDT',
  'DTSTART:19700308T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:-0400',
  'TZOFFSETTO:-0500',
  'TZNAME:EST',
  'DTSTART:19701101T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
]

export function contenuIcs(p: Projet, maintenant: Date = new Date()): string {
  const { debut, fin } = debutFin(p)
  const stamp = maintenant.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lignes = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Maillage//Demo//FR',
    'CALSCALE:GREGORIAN',
    ...FUSEAU,
    'BEGIN:VEVENT',
    `UID:${p.id.replace(/[^A-Za-z0-9]/g, '')}@maillage.demo`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=America/Toronto:${debut}`,
    `DTEND;TZID=America/Toronto:${fin}`,
    `SUMMARY:${echapper(p.titre)}`,
    `DESCRIPTION:${echapper(descriptionProjet(p))}`,
    `LOCATION:${echapper(lieuComplet(p))}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${echapper(fr.ics.rappel)}`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lignes.map(plier).join('\r\n') + '\r\n'
}

/** iPhone, iPad and iPadOS Safari (which reports itself as a Mac with a touch screen). */
export function estIos(nav: Pick<Navigator, 'userAgent' | 'platform' | 'maxTouchPoints'> = navigator): boolean {
  return /iPad|iPhone|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)
}

/**
 * Adds the event to the calendar without a backend. iOS Safari ignores a Blob download of .ics, but opens
 * its native « Ajouter au calendrier » sheet for a data: URL (the file keeps CRLF line endings).
 */
export function telechargerIcs(p: Projet): void {
  if (estIos()) {
    window.location.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(contenuIcs(p))
    return
  }
  const blob = new Blob([contenuIcs(p)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'maillage-projet.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export function lienGoogleAgenda(p: Projet): string {
  const { debut, fin } = debutFin(p)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: p.titre,
    dates: `${debut}/${fin}`,
    ctz: 'America/Toronto',
    details: descriptionProjet(p),
    location: lieuComplet(p),
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function resumePartage(p: Projet): { objet: string; texte: string } {
  const noms = p.partenaires.map((x) => x.nom).join(', ')
  return { objet: fr.fiche.objetPartage(p.titre), texte: fr.fiche.partageTexte(p.titre, libelleDate(p), noms) }
}
