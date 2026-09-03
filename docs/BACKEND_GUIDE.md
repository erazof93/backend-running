# 💻 BACKEND - CÓDIGO NESTJS

Aquí está todo el código del backend.

---

## 📂 ESTRUCTURA

```
src/
├── main.ts                          ← Entry point
├── app.module.ts                    ← Módulo principal
├── app.controller.ts                ← Rutas /
├── app.service.ts                   ← Lógica principal
│
├── common/                          ← Código compartido
│   ├── prisma/                      ← Integración BD
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── filters/                     ← Manejo de errores
│   │   └── http-exception.filter.ts
│   ├── interceptors/                ← Formato respuestas
│   │   └── response.interceptor.ts
│   ├── guards/                      ← Protección (futuro)
│   ├── decorators/                  ← Custom decorators (futuro)
│   ├── dto/                         ← DTOs compartidos (futuro)
│   └── types/                       ← TypeScript types (futuro)
│
├── modules/                         ← Feature modules
│   ├── auth/                        ← 🔴 PRÓXIMO
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   └── login.dto.ts
│   │   └── entities/
│   │       └── auth.entity.ts
│   │
│   ├── users/                       ← 🟡
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── dto/
│   │   └── entities/
│   │
│   ├── activities/                  ← 🟡
│   │   ├── activities.module.ts
│   │   ├── activities.controller.ts
│   │   ├── activities.service.ts
│   │   ├── dto/
│   │   └── entities/
│   │
│   ├── coach/                       ← 🟡
│   │   ├── coach.module.ts
│   │   ├── coach.controller.ts
│   │   ├── coach.service.ts
│   │   ├── dto/
│   │   └── entities/
│   │
│   └── community/                   ← 🟡
│       ├── community.module.ts
│       ├── community.controller.ts
│       ├── community.service.ts
│       ├── dto/
│       └── entities/
│
├── config/                          ← Configuración (futuro)
├── utils/                           ← Funciones helper (futuro)
└── types/                           ← Types compartidos (futuro)

tests/
├── unit/
│   └── (tests unitarios de services)
└── e2e/
    └── (tests de endpoints)
```

---

## 🎯 ¿QUÉ VA EN CADA CARPETA?

### **main.ts**
- Entry point de NestJS
- Inicia el servidor
- Aplica middleware global
- Configura puerto 3000

### **app.module.ts**
- Módulo principal
- Importa todos los modules
- Define controladores globales
- Define providers globales

### **common/**
- Código **reutilizable** entre módulos
- DTOs compartidos
- Filtros de excepciones
- Interceptors de respuestas
- Guards para autenticación (JWT)
- Custom decorators

### **modules/**
- Cada módulo es **independiente**
- Contiene su lógica CRUD
- Tiene su DTOs, controllers, services
- Se importa en app.module.ts

---

## 🔴 PRÓXIMO MÓDULO: AUTH

**Estructura que debes crear:**

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
└── auth.service.spec.ts
```

**Archivos a implementar:**
- `POST /auth/register` - Crear usuario
- `POST /auth/login` - Login
- `GET /auth/me` - Usuario actual
- Validación con DTOs
- JWT + bcrypt
- Tests unitarios

**Guía completa:** ../docs/api/AUTH.md

---

## 🟡 OTROS MÓDULOS

### Users
```
src/modules/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── dto/
└── entities/
```

### Activities
```
src/modules/activities/
├── activities.module.ts
├── activities.controller.ts
├── activities.service.ts
├── dto/
└── entities/
```

Mismo patrón para Coach y Community.

---

## 📝 CONVENCIONES DE CÓDIGO

### **Nombres de archivos**
```
camelCase.ts        ← Minúscula
service.ts          ← Servicio
controller.ts       ← Controlador
module.ts           ← Módulo
*.spec.ts           ← Tests
*.dto.ts            ← Data Transfer Objects
*.entity.ts         ← Entidades
```

### **Estructura de un Controller**
```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

### **Estructura de un Service**
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    // Tu lógica aquí
  }

  async login(dto: LoginDto) {
    // Tu lógica aquí
  }
}
```

### **Estructura de un DTO**
```typescript
import { IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @MinLength(8)
  password: string;

  @ApiProperty()
  name: string;
}
```

---

## ⚙️ CÓMO AGREGAR UN NUEVO MÓDULO

### **Paso 1: Generar estructura**
```bash
nest generate module modules/mimodulo
nest generate controller modules/mimodulo
nest generate service modules/mimodulo
```

### **Paso 2: Crear DTOs**
```bash
touch src/modules/mimodulo/dto/create-mimodulo.dto.ts
touch src/modules/mimodulo/dto/update-mimodulo.dto.ts
```

### **Paso 3: Crear entities**
```bash
touch src/modules/mimodulo/entities/mimodulo.entity.ts
```

### **Paso 4: Implementar**
- Controller: endpoints
- Service: lógica
- DTO: validaciones

### **Paso 5: Tests**
```bash
touch src/modules/mimodulo/mimodulo.service.spec.ts
```

### **Paso 6: Importar en app.module.ts**
```typescript
imports: [
  AuthModule,
  UsersModule,
  MiModuloModule,  ← Agregar aquí
]
```

---

## 🧪 TESTING

### **Test unitario básico**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '@common/prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a user', async () => {
    const dto = { email: 'test@example.com', password: 'password123', name: 'Test' };
    const expectedUser = { id: '1', ...dto, passwordHash: 'hashed' };

    jest.spyOn(prisma.user, 'create').mockResolvedValue(expectedUser);

    const result = await service.register(dto);

    expect(result.user.email).toBe(dto.email);
  });
});
```

**Lee más:** ../docs/guias/TESTING.md

---

## 🐛 DEBUGGING

### **Ver logs**
```bash
# En docker
docker-compose logs backend -f

# En terminal
npm run start:dev
# Los logs aparecen en terminal
```

### **Debuggear en VS Code**
```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach",
  "skipFiles": ["<node_internals>/**"],
  "port": 9229
}
```

---

## 📚 RECURSOS

- NestJS Docs: https://docs.nestjs.com
- Prisma Docs: https://www.prisma.io/docs
- TypeScript: https://www.typescriptlang.org/docs

---

## 🎬 PRÓXIMO PASO

1. Lee ../docs/api/AUTH.md
2. Di "Crea el módulo auth"
3. Yo genero toda la estructura
4. Tú completas la lógica
5. Tests verdes ✅

---

Última actualización: 2026-09-01
