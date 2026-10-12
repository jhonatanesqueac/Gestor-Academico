import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus, Workflow } from 'lucide-react'
import api, { setAccessToken } from '../api/axios'
import { useAuth } from '../context/useAuth'

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
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const navigate = useNavigate()
  const { iniciarSesion } = useAuth()
  const contenedorInstitucionRef = useRef(null)

  const sugerenciasFiltradas = institucion.trim()
    ? INSTITUCIONES_SUGERIDAS.filter((i) =>
        i.toLowerCase().includes(institucion.trim().toLowerCase())
      )
    : INSTITUCIONES_SUGERIDAS

  const handleSubmit = async (e) => {
    e.preventDefault()
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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
        padding: '20px',
      }}
    >
      <div className="animar-entrada panel" style={{ width: '420px', maxWidth: '100%', padding: '36px' }}>
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
          <h1 style={{ fontSize: '18px', marginBottom: '2px' }}>Crear cuenta</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Empieza a priorizar tu semestre
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label className="etiqueta-campo">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="input-campo"
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label className="etiqueta-campo">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-campo"
              required
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label className="etiqueta-campo">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-campo"
              required
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label className="etiqueta-campo">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-campo"
              required
            />
          </div>

          <div style={{ marginBottom: '12px', position: 'relative' }} ref={contenedorInstitucionRef}>
            <label className="etiqueta-campo">Institución (universidad o colegio)</label>
            <input
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
                  margin: 0,
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
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted, #eee)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {opcion}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <label className="etiqueta-campo">Teléfono</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="input-campo"
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="etiqueta-campo">Documento de identidad</label>
              <input
                type="text"
                value={documentoIdentidad}
                onChange={(e) => setDocumentoIdentidad(e.target.value)}
                className="input-campo"
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <div style={{ flex: 2 }}>
              <label className="etiqueta-campo">Carrera</label>
              <input
                type="text"
                value={carrera}
                onChange={(e) => setCarrera(e.target.value)}
                className="input-campo"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="etiqueta-campo">Semestre</label>
              <input
                type="number"
                min="1"
                max="12"
                value={semestre}
                onChange={(e) => setSemestre(e.target.value)}
                className="input-campo"
              />
            </div>
          </div>

          {error && (
            <p style={{ color: 'var(--alerta)', fontSize: '13px', marginBottom: '16px' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="btn btn-primario"
            style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
          >
            <UserPlus size={15} strokeWidth={2} />
            {enviando ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        <p style={{ marginTop: '18px', fontSize: '13px', textAlign: 'center', color: 'var(--text-muted)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Registro
