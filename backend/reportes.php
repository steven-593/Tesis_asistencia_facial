<?php
/**
 * Endpoint para Generar Reportes CSV
 * CORREGIDO: Error stdClass as array solucionado
 */

// Headers para permitir la descarga
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/base_datos.php';
require_once __DIR__ . '/helpers/seguridad.php';

// 1. Verificar Autenticación y convertir a ARRAY
// AGREGAMOS "(array)" AQUÍ PARA EVITAR EL ERROR
$usuario = (array) Seguridad::verificarAutenticacion();

// Ahora sí podemos acceder como array
if ($usuario['nombre_rol'] !== 'Administrador') {
    http_response_code(403);
    echo "Acceso denegado. Solo administradores pueden descargar reportes.";
    exit;
}

// 2. Capturar filtros (opcional)
$fechaInicio = $_GET['fecha_inicio'] ?? null;
$fechaFin = $_GET['fecha_fin'] ?? null;

try {
    $db = new BaseDatos();
    $conexion = $db->conectar();

    // 3. Consulta SQL con Joins para obtener nombres reales
    $sql = "SELECT 
                a.fecha,
                a.hora,
                u.nombres,
                u.apellidos,
                e.codigo_estudiante,
                m.nombre_materia,
                m.carrera,
                a.estado,
                a.metodo_registro
            FROM asistencias a
            INNER JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
            INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
            INNER JOIN materias m ON a.id_materia = m.id_materia
            WHERE 1=1 ";

    $params = [];

    if ($fechaInicio) {
        $sql .= " AND a.fecha >= :fechaInicio ";
        $params[':fechaInicio'] = $fechaInicio;
    }

    if ($fechaFin) {
        $sql .= " AND a.fecha <= :fechaFin ";
        $params[':fechaFin'] = $fechaFin;
    }

    $sql .= " ORDER BY a.fecha DESC, a.hora DESC";

    $stmt = $conexion->prepare($sql);
    $stmt->execute($params);

    // 4. Configurar cabeceras para descarga de archivo
    $nombreArchivo = "reporte_asistencias_" . date('Y-m-d') . ".csv";
    
    // Estos headers fuerzan al navegador a descargar el archivo
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $nombreArchivo . '"');

    // 5. Abrir salida de PHP
    $output = fopen('php://output', 'w');

    // Agregar BOM para que Excel reconozca tildes y caracteres especiales (UTF-8)
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

    // Escribir encabezados de columnas
    fputcsv($output, ['Fecha', 'Hora', 'Nombres', 'Apellidos', 'Código', 'Materia', 'Carrera', 'Estado', 'Método']);

    // 6. Escribir datos
    while ($fila = $stmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($output, $fila);
    }

    fclose($output);
    exit; // Terminar script para no enviar nada más

} catch (PDOException $e) {
    http_response_code(500);
    echo "Error al generar reporte: " . $e->getMessage();
}
?>