<?php
session_start();
include("conexion.php");
if (isset($_SESSION['admin'])) {
    header("Location: mostrar_contenido.php");
    exit();
}

$error = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = mysqli_real_escape_string($conexion, $_POST['email']);
    $password = $_POST['password'];

    $consulta = "SELECT * FROM users WHERE email = '$email'";
    $resultado = mysqli_query($conexion, $consulta);

    if ($row = mysqli_fetch_assoc($resultado)) {
        if (password_verify($password, $row['password_hash']) || $password === $row['password_hash']) {
            
            $_SESSION['admin'] = $row['nombre'];
            $_SESSION['id_usuario'] = $row['id'];
            $_SESSION['rol'] = $row['rol'];
            
            header("Location: mostrar_contenido.php");
            exit();
        } else {
            $error = "Contraseña incorrecta.";
        }
    } else {
        $error = "El email no está registrado.";
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Ingresar - AIMA</title>
    <link rel="stylesheet" href="public/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Jost:wght@300&display=swap" rel="stylesheet">
    <style>
        .error-msg { color: #721c24; background-color: #f8d7da; padding: 10px; border-radius: 5px; text-align: center; margin-bottom: 15px; }
        .success-msg { color: #155724; background-color: #d4edda; padding: 10px; border-radius: 5px; text-align: center; margin-bottom: 15px; }
    </style>
</head>
<body>

<?php require_once 'nav.php'; ?>

<main class="form-layout form-card mt-5">
    <h1 class="title-head text-center">Ingresar</h1>
    
    <?php if ($error): ?>
        <div class="error-msg"><?php echo $error; ?></div>
    <?php endif; ?>

    <?php if (isset($_GET['msg']) && $_GET['msg'] == 'sesion_cerrada'): ?>
        <div class="success-msg">Has cerrado sesión correctamente.</div>
    <?php endif; ?>

    <form method="post" action="login.php" class="form-card">
        <label>Email <input type="email" name="email" required></label>
        <label>Contraseña <input type="password" name="password" required></label>
        <button type="submit" style="background-color: #5D4037; color: white; border: none; padding: 10px; cursor: pointer;">Entrar</button>
    </form>
</main>

</body>
</html>