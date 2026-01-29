import api from './axiosConfig';

export const descargarReporteAsistencias = async (fechaInicio, fechaFin) => {
  try {
    // Construir Query Params
    let params = '';
    if (fechaInicio && fechaFin) {
      params = `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    }

    const response = await api.get(`/reportes.php${params}`, {
      responseType: 'blob', // IMPORTANTE: Indicar que esperamos un archivo
    });

    // Crear un link temporal para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Nombre del archivo
    const fecha = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `reporte_asistencias_${fecha}.csv`);
    
    document.body.appendChild(link);
    link.click();
    
    // Limpieza
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { exito: true, mensaje: 'Reporte descargado correctamente' };
  } catch (error) {
    console.error('Error al descargar reporte:', error);
    return { exito: false, mensaje: 'Error al generar el reporte' };
  }
};