// Inline SVG icons (24x24, stroke only), no dependency. Static markup, shared with the map pins.
export type NomIcone = 'commerce' | 'organisme' | 'citoyen' | 'lieu' | 'evenement'

export const CHEMINS: Record<NomIcone, string> = {
  commerce:
    '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v7h14v-7"/><path d="M10 20v-4h4v4"/>',
  organisme:
    '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15 14.2c.6-.2 1.3-.3 2-.3 2.2 0 4 1.8 4 4v2"/>',
  citoyen: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  lieu: '<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18"/>',
  evenement: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
}

function etoile(): string {
  const pts: string[] = []
  for (let k = 0; k < 10; k++) {
    const r = k % 2 === 0 ? 19 : 8.8
    const a = (-90 + k * 36) * (Math.PI / 180)
    pts.push(`${(20 + r * Math.cos(a)).toFixed(1)},${(21 + r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

// Shape + icon + colour: a pin is never told apart by colour alone.
const FORMES: Record<NomIcone, string> = {
  commerce: '<circle cx="20" cy="20" r="17"/>',
  organisme: '<rect x="3" y="3" width="34" height="34" rx="5"/>',
  citoyen: '<polygon points="20,1.5 38.5,20 20,38.5 1.5,20"/>',
  lieu: '<polygon points="20,2 36,11 36,29 20,38 4,29 4,11"/>',
  evenement: `<polygon points="${etoile()}"/>`,
}

export function svgPin(nom: NomIcone, taille = 40): string {
  const evenement = nom === 'evenement'
  const remplissage = `var(--couleur-${nom})`
  const contour = evenement ? 'var(--contour-evenement)' : '#fff'
  const traitIcone = evenement ? 'var(--contour-evenement)' : '#fff'
  const echelle = evenement ? 'translate(13.5 14.5) scale(0.55)' : 'translate(11 11) scale(0.75)'
  return `<svg width="${taille}" height="${taille}" viewBox="0 0 40 40" aria-hidden="true"><g style="fill:${remplissage};stroke:${contour};stroke-width:2;stroke-linejoin:round">${FORMES[nom]}</g><g transform="${echelle}" fill="none" stroke="${traitIcone}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${CHEMINS[nom]}</g></svg>`
}

export function PinForme({ nom, taille = 24 }: { nom: NomIcone; taille?: number }) {
  return <span className="forme" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgPin(nom, taille) }} />
}

export function svgIcone(nom: NomIcone, taille = 20): string {
  return `<svg width="${taille}" height="${taille}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CHEMINS[nom]}</svg>`
}

export default function Icone({ nom, taille = 20 }: { nom: NomIcone; taille?: number }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: CHEMINS[nom] }}
    />
  )
}
