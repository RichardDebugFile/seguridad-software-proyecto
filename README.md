# 🔐 Sistema de Autenticación Segura Multi-Proveedor

Sistema completo de autenticación con soporte para múltiples proveedores OAuth2 (Google, Keycloak) y autenticación local con JWT, construido con Node.js, Express, React y PostgreSQL.

![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![React](https://img.shields.io/badge/React-v18-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![License](https://img.shields.io/badge/License-Educational-yellow)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Prerequisitos](#-prerequisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Seguridad](#-seguridad)
- [Troubleshooting](#-troubleshooting)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características

### Autenticación Multi-Proveedor
- ✅ **Google OAuth 2.0** - Autenticación con cuenta de Google
- ✅ **Keycloak** - Servidor de identidad open-source
- ✅ **Local** - Registro y login con email/contraseña

### Seguridad
- 🔒 **JWT Tokens** - Access y Refresh tokens
- 🔒 **BCrypt** - Hash de contraseñas (10 rounds)
- 🔒 **CORS** - Configuración estricta
- 🔒 **Helmet** - Headers de seguridad HTTP
- 🔒 **Rate Limiting** - Protección contra ataques de fuerza bruta
- 🔒 **SQL Injection Protection** - Queries parametrizadas

### Auditoría y Logging
- 📊 **Audit Logs** - Registro completo de eventos de autenticación
- 📊 **IP Tracking** - Seguimiento de direcciones IP
- 📊 **User Agent Logging** - Información del navegador/dispositivo
- 📊 **Success/Failure Tracking** - Monitoreo de intentos exitosos y fallidos

### Interfaz de Usuario
- 🎨 **React + Vite** - Frontend moderno y rápido
- 🎨 **TailwindCSS** - Diseño responsive y profesional
- 🎨 **SPA** - Single Page Application con React Router

---

## 🏗️ Arquitectura

```
┌─────────────────┐
│   Frontend      │
│  (React + Vite) │
│  Port: 5173     │
└────────┬────────┘
         │
         │ HTTP/HTTPS
         │
┌────────▼────────┐
│   Backend API   │
│ (Node.js/Express│
│  Port: 3000     │
└────┬────┬───┬───┘
     │    │   │
     │    │   └──────────┐
     │    │              │
┌────▼────▼───┐   ┌─────▼──────┐
│ PostgreSQL  │   │  Keycloak  │
│  Port: 5432 │   │ Port: 8090 │
└─────────────┘   └────────────┘
```

**Stack Tecnológico:**

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| **Backend** | Node.js + Express | 18+ |
| **Frontend** | React + Vite | 18+ |
| **Base de Datos** | PostgreSQL | 15 |
| **Autenticación** | Passport.js | 0.7+ |
| **Tokens** | JWT | 9.0+ |
| **UI** | TailwindCSS | 3.4+ |
| **IdP** | Keycloak | 23.0 |
| **Container** | Docker | Latest |

---

## 📦 Prerequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** v18 o superior ([Descargar](https://nodejs.org/))
- **npm** v9 o superior (viene con Node.js)
- **Docker** y **Docker Compose** ([Descargar](https://www.docker.com/))
- **Git** ([Descargar](https://git-scm.com/))

**Verificar instalación:**

```bash
node --version  # debe ser v18+
npm --version   # debe ser v9+
docker --version
docker-compose --version
```

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd seguridad-software
```

### 2. Instalar Dependencias del Backend

```bash
cd backend
npm install
```

### 3. Instalar Dependencias del Frontend

```bash
cd ../frontend
npm install
```

### 4. Iniciar Servicios Docker

Desde la raíz del proyecto:

```bash
docker-compose up -d
```

Esto iniciará:
- **PostgreSQL** (puerto 5432) - Base de datos principal
- **Keycloak PostgreSQL** - Base de datos de Keycloak
- **Keycloak** (puerto 8090) - Servidor de identidad

**Verificar que los contenedores estén corriendo:**

```bash
docker ps
```

Deberías ver 3 contenedores:
- `security-postgres`
- `keycloak-db`
- `security-keycloak`

---

## ⚙️ Configuración

### 1. Configurar Variables de Entorno del Backend

El archivo `.env` ya existe en `backend/.env`, pero necesitas configurar tus credenciales:

**Edita `backend/.env` y configura:**

```bash
# JWT Secrets (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET=tu-super-secreto-jwt-cambiar-en-produccion
JWT_REFRESH_SECRET=tu-super-secreto-refresh-cambiar-en-produccion
SESSION_SECRET=tu-super-secreto-session-cambiar-en-produccion

# Google OAuth (obligatorio si usarás Google OAuth)
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret

# Keycloak (obligatorio si usarás Keycloak)
KEYCLOAK_CLIENT_SECRET=tu-keycloak-client-secret
```

### 2. Configurar Google OAuth (Opcional pero Recomendado)

Si quieres habilitar autenticación con Google:

📖 **Ver guía completa:** [`docs/GOOGLE-OAUTH-SETUP.md`](docs/GOOGLE-OAUTH-SETUP.md)

**Pasos rápidos:**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Habilita Google+ API
4. Crea credenciales OAuth 2.0
5. Agrega URIs autorizadas:
   - `http://localhost:3000/auth/google/callback`
6. Copia Client ID y Client Secret a `.env`

### 3. Configurar Keycloak (Opcional)

Si quieres habilitar autenticación con Keycloak:

📖 **Ver guía completa:** [`docs/KEYCLOAK-SETUP.md`](docs/KEYCLOAK-SETUP.md)

**Pasos rápidos:**

1. Accede a http://localhost:8090/admin
2. Login: `admin` / `admin123`
3. Crea el realm `tournament`
4. Crea el cliente `tournament-system`
5. Configura Client Authentication: ON
6. Agrega redirect URI: `http://localhost:3000/auth/keycloak/callback`
7. Copia el Client Secret a `.env`
8. Crea usuarios de prueba

---

## 🎯 Uso

### Iniciar la Aplicación

**Opción 1: Iniciar todo desde la raíz (Recomendado)**

Desde la raíz del proyecto:

```bash
npm start
```

Esto iniciará automáticamente backend y frontend en paralelo.

**Opción 2: Iniciar por separado**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### Acceder a la Aplicación

Una vez iniciado, abre tu navegador en:

- **Frontend (App Principal)**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Keycloak Admin**: http://localhost:8090/admin

### Probar la Autenticación

#### 1. Autenticación Local (Sin configuración adicional)

1. Ve a http://localhost:5173
2. Haz clic en **"¿No tienes cuenta? Regístrate"**
3. Completa el formulario:
   ```
   Nombre de Usuario: testuser
   Email: test@example.com
   Contraseña: Test123!
   ```
4. Haz clic en **"Registrarse"**
5. Inicia sesión con esas credenciales

#### 2. Autenticación con Google OAuth

1. Configura Google OAuth (ver sección de Configuración)
2. Ve a http://localhost:5173
3. Haz clic en el botón **"Google"**
4. Autoriza con tu cuenta de Google
5. Serás redirigido al Dashboard

#### 3. Autenticación con Keycloak

1. Configura Keycloak (ver sección de Configuración)
2. Crea un usuario en Keycloak
3. Ve a http://localhost:5173
4. Haz clic en el botón **"Keycloak"**
5. Ingresa las credenciales de Keycloak
6. Serás redirigido al Dashboard

---

## 📁 Estructura del Proyecto

```
seguridad-software/
├── backend/                      # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── config/              # Configuraciones
│   │   │   ├── database.js      # PostgreSQL connection y schema
│   │   │   └── passport.js      # Estrategias de autenticación
│   │   ├── middleware/          # Middlewares personalizados
│   │   │   ├── auth.js          # JWT y autorización
│   │   │   └── audit.js         # Logging de eventos
│   │   ├── routes/              # Rutas de la API
│   │   │   └── auth.routes.js   # Endpoints de autenticación
│   │   └── server.js            # Punto de entrada del servidor
│   ├── .env                     # Variables de entorno (NO COMMITEAR)
│   ├── .env.example             # Plantilla de variables de entorno
│   └── package.json             # Dependencias del backend
│
├── frontend/                     # Frontend SPA (React + Vite)
│   ├── src/
│   │   ├── components/          # Componentes de React
│   │   │   ├── Login.jsx        # Página de login/registro
│   │   │   ├── Dashboard.jsx    # Dashboard del usuario
│   │   │   └── AuthCallback.jsx # Handler de callbacks OAuth
│   │   ├── utils/
│   │   │   └── api.js           # Cliente HTTP y servicios
│   │   ├── App.jsx              # Componente principal
│   │   ├── main.jsx             # Punto de entrada
│   │   └── index.css            # Estilos globales
│   ├── index.html               # HTML principal
│   ├── vite.config.js           # Configuración de Vite
│   └── package.json             # Dependencias del frontend
│
├── docs/                         # Documentación adicional
│   ├── GOOGLE-OAUTH-SETUP.md    # Guía de configuración de Google
│   ├── KEYCLOAK-SETUP.md        # Guía de configuración de Keycloak
│   └── API.md                   # Documentación de la API
│
├── docker-compose.yml            # Servicios Docker (PostgreSQL + Keycloak)
├── .gitignore                   # Archivos ignorados por Git
├── package.json                 # Scripts del proyecto raíz
└── README.md                    # Este archivo
```

---

## 🔌 API Endpoints

### Autenticación

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/auth/google` | Iniciar OAuth con Google | No |
| `GET` | `/auth/google/callback` | Callback de Google OAuth | No |
| `GET` | `/auth/keycloak` | Iniciar OAuth con Keycloak | No |
| `GET` | `/auth/keycloak/callback` | Callback de Keycloak OAuth | No |
| `POST` | `/auth/register` | Registrar usuario local | No |
| `POST` | `/auth/login` | Login con email/contraseña | No |
| `POST` | `/auth/refresh` | Renovar access token | No |
| `POST` | `/auth/logout` | Cerrar sesión | No |
| `GET` | `/auth/me` | Obtener usuario actual | Sí (JWT) |

### Utilidades

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Info de la API |
| `GET` | `/health` | Health check |

📖 **Ver documentación completa de la API:** [`docs/API.md`](docs/API.md)

---

## 🔒 Seguridad

### Prácticas Implementadas

#### Autenticación y Autorización
- ✅ JWT con expiración (1 hora para access token, 7 días para refresh token)
- ✅ Refresh tokens almacenados en base de datos con revocación
- ✅ Passwords hasheados con bcrypt (10 rounds)
- ✅ No se almacenan contraseñas en texto plano

#### Protección de Endpoints
- ✅ CORS configurado solo para frontend autorizado
- ✅ Helmet para headers de seguridad HTTP
- ✅ Rate limiting (100 requests/15 minutos por IP)
- ✅ Validación de entrada en todos los endpoints

#### Base de Datos
- ✅ Queries parametrizadas (protección contra SQL injection)
- ✅ Conexión segura con credenciales en variables de entorno
- ✅ Índices en tablas para mejor rendimiento

#### Logging y Auditoría
- ✅ Todos los eventos de autenticación registrados
- ✅ IP y User-Agent capturados
- ✅ Errores logueados sin exponer información sensible
- ✅ Timestamps en UTC

### Variables de Entorno Sensibles

**NUNCA commitear archivos con:**
- Client Secrets (Google, Keycloak)
- JWT Secrets
- Database passwords
- Session secrets

**Siempre usar:**
- Archivo `.env` (incluido en `.gitignore`)
- Variables de entorno del sistema
- Secrets managers en producción (AWS Secrets Manager, Azure Key Vault, etc.)

---

## 🛠️ Troubleshooting

### Error: "Cannot connect to database"

**Causa:** PostgreSQL no está corriendo o no está accesible.

**Solución:**
```bash
# Verificar contenedores
docker ps

# Reiniciar contenedores
docker-compose restart

# Ver logs de PostgreSQL
docker-compose logs postgres
```

### Error: "Port already in use"

**Causa:** El puerto 3000, 5173, 5432 u 8090 ya está en uso.

**Solución:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Error: "CORS policy blocked"

**Causa:** Frontend corriendo en puerto diferente a 5173.

**Solución:**
- Asegúrate que frontend esté en http://localhost:5173
- Verifica `FRONTEND_URL=http://localhost:5173` en `backend/.env`

### Error: Google OAuth "redirect_uri_mismatch"

**Causa:** La URI de callback no está autorizada en Google Cloud Console.

**Solución:**
1. Ve a Google Cloud Console → Credenciales
2. Agrega `http://localhost:3000/auth/google/callback` a URIs autorizadas
3. Espera 1-2 minutos para que se propague

### Error: Keycloak "Invalid client credentials"

**Causa:** El Client Secret no coincide.

**Solución:**
1. Ve a Keycloak Admin → Clients → tournament-system → Credentials
2. Copia el nuevo Client Secret
3. Actualiza `KEYCLOAK_CLIENT_SECRET` en `backend/.env`
4. Reinicia el backend

---

## 👥 Contribuir

### Configuración para Desarrollo

1. **Fork** el repositorio
2. **Clona** tu fork:
   ```bash
   git clone <your-fork-url>
   cd seguridad-software
   ```

3. **Crea una rama** para tu feature:
   ```bash
   git checkout -b feature/nombre-de-tu-feature
   ```

4. **Configura tus propias credenciales:**
   - Copia `backend/.env.example` a `backend/.env`
   - Configura tus propias credenciales de Google y Keycloak
   - **NO commitees el archivo `.env`**

5. **Haz tus cambios** y commitea:
   ```bash
   git add .
   git commit -m "feat: descripción de tu cambio"
   ```

6. **Push** a tu fork:
   ```bash
   git push origin feature/nombre-de-tu-feature
   ```

7. **Crea un Pull Request** en el repositorio original

### Convenciones de Código

- **Backend:** Seguir estilo de Node.js/Express
- **Frontend:** Seguir guía de estilo de React
- **Commits:** Usar [Conventional Commits](https://www.conventionalcommits.org/)
- **Testing:** Agregar tests para nuevas features

### Reportar Issues

Antes de crear un issue:
1. Busca si ya existe un issue similar
2. Incluye información del sistema (OS, Node version, etc.)
3. Incluye pasos para reproducir el error
4. Incluye logs/screenshots si es posible

---

## 📄 Licencia

Este proyecto es para fines **educativos** y fue desarrollado como parte del curso de **Desarrollo de Software Seguro**.

**Autores:**
- Proyecto de Ingeniería de Software
- Periodo 3 - 2025

---

## 📚 Recursos Adicionales

### Documentación
- [Passport.js](http://www.passportjs.org/)
- [Express.js](https://expressjs.com/)
- [React](https://react.dev/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Keycloak](https://www.keycloak.org/documentation)
- [JWT](https://jwt.io/)

### Tutoriales
- [OAuth 2.0 explicado](https://oauth.net/2/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Seguridad en Node.js](https://nodejs.org/en/docs/guides/security/)

---

## 🎉 ¡Listo!

Si seguiste todos los pasos correctamente, deberías tener el sistema funcionando. Si encuentras algún problema, revisa la sección de [Troubleshooting](#-troubleshooting) o abre un issue.

**¡Gracias por usar este proyecto!** 🚀
