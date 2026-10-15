/// <reference types="node" />
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { proposer } from '../engineAdapter'
import { t } from '../projet/textes'
import { ROLE_VISITE, TEXTE_VISITE } from '../tour/script'
import type { Evenement, Lieu, Profil, Proposition } from '../types'
import { choixDepuisTexte, construireBesoin } from './besoin'
import { prochaineDate } from './date'
import { STAMP_STATIQUE, cheminIcsStatique, contenuIcs } from './calendrier'
import { DEMOS, ID_DEMO_SOFIA, projetDepuis, projetDepuisEvenement, type Projet } from './projets'

// Keeps public/ics in sync with public/data/evenements.json and the scripted demo projects. After a data change, regenerate with:
//   MAJ_ICS=1 npx vitest run src/lib/icsStatiques.test.ts
const lire = <T,>(nom: string): T[] => JSON.parse(readFileSync(join('public', 'data', `${nom}.json`), 'utf8')) as T[]

const profils = lire<Profil>('profils')
const lieux = lire<Lieu>('lieux')
const evenements = lire<Evenement>('evenements')

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

function attendus(): Map<string, string> {
  const projets = [...evenements.map((e) => projetDepuisEvenement(e, profils)), projetCafe(), projetSofia()]
  return new Map(projets.map((p) => [cheminIcsStatique(p) as string, contenuIcs(p, STAMP_STATIQUE, true)]))
}

describe('prebuilt public/ics files', () => {
  const fichiers = attendus()
  if (process.env.MAJ_ICS) {
    mkdirSync(join('public', 'ics'), { recursive: true })
    for (const [chemin, contenu] of fichiers) writeFileSync(join('public', chemin), contenu)
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
    const jourPitch = new Date('2026-10-16T16:00:00Z')
    expect(DEMOS[projetCafe().proposition?.id as string].date).toEqual(prochaineDate('semaine_soir', jourPitch))
    expect(DEMOS[ID_DEMO_SOFIA].date).toEqual(prochaineDate('fin_de_semaine', jourPitch))
  })
  it('has exactly one file per public event and demo project', () => {
    const surDisque = readdirSync(join('public', 'ics')).map((f) => `ics/${f}`).sort()
    expect(surDisque).toEqual([...fichiers.keys()].sort())
  })
  it('matches what the app would generate, byte for byte (CRLF kept)', () => {
    for (const [chemin, contenu] of fichiers) expect(readFileSync(join('public', chemin), 'utf8')).toBe(contenu)
  })
})
