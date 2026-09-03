# 📁 ESTRUCTURA COMPLETA DEL PROYECTO

Árbol visual de todas las carpetas y archivos.

---

## 🌳 ÁRBOL PRINCIPAL

```
runner-app-backend/
│
├── 📚 DOCUMENTACIÓN/
│   ├── CLAUDE.md                          ⭐ HUB CENTRAL
│   ├── README.md                          ← Inicio rápido
│   ├── ESTRUCTURA.md                      ← Este documento
│   ├── ROADMAP.md                         ← Fases de desarrollo
│   │
│   └── docs/
│       ├── README.md                      ← Índice de docs
│       ├── PROYECTO_RUNNER_APP.md         ← Visión del proyecto
│       ├── ARQUITECTURA.md                ← Cómo funciona
│       ├── NESTJS_CONCEPTS.md             ← Conceptos NestJS
│       │
│       ├── guias/
│       │   ├── README.md
│       │   ├── SETUP.md                   ← Instalación
│       │   ├── DESARROLLO.md              ← Cómo codificar
│       │   ├── TESTING.md                 ← Tests
│       │   └── TROUBLESHOOTING.md         ← Problemas
│       │
│       ├── api/
│       │   ├── README.md
│       │   ├── AUTH.md                    ← /auth endpoints
│       │   ├── USERS.md                   ← /users endpoints
│       │   ├── ACTIVITIES.md              ← /activities endpoints
│       │   ├── COACH.md                   ← /coach endpoints
│       │   └── COMMUNITY.md               ← /community endpoints
│       │
│       ├── database/
│       │   ├── README.md
│       │   ├── SCHEMA.md                  ← Tablas definidas
│       │   ├── MIGRATIONS.md              ← Cómo migrar
│       │   └── QUERIES.md                 ← Queries útiles
│       │
│       └── deployment/
│           ├── README.md
│           ├── RENDER.md                  ← Deploy a Render
│           ├── SUPABASE.md                ← BD en Supabase
│           └── PRODUCTION.md              ← Checklist prod
│
├── 🔧 CONFIGURACIÓN/
│   ├── docker-compose.yml                 ← Orquestación Docker
│   ├── Dockerfile                         ← Build backend
│   ├── package.json                       ← Dependencias
│   ├── package-lock.json                  ← Lock de deps
│   ├── tsconfig.json                      ← TypeScript config
│   ├── nest-cli.json                      ← NestJS CLI config
│   ├── .env.example                       ← Template vars
│   ├── .gitignore                         ← Git ignore
│   ├── .eslintrc.js                       ← ESLint config (futuro)
│   └── .prettierrc                        ← Prettier config (futuro)
│
├── 💻 src/ (Código NestJS)
│   ├── main.ts                            ← Entry point
│   ├── app.module.ts                      ← Módulo principal
│   ├── app.controller.ts                  ← Rutas /
│   ├── app.service.ts                     ← Lógica /
│   │
│   ├── common/
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts          ← Integración DB
│   │   │
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts   ← Manejo errores
│   │   │
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts    ← Formateo respuestas
│   │   │
│   │   ├── guards/                        (Futuro)
│   │   │   └── jwt.guard.ts
│   │   │
│   │   ├── decorators/                    (Futuro)
│   │   │   └── public.decorator.ts
│   │   │
│   │   ├── dto/                           (Futuro)
│   │   │   └── pagination.dto.ts
│   │   │
│   │   └── types/                         (Futuro)
│   │       └── index.ts
│   │
│   ├── modules/
│   │
│   │   ├── auth/                          🔴 PRÓXIMO (FASE 2)
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.service.spec.ts
│   │   │   ├── dto/
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── refresh-token.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── auth.entity.ts
│   │   │   └── strategies/                (Futuro)
│   │   │       └── jwt.strategy.ts
│   │   │
│   │   ├── users/                         🟡 (FASE 3)
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.service.spec.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   │
│   │   ├── activities/                    🟡 (FASE 4)
│   │   │   ├── activities.module.ts
│   │   │   ├── activities.controller.ts
│   │   │   ├── activities.service.ts
│   │   │   ├── activities.service.spec.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-activity.dto.ts
│   │   │   │   ├── update-activity.dto.ts
│   │   │   │   └── create-gps-point.dto.ts
│   │   │   └── entities/
│   │   │       ├── activity.entity.ts
│   │   │       └── gps-point.entity.ts
│   │   │
│   │   ├── coach/                         🟡 (FASE 5)
│   │   │   ├── coach.module.ts
│   │   │   ├── coach.controller.ts
│   │   │   ├── coach.service.ts
│   │   │   ├── coach.service.spec.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-plan.dto.ts
│   │   │   │   ├── update-plan.dto.ts
│   │   │   │   └── create-feedback.dto.ts
│   │   │   └── entities/
│   │   │       ├── training-plan.entity.ts
│   │   │       └── training-plan-day.entity.ts
│   │   │
│   │   └── community/                     🟡 (FASE 6)
│   │       ├── community.module.ts
│   │       ├── community.controller.ts
│   │       ├── community.service.ts
│   │       ├── community.service.spec.ts
│   │       ├── dto/
│   │       │   ├── create-kudo.dto.ts
│   │       │   ├── create-comment.dto.ts
│   │       │   └── create-follow.dto.ts
│   │       └── entities/
│   │           ├── kudo.entity.ts
│   │           ├── comment.entity.ts
│   │           └── follow.entity.ts
│   │
│   ├── config/                            (Futuro)
│   │   └── database.config.ts
│   │
│   ├── utils/                             (Futuro)
│   │   ├── jwt.util.ts
│   │   ├── password.util.ts
│   │   └── logger.util.ts
│   │
│   └── types/                             (Futuro)
│       └── index.ts
│
├── 🗄️  prisma/ (Base de datos)
│   ├── schema.prisma                      ← Definición de tablas
│   ├── migrations/                        ← Historial de cambios
│   │   ├── 20260901123456_init/
│   │   │   └── migration.sql
│   │   └── (más migraciones...)
│   └── seed.ts                            ← Datos de prueba (futuro)
│
├── 🧪 tests/ (Tests)
│   ├── unit/
│   │   ├── auth.service.spec.ts
│   │   ├── users.service.spec.ts
│   │   └── (más tests...)
│   │
│   └── e2e/
│       ├── auth.e2e.spec.ts
│       ├── users.e2e.spec.ts
│       └── (más tests...)
│
├── 🐳 infra/ (Infraestructura)
│   ├── README.md
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   └── docker-compose.prod.yml        (Futuro)
│   │
│   ├── kubernetes/                        (Futuro)
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── configmap.yaml
│   │
│   └── scripts/                           (Futuro)
│       ├── backup.sh
│       ├── restore.sh
│       └── deploy.sh
│
├── 📁 dist/ (Compilado - se crea con npm run build)
│   ├── main.js
│   ├── app.module.js
│   └── (resto del código compilado)
│
├── 📁 node_modules/ (Dependencias - se crea con npm install)
│   └── (cientos de carpetas)
│
└── 📝 ARCHIVOS RAÍZ/
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    ├── nest-cli.json
    ├── docker-compose.yml
    ├── Dockerfile
    ├── .env.example
    ├── .gitignore
    ├── README.md
    ├── CLAUDE.md
    ├── ESTRUCTURA.md
    ├── ROADMAP.md
    └── .git/                              (Control de versiones)
```

---

## 📊 ESTADÍSTICAS

```
Carpetas principales:        6
Subcarpetas:                 20+
Documentos:                  30+
Archivos de código:          50+ (cuando esté completo)
Líneas de código:            3000-4000 (objetivo)
Módulos:                     5
Endpoints:                   30+
Tests:                       50+
```

---

## 🎯 MAPEO: CARPETA → RESPONSABILIDAD

| Carpeta | Qué es | Quién edita |
|---------|--------|------------|
| docs/ | Documentación | Dev + Claude |
| src/ | Código NestJS | Dev + Claude |
| prisma/ | Base de datos | Dev + Claude |
| tests/ | Tests | Dev + Claude |
| infra/ | Docker, deploy | Dev (raramente) |
| dist/ | Compilado | npm run build |
| node_modules/ | Dependencias | npm install |

---

## 🔄 CICLO DE DESARROLLO

```
1. Editar código en src/
   └─ TypeScript en módulos

2. npm run start:dev
   └─ Recarga automática

3. Escribir tests en tests/
   └─ npm test

4. npm run build
   └─ Compila a dist/

5. docker-compose up
   └─ Corre en Docker

6. Validar en http://localhost:3000
   └─ Endpoints listos
```

---

## 📂 NIVELES DE PROFUNDIDAD

### **Nivel 1: Raíz (LO QUE VES)**
```
├── docs/
├── src/
├── prisma/
├── infra/
├── package.json
├── Dockerfile
├── docker-compose.yml
├── README.md
├── CLAUDE.md
└── ...
```

### **Nivel 2: Primeras carpetas**
```
docs/
├── guias/
├── api/
├── database/
└── deployment/

src/
├── common/
├── modules/
├── config/
└── utils/
```

### **Nivel 3: Módulos**
```
modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── dto/
└── entities/

modules/users/
├── (misma estructura)
```

---

## 🎬 CÓMO NAVEGAR

### **Si buscas documentación:**
```
cd docs/
├─ guias/     (tutoriales)
├─ api/       (endpoints)
├─ database/  (BD)
└─ deployment/ (prod)
```

### **Si buscas código:**
```
cd src/
├─ common/    (compartido)
└─ modules/   (features)
```

### **Si buscas configuración:**
```
Raíz:
├─ docker-compose.yml
├─ Dockerfile
├─ package.json
├─ tsconfig.json
└─ nest-cli.json
```

---

## 🚀 CRECIMIENTO DEL PROYECTO

### **Hoy (FASE 1)**
```
✅ Estructura base
✅ Docker setup
✅ Documentación

src/
├── common/
├── modules/
│   └── (vacío, solo estructura)
└── app.module.ts
```

### **En 2 semanas (FASE 2-3)**
```
✅ Auth (module completo)
✅ Users (module completo)

src/
├── modules/
│   ├── auth/ ✅
│   ├── users/ ✅
│   └── (otros vacíos)
```

### **En 4 semanas (FASE 4-6)**
```
✅ Auth + Users + Activities
✅ Coach + Community

src/
├── modules/
│   ├── auth/ ✅
│   ├── users/ ✅
│   ├── activities/ ✅
│   ├── coach/ ✅
│   └── community/ ✅
```

### **En 6 semanas (FASE 7-8)**
```
✅ Módulos completos
✅ Tests E2E
✅ Deploy staging
✅ Deploy prod

tests/
├── unit/ (50+ tests)
└── e2e/ (50+ tests)
```

---

## 💡 TIPS DE NAVEGACIÓN

### **¿Dónde debo codificar?**
→ En `src/modules/` - cada carpeta es un módulo

### **¿Dónde está la documentación?**
→ En `docs/` - busca por tema

### **¿Dónde está la configuración?**
→ En raíz: `package.json`, `docker-compose.yml`, etc

### **¿Dónde están los tests?**
→ En `tests/` o `*.spec.ts` en mismo lugar que código

### **¿Dónde está la BD?**
→ En `prisma/schema.prisma`

---

## 🎯 FLUJO TÍPICO

```
1. Necesito agregar un endpoint
   ↓
2. Leo docs/api/MODULO.md
   ↓
3. Voy a src/modules/MODULO/
   ↓
4. Edito controller, service, dto
   ↓
5. npm test en src/modules/MODULO/
   ↓
6. Valido en http://localhost:3000/docs
   ↓
7. Commit
```

---

Última actualización: 2026-09-01
