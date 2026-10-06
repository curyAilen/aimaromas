<?php
session_start();
include("conexion.php");

// Seguridad: Solo Admin
if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin') {
    header("Location: login.php");
    exit();
}

if (isset($_GET['id'])) {
    $id = (int)$_GET['id'];

    if (isset($_GET['nuevo_estado'])) {
        $estado = mysqli_real_escape_string($conexion, $_GET['nuevo_estado']);
        $sql = "UPDATE orders SET estado = '$estado' WHERE id = $id";
    } 

    elseif (isset($_GET['pago'])) {
        $pago = mysqli_real_escape_string($conexion, $_GET['pago']);
        $sql = "UPDATE orders SET estado_pago = '$pago' WHERE id = $id";
    }

    if (mysqli_query($conexion, $sql)) {
        header("Location: verpedidos.php?msj=actualizado");
    } else {
        echo "Error al actualizar: " . mysqli_error($conexion);
    }
} else {
    header("Location: verpedidos.php");
}
?>