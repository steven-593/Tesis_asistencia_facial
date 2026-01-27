<?php
/**
 * Endpoint de Estudiantes
 * CRUD completo con filtrado corregido
 */

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
        obtenerEstudiantes();
        break;
    case 'POST':
        crearEstudiante();
        break;
    case 'PUT':
        actualizarEstudiante();
        break;
    case 'DELETE':
        eliminarEstudiante();
        break;
    default:
        Respuestas::error("Método no permitido");
}

function obtenerEstudiantes() {
    Seguridad::verificarRol(['Administrador']);
    
    $id = $_GET['id'] ?? null;
    $accion = $_GET['accion'] ?? 'listar';
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        // ESTA ES LA FUNCIÓN QUE FILTRA PARA TU SELECT EN EL FRONTEND
        if ($accion === 'usuarios_disponibles') {
            // Filtramos por id_rol = 3 (Estudiantes) y que NO estén ya en la tabla estudiantes
            $query = "SELECT u.id_usuario, u.nombres, u.apellidos, u.correo 
                      FROM usuarios u 
                      WHERE u.id_rol = 3 
                      AND u.id_usuario NOT IN (SELECT id_usuario FROM estudiantes)
                      AND u.estado = 'Activo'
                      ORDER BY u.nombres ASC";
            
            $stmt = $conexion->prepare($query);
            $stmt->execute();
            $usuarios = $stmt->fetchAll();
            
            Respuestas::exito("Usuarios disponibles obtenidos", $usuarios);
            
        } elseif ($accion === 'obtener' && $id) {
            $query = "SELECT e.*, u.nombres, u.apellidos, u.correo, u.estado 
                      FROM estudiantes e 
                      INNER JOIN usuarios u ON e.id_usuario = u.id_usuario 
                      WHERE e.id_estudiante = :id";
            
            $stmt = $conexion->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $estudiante = $stmt->fetch();
            
            if ($estudiante) {
                Respuestas::exito("Estudiante obtenido", $estudiante);
            } else {
                Respuestas::noEncontrado("Estudiante no encontrado");
            }
        } else {
            // Listar todos los estudiantes registrados
            $query = "SELECT e.*, u.nombres, u.apellidos, u.correo, u.estado 
                      FROM estudiantes e 
                      INNER JOIN usuarios u ON e.id_usuario = u.id_usuario 
                      ORDER BY e.id_estudiante DESC";
            
            $stmt = $conexion->prepare($query);
            $stmt->execute();
            $estudiantes = $stmt->fetchAll();
            
            Respuestas::exito("Estudiantes obtenidos", $estudiantes);
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

function crearEstudiante() {
    Seguridad::verificarRol(['Administrador']);
    $datos = json_decode(file_get_contents('php://input'), true);
    
    if (empty($datos['id_usuario']) || empty($datos['codigo_estudiante']) || 
        empty($datos['carrera']) || empty($datos['semestre'])) {
        Respuestas::error("Todos los campos son requeridos");
    }
    
    $id_usuario = $datos['id_usuario'];
    $codigo_estudiante = Seguridad::limpiarDatos($datos['codigo_estudiante']);
    $carrera = Seguridad::limpiarDatos($datos['carrera']);
    $semestre = Seguridad::limpiarDatos($datos['semestre']);
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        // Validar que el código sea único
        $query = "SELECT id_estudiante FROM estudiantes WHERE codigo_estudiante = :codigo";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':codigo', $codigo_estudiante);
        $stmt->execute();
        
        if ($stmt->fetch()) {
            Respuestas::error("El código de estudiante ya existe");
        }
        
        $query = "INSERT INTO estudiantes (id_usuario, codigo_estudiante, carrera, semestre) 
                  VALUES (:id_usuario, :codigo, :carrera, :semestre)";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_usuario', $id_usuario);
        $stmt->bindParam(':codigo', $codigo_estudiante);
        $stmt->bindParam(':carrera', $carrera);
        $stmt->bindParam(':semestre', $semestre);
        
        if ($stmt->execute()) {
            Respuestas::exito("Estudiante registrado exitosamente", [
                'id_estudiante' => $conexion->lastInsertId()
            ]);
        } else {
            Respuestas::error("Error al registrar el estudiante");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

function actualizarEstudiante() {
    Seguridad::verificarRol(['Administrador']);
    
    $datos = json_decode(file_get_contents('php://input'), true);
    
    if (empty($datos['id_estudiante']) || empty($datos['codigo_estudiante']) || 
        empty($datos['carrera']) || empty($datos['semestre'])) {
        Respuestas::error("Todos los campos son requeridos");
    }
    
    $id_estudiante = $datos['id_estudiante'];
    $codigo_estudiante = Seguridad::limpiarDatos($datos['codigo_estudiante']);
    $carrera = Seguridad::limpiarDatos($datos['carrera']);
    $semestre = Seguridad::limpiarDatos($datos['semestre']);
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        // Verificar que el código no exista en otro estudiante
        $query = "SELECT id_estudiante FROM estudiantes 
                  WHERE codigo_estudiante = :codigo AND id_estudiante != :id";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':codigo', $codigo_estudiante);
        $stmt->bindParam(':id', $id_estudiante);
        $stmt->execute();
        
        if ($stmt->fetch()) {
            Respuestas::error("El código de estudiante ya existe");
        }
        
        // Actualizar
        $query = "UPDATE estudiantes 
                  SET codigo_estudiante = :codigo, carrera = :carrera, semestre = :semestre 
                  WHERE id_estudiante = :id";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':codigo', $codigo_estudiante);
        $stmt->bindParam(':carrera', $carrera);
        $stmt->bindParam(':semestre', $semestre);
        $stmt->bindParam(':id', $id_estudiante);
        
        if ($stmt->execute()) {
            Respuestas::exito("Estudiante actualizado exitosamente");
        } else {
            Respuestas::error("Error al actualizar el estudiante");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

function eliminarEstudiante() {
    Seguridad::verificarRol(['Administrador']);
    
    $id = $_GET['id'] ?? null;
    
    if (!$id) {
        Respuestas::error("ID de estudiante requerido");
    }
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        $query = "DELETE FROM estudiantes WHERE id_estudiante = :id";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                Respuestas::exito("Estudiante eliminado exitosamente");
            } else {
                Respuestas::noEncontrado("Estudiante no encontrado");
            }
        } else {
            Respuestas::error("Error al eliminar el estudiante");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}
?>