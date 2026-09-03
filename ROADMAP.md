# 🗺️ ROADMAP - Fases de Desarrollo

Plan detallado de las 8 fases para llevar el backend a producción.

---

## 📅 TIMELINE

```
Fase 1:  Setup        (0.5 semanas) ✅ COMPLETADO
Fase 2:  Auth         (1 semana)    🔴 PRÓXIMO
Fase 3:  Users        (0.5 semana)  🟡 DESPUÉS
Fase 4:  Activities   (1 semana)    🟡
Fase 5:  Coach        (0.75 sem)    🟡
Fase 6:  Community    (0.5 semana)  🟡
Fase 7:  Testing      (1 semana)    🟡
Fase 8:  Deploy       (1 semana)    🟡
─────────────────────────────────
Total:   ~6 semanas   (40-50 horas)
```

---

## 🟢 FASE 1: SETUP - COMPLETADO ✅

**Estado:** ✅ LISTO  
**Tiempo:** 0.5 semanas  
**Responsabilidad:** Setup inicial

### ✅ Tareas Completadas

```
✅ Crear estructura Docker
✅ Configurar NestJS
✅ Integrar Prisma
✅ Crear documentación
✅ Agregar tsconfig.json
✅ Agregar nest-cli.json
✅ Crear package.json actualizado
✅ Validar que docker-compose up funciona
✅ Swagger UI en /docs
✅ Endpoint /health funciona
```

### 📁 Archivos creados

```
docker-compose.yml       ✅
Dockerfile              ✅
package.json            ✅
tsconfig.json           ✅
nest-cli.json           ✅
.env.example            ✅
src/main.ts             ✅
src/app.module.ts       ✅
src/common/             ✅
docs/                   ✅
```

### 🎯 Resultado

Backend básico funcional en `http://localhost:3000`

---

## 🔴 FASE 2: AUTENTICACIÓN - PRÓXIMO 🎯

**Estado:** 🔴 PRÓXIMO (EMPIEZA HOY)  
**Tiempo:** 1 semana  
**Dependencias:** Fase 1  
**Prioridad:** CRÍTICA  

### 🎯 Objetivos

```
[ ] Crear AuthModule
[ ] Crear DTOs (RegisterDto, LoginDto, RefreshTokenDto)
[ ] Implementar registro de usuarios
[ ] Implementar login
[ ] Implementar JWT generation
[ ] Hash de contraseñas con bcrypt
[ ] Refresh token
[ ] Tests unitarios
[ ] Swagger docs
```

### 📁 Archivos a crear

```
src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── auth.service.spec.ts
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   └── refresh-token.dto.ts
├── entities/
│   └── auth.entity.ts
└── strategies/
    └── jwt.strategy.ts (futuro)
```

### 📚 Documentación

```
docs/api/AUTH.md            ← Endpoints exactos
docs/guias/DESARROLLO.md    ← Cómo hacer DTOs
docs/database/SCHEMA.md     ← Tabla "users"
```

### 🔑 Endpoints

```
POST   /api/v1/auth/register         ← Crear usuario
POST   /api/v1/auth/login            ← Login, obtener JWT
POST   /api/v1/auth/refresh-token    ← Refrescar token
POST   /api/v1/auth/logout           ← Logout
GET    /api/v1/auth/me               ← Usuario actual
```

### 🧪 Tests

```
✅ register() crea usuario
✅ login() devuelve JWT
✅ refresh-token() funciona
✅ me() obtiene usuario actual
❌ register() rechaza email duplicado
❌ login() rechaza password inválida
```

### ⏱️ Desglose de tiempo

```
DTOs + validación        : 30 min
AuthService lógica       : 1 hora
AuthController           : 30 min
JWT + bcrypt             : 1 hora
Tests                    : 1 hora
Documentación            : 30 min
─────────────────────────────
Total estimado           : ~5 horas
```

### ✨ Skills relacionados

- 🔧 SKILL_AUTH - Crear módulo auth paso a paso
- 🧪 SKILL_TESTING - Escribir tests

---

## 🟡 FASE 3: USUARIOS - DESPUÉS

**Estado:** 🟡 NO EMPEZADO  
**Tiempo:** 0.5 semanas  
**Dependencias:** Fase 2 (Auth)  
**Prioridad:** ALTA  

### 🎯 Objetivos

```
[ ] Crear UsersModule
[ ] GET /users/:id
[ ] PUT /users/:id (actualizar perfil)
[ ] GET /users/:id/activities
[ ] GET /users/:id/followers
[ ] GET /users/:id/following
[ ] Tests unitarios
[ ] Swagger docs
```

### 📁 Archivos a crear

```
src/modules/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── users.service.spec.ts
├── dto/
│   ├── create-user.dto.ts
│   └── update-user.dto.ts
└── entities/
    └── user.entity.ts
```

### 🔑 Endpoints

```
GET    /api/v1/users/:id              ← Obtener usuario
PUT    /api/v1/users/:id              ← Actualizar perfil
GET    /api/v1/users/:id/activities   ← Sus entrenamientos
GET    /api/v1/users/:id/followers    ← Quién lo sigue
GET    /api/v1/users/:id/following    ← A quién sigue
```

### ⏱️ Desglose de tiempo

```
DTOs                     : 20 min
UsersService             : 1 hora
UsersController          : 30 min
Tests                    : 1 hora
─────────────────────────────
Total estimado           : ~3 horas
```

---

## 🟡 FASE 4: ACTIVIDADES (ENTRENAMIENTOS) - DESPUÉS

**Estado:** 🟡 NO EMPEZADO  
**Tiempo:** 1 semana  
**Dependencias:** Fase 2, 3  
**Prioridad:** ALTA  

### 🎯 Objetivos

```
[ ] Crear ActivitiesModule
[ ] POST /activities (crear entrenamiento)
[ ] GET /activities/:id
[ ] PUT /activities/:id
[ ] DELETE /activities/:id
[ ] POST /activities/:id/gps-points (agregar GPS)
[ ] GET /activities/:id/gps-points (ver ruta)
[ ] Gráficas/estadísticas básicas
[ ] Tests unitarios
[ ] Swagger docs
```

### 📁 Archivos a crear

```
src/modules/activities/
├── activities.module.ts
├── activities.controller.ts
├── activities.service.ts
├── activities.service.spec.ts
├── dto/
│   ├── create-activity.dto.ts
│   ├── update-activity.dto.ts
│   └── create-gps-point.dto.ts
└── entities/
    ├── activity.entity.ts
    └── gps-point.entity.ts
```

### 🔑 Endpoints

```
POST   /api/v1/activities              ← Crear entrenamiento
GET    /api/v1/activities/:id          ← Ver entrenamiento
PUT    /api/v1/activities/:id          ← Actualizar
DELETE /api/v1/activities/:id          ← Eliminar

POST   /api/v1/activities/:id/gps-points     ← Agregar punto GPS
GET    /api/v1/activities/:id/gps-points     ← Ver puntos GPS
```

### ⏱️ Desglose de tiempo

```
DTOs                     : 30 min
ActivitiesService        : 2 horas
GPS points               : 1 hora
ActivitiesController     : 1 hora
Tests                    : 1.5 horas
─────────────────────────────
Total estimado           : ~6 horas
```

---

## 🟡 FASE 5: COACH (PANEL DEL COACH) - DESPUÉS

**Estado:** 🟡 NO EMPEZADO  
**Tiempo:** 0.75 semanas  
**Dependencias:** Fase 2, 3, 4  
**Prioridad:** MEDIA  

### 🎯 Objetivos

```
[ ] Crear CoachModule
[ ] GET /coach/athletes (mis atletas)
[ ] GET /coach/athletes/:id (perfil de atleta)
[ ] POST /coach/plans (crear plan)
[ ] PUT /coach/plans/:id (actualizar plan)
[ ] POST /coach/athletes/:id/feedback (feedback de video)
[ ] Tests unitarios
[ ] Swagger docs
```

### 📁 Archivos a crear

```
src/modules/coach/
├── coach.module.ts
├── coach.controller.ts
├── coach.service.ts
├── coach.service.spec.ts
├── dto/
│   ├── create-plan.dto.ts
│   ├── update-plan.dto.ts
│   └── create-feedback.dto.ts
└── entities/
    ├── training-plan.entity.ts
    └── training-plan-day.entity.ts
```

### 🔑 Endpoints

```
GET    /api/v1/coach/athletes          ← Mis atletas
GET    /api/v1/coach/athletes/:id      ← Perfil atleta
POST   /api/v1/coach/plans             ← Crear plan
PUT    /api/v1/coach/plans/:id         ← Actualizar plan
POST   /api/v1/coach/athletes/:id/feedback ← Dar feedback
```

### ⏱️ Desglose de tiempo

```
DTOs                     : 30 min
CoachService             : 1.5 horas
CoachController          : 1 hora
Tests                    : 1 hora
─────────────────────────────
Total estimado           : ~4 horas
```

---

## 🟡 FASE 6: COMUNIDAD - DESPUÉS

**Estado:** 🟡 NO EMPEZADO  
**Tiempo:** 0.5 semanas  
**Dependencias:** Fase 2, 3, 4  
**Prioridad:** MEDIA  

### 🎯 Objetivos

```
[ ] Crear CommunityModule
[ ] GET /community/feed (feed de actividades)
[ ] POST /activities/:id/kudos (dar me gusta)
[ ] DELETE /activities/:id/kudos (quitar me gusta)
[ ] POST /activities/:id/comments (comentar)
[ ] GET /activities/:id/comments (ver comentarios)
[ ] POST /users/:id/follow (seguir usuario)
[ ] DELETE /users/:id/follow (dejar de seguir)
[ ] Tests unitarios
[ ] Swagger docs
```

### 📁 Archivos a crear

```
src/modules/community/
├── community.module.ts
├── community.controller.ts
├── community.service.ts
├── community.service.spec.ts
├── dto/
│   ├── create-kudo.dto.ts
│   ├── create-comment.dto.ts
│   └── create-follow.dto.ts
└── entities/
    ├── kudo.entity.ts
    ├── comment.entity.ts
    └── follow.entity.ts
```

### 🔑 Endpoints

```
GET    /api/v1/community/feed              ← Feed
POST   /api/v1/activities/:id/kudos        ← Me gusta
DELETE /api/v1/activities/:id/kudos        ← Quitar me gusta
POST   /api/v1/activities/:id/comments     ← Comentar
GET    /api/v1/activities/:id/comments     ← Ver comentarios
POST   /api/v1/users/:id/follow            ← Seguir
DELETE /api/v1/users/:id/follow            ← Dejar de seguir
```

### ⏱️ Desglose de tiempo

```
DTOs                     : 30 min
CommunityService         : 1.5 horas
CommunityController      : 1 hora
Tests                    : 1 hora
─────────────────────────────
Total estimado           : ~4 horas
```

---

## 🟡 FASE 7: TESTING COMPLETO - DESPUÉS

**Estado:** 🟡 NO EMPEZADO  
**Tiempo:** 1 semana  
**Dependencias:** Fases 2-6  
**Prioridad:** ALTA  

### 🎯 Objetivos

```
[ ] Tests unitarios para cada service (50+)
[ ] Tests E2E para cada endpoint (50+)
[ ] Coverage >80%
[ ] Mock completo de PrismaService
[ ] Error cases cubiertos
[ ] Documentación de tests
```

### 📁 Archivos a crear

```
tests/
├── unit/
│   ├── auth.service.spec.ts
│   ├── users.service.spec.ts
│   ├── activities.service.spec.ts
│   ├── coach.service.spec.ts
│   └── community.service.spec.ts
│
└── e2e/
    ├── auth.e2e.spec.ts
    ├── users.e2e.spec.ts
    ├── activities.e2e.spec.ts
    ├── coach.e2e.spec.ts
    └── community.e2e.spec.ts
```

### ⏱️ Desglose de tiempo

```
Tests unitarios          : 3 horas
Tests E2E                : 2 horas
Coverage                 : 1 hora
─────────────────────────────
Total estimado           : ~6 horas
```

---

## 🟡 FASE 8: DEPLOY A PRODUCCIÓN - DESPUÉS

**Estado:** 🟡 NO EMPEZADO  
**Tiempo:** 1 semana  
**Dependencias:** Fases 2-7  
**Prioridad:** ALTA  

### 🎯 Objetivos

```
[ ] Crear cuenta Render.com
[ ] Crear proyecto en Supabase
[ ] Conectar GitHub a Render
[ ] Configurar variables de entorno
[ ] Ejecutar migraciones en Supabase
[ ] Deploy automático
[ ] Health checks funcionales
[ ] Monitoring activado
[ ] Logs configurados
[ ] ¡LIVE EN PRODUCCIÓN!
```

### 📚 Documentación

```
docs/deployment/RENDER.md        ← Paso a paso
docs/deployment/SUPABASE.md      ← Base de datos
docs/deployment/PRODUCTION.md    ← Checklist final
```

### ⏱️ Desglose de tiempo

```
Setup Render             : 30 min
Setup Supabase          : 30 min
Configuración vars      : 30 min
Deploy                  : 30 min
Testing en prod         : 1 hora
─────────────────────────────
Total estimado          : ~3.5 horas
```

---

## 📊 RESUMEN POR FASE

| Fase | Nombre | Tiempo | Estado | Próximo |
|------|--------|--------|--------|---------|
| 1 | Setup | 0.5 sem | ✅ Hecho | → Fase 2 |
| 2 | Auth | 1 sem | 🔴 HOY | 5 horas |
| 3 | Users | 0.5 sem | 🟡 Después | 3 horas |
| 4 | Activities | 1 sem | 🟡 Después | 6 horas |
| 5 | Coach | 0.75 sem | 🟡 Después | 4 horas |
| 6 | Community | 0.5 sem | 🟡 Después | 4 horas |
| 7 | Testing | 1 sem | 🟡 Después | 6 horas |
| 8 | Deploy | 1 sem | 🟡 Después | 3.5 horas |

---

## 📈 PROGRESO VISUAL

```
FASE 1 (Setup)       ████████████████████ 100% ✅
FASE 2 (Auth)        ░░░░░░░░░░░░░░░░░░░░   0% 🔴
FASE 3 (Users)       ░░░░░░░░░░░░░░░░░░░░   0% 🟡
FASE 4 (Activities)  ░░░░░░░░░░░░░░░░░░░░   0% 🟡
FASE 5 (Coach)       ░░░░░░░░░░░░░░░░░░░░   0% 🟡
FASE 6 (Community)   ░░░░░░░░░░░░░░░░░░░░   0% 🟡
FASE 7 (Testing)     ░░░░░░░░░░░░░░░░░░░░   0% 🟡
FASE 8 (Deploy)      ░░░░░░░░░░░░░░░░░░░░   0% 🟡
─────────────────────────────────────────────────
TOTAL PROYECTO       ██░░░░░░░░░░░░░░░░░░  12% 🚀
```

---

## 🎯 HITO IMPORTANTE

```
✅ FASE 1 (Hoy)     → Backend compilando
🔴 FASE 2 (Esta semana) → Autenticación funcional
🟡 FASE 6 (Próximas 3 semanas) → App lista para MVP
🟡 FASE 8 (Semana 5-6) → EN PRODUCCIÓN
```

---

## 💡 NOTAS

- Cada fase se construye sobre la anterior
- Los tiempos son **estimaciones** (pueden variar)
- Fase 2 (Auth) es **crítica** - no saltar
- Puedes hacer múltiples fases en paralelo si tienes ayuda
- Skills de Claude automatizan la mayoría del trabajo

---

## 🎬 PRÓXIMO PASO

**Empieza FASE 2:**

```
1. Lee docs/api/AUTH.md
2. Lee docs/guias/DESARROLLO.md
3. Di: "Crea el módulo auth"
4. Yo genero estructura
5. Tú completas la lógica
6. Tests verdes ✅
7. → FASE 3
```

---

Última actualización: 2026-09-01
