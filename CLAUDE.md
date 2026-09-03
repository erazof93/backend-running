# 🚀 CLAUDE.md - Runner App Backend (NestJS)

**Tu guía maestra para trabajar el proyecto módulo por módulo.**

---

## 📋 ÍNDICE RÁPIDO

1. [Visión General](#visión-general)
2. [Árbol del Proyecto](#árbol-del-proyecto)
3. [Módulos a Implementar](#módulos-a-implementar)
4. [Flujo de Trabajo](#flujo-de-trabajo)
5. [Agentes & Skills](#agentes--skills)
6. [Checklist de Desarrollo](#checklist-de-desarrollo)

---

## 🎯 VISIÓN GENERAL

**Runner App**: Aplicación de entrenamiento para corredores competitivos con coaching en vivo.

```
USUARIO FINAL
    │
    ├─ 📱 App Mobile (Android/iOS)
    │   └─ GPS tracking
    │   └─ Ver planes de entrenamiento
    │   └─ Chat con coach
    │   └─ Ver progreso
    │
    ├─ 🏃 Coach (Web Dashboard)
    │   └─ Crear planes
    │   └─ Ver atletas
    │   └─ Dar feedback
    │   └─ Video call en vivo
    │
    └─ ☁️  Backend NestJS (¡Lo que construimos!)
        └─ API REST
        └─ Autenticación JWT
        └─ Base de datos Prisma
        └─ Validación automática
```

---

## 📁 ÁRBOL DEL PROYECTO

```
runner-app-backend/
│
├── 📚 DOCUMENTACIÓN/
│   ├── CLAUDE.md                          ← Estás aquí (hub central)
│   ├── README.md                          ← Inicio rápido
│   ├── ESTRUCTURA.md                      ← Explicación de carpetas
│   ├── ROADMAP.md                         ← Fases de desarrollo
│   │
│   └── docs/
│       ├── PROYECTO_RUNNER_APP.md         ← Contexto y visión
│       ├── ARQUITECTURA.md                ← Cómo funciona todo
│       ├── NESTJS_CONCEPTS.md             ← Conceptos NestJS
│       │
│       ├── guias/
│       │   ├── SETUP.md                   ← Instalación paso a paso
│       │   ├── DESARROLLO.md              ← Cómo desarrollar
│       │   ├── TESTING.md                 ← Escribir tests
│       │   └── TROUBLESHOOTING.md         ← Solucionar problemas
│       │
│       ├── api/
│       │   ├── AUTH.md                    ← Endpoints /auth
│       │   ├── USERS.md                   ← Endpoints /users
│       │   ├── ACTIVITIES.md              ← Endpoints /activities
│       │   ├── COACH.md                   ← Endpoints /coach
│       │   └── COMMUNITY.md               ← Endpoints /community
│       │
│       ├── database/
│       │   ├── SCHEMA.md                  ← Definición de tablas
│       │   ├── MIGRATIONS.md              ← Cómo migrar
│       │   └── QUERIES.md                 ← Consultas útiles
│       │
│       └── deployment/
│           ├── RENDER.md                  ← Deploy a Render
│           ├── SUPABASE.md                ← Usar Supabase
│           └── PRODUCTION.md              ← Checklist prod
│
├── 🔧 CONFIGURACIÓN/
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── .env.example
│   └── .gitignore
│
├── 💻 BACKEND (src/)/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   │
│   ├── common/                            ← Código compartido
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts
│   │   ├── guards/
│   │   │   └── jwt.guard.ts               ← (Futuro)
│   │   ├── decorators/
│   │   │   └── public.decorator.ts        ← (Futuro)
│   │   ├── dto/
│   │   │   └── pagination.dto.ts          ← (Futuro)
│   │   └── types/
│   │       └── index.ts                   ← (Futuro)
│   │
│   ├── modules/
│   │   ├── auth/                          ← 🔴 MÓDULO 1 (PRÓXIMO)
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── register.dto.ts
│   │   │   │   └── login.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── auth.entity.ts
│   │   │   └── strategies/
│   │   │       └── jwt.strategy.ts        ← (Futuro)
│   │   │
│   │   ├── users/                         ← 🟡 MÓDULO 2
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   │
│   │   ├── activities/                    ← 🟡 MÓDULO 3
│   │   │   ├── activities.module.ts
│   │   │   ├── activities.controller.ts
│   │   │   ├── activities.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-activity.dto.ts
│   │   │   │   └── create-gps-point.dto.ts
│   │   │   └── entities/
│   │   │       ├── activity.entity.ts
│   │   │       └── gps-point.entity.ts
│   │   │
│   │   ├── coach/                         ← 🟡 MÓDULO 4
│   │   │   ├── coach.module.ts
│   │   │   ├── coach.controller.ts
│   │   │   ├── coach.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-plan.dto.ts
│   │   │   │   └── create-feedback.dto.ts
│   │   │   └── entities/
│   │   │       └── training-plan.entity.ts
│   │   │
│   │   └── community/                     ← 🟡 MÓDULO 5
│   │       ├── community.module.ts
│   │       ├── community.controller.ts
│   │       ├── community.service.ts
│   │       ├── dto/
│   │       │   ├── create-kudo.dto.ts
│   │       │   └── create-comment.dto.ts
│   │       └── entities/
│   │           └── activity-feed.entity.ts
│   │
│   ├── config/                            ← Configuración app
│   │   └── (futuro)
│   │
│   └── utils/                             ← Funciones helper
│       ├── jwt.util.ts                    ← (Futuro)
│       ├── password.util.ts               ← (Futuro)
│       └── logger.util.ts                 ← (Futuro)
│
├── 🗄️  DATABASE/
│   ├── prisma/
│   │   ├── schema.prisma                  ← Tablas definidas
│   │   └── migrations/                    ← Historial
│   │
│   └── docs/
│       └── database/
│           └── *.md                       ← Documentación DB
│
├── 🧪 TESTS/
│   ├── unit/
│   │   └── (futuro)
│   │
│   └── e2e/
│       └── app.e2e.spec.ts                ← (Futuro)
│
├── 🐳 INFRAESTRUCTURA/
│   ├── infra/
│   │   ├── docker/
│   │   │   └── docker-compose.yml
│   │   ├── kubernetes/
│   │   │   └── (futuro)
│   │   └── scripts/
│   │       └── (futuro)
│   │
│   └── docs/
│       └── deployment/
│           └── *.md
│
└── 📱 FRONTEND (FUTURO)/
    ├── android/
    ├── ios/
    └── web-coach/
```

---

## 🎬 MÓDULOS A IMPLEMENTAR (EN ORDEN)

### 🔴 MÓDULO 1: Autenticación (Auth)
**Prioridad:** 🔴 CRÍTICA  
**Tiempo estimado:** 4-6 horas  
**Dependencias:** Prisma, JWT, bcrypt  

**Qué implementar:**
- ✅ POST `/auth/register` - Crear usuario
- ✅ POST `/auth/login` - Login con JWT
- ✅ POST `/auth/logout` - Logout
- ✅ POST `/auth/refresh-token` - Refrescar JWT
- ✅ GET `/auth/me` - Obtener usuario actual
- ✅ Validación con DTOs
- ✅ Tests unitarios

**Archivos a crear:**
```
src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── dto/
│   ├── register.dto.ts
│   └── login.dto.ts
├── entities/
│   └── auth.entity.ts
├── strategies/
│   └── jwt.strategy.ts (futuro)
└── auth.service.spec.ts
```

**Documentación:**
- `docs/api/AUTH.md` - Endpoints detallados
- `docs/guias/DESARROLLO.md` - Cómo hacer JWT

**Skill asociado:**
- 🔧 SKILL_AUTH - Crear módulo auth paso a paso

---

### 🟡 MÓDULO 2: Usuarios (Users)
**Prioridad:** 🟡 ALTA  
**Tiempo estimado:** 3-4 horas  
**Dependencias:** Auth, Prisma  

**Qué implementar:**
- ✅ GET `/users/:id` - Obtener usuario
- ✅ PUT `/users/:id` - Actualizar perfil
- ✅ GET `/users/:id/activities` - Actividades del usuario
- ✅ GET `/users/:id/followers` - Seguidores
- ✅ GET `/users/:id/following` - Siguiendo
- ✅ Tests unitarios

**Archivos a crear:**
```
src/modules/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── dto/
│   ├── create-user.dto.ts
│   └── update-user.dto.ts
├── entities/
│   └── user.entity.ts
└── users.service.spec.ts
```

**Skill asociado:**
- 🔧 SKILL_USERS - Crear módulo users paso a paso

---

### 🟡 MÓDULO 3: Actividades (Activities)
**Prioridad:** 🟡 ALTA  
**Tiempo estimado:** 5-6 horas  
**Dependencias:** Auth, Users, Prisma  

**Qué implementar:**
- ✅ POST `/activities` - Crear actividad
- ✅ GET `/activities/:id` - Obtener actividad
- ✅ PUT `/activities/:id` - Actualizar actividad
- ✅ DELETE `/activities/:id` - Eliminar actividad
- ✅ POST `/activities/:id/gps-points` - Agregar puntos GPS
- ✅ GET `/activities/:id/gps-points` - Obtener GPS
- ✅ Tests unitarios

**Archivos a crear:**
```
src/modules/activities/
├── activities.module.ts
├── activities.controller.ts
├── activities.service.ts
├── dto/
│   ├── create-activity.dto.ts
│   └── create-gps-point.dto.ts
├── entities/
│   ├── activity.entity.ts
│   └── gps-point.entity.ts
└── activities.service.spec.ts
```

**Skill asociado:**
- 🔧 SKILL_ACTIVITIES - Crear módulo activities paso a paso

---

### 🟡 MÓDULO 4: Coach (Coach Dashboard)
**Prioridad:** 🟡 MEDIA  
**Tiempo estimado:** 4-5 horas  
**Dependencias:** Auth, Users, Activities  

**Qué implementar:**
- ✅ GET `/coach/athletes` - Ver mis atletas
- ✅ GET `/coach/athletes/:id` - Perfil de atleta
- ✅ POST `/coach/plans` - Crear plan de entrenamiento
- ✅ PUT `/coach/plans/:id` - Actualizar plan
- ✅ POST `/coach/athletes/:id/feedback` - Dar feedback
- ✅ Tests unitarios

**Archivos a crear:**
```
src/modules/coach/
├── coach.module.ts
├── coach.controller.ts
├── coach.service.ts
├── dto/
│   ├── create-plan.dto.ts
│   └── create-feedback.dto.ts
├── entities/
│   └── training-plan.entity.ts
└── coach.service.spec.ts
```

**Skill asociado:**
- 🔧 SKILL_COACH - Crear módulo coach paso a paso

---

### 🟡 MÓDULO 5: Comunidad (Community)
**Prioridad:** 🟡 MEDIA  
**Tiempo estimado:** 3-4 horas  
**Dependencias:** Auth, Users, Activities  

**Qué implementar:**
- ✅ GET `/community/feed` - Feed de actividades
- ✅ POST `/activities/:id/kudos` - Dar kudo
- ✅ DELETE `/activities/:id/kudos` - Quitar kudo
- ✅ POST `/activities/:id/comments` - Comentar
- ✅ GET `/activities/:id/comments` - Ver comentarios
- ✅ POST `/users/:id/follow` - Seguir usuario
- ✅ DELETE `/users/:id/follow` - Dejar de seguir

**Archivos a crear:**
```
src/modules/community/
├── community.module.ts
├── community.controller.ts
├── community.service.ts
├── dto/
│   ├── create-kudo.dto.ts
│   └── create-comment.dto.ts
├── entities/
│   └── activity-feed.entity.ts
└── community.service.spec.ts
```

**Skill asociado:**
- 🔧 SKILL_COMMUNITY - Crear módulo community paso a paso

---

## 🔄 FLUJO DE TRABAJO

### **Proceso para implementar CADA módulo:**

```
1️⃣  LEER DOCUMENTACIÓN
    ├─ Entender endpoint en docs/api/{MODULO}.md
    ├─ Ver schema en docs/database/SCHEMA.md
    └─ Revisar DTOs requeridos

2️⃣  CREAR ESTRUCTURA
    ├─ nest generate module modules/{MODULO}
    ├─ nest generate controller modules/{MODULO}
    ├─ nest generate service modules/{MODULO}
    └─ Crear carpetas: dto/, entities/

3️⃣  IMPLEMENTAR DTOs
    ├─ Crear {MODULO}.dto.ts con @IsEmail(), etc
    ├─ Usar class-validator para validación
    └─ Documentar con @ApiProperty()

4️⃣  IMPLEMENTAR SERVICE
    ├─ Agregar métodos CRUD
    ├─ Usar PrismaService
    ├─ Manejar errores con excepciones
    └─ Agregar logging

5️⃣  IMPLEMENTAR CONTROLLER
    ├─ Crear endpoints @Get, @Post, etc
    ├─ Usar DTOs como @Body()
    ├─ Agregar @UseGuards para proteger
    └─ Documentar con @ApiOperation()

6️⃣  ESCRIBIR TESTS
    ├─ Tests unitarios del service
    ├─ Mockear PrismaService
    ├─ Cubrir casos exitosos y errores
    └─ npm test

7️⃣  VALIDAR
    ├─ curl para probar endpoint
    ├─ Revisar logs en docker
    ├─ Swagger docs en /docs
    └─ OK? → siguiente módulo
```

---

## 🔧 AGENTES & SKILLS

### **¿Qué son?**
Skills = Procesos documentados para hacer cada tarea.  
Agentes = Yo (Claude) siguiendo el skill.

### **Cómo funcionan:**

```
Tú: "Crea el módulo auth"
    ↓
Yo: Uso SKILL_AUTH
    ├─ Leo docs/api/AUTH.md
    ├─ Creo estructura
    ├─ Implemento código
    ├─ Agrego tests
    └─ Valido todo
    ↓
Resultado: Módulo auth funcional + tests
```

### **Skills Disponibles:**

```
🔴 SKILL_AUTH
   Implementar módulo de autenticación
   Incluye: JWT, bcrypt, registro, login
   Tiempo: 4-6 horas
   
🟡 SKILL_USERS
   Implementar módulo de usuarios
   Incluye: CRUD, perfil, actividades
   Tiempo: 3-4 horas
   
🟡 SKILL_ACTIVITIES
   Implementar módulo de entrenamientos
   Incluye: GPS, gráficas, historial
   Tiempo: 5-6 horas
   
🟡 SKILL_COACH
   Implementar panel del coach
   Incluye: planes, feedback, atletas
   Tiempo: 4-5 horas
   
🟡 SKILL_COMMUNITY
   Implementar comunidad
   Incluye: kudos, comentarios, follows
   Tiempo: 3-4 horas
   
🔧 SKILL_SETUP
   Configurar proyecto inicialmente
   Incluye: Docker, Prisma, NestJS
   Tiempo: 30 min
   
🧪 SKILL_TESTING
   Escribir y ejecutar tests
   Incluye: unitarios, e2e, coverage
   Tiempo: varía
   
📚 SKILL_DOCS
   Crear documentación
   Incluye: API, guías, tutoriales
   Tiempo: varía
```

### **Cómo pedir que use un skill:**

```
Opción 1 (Explícita):
"Usa SKILL_AUTH para crear el módulo auth"

Opción 2 (Implícita):
"Crea el módulo auth"
→ Yo detecto que necesito SKILL_AUTH y lo uso automáticamente

Opción 3 (Con detalles):
"Crea auth pero sin JWT todavía, solo register/login básico"
→ Yo adapto SKILL_AUTH a tus necesidades
```

---

## 📊 CHECKLIST DE DESARROLLO

### **FASE 1: Setup (🟢 COMPLETADO)**
```
✅ Estructura Docker creada
✅ NestJS configurado
✅ Prisma integrado
✅ Documentación base
✅ package.json actualizado
✅ tsconfig.json configurado
```

### **FASE 2: Autenticación (🔴 PRÓXIMO)**
```
⬜ Crear AuthModule
⬜ Crear RegisterDto + LoginDto
⬜ Implementar register endpoint
⬜ Implementar login endpoint
⬜ Agregar JWT generation
⬜ Agregar bcrypt para contraseñas
⬜ Tests unitarios del auth
⬜ Swagger docs del auth
```

### **FASE 3: Usuarios (🟡 DESPUÉS)**
```
⬜ Crear UsersModule
⬜ Endpoints GET /users/:id
⬜ Endpoints PUT /users/:id
⬜ GET /users/:id/activities
⬜ Tests unitarios
⬜ Swagger docs
```

### **FASE 4: Actividades**
```
⬜ Crear ActivitiesModule
⬜ POST /activities
⬜ GPS points endpoints
⬜ Tests
⬜ Docs
```

### **FASE 5: Coach**
```
⬜ Crear CoachModule
⬜ Planes de entrenamiento
⬜ Feedback del coach
⬜ Tests
⬜ Docs
```

### **FASE 6: Comunidad**
```
⬜ Crear CommunityModule
⬜ Kudos
⬜ Comentarios
⬜ Follows
⬜ Feed
```

### **FASE 7: Testing & Polish**
```
⬜ Tests E2E completos
⬜ Coverage >80%
⬜ Validación completa
⬜ Manejo de errores
```

### **FASE 8: Deploy**
```
⬜ Render setup
⬜ Supabase setup
⬜ Environment vars
⬜ Database migrations
⬜ Health checks
```

---

## 🎯 CÓMO USAR ESTE DOCUMENTO

### **Estás en SETUP:**
```
1. Lee CLAUDE.md (este documento) ✅
2. Lee docs/guias/SETUP.md
3. Ejecuta docker-compose up
4. Valida health check
```

### **Listo para Auth:**
```
1. Lee docs/api/AUTH.md
2. Di: "Crea el módulo auth" (o "Usa SKILL_AUTH")
3. Yo creo todo automáticamente
4. Valida endpoints con curl
```

### **Después de cada módulo:**
```
1. Tests pasando ✅
2. Swagger docs actualizados ✅
3. Código limpio ✅
4. → Siguiente módulo
```

---

## 📞 PREGUNTAS FRECUENTES

**P: ¿Por dónde empiezo?**
R: Por FASE 2 (Auth). Es la más crítica.

**P: ¿Cuánto tiempo en total?**
R: ~30-40 horas de desarrollo (2-3 semanas working full-time)

**P: ¿Necesito saber NestJS?**
R: No, vamos aprendiendo. Los skills tienen instrucciones paso a paso.

**P: ¿Puedo saltarme modules?**
R: No recomendado. Auth es base para todo.

**P: ¿Cómo cambio requirement?**
R: Dime qué cambiar en cualquier momento. Adaptamos.

---

## 🎬 PRÓXIMO PASO

👉 **Lee:** `docs/guias/SETUP.md`

👉 **Luego:** `docs/api/AUTH.md`

👉 **Finalmente:** Di "Crea el módulo auth"

---

**¡Estamos listos para construir!** 🚀

Version: 1.0  
Última actualización: 2026-09-01
