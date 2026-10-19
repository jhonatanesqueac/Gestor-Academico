import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Sidebar from './Slidebar'
import { useAuth } from '../context/useAuth'

const PUNTO_CORTE = 1024

function Layout({
  activa,
  onCambiarPestaña,
  children,
   alertas = [],
  perfil,
  onMarcarLeida,
  asignaturas = [],
  filtroAsignatura,
  onSeleccionarAsignatura,
}) {
  const navigate = useNavigate()
  const { cerrarSesion } = useAuth()
  const [mostrarAlertas, setMostrarAlertas] = useState(false)
  const [esMovil, setEsMovil] = useState(() => window.innerWidth < PUNTO_CORTE)
  const [sidebarAbierto, setSidebarAbierto] = useState(() => window.innerWidth >= PUNTO_CORTE)
  const nombre = perfil?.nombre || localStorage.getItem('nombre') || 'Estudiante'

  // Solo reacciona cuando la ventana CRUZA el punto de corte, así un ajuste
  // pequeño de tamaño no reabre un menú que la persona cerró a propósito.
  useEffect(() => {
    let eraMovil = window.innerWidth < PUNTO_CORTE
    const alRedimensionar = () => {
      const esAhoraMovil = window.innerWidth < PUNTO_CORTE
      if (esAhoraMovil !== eraMovil) {
        eraMovil = esAhoraMovil
        setEsMovil(esAhoraMovil)
        setSidebarAbierto(!esAhoraMovil)
      }
    }
    window.addEventListener('resize', alRedimensionar)
    return () => window.removeEventListener('resize', alRedimensionar)
  }, [])

  const handleLogout = async () => {
    // Avisa al backend (borra la cookie del refresh) y limpia el estado.
    await cerrarSesion()
    localStorage.removeItem('nombre')
    navigate('/login')
  }

  // En móvil el menú flota sobre el contenido: se cierra solo tras elegir algo.
  const handleCambiarPestaña = (id) => {
    onCambiarPestaña(id)
    if (esMovil) setSidebarAbierto(false)
  }

  const handleSeleccionarAsignatura = (id) => {
    onSeleccionarAsignatura(id)
    if (esMovil) setSidebarAbierto(false)
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
      {esMovil && sidebarAbierto && (
        <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setSidebarAbierto(false)} />
      )}

      <div
        inert={!sidebarAbierto}
        style={{
          position: esMovil ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 40,
          flexShrink: 0,
          overflow: 'hidden',
          width: esMovil || sidebarAbierto ? 'var(--sidebar-w)' : 0,
          transform: esMovil && !sidebarAbierto ? 'translateX(-100%)' : 'none',
          transition: 'width 0.2s ease, transform 0.2s ease',
        }}
      >
        <Sidebar
          activa={activa}
          onCambiarPestaña={handleCambiarPestaña}
          onLogout={handleLogout}
          onCerrar={() => setSidebarAbierto(false)}
          asignaturas={asignaturas}
          filtroAsignatura={filtroAsignatura}
          perfil={perfil}
          onSeleccionarAsignatura={handleSeleccionarAsignatura}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <header
          className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-4 lg:px-8 border-b"
          style={{ background: 'var(--background)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {!sidebarAbierto && (
              <Button variant="outline" size="icon" aria-label="Mostrar menú" onClick={() => setSidebarAbierto(true)}>
                <Menu size={16} />
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="truncate">
                {saludo()}, {nombre.split(' ')[0]}
              </h1>
              <p className="text-[13px] text-muted-foreground mt-0.5">Esto es lo que tienes pendiente hoy.</p>
            </div>
          </div>

          <div className="relative shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="relative"
              aria-label="Alertas"
              onClick={() => setMostrarAlertas(!mostrarAlertas)}
            >
              <Bell size={16} />
              {alertasSinLeer.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
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
            </Button>

            {mostrarAlertas && (
              <div
                className="panel-flotante absolute right-0 top-11 w-[min(340px,calc(100vw-2rem))] max-h-[420px] overflow-y-auto p-1.5"
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

        <main className="animar-entrada px-4 py-5 lg:px-8 lg:py-7">{children}</main>
      </div>
    </div>
  )
}

export default Layout