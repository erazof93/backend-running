# 🚀 DEPLOYMENT - Guía Completa

Deployment del Runner App Backend a producción usando **Railway + Supabase**.

---

## 📋 ÍNDICE

1. [Stack Elegido](#stack-elegido)
2. [Arquitectura](#arquitectura)
3. [Fases de Deployment](#fases-de-deployment)
4. [Guías por Plataforma](#guías-por-plataforma)
5. [Checklist Pre-Producción](#checklist-pre-producción)

---

## 🎯 STACK ELEGIDO

```
STAGING & PRODUCCIÓN:
┌─────────────────────────────────────┐
│ Backend: Railway                    │
│ ├─ Node.js/NestJS + TypeScript      │
│ ├─ Auto-deploy desde GitHub         │
│ ├─ $5-20/mes (free-Standard)        │
│ └─ Health checks + Logs             │
│                                     │
│ Database: Supabase                  │
│ ├─ PostgreSQL managed               │
│ ├─ PostGIS extension (nativo)       │
│ ├─ $0-25/mes (free-Pro)             │
│ └─ 50GB storage (free)              │
│                                     │
│ DNS: Tu dominio (opcional)          │
│ ├─ CNAME → Railway URL              │
│ └─ SSL automático                   │
└─────────────────────────────────────┘
```

---

## 🏗️ ARQUITECTURA

```
DESARROLLO (local)
├─ Backend: localhost:3000
├─ DB: PostgreSQL 16 local + PostGIS
└─ Testing: pnpm test

    ↓ git push origin main

STAGING (Railway)
├─ Backend: runner-app-staging.railway.app
├─ DB: Supabase (mismo proyecto)
└─ Testing: E2E contra staging

    ↓ verificado + merge to prod

PRODUCCIÓN (Railway)
├─ Backend: runner-app.railway.app (o tu dominio)
├─ DB: Supabase (mismo o BD separada)
└─ Monitoring: UptimeRobot (opcional)
```

---

## 📅 FASES DE DEPLOYMENT

### FASE 1: PREPARACIÓN (30 min)

```
1. Crear cuenta Supabase
2. Crear proyecto PostgreSQL
3. Habilitar PostGIS extension
4. Obtener DATABASE_URL
```

### FASE 2: STAGING EN RAILWAY (15 min)

```
1. Crear cuenta Railway
2. Conectar GitHub
3. Agregar environment variables
4. Deploy automático
5. Verificar logs y health check
```

### FASE 3: E2E TESTING (FASE 7) (2 h)

```
1. Escribir tests E2E
2. Apuntar a staging URL
3. Ejecutar suite completa
4. Validar todos los flows
```

### FASE 4: MIGRACIÓN A PRODUCCIÓN (FASE 8) (30 min)

```
1. Crear BD producción en Supabase (opcional)
2. Crear proyecto producción en Railway
3. Conectar mismo repo (branch diferente)
4. Agregar secrets production
5. Deploy
6. Final testing
```

---

## 📚 GUÍAS POR PLATAFORMA

### 🚂 Railway

**Mejor para:** Staging + Producción  
**Ventajas:**
- Auto-deploy desde GitHub
- Logs en tiempo real
- Free tier generoso
- Escalado fácil
- Sin UptimeRobot needed

**Costo:** $5-20/mes

👉 [Ver guía completa: RAILWAY.md](./RAILWAY.md)

### 🔐 Supabase

**Mejor para:** Base de datos  
**Ventajas:**
- PostgreSQL managed
- PostGIS nativo
- Free tier 50GB
- Backups automáticos
- UI excelente

**Costo:** $0-25/mes

👉 [Ver guía completa: SUPABASE.md](./SUPABASE.md)

---

## ✅ CHECKLIST PRE-PRODUCCIÓN

### Configuración

```
DATABASE:
☐ Supabase proyecto creado
☐ PostGIS extension habilitada
☐ DATABASE_URL copiada
☐ Backup strategy definida
☐ SSL connection habilitado

RAILWAY:
☐ Proyecto creado
☐ GitHub conectado
☐ Build command: pnpm build
☐ Start command: pnpm start:prod
☐ Variables agregadas (DATABASE_URL, JWT_SECRET, NODE_ENV)
☐ Deploy exitoso sin errores
☐ Health check respondiendo

NestJS:
☐ main.ts escucha en $PORT (process.env.PORT || 3000)
☐ CORS configurado
☐ Logging habilitado
☐ Error handling completo
☐ Health endpoint disponible
```

### Testing

```
FUNCIONAL:
☐ POST /auth/register funciona
☐ POST /auth/login devuelve JWT
☐ GET /auth/me con Bearer token funciona
☐ POST /users, PUT /users funcionan
☐ POST /activities, GET activities/:id con GPS points
☐ POST /coach, GET /coach/athletes
☐ POST /activities/:id/kudos, GET feed
☐ Todos endpoints en /docs

SEGURIDAD:
☐ Endpoints privados requieren JWT (401 sin token)
☐ Only propietario puede editar (403 si no)
☐ Email único validado (409 si duplicado)
☐ Password mínimo 8 caracteres
☐ No hay secrets en logs

PERFORMANCE:
☐ /health responde <100ms
☐ GET requests responden <500ms
☐ POST/PUT con BD responden <1s
☐ Bajo uso de memoria
☐ CPU < 50% en reposo
```

### Datos

```
☐ Migraciones Prisma ejecutadas
☐ Datos de prueba agregados (opcional)
☐ Índices en foreign keys
☐ Cascade delete funcionando
☐ Backups automáticos configurados
```

---

## 🔑 VARIABLES DE ENTORNO

### Staging

```
DATABASE_URL=postgresql://...@supabase.co:5432/postgres
JWT_SECRET=tu-secreto-staging-aqui-32-chars
NODE_ENV=staging
PORT=8080
LOG_LEVEL=debug
```

### Producción

```
DATABASE_URL=postgresql://...@supabase.co:5432/postgres
JWT_SECRET=tu-secreto-produccion-seguro-64-chars
NODE_ENV=production
PORT=8080
LOG_LEVEL=info
CORS_ORIGIN=https://tu-dominio.com
```

---

## 🚨 PROBLEMAS COMUNES

### Build falla en Railway

```
Causa: TypeScript errors o missing dependencies
Solución:
1. pnpm install localmente
2. pnpm build localmente (debe pasar)
3. git push
4. Revisa Railway build logs
```

### DB no conecta

```
Causa: DATABASE_URL inválida o BD offline
Solución:
1. Verifica DATABASE_URL en Supabase
2. Verifica formato: postgresql://user:pass@host:5432/db
3. Reemplaza [PASSWORD] con contraseña real
4. Redeploy en Railway
```

### Logs no muestran nada

```
Causa: Logging no configurado
Solución:
En main.ts:
app.useLogger(app.get(Logger));
console.log('App listening on port', process.env.PORT);
```

---

## 📊 MONITOREO (opcional)

### UptimeRobot (para health checks)

```
1. Abre uptimerobot.com
2. Add monitor → HTTPS
3. URL: https://tu-app.railway.app/health
4. Check interval: 5 minutos
5. Alerts: email si cae
```

### Logs en Railway

```
Railway Dashboard → Logs
- Build logs: información del build
- Runtime logs: outputs de app
- Error logs: stderr
```

---

## 🎯 FLUJO FINAL

```
LOCAL (desarrollo)
    ↓ git push origin staging
RAILWAY STAGING (testing)
    ↓ E2E tests pasan ✅
    ↓ merge to main
RAILWAY PRODUCCIÓN (live)
    ↓ UptimeRobot monitorea
    ↓ 99.9% uptime
```

---

## 📚 DOCUMENTACIÓN COMPLETA

- **[RAILWAY.md](./RAILWAY.md)** - Setup en Railway
- **[SUPABASE.md](./SUPABASE.md)** - Setup en Supabase
- **[PRODUCTION.md](./PRODUCTION.md)** - Checklist final producción
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Problemas y soluciones

---

**Última actualización:** 2026-09-02
