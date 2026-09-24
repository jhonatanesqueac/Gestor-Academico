import { useState } from 'react'
import api from '../api/axios'
import FormularioAsignatura from './FormularioAsignatura'
import FormularioTarea from './FormularioTarea'
import ModalEditarAsignatura from './ModalEditarAsignatura'

function Gestionar({ asignaturas, onAsignaturaCreada, onTareaCreada, onAsignaturaActualizada, onAsignaturaEliminada }) {
  const [editando, setEditando] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleEliminar = async (asignatura) => {
    const confirmar = window.confirm(
      `¿Eliminar "${asignatura.nombre}"? Esto también eliminará TODAS sus tareas y alertas asociadas. No se puede deshacer.`
    )
    if (!confirmar) return

    try {
      await api.delete(`asignaturas/${asignatura.id}/`)
      onAsignaturaEliminada(asignatura.id)
    } catch (error) {
      console.error('Error eliminando asignatura:', error)
      setErrorMsg('No se pudo eliminar la asignatura.')
    }
  }

  return (
    <div>
      <h2>Gestionar</h2>

      <FormularioAsignatura onAsignaturaCreada={onAsignaturaCreada} />

      <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #ddd' }} />

      <FormularioTarea asignaturas={asignaturas} onTareaCreada={onTareaCreada} />

      <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #ddd' }} />

      <h3>Tus asignaturas actuales</h3>
      {errorMsg && <p style={{ color: 'red', fontSize: '13px' }}>{errorMsg}</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {asignaturas.map((a) => (
          <li
            key={a.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 0',
              borderBottom: '1px solid #eee',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                backgroundColor: a.color,
                borderRadius: '50%',
              }}
            ></span>
            <span style={{ flex: 1 }}>
              {a.nombre} — {a.creditos} créditos
            </span>
            <button onClick={() => setEditando(a)} style={{ fontSize: '12px', color: '#4F46E5' }}>
              ✏️ Editar
            </button>
            <button onClick={() => handleEliminar(a)} style={{ fontSize: '12px', color: '#DC2626' }}>
              🗑️ Eliminar
            </button>
          </li>
        ))}
      </ul>

      {editando && (
        <ModalEditarAsignatura
          asignatura={editando}
          onGuardado={onAsignaturaActualizada}
          onCerrar={() => setEditando(null)}
        />
      )}
    </div>
  )
}

export default Gestionar