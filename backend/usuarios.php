<?php
/**
 * Endpoint de Usuarios
 * CRUD completo corregido
 */

// 1. HEADERS CORS (Indispensables para que React pueda comunicarse)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// 2. Manejo de peticiones OPTIONS (Preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/base_datos.php';
require_once __DIR__ . '/helpers/respuestas.php';
require_once __DIR__ . '/helpers/seguridad.php';

// Verificar autenticación
$usuario_autenticado = Seguridad::verificarAutenticacion();

// Obtener método HTTP
$metodo = $_SERVER['REQUEST_METHOD'];

// Procesar según el método
switch ($metodo) {
    case 'GET':
        obtenerUsuarios();
        break;
    case 'POST':
        crearUsuario();
        break;
    case 'PUT':
        actualizarUsuario();
        break;
    case 'DELETE':
        eliminarUsuario();
        break;
    default:
        Respuestas::error("Método no permitido");
}

/**
 * Obtener todos los usuarios o uno específico
 */
function obtenerUsuarios() {
    Seguridad::verificarRol(['Administrador']);

    $id = $_GET['id'] ?? null;
    $accion = $_GET['accion'] ?? 'listar';

    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();

        if ($accion === 'obtener' && $id) {
            $query = "SELECT u.*, r.nombre_rol 
                      FROM usuarios u 
                      INNER JOIN roles r ON u.id_rol = r.id_rol 
                      WHERE u.id_usuario = :id";
            
            $stmt = $conexion->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            $usuario = $stmt->fetch();
            
            if ($usuario) {
                unset($usuario['contrasena']);
                Respuestas::exito("Usuario obtenido", $usuario);
            } else {
                Respuestas::noEncontrado("Usuario no encontrado");
            }
        } else {
            $query = "SELECT u.*, r.nombre_rol 
                      FROM usuarios u 
                      INNER JOIN roles r ON u.id_rol = r.id_rol 
                      ORDER BY u.id_usuario DESC";
            
            $stmt = $conexion->prepare($query);
            $stmt->execute();
            $usuarios = $stmt->fetchAll();
            
            foreach ($usuarios as &$usuario) {
                unset($usuario['contrasena']);
            }
            
            Respuestas::exito("Usuarios obtenidos", $usuarios);
        }

    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Crear un nuevo usuario
 */
function crearUsuario() {
    Seguridad::verificarRol(['Administrador']);

    $datos = json_decode(file_get_contents('php://input'), true);

    if (empty($datos['nombres']) || empty($datos['apellidos']) || 
        empty($datos['correo']) || empty($datos['contrasena']) || empty($datos['id_rol'])) {
        Respuestas::error("Todos los campos son requeridos");
    }

    $nombres = Seguridad::limpiarDatos($datos['nombres']);
    $apellidos = Seguridad::limpiarDatos($datos['apellidos']);
    $correo = Seguridad::limpiarDatos($datos['correo']);
    $contrasena = $datos['contrasena'];
    $id_rol = $datos['id_rol'];
    $estado = $datos['estado'] ?? 'Activo';

    if (!Seguridad::validarEmail($correo)) {
        Respuestas::error("Email no válido");
    }

    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();

        // Verificar duplicado
        $query = "SELECT id_usuario FROM usuarios WHERE correo = :correo";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':correo', $correo);
        $stmt->execute();

        if ($stmt->fetch()) {
            Respuestas::error("El correo ya está registrado");
        }

        $contrasena_hash = password_hash($contrasena, PASSWORD_DEFAULT);

        $query = "INSERT INTO usuarios (id_rol, nombres, apellidos, correo, contrasena, estado) 
                  VALUES (:id_rol, :nombres, :apellidos, :correo, :contrasena, :estado)";
        
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id_rol', $id_rol);
        $stmt->bindParam(':nombres', $nombres);
        $stmt->bindParam(':apellidos', $apellidos);
        $stmt->bindParam(':correo', $correo);
        $stmt->bindParam(':contrasena', $contrasena_hash);
        $stmt->bindParam(':estado', $estado);
        
        if ($stmt->execute()) {
            Respuestas::exito("Usuario creado exitosamente", [
                'id_usuario' => $conexion->lastInsertId()
            ]);
        } else {
            Respuestas::error("Error al crear el usuario");
        }

    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Actualizar un usuario
 */
function actualizarUsuario() {
    Seguridad::verificarRol(['Administrador']);

    $datos = json_decode(file_get_contents('php://input'), true);

    if (empty($datos['id_usuario']) || empty($datos['nombres']) || empty($datos['id_rol'])) {
        Respuestas::error("ID, nombres y rol son requeridos");
    }

    $id_usuario = $datos['id_usuario'];
    $nombres = Seguridad::limpiarDatos($datos['nombres']);
    $apellidos = Seguridad::limpiarDatos($datos['apellidos']);
    $correo = Seguridad::limpiarDatos($datos['correo']);
    $id_rol = $datos['id_rol'];
    $estado = $datos['estado'] ?? 'Activo';
    $contrasena = $datos['contrasena'] ?? null;

    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();

        // Construcción dinámica de la query
        if ($contrasena) {
            $contrasena_hash = password_hash($contrasena, PASSWORD_DEFAULT);
            $query = "UPDATE usuarios SET id_rol=:id_rol, nombres=:nombres, apellidos=:apellidos, 
                      correo=:correo, contrasena=:contrasena, estado=:estado WHERE id_usuario=:id";
        } else {
            $query = "UPDATE usuarios SET id_rol=:id_rol, nombres=:nombres, apellidos=:apellidos, 
                      correo=:correo, estado=:estado WHERE id_usuario=:id";
        }

        $stmt = $conexion->prepare($query);
        if ($contrasena) $stmt->bindParam(':contrasena', $contrasena_hash);
        
        $stmt->bindParam(':id_rol', $id_rol);
        $stmt->bindParam(':nombres', $nombres);
        $stmt->bindParam(':apellidos', $apellidos);
        $stmt->bindParam(':correo', $correo);
        $stmt->bindParam(':estado', $estado);
        $stmt->bindParam(':id', $id_usuario);

        if ($stmt->execute()) {
            Respuestas::exito("Usuario actualizado");
        } else {
            Respuestas::error("Error al actualizar");
        }

    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}

/**
 * Eliminar un usuario
 */
function eliminarUsuario() {
    Seguridad::verificarRol(['Administrador']);
    $id = $_GET['id'] ?? null;

    if (!$id) Respuestas::error("ID requerido");

    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();

        $query = "DELETE FROM usuarios WHERE id_usuario = :id";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute() && $stmt->rowCount() > 0) {
            Respuestas::exito("Usuario eliminado");
        } else {
            Respuestas::error("No se pudo eliminar");
        }
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}