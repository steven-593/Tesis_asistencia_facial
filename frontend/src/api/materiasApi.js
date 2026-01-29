import api from './axiosConfig';

/**
 * Obtener todas las materias
 * El PHP filtrará automáticamente si es Docente o Admin
 */
export const obtenerMaterias = async () => {
  try {
    const response = await api.get('/materias.php?accion=listar');
    return response.data;
  } catch (error) {
    console.error('Error al obtener materias:', error);
    return { exito: false, mensaje: 'Error de conexión', datos: [] };
  }
};

/**
 * Obtener una materia por ID
 */
export const obtenerMateriaPorId = async (id) => {
  try {
    const response = await api.get(`/materias.php?accion=obtener&id=${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener materia:', error);
    return { exito: false, mensaje: 'Error de conexión' };
  }
};

/**
 * Crear una nueva materia
 * Importante: 'datos' debe incluir { nombre_materia, carrera, id_horario, id_docente }
 */
export const crearMateria = async (datos) => {
  try {
    const response = await api.post('/materias.php', datos);
    return response.data;
  } catch (error) {
    console.error('Error al crear materia:', error);
    return { exito: false, mensaje: 'Error de conexión al crear' };
  }
};

/**
 * Actualizar una materia
 * Combina el ID con los datos del formulario para enviarlos al PHP
 */
export const actualizarMateria = async (id, datos) => {
  try {
    // Aseguramos que el ID vaya dentro del cuerpo del JSON para el PUT
    const payload = {
      ...datos,
      id_materia: id
    };
    
    const response = await api.put('/materias.php', payload);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar materia:', error);
    return { exito: false, mensaje: 'Error de conexión al actualizar' };
  }
};

/**
 * Eliminar una materia
 */
export const eliminarMateria = async (id) => {
  try {
    const response = await api.delete(`/materias.php?id=${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar materia:', error);
    return { exito: false, mensaje: 'Error de conexión al eliminar' };
  }
};