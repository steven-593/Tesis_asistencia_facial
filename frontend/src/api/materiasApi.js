// 

import api from './axiosConfig';

// Obtener todas las materias
export const obtenerMaterias = async () => {
  try {
    const response = await api.get('/materias.php?accion=listar');
    return response.data;
  } catch (error) {
    console.error('Error al obtener materias:', error);
    throw error;
  }
};

// Obtener una materia por ID
export const obtenerMateriaPorId = async (id) => {
  try {
    const response = await api.get(`/materias.php?accion=obtener&id=${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener materia:', error);
    throw error;
  }
};

// Crear una nueva materia
export const crearMateria = async (datos) => {
  try {
    // Enviamos los datos directos para que PHP los reciba correctamente
    const response = await api.post('/materias.php', datos);
    return response.data;
  } catch (error) {
    console.error('Error al crear materia:', error);
    throw error;
  }
};

// Actualizar una materia
export const actualizarMateria = async (id, datos) => {
  try {
    const response = await api.put('/materias.php', {
      id_materia: id,
      ...datos
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar materia:', error);
    throw error;
  }
};

// Eliminar una materia
export const eliminarMateria = async (id) => {
  try {
    const response = await api.delete(`/materias.php?id=${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar materia:', error);
    throw error;
  }
};