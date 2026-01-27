import api from './axiosConfig';

// Obtener todas las asistencias
export const obtenerAsistencias = async () => {
  try {
    const response = await api.get('/asistencias.php?accion=listar');
    return response.data;
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    throw error;
  }
};

// Obtener asistencias por materia
export const obtenerAsistenciasPorMateria = async (idMateria, fecha = null) => {
  try {
    let url = `/asistencias.php?accion=por_materia&id_materia=${idMateria}`;
    if (fecha) {
      url += `&fecha=${fecha}`;
    }
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error al obtener asistencias por materia:', error);
    throw error;
  }
};

// Obtener asistencias por estudiante
export const obtenerAsistenciasPorEstudiante = async (idEstudiante, fechaInicio = null, fechaFin = null) => {
  try {
    let url = `/asistencias.php?accion=por_estudiante&id_estudiante=${idEstudiante}`;
    if (fechaInicio && fechaFin) {
      url += `&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    }
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error al obtener asistencias por estudiante:', error);
    throw error;
  }
};

// Obtener estadísticas de asistencia de un estudiante
export const obtenerEstadisticasEstudiante = async (idEstudiante, idMateria = null) => {
  try {
    let url = `/asistencias.php?accion=estadisticas&id_estudiante=${idEstudiante}`;
    if (idMateria) {
      url += `&id_materia=${idMateria}`;
    }
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
};

// Registrar asistencia
export const registrarAsistencia = async (datos) => {
  try {
    const response = await api.post('/asistencias.php', {
      accion: 'registrar',
      ...datos
    });
    return response.data;
  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    throw error;
  }
};

// Actualizar asistencia (cambiar estado)
export const actualizarAsistencia = async (idAsistencia, estado) => {
  try {
    const response = await api.put('/asistencias.php', {
      accion: 'actualizar',
      id_asistencia: idAsistencia,
      estado
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar asistencia:', error);
    throw error;
  }
};

// Eliminar asistencia
export const eliminarAsistencia = async (id) => {
  try {
    const response = await api.delete(`/asistencias.php?accion=eliminar&id=${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar asistencia:', error);
    throw error;
  }
};