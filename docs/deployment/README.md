# 🚀 DEPLOYMENT Y PRODUCCIÓN

Cómo llevar tu app a producción.

---

## 📚 DOCUMENTOS

### 🌐 **RENDER.md** - Deploy a Render
**Contiene:**
- Crear cuenta en Render
- Conectar GitHub
- Configurar variables
- Deploy automático
- Monitoreo

**Lee si:** Quieres hostear el backend

---

### 📦 **SUPABASE.md** - Base de datos en Supabase
**Contiene:**
- Crear proyecto Supabase
- Conectar Prisma
- Migraciones en producción
- Backups
- Seguridad

**Lee si:** Quieres hostear la BD en la nube

---

### ✅ **PRODUCTION.md** - Checklist de producción
**Contiene:**
- Seguridad
- Performance
- Monitoreo
- Logs
- Alertas

**Lee si:** Vas a lanzar a producción

---

## 🎯 OPCIONES DE HOSTING

### **OPCIÓN 1: Render + Supabase (RECOMENDADO - Gratis tier)**
```
Backend:     Render.com (Node.js)
Database:    Supabase (PostgreSQL)
Cost:        ~$0-20/mes
Setup time:  30 minutos
```
✅ Mejor para empezar  
✅ Gratis (o muy barato)  
✅ Fácil de escalar  

**Guía:** RENDER.md + SUPABASE.md

---

### **OPCIÓN 2: Railway (Todo en uno)**
```
Backend + DB en Railway
Cost:        ~$5/mes
Setup time:  20 minutos
```
✅ Más simple  
✅ Todo integrado  

**Guía:** (futuro)

---

### **OPCIÓN 3: DigitalOcean (Control total)**
```
VPS con Docker
Cost:        ~$5-50/mes
Setup time:  1-2 horas
```
✅ Más control  
✅ Más barato a escala  

**Guía:** (futuro)

---

## 📅 FASES

### **FASE 1: Setup Local (HOY)**
```
✅ Backend funciona en localhost:3000
✅ BD en PostgreSQL local
✅ Tests pasando
```

### **FASE 2: Preparar para Prod**
```
⬜ Leer PRODUCTION.md
⬜ Agregar variables de entorno
⬜ Limpiar logs sensibles
⬜ Validar error handling
```

### **FASE 3: Deploy a Staging**
```
⬜ Crear Render app
⬜ Crear Supabase project
⬜ Deploy código
⬜ Testear endpoints
```

### **FASE 4: Deploy a Producción**
```
⬜ Validar checklist PRODUCTION.md
⬜ Deploy
⬜ Monitoreo
⬜ ¡Lanzar app!
```

---

## ⏱️ TIMELINE

```
Hoy:          Setup local + primeros módulos
1 semana:     Auth + Users
2 semanas:    Activities + Coach
3 semanas:    Community + Testing
4 semanas:    Deploy staging
5 semanas:    Deploy prod
```

---

## 🎯 STACK RECOMENDADO (Gratis - $20/mes)

```
Framework:      NestJS (Node.js)    ✅
Database:       PostgreSQL          ✅
ORM:            Prisma              ✅
Hosting:        Render              🔄 (después)
DB Hosting:     Supabase            🔄 (después)
Monitoring:     Built-in + Uptime   🔄 (después)
```

---

## 📂 ARCHIVOS EN ESTA CARPETA

```
deployment/
├── README.md                ← Estás aquí
├── RENDER.md                ← Deploy a Render
├── SUPABASE.md              ← BD en Supabase
└── PRODUCTION.md            ← Checklist prod
```

---

## ⚠️ IMPORTANTE

```
ANTES DE LANZAR A PRODUCCIÓN:

1. ✅ Tests passing
2. ✅ Environment variables configuradas
3. ✅ Error handling completo
4. ✅ Validación en todos los inputs
5. ✅ CORS configurado
6. ✅ Rate limiting
7. ✅ Logs limpios
8. ✅ Database backups
9. ✅ Monitoreo activado
10. ✅ Checklist PRODUCTION.md completado
```

---

## 🚨 PRIMER DEPLOY

**Pasos resumidos:**

```bash
# 1. Leer documentos
cat RENDER.md
cat SUPABASE.md

# 2. Crear cuenta Render
https://render.com

# 3. Crear cuenta Supabase
https://supabase.com

# 4. Conectar GitHub
# (Render hace deploy automático)

# 5. Configurar variables
RENDER_ENV_DATABASE_URL=...
JWT_SECRET=...

# 6. Deploy
git push origin main
# Render deploy automáticamente

# 7. Validar
curl https://tu-app.onrender.com/health
```

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Cuándo debo hacer deploy?**
R: Después de FASE 2 (Auth + Tests) está bien

**P: ¿Es gratis?**
R: Render tier gratis (lenta) + Supabase free 500MB

**P: ¿Qué pasa si falla?**
R: Ver TROUBLESHOOTING en guias/

**P: ¿Cómo hago rollback?**
R: Render guarda últimas 10 versiones

---

## 🎬 PRÓXIMO PASO

1. **Ahora:** Termina módulos locales
2. **Próxima semana:** Lee RENDER.md
3. **Siguiente:** Deploy staging

---

Última actualización: 2026-09-01
