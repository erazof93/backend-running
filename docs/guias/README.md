# 🎓 GUÍAS DE DESARROLLO

Tutoriales paso a paso para tareas comunes.

---

## 📚 GUÍAS DISPONIBLES

### 1️⃣ **SETUP.md** - Instalación y configuración
**Para:** Primera vez que configuras el proyecto  
**Tiempo:** 30 minutos  
**Contiene:**
- Requisitos previos
- Instalación de Docker
- Clone del proyecto
- docker-compose up
- Validación de que funciona

📖 **Lee si:** Es tu primer día

---

### 2️⃣ **DESARROLLO.md** - Cómo codificar
**Para:** Entender el flujo de desarrollo  
**Tiempo:** 20 minutos  
**Contiene:**
- Estructura de un módulo
- Cómo crear DTOs
- Cómo crear Controllers
- Cómo crear Services
- Comandos NestJS
- Workflow diario

📖 **Lee si:** Vas a escribir código

---

### 3️⃣ **TESTING.md** - Tests unitarios
**Para:** Escribir tests  
**Tiempo:** 15 minutos  
**Contiene:**
- Estructura de tests
- Cómo mockar PrismaService
- Cómo testear Controllers
- Cómo testear Services
- Comandos de testing

📖 **Lee si:** Necesitas cobertura de tests

---

### 4️⃣ **TROUBLESHOOTING.md** - Solucionar problemas
**Para:** Cuando algo no funciona  
**Tiempo:** Varía  
**Contiene:**
- Problemas comunes
- Soluciones paso a paso
- Cómo debuggear
- Logs útiles

📖 **Lee si:** Algo no funciona

---

## 🎯 POR SITUACIÓN

### **Estoy empezando**
1. Lee SETUP.md
2. Sigue cada paso
3. Valida que funciona

### **Voy a crear un módulo**
1. Lee DESARROLLO.md
2. Lee docs/api/{MODULO}.md
3. Sigue el skill correspondiente

### **Necesito tests**
1. Lee TESTING.md
2. Crea archivos .spec.ts
3. npm test

### **Algo falla**
1. Lee TROUBLESHOOTING.md
2. Encuentra tu problema
3. Sigue la solución

---

## 📂 ARCHIVOS EN ESTA CARPETA

```
guias/
├── README.md                ← Estás aquí
├── SETUP.md                 ← Instalación
├── DESARROLLO.md            ← Cómo codificar
├── TESTING.md               ← Tests
└── TROUBLESHOOTING.md       ← Problemas
```

---

## 💡 CONSEJOS

- Cada guía es **independiente**, puedes saltarte
- Cada guía tiene **código de ejemplo**
- Si hay términos **técnicos**, están explicados
- Hay **troubleshooting** al final de cada guía

---

## 🆘 AYUDA RÁPIDA

| Problema | Guía |
|----------|------|
| No funciona nada | SETUP.md |
| No sé programar en NestJS | DESARROLLO.md |
| Necesito tests | TESTING.md |
| Algo explota | TROUBLESHOOTING.md |

---

Próximo: Lee la guía que necesitas 📖
