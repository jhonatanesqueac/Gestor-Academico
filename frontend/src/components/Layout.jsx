import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Menu } from 'lucide-react'
import Sidebar from './Slidebar'
import api from '../api/axios'
import { useAuth } from '../context/useAuth'

function Layout({ activa, onCambiarPestaña, children, alertas = [], onMarcarLeida, asignaturas = [], filtroAsignatura, onSeleccionarAsignatura }) {
  const navigate = useNavigate()
  const { cerrarSesion } = useAuth()
  const [mostrarAlertas, setMostrarAlertas] = useState(false)
  const [sidebarAbierto, setSidebarAbierto] = useState(() => window.innerWidth >= 1024)
  const nombre = localStorage.getItem('nombre') || 'Estudiante'

  // Si la persona ensancha la ventana de vuelta a escritorio, reabre el
  // sidebar automáticamente; si la angosta a móvil, lo cierra solo.
  useEffect(() => {
    const alRedimensionar = () => setSidebarAbierto(window.innerWidth >= 1024)
    window.addEventListener('resize', alRedimensionar)
    return () => window.removeEventListener('resize', alRedimensionar)
  }, [])

  // En pantallas angostas, cierra el sidebar automáticamente después de
  // elegir una pestaña — así no tapa el contenido tras navegar.
  const handleCambiarPestaña = (id) => {
    onCambiarPestaña(id)
    if (window.innerWidth < 1024) setSidebarAbierto(false)
  }

  const handleLogout = async () => {
    try {
      // El backend lee el refresh token directamente de la cookie
      // httpOnly -- ya no hace falta que se lo mandemos nosotros.
      await api.post('auth/logout/', {})
    } catch (err) {
      // Si falla (token ya vencido, sin conexión, etc.) no pasa nada
      // grave: igual limpiamos la sesión local del usuario.
      console.error('No se pudo invalidar el refresh token:', err)
    } finally {
      localStorage.removeItem('nombre')
      cerrarSesion()
      navigate('/login')
    }
  }

  const alertasSinLeer = alertas.filter((a) => !a.enviada)

  const saludo = () => {
    const hora = new Date().getHours()
    if (hora < 12) return 'Buenos días'
    if (hora < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
             {sidebarAbierto && (
        <div
          onClick={() => setSidebarAbierto(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      <div
        style={{
          position: window.innerWidth < 1024 ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 40,
          transform: sidebarAbierto ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.2s ease',
        }}
      >
        <Sidebar
          activa={activa}
          onCambiarPestaña={handleCambiarPestaña}
          onLogout={handleLogout}
          asignaturas={asignaturas}
          filtroAsignatura={filtroAsignatura}
          onSeleccionarAsignatura={onSeleccionarAsignatura}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 32px',
            borderBottom: '1px solid var(--border)',
            position: 'sticky',
            top: 0,
            background: 'var(--background)',
            zIndex: 20,
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarAbierto(!sidebarAbierto)}
              className="btn-secundario shrink-0"
              style={{ borderRadius: 'var(--radius-sm)', padding: '8px 9px', border: '1px solid var(--border)', background: 'var(--card)' }}
            >
              <Menu size={17} strokeWidth={1.9} />
            </button>
            <div>
              <h1>{saludo()}, {nombre.split(' ')[0]}</h1>
              <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                Esto es lo que tienes pendiente hoy.
              </p>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMostrarAlertas(!mostrarAlertas)}
              className="btn-secundario"
              style={{
                borderRadius: 'var(--radius-sm)',
                padding: '8px 9px',
                border: '1px solid var(--border)',
                background: 'var(--card)',
                position: 'relative',
                display: 'flex',
              }}
            >
              <Bell size={17} strokeWidth={1.9} />
              {alertasSinLeer.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: 'var(--destructive)',
                    color: '#fff',
                    borderRadius: '999px',
                    minWidth: '16px',
                    height: '16px',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                  }}
                >
                  {alertasSinLeer.length}
                </span>
              )}
            </button>

            {mostrarAlertas && (
              <div
                className="panel-flotante"
                style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '340px',
                  maxHeight: '420px',
                  overflowY: 'auto',
                  padding: '6px',
                }}
              >
                {alertas.length === 0 && (
                  <p style={{ padding: '16px', color: 'var(--muted-foreground)', fontSize: '13.5px' }}>
                    No tienes alertas.
                  </p>
                )}
                {alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    style={{
                      padding: '11px 10px',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '2px',
                      backgroundColor: alerta.enviada ? 'transparent' : 'var(--media-soft)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        color: alerta.tipo === 'URGENTE' ? 'var(--destructive)' : 'var(--muted-foreground)',
                        marginBottom: '3px',
                      }}
                    >
                      {alerta.tipo.replace('_', ' ')}
                    </div>
                    <div style={{ fontSize: '13.5px', marginBottom: '6px' }}>{alerta.mensaje}</div>
                    {!alerta.enviada && (
                      <button
                        onClick={() => onMarcarLeida(alerta.id)}
                        className="btn-texto"
                        style={{ color: 'var(--primary)', padding: 0 }}
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        <main className="animar-entrada px-4 py-5 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout