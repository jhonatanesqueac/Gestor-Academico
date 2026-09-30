import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'
import OlvidePassword from './pages/OlvidePassword'
import RestablecerPassword from './pages/RestablecerPassword'
import RutaProtegida from './components/RutaProtegida'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/olvide-password" element={<OlvidePassword />} />
        <Route path="/restablecer-password/:uidb64/:token" element={<RestablecerPassword />} />
        <Route
          path="/dashboard"
          element={
            <RutaProtegida>
              <Dashboard />
            </RutaProtegida>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </AuthProvider>
  )
}

export default App