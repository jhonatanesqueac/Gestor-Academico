import { useState, useEffect } from 'react'
import api from '../api/axios'
import TarjetaTarea from './TarjetaTarea'
import ModalEditarTarea from './ModalEditarTarea'

const columnas = [
  { estado: 'PENDIENTE', titulo: 'Pendiente' },
  { estado: 'EN_PROCESO', titulo: 'En proceso' },
  { estado: 'TERMINADO', titulo: 'Terminado' },
]

function Kanban({ tareas, asignaturas, onTareaActualizada, onTareaEliminada, filtroAsignatura, onQuitarFiltro }) {
  const [errorMsg, setErrorMsg] = useState('')
  const [tareaEditando, setTareaEditando] = useState(null)
  const [columnaMovil, setColumnaMovil] = useState('PENDIENTE')
  const [esMovil, setEsMovil] = useState(() => window.innerWidth < 1024)

  useEffect(() => {
    const alRedimensionar = () => setEsMovil(window.innerWidth < 1024)
    window.addEventListener('resize', alRedimensionar)
    return () => window.removeEventListener('resize', alRedimensionar)
  }, [])

  const handleCambiarEstado = async (tareaId, nuevoEstado) => {
    setErrorMsg('')
    try {
      const response = await api.patch(`tareas/${tareaId}/`, { estado: nuevoEstado })
      onTareaActualizada(response.data)
    } catch (error) {
      console.error('Error actualizando tarea:', error)
      setErrorMsg('No se pudo actualizar la tarea. Intenta de nuevo.')
    }
  }

  const handleEliminar = async (tareaId) => {
    const confirmar = window.confirm('¿Seguro que quieres eliminar esta tarea? No se puede deshacer.')
    if (!confirmar) return

    try {
      await api.delete(`tareas/${tareaId}/`)
      onTareaEliminada(tareaId)
    } catch (error) {
      console.error('Error eliminando tarea:', error)
      setErrorMsg('No se pudo eliminar la tarea.')
    }
  }

  const asignaturaFiltrada = asignaturas.find((a) => a.id === filtroAsignatura)
  const tareasVisibles = filtroAsignatura
    ? tareas.filter((t) => t.asignatura === filtroAsignatura)
    : tareas

  return (
    <div>
      {asignaturaFiltrada && (
        <div className="flex items-center gap-2 mb-4 text-[13px]">
          <span className="text-muted-foreground">Mostrando solo:</span>
          <span
            className="inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: `color-mix(in oklab, ${asignaturaFiltrada.color} 16%, var(--card))`,
              color: `color-mix(in oklab, ${asignaturaFiltrada.color} 65%, var(--foreground))`,
            }}
          >
            {asignaturaFiltrada.nombre}
          </span>
          <button
            onClick={onQuitarFiltro}
            className="text-muted-foreground hover:text-foreground text-[12.5px] underline"
          >
            Ver todas
          </button>
        </div>
      )}

      {errorMsg && <p className="text-destructive text-sm mb-3">{errorMsg}</p>}

      {/* Selector de columna — solo visible en móvil */}
      <div className="flex gap-1.5 mb-4 lg:hidden">
        {columnas.map((columna) => {
          const cantidad = tareasVisibles.filter((t) => t.estado === columna.estado).length
          const esActiva = columnaMovil === columna.estado
          return (
            <button
              key={columna.estado}
              onClick={() => setColumnaMovil(columna.estado)}
              className="flex-1 text-[12.5px] font-medium py-2 rounded-md transition-colors"
              style={{
                background: esActiva ? 'var(--primary)' : 'var(--card)',
                color: esActiva ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                border: '1px solid var(--border)',
              }}
            >
              {columna.titulo} <span className="num-tabular opacity-70">({cantidad})</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {columnas.map((columna) => {
          const tareasDeColumna = tareasVisibles.filter((t) => t.estado === columna.estado)
          if (esMovil && columna.estado !== columnaMovil) return null

          return (
            <div key={columna.estado} className="flex-1 min-w-0 w-full">
              <div className="flex justify-between items-center px-1 pb-3 border-b mb-3">
                <h3 className="text-[13px] text-muted-foreground font-medium">{columna.titulo}</h3>
                <span className="num-tabular text-xs font-semibold text-muted-foreground/70 bg-muted rounded-full px-2 py-0.5">
                  {tareasDeColumna.length}
                </span>
              </div>

              {tareasDeColumna.length === 0 && (
                <div className="flex items-center justify-center h-20 rounded-lg border border-dashed text-xs text-muted-foreground/60">
                  Sin tareas
                </div>
              )}

              {tareasDeColumna.map((tarea) => (
                <TarjetaTarea
                  key={tarea.id}
                  tarea={tarea}
                  onCambiarEstado={handleCambiarEstado}
                  onEditar={setTareaEditando}
                  onEliminar={handleEliminar}
                />
              ))}
            </div>
          )
        })}
      </div>

      {tareaEditando && (
        <ModalEditarTarea
          tarea={tareaEditando}
          asignaturas={asignaturas}
          onGuardado={onTareaActualizada}
          onCerrar={() => setTareaEditando(null)}
        />
      )}
    </div>
  )
}

export default Kanban