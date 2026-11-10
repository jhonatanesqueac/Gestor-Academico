import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, LockKeyhole, Mail, MailCheck, Workflow } from 'lucide-react'
import api from '../api/axios'
import { stagger, rise } from '../lib/motion'

const PASOS = [
  'Escribe el correo de tu cuenta',
  'Abre el enlace que te enviamos',
  'Crea una contraseña nueva',
]

function OlvidePassword() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)
    try {
      await api.post('auth/password/reset/', { email })
    } catch (err) {
      // El backend siempre responde 200 con mensaje genérico, así que
      // un error aquí normalmente es de red, no de "correo inválido".
      console.error('Error solicitando reset:', err)
    } finally {
      // Mostramos el mismo mensaje de éxito pase lo que pase -- el backend
      // ya decide en silencio si el correo existe o no.
      setEnviado(true)
      setEnviando(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-glow login-glow-one" aria-hidden="true" />
      <div className="login-glow login-glow-two" aria-hidden="true" />

      <section className="login-shell animar-entrada" aria-label="Recuperar contraseña de StudyFlow">
        <aside className="login-showcase">
          <div className="login-showcase-content">
            <Link to="/login" className="login-brand" aria-label="StudyFlow, ir al inicio de sesión">
              <span className="login-brand-icon"><Workflow size={21} strokeWidth={2.2} /></span>
              <span>StudyFlow</span>
            </Link>

            <div className="login-message">
              <span className="login-eyebrow"><span /> RECUPERA EL ACCESO</span>
              <h1>Vuelve a<br />tu semestre.</h1>
              <p>Te enviamos un enlace seguro para que elijas una contraseña nueva en un par de minutos.</p>
            </div>

            <div className="login-preview">
              <div className="login-preview-top">
                <span className="login-preview-label">Cómo funciona</span>
              </div>
              {PASOS.map((paso) => (
                <div key={paso} className="login-preview-task">
                  <span className="login-check"><Check size={12} strokeWidth={2.5} /></span>
                  <span>{paso}</span>
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
            <span className="login-welcome">¿OLVIDASTE TU CONTRASEÑA?</span>
            <h2>Recupérala</h2>
            <p>Escribe tu correo y te enviaremos un enlace para restablecerla.</p>
          </div>

          {enviado ? (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
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
              <MailCheck size={22} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--accent-foreground)' }}>
                Si ese correo está registrado, te llegará un enlace en unos minutos. Revisa también la carpeta de
                spam.
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
                <label htmlFor="olvide-email" className="etiqueta-campo">Correo</label>
                <div className="login-input-wrap">
                  <Mail size={17} aria-hidden="true" />
                  <input
                    id="olvide-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-campo"
                    placeholder="tucorreo@ejemplo.com"
                    autoComplete="email"
                    required
                    autoFocus
                  />
                </div>
              </motion.div>

              <motion.div variants={rise}>
                <button type="submit" disabled={enviando} className="btn btn-primario login-submit">
                  <span>{enviando ? 'Enviando...' : 'Enviar enlace'}</span>
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

export default OlvidePassword
