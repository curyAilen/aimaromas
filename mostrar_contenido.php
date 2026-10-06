<?php
session_start();
if (!isset($_SESSION['admin'])) {
    header("Location: login.php");
    exit();
}
include("conexion.php");
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Dashboard - AIMA Aromas</title>
    <link rel="stylesheet" href="public/styles.css">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600&family=Jost:wght@300;400&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --color-tierra-oscuro: #5D4037; /* Marrón café */
            --color-tierra-medio: #8D6E63;  /* Arena oscura */
            --color-tierra-claro: #D7CCC8;  /* Crema/Beige */
            --color-acento: #A1887F;        /* Arcilla */
            --bg-crema: #FDFBF9;            /* Fondo suave */
        }

        body {
            background-color: var(--bg-crema);
            font-family: 'Jost', sans-serif;
            color: var(--color-tierra-oscuro);
        }

        .title-head {
            font-family: 'Poppins', sans-serif;
            color: var(--color-tierra-oscuro);
            font-weight: 600;
        }

        /* Estilo de Tarjetas */
        .card-aima {
            border: none;
            border-bottom: 4px solid var(--color-tierra-medio);
            transition: transform 0.3s ease;
            background-color: #fff;
        }

        .card-aima:hover {
            transform: translateY(-5px);
        }

        .card-aima .card-title {
            color: var(--color-tierra-oscuro);
            font-family: 'Poppins', sans-serif;
        }

        /* Botones Personalizados */
        .btn-tierra {
            background-color: var(--color-tierra-oscuro);
            color: #fff;
            border: none;
        }

        .btn-tierra:hover {
            background-color: var(--color-tierra-medio);
            color: #fff;
        }

        .btn-outline-tierra {
            border: 1px solid var(--color-tierra-oscuro);
            color: var(--color-tierra-oscuro);
        }

        .btn-outline-tierra:hover {
            background-color: var(--color-tierra-claro);
            color: var(--color-tierra-oscuro);
        }

        .table-aima {
            background: white;
            border-radius: 10px;
            overflow: hidden;
        }

        .badge-stock {
            background-color: var(--color-tierra-claro);
            color: var(--color-tierra-oscuro);
        }
    </style>
</head>
<body>

<?php require_once 'nav.php'; ?>

<div class="container mt-5">
    <div class="row align-items-center mb-5">
        <div class="col-md-8">
            <h1 class="title-head">Panel de Administración</h1>
            <p class="text-muted">Hola, <strong><?php echo $_SESSION['admin']; ?></strong>. Estas son las novedades de hoy.</p>
        </div>
        <div class="col-md-4 text-md-end">
            <span class="badge p-2 badge-stock text-uppercase">Sesión Activa: Administrador</span>
        </div>
    </div>

    <div class="row text-center">
        <div class="col-md-4 mb-4">
            <div class="card card-aima shadow-sm h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title mt-2 mb-3">📦 PRODUCTOS</h5>
                    <p class="text-muted small flex-grow-1">Gestiona el catálogo de AIMA, edita aromas y controla el inventario.</p>
                    <a href="alta_producto.php" class="btn btn-tierra w-100 mb-2">Nuevo Producto</a>
                    <a href="catalogo.php" class="btn btn-outline-tierra w-100">Ver Catálogo</a>
                </div>
            </div>
        </div>

        <div class="col-md-4 mb-4">
            <div class="card card-aima shadow-sm h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title mt-2 mb-3">🛍️ PEDIDOS</h5>
                    <p class="text-muted small flex-grow-1">Revisa las compras de tus clientes y gestiona estados de entrega.</p>
                    <a href="realizar_pedidos.php" class="btn btn-tierra w-100 mb-2">Cargar Pedido</a>
                    <a href="verpedidos.php" class="btn btn-outline-tierra w-100">Ver Pendientes</a>
                </div>
            </div>
        </div>

        <div class="col-md-4 mb-4">
            <div class="card card-aima shadow-sm h-100">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title mt-2 mb-3">✅ FINALIZADOS</h5>
                    <p class="text-muted small flex-grow-1">Consulta el historial completo de ventas cerradas y entregadas.</p>
                    <a href="finalizarpedidos.php" class="btn btn-tierra w-100">Ver Historial</a>
                </div>
            </div>
        </div>
    </div>

    <div class="row mt-5">
        <div class="col-12">
            <div class="card border-0 shadow-sm table-aima">
                <div class="card-header bg-white py-3">
                    <h5 class="mb-0 title-head" style="font-size: 1.1rem;">Resumen de Stock Crítico</h5>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0 align-middle">
                            <thead style="background-color: var(--color-tierra-claro);">
                                <tr>
                                    <th class="ps-4">Producto</th>
                                    <th>Stock</th>
                                    <th>Precio</th>
                                    <th class="text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $res = mysqli_query($conexion, "SELECT nombre, stock, precio FROM products LIMIT 5");
                                while($p = mysqli_fetch_assoc($res)) {
                                    $claseStock = ($p['stock'] < 5) ? 'text-danger fw-bold' : 'text-success';
                                    echo "<tr>
                                            <td class='ps-4'>".strtoupper($p['nombre'])."</td>
                                            <td class='$claseStock'>{$p['stock']} u.</td>
                                            <td>$".number_format($p['precio'], 2, ',', '.')."</td>
                                            <td class='text-center'><span class='badge' style='background-color: var(--color-acento);'>Activo</span></td>
                                          </tr>";
                                }
                                ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<footer class="mt-5 py-5 text-center" style="background-color: var(--color-tierra-claro); color: var(--color-tierra-oscuro);">
    <p class="mb-0"><strong>AIMA Aromas</strong> &copy; <?php echo date('Y'); ?> | Diseñado por Ailen Aldana Cury</p>
</footer>

</body>
</html>