import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Check, LockKeyhole, UserRound, Workflow } from 'lucide-react'
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
    <main className="login-page">
      <div className="login-glow login-glow-one" aria-hidden="true" />
      <div className="login-glow login-glow-two" aria-hidden="true" />

      <section className="login-shell animar-entrada" aria-label="Iniciar sesión en StudyFlow">
        <aside className="login-showcase">
          <div className="login-showcase-content">
            <Link to="/" className="login-brand" aria-label="StudyFlow, inicio">
              <span className="login-brand-icon"><Workflow size={21} strokeWidth={2.2} /></span>
              <span>StudyFlow</span>
            </Link>

            <div className="login-message">
              <span className="login-eyebrow"><span /> TU ESPACIO PARA CRECER</span>
              <h1>Tu semestre,<br />bajo control.</h1>
              <p>Organiza tus tareas, cuida tu tiempo y avanza con claridad hacia tus metas.</p>
            </div>

            <div className="login-preview" aria-hidden="true">
              <div className="login-preview-top">
                <span className="login-preview-label"><BookOpen size={15} /> Mi semana</span>
                <span className="login-preview-count">2 de 3</span>
              </div>
              <div className="login-progress"><span /></div>
              <div className="login-preview-task">
                <span className="login-check"><Check size={12} strokeWidth={2.5} /></span>
                <span>Repasar apuntes de cálculo</span>
                <span className="login-task-time">9:00</span>
              </div>
              <div className="login-preview-task">
                <span className="login-check"><Check size={12} strokeWidth={2.5} /></span>
                <span>Entregar proyecto de diseño</span>
                <span className="login-task-time">14:30</span>
              </div>
            </div>
          </div>
          <p className="login-showcase-footnote">Pequeños pasos. Grandes logros.</p>
          <div className="login-orbit login-orbit-one" />
          <div className="login-orbit login-orbit-two" />
        </aside>

        <div className="login-form-panel">
          <div className="login-form-heading">
            <span className="login-welcome">QUÉ BUENO TENERTE DE VUELTA</span>
            <h2>Inicia sesión</h2>
            <p>Ingresa tus datos para continuar con tu organización.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="login-username" className="etiqueta-campo">Usuario</label>
              <div className="login-input-wrap">
                <UserRound size={17} aria-hidden="true" />
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-campo"
                  placeholder="Tu nombre de usuario"
                  autoComplete="username"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password" className="etiqueta-campo">Contraseña</label>
              <div className="login-input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-campo"
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <div className="login-forgot">
              <Link to="/olvide-password">¿Olvidaste tu contraseña?</Link>
            </div>

            {error && <p className="login-error" role="alert">{error}</p>}

            <button type="submit" disabled={enviando} className="btn btn-primario login-submit">
              <span>{enviando ? 'Entrando...' : 'Entrar a mi cuenta'}</span>
              <ArrowRight size={17} strokeWidth={2} />
            </button>
          </form>

          <p className="login-register">
            ¿Aún no tienes cuenta?{' '}
            <Link to="/registro">Crea una gratis</Link>
          </p>
          <p className="login-secure"><LockKeyhole size={13} /> Tus datos están protegidos · <Link to="/politica-de-datos">Política de datos</Link></p>
        </div>
      </section>
    </main>
  )
}

export default Login
