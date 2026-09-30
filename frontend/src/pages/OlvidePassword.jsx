import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Workflow } from 'lucide-react'
import api from '../api/axios'

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
      // Mostramos el mismo mensaje de éxito pase lo que pase (salvo un
      // error real de red) -- el backend ya decide en silencio si el
      // correo existe o no.
      setEnviado(true)
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
          <h1 style={{ fontSize: '18px', marginBottom: '2px' }}>Recuperar contraseña</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Escribe tu correo y te enviaremos un enlace para restablecerla
          </p>
        </div>

        {enviado ? (
          <p style={{ fontSize: '13.5px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Si ese correo está registrado, te llegará un enlace en unos minutos.
            Revisa también la carpeta de spam.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label className="etiqueta-campo">Correo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-campo"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="btn btn-primario"
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            >
              <Mail size={15} strokeWidth={2} />
              {enviando ? 'Enviando...' : 'Enviar enlace'}
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

export default OlvidePassword