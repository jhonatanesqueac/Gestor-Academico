import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

function RutaProtegida({ children }) {
  const { autenticado } = useAuth()

  if (autenticado === null) {
    // Todavía esperando la respuesta del silent refresh inicial --
    // sin esto, se vería un parpadeo hacia /login antes de confirmar
    // si la sesión sigue viva.
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '13px' }}>Cargando...</p>
      </div>
    )
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default RutaProtegida