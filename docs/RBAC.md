# RBAC — Roles y permisos

Velora separa **dos ejes** que antes se confundían:

| Eje | Enum | Para qué sirve | Dónde vive |
|-----|------|----------------|------------|
| **Rol** | `Role` | Permisos / acceso | `users.role` |
| **Tier** | `UserTier` | Monetización (suscripción) | `users.tier` + `subscriptions` |

Un `ADMIN` puede estar en `tier = FREE`; un `CLIENTE` puede pagar `PREMIUM`. Son independientes.

## Roles

| Rol | Se asigna | Puede |
|-----|-----------|-------|
| `SUPERADMIN` | Manualmente / seed | Todo. Crear y revocar `ADMIN` (`POST /admin/create-admin`, `POST /admin/revoke-admin`). Bypass de `PremiumGuard`. |
| `ADMIN` | Sólo un `SUPERADMIN` | Moderación, analítica, gestión de usuarios, monitoreo. Bypass de `PremiumGuard`. **No** puede crear otros `ADMIN`. |
| `CLIENTE` | Por defecto en `POST /auth/register` | Atleta / usuario normal: registrar actividades, ver coaches, suscribirse. |
| `COACH` | Automático al llamar `POST /coach` | Todo lo de `CLIENTE` + crear planes, aceptar atletas, dar feedback. |

`register` siempre crea `CLIENTE`. No hay forma pública de auto-asignarse `ADMIN`/`SUPERADMIN`.

## Guards

Todos requieren `JwtAuthGuard` antes (pone `request.user`, con `role` resuelto desde la BD por `JwtStrategy` — **no** viaja en el JWT, así que cambiar el rol tiene efecto inmediato en la siguiente petición).

| Guard | Archivo | Deja pasar a |
|-------|---------|--------------|
| `SuperAdminGuard` | `src/common/guards/superadmin.guard.ts` | `SUPERADMIN` |
| `AdminGuard` | `src/common/guards/admin.guard.ts` | `ADMIN`, `SUPERADMIN` |
| `PremiumGuard` | `src/common/guards/premium.guard.ts` | `ADMIN`/`SUPERADMIN` (bypass) o suscripción de pago `ACTIVE` |

Uso:

```ts
@UseGuards(JwtAuthGuard, AdminGuard)
@Get('flagged')
listFlagged() { /* ... */ }
```

## Flujo de creación de ADMIN

1. El `SUPERADMIN` (creado por seed) hace `POST /auth/login`.
2. Con su `accessToken`: `POST /admin/create-admin` con `{ email, name, password }`.
3. El nuevo `ADMIN` ya puede iniciar sesión y entrar al panel.
4. Para degradarlo: `POST /admin/revoke-admin` con `{ adminId }` → vuelve a `CLIENTE`.

## Seed

`prisma/seed.ts` (ejecutar con `npm run db:seed`, requiere BD levantada y migrada) crea:

| Email | Rol | Tier | Password (env var → default dev) |
|-------|-----|------|----------------------------------|
| `superadmin@velora.com` | `SUPERADMIN` | `FREE` | `SEED_SUPERADMIN_PASSWORD` → `superadmin123` |
| `admin@velora.com` | `ADMIN` | `FREE` | `SEED_ADMIN_PASSWORD` → `admin12345` |
| `athlete@velora.com` | `CLIENTE` | `FREE` | `SEED_ATHLETE_PASSWORD` → `athlete123` |
| `coach@velora.com` | `COACH` | `PRO_COACHING` | `SEED_COACH_PASSWORD` → `coach12345` |

Los defaults son **sólo para desarrollo local**. En staging/producción define las `SEED_*_PASSWORD` antes de correr el seed.

## Migración

`prisma/migrations/20260904120000_add_role_to_user/` añade el enum `Role`, la columna `users.role NOT NULL DEFAULT 'CLIENTE'` y los índices `users_role_idx` / `users_tier_idx`. Todos los usuarios existentes quedan como `CLIENTE`; promueve el `SUPERADMIN` a mano o corriendo el seed.

## Pendiente (fuera de este cambio)

- Poner `AdminGuard` en los endpoints de `users` (mutaciones) y `health/metrics` cuando existan esos módulos de panel.
- El panel `admin-velora` aún no filtra por rol en el login; cualquier usuario válido entra. El backend ya devuelve `role` en la respuesta de `/auth/login` y `/auth/me` para que el front lo haga cumplir.
