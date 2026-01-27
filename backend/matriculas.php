<?php
/**
 * Endpoint de Matrículas
 * CRUD completo
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
        obtenerMatriculas();
        break;
    case 'POST':
        crearMatricula();
        break;
    case 'PUT':
        actualizarMatricula();
        break;
    case 'DELETE':
        eliminarMatricula();
        break;
    default:
        Respuestas::error("Método no permitido");
}

/**
 * Obtener todas las matrículas o una específica
 */
function obtenerMatriculas() {
    Seguridad::verificarRol(['Administrador', 'Docente']);
    
    $id = $_GET['id'] ?? null;
    $accion = $_GET['accion'] ?? 'listar';
    $id_estudiante = $_GET['id_estudiante'] ?? null;
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        if ($accion === 'por_estudiante' && $id_estudiante) {
            // Obtener matrículas de un estudiante específico
            $query = "SELECT 
                        mat.id_matricula,
                        mat.id_estudiante,
                        mat.id_materia,
                        e.codigo_estudiante,
                        CONCAT(u.nombres, ' ', u.apellidos) as nombre_estudiante,
                        m.nombre_materia,
                        m.carrera,
                        h.dia,
                        h.hora_inicio,
                        h.hora_fin
                      FROM matriculas mat
                      INNER JOIN estudiantes e ON mat.id_estudiante = e.id_estudiante
                      INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
                      INNER JOIN materias m ON mat.id_materia = m.id_materia
                      INNER JOIN horarios h ON m.id_horario = h.id_horario
                      WHERE mat.id_estudiante = :id_estudiante
                      ORDER BY h.dia, h.hora_inicio";
            
            $stmt = $conexion->prepare($query);
            $stmt->bindParam(':id_estudiante', $id_estudiante);
            $stmt->execute();
            $matriculas = $stmt->fetchAll();
            
            Respuestas::exito("Matrículas del estudiante obtenidas", $matriculas);
            
        } elseif ($accion === 'obtener' && $id) {
            // Obtener una matrícula específica
            $query = "SELECT 
                        mat.id_matricula,
                        mat.id_estudiante,
                        mat.id_materia,
                        e.codigo_estudiante,
                        CONCAT(u.nombres, ' ', u.apellidos) as nombre_estudiante,
                        m.nombre_materia,
                        m.carrera,
                        h.dia,
                        h.hora_inicio,
                        h.hora_fin
                      FROM matriculas mat
                      INNER JOIN estudiantes e ON mat.id_estudiante = e.id_estudiante
                      INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
                      INNER JOIN materias m ON mat.id_materia = m.id_materia
                      INNER JOIN horarios h ON m.id_horario = h.id_horario
                      WHERE mat.id_matricula = :id";
            
            $stmt = $conexion->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $matricula = $stmt->fetch();
            
            if ($matricula) {
                Respuestas::exito("Matrícula obtenida", $matricula);
            } else {
                Respuestas::noEncontrado("Matrícula no encontrada");
            }
        } else {
            // Listar todas las matrículas
            $query = "SELECT 
                        mat.id_matricula,
                        mat.id_estudiante,
                        mat.id_materia,
                        e.codigo_estudiante,
                        CONCAT(u.nombres, ' ', u.apellidos) as nombre_estudiante,
                        u.correo,
                        m.nombre_materia,
                        m.carrera,
                        h.dia,
                        h.hora_inicio,
                        h.hora_fin
                      FROM matriculas mat
                      INNER JOIN estudiantes e ON mat.id_estudiante = e.id_estudiante
                      INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
                      INNER JOIN materias m ON mat.id_materia = m.id_materia
                      INNER JOIN horarios h ON m.id_horario = h.id_horario
                      ORDER BY u.apellidos, u.nombres, m.nombre_materia";
            
            $stmt = $conexion->prepare($query);
            $stmt->execute();
            $matriculas = $stmt->fetchAll();
            
            Respuestas::exito("Matrículas obtenidas", $matriculas);
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Crear una nueva matrícula
 */
function crearMatricula() {
    Seguridad::verificarRol(['Administrador', 'Docente']);
    
    $datos = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos requeridos
    if (empty($datos['id_estudiante']) || empty($datos['id_materia'])) {
        Respuestas::error("Estudiante y materia son requeridos");
    }
    
    $id_estudiante = $datos['id_estudiante'];
    $id_materia = $datos['id_materia'];
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        // Verificar que el estudiante existe
        $query = "SELECT id_estudiante, carrera FROM estudiantes WHERE id_estudiante = :id_estudiante";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_estudiante', $id_estudiante);
        $stmt->execute();
        $estudiante = $stmt->fetch();
        
        if (!$estudiante) {
            Respuestas::error("El estudiante seleccionado no existe");
        }
        
        // Verificar que la materia existe y obtener su carrera
        $query = "SELECT id_materia, carrera, id_horario FROM materias WHERE id_materia = :id_materia";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_materia', $id_materia);
        $stmt->execute();
        $materia = $stmt->fetch();
        
        if (!$materia) {
            Respuestas::error("La materia seleccionada no existe");
        }
        
        // Verificar que la carrera del estudiante coincida con la de la materia
        if ($estudiante['carrera'] !== $materia['carrera']) {
            Respuestas::error("La materia no pertenece a la carrera del estudiante");
        }
        
        // Verificar si ya existe la matrícula
        $query = "SELECT id_matricula FROM matriculas 
                  WHERE id_estudiante = :id_estudiante 
                  AND id_materia = :id_materia";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_estudiante', $id_estudiante);
        $stmt->bindParam(':id_materia', $id_materia);
        $stmt->execute();
        
        if ($stmt->fetch()) {
            Respuestas::error("El estudiante ya está matriculado en esta materia");
        }
        
        // Verificar conflictos de horario
        $query = "SELECT m.nombre_materia, h.dia, h.hora_inicio, h.hora_fin
                  FROM matriculas mat
                  INNER JOIN materias m ON mat.id_materia = m.id_materia
                  INNER JOIN horarios h ON m.id_horario = h.id_horario
                  WHERE mat.id_estudiante = :id_estudiante
                  AND m.id_horario = :id_horario";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_estudiante', $id_estudiante);
        $stmt->bindParam(':id_horario', $materia['id_horario']);
        $stmt->execute();
        $conflicto = $stmt->fetch();
        
        if ($conflicto) {
            Respuestas::error("Conflicto de horario: El estudiante ya tiene la materia '" . 
                            $conflicto['nombre_materia'] . "' en el mismo horario (" . 
                            $conflicto['dia'] . " " . $conflicto['hora_inicio'] . "-" . 
                            $conflicto['hora_fin'] . ")");
        }
        
        // Insertar matrícula
        $query = "INSERT INTO matriculas (id_estudiante, id_materia) 
                  VALUES (:id_estudiante, :id_materia)";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_estudiante', $id_estudiante);
        $stmt->bindParam(':id_materia', $id_materia);
        
        if ($stmt->execute()) {
            Respuestas::exito("Matrícula creada exitosamente", [
                'id_matricula' => $conexion->lastInsertId()
            ]);
        } else {
            Respuestas::error("Error al crear la matrícula");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Actualizar una matrícula
 */
function actualizarMatricula() {
    Seguridad::verificarRol(['Administrador', 'Docente']);
    
    $datos = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos requeridos
    if (empty($datos['id_matricula']) || empty($datos['id_estudiante']) || empty($datos['id_materia'])) {
        Respuestas::error("Todos los campos son requeridos");
    }
    
    $id_matricula = $datos['id_matricula'];
    $id_estudiante = $datos['id_estudiante'];
    $id_materia = $datos['id_materia'];
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        // Verificar que el estudiante existe
        $query = "SELECT id_estudiante, carrera FROM estudiantes WHERE id_estudiante = :id_estudiante";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_estudiante', $id_estudiante);
        $stmt->execute();
        $estudiante = $stmt->fetch();
        
        if (!$estudiante) {
            Respuestas::error("El estudiante seleccionado no existe");
        }
        
        // Verificar que la materia existe
        $query = "SELECT id_materia, carrera FROM materias WHERE id_materia = :id_materia";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_materia', $id_materia);
        $stmt->execute();
        $materia = $stmt->fetch();
        
        if (!$materia) {
            Respuestas::error("La materia seleccionada no existe");
        }
        
        // Verificar que la carrera coincida
        if ($estudiante['carrera'] !== $materia['carrera']) {
            Respuestas::error("La materia no pertenece a la carrera del estudiante");
        }
        
        // Verificar si ya existe otra matrícula con la misma combinación
        $query = "SELECT id_matricula FROM matriculas 
                  WHERE id_estudiante = :id_estudiante 
                  AND id_materia = :id_materia 
                  AND id_matricula != :id_matricula";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_estudiante', $id_estudiante);
        $stmt->bindParam(':id_materia', $id_materia);
        $stmt->bindParam(':id_matricula', $id_matricula);
        $stmt->execute();
        
        if ($stmt->fetch()) {
            Respuestas::error("Ya existe una matrícula con esta combinación de estudiante y materia");
        }
        
        // Actualizar matrícula
        $query = "UPDATE matriculas 
                  SET id_estudiante = :id_estudiante, id_materia = :id_materia 
                  WHERE id_matricula = :id_matricula";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_estudiante', $id_estudiante);
        $stmt->bindParam(':id_materia', $id_materia);
        $stmt->bindParam(':id_matricula', $id_matricula);
        
        if ($stmt->execute()) {
            Respuestas::exito("Matrícula actualizada exitosamente");
        } else {
            Respuestas::error("Error al actualizar la matrícula");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Eliminar una matrícula
 */
function eliminarMatricula() {
    Seguridad::verificarRol(['Administrador', 'Docente']);
    
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        Respuestas::error("ID de matrícula requerido");
    }
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        // Verificar si tiene asistencias registradas
        $query = "SELECT COUNT(*) as total 
                  FROM asistencias a
                  INNER JOIN matriculas m ON a.id_estudiante = m.id_estudiante 
                  AND a.id_materia = m.id_materia
                  WHERE m.id_matricula = :id";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $resultado = $stmt->fetch();
        
        if ($resultado['total'] > 0) {
            Respuestas::error("No se puede eliminar la matrícula porque tiene " . 
                            $resultado['total'] . " asistencia(s) registrada(s)");
        }
        
        // Eliminar matrícula
        $query = "DELETE FROM matriculas WHERE id_matricula = :id";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                Respuestas::exito("Matrícula eliminada exitosamente");
            } else {
                Respuestas::noEncontrado("Matrícula no encontrada");
            }
        } else {
            Respuestas::error("Error al eliminar la matrícula");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}
?>