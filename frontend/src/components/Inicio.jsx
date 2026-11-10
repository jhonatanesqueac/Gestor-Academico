import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Flame,
  ListChecks,
  Plus,
  TrendingUp,
} from 'lucide-react'
import api from '../api/axios'
import AnilloCriticidad from './AnilloCriticidad'
import { esVencida } from '../lib/tareas'
import { stagger, rise } from '../lib/motion'

const ease = [0.22, 1, 0.36, 1]

const TONOS = [
  { fuerte: '#4d6357', suave: 'rgba(182, 203, 169, 0.38)' },
  { fuerte: '#4e6b78', suave: 'rgba(78, 107, 120, 0.16)' },
  { fuerte: '#96702e', suave: 'rgba(150, 112, 46, 0.16)' },
  { fuerte: '#173b36', suave: 'rgba(23, 59, 54, 0.12)' },
]

/* ---------- Utilidades ---------- */

function saludo() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function formatearNombre(crudo) {
  const primero = crudo.trim().split(/\s+/)[0] ?? ''
  return primero.charAt(0).toUpperCase() + primero.slice(1).toLowerCase()
}

// Días de calendario entre hoy y la fecha (0 = hoy, 1 = mañana)
function diasHasta(fecha) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const destino = new Date(fecha)
  destino.setHours(0, 0, 0, 0)
  return Math.round((destino - hoy) / 86400000)
}

function etiquetaDias(dias) {
  if (dias <= 0) return 'Hoy'
  if (dias === 1) return 'Mañana'
  return `En ${dias} d`
}

function inicioDeSemana() {
  const hoy = new Date()
  const d = new Date(hoy)
  d.setDate(hoy.getDate() + (hoy.getDay() === 0 ? -6 : 1 - hoy.getDay()))
  d.setHours(0, 0, 0, 0)
  return d
}

function datosSemana(tareas) {
  const inicio = inicioDeSemana()
  const hoy = new Date().toDateString()
  const etiquetas = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return etiquetas.map((etiqueta, i) => {
    const dia = new Date(inicio)
    dia.setDate(inicio.getDate() + i)
    const cantidad = tareas.filter((t) => new Date(t.fecha_entrega).toDateString() === dia.toDateString()).length
    return { dia: etiqueta, tareas: cantidad, esHoy: dia.toDateString() === hoy }
  })
}

// Número que sube de 0 hasta su valor
function useContador(objetivo, duracion = 1100) {
  const [valor, setValor] = useState(0)

  useEffect(() => {
    let cuadro
    let inicio
    const paso = (t) => {
      if (inicio === undefined) inicio = t
      const progreso = Math.min((t - inicio) / duracion, 1)
      setValor(objetivo * (1 - Math.pow(1 - progreso, 3)))
      if (progreso < 1) cuadro = requestAnimationFrame(paso)
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [objetivo, duracion])

  return valor
}

function Numero({ valor, decimales = 0, sufijo = '' }) {
  const actual = useContador(valor)
  return (
    <>
      {decimales > 0 ? Number(actual.toFixed(decimales)) : Math.round(actual)}
      {sufijo}
    </>
  )
}

/* ---------- Nombre animado ---------- */

// Las letras entran una a una y, cada cierto tiempo, una ola de luz las recorre
function NombreAnimado({ nombre }) {
  return (
    <motion.span
      aria-label={nombre}
      className="inline-flex"
      style={{ perspective: 600 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.35 } } }}
      initial="hidden"
      animate="show"
    >
      {[...nombre].map((letra, i) => (
        <motion.span
          key={`${letra}-${i}`}
          aria-hidden="true"
          className="inline-block"
          variants={{
            hidden: { opacity: 0, y: '0.7em', rotateX: -70, filter: 'blur(10px)' },
            show: {
              opacity: 1,
              y: 0,
              rotateX: 0,
              filter: 'blur(0px)',
              transition: { type: 'spring', stiffness: 220, damping: 16 },
            },
          }}
        >
          <motion.span
            className="inline-block"
            animate={{ color: ['#f3f5ef', '#b6cba9', '#f3f5ef'], y: [0, -7, 0] }}
            transition={{
              duration: 0.9,
              delay: 2.2 + i * 0.09,
              repeat: Infinity,
              repeatDelay: 4.5,
              ease: 'easeInOut',
            }}
          >
            {letra}
          </motion.span>
        </motion.span>
      ))}
    </motion.span>
  )
}

/* ---------- Piezas ---------- */

function AnilloProgreso({ porcentaje, tamaño = 150 }) {
  const radio = 54
  const circunferencia = 2 * Math.PI * radio

  return (
    <div className="relative grid place-items-center" style={{ width: tamaño, height: tamaño }}>
      <svg
        viewBox="0 0 128 128"
        width={tamaño}
        height={tamaño}
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden="true"
      >
        <circle cx="64" cy="64" r={radio} fill="none" stroke="rgba(239, 244, 235, 0.14)" strokeWidth="9" />
        <motion.circle
          cx="64"
          cy="64"
          r={radio}
          fill="none"
          stroke="#b6cba9"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          initial={{ strokeDashoffset: circunferencia }}
          animate={{ strokeDashoffset: circunferencia * (1 - porcentaje / 100) }}
          transition={{ duration: 1.4, ease, delay: 0.5 }}
        />
      </svg>
      <div
        className="absolute text-center num-tabular"
        style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.05em', color: '#f3f5ef' }}
      >
        <Numero valor={porcentaje} sufijo="%" />
      </div>
    </div>
  )
}

function StatCard({ Icono, etiqueta, valor, decimales = 0, texto, detalle, tono }) {
  return (
    <motion.div
      variants={rise}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-3xl border bg-card p-5 transition-shadow hover:shadow-xl"
    >
      <span aria-hidden="true" className="absolute -right-6 -top-6 size-24 rounded-full" style={{ background: tono.suave }} />
      <span
        className="relative grid size-10 place-items-center rounded-2xl"
        style={{ background: tono.fuerte, color: '#f6f7f3' }}
      >
        <Icono size={18} />
      </span>
      <div className="relative mt-4 text-[12px] font-medium text-muted-foreground">{etiqueta}</div>
      <div
        className="relative mt-0.5 num-tabular"
        style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-0.05em', lineHeight: 1.05 }}
      >
        {texto !== undefined ? texto : <Numero valor={valor} decimales={decimales} />}
      </div>
      {detalle && (
        <div className="relative mt-1 truncate text-[11.5px] text-muted-foreground first-letter:uppercase">{detalle}</div>
      )}
    </motion.div>
  )
}

function LineaDeTiempo({ tarea }) {
  const inicio = new Date(tarea.creado_en)
  const fin = new Date(tarea.fecha_entrega)
  const ahora = new Date()
  const total = fin - inicio || 1
  const avance = Math.max(0, Math.min(100, ((ahora - inicio) / total) * 100))
  const formato = (f) => f.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })

  return (
    <div className="w-full">
      <div className="relative mb-2 h-1.5 rounded-full bg-muted">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: 'linear-gradient(90deg, #b6cba9, #4d6357)' }}
          initial={{ width: 0 }}
          animate={{ width: `${avance}%` }}
          transition={{ duration: 1, ease, delay: 0.4 }}
        />
        <motion.div
          className="absolute -top-1 size-3.5 rounded-full border-2 border-card"
          style={{ background: '#173b36', boxShadow: '0 0 0 4px rgba(77, 99, 87, 0.18)' }}
          initial={{ left: 0 }}
          animate={{ left: `calc(${avance}% - 7px)` }}
          transition={{ duration: 1, ease, delay: 0.4 }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{formato(inicio)}</span>
        <span className="font-semibold text-foreground">Hoy</span>
        <span>{formato(fin)}</span>
      </div>
    </div>
  )
}

function BloqueTiempo({ valor, etiqueta }) {
  return (
    <div className="min-w-[72px] rounded-2xl border bg-card px-4 py-2.5 text-center">
      <div className="num-tabular" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.05em', lineHeight: 1 }}>
        <Numero valor={valor} />
      </div>
      <div className="mt-1 text-[10.5px] uppercase tracking-wider text-muted-foreground">{etiqueta}</div>
    </div>
  )
}

function Prioridad({ tarea, onAvanzar, onIrTablero }) {
  const color = tarea.asignatura_color || 'var(--primary)'
  const restante = new Date(tarea.fecha_entrega) - new Date()
  const dias = Math.max(0, Math.floor(restante / 86400000))
  const horas = Math.max(0, Math.floor((restante % 86400000) / 3600000))
  const fechaLarga = new Date(tarea.fecha_entrega).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--primary)' }}
        >
          <Flame size={14} /> Tu prioridad ahora
        </span>
        <span
          className="rounded-full px-3 py-1 text-[10.5px] font-semibold uppercase tracking-wide"
          style={{
            backgroundColor: `color-mix(in oklab, ${color} 16%, var(--card))`,
            color: `color-mix(in oklab, ${color} 65%, var(--foreground))`,
          }}
        >
          {tarea.asignatura_nombre}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-6">
        <AnilloCriticidad nivel={tarea.nivel_criticidad} tamaño={112} />
        <div className="min-w-[220px] flex-1">
          <h3 style={{ fontSize: 'clamp(22px, 2.4vw, 30px)', letterSpacing: '-0.045em', lineHeight: 1.1 }}>
            {tarea.titulo}
          </h3>
          <p className="mt-1 text-[12.5px] text-muted-foreground first-letter:uppercase">Entrega: {fechaLarga}</p>
          <div className="mt-4 flex gap-2.5">
            <BloqueTiempo valor={dias} etiqueta={dias === 1 ? 'día' : 'días'} />
            <BloqueTiempo valor={horas} etiqueta={horas === 1 ? 'hora' : 'horas'} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <LineaDeTiempo tarea={tarea} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <button type="button" className="btn btn-primario" style={{ padding: '10px 18px' }} onClick={() => onAvanzar(tarea)}>
          {tarea.estado === 'PENDIENTE' ? 'Comenzar' : 'Marcar terminada'} <ArrowRight size={14} />
        </button>
        <button type="button" className="btn btn-secundario" style={{ padding: '10px 18px' }} onClick={onIrTablero}>
          Ver en el tablero
        </button>
      </div>
    </>
  )
}

function Semana({ datos }) {
  const maximo = Math.max(1, ...datos.map((d) => d.tareas))

  return (
    <div className="flex items-end justify-between gap-2" style={{ height: 150 }}>
      {datos.map((d, i) => (
        <div key={d.dia} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <span className="num-tabular text-[11px] text-muted-foreground">{d.tareas || ''}</span>
          <motion.div
            className="w-full rounded-xl"
            style={{
              maxWidth: 34,
              background: d.esHoy ? 'linear-gradient(180deg, #4d6357, #173b36)' : d.tareas ? '#b6cba9' : '#e1e7df',
            }}
            initial={{ height: 6 }}
            animate={{ height: 6 + (d.tareas / maximo) * 84 }}
            transition={{ duration: 0.7, ease, delay: 0.4 + i * 0.06 }}
          />
          <span
            className="text-[11.5px]"
            style={{
              fontWeight: d.esHoy ? 700 : 500,
              color: d.esHoy ? 'var(--foreground)' : 'var(--muted-foreground)',
            }}
          >
            {d.dia}
          </span>
        </div>
      ))}
    </div>
  )
}

function FilaVencimiento({ tarea, onClick }) {
  const dias = diasHasta(tarea.fecha_entrega)
  const urgente = dias <= 1
  const cercana = dias <= 3

  return (
    <motion.button
      type="button"
      variants={rise}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
    >
      <AnilloCriticidad nivel={tarea.nivel_criticidad} tamaño={36} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium">{tarea.titulo}</span>
        <span className="block truncate text-[11.5px] text-muted-foreground">{tarea.asignatura_nombre}</span>
      </span>
      <span
        className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{
          background: urgente ? '#f1e4e0' : cercana ? 'var(--media-soft)' : '#e4ede2',
          color: urgente ? 'var(--destructive)' : cercana ? 'var(--media)' : '#3f5247',
        }}
      >
        {etiquetaDias(dias)}
      </span>
    </motion.button>
  )
}

/* ---------- Inicio ---------- */

function Inicio({ tareas, onTareaActualizada, onCambiarPestaña, perfil }) {
  const nombre = formatearNombre(perfil?.nombre || localStorage.getItem('nombre') || 'Estudiante')

  const activas = tareas.filter((t) => t.estado !== 'TERMINADO' && !esVencida(t))
  const destacada = activas[0]
  const proximos = [...activas]
    .sort((a, b) => new Date(a.fecha_entrega) - new Date(b.fecha_entrega))
    .slice(0, 5)
  const serie = datosSemana(tareas)

  const terminadas = tareas.filter((t) => t.estado === 'TERMINADO').length
  const progreso = tareas.length > 0 ? Math.round((terminadas / tareas.length) * 100) : 0

  const inicioSemana = inicioDeSemana()
  const finSemana = new Date(inicioSemana)
  finSemana.setDate(inicioSemana.getDate() + 6)
  finSemana.setHours(23, 59, 59, 999)
  const entregasSemana = tareas.filter((t) => {
    const f = new Date(t.fecha_entrega)
    return f >= inicioSemana && f <= finSemana
  })
  const horasEstaSemana = entregasSemana.reduce((suma, t) => suma + parseFloat(t.horas_estimadas), 0)

  const diasProxima = destacada ? Math.max(0, diasHasta(destacada.fecha_entrega)) : null
  

  const fraseHero =
    activas.length === 0
      ? 'Estás al día. Disfruta el momento o adelanta algo de la próxima semana.'
      : `Tienes ${activas.length} ${activas.length === 1 ? 'tarea activa' : 'tareas activas'}${
          destacada
            ? `, y la más cercana vence ${
                diasProxima === 0 ? 'hoy' : diasProxima === 1 ? 'mañana' : `en ${diasProxima} días`
              }`
            : ''
        }.`

  const siguienteEstado = { PENDIENTE: 'EN_PROCESO', EN_PROCESO: 'TERMINADO' }
  const handleAvanzar = async (tarea) => {
    const nuevoEstado = siguienteEstado[tarea.estado]
    if (!nuevoEstado) return
    try {
      const response = await api.patch(`tareas/${tarea.id}/`, { estado: nuevoEstado })
      onTareaActualizada(response.data)
    } catch (error) {
      console.error('Error actualizando tarea:', error)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <motion.section
        className="login-showcase"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        style={{
          borderRadius: 30,
          padding: 'clamp(26px, 4vw, 46px)',
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 32,
        }}
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 size-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(137, 161, 142, 0.35), transparent 65%)' }}
          animate={{ x: [0, -30, 0], y: [0, 24, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 left-1/3 size-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(182, 203, 169, 0.2), transparent 65%)' }}
          animate={{ x: [0, 34, 0], y: [0, -18, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="login-showcase-content" style={{ flex: '1 1 320px' }}>
          <span className="login-eyebrow" style={{ textTransform: 'uppercase' }}>
            <span /> TU RESUMEN DE HOY
          </span>
          <p style={{ marginTop: 18, color: '#bdc9bf', fontSize: 'clamp(16px, 1.6vw, 20px)', letterSpacing: '-0.02em' }}>
            {saludo()},
          </p>
          <h2
            style={{              marginTop: 2,
              color: '#f3f5ef',
              fontSize: 'clamp(46px, 7vw, 84px)',
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: '-0.065em',
            }}
          >
            <NombreAnimado nombre={nombre} />{' '}
            <motion.span
              className="inline-block"
              style={{ transformOrigin: '70% 75%', fontSize: '0.7em' }}
              animate={{ rotate: [0, 16, -8, 16, -4, 0] }}
              transition={{ duration: 1.4, delay: 1.3, repeat: Infinity, repeatDelay: 4 }}
              aria-hidden="true"
            >
              👋
            </motion.span>
          </h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 1.1 }}
            style={{ marginTop: 14, maxWidth: 430, color: '#bdc9bf', fontSize: 15, lineHeight: 1.7 }}
          >
            {fraseHero}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 1.3 }}
            className="mt-6 flex flex-wrap gap-2.5"
          >
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onCambiarPestaña('gestionar')}
              className="btn"
              style={{ background: '#b6cba9', color: '#17362d', padding: '12px 20px', borderRadius: 12, fontWeight: 600 }}
            >
              <Plus size={15} /> Nueva tarea
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onCambiarPestaña('kanban')}
              className="btn border-white/25 transition-colors hover:bg-white/10"
              style={{ color: '#e6ede4', padding: '12px 20px', borderRadius: 12 }}
            >
              Ver tablero <ArrowRight size={15} />
            </motion.button>
          </motion.div>
        </div>

        <div
          className="login-showcase-content flex flex-col items-center gap-3 rounded-3xl border border-white/15 bg-white/[0.07] px-8 py-6 text-center"
          style={{ flex: '0 1 250px', backdropFilter: 'blur(8px)' }}
        >
          <AnilloProgreso porcentaje={progreso} />
          <div>
            <div className="text-[13px] font-semibold" style={{ color: '#f3f5ef' }}>Progreso general</div>
            <div className="mt-0.5 text-[12px]" style={{ color: '#aebdb0' }}>
              {terminadas} de {tareas.length} terminadas
            </div>
          </div>
        </div>
      </motion.section>

      {/* Estadísticas */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <StatCard
          Icono={ListChecks}
          etiqueta="Tareas activas"
          valor={activas.length}
          detalle={`de ${tareas.length} en total`}
          tono={TONOS[0]}
        />
        <StatCard
          Icono={Clock}
          etiqueta="Horas esta semana"
          valor={Number(horasEstaSemana.toFixed(1))}
          decimales={1}
          detalle={`${entregasSemana.length} ${entregasSemana.length === 1 ? 'entrega' : 'entregas'}`}
          tono={TONOS[1]}
        />
        <StatCard
          Icono={CalendarClock}
          etiqueta="Próxima entrega"
          texto={diasProxima === null ? '—' : diasProxima === 0 ? 'Hoy' : `${diasProxima} d`}
          detalle={
            destacada
              ? new Date(destacada.fecha_entrega).toLocaleDateString('es-CO', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })
              : undefined
          }
          tono={TONOS[2]}
        />
        <StatCard
          Icono={TrendingUp}
          etiqueta="Progreso general"
          valor={progreso}
          detalle={`${terminadas} de ${tareas.length} terminadas`}
          tono={TONOS[3]}
        />
      </motion.div>

      {/* Prioridad + semana y vencimientos */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease, delay: 0.5 }}
          className="relative overflow-hidden rounded-3xl border p-6"
          style={{ background: 'linear-gradient(135deg, #ffffff 0%, #eef4ec 100%)' }}
        >
          {destacada ? (
            <Prioridad
              tarea={destacada}
              onAvanzar={handleAvanzar}
              onIrTablero={() => onCambiarPestaña('kanban')}
            />
          ) : (
            <div className="grid place-items-center gap-3 py-12 text-center">
              <CheckCircle2 size={44} style={{ color: 'var(--primary)' }} />
              <div>
                <div className="text-[18px] font-semibold" style={{ letterSpacing: '-0.03em' }}>
                  No tienes tareas activas
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">Buen momento para planear lo que viene.</p>
              </div>
              <button type="button" className="btn btn-primario" onClick={() => onCambiarPestaña('gestionar')}>
                <Plus size={14} /> Crear una tarea
              </button>
            </div>
          )}
        </motion.section>

        <div className="flex flex-col gap-6">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease, delay: 0.6 }}
            className="rounded-3xl border bg-card p-6"
          >
            <div className="mb-4 flex items-baseline justify-between">
              <h3 style={{ fontSize: 17, letterSpacing: '-0.03em' }}>Esta semana</h3>
              <span className="text-[12px] text-muted-foreground num-tabular">
                {entregasSemana.length} {entregasSemana.length === 1 ? 'entrega' : 'entregas'}
              </span>
            </div>
            <Semana datos={serie} />
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease, delay: 0.7 }}
            className="rounded-3xl border bg-card p-4"
          >
            <div className="mb-2 flex items-baseline justify-between px-2 pt-2">
              <h3 style={{ fontSize: 17, letterSpacing: '-0.03em' }}>Próximos vencimientos</h3>
              {proximos.length > 0 && (
                <button
                  type="button"
                  onClick={() => onCambiarPestaña('kanban')}
                  className="inline-flex items-center gap-1 text-[12px] font-medium hover:underline"
                  style={{ color: 'var(--primary)' }}
                >
                  Ver tablero <ArrowRight size={12} />
                </button>
              )}
            </div>
            {proximos.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">Nada por vencer.</p>
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col">
                {proximos.map((t) => (
                  <FilaVencimiento key={t.id} tarea={t} onClick={() => onCambiarPestaña('kanban')} />
                ))}
              </motion.div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  )
}

export default Inicio
