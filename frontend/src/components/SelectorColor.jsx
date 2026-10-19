import { Check, Pipette } from 'lucide-react'

const PALETA = [
  '#5B7065', '#4E6B78', '#3B5B92', '#2F7F79', '#5C7A29',
  '#96702E', '#8B3A2B', '#B0567A', '#6B5B95', '#7A6A58',
]

function SelectorColor({ valor, onCambio }) {
  const enPaleta = PALETA.some((c) => c.toLowerCase() === valor.toLowerCase())
  // Si la materia ya tiene un color propio (fuera de la paleta), se muestra primero
  const opciones = enPaleta ? PALETA : [valor, ...PALETA]

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {opciones.map((color) => {
        const activo = color.toLowerCase() === valor.toLowerCase()
        return (
          <button
            key={color}
            type="button"
            onClick={() => onCambio(color)}
            aria-label={`Color ${color}`}
            aria-pressed={activo}
            className="size-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
            style={{
              backgroundColor: color,
              boxShadow: activo ? '0 0 0 2px var(--popover), 0 0 0 4px var(--foreground)' : 'none',
            }}
          >
            {activo && <Check size={14} color="#fff" strokeWidth={3} />}
          </button>
        )
      })}

      <label
        title="Color personalizado"
        className="relative size-7 rounded-full border border-dashed border-input flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground"
      >
        <Pipette size={13} />
        <input
          type="color"
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
    </div>
  )
}

export default SelectorColor