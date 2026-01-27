<?php
/**
 * Punto de entrada principal del backend
 * Sistema de Asistencia Facial
 */

// Configuración de errores (solo en desarrollo)
error_reporting(E_ALL);
ini_set('display_errors', 1);

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

// Log para debug
error_log("=== Nueva petición ===");
error_log("URI: " . $_SERVER['REQUEST_URI']);
error_log("Método: " . $_SERVER['REQUEST_METHOD']);

// Obtener la URI solicitada
$request_uri = $_SERVER['REQUEST_URI'];
$script_name = dirname($_SERVER['SCRIPT_NAME']);
$route = str_replace($script_name, '', $request_uri);
$route = strtok($route, '?'); // Remover query string

error_log("Ruta procesada: $route");

// Rutas disponibles
$rutas = [
    '/auth.php' => __DIR__ . '/auth.php',
    '/usuarios.php' => __DIR__ . '/usuarios.php',
    '/estudiantes.php' => __DIR__ . '/estudiantes.php',
    '/docentes.php' => __DIR__ . '/docentes.php',
    '/horarios.php' => __DIR__ . '/horarios.php',
    '/materias.php' => __DIR__ . '/materias.php',
    '/matriculas.php' => __DIR__ . '/matriculas.php',
    '/asistencias.php' => __DIR__ . '/asistencias.php',
    '/estadisticas.php' => __DIR__ . '/estadisticas.php',
];

// Verificar si la ruta existe
if (isset($rutas[$route]) && file_exists($rutas[$route])) {
    error_log("Cargando archivo: " . $rutas[$route]);
    require_once $rutas[$route];
} else {
    error_log("Ruta no encontrada: $route");
    http_response_code(404);
    echo json_encode([
        'exito' => false,
        'mensaje' => 'Endpoint no encontrado: ' . $route,
        'rutas_disponibles' => array_keys($rutas)
    ], JSON_UNESCAPED_UNICODE);
}
?>