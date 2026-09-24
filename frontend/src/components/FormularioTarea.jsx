import { useState } from 'react'
import api from '../api/axios'

function FormularioTarea({ asignaturas, onTareaCreada }) {
  const [asignaturaId, setAsignaturaId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [dificultad, setDificultad] = useState('3')
  const [horasEstimadas, setHorasEstimadas] = useState('2')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!asignaturaId) {
      setError('Elige una asignatura primero.')
      return
    }

    setEnviando(true)
    try {
      const response = await api.post('tareas/', {
        asignatura: parseInt(asignaturaId, 10),
        titulo,
        fecha_entrega: fechaEntrega, // formato ISO, el input datetime-local ya lo entrega así
        dificultad: parseInt(dificultad, 10),
        horas_estimadas: parseFloat(horasEstimadas),
      })
      onTareaCreada(response.data)
      // Limpiamos el formulario
      setTitulo('')
      setFechaEntrega('')
      setDificultad('3')
      setHorasEstimadas('2')
    } catch (err) {
      console.error('Error creando tarea:', err)
      setError('No se pudo crear la tarea. Revisa los datos.')
    } finally {
      setEnviando(false)
    }
  }

  if (asignaturas.length === 0) {
    return (
      <div className="tarjeta" style={{ padding: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Nueva tarea</h3>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Primero crea al menos una asignatura arriba — una tarea siempre necesita pertenecer a una.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="tarjeta" style={{ padding: '20px' }}>
      <h3 style={{ marginTop: 0 }}>Nueva tarea</h3>

      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label className="etiqueta-campo">Asignatura</label>
          <select
            value={asignaturaId}
            onChange={(e) => setAsignaturaId(e.target.value)}
            required
            className="input-campo"
          >
            <option value="">-- Elige --</option>
            {asignaturas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="etiqueta-campo">Título</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            className="input-campo"
          />
        </div>

        <div>
          <label className="etiqueta-campo">Fecha de entrega</label>
          <input
            type="datetime-local"
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
            required
            className="input-campo"
          />
        </div>

        <div>
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

        <div>
          <label className="etiqueta-campo">Horas estimadas</label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={horasEstimadas}
            onChange={(e) => setHorasEstimadas(e.target.value)}
            className="input-campo"
            style={{ width: '70px' }}
          />
        </div>

        <button type="submit" disabled={enviando} className="btn btn-primario">
          {enviando ? 'Guardando...' : 'Crear tarea'}
        </button>
      </div>

      {error && <p style={{ color: 'var(--color-rojo)', fontSize: '13px', marginTop: '10px' }}>{error}</p>}
    </form>
  )
}

export default FormularioTarea