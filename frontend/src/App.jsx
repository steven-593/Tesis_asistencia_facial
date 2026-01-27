import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RutaPrivada, RutaPorRol } from './rutas/RutasProtegidas';

// Componentes de autenticación
import Login from './componentes/auth/Login';
import NoAutorizado from './componentes/comunes/NoAutorizado';

// Dashboards
import DashboardAdmin from './componentes/administrador/DashboardAdmin';
import DashboardDocente from './componentes/docente/DashboardDocente';
import DashboardEstudiante from './componentes/estudiante/DashboardEstudiante';

// Módulos de Administrador
import Usuarios from './componentes/administrador/Usuarios';
import Estudiantes from './componentes/administrador/Estudiantes';
import Docentes from './componentes/administrador/Docentes';
import Horarios from './componentes/administrador/Horarios';
import Materias from './componentes/administrador/Materias';
import Matriculas from './componentes/administrador/Matriculas';

// Módulos de Docente
import TomarAsistencia from './componentes/docente/TomarAsistencia';

// Módulos de Estudiante
import MisAsistencias from './componentes/estudiante/MisAsistencias';

// Componente de prueba temporal
import TestUsuarios from './componentes/administrador/TestUsuarios';

// Importar estilos globales
import './estilos/general.css';

// Componente para redirigir al dashboard según el rol
const DashboardRedirect = () => {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  
  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  switch (usuario.nombre_rol) {
    case 'Administrador':
      return <DashboardAdmin />;
    case 'Docente':
      return <DashboardDocente />;
    case 'Estudiante':
      return <DashboardEstudiante />;
    default:
      return <Navigate to="/" replace />;
  }
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Ruta pública - Login */}
          <Route path="/" element={<Login />} />
          
          {/* Ruta de no autorizado */}
          <Route path="/no-autorizado" element={<NoAutorizado />} />
          
          {/* Dashboard principal (redirige según rol) */}
          <Route 
            path="/dashboard" 
            element={
              <RutaPrivada>
                <DashboardRedirect />
              </RutaPrivada>
            } 
          />

          {/* ========== RUTAS DEL ADMINISTRADOR ========== */}
          <Route 
            path="/admin/*" 
            element={
              <RutaPorRol rolesPermitidos={['Administrador']}>
                <Routes>
                  <Route path="test-usuarios" element={<TestUsuarios />} />
                  <Route path="usuarios" element={<Usuarios />} />
                  <Route path="estudiantes" element={<Estudiantes />} />
                  <Route path="docentes" element={<Docentes />} />
                  <Route path="horarios" element={<Horarios />} />
                  <Route path="materias" element={<Materias />} />
                  <Route path="matriculas" element={<Matriculas />} />
                  <Route path="reportes" element={<div>Módulo de Reportes (próximamente)</div>} />
                </Routes>
              </RutaPorRol>
            } 
          />

          {/* ========== RUTAS DEL DOCENTE ========== */}
          <Route 
            path="/docente/*" 
            element={
              <RutaPorRol rolesPermitidos={['Docente']}>
                <Routes>
                  <Route path="asistencias" element={<TomarAsistencia />} />
                  <Route path="materias" element={<div>Mis Materias (próximamente)</div>} />
                  <Route path="horarios" element={<div>Mis Horarios (próximamente)</div>} />
                </Routes>
              </RutaPorRol>
            } 
          />

          {/* ========== RUTAS DEL ESTUDIANTE ========== */}
          <Route 
            path="/estudiante/*" 
            element={
              <RutaPorRol rolesPermitidos={['Estudiante']}>
                <Routes>
                  <Route path="asistencias" element={<MisAsistencias />} />
                  <Route path="materias" element={<div>Mis Materias (próximamente)</div>} />
                  <Route path="horarios" element={<div>Mis Horarios (próximamente)</div>} />
                  <Route path="registro-facial" element={<div>Registro Facial (próximamente)</div>} />
                </Routes>
              </RutaPorRol>
            } 
          />

          {/* Ruta 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;