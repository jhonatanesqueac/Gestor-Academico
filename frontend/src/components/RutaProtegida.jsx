import { Navigate } from 'react-router-dom'

function RutaProtegida({ children }) {
  const token = localStorage.getItem('access')

  if (!token) {
    // No hay token -> no hay sesión -> lo mandamos al login
    return <Navigate to="/login" replace />
  }

  return children
}

export default RutaProtegida