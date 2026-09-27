import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, Workflow } from 'lucide-react'
import api, { setAccessToken } from '../api/axios'
import { useAuth } from '../context/useAuth'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const navigate = useNavigate()
  const { iniciarSesion } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)

    try {
      const response = await api.post('auth/login/', { username, password })
      setAccessToken(response.data.access)
      localStorage.setItem('nombre', response.data.nombre)
      iniciarSesion()
      navigate('/dashboard')
    } catch (err) {
      console.error('Error de login:', err)
      setError('Usuario o contraseña incorrectos.')
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '26px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--r-md)',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
            }}
          >
            <Workflow size={24} color="#c0acac" strokeWidth={2.1} />
          </div>
          <h1 style={{ fontSize: '25px', marginBottom: '2px' }}>StudyFlow</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Organiza tu semestre sin perder el control
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label className="etiqueta-campo">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-campo"
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="etiqueta-campo">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            <LogIn size={15} strokeWidth={2} />
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '13px', textAlign: 'center', color: 'var(--text-muted)' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login