<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consultas</title>
    <link rel="stylesheet" href="public/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Jost:wght@300&display=swap" rel="stylesheet">
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
</head>
<body>

<?php require_once 'nav.php';

include 'conexion.php';
?>

<header>
    <h1 class="title-head">Consultas recibidas</h1>
</header>

<main class="consultas-layout">
<?php
$consultasSQL = "SELECT * FROM consultas WHERE estado = 1";
$resultado = mysqli_query($conexion, $consultasSQL);

if (mysqli_num_rows($resultado) === 0) {
    echo '<p class="consultas-empty">Todavía no hay consultas cargadas.</p>';
}
else {






    
while ($fila = mysqli_fetch_assoc($resultado)) {
        echo '
<section class="consulta-card">

    <a href="enviar_consulta.php?check=' . $fila['idConsultas'] . '" 
       class="btn-delete" 
       title="Marcar como resuelto">
        <i class="fa-solid fa-check"></i>
    </a>

    <h2 class="consulta-title">' . $fila['nombre'] . ' ' . $fila['apellido'] . '</h2>

    <p class="consulta-meta">
        Edad: ' . $fila['edad'] . ' - ' . $fila['email'] . '
    </p>

    <div class="consulta-divider"></div>

    <p class="consulta-message">' . $fila['mensaje'] . '</p>

</section>
';
    }


}
?>
		
</main>

<section>
    <h1 class="title-head">Comentarios recibidos</h1>
</section>

<section class="consultas-layout">
<?php
$comentariosSQL = "SELECT * FROM comentarios";
$resultado = mysqli_query($conexion, $comentariosSQL);

if (mysqli_num_rows($resultado) === 0) {
    echo '<p class="consultas-empty">Todavía no hay comentarios cargadas.</p>';
}
else {






    
while ($fila = mysqli_fetch_assoc($resultado)) {
        echo '
    <section class="consulta-card">
    <a href="guardar.php?borrar=' . $fila['id_comentario'] . '" class="btn-delete" 
       title="Eliminar"
       onclick="return confirm(\'¿Esta seguro que quiere eliminar el comentario? Dicha acción no se puede deshacer.\');">
        <i class="fa-solid fa-trash"></i>
    </a>
        <h2 class="consulta-title">' . $fila['nombre'] . '</h2>
        <p class="consulta-meta">Fecha:' . $fila['fecha'] . '</p>
        <div class="consulta-divider"></div>
        <p class="consulta-message">' . $fila['comentario'] . '</p>
		
    </section>
    ';
    }


}
?>
		
</section>


<footer>
    <p>&copy; <?php echo date('Y/m'); ?> - Ailen Aldana Cury</p>
</footer>

</body>
</html>
