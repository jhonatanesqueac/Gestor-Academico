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

function Cuerpo({ asignaturas, onCerrar, onGuardado }) {
  const [asignaturaId, setAsignaturaId] = useState(asignaturas.length === 1 ? String(asignaturas[0].id) : '')
  const [titulo, setTitulo] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [dificultad, setDificultad] = useState(3)
  const [horas, setHoras] = useState('2')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)

    try {
      const response = await api.post('tareas/', {
        asignatura: parseInt(asignaturaId, 10),
        titulo: titulo.trim(),
        // toISOString respeta tu zona horaria (sin esto, la hora se guarda corrida)
        fecha_entrega: new Date(fechaEntrega).toISOString(),
        dificultad,
        horas_estimadas: parseFloat(horas),
      })
      onGuardado(response.data)
      onCerrar()
    } catch (err) {
      console.error('Error creando tarea:', err)
      setError('No se pudo crear la tarea. Revisa los datos e intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Nueva tarea</DialogTitle>
        <DialogDescription>
          Su nivel de criticidad se calcula solo a partir de la fecha, los créditos y la dificultad.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-1.5">
        <Label htmlFor="tarea-asignatura">Asignatura</Label>
        <select
          id="tarea-asignatura"
          value={asignaturaId}
          onChange={(e) => setAsignaturaId(e.target.value)}
          required
          className={claseSelect}
        >
          <option value="" disabled>Elige una asignatura</option>
          {asignaturas.map((a) => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="tarea-titulo">Título</Label>
        <Input
          id="tarea-titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej. Taller de árboles binarios"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_7rem] gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="tarea-fecha">Fecha de entrega</Label>
          <Input
            id="tarea-fecha"
            type="datetime-local"
            value={fechaEntrega}
            onChange={(e) => setFechaEntrega(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tarea-horas">Horas est.</Label>
          <Input
            id="tarea-horas"
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
        <p className="text-xs text-muted-foreground">
          {etiquetasDificultad[dificultad]} — las tareas más difíciles suben en prioridad.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? 'Guardando...' : 'Crear tarea'}
        </Button>
      </DialogFooter>
    </form>
  )
}

function DialogTarea({ abierto, asignaturas, onCerrar, onGuardado }) {
  return (
    <Dialog open={abierto} onOpenChange={(valor) => { if (!valor) onCerrar() }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <Cuerpo asignaturas={asignaturas} onCerrar={onCerrar} onGuardado={onGuardado} />
      </DialogContent>
    </Dialog>
  )
}

export default DialogTarea