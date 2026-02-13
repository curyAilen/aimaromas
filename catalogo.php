<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Catálogo</title>
    <link rel="stylesheet" href="public/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Jost:wght@300&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
</head>
<body>

<?php require_once 'nav.php'; ?>

<header>
    <h1 class="title-head">Wax Melts</h1>
</header>

<?php
include 'conexion.php';

const IVA = 0.21;

$busqueda = isset($_GET['buscar']) ? trim($_GET['buscar']) : '';

// Preparar consulta SQL
$sql = "SELECT * FROM productos";

if ($busqueda !== '') {
    // Si hay búsqueda, filtrar por nombre o descripción (usamos descripción como 'aroma' aproxi.)
    $search = mysqli_real_escape_string($conexion, $busqueda);
    $sql .= " WHERE nombre LIKE '%$search%' OR descripcion LIKE '%$search%'";
}

$resultado = mysqli_query($conexion, $sql);
?>

<form method="get" class="search-form">
    <span class="search-label">¿Qué aroma buscar?</span>

    <input
        type="text"
        name="buscar"
        placeholder="Ej: vainilla, manzana..."
        value="<?php echo htmlspecialchars($busqueda, ENT_QUOTES); ?>"
    >

    <button type="submit">Buscar</button>
    <a href="catalogo.php" class="search-reset">Reset</a>
</form>


<main id="catalogo" class="product-layout">

    <?php
if (mysqli_num_rows($resultado) > 0) {
    while ($producto = mysqli_fetch_assoc($resultado)) {
?>
            <section class="product-card">
                <h2 class="product-title"><?php echo $producto['nombre']; ?></h2>
                <h3 class="product-subtitle"><?php echo $producto['descripcion']; ?></h3>

                <figure class="product-media">
                    <img src="archivos/<?php echo $producto['imagen']; ?>" alt="<?php echo $producto['nombre']; ?>" class="product-image">
                </figure>

                <div class="product-pricing">
                    <span class="product-price-label">Precio:</span>
                    <span class="product-price">$<?php echo number_format($producto['precio'], 2); ?></span>

                    <span class="product-iva-label">IVA: $<?php echo number_format($producto['precio'] * IVA, 2); ?></span>
                    <span class="product-iva">
                        $<?php echo number_format($producto['precio'] + ($producto['precio'] * IVA), 2); ?>
                    </span>
                </div>
            </section>
    <?php
    }
}
else {
    echo '<p class="consultas-empty" style="width:100%;">No se encontraron productos.</p>';
}
?>
</main>

<footer>
    <p>&copy; <?php echo date('Y/m'); ?> - Ailen Aldana Cury</p>
</footer>

</body>
</html>
