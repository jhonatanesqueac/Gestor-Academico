import { useState } from 'react'
import api from '../api/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

const etiquetasDificultad = { 1: 'Muy fácil', 2: 'Fácil', 3: 'Media', 4: 'Difícil', 5: 'Muy difícil' }

const claseSelect =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

// Convierte "2026-09-18T15:52:25Z" (formato de Django) al formato que
// necesita el input datetime-local: "2026-09-18T15:52", en tu hora local.
function aFormatoInput(fechaISO) {
  const fecha = new Date(fechaISO)
  const offset = fecha.getTimezoneOffset()
  const local = new Date(fecha.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function Cuerpo({ tarea, asignaturas, onCerrar, onGuardado }) {
  const [asignaturaId, setAsignaturaId] = useState(String(tarea.asignatura))
  const [titulo, setTitulo] = useState(tarea.titulo)
  const [fechaEntrega, setFechaEntrega] = useState(aFormatoInput(tarea.fecha_entrega))
  const [dificultad, setDificultad] = useState(tarea.dificultad)
  const [horas, setHoras] = useState(String(tarea.horas_estimadas))
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)

    try {
      const response = await api.patch(`tareas/${tarea.id}/`, {
        asignatura: parseInt(asignaturaId, 10),
        titulo: titulo.trim(),
        fecha_entrega: new Date(fechaEntrega).toISOString(),
        dificultad,
        horas_estimadas: parseFloat(horas),
      })
      onGuardado(response.data)
      onCerrar()
    } catch (err) {
      console.error('Error editando tarea:', err)
      setError('No se pudo guardar. Revisa los datos e intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Editar tarea</DialogTitle>
        <DialogDescription>
          Su nivel de criticidad se recalcula solo al guardar.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-1.5">
        <Label htmlFor="edit-asignatura">Asignatura</Label>
        <select
          id="edit-asignatura"
          value={asignaturaId}
          onChange={(e) => setAsignaturaId(e.target.value)}
          required
          className={claseSelect}
        >
          {asignaturas.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="edit-titulo">Título</Label>
        <Input id="edit-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_7rem] gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="edit-fecha">Fecha de entrega</Label>
          <Input
            id="edit-fecha"
            type="datetime-local"
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="edit-horas">Horas est.</Label>
          <Input
            id="edit-horas"
            type="number"
            min="0.5"
            step="0.5"
            value={horas}
            onChange={(e) => setHoras(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>Dificultad</Label>
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => {
            const activo = dificultad === n
            return (
              <button
                key={n}
                type="button"
                onClick={() => setDificultad(n)}
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
        <p className="text-xs text-muted-foreground">{etiquetasDificultad[dificultad]}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </DialogFooter>
    </form>
  )
}

function ModalEditarTarea({ tarea, asignaturas, onGuardado, onCerrar }) {
  return (
    <Dialog open onOpenChange={(valor) => { if (!valor) onCerrar() }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <Cuerpo tarea={tarea} asignaturas={asignaturas} onCerrar={onCerrar} onGuardado={onGuardado} />
      </DialogContent>
    </Dialog>
  )
}

export default ModalEditarTarea