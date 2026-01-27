<?php
/**
 * Endpoint de Estadísticas
 * Proporciona métricas y estadísticas del sistema
 */

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/base_datos.php';
require_once __DIR__ . '/helpers/respuestas.php';
require_once __DIR__ . '/helpers/seguridad.php';

$usuario_autenticado = Seguridad::verificarAutenticacion();
$accion = $_GET['accion'] ?? 'generales';

switch ($accion) {
    case 'generales':
        obtenerEstadisticasGenerales();
        break;
    case 'asistencias_hoy':
        obtenerAsistenciasHoy();
        break;
    case 'asistencias_mes':
        obtenerAsistenciasMes();
        break;
    case 'por_materia':
        obtenerEstadisticasPorMateria();
        break;
    case 'docente':
        obtenerEstadisticasDocente();
        break;
    default:
        Respuestas::error("Acción no válida");
}

/**
 * Estadísticas generales del sistema (Admin)
 */
function obtenerEstadisticasGenerales() {
    Seguridad::verificarRol(['Administrador']);
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        // Total de estudiantes
        $query = "SELECT COUNT(*) as total FROM estudiantes";
        $stmt = $conexion->prepare($query);
        $stmt->execute();
        $totalEstudiantes = $stmt->fetch()['total'];
        
        // Total de docentes
        $query = "SELECT COUNT(*) as total FROM docentes";
        $stmt = $conexion->prepare($query);
        $stmt->execute();
        $totalDocentes = $stmt->fetch()['total'];
        
        // Total de materias
        $query = "SELECT COUNT(*) as total FROM materias";
        $stmt = $conexion->prepare($query);
        $stmt->execute();
        $totalMaterias = $stmt->fetch()['total'];
        
        // Asistencias de hoy
        $hoy = date('Y-m-d');
        $query = "SELECT COUNT(*) as total FROM asistencias WHERE fecha = :hoy";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':hoy', $hoy);
        $stmt->execute();
        $asistenciasHoy = $stmt->fetch()['total'];
        
        // Porcentaje de asistencia general
        $query = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN estado = 'Presente' THEN 1 ELSE 0 END) as presentes,
                    ROUND((SUM(CASE WHEN estado = 'Presente' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) as porcentaje
                  FROM asistencias";
        $stmt = $conexion->prepare($query);
        $stmt->execute();
        $datosAsistencia = $stmt->fetch();
        
        // Asistencias por día (últimos 7 días)
        $query = "SELECT 
                    fecha,
                    COUNT(*) as total,
                    SUM(CASE WHEN estado = 'Presente' THEN 1 ELSE 0 END) as presentes,
                    SUM(CASE WHEN estado = 'Ausente' THEN 1 ELSE 0 END) as ausentes
                  FROM asistencias
                  WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                  GROUP BY fecha
                  ORDER BY fecha ASC";
        $stmt = $conexion->prepare($query);
        $stmt->execute();
        $asistenciasPorDia = $stmt->fetchAll();
        
        $estadisticas = [
            'total_estudiantes' => (int)$totalEstudiantes,
            'total_docentes' => (int)$totalDocentes,
            'total_materias' => (int)$totalMaterias,
            'asistencias_hoy' => (int)$asistenciasHoy,
            'porcentaje_asistencia' => (float)($datosAsistencia['porcentaje'] ?? 0),
            'total_asistencias' => (int)($datosAsistencia['total'] ?? 0),
            'total_presentes' => (int)($datosAsistencia['presentes'] ?? 0),
            'asistencias_por_dia' => $asistenciasPorDia
        ];
        
        Respuestas::exito("Estadísticas generales obtenidas", $estadisticas);
        
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Asistencias de hoy
 */
function obtenerAsistenciasHoy() {
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        $hoy = date('Y-m-d');
        
        $query = "SELECT 
                    a.*,
                    CONCAT(u.nombres, ' ', u.apellidos) as nombre_estudiante,
                    e.codigo_estudiante,
                    m.nombre_materia
                  FROM asistencias a
                  INNER JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
                  INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
                  INNER JOIN materias m ON a.id_materia = m.id_materia
                  WHERE a.fecha = :hoy
                  ORDER BY a.hora DESC
                  LIMIT 20";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':hoy', $hoy);
        $stmt->execute();
        $asistencias = $stmt->fetchAll();
        
        Respuestas::exito("Asistencias de hoy obtenidas", $asistencias);
        
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Asistencias del mes actual
 */
function obtenerAsistenciasMes() {
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        $query = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN estado = 'Presente' THEN 1 ELSE 0 END) as presentes,
                    SUM(CASE WHEN estado = 'Ausente' THEN 1 ELSE 0 END) as ausentes,
                    ROUND((SUM(CASE WHEN estado = 'Presente' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) as porcentaje
                  FROM asistencias
                  WHERE MONTH(fecha) = MONTH(CURDATE())
                  AND YEAR(fecha) = YEAR(CURDATE())";
        
        $stmt = $conexion->prepare($query);
        $stmt->execute();
        $datos = $stmt->fetch();
        
        Respuestas::exito("Asistencias del mes obtenidas", $datos);
        
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Estadísticas por materia
 */
function obtenerEstadisticasPorMateria() {
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        $query = "SELECT 
                    m.id_materia,
                    m.nombre_materia,
                    COUNT(a.id_asistencia) as total_registros,
                    SUM(CASE WHEN a.estado = 'Presente' THEN 1 ELSE 0 END) as presentes,
                    SUM(CASE WHEN a.estado = 'Ausente' THEN 1 ELSE 0 END) as ausentes,
                    ROUND((SUM(CASE WHEN a.estado = 'Presente' THEN 1 ELSE 0 END) * 100.0) / 
                          NULLIF(COUNT(a.id_asistencia), 0), 2) as porcentaje_asistencia
                  FROM materias m
                  LEFT JOIN asistencias a ON m.id_materia = a.id_materia
                  GROUP BY m.id_materia, m.nombre_materia
                  ORDER BY total_registros DESC
                  LIMIT 10";
        
        $stmt = $conexion->prepare($query);
        $stmt->execute();
        $estadisticas = $stmt->fetchAll();
        
        Respuestas::exito("Estadísticas por materia obtenidas", $estadisticas);
        
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Estadísticas para docente
 */
function obtenerEstadisticasDocente() {
    $usuario_autenticado = Seguridad::verificarAutenticacion();
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        // Obtener ID del docente
        $query = "SELECT id_docente FROM docentes WHERE id_usuario = :id_usuario";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_usuario', $usuario_autenticado->id_usuario);
        $stmt->execute();
        $docente = $stmt->fetch();
        
        if (!$docente) {
            Respuestas::error("Docente no encontrado");
        }
        
        // Por ahora, devolver estadísticas generales
        // En el futuro, filtrar por materias del docente
        $hoy = date('Y-m-d');
        
        $query = "SELECT 
                    COUNT(*) as total_asistencias_hoy
                  FROM asistencias
                  WHERE fecha = :hoy";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':hoy', $hoy);
        $stmt->execute();
        $datos = $stmt->fetch();
        
        $estadisticas = [
            'asistencias_hoy' => (int)$datos['total_asistencias_hoy']
        ];
        
        Respuestas::exito("Estadísticas del docente obtenidas", $estadisticas);
        
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}
?>