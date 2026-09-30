import { useState } from 'react'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import api from '../api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import DialogAsignatura from './DialogAsignatura'
import DialogTarea from './DialogTarea'

function Gestionar({
  asignaturas,
  tareas = [],
  onAsignaturaCreada,
  onTareaCreada,
  onAsignaturaActualizada,
  onAsignaturaEliminada,
}) {
  const [dialogAsig, setDialogAsig] = useState({ abierto: false, asignatura: null })
  const [dialogTarea, setDialogTarea] = useState(false)
  const [confirmar, setConfirmar] = useState({ abierto: false, asignatura: null })
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')

  const resumenDe = (id) => {
    const suyas = tareas.filter((t) => t.asignatura === id)
    const terminadas = suyas.filter((t) => t.estado === 'TERMINADO').length
    return { total: suyas.length, terminadas, activas: suyas.length - terminadas }
  }

  const creditosTotal = asignaturas.reduce((suma, a) => suma + a.creditos, 0)
  const activasTotal = tareas.filter((t) => t.estado !== 'TERMINADO').length

  const handleEliminar = async () => {
    const asignatura = confirmar.asignatura
    if (!asignatura) return
    setEliminando(true)
    setErrorEliminar('')
    try {
      await api.delete(`asignaturas/${asignatura.id}/`)
      onAsignaturaEliminada(asignatura.id)
      setConfirmar((c) => ({ ...c, abierto: false }))
    } catch (error) {
      console.error('Error eliminando asignatura:', error)
      setErrorEliminar('No se pudo eliminar. Intenta de nuevo.')
    } finally {
      setEliminando(false)
    }
  }

  const pedirConfirmacion = (asignatura) => {
    setErrorEliminar('')
    setConfirmar({ abierto: true, asignatura })
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2>Gestionar</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            {asignaturas.length} {asignaturas.length === 1 ? 'asignatura' : 'asignaturas'} · {creditosTotal}{' '}
            {creditosTotal === 1 ? 'crédito' : 'créditos'} · {activasTotal}{' '}
            {activasTotal === 1 ? 'tarea activa' : 'tareas activas'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDialogAsig({ abierto: true, asignatura: null })}>
            <Plus size={14} /> Asignatura
          </Button>
          <Button onClick={() => setDialogTarea(true)} disabled={asignaturas.length === 0}>
            <Plus size={14} /> Tarea
          </Button>
        </div>
      </div>

      {/* Estado vacío */}
      {asignaturas.length === 0 && (
        <div className="flex flex-col items-center text-center gap-3 rounded-xl border border-dashed py-14 px-6">
          <div className="size-11 rounded-full bg-muted flex items-center justify-center">
            <BookOpen size={20} className="text-muted-foreground" />
          </div>
          <div>
            <div className="text-[14px] font-medium">Aún no tienes asignaturas</div>
            <p className="text-[13px] text-muted-foreground mt-1">
              Crea la primera para empezar a registrar tus entregas.
            </p>
          </div>
          <Button onClick={() => setDialogAsig({ abierto: true, asignatura: null })}>
            <Plus size={14} /> Crear asignatura
          </Button>
        </div>
      )}

      {/* Cuadrícula de asignaturas */}
      {asignaturas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {asignaturas.map((a) => {
            const r = resumenDe(a.id)
            const porcentaje = r.total > 0 ? (r.terminadas / r.total) * 100 : 0
            return (
              <Card key={a.id} className="shadow-none gap-0 py-0">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="size-9 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `color-mix(in oklab, ${a.color} 16%, var(--card))` }}
                    >
                      <BookOpen size={16} style={{ color: `color-mix(in oklab, ${a.color} 70%, var(--foreground))` }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium truncate">{a.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {a.creditos} {a.creditos === 1 ? 'crédito' : 'créditos'}
                      </div>
                    </div>
                    <div className="flex gap-0.5 shrink-0 -mr-1 -mt-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Editar ${a.nombre}`}
                        onClick={() => setDialogAsig({ abierto: true, asignatura: a })}
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-destructive hover:text-destructive"
                        aria-label={`Eliminar ${a.nombre}`}
                        onClick={() => pedirConfirmacion(a)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    {r.total === 0 ? (
                      <p className="text-[11.5px] text-muted-foreground">Sin tareas todavía</p>
                    ) : (
                      <div className="flex justify-between text-[11.5px] text-muted-foreground mb-1.5">
                        <span>{r.activas} {r.activas === 1 ? 'activa' : 'activas'}</span>
                        <span className="num-tabular">{r.terminadas}/{r.total} terminadas</span>
                      </div>
                    )}
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${porcentaje}%`, backgroundColor: a.color }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Diálogos */}
      <DialogAsignatura
        abierto={dialogAsig.abierto}
        asignatura={dialogAsig.asignatura}
        onCerrar={() => setDialogAsig((d) => ({ ...d, abierto: false }))}
        onGuardado={(guardada) =>
          dialogAsig.asignatura ? onAsignaturaActualizada(guardada) : onAsignaturaCreada(guardada)
        }
      />

      <DialogTarea
        abierto={dialogTarea}
        asignaturas={asignaturas}
        onCerrar={() => setDialogTarea(false)}
        onGuardado={onTareaCreada}
      />

      <Dialog
        open={confirmar.abierto}
        onOpenChange={(valor) => { if (!valor) setConfirmar((c) => ({ ...c, abierto: false })) }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar {confirmar.asignatura?.nombre}</DialogTitle>
            <DialogDescription>
              {confirmar.asignatura && resumenDe(confirmar.asignatura.id).total > 0
                ? `Se eliminarán también sus ${resumenDe(confirmar.asignatura.id).total} tareas y las alertas asociadas. Esta acción no se puede deshacer.`
                : 'Esta acción no se puede deshacer.'}
            </DialogDescription>
          </DialogHeader>
          {errorEliminar && <p className="text-sm text-destructive">{errorEliminar}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmar((c) => ({ ...c, abierto: false }))}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleEliminar} disabled={eliminando}>
              {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Gestionar