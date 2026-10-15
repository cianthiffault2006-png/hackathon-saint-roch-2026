// localStorage with an in-memory fallback (private mode, blocked storage).
const memoire = new Map<string, string>()

export function lire<T>(cle: string, defaut: T): T {
  try {
    const brut = window.localStorage.getItem(cle) ?? memoire.get(cle)
    return brut ? (JSON.parse(brut) as T) : defaut
  } catch {
    try {
      const m = memoire.get(cle)
      return m ? (JSON.parse(m) as T) : defaut
    } catch {
      return defaut
    }
  }
}

export function ecrire<T>(cle: string, valeur: T): void {
  const brut = JSON.stringify(valeur)
  memoire.set(cle, brut)
  try {
    window.localStorage.setItem(cle, brut)
  } catch {
    // Stays in memory for this visit.
  }
}
