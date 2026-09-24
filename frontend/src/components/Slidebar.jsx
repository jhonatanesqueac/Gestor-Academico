import { LayoutDashboard, LayoutGrid, Calendar, BarChart3, Settings, LogOut, ChevronDown } from 'lucide-react'

const general = [
  { id: 'inicio', etiqueta: 'Inicio', Icono: LayoutDashboard },
  { id: 'kanban', etiqueta: 'Tablero', Icono: LayoutGrid },
  { id: 'calendario', etiqueta: 'Calendario', Icono: Calendar },
  { id: 'carga', etiqueta: 'Carga semanal', Icono: BarChart3 },
  { id: 'gestionar', etiqueta: 'Gestionar', Icono: Settings },
]

function Sidebar({ activa, onCambiarPestaña, onLogout, asignaturas = [], filtroAsignatura, onSeleccionarAsignatura }) {
  const nombre = localStorage.getItem('nombre') || 'Estudiante'
  const inicial = nombre.trim().charAt(0).toUpperCase()

  return (
    <aside
      style={{
        width: 'var(--sidebar-w)',
        flexShrink: 0,
        height: '100vh',
        background: 'var(--sidebar)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 12px',
        overflowY: 'auto',
      }}
    >
      {/* Perfil */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          padding: '8px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '18px',
        }}
      >
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '999px',
            background: 'var(--sidebar-primary)',
            color: 'var(--sidebar-primary-foreground)',
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--sidebar-accent-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {nombre.split(' ')[0]}
          </div>
        </div>
        <ChevronDown size={14} color="var(--sidebar-foreground)" />
      </div>

      {/* General */}
      <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--sidebar-foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 8px', marginBottom: '6px' }}>
        General
      </div>
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
                padding: '8px 8px',
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
          <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--sidebar-foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 8px', marginBottom: '6px' }}>
            Mis cursos
          </div>
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

      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--sidebar-foreground)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 8px', marginBottom: '6px' }}>
          Cuenta
        </div>
        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'transparent',
            color: 'var(--sidebar-foreground)',
            fontSize: '13px',
            fontWeight: 500,
            width: '100%',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={16} strokeWidth={1.9} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export default Sidebar