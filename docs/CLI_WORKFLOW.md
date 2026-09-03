# 🎯 CLI WORKFLOW - Cómo vamos a trabajar

## Resumen del proceso:

```
1. TÚ ejecutas comandos CLI que YO indico
2. YO te doy prompts exactos para cada módulo
3. SUB AGENTE audita el código
4. SUB AGENTE actualiza ROADMAP (CLAUDE.md)
5. Siguiente módulo
```

---

## FASE 2: AUTH - EJEMPLO COMPLETO

### PASO 1: Yo te doy el comando CLI
```bash
# Generar módulo auth
nest generate module modules/auth
nest generate controller modules/auth
nest generate service modules/auth

# Crear DTOs
mkdir -p src/modules/auth/dto
touch src/modules/auth/dto/register.dto.ts
touch src/modules/auth/dto/login.dto.ts

# Crear entities
mkdir -p src/modules/auth/entities
touch src/modules/auth/entities/auth.entity.ts
```

### PASO 2: Yo te doy el contenido (prompts)
```typescript
// auth.controller.ts
// auth.service.ts
// register.dto.ts
// etc.
```

### PASO 3: TÚ copias/pegas en archivos
```bash
# O si quieres automatizar:
echo "código aquí" > src/modules/auth/auth.controller.ts
```

### PASO 4: TÚ ejecutas tests
```bash
npm test src/modules/auth/auth.service.spec.ts
# o
pnpm test src/modules/auth/auth.service.spec.ts
```

### PASO 5: SUB AGENTE audita
- ✅ Código sigue estándares NestJS
- ✅ DTOs tienen validaciones correctas
- ✅ Tests pasan
- ✅ Documentación Swagger completa
- ✅ No hay errores TypeScript
- ✅ Endpoints funcionan

### PASO 6: SUB AGENTE actualiza CLAUDE.md
```
ROADMAP:
  FASE 2: Auth
  ✅ AuthModule creado
  ✅ RegisterDto implementado
  ✅ LoginDto implementado
  ✅ AuthService.register() funcional
  ✅ AuthService.login() funcional
  ✅ Tests unitarios: 8/8 pasando
  ✅ Endpoints: POST /auth/register, POST /auth/login
  ✅ Swagger docs: HECHO
  
  Progreso: 100% ✅
  
  PRÓXIMO: FASE 3 - Users Module
```

---

## ESTRUCTURA DE COMANDOS

### Cuando sea **MODULE/CONTROLLER/SERVICE**:

```bash
# Exacto y preciso
nest generate module modules/NOMBRE
nest generate controller modules/NOMBRE  
nest generate service modules/NOMBRE
```

### Cuando sea **DTO**:

```bash
mkdir -p src/modules/NOMBRE/dto
touch src/modules/NOMBRE/dto/create-NOMBRE.dto.ts
touch src/modules/NOMBRE/dto/update-NOMBRE.dto.ts
```

### Cuando sea **TESTS**:

```bash
npm test src/modules/NOMBRE
# o
pnpm test src/modules/NOMBRE
```

---

## FORMATO DE PROMPTS QUE TE VOY A DAR

Cuando te diga "Crea auth", te voy a dar:

```
═══════════════════════════════════════════════════════════════
🔴 FASE 2 - MODULE: AUTH
═══════════════════════════════════════════════════════════════

PASO 1️⃣: Generar estructura con CLI
───────────────────────────────────────
nest generate module modules/auth
nest generate controller modules/auth
nest generate service modules/auth
mkdir -p src/modules/auth/{dto,entities,strategies}

PASO 2️⃣: Crear archivos DTOs
───────────────────────────────────────
touch src/modules/auth/dto/register.dto.ts
touch src/modules/auth/dto/login.dto.ts

PASO 3️⃣: Copiar código a archivos
───────────────────────────────────────
src/modules/auth/auth.module.ts:
[CÓDIGO AQUÍ]

src/modules/auth/auth.controller.ts:
[CÓDIGO AQUÍ]

src/modules/auth/auth.service.ts:
[CÓDIGO AQUÍ]

... más archivos

PASO 4️⃣: Ejecutar tests
───────────────────────────────────────
pnpm test src/modules/auth/auth.service.spec.ts

PASO 5️⃣: Validar en Swagger
───────────────────────────────────────
pnpm start:dev
Abre: http://localhost:3000/docs
Verifica endpoints: POST /auth/register, POST /auth/login

PASO 6️⃣: Avisame cuando esté listo
───────────────────────────────────────
Responde: "Auth module listo - X tests pasando"

═══════════════════════════════════════════════════════════════
```

---

## SUB AGENTE - CHECKLIST DE AUDITORÍA

Cuando termines, el **SUB AGENTE** debe revisar:

```
✅ CÓDIGO
  □ Sigue convenciones NestJS
  □ TypeScript sin errores
  □ DTOs tienen @IsEmail(), @MinLength(), etc
  □ Service tiene lógica correcta
  □ Controller tiene endpoints correctos
  □ Imports/exports están bien

✅ TESTS
  □ Tests unitarios existen
  □ Tests pasan (npm test)
  □ Coverage >80%
  □ Casos de error cubiertos

✅ DOCUMENTACIÓN
  □ Swagger docs (@ApiOperation, @ApiResponse)
  □ JSDoc en métodos públicos
  □ Errors documentados

✅ ENDPOINTS
  □ Funcionan en http://localhost:3000/docs
  □ Request/response correctos
  □ Validación funciona
  □ Errores devuelven formato correcto

✅ INTEGRACIÓN
  □ Módulo importado en app.module.ts
  □ No hay conflictos con otros módulos
  □ Builds sin errores (npm run build)
```

---

## SUB AGENTE - ACTUALIZACIÓN DE ROADMAP

Después de auditar, **SUB AGENTE** actualiza CLAUDE.md:

```markdown
## 🔴 FASE 2: Autenticación (Auth) - COMPLETADA ✅

**Tiempo empleado:** 4 horas
**Tests:** 12/12 pasando ✅
**Coverage:** 92% ✅

### Tareas Completadas:
- ✅ AuthModule creado
- ✅ AuthController con 5 endpoints
- ✅ AuthService con lógica JWT + bcrypt
- ✅ RegisterDto con validaciones
- ✅ LoginDto con validaciones
- ✅ RefreshTokenDto implementado
- ✅ Tests unitarios: 12 tests ✅
- ✅ Swagger documentation completa
- ✅ Error handling implementado
- ✅ Integrado en app.module.ts

### Endpoints Implementados:
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- POST /api/v1/auth/refresh-token
- GET /api/v1/auth/me

### Próximo Módulo:
🟡 FASE 3: Users Module (Estimado: 3-4 horas)

### Comandos CLI ejecutados:
```bash
nest generate module modules/auth
nest generate controller modules/auth
nest generate service modules/auth
pnpm test src/modules/auth
pnpm build
```
```

---

## VENTAJAS DE ESTE SISTEMA

✅ **Automatizado** - SUB AGENTE actualiza documentación automáticamente  
✅ **Auditoría integrada** - Cada módulo es auditado antes de pasar  
✅ **CLI-first** - Usamos NestJS CLI nativo  
✅ **Documentación viva** - ROADMAP siempre actualizado  
✅ **Escalable** - Funciona para 5, 50 o 500 módulos  
✅ **Profesional** - Parece equipo real de desarrollo  

---

## CUANDO ESTÉS LISTO

Avísame:

```
"Integración completada. Listo para FASE 2 con CLI workflow."
```

Entonces empezamos con:

```
"Ejecuta estos comandos:"
nest generate module modules/auth
nest generate controller modules/auth
nest generate service modules/auth
```

Y yo te doy todo el código + tests + documentación 🚀
