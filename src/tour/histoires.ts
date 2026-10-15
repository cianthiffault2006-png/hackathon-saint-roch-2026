import type { Besoin, Profil } from '../types'
import { fr } from '../i18n/fr'
import { choixDepuisTexte, construireBesoin } from '../lib/besoin'
import { SOFIA } from './script'

/**
 * The suite's second story: Sofia, a resident, asks for help with graffiti and litter. The citizen role
 * plays Camille in the app, so the tour builds Sofia's need from her own profile, as the engine test does.
 */
export function besoinSofia(profils: Profil[]): Besoin | null {
  const sofia = profils.find((p) => p.id === SOFIA)
  if (!sofia) return null
  const texte = fr.visite.texteSofia
  const besoin = construireBesoin('citoyen', texte, profils, choixDepuisTexte('citoyen', texte, profils))
  return { ...besoin, auteurId: sofia.id, besoins: sofia.besoins, offres: sofia.offres, creneaux: sofia.creneaux, themes: sofia.themes, lat: sofia.lat, lng: sofia.lng }
}
