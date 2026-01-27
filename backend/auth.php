<?php
/**
 * Endpoint de Autenticación
 * Login y Logout
 */

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Responder a peticiones OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/base_datos.php';
require_once __DIR__ . '/config/jwt.php';
require_once __DIR__ . '/helpers/respuestas.php';

// Obtener método HTTP
$metodo = $_SERVER['REQUEST_METHOD'];

// Obtener datos del cuerpo de la petición
$datos_json = json_decode(file_get_contents('php://input'), true);

// Si no se reciben datos JSON, intentar con $_POST
if ($datos_json === null) {
    $datos_json = $_POST;
}

$accion = $datos_json['accion'] ?? '';

// Log para debug (comentar en producción)
error_log("Auth - Método: $metodo, Acción: $accion");
error_log("Auth - Datos recibidos: " . print_r($datos_json, true));

// Procesar según la acción
switch ($accion) {
    case 'login':
        login($datos_json);
        break;
    case 'logout':
        logout();
        break;
    default:
        Respuestas::error("Acción no válida. Acción recibida: '$accion'");
}

/**
 * Función de Login
 */
function login($datos) {
    // Validar datos
    if (empty($datos['correo']) || empty($datos['contrasena'])) {
        error_log("Login - Faltan datos. Correo: " . ($datos['correo'] ?? 'vacío') . ", Contraseña: " . (empty($datos['contrasena']) ? 'vacía' : 'presente'));
        Respuestas::error("Correo y contraseña son requeridos");
    }

    $correo = trim($datos['correo']);
    $contrasena = trim($datos['contrasena']);

    error_log("Login - Intento de login para: $correo");

    try {
        // Conectar a la base de datos
        $db = new BaseDatos();
        $conexion = $db->conectar();

        if (!$conexion) {
            error_log("Login - Error al conectar con la base de datos");
            Respuestas::errorServidor("Error al conectar con la base de datos");
        }

        // Buscar usuario por correo
        $query = "SELECT u.*, r.nombre_rol 
                  FROM usuarios u 
                  INNER JOIN roles r ON u.id_rol = r.id_rol 
                  WHERE u.correo = :correo 
                  LIMIT 1";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':correo', $correo);
        $stmt->execute();

        $usuario = $stmt->fetch();

        // Verificar si el usuario existe
        if (!$usuario) {
            error_log("Login - Usuario no encontrado: $correo");
            Respuestas::error("Credenciales incorrectas");
        }

        error_log("Login - Usuario encontrado: " . $usuario['nombres'] . " " . $usuario['apellidos']);

        // Verificar si el usuario está activo
        if ($usuario['estado'] !== 'Activo') {
            error_log("Login - Usuario inactivo: $correo");
            Respuestas::error("Usuario inactivo. Contacta al administrador");
        }

        // Verificar contraseña
        if (!password_verify($contrasena, $usuario['contrasena'])) {
            error_log("Login - Contraseña incorrecta para: $correo");
            Respuestas::error("Credenciales incorrectas");
        }

        error_log("Login - Contraseña correcta, generando token...");

        // Preparar datos del usuario para el token
        $datos_usuario = [
            'id_usuario' => $usuario['id_usuario'],
            'id_rol' => $usuario['id_rol'],
            'nombres' => $usuario['nombres'],
            'apellidos' => $usuario['apellidos'],
            'correo' => $usuario['correo'],
            'nombre_rol' => $usuario['nombre_rol']
        ];

        // Generar token JWT
        $token = JWT::generar($datos_usuario);

        // Guardar token en la base de datos
        $fecha_expiracion = date('Y-m-d H:i:s', time() + 86400); // 24 horas
        
        $query = "INSERT INTO tokens (id_usuario, token, fecha_expiracion, estado) 
                  VALUES (:id_usuario, :token, :fecha_expiracion, 'Activo')";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_usuario', $usuario['id_usuario']);
        $stmt->bindParam(':token', $token);
        $stmt->bindParam(':fecha_expiracion', $fecha_expiracion);
        $stmt->execute();

        error_log("Login - Login exitoso para: $correo");

        // Respuesta exitosa
        Respuestas::exito("Inicio de sesión exitoso", [
            'token' => $token,
            'usuario' => $datos_usuario
        ]);

    } catch (PDOException $e) {
        error_log("Login - Error PDO: " . $e->getMessage());
        Respuestas::errorServidor("Error en el servidor: " . $e->getMessage());
    }
}

/**
 * Función de Logout
 */
function logout() {
    Respuestas::exito("Sesión cerrada exitosamente");
}
?>