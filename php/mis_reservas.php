<?php
session_start();
if (!isset($_SESSION['usuario_id'])) {
    header('Location: login.php');
    exit;
}
require_once 'Database.php';
$db = new Database();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id_reserva'])) {
    $db->anularReserva((int)$_POST['id_reserva'], $_SESSION['usuario_id']);
    header('Location: mis_reservas.php');
    exit;
}

$reservas = $db->obtenerReservasUsuario($_SESSION['usuario_id']);
?>
<!DOCTYPE HTML>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <title>Guipuzcoa-Reservas — Mis reservas</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="multimedia/icono.ico"/>
    <link rel="stylesheet" type="text/css" href="estilo/estilo.css" />
    <link rel="stylesheet" type="text/css" href="estilo/layout.css" />
</head>
<body>
    <header>
        <h1><a href="index.html" title="Inicio">Guipuzcoa Desktop</a></h1>
        <nav>
            <a href="index.html">Inicio</a>
            <a href="gastronomia.html">Gastronomía</a>
            <a href="rutas.html">Rutas</a>
            <a href="meteorologia.html">Meteorología</a>
            <a href="juego.html">Juego</a>
            <a href="reservas.php" class="active">Reservas</a>
            <a href="ayuda.html">Ayuda</a>
        </nav>
    </header>

    <p>Estás en: <a href="index.html">Inicio</a> >> <a href="reservas.php">Reservas</a> >> <strong>Mis reservas</strong></p>

    <main>
        <h2>Mis reservas</h2>
        <?php if (empty($reservas)): ?>
            <p>No tienes reservas todavía.</p>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>Recurso</th>
                        <th>Tipo</th>
                        <th>Inicio</th>
                        <th>Fin</th>
                        <th>Plazas</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ($reservas as $r): ?>
                    <tr>
                        <td><?= htmlspecialchars($r['recurso_nombre']) ?></td>
                        <td><?= htmlspecialchars($r['tipo']) ?></td>
                        <td><?= $r['fecha_inicio'] ?></td>
                        <td><?= $r['fecha_fin'] ?></td>
                        <td><?= $r['num_plazas'] ?></td>
                        <td><?= number_format($r['precio_total'], 2) ?> €</td>
                        <td><?= htmlspecialchars($r['estado']) ?></td>
                        <td>
                            <?php if ($r['estado'] === 'confirmada'): ?>
                                <form method="post" action="mis_reservas.php">
                                    <input type="hidden" name="id_reserva" value="<?= $r['id'] ?>">
                                    <input type="submit" value="Anular">
                                </form>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
        <p><a href="recursos.php">Ver recursos disponibles</a></p>
    </main>
</body>
</html>
