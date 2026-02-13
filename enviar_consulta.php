<?php
include 'conexion.php';

// CASO 1: Marcar como Leído (desde ver_consultas.php)
if (isset($_GET['check'])) {
    $id = (int)$_GET['check'];

    $updateSQL = "UPDATE consultas SET estado = 0 WHERE idConsultas = $id";
    mysqli_query($conexion, $updateSQL);

    // Redirigir nuevamente a la lista de consultas
    header("Location: ver_consultas.php");
    exit;

}

// CASO 2: Nueva Consulta (desde contacto.php)
if (isset($_POST['nombre'])) {
    $nombre = $_POST['nombre'];
    $apellido = $_POST['apellido'];
    $edad = $_POST['edad'];
    $email = $_POST['email'];
    $mensaje = $_POST['mensaje'];

    $insertSQL = "INSERT INTO consultas (nombre, apellido, edad, email, mensaje) VALUES ('$nombre', '$apellido', $edad, '$email', '$mensaje')";
    mysqli_query($conexion, $insertSQL);

    header("Location: contacto.php?ok");
    exit;
}

mysqli_close($conexion);
?>


