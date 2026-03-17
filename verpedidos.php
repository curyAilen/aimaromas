<?php
session_start();
include("conexion.php");

if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin') {
    header("Location: login.php");
    exit();
}

// 1. Filtro por Fecha
$where_fecha = "";
if (isset($_GET['fecha']) && !empty($_GET['fecha'])) {
    $fecha_filtro = mysqli_real_escape_string($conexion, $_GET['fecha']);
    $where_fecha = " AND DATE(o.created_at) = '$fecha_filtro'";
}

// 2. Consulta: Quitamos el filtro de 'procesando' para ver TODO el historial
$sql = "SELECT o.id as id_pedido, o.total, o.estado, o.estado_pago, o.metodo_pago, o.created_at, 
               p.nombre as producto, p.imagen, oi.cantidad
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE 1=1 $where_fecha
        ORDER BY o.created_at DESC";

$query = mysqli_query($conexion, $sql);
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>AIMA - Historial de Pedidos</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="public/styles.css">
    <style>
        :root { --tierra: #5D4037; --crema: #FDFBF9; }
        body { background-color: var(--crema); font-family: 'Jost', sans-serif; color: var(--tierra); }
        .table-container { background: white; padding: 25px; border-radius: 15px; shadow: 0 4px 20px rgba(0,0,0,0.05); }
        
        /* ESTILOS DE FILAS SEGÚN ESTADO */
        .fila-finalizada { background-color: rgba(109, 140, 109, 0.15) !important; } /* Verde tenue */
        .fila-cancelada { background-color: rgba(192, 57, 43, 0.1) !important; }    /* Rojo tenue */
        
        .img-pedido { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; }
        .thead-aima { background-color: var(--tierra); color: white; }
    </style>
</head>
<body>

<?php require_once 'nav.php'; ?>

<div class="container mt-5">
    <h2 class="mb-4" style="font-family:'Poppins';">Historial General de Pedidos</h2>

    <div class="card p-3 mb-4 border-0 shadow-sm">
        <form method="GET" class="row g-3 align-items-end">
            <div class="col-md-4">
                <input type="date" name="fecha" class="form-control" value="<?php echo $_GET['fecha'] ?? ''; ?>">
            </div>
            <div class="col-md-2">
                <button type="submit" class="btn w-100 text-white" style="background: var(--tierra);">Filtrar</button>
            </div>
        </form>
    </div>

    <div class="table-container table-responsive">
        <table class="table align-middle">
            <thead class="thead-aima">
                <tr>
                    <th>Imagen</th>
                    <th>Aroma</th>
                    <th>Cant.</th>
                    <th>Total</th>
                    <th>Pago</th>
                    <th>Estado</th>
                    <th class="text-center">Acciones</th>
                </tr>
            </thead>
            <tbody>
                <?php while($row = mysqli_fetch_assoc($query)) { 
                    // Lógica de clases CSS
                    $clase_fila = '';
                    if($row['estado'] == 'finalizado') $clase_fila = 'fila-finalizada';
                    if($row['estado'] == 'cancelado') $clase_fila = 'fila-cancelada';
                ?>
                    <tr class="<?php echo $clase_fila; ?>">
                        <td><img src="archivos/<?php echo $row['imagen']; ?>" class="img-pedido"></td>
                        <td><strong><?php echo strtoupper($row['producto']); ?></strong></td>
                        <td><?php echo $row['cantidad']; ?></td>
                        <td>$<?php echo number_format($row['total'], 2, ',', '.'); ?></td>
                        
                        <td>
                            <?php 
                            if($row['estado'] == 'cancelado'):
                                echo '<span class="badge bg-secondary">CANCELADO</span>';
                            elseif($row['estado_pago'] == 'pagado'):
                                echo '<span class="badge bg-success">PAGADO</span>';
                            else:
                                echo '<span class="badge bg-warning text-dark">PENDIENTE</span>';
                            endif;
                            ?>
                        </td>

                        <td><small class="fw-bold"><?php echo strtoupper($row['estado']); ?></small></td>

                        <td class="text-center">
                            <?php if($row['estado'] == 'procesando'): ?>
                                <div class="d-flex gap-2 justify-content-center">
                                    <a href="cambiar_estado.php?id=<?php echo $row['id_pedido']; ?>&pago=pagado" class="btn btn-sm btn-outline-dark"><i class="fas fa-dollar-sign"></i></a>
                                    <a href="cambiar_estado.php?id=<?php echo $row['id_pedido']; ?>&nuevo_estado=finalizado" class="btn btn-sm btn-success"><i class="fas fa-check"></i></a>
                                    <a href="cambiar_estado.php?id=<?php echo $row['id_pedido']; ?>&nuevo_estado=cancelado" class="btn btn-sm btn-danger" onclick="return confirm('¿Cancelar?')"><i class="fas fa-times"></i></a>
                                </div>
                            <?php else: ?>
                                <span class="text-muted small">Sin acciones</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php } ?>
            </tbody>
        </table>
    </div>
</div>

</body>
</html>