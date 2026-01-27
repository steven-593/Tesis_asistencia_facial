<?php
/**
 * Helper para respuestas JSON estandarizadas
 */

class Respuestas {
    /**
     * Respuesta exitosa
     */
    public static function exito($mensaje, $datos = null) {
        $respuesta = [
            'exito' => true,
            'mensaje' => $mensaje
        ];

        if ($datos !== null) {
            $respuesta['datos'] = $datos;
        }

        self::enviar($respuesta, 200);
    }

    /**
     * Respuesta de error
     */
    public static function error($mensaje, $codigo = 400) {
        $respuesta = [
            'exito' => false,
            'mensaje' => $mensaje
        ];

        self::enviar($respuesta, $codigo);
    }

    /**
     * No autorizado
     */
    public static function noAutorizado($mensaje = "No autorizado") {
        self::error($mensaje, 401);
    }

    /**
     * No encontrado
     */
    public static function noEncontrado($mensaje = "Recurso no encontrado") {
        self::error($mensaje, 404);
    }

    /**
     * Error del servidor
     */
    public static function errorServidor($mensaje = "Error interno del servidor") {
        self::error($mensaje, 500);
    }

    /**
     * Enviar respuesta JSON
     */
    private static function enviar($respuesta, $codigo) {
        http_response_code($codigo);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($respuesta, JSON_UNESCAPED_UNICODE);
        exit;
    }
}
?>