import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { Evenement, Lieu, Profil } from '../types'
import { proposerAu } from '../engine'
import { choixDepuisTexte, construireBesoin } from '../lib/besoin'
import { besoinSofia } from '../tour/histoires'
import { ROLE_VISITE, TEXTE_VISITE } from '../tour/script'
import { fusionnerAffichage, presentationDemandee, type Presentation } from './presentation'

const lire = <T,>(f: string) => JSON.parse(readFileSync(join('public', 'data', f), 'utf8')) as T
const profils = lire<Profil[]>('profils.json')
const lieux = lire<Lieu[]>('lieux.json')
const evenements = lire<Evenement[]>('evenements.json')
const jour = new Date('2026-10-16T12:00:00')
// Fake provided rows with the shape build_presentation.py writes (no real value here).
const fourni: Presentation = {
  profils: [
    { id: 'fourni-a', role: 'commerce', sousType: 'commerce', nom: 'Commerce fictif', description: 'x', lat: 46.8148, lng: -71.222, offres: ['espace_interieur', 'visibilite'], besoins: ['animation', 'contenu_artistique'], creneaux: ['semaine_soir'], themes: ['commerce_local', 'culture'], source: 'fourni', origine: 'Entreprises St-Roch', reclame: false, verifie: 'non', contactPublic: false },
    { id: 'fourni-b', role: 'citoyen', sousType: 'artiste', nom: 'Jamais affiché', description: 'x', lat: 46.8148, lng: -71.222, offres: [], besoins: [], creneaux: [], themes: [], source: 'fourni', origine: 'x', reclame: false, contactPublic: false },
  ],
  lieux: [{ id: 'fourni-l', nom: 'Salle fournie', type: 'salle', lat: 46.8148, lng: -71.222, offres: ['espace_interieur', 'public'], source: 'fourni', attribution: 'fourni' }],
  evenements: [],
}

describe('mode présentation', () => {
  it('ne se demande que par ?presentation=1', () => {
    expect(presentationDemandee('')).toBe(false)
    expect(presentationDemandee('?presentation=0')).toBe(false)
    expect(presentationDemandee('?x=1&presentation=1')).toBe(true)
  })
  it('les lignes fournies s’ajoutent à l’affichage, jamais les citoyens, jamais au moteur', () => {
    const d = { profils, lieux, evenements }
    const aff = fusionnerAffichage(d, fourni)
    expect(aff.profils.map((p) => p.id)).toContain('fourni-a')
    expect(aff.profils.map((p) => p.id)).not.toContain('fourni-b')
    expect(aff.lieux.map((l) => l.id)).toContain('fourni-l')
    expect(d.profils.some((p) => p.source === 'fourni')).toBe(false)
    expect(fusionnerAffichage(d, null).profils).toBe(profils)
  })
  it('les deux histoires restent identiques : café 87 %, Sofia 74 % (le moteur ne voit pas les lignes fournies)', () => {
    const besoin = construireBesoin(ROLE_VISITE, TEXTE_VISITE, profils, choixDepuisTexte(ROLE_VISITE, TEXTE_VISITE, profils))
    expect(proposerAu(besoin, profils, lieux, evenements, jour)[0].score).toBe(87)
    const s = proposerAu(besoinSofia(profils)!, profils, lieux, evenements, jour)[0]
    expect(s.score).toBe(74)
    expect(s.partenaires.map((x) => x.profilId)).toEqual(expect.arrayContaining(['p-sofia', 'p-proprete', 'p-etu-genie']))
  })
  it('garde : aucune donnée fournie dans le dépôt ni dans dist/', () => {
    expect(readFileSync('.gitignore', 'utf8')).toMatch(/^data-private\/$/m)
    const marche = (dir: string, out: string[] = []) => {
      for (const n of readdirSync(dir)) {
        const p = join(dir, n)
        if (statSync(p).isDirectory()) marche(p, out)
        else out.push(p.replace(/\\/g, '/'))
      }
      return out
    }
    for (const dir of ['public', 'src', 'data', 'scripts']) {
      for (const f of marche(dir)) expect(f).not.toMatch(/-reels\.json$|data-private/)
    }
    if (existsSync('dist')) for (const f of marche('dist')) expect(f).not.toMatch(/-reels\.json$|\/presentation\//)
  })
})
