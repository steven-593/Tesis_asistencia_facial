import api from './axiosConfig';

// Obtener todos los estudiantes
export const obtenerEstudiantes = async (idUsuario = null) => {
  try {
    let url = '/estudiantes.php?accion=listar';
    if (idUsuario) {
      url += `&id_usuario=${idUsuario}`;
    }
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    throw error;
  }
};

// Obtener un estudiante por ID
export const obtenerEstudiantePorId = async (id) => {
  try {
    const response = await api.get(`/estudiantes.php?accion=obtener&id=${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener estudiante:', error);
    throw error;
  }
};

// Crear un nuevo estudiante
export const crearEstudiante = async (datos) => {
  try {
    const response = await api.post('/estudiantes.php', {
      accion: 'crear',
      ...datos
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear estudiante:', error);
    throw error;
  }
};

// Actualizar un estudiante
export const actualizarEstudiante = async (id, datos) => {
  try {
    const response = await api.put('/estudiantes.php', {
      accion: 'actualizar',
      id_estudiante: id,
      ...datos
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar estudiante:', error);
    throw error;
  }
};

// Eliminar un estudiante
export const eliminarEstudiante = async (id) => {
  try {
    const response = await api.delete(`/estudiantes.php?accion=eliminar&id=${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar estudiante:', error);
    throw error;
  }
};

// Obtener usuarios sin asignar (para crear estudiantes)
export const obtenerUsuariosSinAsignar = async () => {
  try {
    const response = await api.get('/estudiantes.php?accion=usuarios_disponibles');
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};