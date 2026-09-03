# 📚 DOCUMENTACIÓN DEL PROYECTO

Toda la documentación del Runner App Backend está aquí, organizada por temas.

---

## 🎯 ¿POR DÓNDE EMPIEZO?

### **Si es tu primer día:**
1. **Lee** → `PROYECTO_RUNNER_APP.md` (entender qué es)
2. **Lee** → `ARQUITECTURA.md` (entender cómo funciona)
3. **Lee** → `guias/SETUP.md` (instalar todo)
4. **Lee** → `guias/DESARROLLO.md` (cómo trabajar)
5. **Ve a** → `../CLAUDE.md` (siguiente paso)

### **Si necesitas construir un módulo:**
1. **Lee** → `api/{MODULO}.md` (endpoints exactos)
2. **Lee** → `database/SCHEMA.md` (tablas afectadas)
3. **Ve a** → `../CLAUDE.md` (skill para ese módulo)

### **Si necesitas deploya:**
1. **Lee** → `deployment/RENDER.md`
2. **Lee** → `deployment/SUPABASE.md`
3. **Lee** → `deployment/PRODUCTION.md`

---

## 📂 ESTRUCTURA DE ESTA CARPETA

```
docs/
├── README.md                    ← Estás aquí
├── PROYECTO_RUNNER_APP.md       ← Qué es el proyecto
├── ARQUITECTURA.md              ← Cómo funciona todo
├── NESTJS_CONCEPTS.md           ← Conceptos NestJS
├── ESTRUCTURA.md                ← Carpetas del código
│
├── guias/                       ← Tutoriales paso a paso
│   ├── SETUP.md                 ← Instalación
│   ├── DESARROLLO.md            ← Cómo codificar
│   ├── TESTING.md               ← Escribir tests
│   └── TROUBLESHOOTING.md       ← Solucionar problemas
│
├── api/                         ← Documentación de endpoints
│   ├── AUTH.md                  ← POST /auth/register, etc
│   ├── USERS.md                 ← GET /users/:id, etc
│   ├── ACTIVITIES.md            ← POST /activities, etc
│   ├── COACH.md                 ← POST /coach/plans, etc
│   └── COMMUNITY.md             ← GET /feed, etc
│
├── database/                    ← Documentación BD
│   ├── SCHEMA.md                ← Definición de tablas
│   ├── MIGRATIONS.md            ← Cómo migrar datos
│   └── QUERIES.md               ← Queries útiles
│
└── deployment/                  ← Deploy a producción
    ├── RENDER.md                ← Deploy a Render
    ├── SUPABASE.md              ← Usar Supabase
    └── PRODUCTION.md            ← Checklist producción
```

---

## 📖 DOCUMENTOS PRINCIPALES

### **Conceptos**
| Doc | Tema | Tiempo |
|-----|------|--------|
| PROYECTO_RUNNER_APP.md | Visión del proyecto | 10 min |
| ARQUITECTURA.md | Cómo funciona todo | 20 min |
| NESTJS_CONCEPTS.md | Conceptos NestJS | 15 min |
| ESTRUCTURA.md | Carpetas del código | 10 min |

### **Guías (Tutoriales)**
| Doc | Tema | Tiempo |
|-----|------|--------|
| guias/SETUP.md | Instalación paso a paso | 30 min |
| guias/DESARROLLO.md | Cómo codificar | 20 min |
| guias/TESTING.md | Tests unitarios | 15 min |
| guias/TROUBLESHOOTING.md | Solucionar problemas | Varía |

### **API (Endpoints)**
| Doc | Endpoints | Tiempo |
|-----|-----------|--------|
| api/AUTH.md | /auth/register, /login | 10 min |
| api/USERS.md | /users/:id, PUT | 10 min |
| api/ACTIVITIES.md | POST /activities, GPS | 15 min |
| api/COACH.md | /coach/plans, feedback | 10 min |
| api/COMMUNITY.md | /feed, kudos, follows | 10 min |

### **Database**
| Doc | Tema | Tiempo |
|-----|------|--------|
| database/SCHEMA.md | Tablas y relaciones | 15 min |
| database/MIGRATIONS.md | Cómo cambiar schema | 10 min |
| database/QUERIES.md | Queries útiles | Varía |

### **Deployment**
| Doc | Tema | Tiempo |
|-----|------|--------|
| deployment/RENDER.md | Deploy a Render | 20 min |
| deployment/SUPABASE.md | Usar Supabase | 15 min |
| deployment/PRODUCTION.md | Checklist prod | 10 min |

---

## 🎯 CASO DE USO: "Quiero crear el módulo Auth"

Sigue estos pasos:

```
1. Lee ../CLAUDE.md
   └─ Entender qué es MÓDULO 1

2. Lee api/AUTH.md
   └─ Entender qué endpoints crear

3. Lee database/SCHEMA.md
   └─ Entender tabla 'users'

4. Lee guias/DESARROLLO.md
   └─ Entender flujo NestJS

5. Di en Claude:
   "Crea el módulo auth" o "Usa SKILL_AUTH"
   └─ Yo creo todo automáticamente
```

---

## 🎯 CASO DE USO: "Deployaré a producción"

Sigue estos pasos:

```
1. Lee deployment/RENDER.md
   └─ Configurar backend en Render

2. Lee deployment/SUPABASE.md
   └─ Configurar BD en Supabase

3. Lee deployment/PRODUCTION.md
   └─ Checklist final

4. Lee guias/TROUBLESHOOTING.md
   └─ Si hay problemas
```

---

## 🎯 CASO DE USO: "No sé qué hacer"

Ve al documento más general:

```
1. ../CLAUDE.md ← Guía maestra
   └─ Allí te digo exactamente qué hacer paso a paso
```

---

## 📖 CÓMO LEER ESTOS DOCUMENTOS

### **Formato de API docs (api/*.md):**
```
# Endpoints de la API

## POST /auth/register
Crear nuevo usuario

**Request:**
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "Carlos Ruiz"
}

**Response (200 OK):**
{
  "success": true,
  "data": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "token": "eyJhbGc..."
  }
}

**Errores (400, 409, etc):**
- Email ya existe
- Password < 6 caracteres
```

### **Formato de guías (guias/*.md):**
```
# Título

Explicación corta

## Paso 1: Hacer X
```bash
comando
```
Qué hace

## Paso 2: Hacer Y
...

## Troubleshooting
- Problema 1: Solución
- Problema 2: Solución
```

---

## 🔄 CICLO DE ACTUALIZACIÓN

Estos documentos se actualizan según:

| Cuándo | Qué | Quién |
|--------|-----|-------|
| Nuevo módulo | Agregar api/{MODULO}.md | Claude |
| Cambio en schema | Actualizar database/SCHEMA.md | Claude |
| Nuevo skill | Actualizar ../CLAUDE.md | Claude |
| Deploy | Actualizar deployment/*.md | Dev |

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Dónde está la API docs?**
R: En `api/` - Hay un `.md` para cada módulo

**P: ¿Cómo instalo?**
R: Ver `guias/SETUP.md`

**P: ¿Cómo codifico?**
R: Ver `guias/DESARROLLO.md`

**P: ¿Cómo deployar?**
R: Ver `deployment/`

**P: Algo no funciona**
R: Ver `guias/TROUBLESHOOTING.md`

---

## 🎬 PRÓXIMO PASO

👉 **Ve a:** `../CLAUDE.md`

Allí encontrarás el roadmap completo y qué hacer ahora.

---

Última actualización: 2026-09-01
