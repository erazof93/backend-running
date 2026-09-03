# 🏃 Runner App Backend - NestJS

Aplicación de entrenamiento para corredores competitivos con coaching en vivo.

---

## ⚡ INICIO RÁPIDO

### **1. Requisitos**
- Docker & Docker Compose
- Node.js 20+ (opcional, si no usas Docker)
- Git

### **2. Clonar/Setup**
```bash
# Opción A: Con Docker (RECOMENDADO)
git clone <repo>
cd runner-app-backend
docker-compose up

# En otra terminal:
npm install
npm run start:dev

# Opción B: Sin Docker
npm install
npm run start:dev
# (necesitas PostgreSQL 16 corriendo)
```

### **3. Validar que funciona**
```bash
curl http://localhost:3000/health
# Deberías ver:
# {"success":true,"data":{"status":"ok",...}}

# Swagger docs:
# http://localhost:3000/docs
```

### **4. Ver estructura del proyecto**
```bash
# Abre CLAUDE.md (tu guía maestra)
cat CLAUDE.md

# O directamente la estructura:
tree -L 3 --charset ascii
```

---

## 📚 DOCUMENTACIÓN PRINCIPAL

| Documento | Para qué | Tiempo |
|-----------|----------|--------|
| **CLAUDE.md** | 👈 EMPIEZA AQUÍ - Guía maestra | 5 min |
| docs/PROYECTO_RUNNER_APP.md | Entender el proyecto | 10 min |
| docs/ARQUITECTURA.md | Cómo funciona todo | 15 min |
| docs/guias/SETUP.md | Setup detallado | 30 min |
| docs/guias/DESARROLLO.md | Cómo desarrollar | 20 min |

---

## 🎯 MÓDULOS A CONSTRUIR

```
1. 🔴 Auth (autenticación)        ← PRÓXIMO
2. 🟡 Users (usuarios)            
3. 🟡 Activities (entrenamientos) 
4. 🟡 Coach (panel del coach)     
5. 🟡 Community (comunidad)       
```

**Instrucciones:** Ver CLAUDE.md → Sección "Módulos a Implementar"

---

## 🔧 COMANDOS PRINCIPALES

### **Desarrollo**
```bash
npm run start:dev          # Backend en watch mode
npm run build              # Compilar TypeScript
npm test                   # Correr tests
npm run lint               # Verificar código
```

### **Base de datos**
```bash
npx prisma migrate dev     # Crear migración
npx prisma studio         # GUI para ver datos
npx prisma generate        # Regenerar types
```

### **Docker**
```bash
docker-compose up          # Inicia todo
docker-compose down        # Detiene todo
docker-compose logs        # Ver logs
```

---

## 📂 ESTRUCTURA DE CARPETAS

```
runner-app-backend/
├── 📚 docs/                  ← Documentación
│   ├── guias/                ← Tutoriales paso a paso
│   ├── api/                  ← Endpoint docs
│   ├── database/             ← Schema, queries
│   └── deployment/           ← Deploy guides
│
├── 💻 src/                   ← Código NestJS
│   ├── modules/
│   │   ├── auth/             ← 🔴 PRÓXIMO módulo
│   │   ├── users/
│   │   ├── activities/
│   │   ├── coach/
│   │   └── community/
│   ├── common/               ← Código compartido
│   └── main.ts
│
├── 🗄️  prisma/               ← Database
│   └── schema.prisma
│
├── 🧪 tests/                 ← Tests
│   └── e2e/
│
└── 🔧 infra/                 ← Docker, deploy
    └── docker/
```

**Detalles:** Ver CLAUDE.md → Sección "Árbol del Proyecto"

---

## 🚀 FASE ACTUAL

### ✅ COMPLETADO (FASE 1: Setup)
- Estructura Docker
- NestJS configurado
- Prisma integrado
- Documentación base

### 🔴 PRÓXIMO (FASE 2: Auth)
- Crear módulo auth
- Endpoints register/login
- JWT + bcrypt

### 📅 DESPUÉS
- FASE 3: Users
- FASE 4: Activities
- FASE 5: Coach
- FASE 6: Community
- FASE 7: Testing completo
- FASE 8: Deploy

---

## 🎓 CONCEPTOS PRINCIPALES

### **NestJS**
- **Modules**: Organizan código en features
- **Controllers**: Definen rutas HTTP
- **Services**: Contienen lógica de negocio
- **DTOs**: Validan datos de entrada

### **Prisma**
- **ORM**: Comunica con base de datos
- **Schema**: Define tablas
- **Migrations**: Cambios en BD

### **API**
- **JWT**: Token para autenticación
- **REST**: Endpoints CRUD
- **Swagger**: Documentación automática

**Aprende más:** Ver CLAUDE.md → Sección "Conceptos Clave"

---

## 🆘 TROUBLESHOOTING

### **"Puerto 3000 en uso"**
```bash
# Mata proceso en puerto 3000
lsof -ti:3000 | xargs kill -9
```

### **"PostgreSQL no conecta"**
```bash
# Verifica que docker-compose está corriendo
docker-compose ps

# Ve logs:
docker-compose logs postgres
```

### **"npm install falla"**
```bash
# Limpia cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Más ayuda:** Ver docs/guias/TROUBLESHOOTING.md

---

## 📞 CONTACTO & AYUDA

| Problema | Documento |
|----------|-----------|
| No arranca | docs/guias/TROUBLESHOOTING.md |
| No entiendo NestJS | docs/ARQUITECTURA.md |
| No sé qué hacer | CLAUDE.md |
| Necesito API docs | docs/api/*.md |

---

## 📊 ESTADÍSTICAS DEL PROYECTO

```
Backend:        NestJS (TypeScript)
Base de datos:  PostgreSQL
ORM:            Prisma
Frontend:       Android/iOS (futuro)
Coach Dashboard: Web (futuro)

Líneas de código: ~500 (base, sin módulos)
Módulos:         5 principales
Endpoints:       30+ (cuando esté completo)
Tests:           50+ (objetivo)
```

---

## 🎯 CHECKLIST: ANTES DE EMPEZAR

```
□ Leíste CLAUDE.md
□ Leíste este README
□ Docker está instalado
□ docker-compose up funciona
□ npm install funcionó
□ GET http://localhost:3000/health responde
□ Listo para: docs/api/AUTH.md
```

---

## 🚀 PRÓXIMO PASO

### **Lee CLAUDE.md ← EMPIEZA AQUÍ**

Allí encontrarás:
- Guía paso a paso
- Módulos a implementar
- Skills para cada tarea
- Checklist completo

---

Version: 1.0  
Última actualización: 2026-09-01  
Creado con ❤️ para corredores competitivos
