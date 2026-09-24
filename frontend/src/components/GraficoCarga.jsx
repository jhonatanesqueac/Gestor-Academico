import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function obtenerRangoSemanaActual() {
  const hoy = new Date()
  const diaSemana = hoy.getDay() // 0 = domingo, 1 = lunes, ...

  // Calculamos el lunes de esta semana (si hoy es domingo, retrocede 6 días)
  const inicioSemana = new Date(hoy)
  const offset = diaSemana === 0 ? -6 : 1 - diaSemana
  inicioSemana.setDate(hoy.getDate() + offset)
  inicioSemana.setHours(0, 0, 0, 0)

  // El domingo de esta semana, fin de día
  const finSemana = new Date(inicioSemana)
  finSemana.setDate(inicioSemana.getDate() + 6)
  finSemana.setHours(23, 59, 59, 999)

  return { inicioSemana, finSemana }
}

function agruparHorasPorAsignatura(tareas) {
  const { inicioSemana, finSemana } = obtenerRangoSemanaActual()

  // Filtramos solo las tareas que vencen esta semana
  const tareasDeLaSemana = tareas.filter((tarea) => {
    const fecha = new Date(tarea.fecha_entrega)
    return fecha >= inicioSemana && fecha <= finSemana
  })

  // Sumamos las horas de cada asignatura usando un objeto acumulador
  const acumulador = {}
  tareasDeLaSemana.forEach((tarea) => {
    const nombre = tarea.asignatura_nombre
    const horas = parseFloat(tarea.horas_estimadas)
    acumulador[nombre] = (acumulador[nombre] || 0) + horas
  })

  // Recharts espera un array de objetos, no un objeto plano
  return Object.entries(acumulador).map(([asignatura, horas]) => ({
    asignatura,
    horas,
  }))
}

function GraficoCarga({ tareas }) {
  const datos = agruparHorasPorAsignatura(tareas)
  const totalHoras = datos.reduce((suma, item) => suma + item.horas, 0)

  return (
    <div>
      <h2 style={{ marginBottom: '18px' }}>Carga académica de esta semana</h2>

      <div className="tarjeta" style={{ padding: '24px' }}>
        {datos.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No tienes tareas con entrega esta semana.</p>
        ) : (
          <>
            <p style={{ marginTop: 0 }}>
              Total:{' '}
              <strong style={{ color: 'var(--color-primary)' }}>{totalHoras.toFixed(1)} horas</strong>{' '}
              repartidas en {datos.length} {datos.length === 1 ? 'asignatura' : 'asignaturas'}
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datos}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="asignatura" tick={{ fontSize: 12 }} />
                <YAxis label={{ value: 'Horas', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                <Bar dataKey="horas" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  )
}

export default GraficoCarga