import { Calendar, Pencil, Trash2, ArrowLeft, ArrowRight, MoreHorizontal } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import AnilloCriticidad from './AnilloCriticidad'

const siguienteEstado = {
  PENDIENTE: { valor: 'EN_PROCESO', etiqueta: 'En proceso' },
  EN_PROCESO: { valor: 'TERMINADO', etiqueta: 'Terminado' },
}
const anteriorEstado = {
  EN_PROCESO: { valor: 'PENDIENTE' },
  TERMINADO: { valor: 'EN_PROCESO' },
}

function TarjetaTarea({ tarea, onCambiarEstado, onEditar, onEliminar }) {
  const avanzar = siguienteEstado[tarea.estado]
  const retroceder = anteriorEstado[tarea.estado]

  return (
    <Card className="mb-2.5 gap-0 py-0 shadow-none transition-shadow hover:shadow-md">
      <CardContent className="p-3.5">
        <div className="flex items-start gap-3">
          <AnilloCriticidad nivel={tarea.nivel_criticidad} />

          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">
              {tarea.asignatura_nombre}
            </div>
            <div className="text-[13.5px] font-medium leading-snug mt-0.5 mb-1.5">
              {tarea.titulo}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar size={12} strokeWidth={1.8} />
              {new Date(tarea.fecha_entrega).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-2 mt-3">
          <div className="flex items-center gap-1">
            {retroceder && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onCambiarEstado(tarea.id, retroceder.valor)}
              >
                <ArrowLeft size={13} />
              </Button>
            )}
            {avanzar && (
              <Button
                variant="ghost"
                size="xs"
                className="text-primary hover:text-primary"
                onClick={() => onCambiarEstado(tarea.id, avanzar.valor)}
              >
                {avanzar.etiqueta}
                <ArrowRight size={12} />
              </Button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-xs">
                  <MoreHorizontal size={14} />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => onEditar(tarea)}>
                <Pencil size={13} /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onEliminar(tarea.id)}>
                <Trash2 size={13} /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

export default TarjetaTarea