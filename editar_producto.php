<?php
session_start();
include 'conexion.php';
if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin') { exit("Acceso denegado"); }

$id = $_POST['id'];
$nombre = $_POST['nombre'];
$precio = $_POST['precio'];
$stock = $_POST['stock'];
$desc = $_POST['descripcion'];

// Lógica de imagen (si se subió una nueva)
if (!empty($_FILES['imagen']['name'])) {
    $img_name = time() . "_" . $_FILES['imagen']['name'];
    move_uploaded_file($_FILES['imagen']['tmp_name'], "archivos/" . $img_name);
    mysqli_query($conexion, "UPDATE products SET imagen = '$img_name' WHERE id = '$id'");
}

$sql = "UPDATE products SET nombre='$nombre', precio='$precio', stock='$stock', descripcion='$desc' WHERE id='$id'";
if (mysqli_query($conexion, $sql)) {
    header("Location: catalogo.php?edit=success");
}
?>