<?php
session_start();
include("conexion.php");

// 1. Protección de seguridad: Solo accesible para Administradores
if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin') {
    header("Location: login.php");
    exit();
}

// 2. Consulta de productos disponibles para el desplegable (Solo con stock)
$query_productos = mysqli_query($conexion, "SELECT nombre, stock FROM products WHERE stock > 0 ORDER BY nombre ASC");
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AIMA - Cargar Pedido Manual</title>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="public/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

    <style>
        :root {
            --tierra-oscuro: #5D4037;
            --tierra-medio: #8D6E63;
            --tierra-claro: #D7CCC8;
            --bg-crema: #FDFBF9;
        }

        body {
            background-color: var(--bg-crema);
            font-family: 'Jost', sans-serif;
            color: var(--tierra-oscuro);
        }

        .form-container {
            max-width: 600px;
            margin: 50px auto;
        }

        .form-card {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            border-bottom: 5px solid var(--tierra-oscuro);
        }

        .title-head {
            font-family: 'Poppins', sans-serif;
            text-align: center;
            margin-bottom: 30px;
            color: var(--tierra-oscuro);
        }

        .form-label {
            font-weight: 500;
            margin-bottom: 8px;
        }

        .form-control, .form-select {
            border: 1px solid var(--tierra-claro);
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        .form-control:focus, .form-select:focus {
            border-color: var(--tierra-medio);
            box-shadow: none;
        }

        .btn-tierra {
            background-color: var(--tierra-oscuro);
            color: white;
            border: none;
            padding: 15px;
            font-family: 'Poppins', sans-serif;
            border-radius: 8px;
            width: 100%;
            transition: background 0.3s ease;
        }

        .btn-tierra:hover {
            background-color: var(--tierra-medio);
            color: white;
        }
    </style>
</head>
<body>

<?php require_once 'nav.php'; ?>

<main class="container form-container">
    <section class="form-card">
        <h1 class="title-head">Nuevo Pedido</h1>
        
        <form action="cargar_pedido.php" method="POST">
            
            <label for="producto" class="form-label">Aroma del Producto</label>
            <select name="producto" id="producto" class="form-select" required>
                <option value="" disabled selected>Selecciona un aroma...</option>
                <?php while($p = mysqli_fetch_assoc($query_productos)) { ?>
                    <option value="<?php echo $p['nombre']; ?>">
                        <?php echo strtoupper($p['nombre']); ?> (Stock: <?php echo $p['stock']; ?>)
                    </option>
                <?php } ?>
            </select>

            <label for="cantidad" class="form-label">Cantidad a encargar</label>
            <input type="number" name="cantidad" id="cantidad" class="form-control" min="1" placeholder="Ej: 3" required>

            <label for="metodo_pago" class="form-label">Método de Pago</label>
            <select name="metodo_pago" id="metodo_pago" class="form-select" required>
                <option value="" disabled selected>Selecciona una opción...</option>
                <option value="Efectivo">Efectivo (Retiro en local)</option>
                <option value="Transferencia">Transferencia bancaria</option>
                <option value="Mercado Pago">Mercado Pago</option>
            </select>

            <label for="descripcion" class="form-label">Notas del pedido (Opcional)</label>
            <textarea name="descripcion" id="descripcion" class="form-control" rows="3" placeholder="Detalles de entrega o empaque..."></textarea>

            <button type="submit" class="btn-tierra">
                <i class="fa-solid fa-cart-plus me-2"></i> Confirmar y Registrar Pedido
            </button>

        </form>
    </section>
</main>

<footer class="text-center py-4">
    <p>&copy; <?php echo date('Y'); ?> - AIMA Aromas | Panel de Administración</p>
</footer>

</body>
</html>