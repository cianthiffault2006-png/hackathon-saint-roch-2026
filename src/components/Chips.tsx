import { useState } from 'react'
import { fr } from '../i18n/fr'

interface Props<T extends string> {
  options: T[]
  selected: T[]
  libelle: Record<T, string>
  onToggle: (valeur: T) => void
  label: string
  /** Options always shown; the others hide behind a « Plus » toggle (selected ones stay visible). */
  communes?: T[]
}

export default function Chips<T extends string>({ options, selected, libelle, onToggle, label, communes }: Props<T>) {
  const [ouvert, setOuvert] = useState(false)
  const repliable = communes !== undefined && communes.length < options.length
  const visibles = !repliable || ouvert ? options : options.filter((o) => communes.includes(o) || selected.includes(o))

  return (
    <div role="group" aria-label={label} className="chips">
      {visibles.map((o) => {
        const actif = selected.includes(o)
        return (
          <button
            key={o}
            type="button"
            className={actif ? 'chip chip-on' : 'chip'}
            aria-pressed={actif}
            onClick={() => onToggle(o)}
          >
            {libelle[o]}
          </button>
        )
      })}
      {repliable && (
        <button type="button" className="chip chip-plus" aria-expanded={ouvert} onClick={() => setOuvert(!ouvert)}>
          {ouvert ? fr.besoin.moins : fr.besoin.plus}
        </button>
      )}
    </div>
  )
}
