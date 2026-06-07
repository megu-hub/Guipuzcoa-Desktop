<?php
session_start();
require_once 'Database.php';

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $db = new Database();
    $db->insertarUsuario(
        trim($_POST['dni']),
        trim($_POST['nombre']),
        trim($_POST['apellidos']),
        trim($_POST['email']),
        password_hash($_POST['password'], PASSWORD_DEFAULT)
    );
    $usuario = $db->obtenerUsuarioPorEmail(trim($_POST['email']));
    $_SESSION['usuario_id']     = $usuario['id'];
    $_SESSION['usuario_nombre'] = $usuario['nombre'];
    header('Location: ../reservas.php');
    exit;
}
?>
<!DOCTYPE HTML>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <title>Guipuzcoa-Reservas — Registro</title>
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

    <p>Estás en: <a href="../index.html">Inicio</a> >> <a href="../reservas.php">Reservas</a> >> <strong>Registro</strong></p>

    <main>
        <h2>Registro de usuario</h2>
        <form method="post" action="registro.php">
            <p><label>DNI:<br><input type="text" name="dni" maxlength="9" required></label></p>
            <p><label>Nombre:<br><input type="text" name="nombre" required></label></p>
            <p><label>Apellidos:<br><input type="text" name="apellidos" required></label></p>
            <p><label>Email:<br><input type="email" name="email" required></label></p>
            <p><label>Contraseña:<br><input type="password" name="password" required></label></p>
            <p><input type="submit" value="Registrarse"></p>
        </form>
        <p><a href="login.php">¿Ya tienes cuenta? Inicia sesión</a></p>
    </main>
</body>
</html>
