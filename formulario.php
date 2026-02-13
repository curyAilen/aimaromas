<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comentarios</title>
    <link rel="stylesheet" href="public/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Jost:wght@300&display=swap" rel="stylesheet">
</head>
<body>

<?php 
require_once 'nav.php'; 
include 'conexion.php';

?>
<main class="form-layout">
  <form action="guardar.php" method="post" class="form-card">
    <label for="nombre">Nombre
	<input id="nombre" type="text" name="nombre" required>
    </label>
	<label for="comentario">Comentario
	<textarea name="comentario" placeholder="Escribí tu comentario" required></textarea>
	</label>
	<input type="submit" value="enviar">
	<?php if (isset($_GET['ok'])): ?>
	<p class="mensaje">Tu comentario fue enviado correctamente ✅</p> 
	<?php endif; ?>
    </form>
</main>


</body>
</html>
