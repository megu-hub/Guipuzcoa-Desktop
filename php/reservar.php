<?php
session_start();
if (!isset($_SESSION['usuario_id'])) {
    header('Location: login.php');
    exit;
}
require_once 'Database.php';
$db = new Database();

$id_recurso = (int)($_GET['id'] ?? 0);
$recurso    = $db->obtenerRecursoPorId($id_recurso);
if (!$recurso) {
    header('Location: recursos.php');
    exit;
}

$num_plazas  = 0;
$presupuesto = 0;
$paso        = 1;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $num_plazas = (int)$_POST['num_plazas'];
    if (isset($_POST['confirmar'])) {
        $db->insertarReserva($_SESSION['usuario_id'], $id_recurso, $num_plazas);
        header('Location: mis_reservas.php');
        exit;
    }
    $presupuesto = $db->calcularPresupuesto($id_recurso, $num_plazas);
    $paso        = 2;
}
?>
<!DOCTYPE HTML>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <title>Guipuzcoa-Reservas — Reservar</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="../multimedia/icono.ico"/>
    <link rel="stylesheet" type="text/css" href="../estilo/estilo.css" />
    <link rel="stylesheet" type="text/css" href="../estilo/layout.css" />
</head>
<body>
    <header>
        <h1><a href="../index.html" title="Inicio">Guipuzcoa Desktop</a></h1>
        <nav>
            <a href="../index.html">Inicio</a>
            <a href="../gastronomia.html">Gastronomía</a>
            <a href="../rutas.html">Rutas</a>
            <a href="../meteorologia.html">Meteorología</a>
            <a href="../juego.html">Juego</a>
            <a href="../reservas.php" class="active">Reservas</a>
            <a href="../ayuda.html">Ayuda</a>
        </nav>
    </header>

    <p>Estás en: <a href="../index.html">Inicio</a> >> <a href="../reservas.php">Reservas</a> >> <a href="recursos.php">Recursos</a> >> <strong>Reservar</strong></p>

    <main>
        <h2><?= htmlspecialchars($recurso['nombre']) ?></h2>
        <p><strong>Tipo:</strong> <?= htmlspecialchars($recurso['tipo']) ?></p>
        <p><?= htmlspecialchars($recurso['descripcion']) ?></p>
        <p><strong>Inicio:</strong> <?= $recurso['fecha_inicio'] ?>; <strong>Fin:</strong> <?= $recurso['fecha_fin'] ?></p>
        <p><strong>Precio por plaza:</strong> <?= number_format($recurso['precio'], 2) ?> €</p>

        <?php if ($paso === 2): ?>
            <h3>Presupuesto</h3>
            <p><?= $num_plazas ?> plaza(s) * <?= number_format($recurso['precio'], 2) ?> € = <strong><?= number_format($presupuesto, 2) ?> €</strong></p>
            <form method="post" action="reservar.php?id=<?= $id_recurso ?>">
                <input type="hidden" name="num_plazas" value="<?= $num_plazas ?>">
                <input type="hidden" name="confirmar" value="1">
                <p>
                    <input type="submit" value="Confirmar reserva">
                    <a href="reservar.php?id=<?= $id_recurso ?>">Cancelar</a>
                </p>
            </form>
        <?php else: ?>
            <form method="post" action="reservar.php?id=<?= $id_recurso ?>">
                <p><label>Número de plazas:<br><input type="number" name="num_plazas" min="1" value="1" required></label></p>
                <p><input type="submit" value="Ver presupuesto"></p>
            </form>
        <?php endif; ?>
        <p><a href="logout.php">Cerrar sesión</a></p>
    </main>
</body>
</html>
