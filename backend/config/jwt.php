<?php
/**
 * Configuración de JWT (JSON Web Tokens)
 */

class JWT {
    // Clave secreta para firmar los tokens (CAMBIAR EN PRODUCCIÓN)
    private static $clave_secreta = "sistema_asistencia_facial_2025_clave_super_secreta";
    
    // Tiempo de expiración (24 horas)
    private static $tiempo_expiracion = 86400; // 24 * 60 * 60

    /**
     * Generar un token JWT
     */
    public static function generar($datos) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        
        $payload = json_encode([
            'iat' => time(),
            'exp' => time() + self::$tiempo_expiracion,
            'data' => $datos
        ]);

        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode($payload);

        $signature = hash_hmac(
            'sha256',
            $base64UrlHeader . "." . $base64UrlPayload,
            self::$clave_secreta,
            true
        );
        $base64UrlSignature = self::base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * Verificar y decodificar un token JWT
     */
    public static function verificar($token) {
        if (empty($token)) {
            return false;
        }

        $partes = explode('.', $token);
        if (count($partes) !== 3) {
            return false;
        }

        list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $partes;

        $signature = self::base64UrlDecode($base64UrlSignature);
        $signatureVerificada = hash_hmac(
            'sha256',
            $base64UrlHeader . "." . $base64UrlPayload,
            self::$clave_secreta,
            true
        );

        if ($signature !== $signatureVerificada) {
            return false;
        }

        $payload = json_decode(self::base64UrlDecode($base64UrlPayload));

        if (!isset($payload->exp) || $payload->exp < time()) {
            return false;
        }

        return $payload->data;
    }

    /**
     * Codificar en Base64 URL
     */
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Decodificar de Base64 URL
     */
    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
?>