import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ArrowRight, ListChecks, Clock, CalendarClock, TrendingUp } from 'lucide-react'
import api from '../api/axios'
import AnilloCriticidad from './AnilloCriticidad'
import { esVencida } from '../lib/tareas'

function datosSemana(tareas) {
  const hoy = new Date()
  const inicio = new Date(hoy)
  inicio.setDate(hoy.getDate() + (hoy.getDay() === 0 ? -6 : 1 - hoy.getDay()))
  inicio.setHours(0, 0, 0, 0)
  const etiquetas = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return etiquetas.map((etiqueta, i) => {
    const dia = new Date(inicio)
    dia.setDate(inicio.getDate() + i)
    const cantidad = tareas.filter((t) => new Date(t.fecha_entrega).toDateString() === dia.toDateString()).length
    return { dia: etiqueta, tareas: cantidad }
  })
}

function StatCard({ Icono, etiqueta, valor, detalle }) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-accent flex items-center justify-center shrink-0">
          <Icono size={16} className="text-accent-foreground" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-muted-foreground font-medium truncate">{etiqueta}</div>
          <div className="text-[17px] font-semibold num-tabular leading-tight">{valor}</div>
          {detalle && <div className="text-[11px] text-muted-foreground truncate">{detalle}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

function LineaDeTiempo({ tarea }) {
  const inicio = new Date(tarea.creado_en)
  const fin = new Date(tarea.fecha_entrega)
  const ahora = new Date()
  const total = fin - inicio || 1
  const avance = Math.max(0, Math.min(100, ((ahora - inicio) / total) * 100))

  const formato = (f) => f.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })

  return (
    <div className="w-full">
      <div className="relative h-1 rounded-full bg-muted mb-1.5">
        <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${avance}%` }} />
        <div
          className="absolute -top-1 w-3 h-3 rounded-full bg-primary border-2 border-card"
          style={{ left: `calc(${avance}% - 6px)` }}
        />
      </div>
      <div className="flex justify-between text-[10.5px] text-muted-foreground">
        <span>{formato(inicio)}</span>
        <span className="font-medium text-foreground">Hoy</span>
        <span>{formato(fin)}</span>
      </div>
    </div>
  )
}

function FilaProgreso({ tarea }) {
  return (
    <div className="flex items-center gap-3 py-3.5 border-b last:border-b-0 border-border/60">
      <AnilloCriticidad nivel={tarea.nivel_criticidad} tamaño={32} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[12.5px] font-medium truncate">{tarea.titulo}</span>
          <span className="text-[10.5px] text-muted-foreground whitespace-nowrap ml-2">
            {new Date(tarea.fecha_entrega).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: `${tarea.nivel_criticidad}%` }} />
        </div>
      </div>
    </div>
  )
}

function FilaVencimiento({ tarea }) {
  const color = tarea.asignatura_color || 'var(--primary)'
  return (
    <div className="flex items-center gap-3 py-3 px-1 border-b last:border-b-0 border-border/60">
      <div className="flex-1 min-w-0">
        <span
          className="inline-block text-[9.5px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1.5"
          style={{
            backgroundColor: `color-mix(in oklab, ${color} 16%, var(--card))`,
            color: `color-mix(in oklab, ${color} 65%, var(--foreground))`,
          }}
        >
          {tarea.asignatura_nombre}
        </span>
        <div className="text-[13px] font-medium truncate">{tarea.titulo}</div>
      </div>
      <div className="text-[11px] text-muted-foreground whitespace-nowrap self-start pt-0.5">
        {new Date(tarea.fecha_entrega).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
      </div>
    </div>
  )
}

function Inicio({ tareas, onTareaActualizada, onCambiarPestaña }) {
  const activas = tareas.filter((t) => t.estado !== 'TERMINADO' && !esVencida(t))
  const destacada = activas[0]
  const resumen = activas.slice(1, 5)
  const proximos = [...activas].sort((a, b) => new Date(a.fecha_entrega) - new Date(b.fecha_entrega)).slice(0, 7)
  const serie = datosSemana(tareas)

  const terminadas = tareas.filter((t) => t.estado === 'TERMINADO').length
  const progreso = tareas.length > 0 ? Math.round((terminadas / tareas.length) * 100) : 0

  const inicioSemana = (() => {
    const hoy = new Date()
    const d = new Date(hoy)
    d.setDate(hoy.getDate() + (hoy.getDay() === 0 ? -6 : 1 - hoy.getDay()))
    d.setHours(0, 0, 0, 0)
    return d
  })()
  const finSemana = new Date(inicioSemana)
  finSemana.setDate(inicioSemana.getDate() + 6)
  finSemana.setHours(23, 59, 59, 999)
  const horasEstaSemana = tareas
    .filter((t) => {
      const f = new Date(t.fecha_entrega)
      return f >= inicioSemana && f <= finSemana
    })
    .reduce((suma, t) => suma + parseFloat(t.horas_estimadas), 0)

  const proximaEntregaDias = destacada
    ? Math.max(0, Math.ceil((new Date(destacada.fecha_entrega) - new Date()) / 86400000))
    : null

  const siguienteEstado = { PENDIENTE: 'EN_PROCESO', EN_PROCESO: 'TERMINADO' }
  const handleAvanzar = async (tarea) => {
    const nuevoEstado = siguienteEstado[tarea.estado]
    if (!nuevoEstado) return
    try {
      const response = await api.patch(`tareas/${tarea.id}/`, { estado: nuevoEstado })
      onTareaActualizada(response.data)
    } catch (error) {
      console.error('Error actualizando tarea:', error)
    }
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard Icono={ListChecks} etiqueta="Tareas activas" valor={activas.length} />
        <StatCard Icono={Clock} etiqueta="Horas esta semana" valor={horasEstaSemana.toFixed(1)} />
        <StatCard Icono={CalendarClock} etiqueta="Próxima entrega" valor={proximaEntregaDias === null ? '—' : proximaEntregaDias === 0 ? 'Hoy' : `${proximaEntregaDias}d`} />
        <StatCard Icono={TrendingUp} etiqueta="Progreso general" valor={`${progreso}%`} detalle={`${terminadas} de ${tareas.length} terminadas`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr_1fr] gap-6 items-stretch">
        {/* Enfoque semanal */}
        <div className="flex flex-col">
          <h3 className="text-[13px] font-semibold text-muted-foreground mb-3">Enfoque semanal</h3>
          {destacada ? (
            <Card className="shadow-none flex-1">
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex flex-col items-center text-center mb-5">
                  <AnilloCriticidad nivel={destacada.nivel_criticidad} tamaño={92} />
                  <div className="text-[15px] font-semibold mt-3">{destacada.titulo}</div>
                  <div className="text-[11.5px] text-muted-foreground uppercase tracking-wide">
                    {destacada.asignatura_nombre}
                  </div>
                </div>

                <LineaDeTiempo tarea={destacada} />

                <div className="mt-5 mb-1">
                  <ResponsiveContainer width="100%" height={64}>
                    <AreaChart data={serie}>
                      <defs>
                        <linearGradient id="gradienteSerie" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="tareas" stroke="var(--primary)" strokeWidth={2} fill="url(#gradienteSerie)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="flex justify-between text-[10.5px] text-muted-foreground px-0.5">
                    {serie.map((d) => <span key={d.dia}>{d.dia}</span>)}
                  </div>
                </div>

                <div className="mt-auto pt-3 flex flex-col gap-2">
                  <Button onClick={() => handleAvanzar(destacada)}>
                    {destacada.estado === 'PENDIENTE' ? 'Comenzar' : 'Marcar terminada'}
                  </Button>
                  <Button variant="outline" onClick={() => onCambiarPestaña('kanban')}>
                    Ver en el tablero
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-none flex-1">
              <CardContent className="p-8 text-center text-sm text-muted-foreground h-full flex items-center justify-center">
                No tienes tareas activas. 🎉
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resumen de progreso */}
        <div className="flex flex-col">
          <h3 className="text-[13px] font-semibold text-muted-foreground mb-3">Resumen de progreso</h3>
          <Card className="shadow-none flex-1">
            <CardContent className="p-5 h-full flex flex-col">
              {resumen.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center m-auto">Sin más tareas activas.</p>
              )}
              {resumen.map((t) => <FilaProgreso key={t.id} tarea={t} />)}
              <button
                onClick={() => onCambiarPestaña('kanban')}
                className="flex items-center gap-1 text-[12.5px] font-medium text-primary mt-3 hover:underline"
              >
                Ver todo el progreso <ArrowRight size={12} />
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Vencimientos inminentes */}
        <div className="flex flex-col">
          <h3 className="text-[13px] font-semibold text-muted-foreground mb-3">Vencimientos inminentes</h3>
          <Card className="shadow-none flex-1">
            <CardContent className="p-3 h-full flex flex-col">
              {proximos.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center m-auto">Nada por vencer.</p>
              )}
              {proximos.map((t) => <FilaVencimiento key={t.id} tarea={t} />)}
            </CardContent>
          </Card>
        </div>
      </div>

      <Button onClick={() => onCambiarPestaña('gestionar')} className="fixed bottom-8 right-8 shadow-lg" size="lg">
        <Plus size={16} /> Nueva tarea
      </Button>
    </div>
  )
}

export default Inicio