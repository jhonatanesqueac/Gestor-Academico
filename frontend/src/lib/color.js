// Devuelve texto blanco u oscuro según qué tan claro sea el color de fondo
export function colorTextoSobre(hex) {
  const limpio = (hex || '').replace('#', '')
  if (limpio.length !== 6) return '#fff'
  const r = parseInt(limpio.slice(0, 2), 16)
  const g = parseInt(limpio.slice(2, 4), 16)
  const b = parseInt(limpio.slice(4, 6), 16)
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminancia > 0.6 ? '#0C1614' : '#fff'
}