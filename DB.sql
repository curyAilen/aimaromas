-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         10.4.32-MariaDB - mariadb.org binary distribution
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para aima-db
CREATE DATABASE IF NOT EXISTS `aima-db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `aima-db`;

-- Volcando estructura para tabla aima-db.carrito
CREATE TABLE IF NOT EXISTS `carrito` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `cantidad` int(11) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla aima-db.carrito: ~0 rows (aproximadamente)

-- Volcando estructura para tabla aima-db.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `total` decimal(10,2) NOT NULL,
  `metodo_pago` enum('mercadopago','efectivo_punto_retiro','transferencia') DEFAULT NULL,
  `estado_pago` varchar(50) DEFAULT 'pendiente',
  `estado` varchar(50) DEFAULT 'procesando',
  `descripcion` text DEFAULT NULL,
  `external_reference` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla aima-db.orders: ~5 rows (aproximadamente)
INSERT INTO `orders` (`id`, `user_id`, `total`, `metodo_pago`, `estado_pago`, `estado`, `descripcion`, `external_reference`, `created_at`) VALUES
	(1, 1, 36000.00, NULL, 'pendiente', 'procesando', 'vecina', NULL, '2026-03-17 17:16:34'),
	(2, 1, 36000.00, NULL, 'pendiente', 'procesando', 'vecina', NULL, '2026-03-17 17:17:26'),
	(3, 1, 36000.00, NULL, 'pendiente', 'cancelado', 'vecina', NULL, '2026-03-17 21:29:29'),
	(4, 1, 72000.00, NULL, 'pendiente', 'procesando', 'for ig', NULL, '2026-03-17 21:29:52'),
	(5, 1, 180000.00, NULL, 'pagado', 'finalizado', 'afds', NULL, '2026-03-17 21:33:15');

-- Volcando estructura para tabla aima-db.order_items
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla aima-db.order_items: ~2 rows (aproximadamente)
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `cantidad`, `precio_unitario`) VALUES
	(1, 3, 1, 2, 18000.00),
	(2, 4, 1, 4, 18000.00),
	(3, 5, 1, 10, 18000.00);

-- Volcando estructura para tabla aima-db.pedidos
CREATE TABLE IF NOT EXISTS `pedidos` (
  `id_pedido` int(11) NOT NULL AUTO_INCREMENT,
  `id_producto` int(10) unsigned NOT NULL DEFAULT 0,
  `cantidad` int(11) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'procesando',
  `fecha_alta` datetime DEFAULT NULL,
  PRIMARY KEY (`id_pedido`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla aima-db.pedidos: ~0 rows (aproximadamente)

-- Volcando estructura para tabla aima-db.products
CREATE TABLE IF NOT EXISTS `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `imagen` varchar(255) DEFAULT NULL,
  `stock` int(11) DEFAULT 0,
  `status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla aima-db.products: ~0 rows (aproximadamente)
INSERT INTO `products` (`id`, `nombre`, `descripcion`, `precio`, `imagen`, `stock`, `status`, `created_at`, `updated_at`) VALUES
	(1, 'chocolate Cream', 'Vela de Soja Chocolate Intenso', 18000.00, '1773681768_chocolatecream.png', 25, 1, '2026-03-16 17:22:48', '2026-03-17 16:59:56');

-- Volcando estructura para tabla aima-db.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('cliente','admin') DEFAULT 'cliente',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla aima-db.users: ~0 rows (aproximadamente)
INSERT INTO `users` (`id`, `nombre`, `apellido`, `email`, `password_hash`, `rol`, `created_at`) VALUES
	(1, 'Ailen', 'Cury', 'cury.ailena@gmail.com', '$2a$12$3x./T7We3RQDtUar8MWfZeXXtwp6LMh3ObZYmXKgg8LHJ2.yVAMX6', 'admin', '2026-03-16 13:26:53');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
