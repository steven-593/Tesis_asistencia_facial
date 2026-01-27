import api from './axiosConfig';

// Obtener todos los docentes
export const obtenerDocentes = async () => {
  try {
    const response = await api.get('/docentes.php?accion=listar');
    return response.data;
  } catch (error) {
    console.error('Error al obtener docentes:', error);
    throw error;
  }
};

// Obtener un docente por ID
export const obtenerDocentePorId = async (id) => {
  try {
    const response = await api.get(`/docentes.php?accion=obtener&id=${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener docente:', error);
    throw error;
  }
};

// Crear un nuevo docente
export const crearDocente = async (datos) => {
  try {
    const response = await api.post('/docentes.php', {
      accion: 'crear',
      ...datos
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear docente:', error);
    throw error;
  }
};

// Actualizar un docente
export const actualizarDocente = async (id, datos) => {
  try {
    const response = await api.put('/docentes.php', {
      accion: 'actualizar',
      id_docente: id,
      ...datos
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar docente:', error);
    throw error;
  }
};

// Eliminar un docente
export const eliminarDocente = async (id) => {
  try {
    const response = await api.delete(`/docentes.php?accion=eliminar&id=${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar docente:', error);
    throw error;
  }
};

// Obtener usuarios sin asignar (para crear docentes)
export const obtenerUsuariosSinAsignar = async () => {
  try {
    const response = await api.get('/docentes.php?accion=usuarios_disponibles');
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};