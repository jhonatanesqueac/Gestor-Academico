/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState, useRef } from 'react'
import api, { setAccessToken, clearAccessToken } from '../api/axios'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // null = todavía no sabemos (esperando el silent refresh inicial)
  // true/false = ya lo sabemos con certeza
  const [autenticado, setAutenticado] = useState(null)
  // Evita que React StrictMode (que en desarrollo monta los efectos
  // dos veces a propósito) o un doble-render disparen DOS peticiones
  // de refresh casi simultáneas. Con ROTATE_REFRESH_TOKENS +
  // BLACKLIST_AFTER_ROTATION, la segunda petición usaría un token que
  // la primera ya invalidó, causando un 401 falso.
  const yaIntentado = useRef(false)

  useEffect(() => {
    if (yaIntentado.current) return
    yaIntentado.current = true

    // Al cargar la app (o recargar la página), el access token en
    // memoria se perdió a propósito. Intentamos renovarlo usando la
    // cookie httpOnly del refresh -- si el backend la acepta, el
    // usuario sigue logueado sin escribir su contraseña otra vez.
    api
      .post('auth/refresh/', {})
      .then((res) => {
        setAccessToken(res.data.access)
        setAutenticado(true)
      })
      .catch(() => {
        setAutenticado(false)
      })
  }, [])

  const iniciarSesion = () => setAutenticado(true)

  const cerrarSesion = () => {
    clearAccessToken()
    setAutenticado(false)
  }

  return (
    <AuthContext.Provider value={{ autenticado, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}