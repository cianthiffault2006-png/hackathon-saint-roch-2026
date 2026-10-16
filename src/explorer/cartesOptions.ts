// « Plus d'options »: what the list shows, kept pure for the tests. The engine's output is not changed here.
import type { Profil, Proposition } from '../types'
import { t } from './textes'

export const MAX_CARTES = 12

/** A citizen never shows a name: « Citoyen · artiste », so two citizens still read differently. */
export function nomPublic(p: Profil | undefined, id: string): string {
  if (!p) return id
  return p.role === 'citoyen' ? `${t.citoyen} · ${p.sousType}` : p.nom
}

/** Same title and same partners: one card. Then the best `max` by score (the input is already sorted by score). */
export function retenirCartes<T extends { p: Proposition }>(cartes: T[], max = MAX_CARTES): T[] {
  const vues = new Set<string>()
  const out: T[] = []
  for (const c of cartes) {
    const cle = `${c.p.titre}|${[...c.p.partenaires.map((x) => x.profilId)].sort().join(',')}`
    if (vues.has(cle)) continue
    vues.add(cle)
    out.push(c)
    if (out.length >= max) break
  }
  return out
}
