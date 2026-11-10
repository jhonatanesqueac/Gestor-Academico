import { Calendar, Pencil, Trash2, ArrowLeft, ArrowRight, MoreHorizontal, ListChecks } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import AnilloCriticidad from './AnilloCriticidad'
import { motion } from 'framer-motion'

const MotionCard = motion.create(Card)

const siguienteEstado = {
  PENDIENTE: { valor: 'EN_PROCESO', etiqueta: 'En proceso' },
  EN_PROCESO: { valor: 'TERMINADO', etiqueta: 'Terminado' },
}
const anteriorEstado = {
  EN_PROCESO: { valor: 'PENDIENTE' },
  TERMINADO: { valor: 'EN_PROCESO' },
}

function TarjetaTarea({ tarea, onCambiarEstado, onEditar, onEliminar, onVerPasos, pasos = [], indice = 0 }) {
  const avanzar = siguienteEstado[tarea.estado]
  const retroceder = anteriorEstado[tarea.estado]

  return (
    <MotionCard
      layout="position"
      initial={{ opacity: 0, y: 14 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: Math.min(indice, 8) * 0.05 },
      }}
      transition={{ layout: { type: 'spring', stiffness: 400, damping: 40 } }}
      className="mb-2.5 gap-0 rounded-2xl py-0 shadow-none transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
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

                {pasos.length > 0 && (
          <button
            onClick={() => onVerPasos(tarea)}
            className="w-full mt-3 text-left"
            aria-label="Ver pasos de la tarea"
          >
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>Pasos</span>
              <span className="num-tabular">
                {pasos.filter((p) => p.completado).length}/{pasos.length}
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${(pasos.filter((p) => p.completado).length / pasos.length) * 100}%` }}
              />
            </div>
          </button>
        )}

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
              <DropdownMenuItem onClick={() => onVerPasos(tarea)}><ListChecks size={13} /> Pasos</DropdownMenuItem><DropdownMenuItem onClick={() => onEditar(tarea)}>
                <Pencil size={13} /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onEliminar(tarea.id)}>
                <Trash2 size={13} /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </MotionCard>
  )
}

export default TarjetaTarea