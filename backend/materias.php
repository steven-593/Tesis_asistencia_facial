<?php
/**
 * Endpoint de Materias
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
        obtenerMaterias();
        break;
    case 'POST':
        crearMateria();
        break;
    case 'PUT':
        actualizarMateria();
        break;
    case 'DELETE':
        eliminarMateria();
        break;
    default:
        Respuestas::error("Método no permitido");
}

/**
 * Obtener todas las materias o una específica
 */
function obtenerMaterias() {
    Seguridad::verificarRol(['Administrador', 'Docente']);
    
    $id = $_GET['id'] ?? null;
    $accion = $_GET['accion'] ?? 'listar';
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        if ($accion === 'obtener' && $id) {
            // Obtener una materia específica con información del horario
            $query = "SELECT m.*, h.dia, h.hora_inicio, h.hora_fin 
                      FROM materias m 
                      INNER JOIN horarios h ON m.id_horario = h.id_horario 
                      WHERE m.id_materia = :id";
            
            $stmt = $conexion->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $materia = $stmt->fetch();
            
            if ($materia) {
                Respuestas::exito("Materia obtenida", $materia);
            } else {
                Respuestas::noEncontrado("Materia no encontrada");
            }
        } else {
            // Listar todas las materias con información del horario
            $query = "SELECT m.*, h.dia, h.hora_inicio, h.hora_fin 
                      FROM materias m 
                      INNER JOIN horarios h ON m.id_horario = h.id_horario 
                      ORDER BY m.nombre_materia ASC";
            
            $stmt = $conexion->prepare($query);
            $stmt->execute();
            $materias = $stmt->fetchAll();
            
            Respuestas::exito("Materias obtenidas", $materias);
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Crear una nueva materia
 */
function crearMateria() {
    Seguridad::verificarRol(['Administrador', 'Docente']);
    
    $datos = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos requeridos
    if (empty($datos['nombre_materia']) || empty($datos['carrera']) || empty($datos['id_horario'])) {
        Respuestas::error("Todos los campos son requeridos");
    }
    
    $nombre_materia = Seguridad::limpiarDatos($datos['nombre_materia']);
    $carrera = Seguridad::limpiarDatos($datos['carrera']);
    $id_horario = $datos['id_horario'];
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        // Verificar que el horario existe
        $query = "SELECT id_horario FROM horarios WHERE id_horario = :id_horario";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_horario', $id_horario);
        $stmt->execute();
        
        if (!$stmt->fetch()) {
            Respuestas::error("El horario seleccionado no existe");
        }
        
        // Verificar si ya existe una materia con el mismo nombre, carrera y horario
        $query = "SELECT id_materia FROM materias 
                  WHERE nombre_materia = :nombre_materia 
                  AND carrera = :carrera 
                  AND id_horario = :id_horario";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':nombre_materia', $nombre_materia);
        $stmt->bindParam(':carrera', $carrera);
        $stmt->bindParam(':id_horario', $id_horario);
        $stmt->execute();
        
        if ($stmt->fetch()) {
            Respuestas::error("Ya existe una materia con el mismo nombre, carrera y horario");
        }
        
        // Insertar materia
        $query = "INSERT INTO materias (nombre_materia, carrera, id_horario) 
                  VALUES (:nombre_materia, :carrera, :id_horario)";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':nombre_materia', $nombre_materia);
        $stmt->bindParam(':carrera', $carrera);
        $stmt->bindParam(':id_horario', $id_horario);
        
        if ($stmt->execute()) {
            Respuestas::exito("Materia creada exitosamente", [
                'id_materia' => $conexion->lastInsertId()
            ]);
        } else {
            Respuestas::error("Error al crear la materia");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Actualizar una materia
 */
function actualizarMateria() {
    Seguridad::verificarRol(['Administrador', 'Docente']);
    
    $datos = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos requeridos
    if (empty($datos['id_materia']) || empty($datos['nombre_materia']) || 
        empty($datos['carrera']) || empty($datos['id_horario'])) {
        Respuestas::error("Todos los campos son requeridos");
    }
    
    $id_materia = $datos['id_materia'];
    $nombre_materia = Seguridad::limpiarDatos($datos['nombre_materia']);
    $carrera = Seguridad::limpiarDatos($datos['carrera']);
    $id_horario = $datos['id_horario'];
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        // Verificar que el horario existe
        $query = "SELECT id_horario FROM horarios WHERE id_horario = :id_horario";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_horario', $id_horario);
        $stmt->execute();
        
        if (!$stmt->fetch()) {
            Respuestas::error("El horario seleccionado no existe");
        }
        
        // Verificar si ya existe una materia con el mismo nombre, carrera y horario (excepto la actual)
        $query = "SELECT id_materia FROM materias 
                  WHERE nombre_materia = :nombre_materia 
                  AND carrera = :carrera 
                  AND id_horario = :id_horario 
                  AND id_materia != :id_materia";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':nombre_materia', $nombre_materia);
        $stmt->bindParam(':carrera', $carrera);
        $stmt->bindParam(':id_horario', $id_horario);
        $stmt->bindParam(':id_materia', $id_materia);
        $stmt->execute();
        
        if ($stmt->fetch()) {
            Respuestas::error("Ya existe otra materia con el mismo nombre, carrera y horario");
        }
        
        // Actualizar materia
        $query = "UPDATE materias 
                  SET nombre_materia = :nombre_materia, 
                      carrera = :carrera, 
                      id_horario = :id_horario 
                  WHERE id_materia = :id_materia";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':nombre_materia', $nombre_materia);
        $stmt->bindParam(':carrera', $carrera);
        $stmt->bindParam(':id_horario', $id_horario);
        $stmt->bindParam(':id_materia', $id_materia);
        
        if ($stmt->execute()) {
            Respuestas::exito("Materia actualizada exitosamente");
        } else {
            Respuestas::error("Error al actualizar la materia");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Eliminar una materia
 */
function eliminarMateria() {
    Seguridad::verificarRol(['Administrador', 'Docente']);
    
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        Respuestas::error("ID de materia requerido");
    }
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        // Verificar si la materia tiene matrículas asociadas
        $query = "SELECT COUNT(*) as total FROM matriculas WHERE id_materia = :id";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $resultado = $stmt->fetch();
        
        if ($resultado['total'] > 0) {
            Respuestas::error("No se puede eliminar la materia porque tiene " . 
                            $resultado['total'] . " matrícula(s) asociada(s)");
        }
        
        // Verificar si la materia tiene asistencias asociadas
        $query = "SELECT COUNT(*) as total FROM asistencias WHERE id_materia = :id";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $resultado = $stmt->fetch();
        
        if ($resultado['total'] > 0) {
            Respuestas::error("No se puede eliminar la materia porque tiene " . 
                            $resultado['total'] . " asistencia(s) registrada(s)");
        }
        
        // Eliminar materia
        $query = "DELETE FROM materias WHERE id_materia = :id";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                Respuestas::exito("Materia eliminada exitosamente");
            } else {
                Respuestas::noEncontrado("Materia no encontrada");
            }
        } else {
            Respuestas::error("Error al eliminar la materia");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}
?>