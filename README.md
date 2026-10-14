# AIMA Aromas — Panel de Administración + Tienda Pública

Plataforma de gestión para **AIMA Aromas** (jabones y velas artesanales) con panel de administración y tienda pública.

---

## 🛠️ Stack Técnico

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Estilos:** Tailwind CSS + Framer Motion
- **Base de datos:** MariaDB (Railway) + mysql2
- **Imágenes:** Cloudinary
- **Autenticación:** JWT (jose) + bcryptjs
- **Gráficos:** Recharts
- **Hosting:** Vercel (app) + Railway (DB)
- **Dominio:** aimaaromas.com (NIC Argentina)

---

## 📦 Estructura del Proyecto
app/
├── (auth)/ # Login (sin sidebar)
│ └── admin/login/
├── (public)/ # Tienda pública
│ ├── page.tsx # Home con grid de productos
│ ├── producto/[id]/ # Detalle del producto
│ ├── carrito/ # Carrito
│ └── checkout/ # Checkout
├── admin/ # Panel de administración
│ ├── page.tsx # Dashboard
│ ├── pedidos/ # Gestión de pedidos
│ ├── catalogo/ # Gestión de productos
│ ├── clientes/ # Gestión de clientes
│ ├── cumpleanos/ # Cumpleaños
│ ├── estadisticas/ # Estadísticas
│ └── configuracion/ # Configuración (solo CEO)
└── api/ # Endpoints de la API

components/
├── layout/ # Header, Sidebar, PublicHeader, NotificationPanel
├── ui/ # Card, Button, Tooltip
├── charts/ # DotGrid, RadialBarChart
└── features/ # Componentes por módulo (clientes, pedidos, etc.)

lib/
├── db.ts # Pool de conexiones MySQL
├── auth.ts # Funciones de sesión (JWT)
├── cart-context.tsx # Context del carrito
├── cloudinary.ts # Configuración de Cloudinary
├── whatsapp.ts # Utilidades de WhatsApp
└── types.ts # Tipos TypeScript

---

## 🚀 Flujo de trabajo en LOCAL

### 1. Clonar el repositorio

```bash
git clone https://github.com/curyAilen/aimaromas.git
cd aimaromas
npm install

# Base de datos (Railway)
DB_HOST=gondola.proxy.rlwy.net
DB_PORT=58796
DB_USER=root
DB_PASSWORD=tu_password_aqui
DB_NAME=railway

# JWT
JWT_SECRET=un_string_muy_largo_y_aleatorio_minimo_32_caracteres

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Cloudinary - Upload directo desde el browser
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=img_productos

# URL del sitio
NEXT_PUBLIC_SITE_URL=http://localhost:3000

###  2. Correr en desarrollo
npm run dev
Abrí http://localhost:3000

🚢 SUBIR CAMBIOS A PRODUCCIÓN

npm run build
git status
git add .
git commit -m "Descripción breve del cambio"
git push origin main

📊 URLs importantes
Servicio	URL
App en producción	https://aimaaromas.com
Admin en producción	https://aimaaromas.com/admin
Deploy preview	https://aimaromas.vercel.app
Vercel dashboard	https://vercel.com/dashboard
Railway dashboard	https://railway.app/dashboard
Cloudinary console	https://cloudinary.com/console
GitHub repo	https://github.com/curyAilen/aimaromas

🗄️ Base de datos
Motor: MariaDB
Hosting: Railway
Host: gondola.proxy.rlwy.net
Puerto: 58796
Base: railway
Usuario: root
Para conectarse desde DBeaver
Nueva conexión → MySQL.
Server Host: gondola.proxy.rlwy.net
Port: 58796
Database: railway
Username: root
Password: (tu password de Railway)

🖼️ Subida de imágenes
Las imágenes NO se suben a Vercel (por el límite de 4.5 MB de las serverless functions). Se suben directo a Cloudinary desde el navegador usando un Upload Preset unsigned.

Configuración en Cloudinary
Settings → Upload → Upload presets.
Crear preset "img_productos" con:
Signing Mode: Unsigned
Folder: mezo/productos

