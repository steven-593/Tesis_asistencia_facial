import api from './axiosConfig';

// Obtener todos los usuarios
export const obtenerUsuarios = async () => {
  try {
    // Tu PHP usa $_GET['accion'], así que lo pasamos por URL
    const response = await api.get('/usuarios.php?accion=listar');
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};

// Obtener un usuario por ID
export const obtenerUsuarioPorId = async (id) => {
  try {
    const response = await api.get(`/usuarios.php?accion=obtener&id=${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    throw error;
  }
};

// Crear un nuevo usuario
export const crearUsuario = async (datos) => {
  try {
    // Tu PHP ya tiene una función crearUsuario() que se dispara con POST
    const response = await api.post('/usuarios.php', datos);
    return response.data;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
};

// Actualizar un usuario
export const actualizarUsuario = async (id, datos) => {
  try {
    // Enviamos id_usuario dentro del body porque tu PHP lo extrae de json_decode
    const response = await api.put('/usuarios.php', {
      id_usuario: id,
      ...datos
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
};

// Eliminar un usuario
export const eliminarUsuario = async (id) => {
  try {
    // Tu PHP usa $_GET['id'] en la función eliminarUsuario()
    const response = await api.delete(`/usuarios.php?id=${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
};

// Cambiar estado de un usuario
export const cambiarEstadoUsuario = async (id, estado) => {
  try {
    // Usamos PUT porque es una actualización parcial
    const response = await api.put('/usuarios.php', {
      id_usuario: id,
      estado: estado
    });
    return response.data;
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    throw error;
  }
};