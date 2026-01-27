<?php
/**
 * Endpoint de Horarios
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
        obtenerHorarios();
        break;
    case 'POST':
        crearHorario();
        break;
    case 'PUT':
        actualizarHorario();
        break;
    case 'DELETE':
        eliminarHorario();
        break;
    default:
        Respuestas::error("Método no permitido");
}

/**
 * Obtener todos los horarios o uno específico
 */
function obtenerHorarios() {
    Seguridad::verificarRol(['Administrador']);
    
    $id = $_GET['id'] ?? null;
    $accion = $_GET['accion'] ?? 'listar';
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        if ($accion === 'obtener' && $id) {
            // Obtener un horario específico
            $query = "SELECT * FROM horarios WHERE id_horario = :id";
            
            $stmt = $conexion->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $horario = $stmt->fetch();
            
            if ($horario) {
                Respuestas::exito("Horario obtenido", $horario);
            } else {
                Respuestas::noEncontrado("Horario no encontrado");
            }
        } else {
            // Listar todos los horarios
            $query = "SELECT * FROM horarios 
                      ORDER BY 
                          FIELD(dia, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'),
                          hora_inicio ASC";
            
            $stmt = $conexion->prepare($query);
            $stmt->execute();
            $horarios = $stmt->fetchAll();
            
            Respuestas::exito("Horarios obtenidos", $horarios);
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Crear un nuevo horario
 */
function crearHorario() {
    Seguridad::verificarRol(['Administrador']);
    
    $datos = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos requeridos
    if (empty($datos['dia']) || empty($datos['hora_inicio']) || empty($datos['hora_fin'])) {
        Respuestas::error("Todos los campos son requeridos");
    }
    
    $dia = Seguridad::limpiarDatos($datos['dia']);
    $hora_inicio = Seguridad::limpiarDatos($datos['hora_inicio']);
    $hora_fin = Seguridad::limpiarDatos($datos['hora_fin']);
    
    // Validar días permitidos
    $dias_permitidos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    if (!in_array($dia, $dias_permitidos)) {
        Respuestas::error("Día no válido");
    }
    
    // Validar que hora_fin sea mayor que hora_inicio
    if (strtotime($hora_inicio) >= strtotime($hora_fin)) {
        Respuestas::error("La hora de fin debe ser mayor a la hora de inicio");
    }
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        // Verificar si ya existe un horario similar
        $query = "SELECT id_horario FROM horarios 
                  WHERE dia = :dia 
                  AND hora_inicio = :hora_inicio 
                  AND hora_fin = :hora_fin";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':dia', $dia);
        $stmt->bindParam(':hora_inicio', $hora_inicio);
        $stmt->bindParam(':hora_fin', $hora_fin);
        $stmt->execute();
        
        if ($stmt->fetch()) {
            Respuestas::error("Ya existe un horario idéntico");
        }
        
        // Insertar horario
        $query = "INSERT INTO horarios (dia, hora_inicio, hora_fin) 
                  VALUES (:dia, :hora_inicio, :hora_fin)";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':dia', $dia);
        $stmt->bindParam(':hora_inicio', $hora_inicio);
        $stmt->bindParam(':hora_fin', $hora_fin);
        
        if ($stmt->execute()) {
            Respuestas::exito("Horario creado exitosamente", [
                'id_horario' => $conexion->lastInsertId()
            ]);
        } else {
            Respuestas::error("Error al crear el horario");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Actualizar un horario
 */
function actualizarHorario() {
    Seguridad::verificarRol(['Administrador']);
    
    $datos = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos requeridos
    if (empty($datos['id_horario']) || empty($datos['dia']) || 
        empty($datos['hora_inicio']) || empty($datos['hora_fin'])) {
        Respuestas::error("Todos los campos son requeridos");
    }
    
    $id_horario = $datos['id_horario'];
    $dia = Seguridad::limpiarDatos($datos['dia']);
    $hora_inicio = Seguridad::limpiarDatos($datos['hora_inicio']);
    $hora_fin = Seguridad::limpiarDatos($datos['hora_fin']);
    
    // Validar días permitidos
    $dias_permitidos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    if (!in_array($dia, $dias_permitidos)) {
        Respuestas::error("Día no válido");
    }
    
    // Validar que hora_fin sea mayor que hora_inicio
    if (strtotime($hora_inicio) >= strtotime($hora_fin)) {
        Respuestas::error("La hora de fin debe ser mayor a la hora de inicio");
    }
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        // Verificar si ya existe un horario similar en otro registro
        $query = "SELECT id_horario FROM horarios 
                  WHERE dia = :dia 
                  AND hora_inicio = :hora_inicio 
                  AND hora_fin = :hora_fin 
                  AND id_horario != :id_horario";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':dia', $dia);
        $stmt->bindParam(':hora_inicio', $hora_inicio);
        $stmt->bindParam(':hora_fin', $hora_fin);
        $stmt->bindParam(':id_horario', $id_horario);
        $stmt->execute();
        
        if ($stmt->fetch()) {
            Respuestas::error("Ya existe un horario idéntico");
        }
        
        // Actualizar horario
        $query = "UPDATE horarios 
                  SET dia = :dia, hora_inicio = :hora_inicio, hora_fin = :hora_fin 
                  WHERE id_horario = :id_horario";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':dia', $dia);
        $stmt->bindParam(':hora_inicio', $hora_inicio);
        $stmt->bindParam(':hora_fin', $hora_fin);
        $stmt->bindParam(':id_horario', $id_horario);
        
        if ($stmt->execute()) {
            Respuestas::exito("Horario actualizado exitosamente");
        } else {
            Respuestas::error("Error al actualizar el horario");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Eliminar un horario
 */
function eliminarHorario() {
    Seguridad::verificarRol(['Administrador']);
    
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        Respuestas::error("ID de horario requerido");
    }
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        // Verificar si el horario está siendo usado por materias
        $query = "SELECT COUNT(*) as total FROM materias WHERE id_horario = :id";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $resultado = $stmt->fetch();
        
        if ($resultado['total'] > 0) {
            Respuestas::error("No se puede eliminar el horario porque está siendo usado por " . 
                            $resultado['total'] . " materia(s)");
        }
        
        // Eliminar horario
        $query = "DELETE FROM horarios WHERE id_horario = :id";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                Respuestas::exito("Horario eliminado exitosamente");
            } else {
                Respuestas::noEncontrado("Horario no encontrado");
            }
        } else {
            Respuestas::error("Error al eliminar el horario");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}
?>