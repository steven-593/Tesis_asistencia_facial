import api from './axiosConfig';

export const registrarRostro = async (datos) => {
  try {
    const response = await api.post('/rostros.php', datos);
    return response.data;
  } catch (error) {
    console.error('Error al registrar rostro:', error);
    return { exito: false, mensaje: error.message };
  }
};

export const obtenerTodosLosRostros = async () => {
  try {
    const response = await api.get('/rostros.php'); // Método GET llama a obtenerRostros
    return response.data;
  } catch (error) {
    console.error('Error al obtener rostros:', error);
    return { exito: false, mensaje: error.message, datos: [] };
  }
};