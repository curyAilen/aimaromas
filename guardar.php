<?php
include 'conexion.php';

// CASO 1: Eliminar comentario (desde ver_consultas.php)
if (isset($_GET['borrar'])) {
    $id = (int)$_GET['borrar'];

    // Eliminar de la base de datos
    $deleteSQL = "DELETE FROM comentarios WHERE id_comentario = $id";
    mysqli_query($conexion, $deleteSQL);

    // Redirigir nuevamente a la lista de consultas
    header("Location: ver_consultas.php");
    exit;
}

// CASO 2: Nuevo comentario (desde el formulario)
if (isset($_POST['nombre'])) {
    $nombre = $_POST['nombre'];
    $comentario = $_POST['comentario'];
    $fecha = date("Y-m-d");

    // nombre del archivo
    $nombreArchivo = "comentario_" . time() . ".txt";
    $ruta = "archivos/" . $nombreArchivo;

    // contenido del archivo
    $contenido = "Nombre: $nombre\n";
    $contenido .= "Fecha: $fecha\n\n";
    $contenido .= $comentario;

    // crear archivo
    if (!file_exists("archivos")) {
        mkdir("archivos");
    }
    file_put_contents($ruta, $contenido);

    // guardar en BD
    $sql = "INSERT INTO comentarios (nombre, comentario, fecha, archivo)
            VALUES ('$nombre', '$comentario', '$fecha', '$nombreArchivo')";
    mysqli_query($conexion, $sql);


    header("Content-Type: text/plain");
    header("Content-Disposition: attachment; filename=$nombreArchivo");
    readfile($ruta);
    exit;
}
?>
