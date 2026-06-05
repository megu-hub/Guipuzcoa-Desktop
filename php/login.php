<?php
session_start();
require_once 'Database.php';

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $db      = new Database();
    $usuario = $db->obtenerUsuarioPorEmail(trim($_POST['email']));
    if ($usuario && password_verify($_POST['password'], $usuario['password'])) {
        $_SESSION['usuario_id']     = $usuario['id'];
        $_SESSION['usuario_nombre'] = $usuario['nombre'];
        header('Location: ../reservas.php');
        exit;
    }
    $error = 'Email o contraseña incorrectos.';
}
?>
<!DOCTYPE HTML>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <title>Guipuzcoa-Reservas — Login</title>
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

    <p>Estás en: <a href="../index.html">Inicio</a> >> <a href="../reservas.php">Reservas</a> >> <strong>Iniciar sesión</strong></p>

    <main>
        <h2>Iniciar sesión</h2>
        <?php if ($error): ?>
            <p><?= htmlspecialchars($error) ?></p>
        <?php endif; ?>
        <form method="post" action="login.php">
            <p><label>Email:<br><input type="email" name="email" required></label></p>
            <p><label>Contraseña:<br><input type="password" name="password" required></label></p>
            <p><input type="submit" value="Entrar"></p>
        </form>
        <p><a href="registro.php">¿No tienes cuenta? Regístrate</a></p>
    </main>
</body>
</html>
