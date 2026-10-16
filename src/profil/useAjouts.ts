// Shared add-request state: one in-memory copy, mirrored to localStorage (maillage.ajouts), like useReclames.
import { useSyncExternalStore } from 'react'
import { CLE_AJOUTS, ecrireAjouts, lireAjouts, type DemandeAjout, type Stockage } from './ajout'

const abonnes = new Set<() => void>()
let memoire: DemandeAjout[] | null = null

function stockage(): Stockage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function etat(): DemandeAjout[] {
  if (memoire === null) memoire = lireAjouts(stockage())
  return memoire
}

function publier(liste: DemandeAjout[]) {
  memoire = liste
  ecrireAjouts(stockage(), liste)
  abonnes.forEach((f) => f())
}

function surStockage(e: StorageEvent) {
  if (e.key !== null && e.key !== CLE_AJOUTS) return
  memoire = lireAjouts(stockage())
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

export function useAjouts(): DemandeAjout[] {
  return useSyncExternalStore(abonner, etat, etat)
}

export function enregistrerAjout(d: DemandeAjout) {
  publier([...etat().filter((x) => x.id !== d.id), d])
}

export function annulerAjout(id: string) {
  publier(etat().filter((x) => x.id !== id))
}
