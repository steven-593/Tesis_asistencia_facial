<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Prueba CRUD Usuarios</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
        .success { color: green; }
        .error { color: red; }
        button { 
            padding: 10px 20px; 
            margin: 5px; 
            cursor: pointer;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
        }
        pre { 
            background: #f4f4f4; 
            padding: 15px; 
            border-radius: 5px;
            overflow-x: auto;
            max-height: 500px;
        }
        .panel {
            border: 1px solid #ddd;
            padding: 20px;
            margin: 10px 0;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <h1>🧪 Prueba del CRUD de Usuarios</h1>

    <div class="panel">
        <h2>Paso 1: Hacer Login</h2>
        <button onclick="hacerLogin()">🔐 Login como Admin</button>
        <div id="loginResult"></div>
    </div>

    <div class="panel">
        <h2>Paso 2: Listar Usuarios</h2>
        <button onclick="listarUsuarios()">📋 Listar Usuarios</button>
        <div id="listarResult"></div>
    </div>

    <div class="panel">
        <h2>Paso 3: Crear Usuario</h2>
        <button onclick="crearUsuario()">➕ Crear Usuario de Prueba</button>
        <div id="crearResult"></div>
    </div>

    <div class="panel">
        <h2>Paso 4: Actualizar Usuario</h2>
        <input type="number" id="idActualizar" placeholder="ID del usuario">
        <button onclick="actualizarUsuario()">✏️ Actualizar Usuario</button>
        <div id="actualizarResult"></div>
    </div>

    <div class="panel">
        <h2>Paso 5: Eliminar Usuario</h2>
        <input type="number" id="idEliminar" placeholder="ID del usuario">
        <button onclick="eliminarUsuario()">🗑️ Eliminar Usuario</button>
        <div id="eliminarResult"></div>
    </div>

    <script>
        const baseURL = 'http://localhost/sistema-asistencia-facial/backend';
        let token = '';

        function mostrarResultado(elementId, titulo, data, exito = true) {
            const elemento = document.getElementById(elementId);
            const clase = exito ? 'success' : 'error';
            elemento.innerHTML = `
                <h3 class="${clase}">${titulo}</h3>
                <pre>${JSON.stringify(data, null, 2)}</pre>
            `;
        }

        async function hacerLogin() {
            console.log('🔐 Intentando login...');
            
            try {
                const response = await fetch(`${baseURL}/auth.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        accion: 'login',
                        correo: 'admin@sistema.com',
                        contrasena: 'password'
                    })
                });

                const data = await response.json();
                console.log('Respuesta login:', data);

                if (data.exito) {
                    token = data.datos.token;
                    console.log('Token guardado:', token.substring(0, 50) + '...');
                    mostrarResultado('loginResult', '✅ Login Exitoso', {
                        mensaje: data.mensaje,
                        usuario: data.datos.usuario,
                        token: token.substring(0, 50) + '...'
                    }, true);
                } else {
                    mostrarResultado('loginResult', '❌ Login Fallido', data, false);
                }
            } catch (error) {
                console.error('Error en login:', error);
                mostrarResultado('loginResult', '❌ Error de Conexión', {
                    mensaje: error.message,
                    url: `${baseURL}/auth.php`
                }, false);
            }
        }

        async function listarUsuarios() {
            if (!token) {
                alert('⚠️ Primero debes hacer login');
                return;
            }

            console.log('📋 Listando usuarios...');
            console.log('Token:', token.substring(0, 50) + '...');

            try {
                const url = `${baseURL}/usuarios.php?accion=listar`;
                console.log('URL:', url);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });

                console.log('Status:', response.status);
                console.log('Headers:', [...response.headers.entries()]);

                const data = await response.json();
                console.log('Respuesta:', data);

                if (data.exito) {
                    mostrarResultado('listarResult', '✅ Usuarios Obtenidos', {
                        total: data.datos.length,
                        usuarios: data.datos
                    }, true);
                } else {
                    mostrarResultado('listarResult', '❌ Error al Listar', data, false);
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarResultado('listarResult', '❌ Error de Conexión', {
                    mensaje: error.message,
                    url: `${baseURL}/usuarios.php`
                }, false);
            }
        }

        async function crearUsuario() {
            if (!token) {
                alert('⚠️ Primero debes hacer login');
                return;
            }

            console.log('➕ Creando usuario...');

            const nuevoUsuario = {
                accion: 'crear',
                nombres: 'Usuario',
                apellidos: 'Prueba',
                correo: 'prueba' + Date.now() + '@test.com',
                contrasena: 'password123',
                id_rol: 3, // Estudiante
                estado: 'Activo'
            };

            console.log('Datos a enviar:', nuevoUsuario);

            try {
                const response = await fetch(`${baseURL}/usuarios.php`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(nuevoUsuario)
                });

                const data = await response.json();
                console.log('Respuesta:', data);

                if (data.exito) {
                    mostrarResultado('crearResult', '✅ Usuario Creado', {
                        mensaje: data.mensaje,
                        id_usuario: data.datos?.id_usuario,
                        datos_enviados: nuevoUsuario
                    }, true);
                } else {
                    mostrarResultado('crearResult', '❌ Error al Crear', data, false);
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarResultado('crearResult', '❌ Error de Conexión', {
                    mensaje: error.message
                }, false);
            }
        }

        async function actualizarUsuario() {
            if (!token) {
                alert('⚠️ Primero debes hacer login');
                return;
            }

            const id = document.getElementById('idActualizar').value;
            if (!id) {
                alert('⚠️ Debes ingresar un ID de usuario');
                return;
            }

            console.log('✏️ Actualizando usuario...');

            const datosActualizar = {
                accion: 'actualizar',
                id_usuario: parseInt(id),
                nombres: 'Usuario',
                apellidos: 'Actualizado',
                correo: 'actualizado' + Date.now() + '@test.com',
                id_rol: 3,
                estado: 'Activo'
            };

            console.log('Datos a enviar:', datosActualizar);

            try {
                const response = await fetch(`${baseURL}/usuarios.php`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(datosActualizar)
                });

                const data = await response.json();
                console.log('Respuesta:', data);

                mostrarResultado('actualizarResult', 
                    data.exito ? '✅ Usuario Actualizado' : '❌ Error al Actualizar', 
                    data, 
                    data.exito
                );
            } catch (error) {
                console.error('Error:', error);
                mostrarResultado('actualizarResult', '❌ Error de Conexión', {
                    mensaje: error.message
                }, false);
            }
        }

        async function eliminarUsuario() {
            if (!token) {
                alert('⚠️ Primero debes hacer login');
                return;
            }

            const id = document.getElementById('idEliminar').value;
            if (!id) {
                alert('⚠️ Debes ingresar un ID de usuario');
                return;
            }

            if (!confirm('¿Estás seguro de eliminar este usuario?')) {
                return;
            }

            console.log('🗑️ Eliminando usuario...');

            try {
                const response = await fetch(`${baseURL}/usuarios.php?accion=eliminar&id=${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();
                console.log('Respuesta:', data);

                mostrarResultado('eliminarResult', 
                    data.exito ? '✅ Usuario Eliminado' : '❌ Error al Eliminar', 
                    data, 
                    data.exito
                );
            } catch (error) {
                console.error('Error:', error);
                mostrarResultado('eliminarResult', '❌ Error de Conexión', {
                    mensaje: error.message
                }, false);
            }
        }
    </script>

    <div class="panel">
        <h2>📝 Instrucciones</h2>
        <ol>
            <li>Primero haz clic en "Login como Admin"</li>
            <li>Luego prueba "Listar Usuarios"</li>
            <li>Si funciona, prueba "Crear Usuario de Prueba"</li>
            <li>Anota el ID que se crea y prueba Actualizar/Eliminar</li>
        </ol>
        <p><strong>Nota:</strong> Abre la consola del navegador (F12) para ver más detalles de las peticiones.</p>
    </div>
</body>
</html>