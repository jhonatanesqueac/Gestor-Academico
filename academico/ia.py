import base64
import json
import urllib.error
import urllib.request

from decouple import config

URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'


class IAError(Exception):
    """Error controlado. `mensaje` es seguro de mostrar al estudiante;
    `detalle` es solo para depurar en la consola del servidor."""

    def __init__(self, mensaje, codigo='error', detalle=''):
        super().__init__(mensaje)
        self.mensaje = mensaje
        self.codigo = codigo
        self.detalle = detalle


def ia_disponible():
    return bool(config('GEMINI_API_KEY', default='').strip())


def modelos_configurados():
    """Modelo principal y, si existe, el de respaldo (para cuando se agota la cuota)."""
    principal = config('GEMINI_MODEL', default='gemini-3.5-flash').strip()
    respaldo = config('GEMINI_MODEL_RESPALDO', default='').strip()
    return [m for m in (principal, respaldo) if m]


def _llamar(modelo, cuerpo, clave, timeout):
    peticion = urllib.request.Request(
        f'{URL_BASE}/{modelo}:generateContent',
        data=json.dumps(cuerpo).encode('utf-8'),
        # La clave va en un encabezado, nunca en la URL (las URL se registran en logs)
        headers={'Content-Type': 'application/json', 'x-goog-api-key': clave},
        method='POST',
    )
    with urllib.request.urlopen(peticion, timeout=timeout) as respuesta:
        return json.loads(respuesta.read().decode('utf-8'))


def _leer_cuerpo_error(error):
    try:
        return error.read().decode('utf-8', errors='replace')[:400]
    except Exception:
        return ''


def _traducir_error(codigo_http, cuerpo, modelo):
    detalle = f'{modelo} -> HTTP {codigo_http}: {cuerpo}'
    if codigo_http == 429:
        return IAError('El asistente alcanzó su límite gratuito por ahora. Inténtalo más tarde.', 'cuota', detalle)
    if codigo_http in (401, 403) or (codigo_http == 400 and 'API key' in cuerpo):
        return IAError('La clave del asistente no es válida o no tiene permiso.', 'clave', detalle)
    if codigo_http == 404:
        return IAError('El modelo configurado no existe.', 'modelo', detalle)
    return IAError('No se pudo consultar al asistente. Inténtalo de nuevo.', 'error', detalle)


def _extraer_json(respuesta):
    try:
        partes = respuesta['candidates'][0]['content']['parts']
        texto = ''.join(p.get('text', '') for p in partes if not p.get('thought'))
    except (KeyError, IndexError, TypeError):
        raise IAError('El asistente no pudo procesar ese contenido.', 'bloqueado', json.dumps(respuesta)[:400])

    texto = texto.strip()
    if texto.startswith('```'):  # por si el modelo envuelve el JSON en un bloque de código
        texto = texto.strip('`')
        if texto.lower().startswith('json'):
            texto = texto[4:]
    try:
        return json.loads(texto)
    except json.JSONDecodeError:
        raise IAError('El asistente devolvió una respuesta que no se pudo leer.', 'formato', texto[:400])


def pedir_json(instrucciones, contenido, archivo=None, timeout=45):
    """
    Pide una respuesta en JSON. Devuelve (datos, modelo_que_respondió).
    `archivo` es opcional: una tupla (bytes, tipo_mime) para PDF o imágenes.
    Si el modelo principal falla por cuota o por error, prueba con el de respaldo.
    """
    clave = config('GEMINI_API_KEY', default='').strip()
    if not clave:
        raise IAError('El asistente no está configurado.', 'sin_clave')

    partes = [{'text': contenido}]
    if archivo:
        datos, tipo_mime = archivo
        partes.append({'inline_data': {'mime_type': tipo_mime, 'data': base64.b64encode(datos).decode('ascii')}})

    cuerpo = {
        'system_instruction': {'parts': [{'text': instrucciones}]},
        'contents': [{'role': 'user', 'parts': partes}],
        'generationConfig': {'responseMimeType': 'application/json', 'temperature': 0.3},
    }

    ultimo_error = None
    for modelo in modelos_configurados():
        try:
            respuesta = _llamar(modelo, cuerpo, clave, timeout)
        except urllib.error.HTTPError as e:
            ultimo_error = _traducir_error(e.code, _leer_cuerpo_error(e), modelo)
            if ultimo_error.codigo == 'clave':
                break  # con una clave mala, otro modelo no arregla nada
            continue
        except (urllib.error.URLError, OSError) as e:
            ultimo_error = IAError('No se pudo conectar con el asistente. Revisa tu conexión.', 'red', str(e))
            break

        try:
            return _extraer_json(respuesta), modelo
        except IAError as e:
            ultimo_error = e
            continue

    raise ultimo_error or IAError('No hay ningún modelo configurado.', 'sin_clave')