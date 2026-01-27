<?php
require_once 'config/base_datos.php';

$baseDatos = new BaseDatos();
$conexion = $baseDatos->conectar();

if ($conexion) {
    echo json_encode([
        'exito' => true,
        'mensaje' => 'Conexión a la base de datos exitosa.'
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        'exito' => false,
        'mensaje' => 'Error al conectar con la base de datos.'
    ], JSON_UNESCAPED_UNICODE);
}
?>