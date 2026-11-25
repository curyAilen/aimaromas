import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildCsv, flag, num, type CsvColumn } from "@/lib/csv";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

interface Params {
    params: Promise<{ type: string }>;
}

type Row = RowDataPacket;

const STATUS_LABEL: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    delivered: "Entregado",
    cancelled: "Cancelado",
};

const TAG_LABEL: Record<string, string> = {
    aromas: "Aromas",
    relax: "Relax",
    mixed: "Mixto",
    mix: "Mixto",
};

const SOURCE_LABEL: Record<string, string> = {
    admin: "Panel",
    web: "Web",
    migracion: "Migración",
};

const STOCK_LABEL: Record<string, string> = {
    in_stock: "En stock",
    on_demand: "A pedido",
    discontinued: "Discontinuado",
};

/** Fecha y hora formateadas por MySQL (evita desfasajes de zona horaria). */
const DT = "%Y-%m-%d %H:%i";
const D = "%Y-%m-%d";

function estadoPago(r: Row): string {
    if (r.status === "cancelled") return "Cancelado";
    if (r.paid_at) return "Pagado";
    if (Number(r.pays_next_month) === 1) return "Paga el mes siguiente";
    return "Pendiente de pago";
}

function estadoEntrega(r: Row): string {
    if (r.status === "cancelled") return "Cancelado";
    return r.delivered_at ? "Entregado" : "Pendiente de entrega";
}

// Detalle de productos de un pedido en una sola celda
const ITEMS_DETAIL = `(
    SELECT GROUP_CONCAT(
        CONCAT(
            oi.quantity, ' x ', oi.product_name,
            IF(oi.variant_scent IS NULL OR oi.variant_scent = '', '', CONCAT(' (', oi.variant_scent, ')')),
            ' - $', REPLACE(CAST(CAST(oi.unit_price AS DOUBLE) AS CHAR), '.', ',')
        ) ORDER BY oi.id_item SEPARATOR ' | '
    )
    FROM order_items oi WHERE oi.id_order = o.id_order
) AS items_detail`;

const ITEMS_COUNT = `(SELECT COUNT(*) FROM order_items oi WHERE oi.id_order = o.id_order) AS items_count`;
const ITEMS_UNITS = `(SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.id_order = o.id_order) AS items_units`;

// Columnas del pedido, reutilizadas en pedidos y en clientes
const ORDER_SELECT = `
    o.id_order, o.legacy_id AS order_legacy_id, o.status, o.tag, o.source, o.payment_method,
    o.total, o.delivery_cost, o.discount_amount,
    o.requires_delivery, o.delivery_address, DATE_FORMAT(o.delivery_date, '${D}') AS delivery_date,
    o.id_reseller, o.commission_percent, o.commission_amount, o.commission_paid,
    DATE_FORMAT(o.commission_paid_at, '${DT}') AS commission_paid_at,
    o.pays_next_month, o.dni AS order_dni, o.notes AS order_notes,
    DATE_FORMAT(o.createdAt, '${DT}') AS order_created,
    DATE_FORMAT(o.paid_at, '${DT}') AS paid_at,
    DATE_FORMAT(o.delivered_at, '${DT}') AS delivered_at,
    DATE_FORMAT(o.cancelled_at, '${DT}') AS cancelled_at,
    DATE_FORMAT(o.updatedAt, '${DT}') AS order_updated,
    DATE_FORMAT(o.deleted_at, '${DT}') AS deleted_at,
    ${ITEMS_COUNT}, ${ITEMS_UNITS}, ${ITEMS_DETAIL}`;

// ---------------------------------------------------------------- PEDIDOS
async function exportPedidos(conn: PoolConnection) {
    const [rows] = await conn.query<Row[]>(
        `SELECT
            ${ORDER_SELECT},
            c.id_client, c.name AS client_name, c.dni AS client_dni, c.email AS client_email,
            c.phone AS client_phone, c.address AS client_address,
            DATE_FORMAT(c.birthday, '${D}') AS client_birthday,
            r.name AS reseller_name,
            u.id_user, u.name AS user_name
         FROM orders o
         INNER JOIN clients c ON c.id_client = o.id_client
         INNER JOIN users u ON u.id_user = o.id_user
         LEFT JOIN resellers r ON r.id_reseller = o.id_reseller
         ORDER BY o.createdAt DESC, o.id_order DESC`
    );

    const columns: CsvColumn<Row>[] = [
        { header: "N° pedido", value: (r) => r.id_order },
        { header: "ID pedido anterior (migración)", value: (r) => r.order_legacy_id },
        { header: "Fecha del pedido", value: (r) => r.order_created },
        { header: "ID cliente", value: (r) => r.id_client },
        { header: "Cliente", value: (r) => r.client_name },
        { header: "DNI cliente", value: (r) => r.client_dni },
        { header: "Email cliente", value: (r) => r.client_email },
        { header: "Teléfono cliente", value: (r) => r.client_phone },
        { header: "Dirección cliente", value: (r) => r.client_address },
        { header: "Cumpleaños cliente", value: (r) => r.client_birthday },
        { header: "Estado", value: (r) => STATUS_LABEL[r.status] ?? r.status },
        { header: "Estado de pago", value: estadoPago },
        { header: "Estado de entrega", value: estadoEntrega },
        { header: "Línea", value: (r) => TAG_LABEL[r.tag] ?? r.tag },
        { header: "Origen", value: (r) => SOURCE_LABEL[r.source] ?? r.source },
        { header: "Método de pago", value: (r) => r.payment_method },
        { header: "Subtotal productos", value: (r) => (num(r.total) ?? 0) - (num(r.delivery_cost) ?? 0) },
        { header: "Costo de envío", value: (r) => num(r.delivery_cost) },
        { header: "Descuento", value: (r) => num(r.discount_amount) },
        { header: "Total", value: (r) => num(r.total) },
        { header: "Cantidad de ítems", value: (r) => r.items_count },
        { header: "Unidades", value: (r) => r.items_units },
        { header: "Detalle de productos", value: (r) => r.items_detail },
        { header: "Requiere envío", value: (r) => flag(r.requires_delivery) },
        { header: "Dirección de entrega", value: (r) => r.delivery_address },
        { header: "Fecha de entrega pactada", value: (r) => r.delivery_date },
        { header: "Fecha de pago", value: (r) => r.paid_at },
        { header: "Fecha de entrega real", value: (r) => r.delivered_at },
        { header: "Fecha de cancelación", value: (r) => r.cancelled_at },
        { header: "ID revendedora", value: (r) => r.id_reseller },
        { header: "Revendedora", value: (r) => r.reseller_name },
        { header: "% comisión", value: (r) => num(r.commission_percent) },
        { header: "Comisión", value: (r) => num(r.commission_amount) },
        { header: "Comisión pagada", value: (r) => flag(r.commission_paid) },
        { header: "Fecha pago comisión", value: (r) => r.commission_paid_at },
        { header: "Paga el mes siguiente", value: (r) => flag(r.pays_next_month) },
        { header: "DNI del pedido", value: (r) => r.order_dni },
        { header: "Notas", value: (r) => r.order_notes },
        { header: "ID usuario que cargó", value: (r) => r.id_user },
        { header: "Cargado por", value: (r) => r.user_name },
        { header: "Última modificación", value: (r) => r.order_updated },
        { header: "Eliminado el", value: (r) => r.deleted_at },
    ];

    return { filename: "pedidos", csv: buildCsv(columns, rows) };
}

// -------------------------------------------------------------- PRODUCTOS
async function exportProductos(conn: PoolConnection) {
    const [rows] = await conn.query<Row[]>(
        `SELECT
            p.id_product, p.legacy_id, p.legacy_variant_id, p.name, p.size_name, p.size_cm,
            p.price, p.description, p.active, p.stock_status, p.tag,
            DATE_FORMAT(p.createdAt, '${DT}') AS created_at,
            DATE_FORMAT(p.updatedAt, '${DT}') AS updated_at,
            cat.id_category, cat.name AS category_name,
            (SELECT COUNT(*) FROM product_variants v WHERE v.id_product = p.id_product) AS variants_count,
            (SELECT COALESCE(SUM(v.stock), 0) FROM product_variants v
                WHERE v.id_product = p.id_product AND v.active = 1) AS variants_stock,
            (SELECT COUNT(*) FROM product_images i WHERE i.id_product = p.id_product) AS images_count,
            (SELECT GROUP_CONCAT(i.url ORDER BY i.sort_order, i.id_image SEPARATOR ' | ')
                FROM product_images i WHERE i.id_product = p.id_product) AS images_urls
         FROM products p
         LEFT JOIN categories cat ON cat.id_category = p.id_category
         ORDER BY p.name ASC, p.id_product ASC`
    );

    const columns: CsvColumn<Row>[] = [
        { header: "ID producto", value: (r) => r.id_product },
        { header: "ID anterior (migración)", value: (r) => r.legacy_id },
        { header: "ID variante anterior (migración)", value: (r) => r.legacy_variant_id },
        { header: "Producto", value: (r) => r.name },
        { header: "ID categoría", value: (r) => r.id_category },
        { header: "Categoría", value: (r) => r.category_name },
        { header: "Línea", value: (r) => TAG_LABEL[r.tag] ?? r.tag },
        { header: "Tamaño", value: (r) => r.size_name },
        { header: "Medida (cm)", value: (r) => r.size_cm },
        { header: "Precio", value: (r) => num(r.price) },
        { header: "Descripción", value: (r) => r.description },
        { header: "Activo", value: (r) => flag(r.active) },
        { header: "Disponibilidad", value: (r) => STOCK_LABEL[r.stock_status] ?? r.stock_status },
        { header: "Cantidad de variantes (fragancias)", value: (r) => r.variants_count },
        { header: "Stock total de variantes activas", value: (r) => num(r.variants_stock) },
        { header: "Cantidad de imágenes", value: (r) => r.images_count },
        { header: "URLs de imágenes", value: (r) => r.images_urls },
        { header: "Creado", value: (r) => r.created_at },
        { header: "Última modificación", value: (r) => r.updated_at },
    ];

    return { filename: "productos", csv: buildCsv(columns, rows) };
}

async function exportVariantes(conn: PoolConnection) {
    const [rows] = await conn.query<Row[]>(
        `SELECT
            v.id_variant, v.id_product, p.name AS product_name, cat.name AS category_name,
            p.size_name, p.price AS product_price, p.active AS product_active,
            v.scent, v.shape, v.price, v.stock, v.active,
            DATE_FORMAT(v.createdAt, '${DT}') AS created_at,
            DATE_FORMAT(v.updatedAt, '${DT}') AS updated_at,
            (SELECT COUNT(*) FROM variant_images vi WHERE vi.id_variant = v.id_variant) AS images_count,
            (SELECT GROUP_CONCAT(vi.url ORDER BY vi.sort_order, vi.id_image SEPARATOR ' | ')
                FROM variant_images vi WHERE vi.id_variant = v.id_variant) AS images_urls
         FROM product_variants v
         INNER JOIN products p ON p.id_product = v.id_product
         LEFT JOIN categories cat ON cat.id_category = p.id_category
         ORDER BY p.name ASC, v.scent ASC, v.id_variant ASC`
    );

    const columns: CsvColumn<Row>[] = [
        { header: "ID variante", value: (r) => r.id_variant },
        { header: "ID producto", value: (r) => r.id_product },
        { header: "Producto", value: (r) => r.product_name },
        { header: "Categoría", value: (r) => r.category_name },
        { header: "Tamaño del producto", value: (r) => r.size_name },
        { header: "Fragancia", value: (r) => r.scent },
        { header: "Forma", value: (r) => r.shape },
        { header: "Precio de la variante", value: (r) => num(r.price) },
        { header: "Precio base del producto", value: (r) => num(r.product_price) },
        { header: "Stock", value: (r) => r.stock },
        { header: "Variante activa", value: (r) => flag(r.active) },
        { header: "Producto activo", value: (r) => flag(r.product_active) },
        { header: "Cantidad de imágenes", value: (r) => r.images_count },
        { header: "URLs de imágenes", value: (r) => r.images_urls },
        { header: "Creada", value: (r) => r.created_at },
        { header: "Última modificación", value: (r) => r.updated_at },
    ];

    return { filename: "productos_variantes_por_fragancia", csv: buildCsv(columns, rows) };
}

// --------------------------------------------------------------- CLIENTES
// Una fila por pedido de cada cliente (los clientes sin pedidos aparecen una sola vez).
async function exportClientes(conn: PoolConnection) {
    const [rows] = await conn.query<Row[]>(
        `SELECT
            c.id_client, c.legacy_id AS client_legacy_id, c.name AS client_name, c.dni AS client_dni,
            c.email AS client_email, c.phone AS client_phone, c.address AS client_address,
            DATE_FORMAT(c.birthday, '${D}') AS client_birthday, c.notes AS client_notes,
            DATE_FORMAT(c.createdAt, '${DT}') AS client_created,
            DATE_FORMAT(c.updatedAt, '${DT}') AS client_updated,
            (SELECT COUNT(*) FROM orders x WHERE x.id_client = c.id_client AND x.status != 'cancelled') AS client_orders,
            (SELECT COALESCE(SUM(x.total), 0) FROM orders x WHERE x.id_client = c.id_client AND x.status != 'cancelled') AS client_spent,
            r.name AS reseller_name,
            ${ORDER_SELECT}
         FROM clients c
         LEFT JOIN orders o ON o.id_client = c.id_client
         LEFT JOIN resellers r ON r.id_reseller = o.id_reseller
         ORDER BY c.name ASC, c.id_client ASC, o.createdAt DESC`
    );

    const hasOrder = (r: Row) => r.id_order !== null && r.id_order !== undefined;
    const o = <T,>(fn: (r: Row) => T) => (r: Row) => (hasOrder(r) ? fn(r) : null);

    const columns: CsvColumn<Row>[] = [
        { header: "ID cliente", value: (r) => r.id_client },
        { header: "ID anterior (migración)", value: (r) => r.client_legacy_id },
        { header: "Cliente", value: (r) => r.client_name },
        { header: "DNI", value: (r) => r.client_dni },
        { header: "Email", value: (r) => r.client_email },
        { header: "Teléfono", value: (r) => r.client_phone },
        { header: "Dirección", value: (r) => r.client_address },
        { header: "Cumpleaños", value: (r) => r.client_birthday },
        { header: "Notas del cliente", value: (r) => r.client_notes },
        { header: "Cliente desde", value: (r) => r.client_created },
        { header: "Cliente modificado", value: (r) => r.client_updated },
        { header: "Pedidos del cliente (sin cancelados)", value: (r) => r.client_orders },
        { header: "Total gastado (sin cancelados)", value: (r) => num(r.client_spent) },
        { header: "N° pedido", value: o((r) => r.id_order) },
        { header: "Fecha del pedido", value: o((r) => r.order_created) },
        { header: "Estado", value: o((r) => STATUS_LABEL[r.status] ?? r.status) },
        { header: "Estado de pago", value: o(estadoPago) },
        { header: "Estado de entrega", value: o(estadoEntrega) },
        { header: "Línea", value: o((r) => TAG_LABEL[r.tag] ?? r.tag) },
        { header: "Origen", value: o((r) => SOURCE_LABEL[r.source] ?? r.source) },
        { header: "Método de pago", value: o((r) => r.payment_method) },
        { header: "Costo de envío", value: o((r) => num(r.delivery_cost)) },
        { header: "Descuento", value: o((r) => num(r.discount_amount)) },
        { header: "Total del pedido", value: o((r) => num(r.total)) },
        { header: "Detalle de productos", value: o((r) => r.items_detail) },
        { header: "Unidades", value: o((r) => r.items_units) },
        { header: "Requiere envío", value: o((r) => flag(r.requires_delivery)) },
        { header: "Dirección de entrega", value: o((r) => r.delivery_address) },
        { header: "Fecha de entrega pactada", value: o((r) => r.delivery_date) },
        { header: "Fecha de pago", value: o((r) => r.paid_at) },
        { header: "Fecha de entrega real", value: o((r) => r.delivered_at) },
        { header: "Revendedora", value: o((r) => r.reseller_name) },
        { header: "Comisión", value: o((r) => num(r.commission_amount)) },
        { header: "Notas del pedido", value: o((r) => r.order_notes) },
    ];

    return { filename: "clientes_con_pedidos", csv: buildCsv(columns, rows) };
}

// ----------------------------------------------------------- REVENDEDORAS
// Los totales y comisiones no incluyen pedidos cancelados (igual que las estadísticas del panel).
async function exportRevendedoras(conn: PoolConnection) {
    const [rows] = await conn.query<Row[]>(
        `SELECT
            r.id_reseller, r.name, r.phone, r.email, r.dni, r.address, r.notes, r.active,
            r.default_commission_percent,
            DATE_FORMAT(r.createdAt, '${DT}') AS created_at,
            DATE_FORMAT(r.updatedAt, '${DT}') AS updated_at,
            COUNT(o.id_order) AS orders_count,
            COUNT(DISTINCT o.id_client) AS clients_count,
            COALESCE(SUM(o.total), 0) AS total_sold,
            COALESCE(SUM(CASE WHEN o.paid_at IS NULL THEN o.total ELSE 0 END), 0) AS pending_payment,
            COALESCE(SUM(o.commission_amount), 0) AS commission_total,
            COALESCE(SUM(CASE WHEN o.commission_paid = 1 THEN o.commission_amount ELSE 0 END), 0) AS commission_paid,
            COALESCE(SUM(CASE WHEN o.commission_paid = 0 THEN o.commission_amount ELSE 0 END), 0) AS commission_pending
         FROM resellers r
         LEFT JOIN orders o ON o.id_reseller = r.id_reseller AND o.status != 'cancelled'
         GROUP BY r.id_reseller, r.name, r.phone, r.email, r.dni, r.address, r.notes, r.active,
                  r.default_commission_percent, r.createdAt, r.updatedAt
         ORDER BY r.name ASC`
    );

    const columns: CsvColumn<Row>[] = [
        { header: "ID revendedora", value: (r) => r.id_reseller },
        { header: "Revendedora", value: (r) => r.name },
        { header: "Teléfono", value: (r) => r.phone },
        { header: "Email", value: (r) => r.email },
        { header: "DNI", value: (r) => r.dni },
        { header: "Dirección", value: (r) => r.address },
        { header: "Notas", value: (r) => r.notes },
        { header: "Activa", value: (r) => flag(r.active) },
        { header: "% comisión por defecto", value: (r) => num(r.default_commission_percent) },
        { header: "Pedidos (sin cancelados)", value: (r) => r.orders_count },
        { header: "Clientes distintos", value: (r) => r.clients_count },
        { header: "Total vendido", value: (r) => num(r.total_sold) },
        { header: "Ventas pendientes de pago", value: (r) => num(r.pending_payment) },
        { header: "Comisión total", value: (r) => num(r.commission_total) },
        { header: "Comisión pagada", value: (r) => num(r.commission_paid) },
        { header: "Comisión pendiente", value: (r) => num(r.commission_pending) },
        { header: "Alta", value: (r) => r.created_at },
        { header: "Última modificación", value: (r) => r.updated_at },
    ];

    return { filename: "revendedoras", csv: buildCsv(columns, rows) };
}

async function exportComisiones(conn: PoolConnection) {
    const [rows] = await conn.query<Row[]>(
        `SELECT
            r.id_reseller, r.name AS reseller_name,
            o.id_order, DATE_FORMAT(o.createdAt, '${DT}') AS order_created,
            o.status, o.paid_at IS NOT NULL AS is_paid, DATE_FORMAT(o.paid_at, '${DT}') AS paid_at,
            o.pays_next_month, o.delivered_at,
            c.id_client, c.name AS client_name,
            o.total, o.delivery_cost,
            o.commission_percent, o.commission_amount, o.commission_paid,
            DATE_FORMAT(o.commission_paid_at, '${DT}') AS commission_paid_at
         FROM orders o
         INNER JOIN resellers r ON r.id_reseller = o.id_reseller
         INNER JOIN clients c ON c.id_client = o.id_client
         WHERE o.status != 'cancelled'
         ORDER BY r.name ASC, o.createdAt DESC, o.id_order DESC`
    );

    const columns: CsvColumn<Row>[] = [
        { header: "ID revendedora", value: (r) => r.id_reseller },
        { header: "Revendedora", value: (r) => r.reseller_name },
        { header: "N° pedido", value: (r) => r.id_order },
        { header: "Fecha del pedido", value: (r) => r.order_created },
        { header: "ID cliente", value: (r) => r.id_client },
        { header: "Cliente", value: (r) => r.client_name },
        { header: "Estado", value: (r) => STATUS_LABEL[r.status] ?? r.status },
        { header: "Estado de pago del pedido", value: estadoPago },
        { header: "Fecha de pago del pedido", value: (r) => r.paid_at },
        { header: "Total del pedido", value: (r) => num(r.total) },
        { header: "Base de la comisión (sin envío)", value: (r) => (num(r.total) ?? 0) - (num(r.delivery_cost) ?? 0) },
        { header: "% comisión", value: (r) => num(r.commission_percent) },
        { header: "Comisión", value: (r) => num(r.commission_amount) },
        { header: "Comisión pagada", value: (r) => flag(r.commission_paid) },
        { header: "Fecha pago comisión", value: (r) => r.commission_paid_at },
    ];

    return { filename: "revendedoras_comisiones_por_pedido", csv: buildCsv(columns, rows) };
}

const EXPORTS: Record<string, (conn: PoolConnection) => Promise<{ filename: string; csv: string }>> = {
    pedidos: exportPedidos,
    productos: exportProductos,
    variantes: exportVariantes,
    clientes: exportClientes,
    revendedoras: exportRevendedoras,
    comisiones: exportComisiones,
};

// GET /api/export/[type]  →  descarga un CSV (separado por ;)
export async function GET(_req: NextRequest, { params }: Params) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { type } = await params;
        const handler = EXPORTS[type];
        if (!handler) {
            return NextResponse.json({ error: "Exportación no encontrada" }, { status: 404 });
        }

        const conn = await pool.getConnection();
        try {
            // Los detalles largos (GROUP_CONCAT) se cortan en 1024 caracteres por defecto
            await conn.query("SET SESSION group_concat_max_len = 1000000");
            const { filename, csv } = await handler(conn);
            const stamp = new Date().toISOString().slice(0, 10);

            return new NextResponse(csv, {
                status: 200,
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="${filename}_${stamp}.csv"`,
                    "Cache-Control": "no-store",
                },
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error("Error en GET /api/export/[type]:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
