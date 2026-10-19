import { House, LayoutGrid, Calendar, BarChart3, History, Settings, LogOut, PanelLeftClose, UserRound } from 'lucide-react'
import { colorTextoSobre } from '../lib/color'

const general = [
  { id: 'inicio', etiqueta: 'Inicio', Icono: House },
  { id: 'kanban', etiqueta: 'Tablero', Icono: LayoutGrid },
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

function ItemCuenta({ Icono, etiqueta, onClick, activo }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: activo ? 'var(--sidebar-accent)' : 'transparent',
        color: activo ? 'var(--sidebar-accent-foreground)' : 'var(--sidebar-foreground)',
        fontSize: '13px',
        fontWeight: activo ? 600 : 500,
        width: '100%',
        textAlign: 'left',
        transition: 'background-color 0.12s ease, color 0.12s ease',
      }}
      onMouseEnter={(e) => { if (!activo) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
      onMouseLeave={(e) => { if (!activo) e.currentTarget.style.background = 'transparent' }}
    >
      <Icono size={16} strokeWidth={activo ? 2.25 : 1.9} />
      {etiqueta}
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
  const nombre = perfil?.nombre || localStorage.getItem('nombre') || 'Estudiante'
  const inicial = nombre.trim().charAt(0).toUpperCase()
  const colorAvatar = perfil?.color_avatar
  const perfilActivo = activa === 'perfil'

  return (
    <aside
      style={{
        width: 'var(--sidebar-w)',
        height: '100%',
        background: 'var(--sidebar)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 12px',
        overflowY: 'auto',
      }}
    >
      {/* Perfil + botón para ocultar el menú */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '18px' }}>
        <button
          onClick={() => onCambiarPestaña('perfil')}
          title="Ver mi perfil"
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '6px 8px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: perfilActivo ? 'var(--sidebar-accent)' : 'transparent',
            textAlign: 'left',
            transition: 'background-color 0.12s ease',
          }}
          onMouseEnter={(e) => { if (!perfilActivo) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
          onMouseLeave={(e) => { if (!perfilActivo) e.currentTarget.style.background = 'transparent' }}
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
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'transparent',
            color: 'var(--sidebar-foreground)',
            flexShrink: 0,
            transition: 'background-color 0.12s ease, color 0.12s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
            e.currentTarget.style.color = 'var(--sidebar-accent-foreground)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--sidebar-foreground)'
          }}
        >
          <PanelLeftClose size={16} strokeWidth={1.9} />
        </button>
      </div>

      {/* General */}
      <div style={estiloSeccion}>General</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '18px' }}>
        {general.map(({ id, etiqueta, Icono }) => {
          const esActiva = activa === id
          return (
            <button
              key={id}
              onClick={() => onCambiarPestaña(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: esActiva ? 'var(--sidebar-accent)' : 'transparent',
                color: esActiva ? 'var(--sidebar-accent-foreground)' : 'var(--sidebar-foreground)',
                fontWeight: esActiva ? 600 : 500,
                fontSize: '13px',
                textAlign: 'left',
                transition: 'background-color 0.12s ease, color 0.12s ease',
              }}
              onMouseEnter={(e) => { if (!esActiva) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={(e) => { if (!esActiva) e.currentTarget.style.background = 'transparent' }}
            >
              <Icono size={16} strokeWidth={esActiva ? 2.25 : 1.9} />
              {etiqueta}
            </button>
          )
        })}
      </nav>

      {/* Mis cursos */}
      {asignaturas.length > 0 && (
        <>
          <div style={estiloSeccion}>Mis cursos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '18px' }}>
            {asignaturas.map((a) => {
              const esActiva = filtroAsignatura === a.id
              return (
                <button
                  key={a.id}
                  onClick={() => onSeleccionarAsignatura(a.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '7px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: esActiva ? 'var(--sidebar-accent)' : 'transparent',
                    color: esActiva ? 'var(--sidebar-accent-foreground)' : 'var(--sidebar-foreground)',
                    fontSize: '12.5px',
                    fontWeight: esActiva ? 600 : 500,
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { if (!esActiva) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={(e) => { if (!esActiva) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: a.color, flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nombre}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Cuenta */}
      <div style={{ marginTop: 'auto' }}>
        <div style={estiloSeccion}>Cuenta</div>
        <ItemCuenta Icono={UserRound} etiqueta="Mi perfil" activo={perfilActivo} onClick={() => onCambiarPestaña('perfil')} />
        <ItemCuenta Icono={LogOut} etiqueta="Cerrar sesión" onClick={onLogout} />
      </div>
    </aside>
  )
}

export default Sidebar