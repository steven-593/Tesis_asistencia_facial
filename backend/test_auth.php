<?php
/**
 * Versión simplificada de autenticación para debug
 */

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Responder a peticiones OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Obtener datos
$input = file_get_contents('php://input');
$datos = json_decode($input, true);

// Log para debug
error_log("=== AUTH DEBUG ===");
error_log("Input recibido: " . $input);
error_log("Datos parseados: " . print_r($datos, true));

// Verificar que se recibieron datos
if (!$datos) {
    http_response_code(400);
    echo json_encode([
        'exito' => false,
        'mensaje' => 'No se recibieron datos',
        'debug' => [
            'input_raw' => $input,
            'metodo' => $_SERVER['REQUEST_METHOD'],
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'no definido'
        ]
    ]);
    exit;
}

$accion = $datos['accion'] ?? '';
$correo = $datos['correo'] ?? '';
$contrasena = $datos['contrasena'] ?? '';

// Log
error_log("Acción: $accion");
error_log("Correo: $correo");

if ($accion !== 'login') {
    echo json_encode([
        'exito' => false,
        'mensaje' => 'Acción no válida: ' . $accion
    ]);
    exit;
}

if (empty($correo) || empty($contrasena)) {
    echo json_encode([
        'exito' => false,
        'mensaje' => 'Correo y contraseña requeridos',
        'debug' => [
            'correo_recibido' => !empty($correo),
            'contrasena_recibida' => !empty($contrasena)
        ]
    ]);
    exit;
}

// Conectar a la base de datos
try {
    $conexion = new PDO(
        "mysql:host=localhost;dbname=sistema_asistencia_facial;charset=utf8mb4",
        "root",
        ""
    );
    $conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    error_log("Conexión a BD exitosa");
    
    // Buscar usuario
    $query = "SELECT u.*, r.nombre_rol 
              FROM usuarios u 
              INNER JOIN roles r ON u.id_rol = r.id_rol 
              WHERE u.correo = :correo 
              LIMIT 1";
    
    $stmt = $conexion->prepare($query);
    $stmt->bindParam(':correo', $correo);
    $stmt->execute();
    
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    
    error_log("Usuario encontrado: " . ($usuario ? 'Sí' : 'No'));
    
    if (!$usuario) {
        echo json_encode([
            'exito' => false,
            'mensaje' => 'Usuario no encontrado'
        ]);
        exit;
    }
    
    // Verificar contraseña
    if (!password_verify($contrasena, $usuario['contrasena'])) {
        error_log("Contraseña incorrecta");
        echo json_encode([
            'exito' => false,
            'mensaje' => 'Contraseña incorrecta'
        ]);
        exit;
    }
    
    error_log("Login exitoso");
    
    // Generar token simple (para pruebas)
    $token = base64_encode($usuario['id_usuario'] . ':' . time());
    
    // Datos del usuario
    $datos_usuario = [
        'id_usuario' => $usuario['id_usuario'],
        'id_rol' => $usuario['id_rol'],
        'nombres' => $usuario['nombres'],
        'apellidos' => $usuario['apellidos'],
        'correo' => $usuario['correo'],
        'nombre_rol' => $usuario['nombre_rol']
    ];
    
    echo json_encode([
        'exito' => true,
        'mensaje' => 'Login exitoso',
        'datos' => [
            'token' => $token,
            'usuario' => $datos_usuario
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Error BD: " . $e->getMessage());
    echo json_encode([
        'exito' => false,
        'mensaje' => 'Error en el servidor: ' . $e->getMessage()
    ]);
}
?>