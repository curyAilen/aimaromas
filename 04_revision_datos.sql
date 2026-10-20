-- =====================================================================
-- AIMA Aromas · 04 · Correcciones a mano (etapa 1)
-- Base: aimaaromas (MySQL 9 en Railway)
--
-- Correr DESPUÉS de 01, 02 y 03.
-- Las consultas (SELECT) solo muestran datos. Las modificaciones están
-- comentadas con "--": completar el dato, sacar el "--" y ejecutar
-- esa línea sola (en HeidiSQL: seleccionarla y Ctrl+F9).
-- =====================================================================

USE `aimaaromas`;

-- ---------------------------------------------------------------------
-- A. CLIENTAS CON TELÉFONO COMPARTIDO O DE RELLENO
--    Hoy 6 clientas tienen el teléfono de Roxana (1134372822) y 4 el de
--    Ailen (01168508686). Los WhatsApp y saludos de cumpleaños les llegan
--    a ellas en vez de a la clienta.
-- ---------------------------------------------------------------------
SELECT c.id_client, c.name AS clienta, c.phone AS telefono, c.email,
       t.cantidad AS clientas_con_ese_telefono
FROM clients c
JOIN (SELECT phone, COUNT(*) AS cantidad FROM clients GROUP BY phone) t
  ON t.phone = c.phone
WHERE t.cantidad > 1
   OR c.phone REGEXP '^0+$'
   OR LENGTH(REPLACE(REPLACE(c.phone, ' ', ''), '-', '')) < 10
ORDER BY c.phone, c.name;

-- Completar el teléfono real (10 dígitos, sin 0 ni 15: 11XXXXXXXX).
-- Si no se sabe el mail real, dejarlo vacío (NULL) en vez de uno inventado.
-- Teléfono de Roxana:
-- UPDATE clients SET phone = '__________', email = NULL WHERE id_client = 19;  -- Karina Das Pato
-- UPDATE clients SET phone = '__________', email = NULL WHERE id_client = 21;  -- Macarena das Pato
-- UPDATE clients SET phone = '__________'               WHERE id_client = 23;  -- Buceo Diego Hernan Magallanes
-- UPDATE clients SET phone = '__________'               WHERE id_client = 25;  -- Marcela Dias
-- UPDATE clients SET phone = '__________'               WHERE id_client = 51;  -- Walter Ruben Maldonado
-- UPDATE clients SET phone = '__________', email = NULL WHERE id_client = 71;  -- Lautaro
-- Teléfono de Ailen:
-- UPDATE clients SET phone = '__________'               WHERE id_client = 3;   -- Oficina 4to
-- UPDATE clients SET phone = '__________'               WHERE id_client = 11;  -- Yami DAS
-- UPDATE clients SET phone = '__________'               WHERE id_client = 29;  -- Fernanda Sosa
-- UPDATE clients SET phone = '__________', email = NULL WHERE id_client = 31;  -- Claudia Hernan
-- Teléfono de relleno:
-- UPDATE clients SET phone = '__________'               WHERE id_client = 45;  -- Camila Lacoboni

-- Nombres con espacios dobles o de más (solo ordena, no cambia letras):
-- UPDATE clients SET name = TRIM(REGEXP_REPLACE(name, ' {2,}', ' ')) WHERE name REGEXP ' {2,}' OR name <> TRIM(name);


-- ---------------------------------------------------------------------
-- B. PEDIDO 26 (Marcela Paz, 11/08): total $28.000, productos $29.000
--    Tiene los mismos productos que el pedido 28 de Macarena.
-- ---------------------------------------------------------------------
SELECT id_item, product_name, variant_scent, quantity, unit_price, subtotal
FROM order_items WHERE id_order = 26;

-- Opción 1: los productos están bien y se cobró $29.000
-- UPDATE orders SET total = 29000 WHERE id_order = 26;

-- Opción 2: los productos están mal. Borrarlos y cargar los correctos
-- (mismo formato que en la sección C, cambiando 31 por 26):
-- DELETE FROM order_items WHERE id_order = 26;


-- ---------------------------------------------------------------------
-- C. PEDIDO 31 (Sandra Alejandra Rios, 02/07, $56.000): sin productos
--    Buscar el producto y su id, y cargar una línea por producto.
--    La suma de subtotales tiene que dar 56.000.
-- ---------------------------------------------------------------------
SELECT p.id_product, p.name AS producto, p.price AS precio_actual, c.name AS categoria
FROM products p JOIN categories c ON c.id_category = p.id_category
ORDER BY c.name, p.name;

-- Ejemplo: 2 jabones Caléndula y Oliva (id 15) a $10.000 cada uno.
-- INSERT INTO order_items (id_order, id_product, id_variant, product_name, variant_scent, quantity, unit_price, subtotal, createdAt)
-- SELECT 31, p.id_product, NULL, p.name, NULL, 2, 10000, 2 * 10000, o.createdAt
-- FROM products p JOIN orders o ON o.id_order = 31 WHERE p.id_product = 15;

-- Control: pedidos con total distinto de sus productos (tiene que dar vacío)
SELECT o.id_order, o.total, COALESCE(SUM(oi.subtotal), 0) AS suma_productos
FROM orders o LEFT JOIN order_items oi ON oi.id_order = o.id_order
WHERE o.status <> 'cancelled'
GROUP BY o.id_order, o.total, o.delivery_cost, o.discount_amount
HAVING ABS(COALESCE(SUM(oi.subtotal), 0) + o.delivery_cost - o.discount_amount - o.total) > 0.01;
