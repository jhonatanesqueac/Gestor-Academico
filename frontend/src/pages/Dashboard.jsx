import { useState, useEffect } from 'react'
import api from '../api/axios'
import Layout from '../components/Layout'
import Kanban from '../components/Kanban'
import Calendario from '../components/Calendario'
import GraficoCarga from '../components/GraficoCarga'
import Gestionar from '../components/Gestionar'
import Inicio from '../components/Inicio'
import Historial from '../components/Historial'

function Dashboard() {
  const [tareas, setTareas] = useState([])
  const [asignaturas, setAsignaturas] = useState([])
  const [alertas, setAlertas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [pestañaActiva, setPestañaActiva] = useState('inicio')
  const [filtroAsignatura, setFiltroAsignatura] = useState(null)

  useEffect(() => {
    // Pedimos tareas, asignaturas Y alertas al mismo tiempo.
    Promise.all([api.get('tareas/'), api.get('asignaturas/'), api.get('alertas/')])
      .then(([respuestaTareas, respuestaAsignaturas, respuestaAlertas]) => {
        setTareas(respuestaTareas.data)
        setAsignaturas(respuestaAsignaturas.data)
        setAlertas(respuestaAlertas.data)
        setCargando(false)
      })
      .catch((error) => {
        console.error('Error trayendo datos:', error)
        setCargando(false)
      })
  }, [])

    const handleTareaActualizada = (tareaActualizada) => {
    setTareas((tareasActuales) =>
      tareasActuales.map((t) => (t.id === tareaActualizada.id ? tareaActualizada : t))
    )
  }

  const handleTareaEliminada = (tareaId) => {
    setTareas((tareasActuales) => tareasActuales.filter((t) => t.id !== tareaId))
  }

    const handleAsignaturaCreada = (nuevaAsignatura) => {
    setAsignaturas((actuales) => [...actuales, nuevaAsignatura])
  }

  const handleAsignaturaActualizada = (asignaturaActualizada) => {
    setAsignaturas((actuales) =>
      actuales.map((a) => (a.id === asignaturaActualizada.id ? asignaturaActualizada : a))
    )
  }

  const handleAsignaturaEliminada = (asignaturaId) => {
    setAsignaturas((actuales) => actuales.filter((a) => a.id !== asignaturaId))
    // Como se borraron en cascada en Django, quitamos también sus tareas
    // de la lista local para que el Kanban/Calendario/Gráfico no muestren
    // tareas "fantasma" que ya no existen en la base de datos.
    setTareas((actuales) => actuales.filter((t) => t.asignatura !== asignaturaId))
  }

  const handleTareaCreada = (nuevaTarea) => {
    setTareas((actuales) => [...actuales, nuevaTarea])
  }
  const handleMarcarLeida = async (alertaId) => {
    try {
      const response = await api.patch(`alertas/${alertaId}/`, { enviada: true })
      setAlertas((actuales) =>
        actuales.map((a) => (a.id === alertaId ? response.data : a))
      )
    } catch (error) {
      console.error('Error marcando alerta como leída:', error)
    }
  }

  if (cargando) return <p style={{ padding: '24px' }}>Cargando datos...</p>

  return (
    <Layout
      activa={pestañaActiva}
      onCambiarPestaña={setPestañaActiva}
      alertas={alertas}
      onMarcarLeida={handleMarcarLeida}
      asignaturas={asignaturas}
      filtroAsignatura={filtroAsignatura}
      onSeleccionarAsignatura={(id) => {
        setFiltroAsignatura((actual) => (actual === id ? null : id))
        setPestañaActiva('kanban')
      }}
    >
            {pestañaActiva === 'inicio' && (
        <Inicio tareas={tareas} onTareaActualizada={handleTareaActualizada} onCambiarPestaña={setPestañaActiva} />
      )}
      {pestañaActiva === 'kanban' && (
        <Kanban
          tareas={tareas}
          asignaturas={asignaturas}
          onTareaActualizada={handleTareaActualizada}
          onTareaEliminada={handleTareaEliminada}
          filtroAsignatura={filtroAsignatura}
          onQuitarFiltro={() => setFiltroAsignatura(null)}
          onIrHistorial={() => setPestañaActiva('historial')}
        />
      )}
      {pestañaActiva === 'historial' && (
        <Historial tareas={tareas} onTareaActualizada={handleTareaActualizada} onTareaEliminada={handleTareaEliminada} />
      )}
      {pestañaActiva === 'calendario' && <Calendario tareas={tareas} />}
      {pestañaActiva === 'carga' && <GraficoCarga tareas={tareas} />}
      {pestañaActiva === 'gestionar' && (
        <Gestionar
          asignaturas={asignaturas}
          tareas={tareas}
          onAsignaturaCreada={handleAsignaturaCreada}
          onTareaCreada={handleTareaCreada}
          onAsignaturaActualizada={handleAsignaturaActualizada}
          onAsignaturaEliminada={handleAsignaturaEliminada}
        />
      )}
    </Layout>
  )
}

export default Dashboard