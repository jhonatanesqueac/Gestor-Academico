import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  House,
  LayoutGrid,
  Calendar,
  BarChart3,
  History,
  Settings,
  LogOut,
  PanelLeftClose,
  UserRound,
  Sparkles,
  Workflow,
  ShieldCheck,
  Cookie,
} from 'lucide-react'
import { colorTextoSobre } from '../lib/color'
import { useConsent } from '../context/consentStore'
import { stagger, rise } from '../lib/motion'

const general = [
  { id: 'inicio', etiqueta: 'Inicio', Icono: House },
  { id: 'kanban', etiqueta: 'Tablero', Icono: LayoutGrid },
  { id: 'asistente', etiqueta: 'Asistente IA', Icono: Sparkles },
  { id: 'calendario', etiqueta: 'Calendario', Icono: Calendar },
  { id: 'carga', etiqueta: 'Carga semanal', Icono: BarChart3 },
  { id: 'historial', etiqueta: 'Historial', Icono: History },
  { id: 'gestionar', etiqueta: 'Gestionar', Icono: Settings },
]

const estiloSeccion = {
  fontSize: '10.5px',
  fontWeight: 600,
  color: 'var(--sidebar-foreground)',
  opacity: 0.6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  padding: '0 8px',
  marginBottom: '6px',
}

const resorte = { type: 'spring', stiffness: 500, damping: 38 }

// Botón de menú: el fondo del ítem activo "viaja" de uno a otro (layoutId)
function ItemNav({ activo, onClick, pillId, tamaño = 13, children }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex w-full items-center rounded-sm px-2 py-2 text-left transition-colors ${
        activo ? 'font-semibold' : 'font-medium hover:bg-white/[0.05]'
      }`}
      style={{
        fontSize: tamaño,
        border: 'none',
        color: activo ? 'var(--sidebar-accent-foreground)' : 'var(--sidebar-foreground)',
      }}
    >
      {activo && (
        <motion.span
          layoutId={pillId}
          transition={resorte}
          className="absolute inset-0 rounded-sm bg-sidebar-accent"
        />
      )}
      <span className="relative z-10 flex w-full min-w-0 items-center gap-2.5">{children}</span>
    </button>
  )
}

function Sidebar({
  activa,
  onCambiarPestaña,
  onLogout,
  onCerrar,
  perfil,
  asignaturas = [],
  filtroAsignatura,
  onSeleccionarAsignatura,
}) {
  const { openPrefs } = useConsent()
  const nombre = perfil?.nombre || localStorage.getItem('nombre') || 'Estudiante'
  const inicial = nombre.trim().charAt(0).toUpperCase()
  const colorAvatar = perfil?.color_avatar
  const perfilActivo = activa === 'perfil'

  return (
    <aside
      style={{
        width: 'var(--sidebar-w)',
        height: '100%',
        background:
          'radial-gradient(ellipse at 80% 0%, rgba(137, 161, 142, 0.14), transparent 45%), var(--sidebar)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 12px',
        overflowY: 'auto',
      }}
    >
      {/* Marca, igual que en el login */}
      <div className="login-brand" style={{ padding: '2px 4px', marginBottom: '16px' }}>
        <span className="login-brand-icon" style={{ width: 32, height: 32, borderRadius: 10 }}>
          <Workflow size={18} strokeWidth={2.2} />
        </span>
        <span style={{ fontSize: '16px' }}>StudyFlow</span>
      </div>

      {/* Perfil + botón para ocultar el menú */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '18px' }}>
        <button
          onClick={() => onCambiarPestaña('perfil')}
          title="Ver mi perfil"
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors ${
            perfilActivo ? 'bg-sidebar-accent' : 'hover:bg-white/[0.05]'
          }`}
          style={{ border: 'none' }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '999px',
              background: colorAvatar || 'var(--sidebar-primary)',
              color: colorAvatar ? colorTextoSobre(colorAvatar) : 'var(--sidebar-primary-foreground)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {inicial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--sidebar-accent-foreground)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {nombre.split(' ')[0]}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--sidebar-foreground)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {perfil?.username ? `@${perfil.username}` : 'Ver perfil'}
            </div>
          </div>
        </button>

        <button
          onClick={onCerrar}
          title="Ocultar menú"
          aria-label="Ocultar menú"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm transition-colors hover:bg-white/[0.07]"
          style={{ border: 'none', color: 'var(--sidebar-foreground)' }}
        >
          <PanelLeftClose size={16} strokeWidth={1.9} />
        </button>
      </div>

      {/* General */}
      <div style={estiloSeccion}>General</div>
      <motion.nav
        variants={stagger}
        initial="hidden"
        animate="show"
        style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '18px' }}
      >
        {general.map(({ id, etiqueta, Icono }) => {
          const esActiva = activa === id
          return (
            <motion.div key={id} variants={rise}>
              <ItemNav activo={esActiva} pillId="pill-nav" onClick={() => onCambiarPestaña(id)}>
                <Icono size={16} strokeWidth={esActiva ? 2.25 : 1.9} />
                {etiqueta}
              </ItemNav>
            </motion.div>
          )
        })}
      </motion.nav>

      {/* Mis cursos */}
      {asignaturas.length > 0 && (
        <>
          <div style={estiloSeccion}>Mis cursos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '18px' }}>
            {asignaturas.map((a) => {
              const esActiva = filtroAsignatura === a.id
              return (
                <ItemNav
                  key={a.id}
                  activo={esActiva}
                  pillId="pill-cursos"
                  tamaño={12.5}
                  onClick={() => onSeleccionarAsignatura(a.id)}
                >
                  <span
                    style={{ width: '8px', height: '8px', borderRadius: '999px', background: a.color, flexShrink: 0 }}
                  />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.nombre}
                  </span>
                </ItemNav>
              )
            })}
          </div>
        </>
      )}

      {/* Cuenta */}
      <div style={{ marginTop: 'auto' }}>
        <div style={estiloSeccion}>Cuenta</div>
        <ItemNav activo={perfilActivo} pillId="pill-nav" onClick={() => onCambiarPestaña('perfil')}>
          <UserRound size={16} strokeWidth={perfilActivo ? 2.25 : 1.9} />
          Mi perfil
        </ItemNav>
        <ItemNav activo={false} pillId="pill-cuenta" onClick={onLogout}>
          <LogOut size={16} strokeWidth={1.9} />
          Cerrar sesión
        </ItemNav>

        {/* Privacidad */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px 14px',
            padding: '14px 8px 2px',
            marginTop: '10px',
            borderTop: '1px solid var(--sidebar-border)',
          }}
        >
          <Link
            to="/politica-de-datos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] text-sidebar-foreground opacity-70 transition-opacity hover:opacity-100"
          >
            <ShieldCheck size={12} /> Política de datos
          </Link>
          <button
            onClick={openPrefs}
            className="inline-flex items-center gap-1.5 text-[11px] opacity-70 transition-opacity hover:opacity-100"
            style={{ border: 'none', padding: 0, color: 'var(--sidebar-foreground)' }}
          >
            <Cookie size={12} /> Cookies
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
