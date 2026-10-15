interface Props<T extends string> {
  options: T[]
  selected: T[]
  libelle: Record<T, string>
  onToggle: (valeur: T) => void
  label: string
}

export default function Chips<T extends string>({ options, selected, libelle, onToggle, label }: Props<T>) {
  return (
    <div role="group" aria-label={label} className="chips">
      {options.map((o) => {
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
    </div>
  )
}
