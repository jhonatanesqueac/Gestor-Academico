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
import SelectorColor from './SelectorColor'

function Cuerpo({ asignatura, onCerrar, onGuardado }) {
  const editando = Boolean(asignatura)
  const [nombre, setNombre] = useState(asignatura?.nombre ?? '')
  const [creditos, setCreditos] = useState(String(asignatura?.creditos ?? 3))
  const [color, setColor] = useState(asignatura?.color ?? '#5B7065')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)

    const datos = { nombre: nombre.trim(), creditos: parseInt(creditos, 10), color }

    try {
      const response = editando
        ? await api.patch(`asignaturas/${asignatura.id}/`, datos)
        : await api.post('asignaturas/', datos)
      onGuardado(response.data)
      onCerrar()
    } catch (err) {
      console.error('Error guardando asignatura:', err)
      setError('No se pudo guardar. Revisa los datos e intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{editando ? 'Editar asignatura' : 'Nueva asignatura'}</DialogTitle>
        <DialogDescription>
          {editando ? 'Actualiza los datos de esta materia.' : 'Agrega una materia que estés cursando este semestre.'}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-1.5">
        <Label htmlFor="asig-nombre">Nombre</Label>
        <Input
          id="asig-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Estructuras de Datos"
          required
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="asig-creditos">Créditos</Label>
        <Input
          id="asig-creditos"
          type="number"
          min="1"
          max="10"
          value={creditos}
          onChange={(e) => setCreditos(e.target.value)}
          required
          className="w-24"
        />
        <p className="text-xs text-muted-foreground">
          Las materias con más créditos pesan más en la prioridad de tus tareas.
        </p>
      </div>

      <div className="grid gap-1.5">
        <Label>Color</Label>
        <SelectorColor valor={color} onCambio={setColor} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear asignatura'}
        </Button>
      </DialogFooter>
    </form>
  )
}

function DialogAsignatura({ abierto, asignatura, onCerrar, onGuardado }) {
  return (
    <Dialog open={abierto} onOpenChange={(valor) => { if (!valor) onCerrar() }}>
      <DialogContent className="sm:max-w-md">
        <Cuerpo asignatura={asignatura} onCerrar={onCerrar} onGuardado={onGuardado} />
      </DialogContent>
    </Dialog>
  )
}

export default DialogAsignatura