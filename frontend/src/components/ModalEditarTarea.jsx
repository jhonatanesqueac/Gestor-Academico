import { useState } from 'react'
import api from '../api/axios'

function aFormatoInput(fechaISO) {
  const fecha = new Date(fechaISO)
  const offset = fecha.getTimezoneOffset()
  const local = new Date(fecha.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function ModalEditarTarea({ tarea, asignaturas, onGuardado, onCerrar }) {
  const [asignaturaId, setAsignaturaId] = useState(tarea.asignatura)
  const [titulo, setTitulo] = useState(tarea.titulo)
  const [fechaEntrega, setFechaEntrega] = useState(aFormatoInput(tarea.fecha_entrega))
  const [dificultad, setDificultad] = useState(String(tarea.dificultad))
  const [horasEstimadas, setHorasEstimadas] = useState(String(tarea.horas_estimadas))
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)

    try {
      const response = await api.patch(`tareas/${tarea.id}/`, {
        asignatura: parseInt(asignaturaId, 10),
        titulo,
        fecha_entrega: fechaEntrega,
        dificultad: parseInt(dificultad, 10),
        horas_estimadas: parseFloat(horasEstimadas),
      })
      onGuardado(response.data)
      onCerrar()
    } catch (err) {
      console.error('Error editando tarea:', err)
      setError('No se pudo guardar. Revisa los datos.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onCerrar}
    >
      <div
        className="tarjeta"
        style={{
          padding: '28px',
          width: '400px',
          maxWidth: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Editar tarea</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label className="etiqueta-campo">Asignatura</label>
            <select
              value={asignaturaId}
              onChange={(e) => setAsignaturaId(e.target.value)}
              className="input-campo"
            >
              {asignaturas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="etiqueta-campo">Título</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              className="input-campo"
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="etiqueta-campo">Fecha de entrega</label>
            <input
              type="datetime-local"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
              required
              className="input-campo"
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="etiqueta-campo">Dificultad</label>
            <select
              value={dificultad}
              onChange={(e) => setDificultad(e.target.value)}
              className="input-campo"
            >
              <option value="1">Muy fácil</option>
              <option value="2">Fácil</option>
              <option value="3">Media</option>
              <option value="4">Difícil</option>
              <option value="5">Muy difícil</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="etiqueta-campo">Horas estimadas</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={horasEstimadas}
              onChange={(e) => setHorasEstimadas(e.target.value)}
              className="input-campo"
            />
          </div>

          {error && <p style={{ color: 'var(--color-rojo)', fontSize: '13px', marginBottom: '14px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" disabled={enviando} className="btn btn-primario">
              {enviando ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={onCerrar} className="btn btn-secundario">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalEditarTarea