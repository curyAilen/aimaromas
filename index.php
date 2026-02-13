<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integradora Modulo 1</title>
    <link rel="stylesheet" href="public/styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Jost:wght@300&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
</head>
<body>

<?php require_once 'nav.php'; ?>

<header>
    <h1 class="title-head">AIMA - AROMAS</h1>
</header>

<main class="index-layout">
	<p>AIMA nace del amor por los pequeños rituales.
	Creamos productos artesanales para el hogar y el bienestar, pensados para acompañarte en momentos de calma, conexión y pausa.
	Aromas suaves, materiales nobles y una estética limpia que invita a bajar un cambio y disfrutar.</p>
    <section class="hero-gallery">
        <div class="hero-circle-main">
            <img src="public/deliciaFR.png" alt="Producto principal">
        </div>

        <div class="hero-circle-thumbs">
            <div class="hero-thumb"><img src="public/flores.png"></div>
            <div class="hero-thumb"><img src="public/chocolateCream.png"></div>
            <div class="hero-thumb"><img src="public/roras.png"></div>
        </div>
    </section>

</main>


<footer>
    <p>&copy; <?php echo date('Y/m'); ?> - Ailen Aldana Cury </p>
</footer>

<script src="script.js"></script>
</body>
</html>
