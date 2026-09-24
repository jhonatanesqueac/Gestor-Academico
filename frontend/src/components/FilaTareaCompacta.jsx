import AnilloCriticidad from './AnilloCriticidad'

function FilaTareaCompacta({ tarea }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-b-0">
      <AnilloCriticidad nivel={tarea.nivel_criticidad} tamaño={34} />
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] font-medium text-muted-foreground uppercase tracking-wide truncate">
          {tarea.asignatura_nombre}
        </div>
        <div className="text-[13px] font-medium truncate">{tarea.titulo}</div>
      </div>
      <div className="text-[11.5px] text-muted-foreground whitespace-nowrap">
        {new Date(tarea.fecha_entrega).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
      </div>
    </div>
  )
}

export default FilaTareaCompacta