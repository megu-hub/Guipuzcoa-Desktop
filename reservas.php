<?php
session_start();
if (isset($_SESSION['usuario_id'])) {
    header('Location: php/recursos.php');
    exit;
}
?>
<!DOCTYPE HTML>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <title>Guipuzcoa-Reservas</title>
    <meta name="keywords" content="Guipuzcoa, Guipuzcoa-Desktop" />
    <meta name="author" content="Clara Fernández" />
    <meta name="description" content="Reservas para realizar en Guipuzcoa" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="multimedia/icono.ico"/>
    <link rel="stylesheet" type="text/css" href="estilo/estilo.css" />
    <link rel="stylesheet" type="text/css" href="estilo/layout.css" />
</head>
<body>
    <header>
        <h1><a href="index.html" title="Inicio">Guipuzcoa Desktop</a></h1>
        <nav>
            <a href="index.html" title="Inicio">Inicio</a>
            <a href="gastronomia.html" title="Gastronomía de Guipuzcoa">Gastronomía</a>
            <a href="rutas.html" title="Rutas de Guipuzcoa">Rutas</a>
            <a href="meteorologia.html" title="Información de la meteorología">Meteorología</a>
            <a href="juego.html" title="Juego">Juego</a>
            <a href="reservas.php" title="Reservas en Guipuzcoa" class="active">Reservas</a>
            <a href="ayuda.html" title="Información de Ayuda">Ayuda</a>
        </nav>
    </header>

    <p>Estás en:
        <a href="index.html" title="Inicio">Inicio</a> >> <strong>Reservas</strong>
    </p>

    <main>
        <h2>Reservas de Guipuzcoa-Desktop</h2>

        <p>
            Bienvenido al sistema de reservas de Guipuzcoa-Desktop. Aquí puedes reservar
            visitas a museos, rutas de senderismo, restaurantes, hoteles, monumentos y
            actividades en Guipuzcoa.
        </p>

        <p>
            Para realizar o consultar tus reservas necesitas iniciar sesión.
            Si todavía no tienes cuenta, puedes registrarte gratuitamente.
        </p>

        <p>
            <a href="php/login.php" title="Iniciar sesión">Iniciar sesión</a>
            <a href="php/registro.php" title="Crear cuenta nueva">Registrarse</a>
        </p>
    </main>
</body>
</html>