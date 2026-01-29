<?php
/**
 * Endpoint para Gestión de Rostros
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/base_datos.php';
require_once __DIR__ . '/helpers/respuestas.php';
require_once __DIR__ . '/helpers/seguridad.php';

// Función para log de errores (Para depurar)
function logError($msg) {
    file_put_contents(__DIR__ . '/log_errores.txt', date('Y-m-d H:i:s') . " - " . $msg . "\n", FILE_APPEND);
}

try {
    $usuario = Seguridad::verificarAutenticacion();
    $usuario = (array) $usuario; // Asegurar que sea array
} catch (Exception $e) {
    Respuestas::error("No autorizado: " . $e->getMessage());
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'POST') {
    registrarRostro($usuario);
} elseif ($metodo === 'GET') {
    obtenerRostros();
}

function registrarRostro($usuario) {
    // 1. Validar Roles
    $rol = $usuario['nombre_rol'] ?? '';
    if ($rol !== 'Administrador' && $rol !== 'Estudiante') {
        Respuestas::error("No tienes permisos para registrar rostros.");
        return;
    }
    
    // 2. Recibir Datos
    $inputJSON = file_get_contents('php://input');
    $datos = json_decode($inputJSON, true);
    
    if (empty($datos['image']) || empty($datos['descriptor'])) {
        logError("Faltan datos: Imagen o Descriptor vacíos.");
        Respuestas::error("Faltan datos de la imagen o el descriptor");
        return;
    }

    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        // 3. Obtener ID del Estudiante
        // Si es estudiante, usa su propio ID. Si es admin, debería venir el id_estudiante en el JSON.
        $id_estudiante = 0;

        if ($rol === 'Estudiante') {
            $stmt = $conexion->prepare("SELECT id_estudiante FROM estudiantes WHERE id_usuario = :id_usuario");
            $stmt->execute([':id_usuario' => $usuario['id_usuario']]);
            $estudiante = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$estudiante) {
                Respuestas::error("Perfil de estudiante no encontrado.");
                return;
            }
            $id_estudiante = $estudiante['id_estudiante'];
        } else {
            // Caso Admin registrando a otro (Opcional)
            $id_estudiante = $datos['id_estudiante'] ?? 0;
        }

        // 4. Procesar Imagen
        $imagenBase64 = $datos['image'];
        // Limpiar cabecera del base64 si existe
        if (preg_match('/^data:image\/(\w+);base64,/', $imagenBase64, $type)) {
            $imagenBase64 = substr($imagenBase64, strpos($imagenBase64, ',') + 1);
            $type = strtolower($type[1]); // jpg, png, gif
            if (!in_array($type, [ 'jpg', 'jpeg', 'gif', 'png' ])) {
                Respuestas::error('Tipo de imagen no válido');
                return;
            }
        } else {
            Respuestas::error('Formato de imagen base64 incorrecto');
            return;
        }

        $imagenBase64 = str_replace(' ', '+', $imagenBase64);
        $dataImagen = base64_decode($imagenBase64);

        if ($dataImagen === false) {
            Respuestas::error("Error al decodificar la imagen base64");
            return;
        }
        
        // Crear carpeta si no existe
        $nombreArchivo = 'rostro_' . $id_estudiante . '_' . time() . '.jpg';
        $rutaCarpeta = __DIR__ . '/../uploads/rostros/';
        
        if (!file_exists($rutaCarpeta)) {
            if (!mkdir($rutaCarpeta, 0777, true)) {
                logError("No se pudo crear la carpeta: " . $rutaCarpeta);
                Respuestas::error("Error interno al crear directorio de imágenes.");
                return;
            }
        }
        
        // Guardar archivo físico
        if (file_put_contents($rutaCarpeta . $nombreArchivo, $dataImagen) === false) {
            logError("No se pudo escribir el archivo en: " . $rutaCarpeta . $nombreArchivo);
            Respuestas::error("Error al guardar el archivo de imagen en el servidor.");
            return;
        }

        $rutaPublica = 'uploads/rostros/' . $nombreArchivo;

        // 5. Preparar Descriptor (JSON)
        // Convertimos el array de JS a un string JSON para guardarlo en la columna LONGTEXT
        $descriptorJSON = json_encode($datos['descriptor']);

        // 6. Guardar en Base de Datos
        // Verificar si ya existe para hacer UPDATE o INSERT
        $check = $conexion->prepare("SELECT id_rostro FROM rostros WHERE id_estudiante = :id");
        $check->execute([':id' => $id_estudiante]);
        $existente = $check->fetch();
        
        if ($existente) {
            // UPDATE
            $sql = "UPDATE rostros SET ruta_imagen = :ruta, descriptor = :desc, fecha_registro = NOW() WHERE id_estudiante = :id";
        } else {
            // INSERT
            $sql = "INSERT INTO rostros (id_estudiante, ruta_imagen, descriptor, fecha_registro) VALUES (:id, :ruta, :desc, NOW())";
        }
        
        $stmt = $conexion->prepare($sql);
        $resultado = $stmt->execute([
            ':id' => $id_estudiante,
            ':ruta' => $rutaPublica,
            ':desc' => $descriptorJSON
        ]);
        
        if ($resultado) {
            Respuestas::exito("Rostro registrado correctamente");
        } else {
            logError("Fallo en execute SQL: " . implode(" ", $stmt->errorInfo()));
            Respuestas::error("Error al guardar en base de datos.");
        }
        
    } catch (PDOException $e) {
        logError("Error PDO: " . $e->getMessage());
        Respuestas::errorServidor("Error en BD: " . $e->getMessage());
    }
}

function obtenerRostros() {
    try {
        $db = new BaseDatos();
        $conexion = $db->conectar();
        
        // Solo traer si tienen descriptor
        $sql = "SELECT r.id_estudiante, r.descriptor, CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo 
                FROM rostros r
                INNER JOIN estudiantes e ON r.id_estudiante = e.id_estudiante
                INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
                WHERE r.descriptor IS NOT NULL";
                
        $stmt = $conexion->prepare($sql);
        $stmt->execute();
        $rostros = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Respuestas::exito("Rostros obtenidos", $rostros);
    } catch (PDOException $e) {
        Respuestas::errorServidor("Error: " . $e->getMessage());
    }
}
?>