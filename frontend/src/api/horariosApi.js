import api from './axiosConfig';

// Obtener todos los horarios
export const obtenerHorarios = async () => {
  try {
    const response = await api.get('/horarios.php?accion=listar');
    return response.data;
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    throw error;
  }
};

// Obtener un horario por ID
export const obtenerHorarioPorId = async (id) => {
  try {
    const response = await api.get(`/horarios.php?accion=obtener&id=${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener horario:', error);
    throw error;
  }
};

// Crear un nuevo horario
export const crearHorario = async (datos) => {
  try {
    const response = await api.post('/horarios.php', {
      accion: 'crear',
      ...datos
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear horario:', error);
    throw error;
  }
};

// Actualizar un horario
export const actualizarHorario = async (id, datos) => {
  try {
    const response = await api.put('/horarios.php', {
      accion: 'actualizar',
      id_horario: id,
      ...datos
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar horario:', error);
    throw error;
  }
};

// Eliminar un horario
export const eliminarHorario = async (id) => {
  try {
    const response = await api.delete(`/horarios.php?accion=eliminar&id=${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    throw error;
  }
};