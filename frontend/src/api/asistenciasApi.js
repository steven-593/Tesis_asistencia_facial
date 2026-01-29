import api from './axiosConfig';

/**
 * OBTENER ASISTENCIAS
 */

// Obtener todas las asistencias
export const obtenerAsistencias = async () => {
  try {
    const response = await api.get('/asistencias.php?accion=listar');
    return response.data;
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    return {
      exito: false,
      mensaje: error.response?.data?.mensaje || 'Error al obtener asistencias',
      datos: []
    };
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
    return {
      exito: false,
      mensaje: error.response?.data?.mensaje || 'Error al obtener asistencias',
      datos: []
    };
  }
};

// Obtener asistencias por estudiante CON FILTROS
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
    return {
      exito: false,
      mensaje: error.response?.data?.mensaje || 'Error al obtener asistencias',
      datos: []
    };
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
    return {
      exito: false,
      mensaje: error.response?.data?.mensaje || 'Error al obtener estadísticas',
      datos: {
        total_registros: 0,
        presentes: 0,
        ausentes: 0,
        porcentaje_asistencia: 0
      }
    };
  }
};

// Obtener próximas clases del estudiante
export const obtenerProximasClases = async (idEstudiante) => {
  try {
    const response = await api.get(`/asistencias.php?accion=proximas_clases&id_estudiante=${idEstudiante}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener próximas clases:', error);
    return {
      exito: false,
      mensaje: 'Error al obtener próximas clases',
      datos: []
    };
  }
};

// Obtener asistencias de hoy del estudiante
export const obtenerAsistenciasHoy = async (idEstudiante) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const response = await api.get(`/asistencias.php?accion=por_estudiante&id_estudiante=${idEstudiante}&fecha_inicio=${hoy}&fecha_fin=${hoy}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener asistencias de hoy:', error);
    return {
      exito: false,
      mensaje: 'Error al obtener asistencias de hoy',
      datos: []
    };
  }
};

/**
 * REGISTRAR ASISTENCIA
 */

export const registrarAsistencia = async (datos) => {
  try {
    const response = await api.post('/asistencias.php', datos);
    return response.data;
  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    return {
      exito: false,
      mensaje: error.response?.data?.mensaje || 'Error al registrar asistencia'
    };
  }
};

/**
 * ACTUALIZAR ASISTENCIA
 */

export const actualizarAsistencia = async (idAsistencia, estado) => {
  try {
    const response = await api.put('/asistencias.php', {
      id_asistencia: idAsistencia,
      estado
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar asistencia:', error);
    return {
      exito: false,
      mensaje: error.response?.data?.mensaje || 'Error al actualizar asistencia'
    };
  }
};

/**
 * ELIMINAR ASISTENCIA
 */

export const eliminarAsistencia = async (id) => {
  try {
    const response = await api.delete(`/asistencias.php?id=${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar asistencia:', error);
    return {
      exito: false,
      mensaje: error.response?.data?.mensaje || 'Error al eliminar asistencia'
    };
  }
};

/**
 * FUNCIONES ESPECIALES PARA DASHBOARD
 */

// Obtener datos completos del dashboard del estudiante
export const obtenerDatosEstudianteDashboard = async (idEstudiante) => {
  try {
    const [asistencias, estadisticas, proximasClases, asistenciasHoy] = await Promise.all([
      obtenerAsistenciasPorEstudiante(idEstudiante),
      obtenerEstadisticasEstudiante(idEstudiante),
      obtenerProximasClases(idEstudiante),
      obtenerAsistenciasHoy(idEstudiante)
    ]);

    return {
      exito: true,
      asistencias: asistencias.datos || [],
      estadisticas: estadisticas.datos || {},
      proximasClases: proximasClases.datos || [],
      asistenciasHoy: asistenciasHoy.datos || []
    };
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    return {
      exito: false,
      mensaje: 'Error al cargar los datos del dashboard',
      asistencias: [],
      estadisticas: {},
      proximasClases: [],
      asistenciasHoy: []
    };
  }
};