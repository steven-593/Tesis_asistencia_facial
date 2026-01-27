import { useState } from 'react';
import { obtenerUsuarios, crearUsuario } from '../../api/usuariosApi';

const TestUsuarios = () => {
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);

  const probarListar = async () => {
    try {
      setCargando(true);
      console.log('📋 Intentando listar usuarios...');
      
      const response = await obtenerUsuarios();
      
      console.log('✅ Respuesta recibida:', response);
      setResultado({
        tipo: 'exito',
        mensaje: 'Usuarios obtenidos correctamente',
        datos: response
      });
    } catch (error) {
      console.error('❌ Error al listar:', error);
      setResultado({
        tipo: 'error',
        mensaje: 'Error al listar usuarios',
        error: error.message,
        response: error.response?.data
      });
    } finally {
      setCargando(false);
    }
  };

  const probarCrear = async () => {
    try {
      setCargando(true);
      console.log('➕ Intentando crear usuario...');
      
      const nuevoUsuario = {
        nombres: 'Usuario',
        apellidos: 'Prueba Frontend',
        correo: 'frontend' + Date.now() + '@test.com',
        contrasena: 'password123',
        id_rol: 3,
        estado: 'Activo'
      };
      
      console.log('Datos a enviar:', nuevoUsuario);
      
      const response = await crearUsuario(nuevoUsuario);
      
      console.log('✅ Respuesta recibida:', response);
      setResultado({
        tipo: 'exito',
        mensaje: 'Usuario creado correctamente',
        datos: response
      });
    } catch (error) {
      console.error('❌ Error al crear:', error);
      setResultado({
        tipo: 'error',
        mensaje: 'Error al crear usuario',
        error: error.message,
        response: error.response?.data
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Test de Usuarios (Frontend)</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={probarListar}
          disabled={cargando}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: cargando ? 'not-allowed' : 'pointer'
          }}
        >
          {cargando ? 'Cargando...' : '📋 Probar Listar Usuarios'}
        </button>
        
        <button 
          onClick={probarCrear}
          disabled={cargando}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: cargando ? 'not-allowed' : 'pointer'
          }}
        >
          {cargando ? 'Cargando...' : '➕ Probar Crear Usuario'}
        </button>
      </div>

      {resultado && (
        <div style={{
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: resultado.tipo === 'exito' ? '#d4edda' : '#f8d7da',
          border: `1px solid ${resultado.tipo === 'exito' ? '#c3e6cb' : '#f5c6cb'}`,
          marginTop: '20px'
        }}>
          <h3 style={{ 
            color: resultado.tipo === 'exito' ? '#155724' : '#721c24',
            marginTop: 0 
          }}>
            {resultado.tipo === 'exito' ? '✅ Éxito' : '❌ Error'}
          </h3>
          <p><strong>Mensaje:</strong> {resultado.mensaje}</p>
          {resultado.error && <p><strong>Error:</strong> {resultado.error}</p>}
          <pre style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '5px',
            overflow: 'auto',
            maxHeight: '400px'
          }}>
            {JSON.stringify(resultado.datos || resultado.response, null, 2)}
          </pre>
        </div>
      )}

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '5px'
      }}>
        <h4 style={{ marginTop: 0 }}>📝 Instrucciones:</h4>
        <ol>
          <li>Abre la consola del navegador (F12)</li>
          <li>Haz clic en "Probar Listar Usuarios"</li>
          <li>Observa tanto el resultado en pantalla como en la consola</li>
          <li>Si funciona, prueba "Crear Usuario"</li>
        </ol>
        <p><strong>Nota:</strong> Los mensajes de log aparecerán en la consola del navegador.</p>
      </div>
    </div>
  );
};

export default TestUsuarios;