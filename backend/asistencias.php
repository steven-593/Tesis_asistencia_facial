<?php
/**
 * Endpoint de Asistencias
 * CRUD completo y funcionalidades especiales
 */

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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
$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        obtenerAsistencias();
        break;
    case 'POST':
        registrarAsistencia();
        break;
    case 'PUT':
        actualizarAsistencia();
        break;
    case 'DELETE':
        eliminarAsistencia();
        break;
    default:
        Respuestas::error("Método no permitido");
}

/**
 * Obtener asistencias con filtros
 */
function obtenerAsistencias() {
    $usuario_autenticado = Seguridad::verificarAutenticacion();
    
    $id = $_GET['id'] ?? null;
    $accion = $_GET['accion'] ?? 'listar';
    $id_materia = $_GET['id_materia'] ?? null;
    $id_estudiante = $_GET['id_estudiante'] ?? null;
    $fecha = $_GET['fecha'] ?? null;
    $fecha_inicio = $_GET['fecha_inicio'] ?? null;
    $fecha_fin = $_GET['fecha_fin'] ?? null;
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        if ($accion === 'obtener' && $id) {
            // Obtener una asistencia específica
            $query = "SELECT 
                        a.*,
                        CONCAT(u.nombres, ' ', u.apellidos) as nombre_estudiante,
                        e.codigo_estudiante,
                        m.nombre_materia,
                        m.carrera,
                        h.dia,
                        h.hora_inicio,
                        h.hora_fin
                      FROM asistencias a
                      INNER JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
                      INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
                      INNER JOIN materias m ON a.id_materia = m.id_materia
                      INNER JOIN horarios h ON a.id_horario = h.id_horario
                      WHERE a.id_asistencia = :id";
            
            $stmt = $conexion->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $asistencia = $stmt->fetch();
            
            if ($asistencia) {
                Respuestas::exito("Asistencia obtenida", $asistencia);
            } else {
                Respuestas::noEncontrado("Asistencia no encontrada");
            }
            
        } elseif ($accion === 'por_materia' && $id_materia) {
            // Obtener asistencias de una materia específica
            $query = "SELECT 
                        a.*,
                        CONCAT(u.nombres, ' ', u.apellidos) as nombre_estudiante,
                        e.codigo_estudiante
                      FROM asistencias a
                      INNER JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
                      INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
                      WHERE a.id_materia = :id_materia";
            
            // Agregar filtro de fecha si se proporciona
            if ($fecha) {
                $query .= " AND a.fecha = :fecha";
            }
            
            $query .= " ORDER BY a.fecha DESC, a.hora DESC";
            
            $stmt = $conexion->prepare($query);
            $stmt->bindParam(':id_materia', $id_materia);
            if ($fecha) {
                $stmt->bindParam(':fecha', $fecha);
            }
            $stmt->execute();
            $asistencias = $stmt->fetchAll();
            
            Respuestas::exito("Asistencias de la materia obtenidas", $asistencias);
            
        } elseif ($accion === 'por_estudiante' && $id_estudiante) {
            // Obtener asistencias de un estudiante específico
            $query = "SELECT 
                        a.*,
                        m.nombre_materia,
                        m.carrera,
                        h.dia,
                        h.hora_inicio,
                        h.hora_fin
                      FROM asistencias a
                      INNER JOIN materias m ON a.id_materia = m.id_materia
                      INNER JOIN horarios h ON a.id_horario = h.id_horario
                      WHERE a.id_estudiante = :id_estudiante";
            
            if ($fecha_inicio && $fecha_fin) {
                $query .= " AND a.fecha BETWEEN :fecha_inicio AND :fecha_fin";
            }
            
            $query .= " ORDER BY a.fecha DESC, a.hora DESC";
            
            $stmt = $conexion->prepare($query);
            $stmt->bindParam(':id_estudiante', $id_estudiante);
            if ($fecha_inicio && $fecha_fin) {
                $stmt->bindParam(':fecha_inicio', $fecha_inicio);
                $stmt->bindParam(':fecha_fin', $fecha_fin);
            }
            $stmt->execute();
            $asistencias = $stmt->fetchAll();
            
            Respuestas::exito("Asistencias del estudiante obtenidas", $asistencias);
            
        } elseif ($accion === 'estadisticas' && $id_estudiante) {
            // Obtener estadísticas de asistencia de un estudiante
            $query = "SELECT 
                        COUNT(*) as total_registros,
                        SUM(CASE WHEN estado = 'Presente' THEN 1 ELSE 0 END) as presentes,
                        SUM(CASE WHEN estado = 'Ausente' THEN 1 ELSE 0 END) as ausentes,
                        ROUND((SUM(CASE WHEN estado = 'Presente' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) as porcentaje_asistencia
                      FROM asistencias
                      WHERE id_estudiante = :id_estudiante";
            
            if ($id_materia) {
                $query .= " AND id_materia = :id_materia";
            }
            
            $stmt = $conexion->prepare($query);
            $stmt->bindParam(':id_estudiante', $id_estudiante);
            if ($id_materia) {
                $stmt->bindParam(':id_materia', $id_materia);
            }
            $stmt->execute();
            $estadisticas = $stmt->fetch();
            
            Respuestas::exito("Estadísticas obtenidas", $estadisticas);
            
        } else {
            // Listar todas las asistencias
            $query = "SELECT 
                        a.*,
                        CONCAT(u.nombres, ' ', u.apellidos) as nombre_estudiante,
                        e.codigo_estudiante,
                        m.nombre_materia,
                        m.carrera
                      FROM asistencias a
                      INNER JOIN estudiantes e ON a.id_estudiante = e.id_estudiante
                      INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
                      INNER JOIN materias m ON a.id_materia = m.id_materia
                      ORDER BY a.fecha DESC, a.hora DESC
                      LIMIT 100";
            
            $stmt = $conexion->prepare($query);
            $stmt->execute();
            $asistencias = $stmt->fetchAll();
            
            Respuestas::exito("Asistencias obtenidas", $asistencias);
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Registrar nueva asistencia
 */
function registrarAsistencia() {
    // CAMBIO CLAVE: Permite que el Docente también pueda registrar
    Seguridad::verificarRol(['Administrador', 'Docente']); 
    
    $datos = json_decode(file_get_contents('php://input'), true);
    
    if (empty($datos['id_estudiante']) || empty($datos['id_materia']) || 
        empty($datos['id_horario']) || empty($datos['fecha'])) {
        Respuestas::error("Todos los campos son requeridos");
    }
    // Solo administradores y docentes pueden registrar asistencias
    Seguridad::verificarRol(['Administrador', 'Docente']);
    
    $datos = json_decode(file_get_contents('php://input'), true);
    
    if (empty($datos['id_estudiante']) || empty($datos['id_materia']) || 
        empty($datos['id_horario']) || empty($datos['fecha'])) {
        Respuestas::error("Todos los campos son requeridos");
    }
    
    $id_estudiante = $datos['id_estudiante'];
    $id_materia = $datos['id_materia'];
    $id_horario = $datos['id_horario'];
    $fecha = $datos['fecha'];
    $hora = $datos['hora'] ?? date('H:i:s');
    $estado = $datos['estado'] ?? 'Presente';
    $metodo_registro = $datos['metodo_registro'] ?? 'Manual';
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        // Verificar que el estudiante existe
        $query = "SELECT id_estudiante FROM estudiantes WHERE id_estudiante = :id";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id', $id_estudiante);
        $stmt->execute();
        if (!$stmt->fetch()) {
            Respuestas::error("Estudiante no encontrado");
        }
        
        // Verificar que el estudiante esté matriculado en la materia
        $query = "SELECT id_matricula FROM matriculas 
                  WHERE id_estudiante = :id_estudiante AND id_materia = :id_materia";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_estudiante', $id_estudiante);
        $stmt->bindParam(':id_materia', $id_materia);
        $stmt->execute();
        if (!$stmt->fetch()) {
            Respuestas::error("El estudiante no está matriculado en esta materia");
        }
        
        // Verificar si ya existe asistencia para ese día
        $query = "SELECT id_asistencia FROM asistencias 
                  WHERE id_estudiante = :id_estudiante 
                  AND id_materia = :id_materia 
                  AND fecha = :fecha";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_estudiante', $id_estudiante);
        $stmt->bindParam(':id_materia', $id_materia);
        $stmt->bindParam(':fecha', $fecha);
        $stmt->execute();
        
        if ($stmt->fetch()) {
            Respuestas::error("Ya existe un registro de asistencia para este estudiante en esta fecha");
        }
        
        // Insertar asistencia
        $query = "INSERT INTO asistencias 
                  (id_estudiante, id_materia, id_horario, fecha, hora, estado, metodo_registro) 
                  VALUES (:id_estudiante, :id_materia, :id_horario, :fecha, :hora, :estado, :metodo_registro)";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_estudiante', $id_estudiante);
        $stmt->bindParam(':id_materia', $id_materia);
        $stmt->bindParam(':id_horario', $id_horario);
        $stmt->bindParam(':fecha', $fecha);
        $stmt->bindParam(':hora', $hora);
        $stmt->bindParam(':estado', $estado);
        $stmt->bindParam(':metodo_registro', $metodo_registro);
        
        if ($stmt->execute()) {
            Respuestas::exito("Asistencia registrada exitosamente", [
                'id_asistencia' => $conexion->lastInsertId()
            ]);
        } else {
            Respuestas::error("Error al registrar la asistencia");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Actualizar asistencia
 */
function actualizarAsistencia() {
    Seguridad::verificarRol(['Administrador', 'Docente']);
    
    $datos = json_decode(file_get_contents('php://input'), true);
    
    if (empty($datos['id_asistencia'])) {
        Respuestas::error("ID de asistencia requerido");
    }
    
    $id_asistencia = $datos['id_asistencia'];
    $estado = $datos['estado'] ?? null;
    
    if (!$estado || !in_array($estado, ['Presente', 'Ausente'])) {
        Respuestas::error("Estado no válido");
    }
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        $query = "UPDATE asistencias SET estado = :estado WHERE id_asistencia = :id";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':estado', $estado);
        $stmt->bindParam(':id', $id_asistencia);
        
        if ($stmt->execute()) {
            Respuestas::exito("Asistencia actualizada exitosamente");
        } else {
            Respuestas::error("Error al actualizar la asistencia");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Eliminar asistencia
 */
function eliminarAsistencia() {
    Seguridad::verificarRol(['Administrador', 'Docente']);
    
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        Respuestas::error("ID de asistencia requerido");
    }
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        $query = "DELETE FROM asistencias WHERE id_asistencia = :id";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                Respuestas::exito("Asistencia eliminada exitosamente");
            } else {
                Respuestas::noEncontrado("Asistencia no encontrada");
            }
        } else {
            Respuestas::error("Error al eliminar la asistencia");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}
?>