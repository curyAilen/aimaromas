<?php
session_start();
// Protección: Solo los admin pueden entrar a esta página
if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin') {
    header("Location: login.php");
    exit();
}
include("conexion.php");
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AIMA - Alta de Productos</title>
    <link rel="stylesheet" href="public/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Jost:wght@300;400&display=swap" rel="stylesheet">
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
        }

        .form-layout {
            display: flex;
            justify-content: center;
            padding: 40px 20px;
        }

        .form-card {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            max-width: 500px;
            width: 100%;
            border-bottom: 5px solid var(--tierra-oscuro);
        }

        .text-form {
            color: var(--tierra-oscuro);
            font-family: 'Poppins', sans-serif;
            margin-bottom: 20px;
            text-align: center;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: var(--tierra-oscuro);
            font-weight: 500;
        }

        input, textarea {
            width: 100%;
            padding: 12px;
            margin-bottom: 20px;
            border: 1px solid var(--tierra-claro);
            border-radius: 8px;
            box-sizing: border-box;
            font-family: 'Jost', sans-serif;
        }

        input:focus {
            outline: none;
            border-color: var(--tierra-medio);
        }

        button[type="submit"] {
            background-color: var(--tierra-oscuro);
            color: white;
            border: none;
            padding: 15px;
            width: 100%;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-family: 'Poppins', sans-serif;
            transition: background 0.3s;
        }

        button[type="submit"]:hover {
            background-color: var(--tierra-medio);
        }

        .alert-success {
            background-color: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
    </style>
</head>
<body>

<?php require_once 'nav.php'; ?>

<header>
    <h1 class="title-head" style="text-align:center; margin-top:30px; color:var(--tierra-oscuro);">Gestión de Inventario</h1>
</header>

<main class="form-layout">
    <section class="form-card">
        <h2 class="text-form">Nuevo Producto</h2>
        
        <?php if (isset($_GET['ok'])) : ?>
            <div class="alert-success">
                <i class="fa fa-check-circle"></i> ¡Producto cargado con éxito!
            </div>
        <?php endif; ?>

        <form action="guardar_producto.php" method="POST" enctype="multipart/form-data">
            
            <label for="nombre">Nombre del Aroma</label>
            <input type="text" name="nombre" id="nombre" placeholder="Ej: Vainilla & Coco" required>

            <div style="display: flex; gap: 15px;">
                <div style="flex: 1;">
                    <label for="precio">Precio Unitario</label>
                    <input type="number" name="precio" id="precio" step="0.01" placeholder="0.00" required>
                </div>
                <div style="flex: 1;">
                    <label for="stock">Stock Inicial</label>
                    <input type="number" name="stock" id="stock" placeholder="Cantidad" required>
                </div>
            </div>

            <label for="descripcion">Descripción</label>
            <textarea name="descripcion" id="descripcion" rows="4" placeholder="Describe las notas olfativas..." required></textarea>

            <label for="imagen">Imagen del producto</label>
            <input type="file" name="imagen" id="imagen" accept="image/*" required>

            <button type="submit">Cargar al Catálogo</button>
        </form>
    </section>
</main>

<footer>
    <p>&copy; <?php echo date('Y'); ?> - Ailen Aldana Cury</p>
</footer>

</body>
</html>