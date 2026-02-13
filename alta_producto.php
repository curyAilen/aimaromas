<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AIMA - Cargar Productos</title>
    <link rel="stylesheet" href="public/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Jost:wght@300&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
</head>
<body>

<?php require_once 'nav.php'; ?>

<header>
    <h1 class="title-head">Alta de Productos</h1>
</header>
<main class="form-layout">
    <section class="form-card">
        <h2 class="text-form">Nuevo Producto</h2>
        
        <?php if (isset($_GET['ok'])) { ?>
            <p style="color: green; text-align: center;">¡Producto cargado con éxito!</p>
        <?php
}?>

        <form action="guardar_producto.php" method="POST" enctype="multipart/form-data">
            
            <label for="nombre">Nombre</label>
            <input type="text" name="nombre" id="nombre" placeholder="Nombre del producto" required>

            <label for="precio">Precio</label>
            <input type="number" name="precio" id="precio" placeholder="Ej: 1500" required>

            <label for="descripcion">Descripción</label>
            <textarea name="descripcion" id="descripcion" cols="30" rows="5" placeholder="Detalles del producto..." required></textarea>

            <label for="imagen">Imagen del producto</label>
            <input type="file" name="imagen" id="imagen" accept="image/*" required>

            <button type="submit">Cargar Producto</button>
        </form>
    </section>
</main>

<footer>
    <p>&copy; <?php echo date('Y/m'); ?> - Ailen Aldana Cury</p>
</footer>

</body>
</html>
