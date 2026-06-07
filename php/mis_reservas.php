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
    <link rel="icon" href="../multimedia/icono.ico"/>
    <link rel="stylesheet" type="text/css" href="../estilo/estilo.css" />
    <link rel="stylesheet" type="text/css" href="../estilo/layout.css" />
</head>
<body>
    <header>
        <h1><a href="../index.html" title="Inicio">Guipuzcoa Desktop</a></h1>
    <nav>
        <a href="../index.html" title="Inicio">Inicio</a>
        <a href="../gastronomia.html" title="Gastronomía de Guipuzcoa">Gastronomía</a>
        <a href="../rutas.html" title="Rutas de Guipuzcoa">Rutas</a>
        <a href="../meteorologia.html" title="Información de la meteorología">Meteorología</a>
        <a href="../juego.html" title="Juego">Juego</a>
        <a href="../reservas.php" title="Reservas en Guipuzcoa" class="active">Reservas</a>
        <a href="../ayuda.html" title="Información de Ayuda">Ayuda</a>
    </nav>
    </header>

    <p>Estás en: <a href="../index.html">Inicio</a> >> <a href="../reservas.php">Reservas</a> >> <strong>Mis reservas</strong></p>

    <main>
        <h2>Mis reservas</h2>
        <?php if (empty($reservas)): ?>
            <p>No tienes reservas todavía.</p>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th scope="col">Recurso</th>
                        <th scope="col">Tipo</th>
                        <th scope="col">Inicio</th>
                        <th scope="col">Fin</th>
                        <th scope="col">Plazas</th>
                        <th scope="col">Total</th>
                        <th scope="col">Estado</th>
                        <th scope="col">Acción</th>
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
        <p><a href="logout.php">Cerrar sesión</a></p>
    </main>
</body>
</html>
