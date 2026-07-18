# Eirys API

Backend del sistema POS **Eirys** (zapatería de calzado para dama).
NestJS 11 + TypeORM + PostgreSQL.

## Fase 1 — implementado

- **Autenticación JWT** (access + refresh) con guard global.
- **RBAC**: permisos `modulo.accion`, roles base (Admin, Vendedor, Cajero) y siembra automática.
- **Usuarios** y **Roles/Permisos** (CRUD).
- **Terceros** (clientes/proveedores).
- **Inventario**: categorías, bodegas (incl. bodega de calidad), productos con **variantes talla/color** y **stock por variante+bodega**.
- **Swagger** en `/docs`.

## Fase 2 — implementado (POS core)

- **Listas de precios** (con lista por defecto y precio por variante).
- **Caja**: sesiones (apertura/cierre con arqueo) y movimientos (ingresos/egresos).
- **Ventas/facturas**: creación **transaccional** que descuenta stock, valida existencias y registra el movimiento de caja; genera consecutivo `F-00001`.
- **Pagos recibidos**: abonos con aplicación (parcial/total) a facturas y saldo del tercero.
- Campos reservados para **facturación electrónica DIAN** (nullable) en `sales`.

## Fase 3 — implementado (complementos de venta)

- **Cotizaciones**: CRUD y **conversión a factura** (reutiliza el flujo de ventas y descuenta stock).
- **Vales**: emisión, consulta por código y redención con control de saldo.
- **Notas crédito** sobre factura: total/parcial, **devolución de inventario** (restock) y **generación de vale**, transaccional; anula la factura en devolución total.
- **Facturas recurrentes**: plantilla + frecuencia (semanal/mensual) y endpoint `run` que genera las vencidas y avanza la próxima fecha.
- **Despacho**: control de entrada/salida a demanda con líneas y estado (pendiente/completado).

## Fase 4 — implementado (compras y gastos)

- **Órdenes de compra** a proveedor (no mueven inventario por sí solas).
- **Factura de compra / documento de soporte**: recepción **transaccional** que **aumenta el inventario** y actualiza el costo (último costo) de cada variante; marca la orden ligada como recibida y guarda el número de comprobante externo.
- **Nota débito** de compra (cargo adicional del proveedor).
- Permisos `purchases.read/write` (solo Admin).

## Requisitos

- Node 20+ (se usa `--ignore-engines` para instalar en Node 24).
- PostgreSQL 14+.

## Puesta en marcha

```bash
# 1. Variables de entorno
cp .env.example .env        # ajusta credenciales si es necesario

# 2. Base de datos (opción A: docker)
docker compose up -d
#    (opción B: usa tu propio PostgreSQL y actualiza .env)

# 3. Dependencias y arranque
yarn install --ignore-engines
yarn start:dev
```

La API queda en `http://localhost:3000/api` y Swagger en `http://localhost:3000/docs`.

Al arrancar (`SEED_ON_BOOT=true`) se crean permisos, roles y el usuario admin:

- **Correo:** `admin@eirys.local`
- **Contraseña:** `admin123`

> En desarrollo se usa `synchronize` de TypeORM (sin migraciones aún). Para
> producción, poner `NODE_ENV=production` y añadir migraciones.

## Estructura

```
src/
├── common/            # BaseEntity, guards (JWT, permisos), decoradores
├── config/            # configuración de TypeORM
├── database/seeds/    # siembra idempotente (permisos, roles, admin)
└── modules/
    ├── auth/          # login, refresh, estrategia JWT
    ├── users/
    ├── roles/         # roles + catálogo de permisos
    ├── third-parties/
    └── inventory/     # categorías, bodegas, productos, variantes, stock
```

## Endpoints principales

| Método | Ruta | Permiso |
|---|---|---|
| POST | `/api/auth/login` | público |
| POST | `/api/auth/refresh` | público |
| GET | `/api/auth/me` | autenticado |
| CRUD | `/api/users` | `users.manage` |
| CRUD | `/api/roles` | `roles.manage` |
| CRUD | `/api/third-parties` | `third_parties.read/write` |
| CRUD | `/api/inventory/categories` | `inventory.read/write` |
| CRUD | `/api/inventory/warehouses` | `inventory.read/write` |
| CRUD | `/api/inventory/products` | `inventory.read/write` |
| GET/POST | `/api/inventory/stock`, `/stock/adjust` | `inventory.read/write` |
