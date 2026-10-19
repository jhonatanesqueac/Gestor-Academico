import { useState } from 'react'
import { Eye, EyeOff, Check, Mail, GraduationCap, Building2, CalendarDays } from 'lucide-react'
import api from '../api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import SelectorColor from './SelectorColor'
import { esVencida } from '../lib/tareas'
import { colorTextoSobre } from '../lib/color'

const claseTextarea =
  'w-full min-h-24 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors resize-y focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function aFormulario(p) {
  return {
    nombre: p.nombre ?? '',
    apellido: p.apellido ?? '',
    email: p.email ?? '',
    carrera: p.carrera ?? '',
    semestre: String(p.semestre ?? 1),
    institucion: p.institucion ?? '',
    telefono: p.telefono ?? '',
    bio: p.bio ?? '',
    color_avatar: p.color_avatar ?? '#5B7065',
  }
}

// Django responde algo como { "email": ["Introduzca un correo válido."] }: lo juntamos en un texto
function mensajeDeError(err, porDefecto) {
  const datos = err.response?.data
  if (datos && typeof datos === 'object') return Object.values(datos).flat().join(' ')
  return porDefecto
}

function DatoLinea({ Icono, texto }) {
  return (
    <div className="flex items-start gap-2.5 text-[12.5px] text-muted-foreground">
      <Icono size={14} className="mt-0.5 shrink-0" />
      <span className="break-words min-w-0">{texto}</span>
    </div>
  )
}

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <div className="text-[18px] font-semibold num-tabular leading-tight">{valor}</div>
      <div className="text-[11.5px] text-muted-foreground">{etiqueta}</div>
    </div>
  )
}

function CampoPassword({ id, etiqueta, valor, onCambio, autoComplete }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{etiqueta}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          autoComplete={autoComplete}
          required
          className="pr-9"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

function ContenidoPerfil({ perfil, tareas, asignaturas, onPerfilActualizado }) {
  const [form, setForm] = useState(() => aFormulario(perfil))
  const [guardando, setGuardando] = useState(false)
  const [errorPerfil, setErrorPerfil] = useState('')
  const [guardado, setGuardado] = useState(false)

  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [enviandoPass, setEnviandoPass] = useState(false)
  const [errorPass, setErrorPass] = useState('')
  const [okPass, setOkPass] = useState(false)

  const original = aFormulario(perfil)
  const hayCambios = Object.keys(form).some((k) => form[k] !== original[k])

  const cambiar = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }))
    setGuardado(false)
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setErrorPerfil('')
    setGuardado(false)
    setGuardando(true)

    try {
      const response = await api.patch('perfil/', {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        carrera: form.carrera.trim(),
        semestre: parseInt(form.semestre, 10),
        institucion: form.institucion.trim(),
        telefono: form.telefono.trim(),
        bio: form.bio.trim(),
        color_avatar: form.color_avatar,
      })
      localStorage.setItem('nombre', response.data.nombre)
      onPerfilActualizado(response.data)
      setForm(aFormulario(response.data))
      setGuardado(true)
    } catch (err) {
      console.error('Error guardando perfil:', err)
      setErrorPerfil(mensajeDeError(err, 'No se pudo guardar. Intenta de nuevo.'))
    } finally {
      setGuardando(false)
    }
  }

  const handleCambiarPassword = async (e) => {
    e.preventDefault()
    setErrorPass('')
    setOkPass(false)

    if (nueva !== confirmar) {
      setErrorPass('Las contraseñas nuevas no coinciden.')
      return
    }

    setEnviandoPass(true)
    try {
      await api.post('perfil/cambiar-password/', {
        password_actual: actual,
        password_nueva: nueva,
      })
      setActual('')
      setNueva('')
      setConfirmar('')
      setOkPass(true)
    } catch (err) {
      console.error('Error cambiando contraseña:', err)
      setErrorPass(mensajeDeError(err, 'No se pudo cambiar la contraseña.'))
    } finally {
      setEnviandoPass(false)
    }
  }

  const creditos = asignaturas.reduce((suma, a) => suma + a.creditos, 0)
  const completadas = tareas.filter((t) => t.estado === 'TERMINADO').length
  const activas = tareas.filter((t) => t.estado !== 'TERMINADO' && !esVencida(t)).length
  const inicial = (form.nombre || perfil.username).trim().charAt(0).toUpperCase()
  const nombreCompleto = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || perfil.username
  const desde = new Date(perfil.fecha_registro).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="mb-6">
        <h2>Perfil</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Tu información personal y la seguridad de tu cuenta.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
        {/* Resumen */}
        <Card className="shadow-none gap-0 py-0">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div
              className="size-20 rounded-full flex items-center justify-center text-[28px] font-semibold transition-colors"
              style={{ backgroundColor: form.color_avatar, color: colorTextoSobre(form.color_avatar) }}
            >
              {inicial}
            </div>
            <div className="text-[16px] font-semibold mt-4 break-words max-w-full">{nombreCompleto}</div>
            <div className="text-[12.5px] text-muted-foreground">@{perfil.username}</div>

            {perfil.bio && (
              <p className="text-[12.5px] text-muted-foreground mt-3 leading-relaxed">{perfil.bio}</p>
            )}

            <div className="w-full mt-5 pt-5 border-t flex flex-col gap-2.5 text-left">
              <DatoLinea Icono={GraduationCap} texto={`${perfil.carrera} · ${perfil.semestre}° semestre`} />
              {perfil.institucion && <DatoLinea Icono={Building2} texto={perfil.institucion} />}
              {perfil.email && <DatoLinea Icono={Mail} texto={perfil.email} />}
              <DatoLinea Icono={CalendarDays} texto={`Miembro desde ${desde}`} />
            </div>

            <div className="w-full mt-5 pt-5 border-t grid grid-cols-2 gap-4 text-left">
              <Dato etiqueta="Asignaturas" valor={asignaturas.length} />
              <Dato etiqueta="Créditos" valor={creditos} />
              <Dato etiqueta="Activas" valor={activas} />
              <Dato etiqueta="Completadas" valor={completadas} />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 min-w-0">
          {/* Información personal */}
          <Card className="shadow-none gap-0 py-0">
            <CardContent className="p-6">
              <form onSubmit={handleGuardar} className="flex flex-col gap-5">
                <div>
                  <h3>Información personal</h3>
                  <p className="text-[12.5px] text-muted-foreground mt-0.5">Así apareces en la aplicación.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="p-nombre">Nombre</Label>
                    <Input id="p-nombre" value={form.nombre} onChange={(e) => cambiar('nombre', e.target.value)} required />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="p-apellido">Apellido</Label>
                    <Input id="p-apellido" value={form.apellido} onChange={(e) => cambiar('apellido', e.target.value)} />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="p-usuario">Usuario</Label>
                    <Input id="p-usuario" value={perfil.username} disabled />
                    <p className="text-[11.5px] text-muted-foreground">No se puede cambiar.</p>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="p-email">Correo</Label>
                    <Input id="p-email" type="email" value={form.email} onChange={(e) => cambiar('email', e.target.value)} placeholder="tu@correo.com" />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="p-carrera">Carrera</Label>
                    <Input id="p-carrera" value={form.carrera} onChange={(e) => cambiar('carrera', e.target.value)} required />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="p-semestre">Semestre</Label>
                    <Input id="p-semestre" type="number" min="1" max="12" value={form.semestre} onChange={(e) => cambiar('semestre', e.target.value)} required className="w-28" />
                  </div>

                  <div className="grid gap-1.5">
                    <Label htmlFor="p-institucion">Institución</Label>
                    <Input id="p-institucion" value={form.institucion} onChange={(e) => cambiar('institucion', e.target.value)} placeholder="Ej. Universidad del Atlántico" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="p-telefono">Teléfono</Label>
                    <Input id="p-telefono" type="tel" value={form.telefono} onChange={(e) => cambiar('telefono', e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="p-bio">Sobre ti</Label>
                  <textarea
                    id="p-bio"
                    value={form.bio}
                    onChange={(e) => cambiar('bio', e.target.value)}
                    maxLength={300}
                    placeholder="Una frase sobre ti, tus metas del semestre..."
                    className={claseTextarea}
                  />
                  <p className="text-[11.5px] text-muted-foreground text-right num-tabular">{form.bio.length}/300</p>
                </div>

                <div className="grid gap-1.5">
                  <Label>Color del avatar</Label>
                  <SelectorColor valor={form.color_avatar} onCambio={(c) => cambiar('color_avatar', c)} />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                  {errorPerfil && <p className="text-sm text-destructive mr-auto">{errorPerfil}</p>}
                  {guardado && !hayCambios && (
                    <span className="flex items-center gap-1 text-[12.5px] mr-auto" style={{ color: 'var(--ok)' }}>
                      <Check size={14} /> Cambios guardados
                    </span>
                  )}
                  {hayCambios && (
                    <Button type="button" variant="outline" onClick={() => { setForm(aFormulario(perfil)); setErrorPerfil('') }}>
                      Descartar
                    </Button>
                  )}
                  <Button type="submit" disabled={!hayCambios || guardando}>
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Seguridad */}
          <Card className="shadow-none gap-0 py-0">
            <CardContent className="p-6">
              <form onSubmit={handleCambiarPassword} className="flex flex-col gap-4 max-w-md">
                <div>
                  <h3>Cambiar contraseña</h3>
                  <p className="text-[12.5px] text-muted-foreground mt-0.5">
                    Mínimo 8 caracteres; no puede ser solo números ni una contraseña muy común.
                  </p>
                </div>

                <CampoPassword id="p-actual" etiqueta="Contraseña actual" valor={actual} onCambio={setActual} autoComplete="current-password" />
                <CampoPassword id="p-nueva" etiqueta="Contraseña nueva" valor={nueva} onCambio={setNueva} autoComplete="new-password" />
                <CampoPassword id="p-confirmar" etiqueta="Confirmar contraseña nueva" valor={confirmar} onCambio={setConfirmar} autoComplete="new-password" />

                {errorPass && <p className="text-sm text-destructive">{errorPass}</p>}
                {okPass && (
                  <p className="flex items-center gap-1 text-[13px]" style={{ color: 'var(--ok)' }}>
                    <Check size={14} /> Contraseña actualizada.
                  </p>
                )}

                <div>
                  <Button type="submit" disabled={enviandoPass}>
                    {enviandoPass ? 'Actualizando...' : 'Actualizar contraseña'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Perfil({ perfil, tareas, asignaturas, onPerfilActualizado }) {
  if (!perfil) {
    return (
      <p className="text-sm text-muted-foreground">
        No se pudo cargar tu perfil. Recarga la página e intenta de nuevo.
      </p>
    )
  }
  return (
    <ContenidoPerfil
      perfil={perfil}
      tareas={tareas}
      asignaturas={asignaturas}
      onPerfilActualizado={onPerfilActualizado}
    />
  )
}

export default Perfil