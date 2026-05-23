<?php

class Database {

    private $db;

    public function __construct() {
        $this->db = new mysqli('localhost', 'DBUSER2026', 'DBPSWD2026', 'UO299971_DB');

        if ($this->db->connect_error) {
            die("Conexión fallida: " . $this->db->connect_error);
        }

        $this->db->set_charset('utf8mb4');
    }

    // =========================================================
    //  USUARIOS
    // =========================================================

    public function insertarUsuario($dni, $nombre, $apellidos, $email, $password) {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $this->db->prepare("INSERT INTO usuarios (dni, nombre, apellidos, email, password) VALUES (?, ?, ?, ?, ?)");
        if ($stmt === false) die("Error prepare insertarUsuario: " . $this->db->error);
        $stmt->bind_param("sssss", $dni, $nombre, $apellidos, $email, $hash);
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


    public function cargarRecursosDesdeCSV($rutaCSV) {
        if (!file_exists($rutaCSV)) die("CSV no encontrado: $rutaCSV");

        $handle = fopen($rutaCSV, 'r');
        if ($handle === false) die("No se pudo abrir el CSV: $rutaCSV");

        // Eliminar BOM UTF-8 si existe
        $bom = fread($handle, 3);
        if ($bom !== "\xEF\xBB\xBF") rewind($handle);

        fgetcsv($handle, 1000, ','); // saltar cabecera

        $this->db->query("TRUNCATE TABLE recursos");

        $stmt = $this->db->prepare("INSERT INTO recursos (nombre, tipo, descripcion, plazas, fecha_inicio, fecha_fin, precio) VALUES (?, ?, ?, ?, ?, ?, ?)");
        if ($stmt === false) die("Error prepare cargarRecursosDesdeCSV: " . $this->db->error);

        while (($fila = fgetcsv($handle, 1000, ',')) !== false) {
            [$nombre, $tipo, $descripcion, $plazas, $fecha_inicio, $fecha_fin, $precio] = $fila;
            $plazas = (int)$plazas;
            $precio = (float)$precio;
            $stmt->bind_param("sssissd", $nombre, $tipo, $descripcion, $plazas, $fecha_inicio, $fecha_fin, $precio);
            if (!$stmt->execute()) die("Error al insertar recurso '$nombre': " . $stmt->error);
        }

        $stmt->close();
        fclose($handle);
    }

    public function obtenerRecursosDisponibles() {
        $result = $this->db->query(
            "SELECT r.*, (r.plazas - COALESCE(SUM(CASE WHEN res.estado != 'anulada' THEN res.num_plazas ELSE 0 END), 0)) AS plazas_libres
             FROM recursos r
             LEFT JOIN reservas res ON r.id = res.id_recurso
             WHERE r.fecha_fin >= NOW()
             GROUP BY r.id
             HAVING plazas_libres > 0
             ORDER BY r.fecha_inicio ASC"
        );
        if ($result === false) die("Error obtenerRecursosDisponibles: " . $this->db->error);
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    public function obtenerRecursoPorId($id) {
        $stmt = $this->db->prepare("SELECT * FROM recursos WHERE id = ?");
        if ($stmt === false) die("Error prepare obtenerRecursoPorId: " . $this->db->error);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $recurso = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        return $recurso;
    }


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
                    rec.nombre AS recurso_nombre, rec.tipo, rec.fecha_inicio, rec.fecha_fin
             FROM reservas res
             INNER JOIN recursos rec ON res.id_recurso = rec.id
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

    public function __destruct() {
        $this->db->close();
    }
}