import axios from 'axios'

// En producción, define VITE_API_URL en el .env de Vercel apuntando a
// tu backend real (ej. https://tu-backend.up.railway.app/api/).
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/'

// El access token vive SOLO en memoria (esta variable de módulo),
// nunca en localStorage ni en una cookie legible por JS. Se pierde al
// recargar la página a propósito: si un script malicioso (XSS) lograra
// ejecutarse, no tiene forma de leer esta variable desde fuera del
// bundle, y aunque lo hiciera, el token vive máximo 15 minutos.
//
// El refresh token vive en una cookie httpOnly que pone el backend —
// JavaScript no puede leerla ni con document.cookie, así que ni
// siquiera un XSS exitoso puede robarla.
let accessToken = null

export function setAccessToken(token) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

export function clearAccessToken() {
  accessToken = null
}

const api = axios.create({
  baseURL: API_URL,
  // Necesario para que el navegador mande/reciba la cookie httpOnly
  // del refresh token, incluso siendo frontend/backend dominios
  // distintos en producción.
  withCredentials: true,
})

// Antes de CADA petición, agrega el access token (en memoria) al
// header Authorization.
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Si una petición falla con 401 (access token vencido o inexistente
// tras recargar la página), intenta renovarlo UNA vez usando la
// cookie httpOnly del refresh (el backend la lee solo, no hace falta
// mandar nada en el body), y reintenta la petición original. Si el
// refresh también falla, manda al usuario de vuelta al login.
let renovando = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // El endpoint de refresh se maneja por su cuenta en AuthContext
    // (silent refresh al cargar la app). Si ESTE endpoint es el que
    // falló con 401, no hay que "renovar" nada -- eso sería intentar
    // renovar el refresh usando el refresh, un sinsentido que además
    // termina en window.location.href de forma repetida (bucle de
    // recargas). Simplemente se deja fallar, y quien llamó decide
    // qué hacer (AuthContext ya tiene su propio .catch para esto).
    const esLlamadaDeRefresh = original?.url?.includes('auth/refresh/')

    if (error.response?.status === 401 && !original._retry && !esLlamadaDeRefresh) {
      original._retry = true

      try {
        if (!renovando) {
          renovando = axios
            .post(`${API_URL}auth/refresh/`, {}, { withCredentials: true })
            .then((res) => {
              setAccessToken(res.data.access)
              return res.data.access
            })
            .finally(() => {
              renovando = null
            })
        }

        const nuevoAccess = await renovando
        original.headers.Authorization = `Bearer ${nuevoAccess}`
        return api(original)
      } catch (errorRenovacion) {
        clearAccessToken()
        localStorage.removeItem('nombre')
        window.location.href = '/login'
        return Promise.reject(errorRenovacion)
      }
    }

    return Promise.reject(error)
  }
)

export default api