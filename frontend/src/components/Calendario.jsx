import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import { Card, CardContent } from '@/components/ui/card'

function colorPorCriticidad(nivel) {
  if (nivel >= 70) return 'var(--destructive)'
  if (nivel >= 40) return 'var(--media)'
  return 'var(--ok)'
}

function Calendario({ tareas }) {
  const [esMovil, setEsMovil] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const alRedimensionar = () => setEsMovil(window.innerWidth < 768)
    window.addEventListener('resize', alRedimensionar)
    return () => window.removeEventListener('resize', alRedimensionar)
  }, [])

  const eventos = tareas.map((tarea) => ({
    id: tarea.id,
    title: tarea.titulo,
    start: tarea.fecha_entrega,
    color: colorPorCriticidad(tarea.nivel_criticidad),
    extendedProps: { asignatura: tarea.asignatura_nombre },
  }))

  return (
    <div>
      <div className="mb-5">
        <h2>Calendario</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Cada entrega coloreada según su nivel de criticidad.
        </p>
      </div>

      <Card className="shadow-none gap-0 py-0">
        <CardContent className={esMovil ? 'p-2' : 'p-5'} style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: esMovil ? 'auto' : '640px' }} className="calendario-studyflow">
            <FullCalendar
              key={esMovil ? 'lista' : 'mes'}
              plugins={[dayGridPlugin, listPlugin]}
              initialView={esMovil ? 'listMonth' : 'dayGridMonth'}
              events={eventos}
              height="auto"
              locale="es"
              noEventsText="No hay entregas este mes"
              eventContent={(arg) => (
                <div className="px-1.5 py-0.5 truncate text-[11px] font-medium">
                  {arg.event.title}
                </div>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Calendario