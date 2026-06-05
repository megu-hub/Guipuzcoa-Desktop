<?php
session_start();
if (!isset($_SESSION['usuario_id'])) {
    header('Location: login.php');
    exit;
}
require_once 'Database.php';
$db = new Database();
if ($db->tablaVacia('recursos')) {
    $db->cargarTiposDesdeCSV(__DIR__ . '/tipos_recurso.csv');
    $db->cargarCategoriasDesdeCSV(__DIR__ . '/categorias_precio.csv');
    $db->cargarRecursosDesdeCSV(__DIR__ . '/recursos.csv');
}
$recursos = $db->obtenerRecursosDisponibles();
?>
<!DOCTYPE HTML>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <title>Guipuzcoa-Reservas — Recursos disponibles</title>
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

    <p>Estás en: <a href="../index.html">Inicio</a> >> <a href="../reservas.php">Reservas</a> >> <strong>Recursos disponibles</strong></p>

    <main>
        <h2>Recursos turísticos disponibles</h2>
        <?php if (empty($recursos)): ?>
            <p>No hay recursos disponibles en este momento.</p>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Categoría</th>
                        <th>Descripción</th>
                        <th>Plazas libres</th>
                        <th>Inicio</th>
                        <th>Fin</th>
                        <th>Precio</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ($recursos as $r): ?>
                    <tr>
                        <td><?= htmlspecialchars($r['nombre']) ?></td>
                        <td><?= htmlspecialchars($r['tipo']) ?></td>
                        <td><?= htmlspecialchars($r['categoria_precio']) ?></td>
                        <td><?= htmlspecialchars($r['descripcion']) ?></td>
                        <td><?= $r['plazas_libres'] ?></td>
                        <td><?= $r['fecha_inicio'] ?></td>
                        <td><?= $r['fecha_fin'] ?></td>
                        <td><?= number_format($r['precio'], 2) ?> €</td>
                        <td><a href="reservar.php?id=<?= $r['id'] ?>">Reservar</a></td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
        <p><a href="mis_reservas.php">Ver mis reservas</a></p>
    </main>
</body>
</html>
