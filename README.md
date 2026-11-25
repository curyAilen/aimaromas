# AIMA Aromas

Tienda y panel de administración de AIMA Aromas (velas de soja, wax melts y jabones artesanales).

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript + Tailwind
- **Base de datos:** TiDB Cloud (compatible con MySQL) vía `mysql2`
- **Imágenes:** Cloudinary
- **Hosting:** Vercel
- **Mails de pedidos:** Resend (opcional)
- **Anti-spam:** límite por IP + honeypot + Cloudflare Turnstile (opcional)

## Funciones principales

- Catálogo público con carga progresiva (6 productos y luego de a 3 al hacer scroll).
- Página por producto con título, imagen y vista previa propios al compartir (WhatsApp, Instagram), `sitemap.xml` y `robots.txt`.
- Control de stock: con stock se muestra "Entrega inmediata"; sin stock, "A pedido" y se consultan demoras por WhatsApp.
- Pedidos desde la web con aviso por mail (destinatario configurable en el panel).
- Panel `/admin`: productos, pedidos, clientes, revendedoras, cumpleaños, estadísticas y configuración (WhatsApp, mail de avisos, envío).
- Login con bloqueo tras 5 intentos fallidos por IP (15 minutos).

## Puesta en marcha

```bash
npm install
cp .env.example .env   # completar los valores
npm run dev
```

Las tablas faltantes y las columnas nuevas (stock, límite de intentos) se crean solas al primer uso.

## Variables de entorno

Ver `.env.example`; cada variable está comentada. **Nunca subas el archivo `.env` ni valores reales al repositorio.**

## Servicios externos

| Servicio | Para qué | Dónde |
| --- | --- | --- |
| TiDB Cloud | Base de datos | https://tidbcloud.com |
| Vercel | Hosting y variables de entorno | https://vercel.com |
| Cloudinary | Imágenes (subida directa desde el navegador con preset *unsigned*) | https://cloudinary.com/console |
| Resend | Mail por pedido nuevo | https://resend.com |
| Cloudflare Turnstile | Anti-spam (opcional) | https://dash.cloudflare.com |

## Notas

- TiDB Cloud Starter se "duerme" sin uso: la primera visita después de un rato puede tardar unos segundos. No se pierden datos.
- Los archivos `.php` de la raíz son de una versión anterior del sitio y no forman parte de la app actual.
