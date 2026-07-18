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
