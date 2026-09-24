import { useState } from 'react'
import api from '../api/axios'

function ModalEditarAsignatura({ asignatura, onGuardado, onCerrar }) {
  const [nombre, setNombre] = useState(asignatura.nombre)
  const [creditos, setCreditos] = useState(String(asignatura.creditos))
  const [color, setColor] = useState(asignatura.color)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)

    try {
      const response = await api.patch(`asignaturas/${asignatura.id}/`, {
        nombre,
        creditos: parseInt(creditos, 10),
        color,
      })
      onGuardado(response.data)
      onCerrar()
    } catch (err) {
      console.error('Error editando asignatura:', err)
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
        style={{ padding: '28px', width: '340px', maxWidth: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Editar asignatura</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label className="etiqueta-campo">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="input-campo"
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="etiqueta-campo">Créditos</label>
            <input
              type="number"
              min="1"
              max="10"
              value={creditos}
              onChange={(e) => setCreditos(e.target.value)}
              required
              className="input-campo"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="etiqueta-campo">Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{
                padding: '2px',
                height: '40px',
                width: '60px',
                border: '1.5px solid var(--color-border)',
                borderRadius: '8px',
              }}
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

export default ModalEditarAsignatura