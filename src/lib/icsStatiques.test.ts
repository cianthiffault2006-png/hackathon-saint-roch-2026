/// <reference types="node" />
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Evenement, Profil } from '../types'
import { STAMP_STATIQUE, cheminIcsStatique, contenuIcs } from './calendrier'
import { projetDepuisEvenement } from './projets'

// Keeps public/ics in sync with public/data/evenements.json. After a data change, regenerate with:
//   MAJ_ICS=1 npx vitest run src/lib/icsStatiques.test.ts
const lire = <T,>(nom: string): T[] => JSON.parse(readFileSync(join('public', 'data', `${nom}.json`), 'utf8')) as T[]

function attendus(): Map<string, string> {
  const profils = lire<Profil>('profils')
  const fichiers = new Map<string, string>()
  for (const e of lire<Evenement>('evenements')) {
    const p = projetDepuisEvenement(e, profils)
    fichiers.set(cheminIcsStatique(p) as string, contenuIcs(p, STAMP_STATIQUE))
  }
  return fichiers
}

describe('prebuilt public/ics files', () => {
  const fichiers = attendus()
  if (process.env.MAJ_ICS) {
    mkdirSync(join('public', 'ics'), { recursive: true })
    for (const [chemin, contenu] of fichiers) writeFileSync(join('public', chemin), contenu)
  }

  it('has exactly one file per public event', () => {
    const surDisque = readdirSync(join('public', 'ics')).map((f) => `ics/${f}`).sort()
    expect(surDisque).toEqual([...fichiers.keys()].sort())
  })
  it('matches what the app would generate, byte for byte (CRLF kept)', () => {
    for (const [chemin, contenu] of fichiers) expect(readFileSync(join('public', chemin), 'utf8')).toBe(contenu)
  })
})
