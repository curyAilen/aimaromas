<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Login</title>
    <link rel="stylesheet" href="public/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Jost:wght@300&display=swap" rel="stylesheet">
</head>
<body>

<?php require_once 'nav.php'; ?>

<header>
    <h1 class="title-head">Ingresar</h1>
</header>

<main class="form-layout form-card">
<h2 class="text-form">Disculpe las molestias, por el momento no contamos con sistema de registro.</h2>
    <form method="post" action="#" class="form-card">

        <label>
            Usuario
            <input type="text" name="usuario" disabled>
        </label>

        <label>
            Contraseña
            <input type="password" name="password" disabled>
        </label>

        <button type="submit">Ingresar</button>

    </form>
</main>

<footer>
    <p>&copy; <?php echo date('Y/m'); ?> - Ailen Aldana Cury</p>
</footer>

</body>
</html>
