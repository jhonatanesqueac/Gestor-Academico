import { useState } from 'react'
import { Plus, Trash2, ListChecks } from 'lucide-react'
import api from '../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

function DialogPasos({ tarea, pasos, onCerrar, onPasoCreado, onPasoActualizado, onPasoEliminado }) {
  const [nuevo, setNuevo] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const hechos = pasos.filter((p) => p.completado).length
  const porcentaje = pasos.length > 0 ? (hechos / pasos.length) * 100 : 0

  const handleAgregar = async (e) => {
    e.preventDefault()
    const titulo = nuevo.trim()
    if (!titulo) return
    setError('')
    setEnviando(true)
    try {
      const response = await api.post('pasos/', { tarea: tarea.id, titulo })
      onPasoCreado(response.data)
      setNuevo('')
    } catch (err) {
      console.error('Error creando paso:', err)
      setError('No se pudo agregar el paso.')
    } finally {
      setEnviando(false)
    }
  }

  const handleAlternar = async (paso) => {
    setError('')
    try {
      const response = await api.patch(`pasos/${paso.id}/`, { completado: !paso.completado })
      onPasoActualizado(response.data)
    } catch (err) {
      console.error('Error actualizando paso:', err)
      setError('No se pudo actualizar el paso.')
    }
  }

  const handleEliminar = async (paso) => {
    setError('')
    try {
      await api.delete(`pasos/${paso.id}/`)
      onPasoEliminado(paso.id)
    } catch (err) {
      console.error('Error eliminando paso:', err)
      setError('No se pudo eliminar el paso.')
    }
  }

  return (
    <Dialog open onOpenChange={(valor) => { if (!valor) onCerrar() }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tarea.titulo}</DialogTitle>
          <DialogDescription>
            {tarea.asignatura_nombre} · divide la tarea en pasos pequeños y ve marcándolos.
          </DialogDescription>
        </DialogHeader>

        {pasos.length > 0 && (
          <div>
            <div className="flex justify-between text-[12px] text-muted-foreground mb-1.5">
              <span>Progreso</span>
              <span className="num-tabular">{hechos}/{pasos.length}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
          </div>
        )}

        {pasos.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-2 py-6">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
              <ListChecks size={18} className="text-muted-foreground" />
            </div>
            <p className="text-[13px] text-muted-foreground">
              Aún no hay pasos. Una tarea grande se hace más fácil si la partes en tres o cuatro.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {pasos.map((paso) => (
              <li key={paso.id} className="group flex items-center gap-2.5 py-2 border-b last:border-b-0">
                <input
                  type="checkbox"
                  checked={paso.completado}
                  onChange={() => handleAlternar(paso)}
                  aria-label={`Marcar «${paso.titulo}»`}
                  className="size-4 shrink-0 cursor-pointer accent-[var(--primary)]"
                />
                <span
                  className="flex-1 min-w-0 text-[13.5px] break-words"
                  style={{
                    textDecoration: paso.completado ? 'line-through' : 'none',
                    color: paso.completado ? 'var(--muted-foreground)' : 'var(--foreground)',
                  }}
                >
                  {paso.titulo}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-destructive hover:text-destructive opacity-60 group-hover:opacity-100"
                  aria-label={`Eliminar «${paso.titulo}»`}
                  onClick={() => handleEliminar(paso)}
                >
                  <Trash2 size={13} />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAgregar} className="flex gap-2">
          <Input
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            placeholder="Ej. Leer el enunciado y listar requisitos"
            maxLength={200}
            aria-label="Nuevo paso"
          />
          <Button type="submit" disabled={enviando || !nuevo.trim()}>
            <Plus size={14} /> Agregar
          </Button>
        </form>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  )
}

export default DialogPasos