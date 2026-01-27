import api from './axiosConfig';

// Obtener todas las matrículas
export const obtenerMatriculas = async () => {
  try {
    const response = await api.get('/matriculas.php?accion=listar');
    return response.data;
  } catch (error) {
    console.error('Error al obtener matrículas:', error);
    throw error;
  }
};

// Obtener una matrícula por ID
export const obtenerMatriculaPorId = async (id) => {
  try {
    const response = await api.get(`/matriculas.php?accion=obtener&id=${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener matrícula:', error);
    throw error;
  }
};

// Crear una nueva matrícula
export const crearMatricula = async (datos) => {
  try {
    const response = await api.post('/matriculas.php', {
      accion: 'crear',
      ...datos
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear matrícula:', error);
    throw error;
  }
};

// Actualizar una matrícula
export const actualizarMatricula = async (id, datos) => {
  try {
    const response = await api.put('/matriculas.php', {
      accion: 'actualizar',
      id_matricula: id,
      ...datos
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar matrícula:', error);
    throw error;
  }
};

// Eliminar una matrícula
export const eliminarMatricula = async (id) => {
  try {
    const response = await api.delete(`/matriculas.php?accion=eliminar&id=${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar matrícula:', error);
    throw error;
  }
};

// Obtener matrículas por estudiante
export const obtenerMatriculasPorEstudiante = async (idEstudiante) => {
  try {
    const response = await api.get(`/matriculas.php?accion=por_estudiante&id_estudiante=${idEstudiante}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener matrículas del estudiante:', error);
    throw error;
  }
};