import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Cargando from '../componentes/comunes/Cargando';

// Componente para proteger rutas que requieren autenticación
export const RutaPrivada = ({ children }) => {
  const { estaAutenticado, cargando } = useAuth();

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Cargando mensaje="Verificando autenticación..." />
      </div>
    );
  }

  return estaAutenticado ? children : <Navigate to="/" replace />;
};

// Componente para proteger rutas según el rol
export const RutaPorRol = ({ children, rolesPermitidos }) => {
  const { usuario, estaAutenticado, cargando } = useAuth();

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Cargando mensaje="Verificando permisos..." />
      </div>
    );
  }

  if (!estaAutenticado) {
    return <Navigate to="/" replace />;
  }

  const tienePermiso = rolesPermitidos.includes(usuario?.nombre_rol);

  if (!tienePermiso) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return children;
};