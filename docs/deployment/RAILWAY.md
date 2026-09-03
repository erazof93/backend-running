# 🚂 RAILWAY - Deployment Guide

**Railway** es la plataforma de deployment que usamos para Runner App Backend (staging + producción).

---

## 📋 ÍNDICE

1. [Setup Inicial](#setup-inicial)
2. [Configuración de Variables](#configuración-de-variables)
3. [Deploy Automático](#deploy-automático)
4. [Conexión Supabase](#conexión-supabase)
5. [Monitoreo & Logs](#monitoreo--logs)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 SETUP INICIAL

### Paso 1: Crear cuenta en Railway

```
1. Abre railway.app
2. Sign up con GitHub
3. Autoriza Railway para acceder a tus repos
```

### Paso 2: Crear proyecto

```
1. Dashboard → New Project
2. Selecciona: "Deploy from GitHub"
3. Conecta tu repositorio backend-running
4. Railway automáticamente detecta:
   - Tipo: Node.js
   - Build command: npm run build (o pnpm build)
   - Start command: npm run start (o pnpm start)
```

### Paso 3: Verificar detección

Railway debe mostrar:
```
✅ Node.js detected
✅ package.json found
✅ Build: detected
✅ Start: detected
```

Si no lo detecta, actualiza:
```
Settings → Build Command: pnpm build
Settings → Start Command: pnpm start:prod
```

---

## 🔧 CONFIGURACIÓN DE VARIABLES

Railway maneja environment variables en el dashboard.

### Variables necesarias

```
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres
JWT_SECRET=tu-secreto-super-seguro-aqui
NODE_ENV=staging
PORT=8080
```

### Cómo agregarlo

```
1. Dashboard → Tu proyecto
2. Variables → Add Variable
3. Agrega cada una:
   - Name: DATABASE_URL
   - Value: postgresql://user:password@...
4. Deploy → Redeploy with new variables
```

---

## 🔗 CONEXIÓN SUPABASE

### Obtener DATABASE_URL de Supabase

```
1. Abre Supabase dashboard
2. Tu proyecto → Settings → Database
3. Connection string → PostgreSQL (URI)
4. Copia la URL completa
5. Reemplaza [YOUR-PASSWORD] con tu contraseña
```

Formato esperado:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
```

### Conectar desde Railway

```
1. Railway → Variables
2. DATABASE_URL = (pega URL de Supabase)
3. Redeploy
4. Verifica logs que DB conecte
```

---

## 🚀 DEPLOY AUTOMÁTICO

Railway deploya automáticamente cuando haces push a main/master.

### Flujo

```
1. git push origin main
   ↓
2. GitHub webhook → Railway
   ↓
3. Railway detecta cambios
   ↓
4. Build: pnpm install && pnpm build
   ↓
5. Start: pnpm start:prod
   ↓
6. URL automática: https://runner-app-prod.railway.app
```

### Verificar Deploy

```
Railway Dashboard → Deployments → [última]
- Status: ✅ Success
- Build logs: sin errores
- Logs de app: "Listening on port 8080"
```

---

## 📊 MONITOREO & LOGS

### Ver Logs en Vivo

```
Railway Dashboard → Logs
├─ Build logs: compilación
├─ App logs: runtime (stdout/stderr)
└─ Eventos: deploy history
```

### Comandos útiles en logs

```
// Cuando app inicia correctamente:
"Listening on port 8080"
"Database connected: ✅"

// Errores comunes:
"DATABASE_URL not found" → agregar variable
"Module not found" → pnpm install incompleto
"Build failed" → revisar TypeScript errors
```

---

## 🔍 HEALTH CHECK

Railway proporciona una URL para health checks:

```
GET https://tu-app.railway.app/health

Response esperado:
{
  "status": "ok",
  "timestamp": "2026-09-02T...",
  "uptime": 3600
}
```

Para habilitarlo en NestJS, agregar a app.controller.ts:

```typescript
@Get('health')
health() {
  return {
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
  };
}
```

---

## 🐛 TROUBLESHOOTING

### Error: "DATABASE_URL not found"

```
Solución:
1. Railway → Variables
2. Verifica DATABASE_URL está agregado
3. Redeploy: Redeploy Latest
```

### Error: "Build failed"

```
Solución:
1. Revisa build logs
2. Busca línea de error
3. Causas comunes:
   - TypeScript errors
   - Imports inválidos
   - package.json corruption
4. Fix y push nuevamente
```

### Error: "Port already in use"

```
Solución:
En package.json, ensure start script usa $PORT:
"start:prod": "node dist/main.js"

En main.ts:
const port = process.env.PORT || 3000;
await app.listen(port);
```

### App inicia pero no responde

```
Solución:
1. Verifica DATABASE_URL correcta
2. Verifica Supabase está online
3. Revisa logs de app
4. Intenta health check: /health
```

---

## 📈 ESCALADO (después)

Si necesitas escalar:

```
Railway → Settings → Plan
├─ Free: $5/mes (bueno para staging)
├─ Standard: $20/mes (producción)
└─ Enterprise: custom
```

---

## 🔐 SEGURIDAD

Checklist antes de producción:

```
✅ JWT_SECRET es fuerte (32+ chars)
✅ DATABASE_URL está en variables (no hardcoded)
✅ NODE_ENV=production en prod
✅ CORS configurado en main.ts
✅ Rate limiting en endpoints públicos
✅ Logs no exponen secrets
✅ DB backups habilitados en Supabase
```

---

## 📚 LINKS ÚTILES

- [Railway Docs](https://docs.railway.app)
- [Railway Node.js Guide](https://docs.railway.app/guides/nodejs)
- [Supabase Connection](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [NestJS Deployment](https://docs.nestjs.com/deployment)

---

## 🎯 PRÓXIMOS PASOS

Cuando estés en Railway:

```
1. Verifica app inicia sin errores
2. Prueba endpoints: /docs (Swagger)
3. Prueba health check: /health
4. Ejecuta FASE 7 (E2E Testing contra Railway)
5. Si todo está ✅ → FASE 8 (Migración a producción)
```

---

**Última actualización:** 2026-09-02
