import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'

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
    title: `${tarea.titulo} (${tarea.asignatura_nombre})`,
    start: tarea.fecha_entrega,
    color: colorPorCriticidad(tarea.nivel_criticidad),
  }))

  return (
    <div>
      <h2 style={{ marginBottom: '18px' }}>Calendario de entregas</h2>
      <div className="tarjeta" style={{ padding: esMovil ? '8px' : '20px', overflowX: 'auto' }}>
        <div style={{ minWidth: esMovil ? 'auto' : '640px' }}>
          <FullCalendar
            key={esMovil ? 'lista' : 'mes'}
            plugins={[dayGridPlugin, listPlugin]}
            initialView={esMovil ? 'listMonth' : 'dayGridMonth'}
            events={eventos}
            height="auto"
            locale="es"
            noEventsText="No hay entregas este mes"
          />
        </div>
      </div>
    </div>
  )
}

export default Calendario