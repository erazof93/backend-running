# 🐳 INFRAESTRUCTURA - DOCKER Y DEPLOYMENT

Docker, configuración, y preparación para producción.

---

## 📂 ESTRUCTURA

```
infra/
├── README.md                        ← Estás aquí
├── docker/
│   └── docker-compose.yml           ← Orquestación local
├── kubernetes/                      ← (Futuro, si necesitas escalar)
│   └── (archivos k8s)
└── scripts/                         ← (Futuro, scripts de setup)
    └── (setup, backup, etc)
```

---

## 🐳 DOCKER

### **¿Qué es docker-compose.yml?**

Archivo que define servicios que corren juntos:

```yaml
services:
  postgres:          ← Base de datos
    image: postgres:16-alpine
    ...
  backend:          ← Tu app NestJS
    build: .
    ...
  adminer:          ← GUI para ver BD (opcional)
    image: adminer
    ...
```

### **Comandos principales**

```bash
# Inicia todo
docker-compose up

# En background
docker-compose up -d

# Para todo
docker-compose down

# Ver logs
docker-compose logs -f

# Ver logs de un servicio
docker-compose logs backend -f

# Rebuild si cambió código
docker-compose up --build
```

---

## 🏗️ SERVICIOS

### **postgres:16-alpine**
- Imagen oficial de PostgreSQL
- Alpine = más ligera
- Puerto 5432
- Persistente (volumen)

### **backend (NestJS)**
- Se compila desde Dockerfile
- Puerto 3000
- Hot reload (si npm run start:dev)
- Depende de PostgreSQL

### **adminer**
- GUI para ver/editar base de datos
- Puerto 8080
- Opcional (solo desarrollo)

---

## 📝 DOCKERFILE

### **Estructura multi-stage**

```dockerfile
# STAGE 1: Builder
FROM node:20-alpine
# Compila TypeScript
RUN npm run build

# STAGE 2: Runtime
FROM node:20-alpine
# Copia solo lo necesario
COPY --from=builder /app/dist .
# Corre el app compilado
CMD ["node", "dist/main.js"]
```

**Ventajas:**
- Imagen más pequeña
- Menos dependencias en producción
- Más rápido en deploy

---

## 🔑 VARIABLES DE ENTORNO

### **.env.example**
```
DATABASE_URL=postgresql://runner_user:runner_password@postgres:5432/runner_db
JWT_SECRET=dev_secret_key_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_change_in_production
NODE_ENV=development
API_PORT=3000
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
LOG_LEVEL=debug
```

### **En producción**
Cambiar a valores reales:
```
JWT_SECRET=algo-muy-secreto-aleatorio
DATABASE_URL=postgresql://user:pass@supabase.com/db
NODE_ENV=production
```

---

## 🚀 DEPLOYMENT

### **Local (Desarrollo)**
```
Docker Compose → PostgreSQL + Backend en tu compu
```

### **Staging (Pruebas)**
```
Render.com (Backend)
Supabase (PostgreSQL)
```
Ver: ../docs/deployment/RENDER.md

### **Producción**
```
Render.com (Backend)
Supabase (PostgreSQL)
```
Ver: ../docs/deployment/PRODUCTION.md

---

## ⚙️ CONFIGURACIÓN

### **docker-compose.yml**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: runner_user
      POSTGRES_PASSWORD: runner_password
      POSTGRES_DB: runner_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U runner_user -d runner_db"]
      interval: 10s
      timeout: 5s
      retries: 5
```

**Puntos clave:**
- `POSTGRES_USER/PASSWORD` - Credenciales
- `POSTGRES_DB` - Nombre de BD
- `ports` - Mapeo de puertos
- `volumes` - Persistencia
- `healthcheck` - Esperar a que DB esté lista

---

## 📦 NETWORK

```yaml
networks:
  runner_network:
    driver: bridge
```

**Permite que servicios se comuniquen:**
```
backend ← (hostname: postgres) → postgres
```

En el código:
```
DATABASE_URL=postgresql://runner_user:password@postgres:5432/runner_db
```

---

## 💾 VOLÚMENES

### **postgres_data**
```yaml
volumes:
  postgres_data:
    driver: local
```

Guarda datos entre reinicios:
```bash
docker-compose down     ← postgres para
docker-compose up       ← postgres sigue con los mismos datos
```

Sin volumen, pierdes todo.

---

## 🔄 BUILD

### **Dockerfile en desarrollo**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "start:dev"]
```

**Ventaja:** Hot reload  
**Desventaja:** Lento

### **Dockerfile en producción**
```dockerfile
# Multi-stage
FROM node:20-alpine AS builder
RUN npm run build

FROM node:20-alpine
COPY --from=builder /app/dist .
CMD ["node", "dist/main.js"]
```

**Ventaja:** Rápido, seguro  
**Desventaja:** No hay hot reload

---

## 🆘 PROBLEMAS COMUNES

### **"Port 5432 is already in use"**
```bash
# Mata PostgreSQL en el puerto
lsof -ti:5432 | xargs kill -9

# O cambia puerto en docker-compose.yml
ports:
  - "5433:5432"  ← Cambiar 5432 a 5433
```

### **"postgres unhealthy"**
```bash
docker-compose logs postgres
# Ver qué está pasado
```

### **"Backend no conecta a postgres"**
```bash
# Verifica DATABASE_URL
echo $DATABASE_URL
# Debe ser: postgresql://runner_user:runner_password@postgres:5432/runner_db
```

---

## 📚 RECURSOS

- Docker Docs: https://docs.docker.com
- Docker Compose: https://docs.docker.com/compose
- PostgreSQL: https://www.postgresql.org/docs

---

## 🎬 PRÓXIMO PASO

Para empezar:
```bash
docker-compose up
# En otra terminal:
npm install
npm run start:dev
```

Para deploy:
```
Ver: ../docs/deployment/RENDER.md
```

---

Última actualización: 2026-09-01
