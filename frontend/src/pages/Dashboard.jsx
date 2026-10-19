import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import Layout from '../components/Layout'
import Kanban from '../components/Kanban'
import Calendario from '../components/Calendario'
import GraficoCarga from '../components/GraficoCarga'
import Gestionar from '../components/Gestionar'
import Inicio from '../components/Inicio'
import Historial from '../components/Historial'
import Perfil from '../components/Perfil'

const INTERVALO_ALERTAS_MS = 60 * 1000

function Dashboard() {
  const [tareas, setTareas] = useState([])
  const [asignaturas, setAsignaturas] = useState([])
  const [alertas, setAlertas] = useState([])
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [pestañaActiva, setPestañaActiva] = useState('inicio')
  const [filtroAsignatura, setFiltroAsignatura] = useState(null)

  // Pedir las alertas hace que el backend revise las tareas y genere las que falten
  const recargarAlertas = useCallback(async () => {
    try {
      const respuesta = await api.get('alertas/')
      setAlertas(respuesta.data)
    } catch (error) {
      console.error('Error actualizando alertas:', error)
    }
  }, [])

  useEffect(() => {
    Promise.all([
      api.get('tareas/'),
      api.get('asignaturas/'),
      api.get('alertas/'),
      // Si el perfil falla, el resto del dashboard sigue funcionando
      api.get('perfil/').catch(() => null),
    ])
      .then(([respuestaTareas, respuestaAsignaturas, respuestaAlertas, respuestaPerfil]) => {
        setTareas(respuestaTareas.data)
        setAsignaturas(respuestaAsignaturas.data)
        setAlertas(respuestaAlertas.data)
        setPerfil(respuestaPerfil?.data ?? null)
        setCargando(false)
      })
      .catch((error) => {
        console.error('Error trayendo datos:', error)
        setCargando(false)
      })
  }, [])

  // Revisión periódica mientras la app está abierta, y al volver a la pestaña
  useEffect(() => {
    const intervalo = setInterval(recargarAlertas, INTERVALO_ALERTAS_MS)
    const alVolver = () => {
      if (document.visibilityState === 'visible') recargarAlertas()
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [recargarAlertas])

  const handleTareaActualizada = (tareaActualizada) => {
    setTareas((actuales) => actuales.map((t) => (t.id === tareaActualizada.id ? tareaActualizada : t)))
    recargarAlertas()
  }

  const handleTareaEliminada = (tareaId) => {
    setTareas((actuales) => actuales.filter((t) => t.id !== tareaId))
    recargarAlertas()
  }

  const handleTareaCreada = (nuevaTarea) => {
    setTareas((actuales) => [...actuales, nuevaTarea])
    recargarAlertas()
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
    // Django borró en cascada sus tareas y alertas: reflejamos lo mismo aquí
    setTareas((actuales) => actuales.filter((t) => t.asignatura !== asignaturaId))
    recargarAlertas()
  }

  const handleMarcarLeida = async (alertaId) => {
    try {
      const response = await api.patch(`alertas/${alertaId}/`, { enviada: true })
      setAlertas((actuales) => actuales.map((a) => (a.id === alertaId ? response.data : a)))
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
      perfil={perfil}
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
      {pestañaActiva === 'perfil' && (
        <Perfil perfil={perfil} tareas={tareas} asignaturas={asignaturas} onPerfilActualizado={setPerfil} />
      )}
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