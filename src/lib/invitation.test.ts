import { describe, expect, it } from 'vitest'
import { nomCourt } from './invitation'

describe('partner display name', () => {
  it('a citizen by first name, a business or organisation by its full name', () => {
    expect(nomCourt({ role: 'citoyen', nom: 'Camille Vézina' })).toBe('Camille')
    expect(nomCourt({ role: 'organisme', nom: 'Chorale Voix du Faubourg' })).toBe('Chorale Voix du Faubourg')
    expect(nomCourt({ role: 'commerce', nom: 'Café Le Petit Détour' })).toBe('Café Le Petit Détour')
  })
})
