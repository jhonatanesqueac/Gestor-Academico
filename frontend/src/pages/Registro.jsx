import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  GraduationCap,
  Hash,
  LockKeyhole,
  Mail,
  Phone,
  School,
  UserRound,
  Workflow,
} from 'lucide-react'
import api, { setAccessToken } from '../api/axios'
import { useAuth } from '../context/useAuth'
import { stagger, rise } from '../lib/motion'

// Lista curada de instituciones comunes en Colombia, solo para dar
// sugerencias -- el usuario puede escribir cualquier otra cosa que no
// esté aquí, esto no restringe el valor final.
const INSTITUCIONES_SUGERIDAS = [
  'Universidad del Norte',
  'Universidad del Atlántico',
  'Universidad Autónoma del Caribe',
  'Universidad Simón Bolívar',
  'Universidad Libre - Barranquilla',
  'Universidad Metropolitana',
  'Universidad Nacional de Colombia',
  'Universidad de los Andes',
  'Universidad Javeriana',
  'Universidad Externado de Colombia',
  'Universidad EAFIT',
  'Universidad ICESI',
  'Universidad Pontificia Bolivariana',
  'SENA',
  'Colegio Karl C. Parrish',
  'Colegio Alemán de Barranquilla',
  'Colegio Marymount Barranquilla',
  'Institución Educativa Distrital',
]

const BENEFICIOS = [
  'Tareas ordenadas por urgencia',
  'Alertas antes de cada entrega',
  'Calendario y carga semanal',
]

const filaDosColumnas = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: '14px',
}

// Cada grupo de campos entra con el escalonado del formulario
function Campo({ children, style }) {
  return (
    <motion.div variants={rise} className="login-field" style={style}>
      {children}
    </motion.div>
  )
}

function Registro() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [institucion, setInstitucion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [documentoIdentidad, setDocumentoIdentidad] = useState('')
  const [carrera, setCarrera] = useState('Ingeniería de Sistemas')
  const [semestre, setSemestre] = useState('1')
  const [aceptaDatos, setAceptaDatos] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const navigate = useNavigate()
  const { iniciarSesion } = useAuth()

  const sugerenciasFiltradas = institucion.trim()
    ? INSTITUCIONES_SUGERIDAS.filter((i) =>
        i.toLowerCase().includes(institucion.trim().toLowerCase())
      )
    : INSTITUCIONES_SUGERIDAS

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!aceptaDatos) return
    setError('')
    setEnviando(true)

    try {
      const response = await api.post('auth/registro/', {
        username,
        password,
        nombre,
        email,
        institucion,
        telefono,
        documento_identidad: documentoIdentidad,
        carrera,
        semestre: parseInt(semestre, 10),
      })
      setAccessToken(response.data.access)
      localStorage.setItem('nombre', response.data.nombre)
      iniciarSesion()
      navigate('/dashboard')
    } catch (err) {
      console.error('Error en registro:', err)
      const datosError = err.response?.data
      setError(datosError ? Object.values(datosError).flat().join(' ') : 'No se pudo completar el registro.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-glow login-glow-one" aria-hidden="true" />
      <div className="login-glow login-glow-two" aria-hidden="true" />

      <section className="login-shell animar-entrada" aria-label="Crear cuenta en StudyFlow">
        <aside className="login-showcase">
          <div className="login-showcase-content">
            <Link to="/" className="login-brand" aria-label="StudyFlow, inicio">
              <span className="login-brand-icon"><Workflow size={21} strokeWidth={2.2} /></span>
              <span>StudyFlow</span>
            </Link>

            <div className="login-message">
              <span className="login-eyebrow"><span /> EMPIEZA HOY</span>
              <h1>Ordena tu<br />semestre.</h1>
              <p>Crea tu cuenta y deja que StudyFlow te ayude a priorizar lo que de verdad importa.</p>
            </div>

            <div className="login-preview">
              <div className="login-preview-top">
                <span className="login-preview-label">Lo que obtienes</span>
              </div>
              {BENEFICIOS.map((texto) => (
                <div key={texto} className="login-preview-task">
                  <span className="login-check"><Check size={12} strokeWidth={2.5} /></span>
                  <span>{texto}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="login-showcase-footnote">Pequeños pasos. Grandes logros.</p>
          <div className="login-orbit login-orbit-one" />
          <div className="login-orbit login-orbit-two" />
        </aside>

        <div className="login-form-panel" style={{ padding: '44px clamp(24px, 6vw, 64px)' }}>
          <div className="login-form-heading" style={{ marginBottom: '26px' }}>
            <span className="login-welcome">BIENVENIDO A STUDYFLOW</span>
            <h2>Crea tu cuenta</h2>
            <p>Completa tus datos para empezar a organizar tu semestre.</p>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            className="login-form"
            style={{ gap: '16px' }}
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <div style={filaDosColumnas}>
              <Campo>
                <label htmlFor="reg-nombre" className="etiqueta-campo">Nombre</label>
                <div className="login-input-wrap">
                  <UserRound size={17} aria-hidden="true" />
                  <input
                    id="reg-nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="input-campo"
                    placeholder="Tu nombre"
                    autoComplete="name"
                    required
                    autoFocus
                  />
                </div>
              </Campo>

              <Campo>
                <label htmlFor="reg-usuario" className="etiqueta-campo">Usuario</label>
                <div className="login-input-wrap">
                  <UserRound size={17} aria-hidden="true" />
                  <input
                    id="reg-usuario"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-campo"
                    placeholder="Nombre de usuario"
                    autoComplete="username"
                    required
                  />
                </div>
              </Campo>
            </div>

            <Campo>
              <label htmlFor="reg-correo" className="etiqueta-campo">Correo</label>
              <div className="login-input-wrap">
                <Mail size={17} aria-hidden="true" />
                <input
                  id="reg-correo"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-campo"
                  placeholder="tucorreo@ejemplo.com"
                  autoComplete="email"
                  required
                />
              </div>
            </Campo>

            <Campo>
              <label htmlFor="reg-password" className="etiqueta-campo">Contraseña</label>
              <div className="login-input-wrap">
                <LockKeyhole size={17} aria-hidden="true" />
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-campo"
                  placeholder="Crea una contraseña segura"
                  autoComplete="new-password"
                  required
                />
              </div>
            </Campo>

            <Campo style={{ position: 'relative' }}>
              <label htmlFor="reg-institucion" className="etiqueta-campo">
                Institución (universidad o colegio)
              </label>
              <div className="login-input-wrap">
                <School size={17} aria-hidden="true" />
                <input
                  id="reg-institucion"
                  type="text"
                  value={institucion}
                  onChange={(e) => setInstitucion(e.target.value)}
                  onFocus={() => setMostrarSugerencias(true)}
                  onBlur={() => setTimeout(() => setMostrarSugerencias(false), 150)}
                  className="input-campo"
                  placeholder="Escribe para buscar o ingresa la tuya"
                  required
                  autoComplete="off"
                />
              </div>
              {mostrarSugerencias && sugerenciasFiltradas.length > 0 && (
                <ul
                  className="panel-flotante"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    maxHeight: '180px',
                    overflowY: 'auto',
                    listStyle: 'none',
                    padding: '4px',
                    margin: '4px 0 0',
                  }}
                >
                  {sugerenciasFiltradas.map((opcion) => (
                    <li
                      key={opcion}
                      onMouseDown={() => {
                        setInstitucion(opcion)
                        setMostrarSugerencias(false)
                      }}
                      style={{
                        padding: '8px 10px',
                        fontSize: '13px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {opcion}
                    </li>
                  ))}
                </ul>
              )}
            </Campo>

            <div style={filaDosColumnas}>
              <Campo>
                <label htmlFor="reg-telefono" className="etiqueta-campo">Teléfono</label>
                <div className="login-input-wrap">
                  <Phone size={17} aria-hidden="true" />
                  <input
                    id="reg-telefono"
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="input-campo"
                    placeholder="300 000 0000"
                    autoComplete="tel"
                    required
                  />
                </div>
              </Campo>

              <Campo>
                <label htmlFor="reg-documento" className="etiqueta-campo">Documento de identidad</label>
                <div className="login-input-wrap">
                  <Hash size={17} aria-hidden="true" />
                  <input
                    id="reg-documento"
                    type="text"
                    value={documentoIdentidad}
                    onChange={(e) => setDocumentoIdentidad(e.target.value)}
                    className="input-campo"
                    placeholder="Número de documento"
                    required
                  />
                </div>
              </Campo>
            </div>

            <div style={{ ...filaDosColumnas, gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)' }}>
              <Campo>
                <label htmlFor="reg-carrera" className="etiqueta-campo">Carrera</label>
                <div className="login-input-wrap">
                  <GraduationCap size={17} aria-hidden="true" />
                  <input
                    id="reg-carrera"
                    type="text"
                    value={carrera}
                    onChange={(e) => setCarrera(e.target.value)}
                    className="input-campo"
                  />
                </div>
              </Campo>

              <Campo>
                <label htmlFor="reg-semestre" className="etiqueta-campo">Semestre</label>
                <div className="login-input-wrap">
                  <Hash size={17} aria-hidden="true" />
                  <input
                    id="reg-semestre"
                    type="number"
                    min="1"
                    max="12"
                    value={semestre}
                    onChange={(e) => setSemestre(e.target.value)}
                    className="input-campo"
                  />
                </div>
              </Campo>
            </div>

            {/* Autorización de tratamiento de datos (Ley 1581 de 2012) */}
            <motion.label
              variants={rise}
              htmlFor="reg-acepta-datos"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '12.5px',
                lineHeight: 1.55,
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
              }}
            >
              <input
                id="reg-acepta-datos"
                type="checkbox"
                checked={aceptaDatos}
                onChange={(e) => setAceptaDatos(e.target.checked)}
                required
                style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: 'var(--primary)', flex: 'none' }}
              />
              <span>
                Autorizo el tratamiento de mis datos personales conforme a la{' '}
                <Link
                  to="/politica-de-datos"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--primary)', fontWeight: 600, textUnderlineOffset: '3px' }}
                >
                  política de tratamiento de datos
                </Link>
                .
              </span>
            </motion.label>

            {error && <p className="login-error" role="alert">{error}</p>}

            <motion.div variants={rise}>
              <button
                type="submit"
                disabled={enviando || !aceptaDatos}
                className="btn btn-primario login-submit"
              >
                <span>{enviando ? 'Creando cuenta...' : 'Crear mi cuenta'}</span>
                <ArrowRight size={17} strokeWidth={2} />
              </button>
            </motion.div>
          </motion.form>

          <p className="login-register">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
          <p className="login-secure"><LockKeyhole size={13} /> Tus datos están protegidos</p>
        </div>
      </section>
    </main>
  )
}

export default Registro
