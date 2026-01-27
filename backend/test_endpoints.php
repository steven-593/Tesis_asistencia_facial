<?php
/**
 * Prueba completa de todos los endpoints
 */
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Prueba de Endpoints</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .endpoint { 
            border: 1px solid #ccc; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 5px;
        }
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
            padding: 10px; 
            border-radius: 5px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <h1>🔍 Prueba de Endpoints del Sistema</h1>
    
    <div class="endpoint">
        <h2>1️⃣ Información del Sistema</h2>
        <p><strong>URL Base:</strong> <?php echo 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']); ?></p>
        <p><strong>Versión PHP:</strong> <?php echo phpversion(); ?></p>
        <p><strong>Fecha/Hora:</strong> <?php echo date('Y-m-d H:i:s'); ?></p>
    </div>

    <div class="endpoint">
        <h2>2️⃣ Verificar Archivos</h2>
        <?php
        $archivos = [
            'auth.php' => 'Autenticación',
            'usuarios.php' => 'Usuarios',
            'estudiantes.php' => 'Estudiantes',
            'docentes.php' => 'Docentes',
            'horarios.php' => 'Horarios',
            'materias.php' => 'Materias',
            'matriculas.php' => 'Matrículas',
            'index.php' => 'Index',
            '.htaccess' => 'HTAccess',
            'config/base_datos.php' => 'Config BD',
            'config/jwt.php' => 'Config JWT',
            'helpers/respuestas.php' => 'Helper Respuestas',
            'helpers/seguridad.php' => 'Helper Seguridad',
        ];
        
        foreach ($archivos as $archivo => $nombre) {
            $existe = file_exists(__DIR__ . '/' . $archivo);
            $clase = $existe ? 'success' : 'error';
            $simbolo = $existe ? '✅' : '❌';
            echo "<p class='$clase'>$simbolo $nombre ($archivo)</p>";
        }
        ?>
    </div>

    <div class="endpoint">
        <h2>3️⃣ Conexión a Base de Datos</h2>
        <?php
        try {
            require_once __DIR__ . '/config/base_datos.php';
            $db = new BaseDatos();
            $conexion = $db->conectar();
            
            if ($conexion) {
                echo "<p class='success'>✅ Conexión exitosa a la base de datos</p>";
                
                // Contar registros
                $tablas = ['usuarios', 'estudiantes', 'docentes', 'horarios', 'materias', 'matriculas'];
                echo "<h4>Registros en las tablas:</h4>";
                foreach ($tablas as $tabla) {
                    $query = "SELECT COUNT(*) as total FROM $tabla";
                    $stmt = $conexion->prepare($query);
                    $stmt->execute();
                    $resultado = $stmt->fetch();
                    echo "<p>📊 $tabla: {$resultado['total']} registros</p>";
                }
            } else {
                echo "<p class='error'>❌ Error al conectar con la base de datos</p>";
            }
        } catch (Exception $e) {
            echo "<p class='error'>❌ Error: " . $e->getMessage() . "</p>";
        }
        ?>
    </div>

    <div class="endpoint">
        <h2>4️⃣ Pruebas de Endpoints con JavaScript</h2>
        <p>Haz clic en los botones para probar cada endpoint:</p>
        
        <button onclick="probarLogin()">🔐 Probar Login</button>
        <button onclick="probarUsuarios()">👥 Probar Usuarios</button>
        <button onclick="probarEstudiantes()">🎓 Probar Estudiantes</button>
        <button onclick="probarDocentes()">👨‍🏫 Probar Docentes</button>
        <button onclick="probarHorarios()">📅 Probar Horarios</button>
        <button onclick="probarMaterias()">📚 Probar Materias</button>
        <button onclick="probarMatriculas()">📝 Probar Matrículas</button>
        
        <div id="resultado"></div>
    </div>

    <script>
        const baseURL = 'http://localhost/sistema-asistencia-facial/backend';
        let token = '';

        function mostrarResultado(titulo, data, exito = true) {
            const resultado = document.getElementById('resultado');
            const clase = exito ? 'success' : 'error';
            resultado.innerHTML = `
                <div class="endpoint">
                    <h3 class="${clase}">${titulo}</h3>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </div>
            `;
        }

        async function probarLogin() {
            try {
                console.log('🔐 Probando login...');
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
                console.log('Respuesta:', data);
                
                if (data.exito) {
                    token = data.datos.token;
                    mostrarResultado('✅ Login Exitoso', data, true);
                } else {
                    mostrarResultado('❌ Login Fallido', data, false);
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarResultado('❌ Error de Conexión', { 
                    mensaje: error.message,
                    url: `${baseURL}/auth.php`
                }, false);
            }
        }

        async function probarUsuarios() {
            if (!token) {
                alert('Primero debes hacer login');
                return;
            }
            
            try {
                const response = await fetch(`${baseURL}/usuarios.php?accion=listar`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();
                mostrarResultado(data.exito ? '✅ Usuarios' : '❌ Error', data, data.exito);
            } catch (error) {
                mostrarResultado('❌ Error de Conexión', { mensaje: error.message }, false);
            }
        }

        async function probarEstudiantes() {
            if (!token) {
                alert('Primero debes hacer login');
                return;
            }
            
            try {
                const response = await fetch(`${baseURL}/estudiantes.php?accion=listar`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();
                mostrarResultado(data.exito ? '✅ Estudiantes' : '❌ Error', data, data.exito);
            } catch (error) {
                mostrarResultado('❌ Error de Conexión', { mensaje: error.message }, false);
            }
        }

        async function probarDocentes() {
            if (!token) {
                alert('Primero debes hacer login');
                return;
            }
            
            try {
                const response = await fetch(`${baseURL}/docentes.php?accion=listar`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();
                mostrarResultado(data.exito ? '✅ Docentes' : '❌ Error', data, data.exito);
            } catch (error) {
                mostrarResultado('❌ Error de Conexión', { mensaje: error.message }, false);
            }
        }

        async function probarHorarios() {
            if (!token) {
                alert('Primero debes hacer login');
                return;
            }
            
            try {
                const response = await fetch(`${baseURL}/horarios.php?accion=listar`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();
                mostrarResultado(data.exito ? '✅ Horarios' : '❌ Error', data, data.exito);
            } catch (error) {
                mostrarResultado('❌ Error de Conexión', { mensaje: error.message }, false);
            }
        }

        async function probarMaterias() {
            if (!token) {
                alert('Primero debes hacer login');
                return;
            }
            
            try {
                const response = await fetch(`${baseURL}/materias.php?accion=listar`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();
                mostrarResultado(data.exito ? '✅ Materias' : '❌ Error', data, data.exito);
            } catch (error) {
                mostrarResultado('❌ Error de Conexión', { mensaje: error.message }, false);
            }
        }

        async function probarMatriculas() {
            if (!token) {
                alert('Primero debes hacer login');
                return;
            }
            
            try {
                const response = await fetch(`${baseURL}/matriculas.php?accion=listar`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();
                mostrarResultado(data.exito ? '✅ Matrículas' : '❌ Error', data, data.exito);
            } catch (error) {
                mostrarResultado('❌ Error de Conexión', { mensaje: error.message }, false);
            }
        }
    </script>

    <div class="endpoint">
        <h2>5️⃣ Configuración de CORS</h2>
        <p>Verifica que el archivo <code>.htaccess</code> tenga la configuración CORS correcta.</p>
        <?php
        $htaccess = file_exists(__DIR__ . '/.htaccess');
        if ($htaccess) {
            echo "<p class='success'>✅ Archivo .htaccess existe</p>";
            echo "<h4>Contenido:</h4>";
            echo "<pre>" . htmlspecialchars(file_get_contents(__DIR__ . '/.htaccess')) . "</pre>";
        } else {
            echo "<p class='error'>❌ Archivo .htaccess NO existe</p>";
        }
        ?>
    </div>
</body>
</html>