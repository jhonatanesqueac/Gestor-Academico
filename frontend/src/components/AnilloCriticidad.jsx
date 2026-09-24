function bandaColor(nivel) {
  if (nivel >= 70) return 'var(--destructive)'
  if (nivel >= 40) return 'var(--media)'
  return 'var(--ok)'
}

function AnilloCriticidad({ nivel, tamaño = 44 }) {
  const grosor = 3.5
  const radio = (tamaño - grosor) / 2
  const circunferencia = 2 * Math.PI * radio
  const progreso = Math.max(0, Math.min(100, nivel))
  const offset = circunferencia * (1 - progreso / 100)
  const color = bandaColor(nivel)

  return (
    <div style={{ position: 'relative', width: tamaño, height: tamaño, flexShrink: 0 }}>
      <svg width={tamaño} height={tamaño} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={tamaño / 2}
          cy={tamaño / 2}
          r={radio}
          fill="none"
          stroke="var(--border)"
          strokeWidth={grosor}
        />
        <circle
          cx={tamaño / 2}
          cy={tamaño / 2}
          r={radio}
          fill="none"
          stroke={color}
          strokeWidth={grosor}
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div
        className="num-tabular"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: tamaño >= 44 ? '12px' : '10.5px',
          fontWeight: 700,
          color,
        }}
      >
        {Math.round(nivel)}
      </div>
    </div>
  )
}

export default AnilloCriticidad