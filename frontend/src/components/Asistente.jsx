import { useState } from 'react'
import { Sparkles, Plus, Trash2, ArrowLeft, Check, Info } from 'lucide-react'
import api from '../api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AnilloCriticidad from './AnilloCriticidad'

const MAX_PASOS = 10
const EJEMPLOS = [
  'Parcial de Bases de Datos el viernes a las 8 am, vale 4 créditos',
  'Taller de programación para mañana: hacer una calculadora en Python',
]

const claseSelect =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
const claseTextarea =
  'w-full min-h-32 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors resize-y focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

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

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
    />
  )
}

function Asistente({ asignaturas, onCreada, onIrTablero }) {
  const [fase, setFase] = useState('entrada') // entrada | preguntas | propuesta | listo
  const [texto, setTexto] = useState('')
  const [preguntas, setPreguntas] = useState([])
  const [respuestas, setRespuestas] = useState([])
  const [form, setForm] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [restantes, setRestantes] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')

  const cambiar = (parcial) => setForm((f) => ({ ...f, ...parcial }))

  const reiniciar = () => {
    setFase('entrada')
    setTexto('')
    setPreguntas([])
    setRespuestas([])
    setForm(null)
    setResultado(null)
    setError('')
  }

  const analizar = async (respuestasEnviadas = []) => {
    setError('')
    setOcupado(true)
    try {
      const response = await api.post('ia/analizar/', {
        texto: texto.trim(),
        respuestas: respuestasEnviadas,
      })
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" /> Asistente
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Describe una tarea con tus palabras. El asistente completa los datos, te pregunta lo que falte y propone
          los pasos. Tú revisas todo antes de crearla.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive mb-4">
          {error}
        </p>
      )}

      {/* 1. Describir la tarea */}
      {fase === 'entrada' && (
        <Card className="shadow-none gap-0 py-0">
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="as-texto">¿Qué tienes que hacer?</Label>
              <textarea
                id="as-texto"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={4000}
                placeholder="Ej. Tengo que entregar un ensayo de inglés sobre tecnología el próximo lunes a las 8 am"
                className={claseTextarea}
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11.5px] text-muted-foreground">Prueba con:</span>
                {EJEMPLOS.map((ejemplo) => (
                  <button
                    key={ejemplo}
                    type="button"
                    onClick={() => setTexto(ejemplo)}
                    className="text-[11.5px] text-primary hover:underline text-left"
                  >
                    {ejemplo}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="flex gap-2.5 rounded-lg px-3 py-2.5 text-[12px]"
              style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
            >
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>
                Lo que escribas se envía a Google (Gemini) para analizarlo. En el plan gratuito, Google puede usarlo
                para mejorar sus productos: no incluyas datos personales ni información privada.
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[12px] text-muted-foreground">
                {restantes !== null && `Te quedan ${restantes} consultas hoy.`}
              </span>
              <Button onClick={() => analizar([])} disabled={ocupado || texto.trim().length < 5}>
                {ocupado ? <Spinner /> : <Sparkles size={14} />}
                {ocupado ? 'Analizando…' : 'Analizar con IA'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Preguntas del asistente */}
      {fase === 'preguntas' && (
        <Card className="shadow-none gap-0 py-0">
          <CardContent className="p-5 flex flex-col gap-4">
            <p className="text-[13px]">Para armar la tarea necesito saber:</p>
            {preguntas.map((pregunta, i) => (
              <div key={pregunta} className="grid gap-1.5">
                <Label htmlFor={`as-pregunta-${i}`}>{pregunta}</Label>
                <Input
                  id={`as-pregunta-${i}`}
                  value={respuestas[i]}
                  maxLength={300}
                  onChange={(e) => setRespuestas((r) => r.map((v, j) => (j === i ? e.target.value : v)))}
                />
              </div>
            ))}
            <p className="text-[11.5px] text-muted-foreground">
              Si no sabes alguna, déjala en blanco y la completas después en la propuesta.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" onClick={() => { setFase('entrada'); setError('') }} disabled={ocupado}>
                <ArrowLeft size={14} /> Atrás
              </Button>
              <Button onClick={continuarConRespuestas} disabled={ocupado}>
                {ocupado && <Spinner />}
                {ocupado ? 'Analizando…' : 'Continuar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Revisar y editar la propuesta */}
      {fase === 'propuesta' && form && (
        <Card className="shadow-none gap-0 py-0">
          <CardContent className="p-5 flex flex-col gap-5">
            <div>
              <h3>Revisa la propuesta</h3>
              <p className="text-[12.5px] text-muted-foreground mt-0.5">
                Es una sugerencia: puedes cambiar cualquier dato antes de crear la tarea.
              </p>
            </div>

            {form.advertencias.length > 0 && (
              <ul
                className="flex flex-col gap-1.5 rounded-lg px-3 py-2.5 text-[12.5px]"
                style={{ background: 'var(--media-soft)', color: 'color-mix(in oklab, var(--media) 70%, var(--foreground))' }}
              >
                {form.advertencias.map((aviso) => (
                  <li key={aviso} className="flex gap-2">
                    <Info size={14} className="shrink-0 mt-0.5" /> {aviso}
                  </li>
                ))}
              </ul>
            )}

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
                <option value="" disabled>
                  Elige una materia
                </option>
                {asignaturas.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    {a.nombre}
                  </option>
                ))}
                <option value="nueva">+ Crear materia nueva…</option>
              </select>
            </div>

            {form.materiaModo === 'nueva' && (
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem] gap-3">
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
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="as-titulo">Título</Label>
              <Input
                id="as-titulo"
                value={form.titulo}
                maxLength={100}
                onChange={(e) => cambiar({ titulo: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem] gap-3">
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

            <div className="grid gap-1.5">
              <Label>Dificultad</Label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => {
                  const activo = form.dificultad === n
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => cambiar({ dificultad: n })}
                      aria-pressed={activo}
                      className="h-9 rounded-lg border text-sm font-medium num-tabular transition-colors"
                      style={{
                        background: activo ? 'var(--primary)' : 'transparent',
                        color: activo ? 'var(--primary-foreground)' : 'var(--foreground)',
                        borderColor: activo ? 'var(--primary)' : 'var(--input)',
                      }}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Plan de pasos</Label>
              {form.pasos.length === 0 && (
                <p className="text-[12.5px] text-muted-foreground">Sin pasos. Puedes agregar los que quieras.</p>
              )}
              <ul className="flex flex-col gap-2">
                {form.pasos.map((paso, i) => (
                  <li key={paso.clave} className="flex items-center gap-2">
                    <span className="w-5 text-[12px] text-muted-foreground num-tabular">{i + 1}.</span>
                    <Input
                      value={paso.titulo}
                      maxLength={200}
                      aria-label={`Paso ${i + 1}`}
                      onChange={(e) =>
                        cambiar({
                          pasos: form.pasos.map((p) => (p.clave === paso.clave ? { ...p, titulo: e.target.value } : p)),
                        })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-destructive hover:text-destructive shrink-0"
                      aria-label={`Quitar el paso ${i + 1}`}
                      onClick={() => cambiar({ pasos: form.pasos.filter((p) => p.clave !== paso.clave) })}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </li>
                ))}
              </ul>
              {form.pasos.length < MAX_PASOS && (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      cambiar({ pasos: [...form.pasos, { clave: nuevaClave(), titulo: '', horas_estimadas: null }] })
                    }
                  >
                    <Plus size={13} /> Agregar paso
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <Button variant="outline" onClick={reiniciar} disabled={ocupado}>
                Empezar de nuevo
              </Button>
              <Button onClick={confirmar} disabled={!puedeCrear || ocupado}>
                {ocupado ? <Spinner /> : <Check size={14} />}
                {ocupado ? 'Creando…' : 'Crear tarea'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Listo */}
      {fase === 'listo' && resultado && (
        <Card className="shadow-none gap-0 py-0">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
              <Check size={18} className="text-primary" />
            </div>
            <div>
              <div className="text-[15px] font-semibold">Tarea creada</div>
              <p className="text-[12.5px] text-muted-foreground mt-0.5">
                {resultado.asignatura_creada && `Se creó la materia «${resultado.asignatura.nombre}». `}
                {resultado.pasos.length > 0 && `Se guardaron ${resultado.pasos.length} pasos.`}
              </p>
            </div>
            <AnilloCriticidad nivel={resultado.tarea.nivel_criticidad} tamaño={64} />
            <div className="text-[13.5px] font-medium">{resultado.tarea.titulo}</div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button variant="outline" onClick={reiniciar}>
                Crear otra tarea
              </Button>
              <Button onClick={onIrTablero}>Ver en el tablero</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Asistente