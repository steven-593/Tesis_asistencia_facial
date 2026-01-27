// import axios from 'axios';

// // URL base de tu backend
// const BASE_URL = 'http://localhost/sistema-asistencia-facial/backend';

// // Crear instancia de axios con configuración base
// const api = axios.create({
//   baseURL: BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   timeout: 30000, // 30 segundos
// });

// // Interceptor para agregar el token en cada petición
// api.interceptors.request.use(
//   (config) => {
//     console.log('🚀 Petición:', config.method?.toUpperCase(), config.baseURL + config.url);
//     console.log('📦 Datos:', config.data);
    
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//       console.log('🔑 Token agregado');
//     }
//     return config;
//   },
//   (error) => {
//     console.error('❌ Error en interceptor request:', error);
//     return Promise.reject(error);
//   }
// );

// // Interceptor para manejar respuestas y errores
// api.interceptors.response.use(
//   (response) => {
//     console.log('✅ Respuesta exitosa:', response.data);
//     return response;
//   },
//   (error) => {
//     console.error('❌ Error en la respuesta:', error);
    
//     if (error.code === 'ECONNABORTED') {
//       console.error('⏱️ Timeout: El servidor tardó demasiado');
//       alert('El servidor está tardando mucho en responder. Verifica tu conexión.');
//     }
    
//     if (error.code === 'ERR_NETWORK') {
//       console.error('🌐 Error de red');
//       console.error('URL Base:', BASE_URL);
//       console.error('Verifica que Apache esté corriendo en XAMPP');
//       alert('Error de conexión. Verifica que Apache esté corriendo.');
//     }
    
//     if (error.response) {
//       console.error('📋 Status:', error.response.status);
//       console.error('📋 Datos:', error.response.data);
      
//       // Si el token expiró, redirigir al login
//       if (error.response.status === 401) {
//         console.log('🔐 Token expirado, redirigiendo al login...');
//         localStorage.removeItem('token');
//         localStorage.removeItem('usuario');
//         window.location.href = '/';
//       }
      
//       // Si es error 403 (sin permisos)
//       if (error.response.status === 403) {
//         console.error('🚫 Sin permisos para esta acción');
//         alert('No tienes permisos para realizar esta acción');
//       }
      
//       // Si es error 500 (error del servidor)
//       if (error.response.status === 500) {
//         console.error('💥 Error del servidor');
//         console.error('Mensaje:', error.response.data?.mensaje);
//         alert('Error en el servidor: ' + (error.response.data?.mensaje || 'Error desconocido'));
//       }
//     } else if (error.request) {
//       console.error('📭 No se recibió respuesta del servidor');
//       console.error('Request completo:', error.request);
//       alert('No se pudo conectar con el servidor. Verifica que Apache esté corriendo.');
//     } else {
//       console.error('⚙️ Error al configurar la petición:', error.message);
//     }
    
//     return Promise.reject(error);
//   }
// );

// export default api;
// export { BASE_URL };

import axios from 'axios';

const BASE_URL = 'http://localhost/sistema-asistencia-facial/backend';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Usamos la clave estándar 'Authorization'
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      console.error('Acceso denegado: El rol del usuario no tiene permisos en este PHP.');
    }
    return Promise.reject(error);
  }
);

export default api;