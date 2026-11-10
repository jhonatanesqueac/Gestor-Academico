import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

const MotionCard = motion.create(Card)

function obtenerRangoSemanaActual() {
  const hoy = new Date()
  const diaSemana = hoy.getDay()
  const inicioSemana = new Date(hoy)
  const offset = diaSemana === 0 ? -6 : 1 - diaSemana
  inicioSemana.setDate(hoy.getDate() + offset)
  inicioSemana.setHours(0, 0, 0, 0)
  const finSemana = new Date(inicioSemana)
  finSemana.setDate(inicioSemana.getDate() + 6)
  finSemana.setHours(23, 59, 59, 999)
  return { inicioSemana, finSemana }
}

function agruparHorasPorAsignatura(tareas) {
  const { inicioSemana, finSemana } = obtenerRangoSemanaActual()
  const tareasDeLaSemana = tareas.filter((tarea) => {
    const fecha = new Date(tarea.fecha_entrega)
    return fecha >= inicioSemana && fecha <= finSemana
  })

  const acumulador = {}
  tareasDeLaSemana.forEach((tarea) => {
    const nombre = tarea.asignatura_nombre
    const horas = parseFloat(tarea.horas_estimadas)
    if (!acumulador[nombre]) {
      acumulador[nombre] = { horas: 0, color: tarea.asignatura_color || 'var(--primary)' }
    }
    acumulador[nombre].horas += horas
  })

  return Object.entries(acumulador).map(([asignatura, datos]) => ({
    asignatura,
    horas: datos.horas,
    color: datos.color,
  }))
}

function TooltipPersonalizado({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="panel-flotante px-3 py-2 text-[12.5px]">
      <div className="font-medium mb-0.5">{item.asignatura}</div>
      <div className="text-muted-foreground num-tabular">{item.horas} horas</div>
    </div>
  )
}

function GraficoCarga({ tareas }) {
  const datos = agruparHorasPorAsignatura(tareas)
  const totalHoras = datos.reduce((suma, item) => suma + item.horas, 0)

  return (
    <div>
      <div className="mb-5">
        <h2 style={{ fontSize: 28, letterSpacing: '-0.045em' }}>Carga semanal</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Horas estimadas por asignatura, para las entregas de esta semana.
        </p>
      </div>

      <MotionCard
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="shadow-none rounded-3xl"
      >
        <CardContent className="p-5">
          {datos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No tienes tareas con entrega esta semana.
            </p>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5 mb-4">
                <span className="text-[38px] font-semibold num-tabular" style={{ letterSpacing: '-0.05em' }}>{Number(totalHoras.toFixed(1))}</span>
                <span className="text-[13px] text-muted-foreground">
                  horas repartidas en {datos.length} {datos.length === 1 ? 'asignatura' : 'asignaturas'}
                </span>
              </div>

              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={datos} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="asignatura"
                    tick={{ fontSize: 11.5, fill: 'var(--muted-foreground)' }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11.5, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Horas', angle: -90, position: 'insideLeft', fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <Tooltip cursor={{ fill: 'var(--muted)' }} content={<TooltipPersonalizado />} />
                  <Bar dataKey="horas" radius={[10, 10, 0, 0]} maxBarSize={56} animationDuration={900} animationEasing="ease-out">
                    {datos.map((item, i) => (
                      <Cell key={i} fill={item.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </MotionCard>
    </div>
  )
}

export default GraficoCarga