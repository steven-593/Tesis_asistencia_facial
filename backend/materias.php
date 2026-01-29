<?php
/**
 * Endpoint de Materias
 * CORREGIDO: Solución error "stdClass as array" + Filtro para Estudiantes
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

// --- CORRECCIÓN CRÍTICA ---
// Convertimos la respuesta a (array) para evitar el error "stdClass as array"
$usuario_autenticado = (array) Seguridad::verificarAutenticacion();
$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        obtenerMaterias($usuario_autenticado);
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
 * Obtener materias (Con filtros por Rol)
 */
function obtenerMaterias($usuario) {
    Seguridad::verificarRol(['Administrador', 'Docente', 'Estudiante']);
    
    $id = $_GET['id'] ?? null;
    $accion = $_GET['accion'] ?? 'listar';
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        $filtro = "";
        $params = [];

        // --- FILTRO PARA DOCENTES ---
        if ($usuario['nombre_rol'] === 'Docente') {
            $stmtDoc = $conexion->prepare("SELECT id_docente FROM docentes WHERE id_usuario = :id_usuario");
            $stmtDoc->execute([':id_usuario' => $usuario['id_usuario']]);
            $docente = $stmtDoc->fetch(PDO::FETCH_ASSOC);

            if ($docente) {
                $filtro = " AND m.id_docente = :id_docente_filtro ";
                $params[':id_docente_filtro'] = $docente['id_docente'];
            } else {
                Respuestas::exito("No tienes materias asignadas", []);
                return;
            }
        }
        // --- FILTRO PARA ESTUDIANTES (NUEVO) ---
        elseif ($usuario['nombre_rol'] === 'Estudiante') {
            $stmtEst = $conexion->prepare("SELECT id_estudiante FROM estudiantes WHERE id_usuario = :id_usuario");
            $stmtEst->execute([':id_usuario' => $usuario['id_usuario']]);
            $estudiante = $stmtEst->fetch(PDO::FETCH_ASSOC);

            if ($estudiante) {
                // Filtramos las materias donde el estudiante esté matriculado
                $filtro = " AND m.id_materia IN (SELECT id_materia FROM matriculas WHERE id_estudiante = :id_estudiante_filtro) ";
                $params[':id_estudiante_filtro'] = $estudiante['id_estudiante'];
            } else {
                Respuestas::exito("No estás matriculado en ninguna materia", []);
                return;
            }
        }

        // Consulta Base
        $sqlBase = "SELECT 
                        m.id_materia, 
                        m.nombre_materia, 
                        m.carrera, 
                        m.id_horario,
                        m.id_docente,
                        h.dia, 
                        DATE_FORMAT(h.hora_inicio, '%H:%i') as hora_inicio, 
                        DATE_FORMAT(h.hora_fin, '%H:%i') as hora_fin,
                        COALESCE(CONCAT(u.nombres, ' ', u.apellidos), 'Sin asignar') as nombre_docente
                    FROM materias m 
                    INNER JOIN horarios h ON m.id_horario = h.id_horario 
                    LEFT JOIN docentes d ON m.id_docente = d.id_docente
                    LEFT JOIN usuarios u ON d.id_usuario = u.id_usuario
                    WHERE 1=1 "; 

        if ($accion === 'obtener' && $id) {
            $sql = $sqlBase . " AND m.id_materia = :id " . $filtro;
            $params[':id'] = $id;
            
            $stmt = $conexion->prepare($sql);
            $stmt->execute($params);
            $materia = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($materia) {
                Respuestas::exito("Materia obtenida", $materia);
            } else {
                Respuestas::noEncontrado("Materia no encontrada");
            }

        } else {
            $sql = $sqlBase . $filtro . " ORDER BY m.nombre_materia ASC";
            
            $stmt = $conexion->prepare($sql);
            $stmt->execute($params);
            $materias = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            Respuestas::exito("Materias obtenidas", $materias);
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Crear materia
 */
function crearMateria() {
    Seguridad::verificarRol(['Administrador']);
    
    $datos = json_decode(file_get_contents('php://input'), true);
    
    if (empty($datos['nombre_materia']) || empty($datos['carrera']) || empty($datos['id_horario'])) {
        Respuestas::error("Todos los campos obligatorios son requeridos");
    }
    
    $nombre_materia = Seguridad::limpiarDatos($datos['nombre_materia']);
    $carrera = Seguridad::limpiarDatos($datos['carrera']);
    $id_horario = $datos['id_horario'];
    $id_docente = !empty($datos['id_docente']) ? $datos['id_docente'] : null;
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        $check = $conexion->prepare("SELECT id_materia FROM materias WHERE nombre_materia = ? AND carrera = ? AND id_horario = ?");
        $check->execute([$nombre_materia, $carrera, $id_horario]);
        
        if ($check->fetch()) {
            Respuestas::error("Ya existe esta materia en el mismo horario");
        }
        
        $query = "INSERT INTO materias (nombre_materia, carrera, id_horario, id_docente) 
                  VALUES (:nombre_materia, :carrera, :id_horario, :id_docente)";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':nombre_materia', $nombre_materia);
        $stmt->bindParam(':carrera', $carrera);
        $stmt->bindParam(':id_horario', $id_horario);
        $stmt->bindParam(':id_docente', $id_docente);
        
        if ($stmt->execute()) {
            Respuestas::exito("Materia creada exitosamente", ['id_materia' => $conexion->lastInsertId()]);
        } else {
            Respuestas::error("Error al crear la materia");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Actualizar materia
 */
function actualizarMateria() {
    Seguridad::verificarRol(['Administrador']);
    
    $datos = json_decode(file_get_contents('php://input'), true);
    
    if (empty($datos['id_materia']) || empty($datos['nombre_materia'])) {
        Respuestas::error("Datos incompletos");
    }
    
    $id_materia = $datos['id_materia'];
    $nombre_materia = Seguridad::limpiarDatos($datos['nombre_materia']);
    $carrera = Seguridad::limpiarDatos($datos['carrera']);
    $id_horario = $datos['id_horario'];
    $id_docente = !empty($datos['id_docente']) ? $datos['id_docente'] : null;
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        $query = "UPDATE materias 
                  SET nombre_materia = :nombre_materia, 
                      carrera = :carrera, 
                      id_horario = :id_horario,
                      id_docente = :id_docente
                  WHERE id_materia = :id_materia";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':nombre_materia', $nombre_materia);
        $stmt->bindParam(':carrera', $carrera);
        $stmt->bindParam(':id_horario', $id_horario);
        $stmt->bindParam(':id_docente', $id_docente);
        $stmt->bindParam(':id_materia', $id_materia);
        
        if ($stmt->execute()) {
            Respuestas::exito("Materia actualizada exitosamente");
        } else {
            Respuestas::error("Error al actualizar");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

function eliminarMateria() {
    Seguridad::verificarRol(['Administrador']);
    
    $id = $_GET['id'] ?? null;
    if (!$id) {
        Respuestas::error("ID de materia requerido");
    }
    
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        $check1 = $conexion->prepare("SELECT COUNT(*) FROM matriculas WHERE id_materia = ?");
        $check1->execute([$id]);
        if ($check1->fetchColumn() > 0) Respuestas::error("No se puede eliminar: Tiene alumnos matriculados");

        $check2 = $conexion->prepare("SELECT COUNT(*) FROM asistencias WHERE id_materia = ?");
        $check2->execute([$id]);
        if ($check2->fetchColumn() > 0) Respuestas::error("No se puede eliminar: Tiene asistencias registradas");
        
        $query = "DELETE FROM materias WHERE id_materia = :id";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            Respuestas::exito("Materia eliminada exitosamente");
        } else {
            Respuestas::error("Error al eliminar");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}
?>