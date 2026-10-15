// Shared claim state: one in-memory copy, mirrored to localStorage (maillage.reclames), so every screen updates at once.
import { useSyncExternalStore } from 'react'
import { CLE_RECLAMES, avecReclamation, ecrireReclames, lireReclames, sansReclamation, type Reclamation, type Reclames, type Stockage } from './reclamation'

const abonnes = new Set<() => void>()
let memoire: Reclames | null = null

function stockage(): Stockage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function etat(): Reclames {
  if (memoire === null) memoire = lireReclames(stockage())
  return memoire
}

function publier(r: Reclames) {
  memoire = r
  ecrireReclames(stockage(), r)
  abonnes.forEach((f) => f())
}

function surStockage(e: StorageEvent) {
  if (e.key !== null && e.key !== CLE_RECLAMES) return
  memoire = lireReclames(stockage())
  abonnes.forEach((f) => f())
}

function abonner(f: () => void) {
  if (abonnes.size === 0) window.addEventListener('storage', surStockage)
  abonnes.add(f)
  return () => {
    abonnes.delete(f)
    if (abonnes.size === 0) window.removeEventListener('storage', surStockage)
  }
}

export function useReclames(): Reclames {
  return useSyncExternalStore(abonner, etat, etat)
}

export function enregistrerReclamation(id: string, rec: Reclamation) {
  publier(avecReclamation(etat(), id, rec))
}

export function annulerReclamation(id: string) {
  publier(sansReclamation(etat(), id))
}
