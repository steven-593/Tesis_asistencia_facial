<?php
/**
 * Configuración de la Base de Datos
 */

class BaseDatos {
    private $host = "localhost";
    private $usuario = "root";
    private $contrasena = "";
    private $base_datos = "sistema_asistencia_facial";
    private $conexion;

    /**
     * Obtener conexión a la base de datos
     */
    public function conectar() {
        $this->conexion = null;

        try {
            $this->conexion = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->base_datos . ";charset=utf8mb4",
                $this->usuario,
                $this->contrasena
            );
            
            // Configurar PDO
            $this->conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conexion->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
        } catch(PDOException $e) {
            echo "Error de conexión: " . $e->getMessage();
        }

        return $this->conexion;
    }
}
?>