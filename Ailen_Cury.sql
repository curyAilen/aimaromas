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

-- Volcando datos para la tabla cursoutn.comentarios: ~0 rows (aproximadamente)
INSERT INTO `comentarios` (`id_comentario`, `nombre`, `comentario`, `archivo`, `fecha`, `estado`) VALUES
	(2, 'fefe', 'aswgserg', 'comentario_1770223944.txt', '2026-02-04 00:00:00', 1),
	(3, 'ailen', 'q1wasdfsfwefgde', 'comentario_1770310937.txt', '2026-02-05 00:00:00', 1);

-- Volcando datos para la tabla cursoutn.consultas: ~7 rows (aproximadamente)
INSERT INTO `consultas` (`idConsultas`, `nombre`, `apellido`, `edad`, `email`, `mensaje`, `estado`) VALUES
	(3, 'ailen', 'cury', 21, 'cury.ailena@gmail.com', 'quería saber si es posible .....', 0),
	(4, 'fefe', 'cury', 39, 'fefe@gmail.com', 'test', 0),
	(5, 'federico', 'cury', 29, 'fede.cury@gmail.com', '¡Hola! ¿Cómo estás? Estaba mirando tu perfil y me encantaron los productos que hacés. Quería consultarte por el precio de los wax melts (si tenés algún pack o promo por cantidad) y también de los jabones artesanales. ¿Hacés envíos o se pueden retirar por algún lado? ¡Muchas gracias!', 0),
	(6, 'Norma', 'Place', 53, 'normpl@hotmail.com', 'Hola, ¡buenas tardes! Quería hacerte una consulta: ¿me podrías pasar el catálogo de precios de tus wax melts y jabones? Estoy buscando algunos para regalar y me gustaría saber qué aromas tenés disponibles y si vienen en algún kit o cajita de regalo. ¡Quedo atenta, gracias!', 0),
	(7, 'Ana Laura', 'Antakle', 36, 'ana.antakle@gmail.com', 'Hola, ¿qué tal? Te escribo porque me interesaron mucho tus wax melts y jabones artesanales. Quería consultarte los precios actuales y si manejas algún descuento por compra mayorista o a partir de cierta cantidad de unidades. ¡Desde ya muchas gracias por la info!', 0),
	(8, 'Rocio', 'Cordasco', 27, 'rcgonzales@gmail.com', 'No tengo consultas, pero queria dejar mi testimonio de lo excelentes que son todos sus productos.', 0),
	(9, 'ailen', 'cury', 23, 'cury.ailena@gmail.com', 'test check', 0);

-- Volcando datos para la tabla cursoutn.opcional_13: ~4 rows (aproximadamente)
INSERT INTO `opcional_13` (`dni`, `nombre`, `apellido`, `edad`, `peso`, `talla`, `pc`, `diagnostico`) VALUES
	(38765421, 'CamilaCAMILA', 'LOPEZ', 13, 49.2, 158, 55, 'Adolescente de 13 años con irritación leve en muslos por roce y uso de crema corporal perfumada. Se indica suspender crema, utilizar ropa holgada y crema hidratante neutra.'),
	(39876543, 'JULIAN', 'LOPEZ', 8, 27.8, 130, 53, ' '),
	(40987654, 'MARTIN', 'RODRIGUEZ', 2, 13.5, 90, 49, 'Niño de 2 años con irritación de piel en zona de pañal por uso de crema perfumada. Se indica suspender crema, higiene con agua tibia y barrera protectora.'),
	(42765432, 'VALENTINA', 'PEREZ', 5, 18.3, 110, 51.5, 'Niña de 5 años con dermatitis irritativa en manos por uso excesivo de jabón. Se recomienda crema hidratante sin perfume y evitar jabones agresivos.'),
	(70555689, 'BENJAMIN', 'CURY', 11, 8, 65, 47, '11 meses de edad. Control de peso y posible conjuntivitis');

-- Volcando datos para la tabla cursoutn.productos: ~4 rows (aproximadamente)
INSERT INTO `productos` (`idProducto`, `nombre`, `precio`, `descripcion`, `imagen`) VALUES
	(1, 'Dulce Caramelo', 8000.000000, 'caramelo con especias de canela', 'dulceCaramelo.jpg'),
	(2, 'Frescura del campo', 8000.000000, 'Jazmín y pequeñas notas de té verde', 'jazminTeVerde.jpg'),
	(3, 'ChocoCream', 8000.000000, 'Vainilla - Coco', 'chocolateCream.png'),
	(4, 'Dulces Frutos del Bosque', 8000.000000, 'Frutos rojos', 'DeliciaFR.png');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
