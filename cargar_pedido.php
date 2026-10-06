<?php
session_start();
include("conexion.php");

// 1. Verificación de seguridad
if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin') {
    header("Location: login.php");
    exit();
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // 2. Captura y limpieza de datos
    $nombre_prod = mysqli_real_escape_string($conexion, $_POST['producto']);
    $cant_pedida = (int)$_POST['cantidad'];
    $metodo_pago = mysqli_real_escape_string($conexion, $_POST['metodo_pago']);
    $nota        = mysqli_real_escape_string($conexion, $_POST['descripcion']);
    $user_id     = $_SESSION['id_usuario'];
    $fecha       = date("Y-m-d H:i:s");

    // 3. Buscamos precio e ID en la tabla 'products'
    $query_p = mysqli_query($conexion, "SELECT id, precio FROM products WHERE nombre = '$nombre_prod'");
    $p_data  = mysqli_fetch_assoc($query_p);
    
    if ($p_data) {
        $id_producto = $p_data['id'];
        $precio_un   = $p_data['precio'];
        $total_pago  = $precio_un * $cant_pedida;

        // 4. Inserción en 'orders' (Cabecera)
        $sql_order = "INSERT INTO orders (user_id, total, estado_pago, metodo_pago, estado, descripcion, created_at) 
                      VALUES ('$user_id', '$total_pago', 'pendiente', '$metodo_pago', 'procesando', '$nota', '$fecha')";
        
        if (mysqli_query($conexion, $sql_order)) {
            $id_pedido_nuevo = mysqli_insert_id($conexion);

            // 5. Inserción en 'order_items' (Detalle)
            $sql_items = "INSERT INTO order_items (order_id, product_id, cantidad, precio_unitario) 
                          VALUES ('$id_pedido_nuevo', '$id_producto', '$cant_pedida', '$precio_un')";
            
            if (mysqli_query($conexion, $sql_items)) {
                
                // --- CAMBIO CLAVE AQUÍ ---
                // Redirigimos al Panel de Administración (mostrar_contenido.php)
                header("Location: mostrar_contenido.php?msj=pedido_ok");
                exit();
                
            } else {
                $error_msj = "Error en detalle: " . mysqli_error($conexion);
            }
        } else {
            $error_msj = "Error en cabecera: " . mysqli_error($conexion);
        }
    } else {
        $error_msj = "Producto no encontrado.";
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>AIMA - Error</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="public/styles.css">
</head>
<body style="background-color: #FDFBF9; font-family: 'Jost', sans-serif; color: #5D4037;">
    <?php require_once 'nav.php'; ?>
    <div class="container mt-5 text-center">
        <div class="card p-5 shadow-sm border-0" style="border-bottom: 5px solid #5D4037;">
            <h2>Hubo un problema</h2>
            <div class="alert alert-danger mt-3"><?php echo $error_msj; ?></div>
            <a href="realizar_pedidos.php" class="btn text-white" style="background-color: #5D4037;">Volver a intentar</a>
        </div>
    </div>
</body>
</html>