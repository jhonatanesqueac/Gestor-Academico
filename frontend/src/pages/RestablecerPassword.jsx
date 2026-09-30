import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { KeyRound, Workflow } from 'lucide-react'
import api from '../api/axios'

function RestablecerPassword() {
  const { uidb64, token } = useParams()
  const navigate = useNavigate()
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)

    try {
      await api.post('auth/password/reset/confirmar/', {
        uidb64,
        token,
        nueva_password: nuevaPassword,
        confirmar_password: confirmarPassword,
      })
      setExito(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      console.error('Error restableciendo contraseña:', err)
      const datosError = err.response?.data
      setError(datosError ? Object.values(datosError).flat().join(' ') : 'No se pudo restablecer la contraseña.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '20px',
      }}
    >
      <div className="animar-entrada panel" style={{ width: '380px', maxWidth: '100%', padding: '36px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--r-md)',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <Workflow size={22} color="#f2f7f8" strokeWidth={2.1} />
          </div>
          <h1 style={{ fontSize: '18px', marginBottom: '2px' }}>Nueva contraseña</h1>
        </div>

        {exito ? (
          <p style={{ fontSize: '13.5px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Contraseña actualizada. Redirigiendo al login...
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label className="etiqueta-campo">Nueva contraseña</label>
              <input
                type="password"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                className="input-campo"
                required
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="etiqueta-campo">Confirma la contraseña</label>
              <input
                type="password"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                className="input-campo"
                required
              />
            </div>

            {error && (
              <p style={{ color: 'var(--alerta)', fontSize: '12px', marginBottom: '16px' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="btn btn-primario"
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            >
              <KeyRound size={15} strokeWidth={2} />
              {enviando ? 'Guardando...' : 'Restablecer contraseña'}
            </button>
          </form>
        )}

        <p style={{ marginTop: '20px', fontSize: '13px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RestablecerPassword