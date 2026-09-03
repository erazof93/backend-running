# 🗄️ DOCUMENTACIÓN DE BASE DE DATOS

PostgreSQL + Prisma ORM.

---

## 📚 DOCUMENTOS

### 📊 **SCHEMA.md** - Definición de tablas
**Contiene:**
- Definición de 11 tablas
- Campos y tipos de datos
- Relaciones entre tablas
- Índices para búsquedas rápidas
- Constraints

**Lee si:** Necesitas entender estructura BD

---

### 🔄 **MIGRATIONS.md** - Migraciones
**Contiene:**
- Cómo crear una migración
- Cómo ejecutar migraciones
- Cómo rollback
- Mejores prácticas

**Lee si:** Vas a cambiar el schema

---

### 💾 **QUERIES.md** - Consultas útiles
**Contiene:**
- Queries comunes con Prisma
- Ejemplos reales
- Best practices

**Lee si:** Necesitas hacer queries complejas

---

## 🎯 FLUJO TÍPICO

### **Entender la BD:**
```
1. Lee SCHEMA.md
   └─ Entiende tablas y relaciones

2. Lee docs/ARQUITECTURA.md
   └─ Entiende cómo se conecta todo
```

### **Cambiar la BD:**
```
1. Lee SCHEMA.md
   └─ Localiza tabla a cambiar

2. Modifica prisma/schema.prisma
   └─ Agrega campo o tabla

3. Crea migración:
   npx prisma migrate dev --name descripcion

4. Lee MIGRATIONS.md
   └─ Entiende qué pasó
```

### **Hacer queries:**
```
1. Lee QUERIES.md
   └─ Busca patrón similar

2. Adapta a tu caso
   
3. Prueba en service
```

---

## 📂 ARCHIVOS EN ESTA CARPETA

```
database/
├── README.md                ← Estás aquí
├── SCHEMA.md                ← Tablas y relaciones
├── MIGRATIONS.md            ← Cambios en BD
└── QUERIES.md               ← Ejemplos de queries
```

---

## 🗄️ TABLAS PRINCIPALES

```
users              ← Usuarios registrados
├─ email, passwordHash, name
├─ age, gender, photo
└─ subscription (free/premium/pro)

activities         ← Entrenamientos
├─ userId, type (easy/tempo/intervals)
├─ distance, duration, paceAvg
└─ elevation, effort

gps_points         ← Puntos GPS de actividades
├─ activityId, latitude, longitude
├─ altitude, speed, timestamp
└─ (INDEX en activityId para velocidad)

coaches            ← Entrenadores
├─ email, name, bio, photo
└─ (solo 1 en MVP)

training_plans     ← Planes de entrenamiento
├─ coachId, userId, name
├─ goalRace, goalTime, weeks
└─ startDate, isActive

training_plan_days ← Días de entrenamientos
├─ planId, dayOfWeek
├─ type, distance, structure (JSON)
└─ status (pending/completed/skipped)

kudos              ← "Me gusta" en actividades
├─ activityId, userId
└─ (UNIQUE constraint)

comments           ← Comentarios
├─ activityId, userId, text
└─ createdAt

follows            ← Seguir usuarios
├─ followerId, followingId
└─ (UNIQUE + NO self-follow)
```

**Ver detalles:** SCHEMA.md

---

## ⚡ COMANDOS ÚTILES

```bash
# Ver datos en GUI
npx prisma studio

# Crear migración
npx prisma migrate dev --name nombre_cambio

# Ver migraciones
npx prisma migrate status

# Rollback
npx prisma migrate resolve --rolled-back nombre_migracion

# Regenerar tipos
npx prisma generate

# Resetear BD (CUIDADO - borra todo)
npx prisma migrate reset --force
```

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Dónde está la definición de tablas?**
R: En SCHEMA.md

**P: ¿Cómo agrego un campo?**
R: Edita prisma/schema.prisma y crea migración

**P: ¿Cómo hago una query compleja?**
R: Ver QUERIES.md o pregunta a Claude

**P: ¿Qué es una migración?**
R: Un cambio en la BD (agregar tabla, campo, etc)

**P: ¿Puedo hacer rollback?**
R: Sí, con `npx prisma migrate resolve`

---

## 🎬 PRÓXIMO PASO

Según tu necesidad:

- 📊 Entender BD → Lee SCHEMA.md
- 🔄 Cambiar BD → Lee MIGRATIONS.md
- 💾 Hacer queries → Lee QUERIES.md

---

Última actualización: 2026-09-01
