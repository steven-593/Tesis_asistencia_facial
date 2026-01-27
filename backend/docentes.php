<?php
/**
 * Endpoint de Docentes
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
        obtenerDocentes();
        break;
    case 'POST':
        crearDocente();
        break;
    case 'PUT':
        actualizarDocente();
        break;
    case 'DELETE':
        eliminarDocente();
        break;
    default:
        Respuestas::error("Método no permitido");
}

function obtenerDocentes() {
    Seguridad::verificarRol(['Administrador']);
    
    $id = $_GET['id'] ?? null;
    $accion = $_GET['accion'] ?? 'listar';
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        if ($accion === 'usuarios_disponibles') {
            // Obtener usuarios con rol Docente que no están asignados
            $query = "SELECT u.id_usuario, u.nombres, u.apellidos, u.correo 
                      FROM usuarios u 
                      WHERE u.id_rol = 2 
                      AND u.id_usuario NOT IN (SELECT id_usuario FROM docentes)
                      AND u.estado = 'Activo'
                      ORDER BY u.nombres ASC";
            
            $stmt = $conexion->prepare($query);
            $stmt->execute();
            $usuarios = $stmt->fetchAll();
            
            Respuestas::exito("Usuarios disponibles obtenidos", $usuarios);
            
        } elseif ($accion === 'obtener' && $id) {
            $query = "SELECT d.*, u.nombres, u.apellidos, u.correo, u.estado 
                      FROM docentes d 
                      INNER JOIN usuarios u ON d.id_usuario = u.id_usuario 
                      WHERE d.id_docente = :id";
            
            $stmt = $conexion->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $docente = $stmt->fetch();
            
            if ($docente) {
                Respuestas::exito("Docente obtenido", $docente);
            } else {
                Respuestas::noEncontrado("Docente no encontrado");
            }
        } else {
            // Listar todos
            $query = "SELECT d.*, u.nombres, u.apellidos, u.correo, u.estado 
                      FROM docentes d 
                      INNER JOIN usuarios u ON d.id_usuario = u.id_usuario 
                      ORDER BY d.id_docente DESC";
            
            $stmt = $conexion->prepare($query);
            $stmt->execute();
            $docentes = $stmt->fetchAll();
            
            Respuestas::exito("Docentes obtenidos", $docentes);
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

function crearDocente() {
    Seguridad::verificarRol(['Administrador']);
    
    $datos = json_decode(file_get_contents('php://input'), true);
    
    if (empty($datos['id_usuario'])) {
        Respuestas::error("Usuario es requerido");
    }
    
    $id_usuario = $datos['id_usuario'];
    $especialidad = isset($datos['especialidad']) ? Seguridad::limpiarDatos($datos['especialidad']) : null;
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        // Verificar que el usuario no esté asignado
        $query = "SELECT id_docente FROM docentes WHERE id_usuario = :id_usuario";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_usuario', $id_usuario);
        $stmt->execute();
        
        if ($stmt->fetch()) {
            Respuestas::error("Este usuario ya está asignado a un docente");
        }
        
        // Insertar docente
        $query = "INSERT INTO docentes (id_usuario, especialidad) 
                  VALUES (:id_usuario, :especialidad)";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_usuario', $id_usuario);
        $stmt->bindParam(':especialidad', $especialidad);
        
        if ($stmt->execute()) {
            Respuestas::exito("Docente creado exitosamente", [
                'id_docente' => $conexion->lastInsertId()
            ]);
        } else {
            Respuestas::error("Error al crear el docente");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

function actualizarDocente() {
    Seguridad::verificarRol(['Administrador']);
    
    $datos = json_decode(file_get_contents('php://input'), true);
    
    if (empty($datos['id_docente'])) {
        Respuestas::error("ID de docente es requerido");
    }
    
    $id_docente = $datos['id_docente'];
    $especialidad = isset($datos['especialidad']) ? Seguridad::limpiarDatos($datos['especialidad']) : null;
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        $query = "UPDATE docentes SET especialidad = :especialidad WHERE id_docente = :id";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':especialidad', $especialidad);
        $stmt->bindParam(':id', $id_docente);
        
        if ($stmt->execute()) {
            Respuestas::exito("Docente actualizado exitosamente");
        } else {
            Respuestas::error("Error al actualizar el docente");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

function eliminarDocente() {
    Seguridad::verificarRol(['Administrador']);
    
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        Respuestas::error("ID de docente requerido");
    }
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        $query = "DELETE FROM docentes WHERE id_docente = :id";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                Respuestas::exito("Docente eliminado exitosamente");
            } else {
                Respuestas::noEncontrado("Docente no encontrado");
            }
        } else {
            Respuestas::error("Error al eliminar el docente");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}
?>