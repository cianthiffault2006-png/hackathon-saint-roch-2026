export const CENTRE_SAINT_ROCH = { lat: 46.8155, lng: -71.2195 }
export const M_PAR_MIN = 80

export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000
  const rad = (x: number) => (x * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export const minutesAPied = (m: number) => Math.max(1, Math.ceil(m / M_PAR_MIN))

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967295
}

/** Déplace un point de 30 à 100 m, de façon stable pour un même id (citoyens: pas de position exacte). */
export function flou(id: string, lat: number, lng: number): { lat: number; lng: number } {
  const angle = hash(`a${id}`) * 2 * Math.PI
  const m = 30 + hash(`d${id}`) * 70
  return { lat: lat + (m * Math.cos(angle)) / 111320, lng: lng + (m * Math.sin(angle)) / (111320 * Math.cos((lat * Math.PI) / 180)) }
}
