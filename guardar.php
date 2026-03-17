<?php
include 'conexion.php';

if (isset($_GET['borrar'])) {
    $id = (int)$_GET['borrar'];

    $deleteSQL = "DELETE FROM comentarios WHERE id_comentario = $id";
    mysqli_query($conexion, $deleteSQL);

    header("Location: ver_consultas.php");
    exit;
}

if (isset($_POST['nombre'])) {
    $nombre = $_POST['nombre'];
    $comentario = $_POST['comentario'];
    $fecha = date("Y-m-d");

    $nombreArchivo = "comentario_" . time() . ".txt";
    $ruta = "archivos/" . $nombreArchivo;

    $contenido = "Nombre: $nombre\n";
    $contenido .= "Fecha: $fecha\n\n";
    $contenido .= $comentario;

    if (!file_exists("archivos")) {
        mkdir("archivos");
    }
    file_put_contents($ruta, $contenido);

    $sql = "INSERT INTO comentarios (nombre, comentario, fecha, archivo)
            VALUES ('$nombre', '$comentario', '$fecha', '$nombreArchivo')";
    mysqli_query($conexion, $sql);


    header("Content-Type: text/plain");
    header("Content-Disposition: attachment; filename=$nombreArchivo");
    readfile($ruta);
    exit;
}
?>
