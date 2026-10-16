/// <reference types="node" />
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { proposer } from '../engineAdapter'
import { fr } from '../i18n/fr'
import { CRENEAUX, TAGS } from '../labels'
import { t } from '../projet/textes'
import { besoinSofia } from '../tour/histoires'
import { ROLE_VISITE, TEXTE_VISITE } from '../tour/script'
import type { Besoin, Creneau, Evenement, Lieu, Profil, Proposition, Role, Tag } from '../types'
import { choixDepuisTexte, construireBesoin } from './besoin'
import { prochaineDate } from './date'
import { STAMP_STATIQUE, cheminIcsStatique, cleIcs, contenuIcs, type ContenuIcs } from './calendrier'
import { CATALOGUE_ICS } from './icsCatalogue'
import { DEMOS, ID_DEMO_SOFIA, dateProposee, projetDepuis, projetDepuisEvenement, type Projet } from './projets'

// Keeps public/ics in sync with public/data/evenements.json, the scripted demo projects and the engine catalogue
// (src/lib/icsCatalogue.ts). After a data or engine change, regenerate (about 2 minutes), then run the tests again:
//   MAJ_ICS=1 npx vitest run src/lib/icsStatiques.test.ts
const lire = <T,>(nom: string): T[] => JSON.parse(readFileSync(join('public', 'data', `${nom}.json`), 'utf8')) as T[]

const profils = lire<Profil>('profils')
const lieux = lire<Lieu>('lieux')
const evenements = lire<Evenement>('evenements')

/** Pitch day: the catalogue dates are what prochaineDate gives that day, like the DEMOS ones. */
const JOUR_PITCH = new Date('2026-10-16T16:00:00Z')
const ROLES: Role[] = ['commerce', 'organisme', 'citoyen']

/** Story 1, as the tour and the « Commerçant » path build it: the engine's first proposition. */
function projetCafe(): Projet {
  const besoin = construireBesoin(ROLE_VISITE, TEXTE_VISITE, profils, choixDepuisTexte(ROLE_VISITE, TEXTE_VISITE, profils))
  return projetDepuis(proposer(besoin, profils, lieux, evenements)[0], profils, lieux, 'confirmee')
}

/** Story 2, as Nouveau projet's « Exemple » creates it (the invited partners vary, the file does not list them). */
function projetSofia(): Projet {
  const prop: Proposition = {
    id: ID_DEMO_SOFIA, titre: t.exemple.titre, type: 'corvee_proprete', partenaires: [], creneau: 'fin_de_semaine',
    score: 0, raisons: [], aConfirmer: [], evenementsProches: [], statut: 'proposee',
  }
  return projetDepuis(prop, profils, lieux, 'proposee')
}

/** An engine proposition as the Fiche shows it on pitch day: title, date of its créneau, place. */
function contenu(p: Proposition): ContenuIcs {
  const { titre, lieuNom } = projetDepuis(p, profils, lieux, 'proposee')
  return { titre, lieuNom, ...(DEMOS[p.id]?.date ?? prochaineDate(p.creneau, JOUR_PITCH)) }
}

/** The project a catalogue entry stands for; its UID comes from the key, so the file never depends on the partners. */
function projetCatalogue(e: ContenuIcs): Projet {
  return { ...e, id: `prop-${cleIcs(e)}`, statut: 'proposee', partenaires: [], aConfirmer: [], coches: [] }
}

/** « Plus d'options »: the engine again without the partners already proposed, like explorer/PlusOptions. */
function avecPlusDOptions(besoin: Besoin): Proposition[] {
  const vues = new Map<string, Proposition>()
  let reste = profils
  for (let tour = 0; tour < 8; tour++) {
    const nouvelles = proposer(besoin, reste, lieux, evenements).filter((p) => !vues.has(p.id))
    if (!nouvelles.length) break
    nouvelles.forEach((p) => vues.set(p.id, p))
    const retires = new Set(nouvelles.flatMap((p) => p.partenaires.map((c) => c.profilId)))
    retires.delete(besoin.auteurId ?? '')
    reste = reste.filter((p) => !retires.has(p.id))
  }
  return [...vues.values()]
}

function besoinDe(role: Role, texte: string, cherche: Tag[] = [], offre: Tag[] = [], crs: Creneau[] = []): Besoin {
  const lu = choixDepuisTexte(role, texte, profils)
  return construireBesoin(role, texte, profils, { cherche: [...lu.cherche, ...cherche], offre: [...lu.offre, ...offre], creneaux: [...lu.creneaux, ...crs] })
}

const placeholder = (role: Role) => fr.besoin.placeholders[role].replace(/^Ex\. : /, '')

/**
 * The reachable engine proposals, by content: for each role, the texts (empty, placeholder, one word per theme,
 * the café text) with every single or pair of « je cherche » chips, every single « j'offre » chip and every single
 * créneau; « Plus d'options » for the single chips without text; the two stories. The input space is not finite
 * (free text, three chips and more), so a proposal outside this sample keeps the share sheet.
 */
function enumererCatalogue(): ContenuIcs[] {
  const mots = ['', 'culture', 'jeunes', 'etudiants', 'environnement', 'securite', 'sport', 'quartier', 'commerces', 'cuisine', 'artistes']
  const seuls: Tag[][] = [[], ...TAGS.map((x) => [x])]
  const paires: Tag[][] = TAGS.flatMap((x, i) => TAGS.slice(i + 1).map((y) => [x, y]))
  const creneaux: Creneau[][] = [[], ...CRENEAUX.map((c) => [c])]
  const vus = new Map<string, ContenuIcs>()
  const noter = (props: Proposition[]) => { for (const p of props) { const c = contenu(p); vus.set(cleIcs(c), c) } }
  for (const role of ROLES) {
    const textes = [...mots, placeholder(role), ...(role === ROLE_VISITE ? [TEXTE_VISITE] : [])]
    for (const texte of textes) for (const c of seuls) for (const o of seuls) for (const cr of creneaux) noter(proposer(besoinDe(role, texte, c, o, cr), profils, lieux, evenements))
    for (const c of paires) for (const o of seuls) for (const cr of creneaux) noter(proposer(besoinDe(role, '', c, o, cr), profils, lieux, evenements))
    for (const c of seuls) for (const o of seuls) for (const cr of creneaux) noter(avecPlusDOptions(besoinDe(role, '', c, o, cr)))
    noter(avecPlusDOptions(besoinDe(role, placeholder(role))))
  }
  const sofia = besoinSofia(profils)
  if (sofia) noter(avecPlusDOptions(sofia))
  return [...vus.values()].sort((a, b) => a.titre.localeCompare(b.titre, 'fr') || a.jour.localeCompare(b.jour) || a.lieuNom.localeCompare(b.lieuNom, 'fr'))
}

function ecrireCatalogue(entrees: ContenuIcs[]): void {
  const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  const ligne = (e: ContenuIcs) => `  { titre: ${q(e.titre)}, jour: '${e.jour}', heureDebut: ${e.heureDebut}, heureFin: ${e.heureFin}, lieuNom: ${q(e.lieuNom)} },`
  const texte = [
    '// Generated by `MAJ_ICS=1 npx vitest run src/lib/icsStatiques.test.ts`: do not edit by hand.',
    '// Engine proposals reachable from the roles\' chips and texts, at the pitch-day dates; one prebuilt public/ics/prop-<cle>.ics each.',
    "import type { ContenuIcs } from './calendrier'",
    '',
    'export const CATALOGUE_ICS: ContenuIcs[] = [',
    ...entrees.map(ligne),
    ']',
    '',
  ].join('\n')
  writeFileSync(join('src', 'lib', 'icsCatalogue.ts'), texte)
}

const MAJ = !!process.env.MAJ_ICS
const catalogue = MAJ ? enumererCatalogue() : CATALOGUE_ICS

function attendus(): Map<string, string> {
  const projets = [...evenements.map((e) => projetDepuisEvenement(e, profils)), projetCafe(), projetSofia()]
  const fixes = projets.map((p) => [cheminIcsStatique(p) as string, contenuIcs(p, STAMP_STATIQUE, true)] as const)
  const engin = catalogue.map((e) => [`ics/prop-${cleIcs(e)}.ics`, contenuIcs(projetCatalogue(e), STAMP_STATIQUE, true)] as const)
  return new Map([...fixes, ...engin])
}

describe('prebuilt public/ics files', () => {
  const fichiers = attendus()
  if (MAJ) {
    rmSync(join('public', 'ics'), { recursive: true, force: true })
    mkdirSync(join('public', 'ics'), { recursive: true })
    for (const [chemin, contenu] of fichiers) writeFileSync(join('public', chemin), contenu)
    ecrireCatalogue(catalogue)
  }

  it('covers every scripted demo project, with its fixed date', () => {
    const cafe = projetCafe()
    expect(cafe.titre).toBe('Exposition collaborative au Café Le Petit Détour')
    expect(Object.keys(DEMOS)).toEqual([cafe.proposition?.id, ID_DEMO_SOFIA])
    expect(cafe).toMatchObject({ jour: '2026-10-22', heureDebut: 19, heureFin: 22 })
    expect(projetSofia()).toMatchObject({ jour: '2026-10-24', heureDebut: 13, heureFin: 17 })
    expect(fichiers.get('ics/demo-cafe.ics')).toContain('DTSTART;TZID=America/Toronto:20261022T190000')
    expect(fichiers.get('ics/demo-corvee.ics')).toContain('SUMMARY:Corvée graffitis rue Saint-Joseph')
  })
  it('fixes the demo dates to what prochaineDate gives on pitch day (Oct 16)', () => {
    expect(DEMOS[projetCafe().proposition?.id as string].date).toEqual(prochaineDate('semaine_soir', JOUR_PITCH))
    expect(DEMOS[ID_DEMO_SOFIA].date).toEqual(prochaineDate('fin_de_semaine', JOUR_PITCH))
  })
  it('has exactly one file per public event, demo project and catalogue entry', () => {
    const surDisque = readdirSync(join('public', 'ics')).map((f) => `ics/${f}`).sort()
    expect(surDisque).toEqual([...fichiers.keys()].sort())
  })
  it('matches what the app would generate, byte for byte (CRLF kept)', () => {
    for (const [chemin, contenu] of fichiers) expect(readFileSync(join('public', chemin), 'utf8')).toBe(contenu)
  })
})

describe('engine catalogue (src/lib/icsCatalogue.ts)', () => {
  const slots = CRENEAUX.map((c) => prochaineDate(c, JOUR_PITCH))
  it('holds a few hundred entries, each at a pitch-day slot, without duplicate', () => {
    expect(catalogue.length).toBeGreaterThan(100)
    expect(new Set(catalogue.map(cleIcs)).size).toBe(catalogue.length)
    for (const e of catalogue) {
      expect(slots).toContainEqual({ jour: e.jour, heureDebut: e.heureDebut, heureFin: e.heureFin })
      expect(e.titre.length).toBeGreaterThan(0)
    }
  })
  it.skipIf(MAJ)('covers each role from its placeholder text with « Plus d\'options », and both stories', () => {
    const chemins = (besoin: Besoin) => avecPlusDOptions(besoin).map((p) => {
      // On pitch day the Fiche shows the catalogue date, so the prebuilt file is the one opened.
      expect(dateProposee(p)).toEqual(prochaineDate(p.creneau, JOUR_PITCH))
      return cheminIcsStatique({ ...projetDepuis(p, profils, lieux, 'proposee'), ...contenu(p) })
    })
    for (const role of ROLES) {
      const trouves = chemins(besoinDe(role, placeholder(role)))
      expect(trouves.length).toBeGreaterThan(2)
      for (const c of trouves) expect(c).toMatch(/^ics\/(demo-cafe|prop-[0-9a-f]{8})\.ics$/)
    }
    expect(chemins(besoinDe(ROLE_VISITE, TEXTE_VISITE))[0]).toBe('ics/demo-cafe.ics')
    for (const c of chemins(besoinSofia(profils) as Besoin)) expect(c).toMatch(/^ics\/prop-[0-9a-f]{8}\.ics$/)
  })
  it('prebuilt engine files are valid French calendars: VCALENDAR, Toronto DTSTART/DTEND, stable UID, CRLF, SUMMARY and LOCATION', () => {
    const heure = (h: number) => `${String(h).padStart(2, '0')}0000`
    for (const e of catalogue.filter((_, i) => i % 7 === 0)) {
      const ics = readFileSync(join('public', 'ics', `prop-${cleIcs(e)}.ics`), 'utf8')
      const plat = ics.replace(/\r\n /g, '')
      expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true)
      expect(ics.endsWith('END:VEVENT\r\nEND:VCALENDAR\r\n')).toBe(true)
      expect(/(?<!\r)\n/.test(ics)).toBe(false)
      expect(plat).toContain('BEGIN:VTIMEZONE\r\nTZID:America/Toronto')
      expect(plat).toContain(`DTSTART;TZID=America/Toronto:${e.jour.replace(/-/g, '')}T${heure(e.heureDebut)}`)
      expect(plat).toContain(`DTEND;TZID=America/Toronto:${e.jour.replace(/-/g, '')}T${heure(e.heureFin)}`)
      expect(plat).toContain(`UID:prop${cleIcs(e)}@maillage.demo`)
      expect(plat).toContain(`SUMMARY:${e.titre.replace(/,/g, '\\,')}`)
      expect(plat).toContain(`LOCATION:${`${e.lieuNom ? `${e.lieuNom}, ` : ''}Saint-Roch, Québec`.replace(/,/g, '\\,')}`)
      expect(plat).toContain('DESCRIPTION:Projet Maillage (démo simulée).')
      expect(plat).toContain('Partenaires et liste à cocher dans Maillage.')
    }
  })
})
