import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, Plus, Trash2, ArrowLeft, ArrowRight, Check, Info, Paperclip, X, FileText } from 'lucide-react'
import api from '../api/axios'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AnilloCriticidad from './AnilloCriticidad'
import { pageVariants, stagger, rise } from '../lib/motion'

const MAX_PASOS = 10
const MAX_ARCHIVO = 5 * 1024 * 1024
const TIPOS_ARCHIVO = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
const EJEMPLOS = [
  'Parcial de Bases de Datos el viernes a las 8 am, vale 4 créditos',
  'Taller de programación para mañana: hacer una calculadora en Python',
]
const ETAPAS = ['Describe', 'Aclara', 'Revisa', 'Listo']
const INDICE_FASE = { entrada: 0, preguntas: 1, propuesta: 2, listo: 3 }
const MENSAJES_PENSANDO = ['Leyendo tu tarea…', 'Calculando fechas y esfuerzo…', 'Armando un plan de pasos…']
const ETIQUETAS_DIFICULTAD = ['Muy fácil', 'Fácil', 'Media', 'Difícil', 'Muy difícil']

const ease = [0.22, 1, 0.36, 1]
const resorte = { type: 'spring', stiffness: 500, damping: 38 }

const claseSelect =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

let contadorClaves = 0
const nuevaClave = () => ++contadorClaves

function aplanar(valor) {
  if (typeof valor === 'string') return [valor]
  if (Array.isArray(valor)) return valor.flatMap(aplanar)
  if (valor && typeof valor === 'object') return Object.values(valor).flatMap(aplanar)
  return []
}

// Los errores de Django llegan como { "campo": ["mensaje"] } o { "detail": "mensaje" }
function mensajeError(err, defecto) {
  const datos = err.response?.data
  if (typeof datos?.detail === 'string') return datos.detail
  const texto = aplanar(datos).join(' ')
  return texto || defecto
}

function tamanoLegible(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// "2026-11-02T08:00:00-05:00" -> "2026-11-02T08:00" (lo que necesita datetime-local)
function aFormatoInput(iso) {
  if (!iso) return ''
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ''
  const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function aFormulario(p) {
  return {
    materiaModo: !p.asignatura_id && p.asignatura_nueva ? 'nueva' : 'existente',
    materiaId: p.asignatura_id ? String(p.asignatura_id) : '',
    nuevaNombre: p.asignatura_nueva?.nombre ?? '',
    nuevaCreditos: p.asignatura_nueva?.creditos ? String(p.asignatura_nueva.creditos) : '',
    titulo: p.titulo ?? '',
    descripcion: p.descripcion ?? '',
    fecha: aFormatoInput(p.fecha_entrega),
    dificultad: p.dificultad ?? 3,
    horas: String(p.horas_estimadas ?? 2),
    pasos: (p.pasos ?? []).map((x) => ({
      clave: nuevaClave(),
      titulo: x.titulo,
      horas_estimadas: x.horas_estimadas ?? null,
    })),
    advertencias: p.advertencias ?? [],
  }
}

/* ---------- Piezas visuales ---------- */

// Indicador de progreso: las líneas se llenan al avanzar de fase
function Etapas({ actual }) {
  return (
    <ol className="flex items-center mb-7" aria-label="Progreso del asistente">
      {ETAPAS.map((nombre, i) => {
        const hecho = i < actual
        const activo = i === actual
        return (
          <li
            key={nombre}
            className="flex items-center flex-1 last:flex-none"
            aria-current={activo ? 'step' : undefined}
          >
            <div className="flex items-center gap-2">
              <motion.span
                initial={false}
                animate={{
                  backgroundColor: hecho || activo ? '#4d6357' : '#dfe5de',
                  color: hecho || activo ? '#f6f7f3' : '#5f6d63',
                  scale: activo ? 1.1 : 1,
                }}
                transition={{ duration: 0.35, ease }}
                className="grid size-7 place-items-center rounded-full text-[12px] font-semibold num-tabular"
              >
                {hecho ? <Check size={13} strokeWidth={3} /> : i + 1}
              </motion.span>
              <span
                className="hidden sm:block text-[12.5px]"
                style={{
                  fontWeight: activo ? 600 : 500,
                  color: activo ? 'var(--foreground)' : 'var(--muted-foreground)',
                }}
              >
                {nombre}
              </span>
            </div>
            {i < ETAPAS.length - 1 && (
              <div className="mx-3 h-0.5 flex-1 overflow-hidden rounded-full" style={{ background: '#dfe5de' }}>
                <motion.div
                  className="h-full"
                  style={{ background: '#4d6357' }}
                  initial={false}
                  animate={{ width: hecho ? '100%' : '0%' }}
                  transition={{ duration: 0.6, ease }}
                />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

// Capa que aparece mientras la IA trabaja
function Pensando() {
  const [indice, setIndice] = useState(0)

  useEffect(() => {
    const temporizador = setInterval(() => setIndice((n) => (n + 1) % MENSAJES_PENSANDO.length), 2200)
    return () => clearInterval(temporizador)
  }, [])

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-10 grid place-items-center"
      style={{ background: 'rgba(9, 35, 33, 0.9)', backdropFilter: 'blur(6px)', borderRadius: 'inherit' }}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative size-20 grid place-items-center">
          {[0, 1].map((n) => (
            <motion.span
              key={n}
              className="absolute inset-0 rounded-full"
              style={{ border: '1px solid #b6cba9' }}
              animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: n * 0.6 }}
            />
          ))}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            style={{ color: '#b6cba9' }}
          >
            <Sparkles size={30} />
          </motion.div>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={indice}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            style={{ color: '#dce5da', fontSize: 14 }}
          >
            {MENSAJES_PENSANDO[indice]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function BurbujaIA({ children, htmlFor }) {
  const Etiqueta = htmlFor ? 'label' : 'div'
  return (
    <div className="flex items-start gap-3">
      <span
        className="grid size-8 shrink-0 place-items-center rounded-full"
        style={{ background: '#173b36', color: '#b6cba9' }}
      >
        <Sparkles size={15} />
      </span>
      <Etiqueta
        htmlFor={htmlFor}
        className="max-w-[88%] rounded-2xl rounded-tl-md bg-muted px-4 py-2.5 text-[13.5px] leading-relaxed"
      >
        {children}
      </Etiqueta>
    </div>
  )
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
    />
  )
}

/* ---------- Asistente ---------- */

function Asistente({ asignaturas, onCreada, onIrTablero }) {
  const [fase, setFase] = useState('entrada') // entrada | preguntas | propuesta | listo
  const [texto, setTexto] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [preguntas, setPreguntas] = useState([])
  const [respuestas, setRespuestas] = useState([])
  const [form, setForm] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [restantes, setRestantes] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [enfocado, setEnfocado] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)

  const cambiar = (parcial) => setForm((f) => ({ ...f, ...parcial }))

  const reiniciar = () => {
    setFase('entrada')
    setTexto('')
    setArchivo(null)
    setPreguntas([])
    setRespuestas([])
    setForm(null)
    setResultado(null)
    setError('')
  }

  const procesarArchivo = (elegido) => {
    if (!elegido) return
    if (!TIPOS_ARCHIVO.includes(elegido.type)) {
      setError('Solo se aceptan archivos PDF o imágenes (PNG, JPG o WEBP). Si tu tarea está en Word, guárdala como PDF.')
      return
    }
    if (elegido.size > MAX_ARCHIVO) {
      setError('El archivo pesa más de 5 MB.')
      return
    }
    setError('')
    setArchivo(elegido)
  }

  const elegirArchivo = (e) => {
    const elegido = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    procesarArchivo(elegido)
  }

  const soltarArchivo = (e) => {
    e.preventDefault()
    setArrastrando(false)
    procesarArchivo(e.dataTransfer.files?.[0])
  }

  const analizar = async (respuestasEnviadas = []) => {
    setError('')
    setOcupado(true)
    try {
      const formulario = new FormData()
      formulario.append('texto', texto.trim())
      formulario.append('respuestas', JSON.stringify(respuestasEnviadas))
      if (archivo) formulario.append('archivo', archivo)

      const response = await api.post('ia/analizar/', formulario, { timeout: 120000 })
      const datos = response.data
      setRestantes(datos.restantes)
      if (datos.estado === 'preguntas') {
        setPreguntas(datos.preguntas)
        setRespuestas(datos.preguntas.map(() => ''))
        setFase('preguntas')
      } else {
        setForm(aFormulario(datos.propuesta))
        setFase('propuesta')
      }
    } catch (err) {
      console.error('Error del asistente:', err)
      setError(mensajeError(err, 'No se pudo consultar al asistente. Inténtalo de nuevo.'))
    } finally {
      setOcupado(false)
    }
  }

  const continuarConRespuestas = () => {
    // Si deja una respuesta en blanco, se manda como "sin respuesta" para que
    // el asistente proponga igual (y no vuelva a preguntar, gastando cuota)
    const pares = preguntas.map((pregunta, i) => ({
      pregunta,
      respuesta: respuestas[i].trim() || '(sin respuesta)',
    }))
    analizar(pares)
  }

  const materiaValida =
    form &&
    (form.materiaModo === 'existente'
      ? form.materiaId !== ''
      : form.nuevaNombre.trim() !== '' && Number(form.nuevaCreditos) >= 1)

  const puedeCrear =
    form && materiaValida && form.titulo.trim() !== '' && form.fecha !== '' && Number(form.horas) >= 0.5

  const puedeAnalizar = !ocupado && (texto.trim().length >= 5 || Boolean(archivo))

  const confirmar = async () => {
    setError('')
    setOcupado(true)

    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      fecha_entrega: new Date(form.fecha).toISOString(),
      dificultad: form.dificultad,
      horas_estimadas: Number(form.horas),
      pasos: form.pasos
        .filter((p) => p.titulo.trim())
        .map((p) => ({ titulo: p.titulo.trim(), horas_estimadas: p.horas_estimadas })),
    }
    if (form.materiaModo === 'existente') {
      payload.asignatura_id = Number(form.materiaId)
    } else {
      payload.asignatura_nueva = { nombre: form.nuevaNombre.trim(), creditos: Number(form.nuevaCreditos) }
    }

    try {
      const response = await api.post('ia/confirmar/', payload)
      onCreada(response.data)
      setResultado(response.data)
      setFase('listo')
    } catch (err) {
      console.error('Error creando la tarea:', err)
      setError(mensajeError(err, 'No se pudo crear la tarea. Revisa los datos.'))
    } finally {
      setOcupado(false)
    }
  }

  const resumenUsuario = texto.trim()
    ? texto.trim().length > 220
      ? `${texto.trim().slice(0, 220)}…`
      : texto.trim()
    : archivo
      ? `Archivo: ${archivo.name}`
      : ''

  return (
    <div className="max-w-4xl mx-auto">
      {/* Encabezado */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="mb-6 flex items-start gap-3.5"
      >
        <span
          className="grid size-11 shrink-0 place-items-center rounded-2xl"
          style={{ background: 'linear-gradient(145deg, #173b36, #092321)', color: '#b6cba9' }}
        >
          <Sparkles size={20} />
        </span>
        <div>
          <h2 style={{ fontSize: 28, letterSpacing: '-0.045em' }}>Asistente</h2>
          <p className="text-[13px] text-muted-foreground mt-1 max-w-xl">
            Cuéntale tu tarea con tus palabras o adjunta su guía. Te pregunta lo que falte, propone los pasos y tú
            revisas todo antes de crearla.
          </p>
        </div>
      </motion.div>

      <Etapas actual={INDICE_FASE[fase]} />

      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-4 rounded-xl px-4 py-2.5 text-[13px]"
            style={{ background: '#f1e4e0', color: 'var(--destructive)' }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* 1. Describir la tarea */}
        {fase === 'entrada' && (
          <motion.div key="entrada" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <section className="login-showcase" style={{ borderRadius: 26, padding: '30px 32px' }}>
              <AnimatePresence>{ocupado && <Pensando />}</AnimatePresence>

              <div className="login-showcase-content flex flex-col gap-5">
                <div>
                  <span className="login-eyebrow"><span /> CUÉNTAME TU TAREA</span>
                  <h3
                    style={{
                      marginTop: 12,
                      color: '#f3f5ef',
                      fontSize: 'clamp(26px, 3.2vw, 34px)',
                      fontWeight: 600,
                      lineHeight: 1.08,
                      letterSpacing: '-0.05em',
                    }}
                  >
                    ¿Qué tienes que hacer?
                  </h3>
                </div>

                <div>
                  <label htmlFor="as-texto" className="sr-only">Describe tu tarea</label>
                  <textarea
                    id="as-texto"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onFocus={() => setEnfocado(true)}
                    onBlur={() => setEnfocado(false)}
                    maxLength={4000}
                    placeholder="Ej. Tengo que entregar un ensayo de inglés sobre tecnología el próximo lunes a las 8 am"
                    className="placeholder:text-[#9fb0a2]"
                    style={{
                      width: '100%',
                      minHeight: 130,
                      padding: '14px 16px',
                      borderRadius: 16,
                      resize: 'vertical',
                      outline: 'none',
                      fontSize: 14.5,
                      lineHeight: 1.6,
                      color: '#f3f5ef',
                      background: 'rgba(236, 243, 233, 0.09)',
                      border: `1px solid ${enfocado ? '#b6cba9' : 'rgba(231, 239, 228, 0.18)'}`,
                      boxShadow: enfocado ? '0 0 0 4px rgba(182, 203, 169, 0.18)' : 'none',
                      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    }}
                  />
                  <div className="mt-1 text-right text-[11px] num-tabular" style={{ color: '#9fb0a2' }}>
                    {texto.length}/4000
                  </div>
                </div>

                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="flex flex-wrap items-center gap-2"
                >
                  <span className="text-[12px]" style={{ color: '#aebdb0' }}>Prueba con:</span>
                  {EJEMPLOS.map((ejemplo) => (
                    <motion.button
                      key={ejemplo}
                      variants={rise}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => setTexto(ejemplo)}
                      className="rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-1.5 text-left text-[12px] transition-colors hover:bg-white/15"
                      style={{ color: '#dce5da' }}
                    >
                      {ejemplo}
                    </motion.button>
                  ))}
                </motion.div>

                {/* Adjuntar archivo (también se puede arrastrar) */}
                <div>
                  <AnimatePresence mode="wait" initial={false}>
                    {archivo ? (
                      <motion.div
                        key="archivo"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3"
                      >
                        <FileText size={18} style={{ color: '#b6cba9' }} className="shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px]" style={{ color: '#f3f5ef' }}>{archivo.name}</div>
                          <div className="text-[11.5px] num-tabular" style={{ color: '#aebdb0' }}>
                            {tamanoLegible(archivo.size)}
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label="Quitar el archivo"
                          onClick={() => setArchivo(null)}
                          disabled={ocupado}
                          className="grid size-7 place-items-center rounded-lg transition-colors hover:bg-white/15"
                          style={{ color: '#dce5da' }}
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.label
                        key="zona"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
                        onDragLeave={() => setArrastrando(false)}
                        onDrop={soltarArchivo}
                        className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed px-4 py-3 text-[13px] transition-colors focus-within:ring-2 focus-within:ring-[#b6cba9]"
                        style={{
                          color: '#c3d0c5',
                          borderColor: arrastrando ? '#b6cba9' : 'rgba(231, 239, 228, 0.3)',
                          background: arrastrando ? 'rgba(182, 203, 169, 0.14)' : 'transparent',
                        }}
                      >
                        <Paperclip size={16} />
                        <span>
                          {arrastrando ? 'Suelta el archivo aquí' : 'Adjunta o arrastra la guía (PDF o imagen, máx. 5 MB)'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                          onChange={elegirArchivo}
                          className="sr-only"
                        />
                      </motion.label>
                    )}
                  </AnimatePresence>
                  <p className="mt-1.5 text-[11.5px]" style={{ color: '#9fb0a2' }}>
                    Funciona mejor con PDF con texto real o fotos nítidas. Si está en Word, guárdalo como PDF.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="text-[12px]" style={{ color: '#aebdb0' }}>
                    {restantes !== null && `Te quedan ${restantes} consultas hoy.`}
                  </span>
                  <motion.button
                    type="button"
                    whileHover={puedeAnalizar ? { y: -1 } : undefined}
                    whileTap={puedeAnalizar ? { scale: 0.97 } : undefined}
                    onClick={() => analizar([])}
                    disabled={!puedeAnalizar}
                    className="btn"
                    style={{
                      background: '#b6cba9',
                      color: '#17362d',
                      padding: '12px 20px',
                      borderRadius: 12,
                      fontWeight: 600,
                      opacity: puedeAnalizar ? 1 : 0.45,
                      cursor: puedeAnalizar ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <Sparkles size={15} /> Analizar con IA <ArrowRight size={15} />
                  </motion.button>
                </div>
              </div>
            </section>

            <p className="mt-3 flex gap-2 px-1 text-[12px] leading-relaxed text-muted-foreground">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>
                Lo que escribas y el archivo que adjuntes se envían a Google (Gemini) para analizarlos. En el plan
                gratuito, Google puede usarlos para mejorar sus productos: no incluyas datos personales ni
                información privada. Más detalles en la{' '}
                <Link to="/politica-de-datos" target="_blank" rel="noopener noreferrer" className="underline">
                  política de datos
                </Link>
                .
              </span>
            </p>
          </motion.div>
        )}

        {/* 2. Preguntas del asistente, como una conversación */}
        {fase === 'preguntas' && (
          <motion.section
            key="preguntas"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative overflow-hidden rounded-3xl border bg-card p-6"
          >
            <AnimatePresence>{ocupado && <Pensando />}</AnimatePresence>

            <div className="flex flex-col gap-5">
              {resumenUsuario && (
                <div className="flex justify-end">
                  <div
                    className="max-w-[85%] rounded-2xl rounded-tr-md px-4 py-2.5 text-[13.5px] leading-relaxed"
                    style={{ background: '#173b36', color: '#f2f5ef' }}
                  >
                    {resumenUsuario}
                  </div>
                </div>
              )}

              <BurbujaIA>Para armar la tarea necesito saber un par de cosas:</BurbujaIA>

              {preguntas.map((pregunta, i) => (
                <motion.div
                  key={pregunta}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.12, duration: 0.4, ease }}
                  className="flex flex-col gap-2"
                >
                  <BurbujaIA htmlFor={`as-pregunta-${i}`}>{pregunta}</BurbujaIA>
                  <div className="ml-11">
                    <Input
                      id={`as-pregunta-${i}`}
                      value={respuestas[i]}
                      maxLength={300}
                      placeholder="Tu respuesta…"
                      onChange={(e) => setRespuestas((r) => r.map((v, j) => (j === i ? e.target.value : v)))}
                    />
                  </div>
                </motion.div>
              ))}

              <p className="ml-11 text-[11.5px] text-muted-foreground">
                Si no sabes alguna, déjala en blanco y la completas después en la propuesta.
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  className="btn btn-secundario"
                  onClick={() => { setFase('entrada'); setError('') }}
                  disabled={ocupado}
                >
                  <ArrowLeft size={14} /> Atrás
                </button>
                <button type="button" className="btn btn-primario" onClick={continuarConRespuestas} disabled={ocupado}>
                  {ocupado ? <Spinner /> : <ArrowRight size={14} />}
                  {ocupado ? 'Analizando…' : 'Continuar'}
                </button>
              </div>
            </div>
          </motion.section>
        )}

        {/* 3. Revisar y editar la propuesta */}
        {fase === 'propuesta' && form && (
          <motion.section
            key="propuesta"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="rounded-3xl border bg-card p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 style={{ fontSize: 22, letterSpacing: '-0.04em' }}>Revisa la propuesta</h3>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  Es una sugerencia: cambia lo que quieras antes de crear la tarea.
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold"
                style={{ background: '#173b36', color: '#b6cba9' }}
              >
                <Sparkles size={12} /> Sugerida por IA
              </span>
            </div>

            {form.advertencias.length > 0 && (
              <motion.ul
                variants={stagger}
                initial="hidden"
                animate="show"
                className="mt-4 flex flex-col gap-1.5 rounded-2xl px-4 py-3 text-[12.5px]"
                style={{ background: 'var(--media-soft)', color: 'color-mix(in oklab, var(--media) 70%, var(--foreground))' }}
              >
                {form.advertencias.map((aviso) => (
                  <motion.li key={aviso} variants={rise} className="flex gap-2">
                    <Info size={14} className="mt-0.5 shrink-0" /> {aviso}
                  </motion.li>
                ))}
              </motion.ul>
            )}

            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
              {/* Datos de la tarea */}
              <div className="flex flex-col gap-5">
                <div className="grid gap-1.5">
                  <Label htmlFor="as-materia">Materia</Label>
                  <select
                    id="as-materia"
                    value={form.materiaModo === 'nueva' ? 'nueva' : form.materiaId}
                    onChange={(e) => {
                      const valor = e.target.value
                      if (valor === 'nueva') cambiar({ materiaModo: 'nueva' })
                      else cambiar({ materiaModo: 'existente', materiaId: valor })
                    }}
                    className={claseSelect}
                  >
                    <option value="" disabled>Elige una materia</option>
                    {asignaturas.map((a) => (
                      <option key={a.id} value={String(a.id)}>{a.nombre}</option>
                    ))}
                    <option value="nueva">+ Crear materia nueva…</option>
                  </select>
                </div>

                <AnimatePresence initial={false}>
                  {form.materiaModo === 'nueva' && (
                    <motion.div
                      key="materia-nueva"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_7rem]">
                        <div className="grid gap-1.5">
                          <Label htmlFor="as-nueva-nombre">Nombre de la materia nueva</Label>
                          <Input
                            id="as-nueva-nombre"
                            value={form.nuevaNombre}
                            maxLength={150}
                            onChange={(e) => cambiar({ nuevaNombre: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="as-nueva-creditos">Créditos</Label>
                          <Input
                            id="as-nueva-creditos"
                            type="number"
                            min="1"
                            max="10"
                            value={form.nuevaCreditos}
                            onChange={(e) => cambiar({ nuevaCreditos: e.target.value })}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid gap-1.5">
                  <Label htmlFor="as-titulo">Título</Label>
                  <Input
                    id="as-titulo"
                    value={form.titulo}
                    maxLength={100}
                    onChange={(e) => cambiar({ titulo: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_7rem]">
                  <div className="grid gap-1.5">
                    <Label htmlFor="as-fecha">Fecha de entrega</Label>
                    <Input
                      id="as-fecha"
                      type="datetime-local"
                      value={form.fecha}
                      onChange={(e) => cambiar({ fecha: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="as-horas">Horas est.</Label>
                    <Input
                      id="as-horas"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={form.horas}
                      onChange={(e) => cambiar({ horas: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-baseline justify-between">
                    <Label>Dificultad</Label>
                    <span className="text-[12px] text-muted-foreground">{ETIQUETAS_DIFICULTAD[form.dificultad - 1]}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1 rounded-xl bg-muted p-1" role="radiogroup" aria-label="Dificultad">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const activo = form.dificultad === n
                      return (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={activo}
                          onClick={() => cambiar({ dificultad: n })}
                          className="relative h-9 rounded-lg text-sm font-medium num-tabular"
                          style={{ color: activo ? 'var(--primary-foreground)' : 'var(--foreground)' }}
                        >
                          {activo && (
                            <motion.span
                              layoutId="dificultad-activa"
                              transition={resorte}
                              className="absolute inset-0 rounded-lg"
                              style={{ background: 'var(--primary)' }}
                            />
                          )}
                          <span className="relative">{n}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Plan de pasos */}
              <div className="rounded-2xl p-4" style={{ background: 'color-mix(in oklab, var(--muted) 65%, transparent)' }}>
                <div className="mb-3 flex items-baseline justify-between">
                  <Label>Plan de pasos</Label>
                  <span className="text-[11.5px] text-muted-foreground num-tabular">
                    {form.pasos.length}/{MAX_PASOS}
                  </span>
                </div>

                {form.pasos.length === 0 && (
                  <p className="mb-3 text-[12.5px] text-muted-foreground">Sin pasos. Puedes agregar los que quieras.</p>
                )}

                <ul className="flex flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {form.pasos.map((paso, i) => (
                      <motion.li
                        key={paso.clave}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 18 }}
                        transition={{ duration: 0.3, ease }}
                        className="flex items-center gap-2"
                      >
                        <span
                          className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold num-tabular"
                          style={{ background: '#dfe5de', color: '#304040' }}
                        >
                          {i + 1}
                        </span>
                        <Input
                          value={paso.titulo}
                          maxLength={200}
                          aria-label={`Paso ${i + 1}`}
                          className="bg-card"
                          onChange={(e) =>
                            cambiar({
                              pasos: form.pasos.map((p) => (p.clave === paso.clave ? { ...p, titulo: e.target.value } : p)),
                            })
                          }
                        />
                        <button
                          type="button"
                          aria-label={`Quitar el paso ${i + 1}`}
                          onClick={() => cambiar({ pasos: form.pasos.filter((p) => p.clave !== paso.clave) })}
                          className="grid size-8 shrink-0 place-items-center rounded-lg transition-colors hover:bg-destructive/10"
                          style={{ color: 'var(--destructive)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                {form.pasos.length < MAX_PASOS && (
                  <button
                    type="button"
                    className="btn btn-secundario mt-3"
                    onClick={() =>
                      cambiar({ pasos: [...form.pasos, { clave: nuevaClave(), titulo: '', horas_estimadas: null }] })
                    }
                  >
                    <Plus size={13} /> Agregar paso
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
              <button type="button" className="btn btn-secundario" onClick={reiniciar} disabled={ocupado}>
                Empezar de nuevo
              </button>
              <button
                type="button"
                className="btn btn-primario"
                onClick={confirmar}
                disabled={!puedeCrear || ocupado}
                style={{ padding: '10px 18px' }}
              >
                {ocupado ? <Spinner /> : <Check size={14} />}
                {ocupado ? 'Creando…' : 'Crear tarea'}
              </button>
            </div>
          </motion.section>
        )}

        {/* 4. Listo */}
        {fase === 'listo' && resultado && (
          <motion.section
            key="listo"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="login-showcase text-center"
            style={{ borderRadius: 26, padding: '40px 32px', alignItems: 'center' }}
          >
            <div className="login-showcase-content flex flex-col items-center gap-5">
              <div className="relative grid size-[84px] place-items-center">
                <svg width="84" height="84" viewBox="0 0 84 84" fill="none" aria-hidden="true">
                  <motion.circle
                    cx="42"
                    cy="42"
                    r="38"
                    stroke="#b6cba9"
                    strokeWidth="3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease }}
                  />
                  <motion.path
                    d="M26 43l11 11 21-23"
                    stroke="#b6cba9"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.6, ease }}
                  />
                </svg>
                {Array.from({ length: 10 }, (_, k) => {
                  const angulo = (k / 10) * Math.PI * 2
                  return (
                    <motion.span
                      key={k}
                      className="absolute left-1/2 top-1/2 size-1.5 rounded-full"
                      style={{ background: k % 2 ? '#b6cba9' : '#e6ede4' }}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{ x: Math.cos(angulo) * 72, y: Math.sin(angulo) * 72, opacity: 0, scale: 0.4 }}
                      transition={{ duration: 1.1, delay: 0.7, ease: 'easeOut' }}
                    />
                  )
                })}
              </div>

              <div>
                <h3
                  style={{ color: '#f3f5ef', fontSize: 'clamp(26px, 3.2vw, 34px)', fontWeight: 600, letterSpacing: '-0.05em' }}
                >
                  Tarea creada
                </h3>
                <p className="mt-1.5 text-[13.5px]" style={{ color: '#bdc9bf' }}>
                  {resultado.asignatura_creada && `Se creó la materia «${resultado.asignatura.nombre}». `}
                  {resultado.pasos.length > 0
                    ? `Se guardaron ${resultado.pasos.length} ${resultado.pasos.length === 1 ? 'paso' : 'pasos'}.`
                    : 'Ya está en tu tablero.'}
                </p>
              </div>

              <div
                className="flex items-center gap-4 rounded-2xl px-5 py-3.5 text-left"
                style={{ background: '#fbfcf9', color: 'var(--foreground)' }}
              >
                <AnilloCriticidad nivel={resultado.tarea.nivel_criticidad} tamaño={56} />
                <div>
                  <div className="text-[14px] font-semibold">{resultado.tarea.titulo}</div>
                  <div className="text-[12px] text-muted-foreground">Nivel de criticidad calculado</div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={reiniciar}
                  className="btn border-white/25 transition-colors hover:bg-white/10"
                  style={{ color: '#e6ede4', padding: '11px 18px', borderRadius: 12 }}
                >
                  Crear otra tarea
                </button>
                <button
                  type="button"
                  onClick={onIrTablero}
                  className="btn"
                  style={{ background: '#b6cba9', color: '#17362d', padding: '11px 18px', borderRadius: 12, fontWeight: 600 }}
                >
                  Ver en el tablero <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Asistente
