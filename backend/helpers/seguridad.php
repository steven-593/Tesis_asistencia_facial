<?php
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/respuestas.php';

/**
 * Helper de seguridad y autenticación
 */

class Seguridad {
    /**
     * Obtener el token del header Authorization
     */
    public static function obtenerToken() {
        $headers = getallheaders();
        
        if (isset($headers['Authorization'])) {
            $auth = $headers['Authorization'];
            if (preg_match('/Bearer\s(\S+)/', $auth, $matches)) {
                return $matches[1];
            }
        }
        
        return null;
    }

    /**
     * Verificar si el usuario está autenticado
     */
    public static function verificarAutenticacion() {
        $token = self::obtenerToken();
        
        if (!$token) {
            Respuestas::noAutorizado("Token no proporcionado");
        }

        $datos = JWT::verificar($token);
        
        if (!$datos) {
            Respuestas::noAutorizado("Token inválido o expirado");
        }

        return $datos;
    }
    /**
     * Verificar si el usuario tiene un rol específico
     */
    public static function verificarRol($rolesPermitidos) {
        $usuario = self::verificarAutenticacion();
        
        if (!in_array($usuario->nombre_rol, $rolesPermitidos)) {
            Respuestas::error("No tienes permisos para realizar esta acción", 403);
        }

        return $usuario;
    }

    /**
     * Limpiar datos de entrada
     */
    public static function limpiarDatos($datos) {
        if (is_array($datos)) {
            return array_map([self::class, 'limpiarDatos'], $datos);
        }
        return htmlspecialchars(strip_tags(trim($datos)));
    }

    /**
     * Validar email
     */
    public static function validarEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL);
    }
}
?>



