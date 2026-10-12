// El "día de la entrega" termina a las 23:59:59 de esa fecha, no en el
// instante exacto de la hora que se puso al crear la tarea.
function finDelDia(fechaISO) {
  const f = new Date(fechaISO)
  f.setHours(23, 59, 59, 999)
  return f
}

// Una tarea deja el Tablero recién cuando termina el día de su entrega,
// sin importar si se marcó como terminada o no.
export function haPasadoSuDia(tarea) {
  return finDelDia(tarea.fecha_entrega) < new Date()
}

// "Vencida" = su día ya pasó y nunca se marcó como terminada.
export function esVencida(tarea) {
  return tarea.estado !== 'TERMINADO' && haPasadoSuDia(tarea)
}