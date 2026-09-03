# 🔌 DOCUMENTACIÓN DE API

Endpoints REST del Runner App Backend.

---

## 📚 ENDPOINTS POR MÓDULO

### 🔴 **AUTH.md** - Autenticación
**Endpoints:**
- `POST /auth/register` - Crear usuario
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/refresh-token` - Refrescar token
- `GET /auth/me` - Usuario actual

**Lee si:** Necesitas construir módulo Auth

---

### 🟡 **USERS.md** - Usuarios
**Endpoints:**
- `GET /users/:id` - Obtener usuario
- `PUT /users/:id` - Actualizar perfil
- `GET /users/:id/activities` - Actividades del usuario
- `GET /users/:id/followers` - Seguidores
- `GET /users/:id/following` - Siguiendo

**Lee si:** Necesitas construir módulo Users

---

### 🟡 **ACTIVITIES.md** - Entrenamientos
**Endpoints:**
- `POST /activities` - Crear actividad
- `GET /activities/:id` - Obtener actividad
- `PUT /activities/:id` - Actualizar
- `DELETE /activities/:id` - Eliminar
- `POST /activities/:id/gps-points` - Agregar GPS
- `GET /activities/:id/gps-points` - Ver GPS

**Lee si:** Necesitas construir módulo Activities

---

### 🟡 **COACH.md** - Coach Dashboard
**Endpoints:**
- `GET /coach/athletes` - Mis atletas
- `GET /coach/athletes/:id` - Perfil de atleta
- `POST /coach/plans` - Crear plan
- `PUT /coach/plans/:id` - Actualizar plan
- `POST /coach/athletes/:id/feedback` - Dar feedback

**Lee si:** Necesitas construir módulo Coach

---

### 🟡 **COMMUNITY.md** - Comunidad
**Endpoints:**
- `GET /community/feed` - Feed de actividades
- `POST /activities/:id/kudos` - Dar kudo
- `DELETE /activities/:id/kudos` - Quitar kudo
- `POST /activities/:id/comments` - Comentar
- `GET /activities/:id/comments` - Ver comentarios
- `POST /users/:id/follow` - Seguir
- `DELETE /users/:id/follow` - Dejar de seguir

**Lee si:** Necesitas construir módulo Community

---

## 🎯 CÓMO LEER ESTOS DOCUMENTOS

Cada archivo tiene esta estructura:

```markdown
# Módulo XYZ

## Endpoint 1: POST /ruta

**Descripción:** Qué hace

**Autenticación:** Bearer token (o "Pública")

**Request:**
```json
{
  "campo": "valor"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ... }
}
```

**Errores:**
- 400: Validación fallida
- 401: No autenticado
- 409: Conflicto (ej. email ya existe)

**DTOs:**
```typescript
export class MyDto {
  @IsEmail()
  email: string;
}
```
```

---

## 🔐 AUTENTICACIÓN

### **Bearer Token (JWT)**
```
Authorization: Bearer eyJhbGc...
```

Se incluye automáticamente después de login.

### **Rutas públicas**
No necesitan token:
- `POST /auth/register`
- `POST /auth/login`

### **Rutas protegidas**
Necesitan token:
- Todas las demás

---

## 📊 CONVENCIONES

### **Status Codes**
```
200 OK          ← Todo bien
201 Created     ← Recurso creado
400 Bad Request ← Validación fallida
401 Unauthorized ← Falta o token inválido
403 Forbidden   ← No tienes permiso
404 Not Found   ← Recurso no existe
409 Conflict    ← Email ya existe, etc
500 Server Error ← Error del backend
```

### **Response Format**
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-09-01T14:30:00Z"
}
```

### **Error Format**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2026-09-01T14:30:00Z",
  "path": "/api/v1/auth/register"
}
```

---

## 🧪 CÓMO TESTEAR ENDPOINTS

### **Con curl:**
```bash
# GET con token
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/v1/users/123

# POST con body
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' \
  http://localhost:3000/api/v1/auth/register
```

### **Con Swagger (GUI):**
```
1. Abre http://localhost:3000/docs
2. Clickea en un endpoint
3. "Try it out"
4. Llena valores
5. Execute
```

### **Con Postman:**
```
1. Importa colección (futuro)
2. Configura ambiente
3. Prueba cada endpoint
```

---

## 📂 ARCHIVOS EN ESTA CARPETA

```
api/
├── README.md                ← Estás aquí
├── AUTH.md                  ← /auth endpoints
├── USERS.md                 ← /users endpoints
├── ACTIVITIES.md            ← /activities endpoints
├── COACH.md                 ← /coach endpoints
└── COMMUNITY.md             ← /community endpoints
```

---

## 🎯 FLUJO TÍPICO

```
1. Usuario hace request:
   POST /auth/register
   { email, password, name }
   
2. Server valida con DTO
   
3. Server crea usuario + hashea password
   
4. Server devuelve:
   { success: true, data: { token } }
   
5. Frontend guarda token
   
6. Frontend usa token en requests:
   Authorization: Bearer TOKEN
```

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Dónde está la documentación de X endpoint?**
R: En el `.md` del módulo correspondiente

**P: ¿Cómo testeo un endpoint?**
R: Con curl, Swagger o Postman (ver arriba)

**P: ¿Qué significa 409 Conflict?**
R: El recurso ya existe (ej. email duplicado)

**P: ¿Cómo paso el token?**
R: En header: `Authorization: Bearer TOKEN`

---

## 🎬 PRÓXIMO PASO

Elige el módulo que necesitas:

- 🔴 AUTH → Lee AUTH.md
- 🟡 USERS → Lee USERS.md
- 🟡 ACTIVITIES → Lee ACTIVITIES.md
- 🟡 COACH → Lee COACH.md
- 🟡 COMMUNITY → Lee COMMUNITY.md

---

Última actualización: 2026-09-01
