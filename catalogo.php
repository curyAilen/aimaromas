<?php
session_start();
include 'conexion.php';
const IVA = 0.21;

if (isset($_POST['agregar_carrito'])) {
    if (!isset($_SESSION['id_usuario'])) {
        header("Location: login.php");
        exit();
    }
    $p_id = $_POST['product_id'];
    $u_id = $_SESSION['id_usuario'];
    $check = mysqli_query($conexion, "SELECT id FROM carrito WHERE user_id = '$u_id' AND product_id = '$p_id'");
    if (mysqli_num_rows($check) > 0) {
        mysqli_query($conexion, "UPDATE carrito SET cantidad = cantidad + 1 WHERE user_id = '$u_id' AND product_id = '$p_id'");
    } else {
        mysqli_query($conexion, "INSERT INTO carrito (user_id, product_id, cantidad) VALUES ('$u_id', '$p_id', 1)");
    }
}

$busqueda = isset($_GET['buscar']) ? trim($_GET['buscar']) : '';
$sql = "SELECT * FROM products"; 
if ($busqueda !== '') {
    $search = mysqli_real_escape_string($conexion, $busqueda);
    $sql .= " WHERE nombre LIKE '%$search%' OR descripcion LIKE '%$search%'";
}
$resultado = mysqli_query($conexion, $sql);
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Catálogo AIMA</title>
    <link rel="stylesheet" href="public/styles.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        
        .product-card { position: relative; border: 1px solid #D7CCC8; padding: 15px; background: #fff; }
        .out-of-stock-overlay {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(255,255,255,0.7); display: flex; align-items: center;
            justify-content: center; z-index: 10; color: #5D4037; font-weight: bold; font-size: 1.5rem;
        }
        .btn-aima { background: #5D4037; color: white; border: none; }
        .btn-aima:hover { background: #8D6E63; color: white; }
    </style>
</head>
<body>
<?php require_once 'nav.php'; ?>

<main id="catalogo" class="container mt-5">
    <div class="product-layout row">
    <?php while ($producto = mysqli_fetch_assoc($resultado)) { 
        $sinStock = ($producto['stock'] <= 0);
        $esAdmin = (isset($_SESSION['rol']) && $_SESSION['rol'] === 'admin');
    ?>
        <div class="col-md-4 mb-4">
            <section class="product-card h-100">
                <?php if ($sinStock): ?>
                    <div class="out-of-stock-overlay">SIN STOCK</div>
                <?php endif; ?>

                <h2 class="product-title"><?php echo strtoupper($producto['nombre']); ?></h2>
                <figure class="product-media text-center">
                    <img src="archivos/<?php echo $producto['imagen']; ?>" class="img-fluid" style="height: 200px; object-fit: cover;">
                </figure>

                <div class="product-pricing mt-3">
                    <p><strong>Precio + IVA:</strong> $<?php echo number_format($producto['precio'] * (1 + IVA), 2); ?></p>
                    <p class="small text-muted">Stock disponible: <?php echo $producto['stock']; ?> u.</p>
                </div>

                <?php if ($esAdmin): ?>
                    <button class="btn btn-warning w-100" data-bs-toggle="modal" data-bs-target="#editModal<?php echo $producto['id']; ?>">
                        <i class="fa fa-edit"></i> Editar Producto
                    </button>
                <?php else: ?>
                    <form method="post">
                        <input type="hidden" name="product_id" value="<?php echo $producto['id']; ?>">
                        <button type="submit" name="agregar_carrito" class="btn btn-aima w-100" <?php echo ($sinStock) ? 'disabled' : ''; ?>>
                            <i class="fa fa-shopping-cart"></i> Agregar
                        </button>
                    </form>
                <?php endif; ?>
            </section>
        </div>

        <?php if ($esAdmin): ?>
        <div class="modal fade" id="editModal<?php echo $producto['id']; ?>" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <form action="editar_producto.php" method="POST" enctype="multipart/form-data" class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Editar <?php echo $producto['nombre']; ?></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" name="id" value="<?php echo $producto['id']; ?>">
                        <div class="mb-3">
                            <label>Nombre</label>
                            <input type="text" name="nombre" class="form-control" value="<?php echo $producto['nombre']; ?>" required>
                        </div>
                        <div class="mb-3">
                            <label>Precio</label>
                            <input type="number" step="0.01" name="precio" class="form-control" value="<?php echo $producto['precio']; ?>" required>
                        </div>
                        <div class="mb-3">
                            <label>Stock</label>
                            <input type="number" name="stock" class="form-control" value="<?php echo $producto['stock']; ?>" required>
                        </div>
                        <div class="mb-3">
                            <label>Descripción</label>
                            <textarea name="descripcion" class="form-control"><?php echo $producto['descripcion']; ?></textarea>
                        </div>
                        <div class="mb-3">
                            <label>Cambiar Imagen (opcional)</label>
                            <input type="file" name="imagen" class="form-control">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="submit" class="btn btn-success">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
        <?php endif; ?>

    <?php } ?>
    </div>
</main>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
