import { useState } from 'react'
import api from '../api/axios'

function FormularioAsignatura({ onAsignaturaCreada }) {
  const [nombre, setNombre] = useState('')
  const [creditos, setCreditos] = useState('3')
  const [color, setColor] = useState('#4F46E5')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)

    try {
      const response = await api.post('asignaturas/', {
        nombre,
        creditos: parseInt(creditos, 10),
        color,
      })
      onAsignaturaCreada(response.data)
      // Limpiamos el formulario para poder cargar otra de una vez
      setNombre('')
      setCreditos('3')
      setColor('#4F46E5')
    } catch (err) {
      console.error('Error creando asignatura:', err)
      setError('No se pudo crear la asignatura. Revisa los datos.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="tarjeta" style={{ padding: '20px', marginBottom: '20px' }}>
      <h3 style={{ marginTop: 0 }}>Nueva asignatura</h3>

      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label className="etiqueta-campo">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="input-campo"
          />
        </div>

        <div>
          <label className="etiqueta-campo">Créditos</label>
          <input
            type="number"
            min="1"
            max="10"
            value={creditos}
            onChange={(e) => setCreditos(e.target.value)}
            required
            className="input-campo"
            style={{ width: '70px' }}
          />
        </div>

        <div>
          <label className="etiqueta-campo">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ padding: '2px', height: '40px', width: '50px', border: '1.5px solid var(--color-border)', borderRadius: '8px' }}
          />
        </div>

        <button type="submit" disabled={enviando} className="btn btn-primario">
          {enviando ? 'Guardando...' : 'Crear asignatura'}
        </button>
      </div>

      {error && <p style={{ color: 'var(--color-rojo)', fontSize: '13px', marginTop: '10px' }}>{error}</p>}
    </form>
  )
}

export default FormularioAsignatura