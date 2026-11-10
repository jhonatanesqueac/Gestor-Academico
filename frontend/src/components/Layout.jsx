import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, BellOff, Check, CheckCheck, Clock, Flame, Layers, Menu, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Sidebar from './Slidebar'
import { useAuth } from '../context/useAuth'

const PUNTO_CORTE = 1024

// Cada tipo de alerta tiene su ícono y su color
const ESTILOS_ALERTA = {
  URGENTE: { Icono: Flame, color: 'var(--destructive)', fondo: '#f6e6e2', etiqueta: 'Urgente' },
  VENCIDA: { Icono: Clock, color: 'var(--media)', fondo: '#f4ebd8', etiqueta: 'Vencida' },
  CUELLO_BOTELLA: { Icono: Layers, color: '#4e6b78', fondo: '#e1eaec', etiqueta: 'Cuello de botella' },
}

function estiloDeAlerta(tipo = '') {
  const conocido = ESTILOS_ALERTA[tipo]
  if (conocido) return conocido
  const texto = tipo.replace(/_/g, ' ').toLowerCase()
  return {
    Icono: Bell,
    color: '#4d6357',
    fondo: '#e4ede2',
    etiqueta: texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : 'Aviso',
  }
}

function PanelAlertas({ alertas, onMarcarLeida, onEliminar }) {
  const sinLeer = alertas.filter((a) => !a.enviada)
  // Las no leídas primero; el resto conserva su orden
  const ordenadas = [...alertas].sort((a, b) => Number(a.enviada) - Number(b.enviada))

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="absolute right-0 top-12 z-50 w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-3xl border"
      style={{
        transformOrigin: 'top right',
        background: '#fbfcf9',
        boxShadow: '0 24px 60px rgba(19, 39, 32, 0.28), 0 4px 14px rgba(19, 39, 32, 0.1)',
      }}
    >
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
        <div className="flex items-center gap-2.5">
          <h3 style={{ fontSize: 16, letterSpacing: '-0.03em' }}>Notificaciones</h3>
          {sinLeer.length > 0 && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-bold num-tabular"
              style={{ background: '#173b36', color: '#b6cba9' }}
            >
              {sinLeer.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {sinLeer.length > 1 && (
            <button
              type="button"
              onClick={() => sinLeer.forEach((a) => onMarcarLeida(a.id))}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors hover:bg-black/5"
              style={{ color: 'var(--primary)' }}
            >
              <CheckCheck size={13} /> Marcar todas
            </button>
          )}
          {alertas.length > 0 && (
            <button
              type="button"
              onClick={() => alertas.forEach((a) => onEliminar(a.id))}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors hover:bg-black/5"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <Trash2 size={13} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {alertas.length === 0 ? (
        <div className="grid place-items-center gap-2 px-6 pb-10 pt-6 text-center">
          <span className="grid size-12 place-items-center rounded-full" style={{ background: '#e4ede2', color: '#4d6357' }}>
            <BellOff size={20} />
          </span>
          <div className="text-[14px] font-semibold">Todo al día</div>
          <p className="text-[12.5px] text-muted-foreground">No tienes alertas por ahora.</p>
        </div>
      ) : (
        <ul
          className="flex max-h-[min(440px,60vh)] flex-col gap-1.5 overflow-y-auto px-3 pb-3"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#b6cba9 transparent' }}
        >
          <AnimatePresence initial={false}>
          {ordenadas.map((alerta, i) => {
            const estilo = estiloDeAlerta(alerta.tipo)
            const leida = alerta.enviada
            const Icono = estilo.Icono
            return (
              <motion.li
                key={alerta.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: leida ? 0.6 : 1, y: 0 }}
                exit={{ opacity: 0, x: 36, scale: 0.96 }}
                transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.04 }}
                className="flex gap-3 rounded-2xl p-3"
                style={{
                  background: leida ? 'transparent' : '#ffffff',
                  border: `1px solid ${leida ? 'transparent' : 'var(--border)'}`,
                }}
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-xl"
                  style={{ background: estilo.fondo, color: estilo.color }}
                >
                  <Icono size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10.5px] font-bold uppercase tracking-wider"
                      style={{ color: estilo.color }}
                    >
                      {estilo.etiqueta}
                    </span>
                    {!leida && (
                      <span aria-label="Sin leer" className="size-1.5 rounded-full" style={{ background: estilo.color }} />
                    )}
                  </div>
                  <p className="mt-1 text-[13px] leading-snug">{alerta.mensaje}</p>
                  {leida ? (
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] text-muted-foreground">
                      <Check size={12} /> Leída
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onMarcarLeida(alerta.id)}
                      className="-ml-2 mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition-colors hover:bg-black/5"
                      style={{ color: 'var(--primary)' }}
                    >
                      <Check size={12} /> Marcar como leída
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Eliminar alerta"
                  title="Eliminar"
                  onClick={() => onEliminar(alerta.id)}
                  className="grid size-8 shrink-0 place-items-center self-start rounded-lg transition-colors hover:bg-destructive/10 hover:text-destructive!"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <Trash2 size={14} />
                </button>
              </motion.li>
            )
          })}
          </AnimatePresence>
        </ul>
      )}
    </motion.div>
  )
}

function Layout({
  activa,
  onCambiarPestaña,
  children,
  alertas = [],
  perfil,
  onMarcarLeida,
  onEliminarAlerta,
  asignaturas = [],
  filtroAsignatura,
  onSeleccionarAsignatura,
}) {
  const navigate = useNavigate()
  const { cerrarSesion } = useAuth()
  const [mostrarAlertas, setMostrarAlertas] = useState(false)
  const [esMovil, setEsMovil] = useState(() => window.innerWidth < PUNTO_CORTE)
  const [sidebarAbierto, setSidebarAbierto] = useState(() => window.innerWidth >= PUNTO_CORTE)
  const contenedorAlertasRef = useRef(null)

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

  // El panel de alertas se cierra al hacer clic fuera o con Escape
  useEffect(() => {
    if (!mostrarAlertas) return
    const alHacerClic = (e) => {
      if (!contenedorAlertasRef.current?.contains(e.target)) setMostrarAlertas(false)
    }
    const alPulsarTecla = (e) => {
      if (e.key === 'Escape') setMostrarAlertas(false)
    }
    document.addEventListener('mousedown', alHacerClic)
    document.addEventListener('keydown', alPulsarTecla)
    return () => {
      document.removeEventListener('mousedown', alHacerClic)
      document.removeEventListener('keydown', alPulsarTecla)
    }
  }, [mostrarAlertas])

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
  const fechaHoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        gap: 16,
        padding: esMovil ? 10 : 24,
        background:
          'radial-gradient(ellipse at 12% 12%, rgba(255, 255, 255, 0.55), transparent 34%), radial-gradient(ellipse at 92% 88%, rgba(77, 99, 87, 0.28), transparent 34%), #bccfc1',
      }}
    >
      {esMovil && sidebarAbierto && (
        <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setSidebarAbierto(false)} />
      )}

      <div
        inert={!sidebarAbierto}
        style={{
          position: esMovil ? 'fixed' : 'sticky',
          top: esMovil ? 0 : 24,
          left: 0,
          height: esMovil ? '100vh' : 'calc(100vh - 48px)',
          borderRadius: esMovil ? 0 : 26,
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

      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: '#f4f7f2',
          border: '1px solid rgba(255, 255, 255, 0.75)',
          borderRadius: 26,
          boxShadow: '0 30px 70px rgba(19, 39, 32, 0.28), 0 6px 18px rgba(19, 39, 32, 0.14)',
        }}
      >
        <header
          className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-4 lg:px-8 border-b"
          style={{
            background: 'rgba(244, 247, 242, 0.85)',
            backdropFilter: 'blur(8px)',
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {!sidebarAbierto && (
              <Button variant="outline" size="icon" aria-label="Mostrar menú" onClick={() => setSidebarAbierto(true)}>
                <Menu size={16} />
              </Button>
            )}
            <div className="min-w-0">
              <span
                className="inline-flex items-center gap-2.5 truncate text-[11.5px] font-bold uppercase"
                style={{ color: '#718174', letterSpacing: '0.13em' }}
              >
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: '#a4c49f', boxShadow: '0 0 12px rgba(164, 196, 159, 0.9)' }}
                />
                {fechaHoy}
              </span>
            </div>
          </div>

          <div className="relative shrink-0" ref={contenedorAlertasRef}>
            <Button
              variant="outline"
              size="icon"
              className="relative"
              aria-label="Alertas"
              aria-expanded={mostrarAlertas}
              onClick={() => setMostrarAlertas(!mostrarAlertas)}
            >
              <motion.span
                className="inline-flex"
                style={{ transformOrigin: '50% 0%' }}
                animate={alertasSinLeer.length > 0 ? { rotate: [0, -14, 12, -8, 4, 0] } : { rotate: 0 }}
                transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 5 }}
              >
                <Bell size={16} />
              </motion.span>
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

            <AnimatePresence>
              {mostrarAlertas && <PanelAlertas alertas={alertas} onMarcarLeida={onMarcarLeida} onEliminar={onEliminarAlerta} />}
            </AnimatePresence>
          </div>
        </header>

        <motion.main
          key={activa}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="px-4 py-5 lg:px-8 lg:py-7"
        >
          {children}
        </motion.main>
      </div>
    </div>
  )
}

export default Layout
