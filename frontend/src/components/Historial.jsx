import { useState } from 'react'
import { Clock3, CheckCircle2, RotateCcw, Trash2, AlertTriangle } from 'lucide-react'
import api from '../api/axios'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import AnilloCriticidad from './AnilloCriticidad'
import { esVencida } from '../lib/tareas'

function formatoFecha(f) {
  return new Date(f).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function FilaHistorial({ tarea, tipo, onCambiarEstado, onEliminar }) {
  const color = tarea.asignatura_color || 'var(--primary)'
  return (
    <div className="flex items-center gap-3 py-3.5 border-b last:border-b-0 border-border/60">
      <AnilloCriticidad nivel={tarea.nivel_criticidad} tamaño={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span
            className="inline-block text-[9.5px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `color-mix(in oklab, ${color} 16%, var(--card))`,
              color: `color-mix(in oklab, ${color} 65%, var(--foreground))`,
            }}
          >
            {tarea.asignatura_nombre}
          </span>
          {tipo === 'vencida' ? (
            <Badge variant="destructive" className="text-[10px]">Vencida</Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">Completada</Badge>
          )}
        </div>
        <div className="text-[13.5px] font-medium truncate">{tarea.titulo}</div>
        <div className="text-[11.5px] text-muted-foreground mt-0.5">
          {tipo === 'vencida'
            ? `Venció el ${formatoFecha(tarea.fecha_entrega)}`
            : `Entregaba el ${formatoFecha(tarea.fecha_entrega)}`}
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        {tipo === 'vencida' ? (
          <Button size="sm" variant="outline" onClick={() => onCambiarEstado(tarea.id, 'TERMINADO')}>
            <CheckCircle2 size={13} /> Marcar terminada
          </Button>
        ) : (
          <Button
            size="icon-xs"
            variant="ghost"
            title="Devolver a en proceso"
            onClick={() => onCambiarEstado(tarea.id, 'EN_PROCESO')}
          >
            <RotateCcw size={13} />
          </Button>
        )}
        <Button
          size="icon-xs"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          title="Eliminar"
          onClick={() => onEliminar(tarea.id)}
        >
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  )
}

function Historial({ tareas, onTareaActualizada, onTareaEliminada }) {
  const vencidas = tareas.filter(esVencida).sort((a, b) => new Date(a.fecha_entrega) - new Date(b.fecha_entrega))
  const completadas = tareas
    .filter((t) => t.estado === 'TERMINADO')
    .sort((a, b) => new Date(b.actualizado_en) - new Date(a.actualizado_en))

  const [tab, setTab] = useState(vencidas.length > 0 ? 'vencidas' : 'completadas')

  const handleCambiarEstado = async (id, estado) => {
    try {
      const response = await api.patch(`tareas/${id}/`, { estado })
      onTareaActualizada(response.data)
    } catch (error) {
      console.error('Error actualizando tarea:', error)
    }
  }

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta tarea? No se puede deshacer.')) return
    try {
      await api.delete(`tareas/${id}/`)
      onTareaEliminada(id)
    } catch (error) {
      console.error('Error eliminando tarea:', error)
    }
  }

  const lista = tab === 'vencidas' ? vencidas : completadas

  return (
    <div>
      <div className="mb-5">
        <h2>Historial</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Tareas completadas y tareas que vencieron sin marcarse a tiempo.
        </p>
      </div>

      <div className="flex gap-1.5 mb-4">
        <button
          onClick={() => setTab('vencidas')}
          className="flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded-md transition-colors"
          style={{
            background: tab === 'vencidas' ? 'var(--primary)' : 'var(--card)',
            color: tab === 'vencidas' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
            border: '1px solid var(--border)',
          }}
        >
          <AlertTriangle size={13} /> Vencidas <span className="num-tabular opacity-80">({vencidas.length})</span>
        </button>
        <button
          onClick={() => setTab('completadas')}
          className="flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded-md transition-colors"
          style={{
            background: tab === 'completadas' ? 'var(--primary)' : 'var(--card)',
            color: tab === 'completadas' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
            border: '1px solid var(--border)',
          }}
        >
          <CheckCircle2 size={13} /> Completadas <span className="num-tabular opacity-80">({completadas.length})</span>
        </button>
      </div>

      <Card className="shadow-none gap-0 py-0">
        <CardContent className="p-4">
          {lista.length === 0 && (
            <div className="flex flex-col items-center text-center gap-2 py-12">
              <Clock3 size={24} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {tab === 'vencidas' ? 'No tienes tareas vencidas. 🎉' : 'Aún no has completado tareas.'}
              </p>
            </div>
          )}
          {lista.map((t) => (
            <FilaHistorial
              key={t.id}
              tarea={t}
              tipo={tab === 'vencidas' ? 'vencida' : 'completada'}
              onCambiarEstado={handleCambiarEstado}
              onEliminar={handleEliminar}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default Historial