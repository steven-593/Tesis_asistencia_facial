import { createContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Verificar si hay un usuario en localStorage al cargar la app
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    
    if (usuarioGuardado && token) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
    setCargando(false);
  }, []);

  // Función de login
  const login = async (correo, contrasena) => {
    try {
      const response = await api.post('/auth.php', {
        accion: 'login',
        correo,
        contrasena,
      });

      if (response.data.exito) {
        const { token, usuario: usuarioData } = response.data.datos;
        
        // Guardar en localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(usuarioData));
        
        // Actualizar estado
        setUsuario(usuarioData);
        
        return { exito: true };
      } else {
        return { exito: false, mensaje: response.data.mensaje };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { 
        exito: false, 
        mensaje: error.response?.data?.mensaje || 'Error al conectar con el servidor' 
      };
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      await api.post('/auth.php', { accion: 'logout' });
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar localStorage y estado
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      setUsuario(null);
    }
  };

  // Verificar si el usuario tiene un rol específico
  const tieneRol = (rol) => {
    return usuario?.nombre_rol === rol;
  };

  const value = {
    usuario,
    login,
    logout,
    tieneRol,
    estaAutenticado: !!usuario,
    cargando,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};