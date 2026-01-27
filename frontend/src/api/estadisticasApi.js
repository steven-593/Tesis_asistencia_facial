import api from './axiosConfig';

// Obtener estadísticas generales
export const obtenerEstadisticasGenerales = async () => {
  try {
    const response = await api.get('/estadisticas.php?accion=generales');
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas generales:', error);
    throw error;
  }
};

// Obtener asistencias de hoy
export const obtenerAsistenciasHoy = async () => {
  try {
    const response = await api.get('/estadisticas.php?accion=asistencias_hoy');
    return response.data;
  } catch (error) {
    console.error('Error al obtener asistencias de hoy:', error);
    throw error;
  }
};

// Obtener asistencias del mes
export const obtenerAsistenciasMes = async () => {
  try {
    const response = await api.get('/estadisticas.php?accion=asistencias_mes');
    return response.data;
  } catch (error) {
    console.error('Error al obtener asistencias del mes:', error);
    throw error;
  }
};

// Obtener estadísticas por materia
export const obtenerEstadisticasPorMateria = async () => {
  try {
    const response = await api.get('/estadisticas.php?accion=por_materia');
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas por materia:', error);
    throw error;
  }
};

// Obtener estadísticas del docente
export const obtenerEstadisticasDocente = async () => {
  try {
    const response = await api.get('/estadisticas.php?accion=docente');
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas del docente:', error);
    throw error;
  }
};