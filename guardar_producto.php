<?php
include 'conexion.php';

// Verificar que se hayan enviado los datos
if (isset($_POST['nombre']) && isset($_POST['precio']) && isset($_POST['descripcion'])) {

    $nombre = $_POST['nombre'];
    $precio = $_POST['precio'];
    $descripcion = $_POST['descripcion'];

    // Manejo de la imagen
    if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === 0) {

        // Crear carpeta archivos si no existe
        if (!file_exists('archivos')) {
            mkdir('archivos', 0777, true);
        }

        // Mover imagen a la carpeta archivos
        $nombreImagen = $_FILES['imagen']['name'];
        $rutaDestino = 'archivos/' . $nombreImagen;

        move_uploaded_file($_FILES['imagen']['tmp_name'], $rutaDestino);

        // Insertar en la base de datos
        $insertSQL = "INSERT INTO productos (nombre, precio, descripcion, imagen) 
                      VALUES ('$nombre', $precio, '$descripcion', '$nombreImagen')";

        $resultado = mysqli_query($conexion, $insertSQL);

        if ($resultado) {
            // Redirigir si se guardó correctamente
            header("Location: alta_producto.php?ok");
            exit;
        }
        else {
            echo "Error al guardar en la base de datos: " . mysqli_error($conexion);
        }

    }
    else {
        echo "Error: Debes subir una imagen válida.";
    }

}
else {
    echo "Faltan datos obligatorios para cargar el producto.";
}

mysqli_close($conexion);
?>
