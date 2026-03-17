<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>
<nav class="main-nav">
    <ul class="nav-list">
        <li><a href="index.php">Inicio</a></li>
        <li><a href="catalogo.php">Catálogo</a></li>
        <li><a href="contacto.php">Contacto</a></li>
        <li><a href="formulario.php">Comentarios</a></li>
        <?php if (isset($_SESSION['admin'])): ?>
            
            <?php if (isset($_SESSION['rol']) && $_SESSION['rol'] === 'admin'): ?>
                <li><a href="mostrar_contenido.php">Panel Admin</a></li>
            <?php else: ?>
                <li><a href="realizar_pedidos.php">Carrito</a></li>
            <?php endif; ?>
            
            <li><a href="logout.php">Cerrar Sesión</a></li>
        
        <?php else: ?>
            <li><a href="realizar_pedidos.php">Carrito</a></li>
            <li><a href="login.php">Iniciar Sesión</a></li>
        <?php endif; ?>
    </ul>
</nav>