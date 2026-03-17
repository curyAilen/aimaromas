<?php
session_start();
include("conexion.php");

if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin') {
    header("Location: login.php");
    exit();
}

$nombre      = mysqli_real_escape_string($conexion, $_POST['nombre']);
$precio      = $_POST['precio'];
$stock       = $_POST['stock'];
$descripcion = mysqli_real_escape_string($conexion, $_POST['descripcion']);

if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === 0) {
    $temp_img = $_FILES['imagen']['tmp_name'];
    $ext      = pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION);

    $nombre_final = time() . "_" . strtolower(str_replace(" ", "_", $nombre)) . "." . $ext;
    $ruta_destino = "archivos/" . $nombre_final;

    if (move_uploaded_file($temp_img, $ruta_destino)) {
        
        $consulta = "INSERT INTO products (nombre, descripcion, precio, imagen, stock) 
                     VALUES ('$nombre', '$descripcion', '$precio', '$nombre_final', '$stock')";        
        if (mysqli_query($conexion, $consulta)) {
            header("Location: alta_producto.php?ok=1");
            exit();
        } else {
            die("Error en la base de datos: " . mysqli_error($conexion));
        }

    } else {
        die("Error: No se pudo mover el archivo. Verifica que la carpeta 'archivos' tenga permisos.");
    }
} else {
    die("Error: Problema con el archivo subido.");
}

mysqli_close($conexion);
?>