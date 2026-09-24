import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
})

// Antes de CADA petición, agrega el access token al header Authorization.
//
// ⚠️ Los tokens viven en localStorage, lo cual es vulnerable a XSS.
// Mientras no uses dangerouslySetInnerHTML ni libs de terceros sin
// auditar, el riesgo es bajo. Si el proyecto crece, migrar a cookie
// httpOnly manejada por el backend es más seguro.
api.interceptors.request.use((config) => {
  const access = localStorage.getItem('access')
  if (access) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

// Si una petición falla con 401 (access token vencido), intenta
// renovarlo UNA vez usando el refresh token, y reintenta la petición
// original. Si el refresh también falla (venció o es inválido),
// manda al usuario de vuelta al login.
let renovando = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh')

      if (!refresh) {
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        // Evita disparar varias renovaciones en paralelo si llegan
        // varias peticiones 401 casi al mismo tiempo.
        if (!renovando) {
          renovando = axios
            .post('http://127.0.0.1:8000/api/auth/refresh/', { refresh })
            .then((res) => {
              localStorage.setItem('access', res.data.access)
              if (res.data.refresh) {
                localStorage.setItem('refresh', res.data.refresh)
              }
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
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        window.location.href = '/login'
        return Promise.reject(errorRenovacion)
      }
    }

    return Promise.reject(error)
  }
)

export default api