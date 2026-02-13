<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Contacto</title>
    <link rel="stylesheet" href="public/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Jost:wght@300&display=swap" rel="stylesheet">
</head>
<body>

<?php require_once 'nav.php'; ?>

<header>
    <h1 class="title-head">Contacto</h1>
	
</header>

<main class="form-layout">
  <form action="enviar_consulta.php" method="post" class="form-card">
    <label for="nombre">Nombre<input id="nombre" type="text" name="nombre" required>
    </label>
	<label for="apellido">Apellido<input id="apellido" type="text" name="apellido" required>
	</label>
	<label for="edad">edad<input id="edad" type="number" name="edad" required>
	</label>
	<label for="email">Email<input id="email" type="email" name="email" required>
	</label><label for="mensaje">Mensaje<textarea id="mensaje" name="mensaje" rows="4" required></textarea>
	</label>
	<input type="submit" value="enviar">
	<?php if (isset($_GET['ok'])): ?>
	<p class="mensaje">Tu consulta fue enviada correctamente ✅</p> 
	<?php endif; ?>
    </form>

</main>
<div class="btn-center">
    <a href="ver_consultas.php" class="btn-consultas">
        Ver consultas
    </a>
</div>
<footer>
    <p>&copy; <?php echo date('Y/m'); ?> - Ailen Aldana Cury</p>
</footer>

</body>
</html>
