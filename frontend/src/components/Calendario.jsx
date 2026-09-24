import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'

function colorPorCriticidad(nivel) {
  if (nivel >= 70) return '#DC2626'
  if (nivel >= 40) return '#F59E0B'
  return '#16A34A'
}

function Calendario({ tareas }) {
  const eventos = tareas.map((tarea) => ({
    id: tarea.id,
    title: `${tarea.titulo} (${tarea.asignatura_nombre})`,
    start: tarea.fecha_entrega,
    color: colorPorCriticidad(tarea.nivel_criticidad),
  }))

  return (
    <div>
      <h2 style={{ marginBottom: '18px' }}>Calendario de entregas</h2>
      <div className="tarjeta" style={{ padding: '20px', overflowX: 'auto' }}>
        <div style={{ minWidth: '640px' }}>
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={eventos}
            height="auto"
            locale="es"
          />
        </div>
      </div>
    </div>
  )
}

export default Calendario