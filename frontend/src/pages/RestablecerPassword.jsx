import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, CircleCheck, LockKeyhole, Workflow } from 'lucide-react'
import api from '../api/axios'
import { stagger, rise } from '../lib/motion'

const CONSEJOS = [
  'Mínimo 8 caracteres',
  'Mezcla letras, números y símbolos',
  'Evita contraseñas comunes',
]

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
    <main className="login-page">
      <div className="login-glow login-glow-one" aria-hidden="true" />
      <div className="login-glow login-glow-two" aria-hidden="true" />

      <section className="login-shell animar-entrada" aria-label="Crear nueva contraseña en StudyFlow">
        <aside className="login-showcase">
          <div className="login-showcase-content">
            <Link to="/login" className="login-brand" aria-label="StudyFlow, ir al inicio de sesión">
              <span className="login-brand-icon"><Workflow size={21} strokeWidth={2.2} /></span>
              <span>StudyFlow</span>
            </Link>

            <div className="login-message">
              <span className="login-eyebrow"><span /> CASI LISTO</span>
              <h1>Elige tu nueva<br />contraseña.</h1>
              <p>Una contraseña segura protege tus tareas, tu calendario y tus datos.</p>
            </div>

            <div className="login-preview">
              <div className="login-preview-top">
                <span className="login-preview-label">Para que sea segura</span>
              </div>
              {CONSEJOS.map((consejo) => (
                <div key={consejo} className="login-preview-task">
                  <span className="login-check"><Check size={12} strokeWidth={2.5} /></span>
                  <span>{consejo}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="login-showcase-footnote">Pequeños pasos. Grandes logros.</p>
          <div className="login-orbit login-orbit-one" />
          <div className="login-orbit login-orbit-two" />
        </aside>

        <div className="login-form-panel">
          <div className="login-form-heading">
            <span className="login-welcome">NUEVA CONTRASEÑA</span>
            <h2>Restablécela</h2>
            <p>Escribe tu contraseña nueva y confírmala para continuar.</p>
          </div>

          {exito ? (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '18px 20px',
                border: '1px solid var(--border)',
                borderRadius: 14,
                background: 'var(--accent)',
              }}
            >
              <CircleCheck size={22} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--accent-foreground)' }}>
                Contraseña actualizada. Te llevamos al inicio de sesión…
              </p>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              className="login-form"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={rise} className="login-field">
                <label htmlFor="reset-nueva" className="etiqueta-campo">Nueva contraseña</label>
                <div className="login-input-wrap">
                  <LockKeyhole size={17} aria-hidden="true" />
                  <input
                    id="reset-nueva"
                    name="nueva_password"
                    type="password"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    className="input-campo"
                    placeholder="Tu nueva contraseña"
                    autoComplete="new-password"
                    required
                    autoFocus
                  />
                </div>
              </motion.div>

              <motion.div variants={rise} className="login-field">
                <label htmlFor="reset-confirmar" className="etiqueta-campo">Confirma la contraseña</label>
                <div className="login-input-wrap">
                  <LockKeyhole size={17} aria-hidden="true" />
                  <input
                    id="reset-confirmar"
                    name="confirmar_password"
                    type="password"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    className="input-campo"
                    placeholder="Repite la contraseña"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </motion.div>

              {error && <p className="login-error" role="alert">{error}</p>}

              <motion.div variants={rise}>
                <button type="submit" disabled={enviando} className="btn btn-primario login-submit">
                  <span>{enviando ? 'Guardando...' : 'Restablecer contraseña'}</span>
                  <ArrowRight size={17} strokeWidth={2} />
                </button>
              </motion.div>
            </motion.form>
          )}

          <p className="login-register">
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={13} /> Volver al login
            </Link>
          </p>
          <p className="login-secure">
            <LockKeyhole size={13} /> Tus datos están protegidos ·{' '}
            <Link to="/politica-de-datos" style={{ color: 'inherit' }}>Política de datos</Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default RestablecerPassword
