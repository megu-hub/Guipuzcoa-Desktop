<?php

class Database {

    private $db;

    public function __construct() {
        $this->db = new mysqli('localhost', 'DBUSER2026', 'DBPWD2026', 'UO299971_DB');

        if ($this->db->connect_error) {
            die("Conexión fallida: " . $this->db->connect_error);
        }

        $this->db->set_charset('utf8mb4');
    }

    // =========================================================
    //  USUARIOS
    // =========================================================

    public function insertarUsuario($dni, $nombre, $apellidos, $email, $password) {
        $stmt = $this->db->prepare("INSERT INTO usuarios (dni, nombre, apellidos, email, password) VALUES (?, ?, ?, ?, ?)");
        if ($stmt === false) die("Error prepare insertarUsuario: " . $this->db->error);
        $stmt->bind_param("sssss", $dni, $nombre, $apellidos, $email, $password);
        if (!$stmt->execute()) die("Error insertarUsuario: " . $stmt->error);
        $stmt->close();
    }

    public function obtenerUsuarioPorEmail($email) {
        $stmt = $this->db->prepare("SELECT * FROM usuarios WHERE email = ?");
        if ($stmt === false) die("Error prepare obtenerUsuarioPorEmail: " . $this->db->error);
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $usuario = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $usuario;
    }

    public function obtenerUsuarioPorId($id) {
        $stmt = $this->db->prepare("SELECT id, dni, nombre, apellidos, email FROM usuarios WHERE id = ?");
        if ($stmt === false) die("Error prepare obtenerUsuarioPorId: " . $this->db->error);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $usuario = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $usuario;
    }

    // =========================================================
    //  TABLAS DE APOYO
    // =========================================================

    public function cargarTiposDesdeCSV($rutaCSV) {
        if (!file_exists($rutaCSV)) die("CSV no encontrado: $rutaCSV");

        $handle = fopen($rutaCSV, 'r');
        if ($handle === false) die("No se pudo abrir el CSV: $rutaCSV");

        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") rewind($handle);

        fgetcsv($handle, 1000, ',');

        $stmt = $this->db->prepare("INSERT IGNORE INTO tipos_recurso (nombre) VALUES (?)");
        if ($stmt === false) die("Error prepare cargarTiposDesdeCSV: " . $this->db->error);

        while (($fila = fgetcsv($handle, 1000, ',')) !== false) {
            [$nombre] = $fila;
            $stmt->bind_param("s", $nombre);
            if (!$stmt->execute()) die("Error al insertar tipo '$nombre': " . $stmt->error);
        }

        $stmt->close();
        fclose($handle);
    }

    public function cargarCategoriasDesdeCSV($rutaCSV) {
        if (!file_exists($rutaCSV)) die("CSV no encontrado: $rutaCSV");

        $handle = fopen($rutaCSV, 'r');
        if ($handle === false) die("No se pudo abrir el CSV: $rutaCSV");

        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") rewind($handle);

        fgetcsv($handle, 1000, ',');

        $stmt = $this->db->prepare("INSERT IGNORE INTO categorias_precio (nombre, precio_min, precio_max) VALUES (?, ?, ?)");
        if ($stmt === false) die("Error prepare cargarCategoriasDesdeCSV: " . $this->db->error);

        while (($fila = fgetcsv($handle, 1000, ',')) !== false) {
            [$nombre, $precio_min, $precio_max] = $fila;
            $precio_min = (float)$precio_min;
            $precio_max = (float)$precio_max;
            $stmt->bind_param("sdd", $nombre, $precio_min, $precio_max);
            if (!$stmt->execute()) die("Error al insertar categoría '$nombre': " . $stmt->error);
        }

        $stmt->close();
        fclose($handle);
    }

    // =========================================================
    //  RECURSOS
    // =========================================================

    public function cargarRecursosDesdeCSV($rutaCSV) {
        if (!file_exists($rutaCSV)) die("CSV no encontrado: $rutaCSV");

        $handle = fopen($rutaCSV, 'r');
        if ($handle === false) die("No se pudo abrir el CSV: $rutaCSV");

        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") rewind($handle);

        fgetcsv($handle, 1000, ',');

        $this->db->query('SET FOREIGN_KEY_CHECKS = 0');
        $this->db->query('TRUNCATE TABLE reservas');
        $this->db->query('TRUNCATE TABLE recursos');
        $this->db->query('SET FOREIGN_KEY_CHECKS = 1');

        $stmt = $this->db->prepare(
            "INSERT INTO recursos (nombre, id_tipo, id_categoria_precio, descripcion, plazas, fecha_inicio, fecha_fin, precio)
             VALUES (?,
                     (SELECT id FROM tipos_recurso    WHERE nombre = ? LIMIT 1),
                     (SELECT id FROM categorias_precio WHERE nombre = ? LIMIT 1),
                     ?, ?, ?, ?, ?)"
        );
        if ($stmt === false) die("Error prepare cargarRecursosDesdeCSV: " . $this->db->error);

        while (($fila = fgetcsv($handle, 1000, ',')) !== false) {
            [$nombre, $tipo, $categoria, $descripcion, $plazas, $fecha_inicio, $fecha_fin, $precio] = $fila;
            $plazas = (int)$plazas;
            $precio = (float)$precio;
            $stmt->bind_param("ssssissd", $nombre, $tipo, $categoria, $descripcion, $plazas, $fecha_inicio, $fecha_fin, $precio);
            if (!$stmt->execute()) die("Error al insertar recurso '$nombre': " . $stmt->error);
        }

        $stmt->close();
        fclose($handle);
    }

    public function obtenerRecursosDisponibles() {
        $result = $this->db->query(
            "SELECT r.*,
                    tr.nombre  AS tipo,
                    cp.nombre  AS categoria_precio,
                    (r.plazas - COALESCE(SUM(CASE WHEN res.estado != 'anulada' THEN res.num_plazas ELSE 0 END), 0)) AS plazas_libres
             FROM recursos r
             INNER JOIN tipos_recurso     tr ON r.id_tipo             = tr.id
             INNER JOIN categorias_precio cp ON r.id_categoria_precio = cp.id
             LEFT  JOIN reservas         res ON r.id                  = res.id_recurso
             WHERE r.fecha_fin >= NOW()
             GROUP BY r.id
             HAVING plazas_libres > 0
             ORDER BY r.fecha_inicio ASC"
        );
        if ($result === false) die("Error obtenerRecursosDisponibles: " . $this->db->error);
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    public function obtenerRecursoPorId($id) {
        $stmt = $this->db->prepare(
            "SELECT r.*, tr.nombre AS tipo, cp.nombre AS categoria_precio
             FROM recursos r
             INNER JOIN tipos_recurso     tr ON r.id_tipo             = tr.id
             INNER JOIN categorias_precio cp ON r.id_categoria_precio = cp.id
             WHERE r.id = ?"
        );
        if ($stmt === false) die("Error prepare obtenerRecursoPorId: " . $this->db->error);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $recurso = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $recurso;
    }

    // =========================================================
    //  RESERVAS
    // =========================================================

    public function calcularPresupuesto($id_recurso, $num_plazas) {
        $recurso = $this->obtenerRecursoPorId($id_recurso);
        if ($recurso === null) die("Recurso no encontrado: $id_recurso");
        return round((float)$recurso['precio'] * $num_plazas, 2);
    }

    public function insertarReserva($id_usuario, $id_recurso, $num_plazas) {
        $precio_total = $this->calcularPresupuesto($id_recurso, $num_plazas);
        $stmt = $this->db->prepare("INSERT INTO reservas (id_usuario, id_recurso, num_plazas, precio_total, estado) VALUES (?, ?, ?, ?, 'confirmada')");
        if ($stmt === false) die("Error prepare insertarReserva: " . $this->db->error);
        $stmt->bind_param("iiid", $id_usuario, $id_recurso, $num_plazas, $precio_total);
        if (!$stmt->execute()) die("Error insertarReserva: " . $stmt->error);
        $stmt->close();
    }

    public function obtenerReservasUsuario($id_usuario) {
        $stmt = $this->db->prepare(
            "SELECT res.id, res.num_plazas, res.precio_total, res.estado, res.created_at,
                    rec.nombre AS recurso_nombre, tr.nombre AS tipo, rec.fecha_inicio, rec.fecha_fin
             FROM reservas res
             INNER JOIN recursos      rec ON res.id_recurso = rec.id
             INNER JOIN tipos_recurso tr  ON rec.id_tipo    = tr.id
             WHERE res.id_usuario = ?
             ORDER BY res.created_at DESC"
        );
        if ($stmt === false) die("Error prepare obtenerReservasUsuario: " . $this->db->error);
        $stmt->bind_param("i", $id_usuario);
        $stmt->execute();
        $reservas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $reservas;
    }

    public function anularReserva($id_reserva, $id_usuario) {
        $stmt = $this->db->prepare("UPDATE reservas SET estado = 'anulada' WHERE id = ? AND id_usuario = ? AND estado != 'anulada'");
        if ($stmt === false) die("Error prepare anularReserva: " . $this->db->error);
        $stmt->bind_param("ii", $id_reserva, $id_usuario);
        if (!$stmt->execute()) die("Error anularReserva: " . $stmt->error);
        $stmt->close();
    }

    public function tablaVacia($tabla) {
        $result = $this->db->query("SELECT COUNT(*) as total FROM `$tabla`");
        return (int)$result->fetch_assoc()['total'] === 0;
    }

    public function __destruct() {
        $this->db->close();
    }
}
