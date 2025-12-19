# 🔐 Sistema de Autenticación Segura Multi-Proveedor con Microservicios

Sistema completo de autenticación con arquitectura de microservicios, soporte para múltiples proveedores OAuth2 (Google, Keycloak) con SSO real, autenticación local con JWT, panel de administración y servicios especializados para torneos y jugadores.

![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![React](https://img.shields.io/badge/React-v18-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![Keycloak](https://img.shields.io/badge/Keycloak-23.0-red)
![Microservices](https://img.shields.io/badge/Architecture-Microservices-orange)
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

### Arquitectura de Microservicios
- 🏗️ **4 Microservicios Backend Independientes**
  - **Auth Service** (Puerto 3000) - Autenticación y autorización
  - **Tournament Service** (Puerto 3001) - Gestión de torneos
  - **Player Service** (Puerto 3002) - Gestión de jugadores
  - **Message Service** (Puerto 3003) - Mensajería encriptada E2EE
- 🏗️ **2 Aplicaciones Frontend**
  - **Portal Usuario** (Puerto 5173) - Interfaz para usuarios
  - **Panel Admin** (Puerto 5174) - Interfaz administrativa
- 🏗️ **4 Bases de Datos PostgreSQL Independientes**
  - Una por cada microservicio para aislamiento total
- 🔐 **HashiCorp Vault (KMS)** - Key Management Service externo para claves de encriptación

### Autenticación Multi-Proveedor con SSO Real
- ✅ **Google OAuth 2.0** - Autenticación con cuenta de Google
- ✅ **Keycloak OAuth 2.0 + SSO** - Servidor de identidad con Single Sign-On completo
  - 🔄 Auto-login entre Portal Usuario y Panel Admin
  - 🔄 Sesión unificada entre ambas aplicaciones
  - 🔄 Logout sincronizado que cierra sesión en ambos portales
  - 🔄 Cambio de portal sin pasar por login gracias a token sharing
- ✅ **Local** - Registro y login con email/contraseña

### Sistema de Roles y Permisos
- 👤 **Rol User** - Acceso al Portal Usuario
- 👑 **Rol Admin** - Acceso al Portal Usuario + Panel Admin
- 🔐 **Control de Acceso** - Verificación de roles a nivel de frontend y backend
- 🚫 **Acceso Denegado** - Mensajes claros cuando no hay permisos

### Panel de Administración
- 📊 **Dashboard Administrativo** - Estadísticas en tiempo real
  - Total de torneos activos e inactivos
  - Total de jugadores registrados
  - Gestión visual de datos
- 🎮 **Gestión de Torneos** - CRUD completo de torneos
- 👥 **Gestión de Jugadores** - CRUD completo de jugadores
- 🔄 **Cambio Fluido** - Switch entre Portal Usuario y Panel Admin sin re-autenticación

### Mensajería Segura con Encriptación E2EE
- 💬 **Chat Encriptado End-to-End** - Mensajería privada entre usuarios
- 🔐 **Encriptación Híbrida** - RSA-4096 + AES-256-GCM
- 🔑 **HashiCorp Vault como KMS** - Gestión profesional de claves públicas
- 🗝️ **Claves Privadas Locales** - Almacenadas en IndexedDB del navegador (nunca salen del cliente)
- 🛡️ **Zero-Knowledge Backend** - El servidor no puede leer los mensajes
- 🌐 **WebCrypto API** - Encriptación nativa del navegador
- 📦 **Almacenamiento Seguro** - Mensajes guardados encriptados en PostgreSQL
- 🔄 **Generación Automática de Claves** - Al primer uso del chat
- 📱 **Interfaz Intuitiva** - UI completa con indicadores de encriptación

### Seguridad
- 🔒 **JWT Tokens** - Access y Refresh tokens
- 🔒 **BCrypt** - Hash de contraseñas (10 rounds)
- 🔒 **CORS** - Configuración estricta para múltiples orígenes
- 🔒 **Helmet** - Headers de seguridad HTTP
- 🔒 **Rate Limiting** - Protección contra ataques de fuerza bruta
- 🔒 **SQL Injection Protection** - Queries parametrizadas
- 🔒 **Token Revocation** - Sistema de revocación de refresh tokens

### Auditoría y Logging
- 📊 **Audit Logs** - Registro completo de eventos de autenticación
- 📊 **IP Tracking** - Seguimiento de direcciones IP
- 📊 **User Agent Logging** - Información del navegador/dispositivo
- 📊 **Success/Failure Tracking** - Monitoreo de intentos exitosos y fallidos

### Interfaz de Usuario
- 🎨 **React 18 + Vite** - Frontend moderno y rápido
- 🎨 **TailwindCSS** - Diseño responsive y profesional
- 🎨 **SPA** - Single Page Application con React Router
- 🎨 **Storage Event Sync** - Sincronización entre ventanas/tabs

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CAPA DE PRESENTACIÓN                              │
├────────────────────────────┬────────────────────────────────────────────┤
│   Portal Usuario           │      Panel Admin                           │
│   (React + Vite)           │      (React + Vite)                        │
│   Port: 5173               │      Port: 5174                            │
│   - Login/Dashboard        │      - Dashboard Admin                     │
│   - Chat Seguro (E2EE)     │      - Gestión Torneos                     │
│   - Botón Panel Admin      │      - Gestión Jugadores                   │
│   - Auto SSO               │                                            │
└────────┬───────────────────┴────────────┬───────────────────────────────┘
         │                                │
         │         HTTP/HTTPS             │
         │   (Token Sharing via URL)      │
         │                                │
┌────────▼────────────────────────────────▼───────────────────────────────┐
│                        CAPA DE SERVICIOS                                 │
├────────────┬───────────────┬────────────────┬────────────┬─────────────┤
│Auth Service│Tournament Svc │ Player Service │Message Svc │  Keycloak   │
│ Port: 3000 │  Port: 3001   │  Port: 3002    │Port: 3003  │Port: 8090   │
│            │               │                │            │             │
│- Login     │- CRUD Torneos │- CRUD Players  │- E2EE Msgs │- SSO        │
│- Register  │- Estadísticas │- Estadísticas  │- Pub Keys  │- OAuth 2.0  │
│- JWT       │               │                │- Vault Int.│- IdP        │
│- Refresh   │               │                │            │             │
│- Logout    │               │                │            │             │
└──────┬─────┴───────┬───────┴────────┬───────┴─────┬──────┴─────────────┘
       │             │                │             │
       │             │                │      ┌──────▼──────┐
       │             │                │      │   Vault     │
       │             │                │      │ (KMS E2EE)  │
       │             │                │      │ Port: 8200  │
       │             │                │      │- Public Keys│
       │             │                │      │- KV Storage │
       │             │                │      └─────────────┘
┌──────▼─────────────▼────────────────▼─────────────▼────────────────────┐
│                          CAPA DE DATOS                                  │
├────────────┬────────────────┬───────────────┬──────────────┬───────────┤
│  Auth DB   │ Tournament DB  │  Player DB    │  Message DB  │Keycloak DB│
│ PostgreSQL │  PostgreSQL    │  PostgreSQL   │  PostgreSQL  │PostgreSQL │
│ Port: 5432 │  Port: 5433    │  Port: 5434   │ Port: 5432*  │ Internal  │
│            │                │               │              │           │
│- users     │- tournaments   │- players      │- messages**  │- realms   │
│- tokens    │                │               │              │- users    │
│- audit_logs│                │               │              │- clients  │
└────────────┴────────────────┴───────────────┴──────────────┴───────────┘

* Mismo servidor PostgreSQL, base de datos separada (message_db)
** Mensajes almacenados ENCRIPTADOS (el servidor no puede leerlos)
```

**Flujo de SSO entre Portales:**

```
1. Usuario hace login en Portal Usuario con Keycloak
   └→ Keycloak genera sesión SSO

2. Usuario tiene rol "admin" y ve botón "Panel Admin"
   └→ Click pasa tokens vía URL: http://localhost:5174?accessToken=...&refreshToken=...

3. Panel Admin recibe tokens y los guarda en localStorage
   └→ Auto-login sin necesidad de re-autenticación

4. Usuario puede regresar al Portal Usuario con el botón "Portal Usuario"
   └→ Mismo proceso inverso, tokens pasados vía URL

5. Logout desde cualquier portal
   └→ Storage event sincroniza logout en ambos portales
   └→ Keycloak cierra sesión SSO completamente
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

### 2. Instalar Dependencias de los Backends

```bash
# Auth Service
cd backend
npm install

# Tournament Service
cd ../backend-tournament
npm install

# Player Service
cd ../backend-player
npm install

# Message Service
cd ../backend-message
npm install
```

### 3. Instalar Dependencias de los Frontends

```bash
# Portal Usuario
cd ../frontend
npm install

# Panel Admin
cd ../frontend-admin
npm install
```

### 4. Iniciar Servicios Docker

Desde la raíz del proyecto:

```bash
docker-compose up -d
```

Esto iniciará:
- **PostgreSQL (Auth DB)** - Puerto 5432
- **PostgreSQL (Tournament DB)** - Puerto 5433
- **PostgreSQL (Player DB)** - Puerto 5434
- **Keycloak PostgreSQL** - Base de datos interna de Keycloak
- **Keycloak** - Puerto 8090
- **HashiCorp Vault (KMS)** - Puerto 8200

**Verificar que los contenedores estén corriendo:**

```bash
docker ps
```

Deberías ver 6 contenedores:
- `security-postgres` (Auth DB + Message DB)
- `tournament-postgres` (Tournament DB)
- `player-postgres` (Player DB)
- `keycloak-db`
- `security-keycloak`
- `security-vault`

---

## ⚙️ Configuración

### 1. Configurar Variables de Entorno de los Backends

#### Auth Service (`backend/.env`)

El archivo `.env` ya existe, pero verifica las siguientes variables:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=security_db
DB_USER=postgres
DB_PASSWORD=postgres123

# JWT Configuration
JWT_SECRET=dev-jwt-secret-key-12345
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=dev-refresh-secret-key-12345
JWT_REFRESH_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=dev-session-secret-key-12345

# Google OAuth2 Configuration (opcional)
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Keycloak Configuration
KEYCLOAK_REALM=tournament
KEYCLOAK_AUTH_SERVER_URL=http://localhost:8090
KEYCLOAK_CLIENT_ID=tournament-system
KEYCLOAK_CLIENT_SECRET=GAd1f9lOsvuPfC32N0bn1k6WuebeXzja
KEYCLOAK_CALLBACK_URL=http://localhost:3000/auth/keycloak/callback

# Frontend URLs (for CORS)
FRONTEND_URL=http://localhost:5173
FRONTEND_ADMIN_URL=http://localhost:5174
```

#### Tournament Service (`backend-tournament/.env`)

```bash
PORT=3001
DB_HOST=localhost
DB_PORT=5433
DB_NAME=tournament_db
DB_USER=postgres
DB_PASSWORD=postgres123
AUTH_SERVICE_URL=http://localhost:3000
```

#### Player Service (`backend-player/.env`)

```bash
PORT=3002
DB_HOST=localhost
DB_PORT=5434
DB_NAME=player_db
DB_USER=postgres
DB_PASSWORD=postgres123
AUTH_SERVICE_URL=http://localhost:3000
```

#### Message Service (`backend-message/.env`)

```bash
PORT=3003
DB_HOST=localhost
DB_PORT=5432
DB_NAME=message_db
DB_USER=postgres
DB_PASSWORD=postgres123
AUTH_SERVICE_URL=http://localhost:3000

# HashiCorp Vault Configuration
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=dev-root-token
```

### 2. Configurar Google OAuth (Opcional)

Si quieres habilitar autenticación con Google:

📖 **Ver guía completa:** [`docs/GOOGLE-OAUTH-SETUP.md`](docs/GOOGLE-OAUTH-SETUP.md)

**Pasos rápidos:**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Habilita Google+ API
4. Crea credenciales OAuth 2.0
5. Agrega URIs autorizadas:
   - `http://localhost:3000/auth/google/callback`
6. Copia Client ID y Client Secret a `backend/.env`

### 3. Configurar Keycloak (Requerido para SSO)

📖 **Ver guía completa:** [`docs/KEYCLOAK-SETUP.md`](docs/KEYCLOAK-SETUP.md)

**Pasos rápidos:**

1. Accede a http://localhost:8090/admin
2. Login: `admin` / `admin123`
3. Crea el realm `tournament`
4. Crea el cliente `tournament-system`
5. Configuración del cliente:
   - Client authentication: ON
   - Valid redirect URIs:
     - `http://localhost:3000/auth/keycloak/callback`
     - `http://localhost:5173/*`
     - `http://localhost:5174/*`
   - Valid post logout redirect URIs:
     - `http://localhost:5173/*`
     - `http://localhost:5174/*`
6. Copia el Client Secret a `backend/.env`
7. Crea usuarios de prueba con roles:
   - **Admin**: `admin` / `Admin123!` (con roles "admin" y "user")
   - **User**: `testuser` / `Test123!` (con rol "user")

📖 **Configurar Usuarios y Roles:** [`docs/KEYCLOAK-USERS-ROLES.md`](docs/KEYCLOAK-USERS-ROLES.md)

📖 **Troubleshooting SSO:** [`docs/TROUBLESHOOTING-SSO.md`](docs/TROUBLESHOOTING-SSO.md)

---

## 🎯 Uso

### Iniciar la Aplicación

Necesitas iniciar todos los servicios por separado:

**Terminal 1 - Auth Service:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Tournament Service:**
```bash
cd backend-tournament
npm run dev
```

**Terminal 3 - Player Service:**
```bash
cd backend-player
npm run dev
```

**Terminal 4 - Message Service:**
```bash
cd backend-message
npm run dev
```

**Terminal 5 - Portal Usuario:**
```bash
cd frontend
npm run dev
```

**Terminal 6 - Panel Admin:**
```bash
cd frontend-admin
npm run dev
```

### Acceder a las Aplicaciones

Una vez iniciados todos los servicios:

- **Portal Usuario**: http://localhost:5173
- **Panel Admin**: http://localhost:5174
- **Auth Service API**: http://localhost:3000
- **Tournament Service API**: http://localhost:3001
- **Player Service API**: http://localhost:3002
- **Message Service API**: http://localhost:3003
- **Keycloak Admin**: http://localhost:8090/admin
- **HashiCorp Vault**: http://localhost:8200 (Token: `dev-root-token`)

### Probar el Sistema

#### 1. Autenticación Local (Portal Usuario)

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
6. Verás el Dashboard de usuario (sin acceso al Panel Admin)

#### 2. Autenticación con Keycloak (Usuario Admin)

1. Ve a http://localhost:5173
2. Haz clic en el botón **"Keycloak"**
3. Login con: `admin` / `Admin123!`
4. Serás redirigido al Dashboard
5. **Verás el botón "Panel Admin"** (morado) porque tienes rol admin

#### 3. Probar SSO entre Portales

1. Estando en el Portal Usuario (con usuario admin logueado)
2. Haz clic en **"Panel Admin"**
3. ✅ Acceso instantáneo sin volver a pedir credenciales
4. Verás el Dashboard Admin con estadísticas
5. Haz clic en **"Portal Usuario"**
6. ✅ Regreso instantáneo al Portal Usuario

#### 4. Probar Logout Sincronizado

1. Abre Portal Usuario en una pestaña
2. Abre Panel Admin en otra pestaña
3. Haz logout desde cualquiera de los dos
4. ✅ Ambas pestañas se cerrarán sesión automáticamente
5. ✅ Keycloak cierra la sesión SSO completa

#### 5. Gestión de Torneos (Panel Admin)

1. En el Panel Admin, ve a la pestaña **"Torneos"**
2. Haz clic en **"+ Nuevo Torneo"**
3. Completa el formulario:
   ```
   Nombre: Torneo de Prueba
   Descripción: Descripción del torneo
   Fecha de Inicio: Fecha actual
   Fecha de Fin: Fecha futura
   Estado: Activo
   ```
4. Haz clic en **"Crear Torneo"**
5. ✅ El torneo aparecerá en la lista

#### 6. Gestión de Jugadores (Panel Admin)

1. En el Panel Admin, ve a la pestaña **"Jugadores"**
2. Haz clic en **"+ Nuevo Jugador"**
3. Completa el formulario:
   ```
   Nombre: Juan Pérez
   Email: juan@example.com
   Teléfono: 1234567890
   Fecha de Nacimiento: 2000-01-01
   ```
4. Haz clic en **"Crear Jugador"**
5. ✅ El jugador aparecerá en la lista

#### 7. Mensajería Encriptada E2EE (Portal Usuario)

1. En el Portal Usuario (con usuario logueado), haz clic en **"Chat Seguro"**
2. El sistema generará automáticamente tus claves de encriptación:
   - 🔑 Clave privada RSA-4096 (guardada en IndexedDB del navegador)
   - 🔐 Clave pública RSA-4096 (subida a HashiCorp Vault)
3. Ingresa el **ID del destinatario** (por ejemplo, el ID de otro usuario registrado)
4. Haz clic en **"Load Chat"** para cargar mensajes existentes
5. Escribe tu mensaje y haz clic en **"Send 🔒"**
6. ✅ El mensaje se encripta automáticamente:
   - Se genera una clave AES-256 aleatoria
   - El mensaje se encripta con AES-256-GCM
   - La clave AES se encripta con la clave pública RSA del destinatario
   - Solo el destinatario puede desencriptar el mensaje
7. Los mensajes aparecerán en la interfaz del chat
8. 🔒 El servidor **NO puede leer** tus mensajes (zero-knowledge backend)

**Nota:** Cada usuario necesita haber abierto el Chat al menos una vez para generar sus claves de encriptación antes de poder recibir mensajes.

📖 **Ver guía completa de mensajería:** [`docs/MESSAGING-E2EE.md`](docs/MESSAGING-E2EE.md)

---

## 📁 Estructura del Proyecto

```
seguridad-software/
├── backend/                         # Auth Service (Puerto 3000)
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js         # PostgreSQL Auth DB
│   │   │   └── passport.js         # Estrategias de autenticación
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT y autorización
│   │   │   └── audit.js            # Logging de eventos
│   │   ├── routes/
│   │   │   └── auth.routes.js      # Endpoints de autenticación
│   │   └── server.js               # Servidor Auth Service
│   ├── .env                        # Variables de entorno Auth
│   └── package.json
│
├── backend-tournament/              # Tournament Service (Puerto 3001)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js         # PostgreSQL Tournament DB
│   │   ├── middleware/
│   │   │   └── auth.js             # Verificación JWT
│   │   ├── routes/
│   │   │   └── tournament.routes.js # CRUD de torneos
│   │   └── server.js               # Servidor Tournament Service
│   ├── .env                        # Variables de entorno Tournament
│   └── package.json
│
├── backend-player/                  # Player Service (Puerto 3002)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js         # PostgreSQL Player DB
│   │   ├── middleware/
│   │   │   └── auth.js             # Verificación JWT
│   │   ├── routes/
│   │   │   └── player.routes.js    # CRUD de jugadores
│   │   └── server.js               # Servidor Player Service
│   ├── .env                        # Variables de entorno Player
│   └── package.json
│
├── backend-message/                 # Message Service (Puerto 3003)
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js         # PostgreSQL Message DB
│   │   │   └── vault.js            # HashiCorp Vault integration
│   │   ├── middleware/
│   │   │   └── auth.js             # Verificación JWT
│   │   ├── routes/
│   │   │   └── message.routes.js   # E2EE messaging endpoints
│   │   └── server.js               # Servidor Message Service
│   ├── .env                        # Variables de entorno Message
│   └── package.json
│
├── frontend/                        # Portal Usuario (Puerto 5173)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx           # Login/Registro
│   │   │   ├── Dashboard.jsx       # Dashboard Usuario
│   │   │   ├── Chat.jsx            # E2EE Chat Interface
│   │   │   └── AuthCallback.jsx    # OAuth Callback
│   │   ├── utils/
│   │   │   ├── api.js              # Cliente HTTP Auth
│   │   │   ├── messageApi.js       # Cliente HTTP Messages
│   │   │   └── encryption.js       # WebCrypto E2EE utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── frontend-admin/                  # Panel Admin (Puerto 5174)
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminDashboard.jsx  # Dashboard Admin
│   │   │   └── AuthCallback.jsx    # OAuth Callback
│   │   ├── utils/
│   │   │   └── api.js              # Cliente HTTP
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── docs/                            # Documentación
│   ├── GOOGLE-OAUTH-SETUP.md       # Configuración Google OAuth
│   ├── KEYCLOAK-SETUP.md           # Configuración Keycloak
│   ├── KEYCLOAK-USERS-ROLES.md     # Configuración de Usuarios y Roles
│   ├── TROUBLESHOOTING-SSO.md      # Solución de problemas SSO
│   ├── MESSAGING-E2EE.md           # Sistema de mensajería E2EE
│   └── API.md                      # Documentación de APIs
│
├── docker-compose.yml               # Docker (PostgreSQL + Keycloak + Vault)
├── init-databases.sql               # Inicialización de bases de datos
├── .gitignore
├── package.json                     # Scripts raíz
└── README.md                        # Este archivo
```

---

## 🔌 API Endpoints

### Auth Service (Puerto 3000)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/auth/google` | Iniciar OAuth con Google | No |
| `GET` | `/auth/google/callback` | Callback de Google OAuth | No |
| `GET` | `/auth/keycloak` | Iniciar OAuth con Keycloak | No |
| `GET` | `/auth/keycloak/callback` | Callback de Keycloak OAuth | No |
| `POST` | `/auth/register` | Registrar usuario local | No |
| `POST` | `/auth/login` | Login con email/contraseña | No |
| `POST` | `/auth/refresh` | Renovar access token | No |
| `POST` | `/auth/logout` | Cerrar sesión (revoca tokens) | Sí (JWT) |
| `GET` | `/auth/me` | Obtener usuario actual | Sí (JWT) |
| `GET` | `/` | Info de la API | No |
| `GET` | `/health` | Health check | No |

### Tournament Service (Puerto 3001)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/api/tournaments` | Listar todos los torneos | Sí (JWT) |
| `GET` | `/api/tournaments/:id` | Obtener torneo por ID | Sí (JWT) |
| `POST` | `/api/tournaments` | Crear torneo | Sí (JWT + Admin) |
| `PUT` | `/api/tournaments/:id` | Actualizar torneo | Sí (JWT + Admin) |
| `DELETE` | `/api/tournaments/:id` | Eliminar torneo | Sí (JWT + Admin) |
| `GET` | `/api/tournaments/stats` | Estadísticas de torneos | Sí (JWT + Admin) |

### Player Service (Puerto 3002)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `GET` | `/api/players` | Listar todos los jugadores | Sí (JWT) |
| `GET` | `/api/players/:id` | Obtener jugador por ID | Sí (JWT) |
| `POST` | `/api/players` | Crear jugador | Sí (JWT + Admin) |
| `PUT` | `/api/players/:id` | Actualizar jugador | Sí (JWT + Admin) |
| `DELETE` | `/api/players/:id` | Eliminar jugador | Sí (JWT + Admin) |
| `GET` | `/api/players/stats` | Estadísticas de jugadores | Sí (JWT + Admin) |

### Message Service (Puerto 3003)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `POST` | `/api/keys` | Subir clave pública del usuario a Vault | Sí (JWT) |
| `GET` | `/api/keys/:userId` | Obtener clave pública de un usuario desde Vault | Sí (JWT) |
| `POST` | `/api/messages` | Enviar mensaje encriptado E2EE | Sí (JWT) |
| `GET` | `/api/messages` | Obtener mensajes encriptados (con filtros) | Sí (JWT) |
| `GET` | `/api/conversations` | Listar conversaciones del usuario | Sí (JWT) |
| `PATCH` | `/api/messages/:messageId/read` | Marcar mensaje como leído | Sí (JWT) |
| `GET` | `/api/messages/unread/count` | Contar mensajes no leídos | Sí (JWT) |
| `DELETE` | `/api/messages/:messageId` | Eliminar mensaje | Sí (JWT) |
| `GET` | `/health` | Health check del servicio | No |

**Nota sobre E2EE:** Todos los mensajes se almacenan encriptados en la base de datos. El servidor **NO puede leer** el contenido de los mensajes. Solo el destinatario con su clave privada puede desencriptar los mensajes.

📖 **Ver documentación completa de las APIs:** [`docs/API.md`](docs/API.md)
📖 **Ver documentación del sistema E2EE:** [`docs/MESSAGING-E2EE.md`](docs/MESSAGING-E2EE.md)

---

## 🔒 Seguridad

### Prácticas Implementadas

#### Autenticación y Autorización
- ✅ JWT con expiración (1 hora para access token, 7 días para refresh token)
- ✅ Refresh tokens almacenados en base de datos con revocación automática
- ✅ Passwords hasheados con bcrypt (10 rounds)
- ✅ No se almacenan contraseñas en texto plano
- ✅ Sistema de roles (admin, user) con verificación en backend
- ✅ Middleware de autorización en todos los endpoints sensibles

#### Protección de Endpoints
- ✅ CORS configurado para múltiples orígenes (5173, 5174)
- ✅ Helmet para headers de seguridad HTTP
- ✅ Rate limiting (100 requests/15 minutos por IP)
- ✅ Validación de entrada en todos los endpoints
- ✅ Verificación de roles a nivel de microservicio

#### Base de Datos
- ✅ Queries parametrizadas (protección contra SQL injection)
- ✅ 4 bases de datos aisladas para cada microservicio
- ✅ Conexión segura con credenciales en variables de entorno
- ✅ Índices en tablas para mejor rendimiento
- ✅ Constraint de unicidad en tokens de refresh
- ✅ Mensajes almacenados encriptados (zero-knowledge storage)

#### SSO y Sincronización
- ✅ Token sharing vía query params (limpieza automática de URL)
- ✅ Storage event para logout sincronizado
- ✅ Keycloak como IdP centralizado
- ✅ Logout completo que cierra sesión SSO en Keycloak

#### Logging y Auditoría
- ✅ Todos los eventos de autenticación registrados
- ✅ IP y User-Agent capturados
- ✅ Errores logueados sin exponer información sensible
- ✅ Timestamps en UTC

#### Encriptación End-to-End (E2EE)
- ✅ Encriptación híbrida RSA-4096 + AES-256-GCM
- ✅ Claves privadas nunca salen del navegador (IndexedDB)
- ✅ Claves públicas almacenadas en HashiCorp Vault (KMS externo)
- ✅ WebCrypto API nativa del navegador
- ✅ Zero-knowledge backend (servidor no puede leer mensajes)
- ✅ Clave AES única por mensaje
- ✅ IV (Initialization Vector) aleatorio por mensaje
- ✅ Generación automática de claves al primer uso

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
docker-compose logs security-postgres
docker-compose logs tournament-postgres
docker-compose logs player-postgres
```

### Error: "Port already in use"

**Causa:** Alguno de los puertos (3000, 3001, 3002, 5173, 5174, 5432, 5433, 5434, 8090) ya está en uso.

**Solución:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Error: "CORS policy blocked"

**Causa:** Frontend corriendo en puerto diferente o no configurado en CORS.

**Solución:**
- Asegúrate que frontends estén en http://localhost:5173 y http://localhost:5174
- Verifica `FRONTEND_URL` y `FRONTEND_ADMIN_URL` en `backend/.env`
- Reinicia el Auth Service después de cambiar `.env`

### Error: Panel Admin muestra "Acceso Denegado"

**Causa:** Usuario no tiene rol "admin" en Keycloak o tokens no fueron pasados correctamente.

**Solución:**
1. Verifica que el usuario tenga rol "admin" en Keycloak
2. Verifica que el mapper de roles esté configurado
3. Haz logout completo y vuelve a hacer login
4. Si accediste directamente al Panel Admin sin pasar por Portal Usuario, inicia sesión primero en Portal Usuario

📖 **Ver guía completa:** [`docs/TROUBLESHOOTING-SSO.md`](docs/TROUBLESHOOTING-SSO.md)

### Error: Logout no sincroniza entre portales

**Causa:** Storage events no se están propagando.

**Solución:**
1. Verifica que ambos portales estén en `http://localhost` (no `127.0.0.1`)
2. Limpia localStorage y sessionStorage en ambos portales
3. Cierra todas las pestañas y vuelve a abrir

### Error: Microservicio no puede verificar JWT

**Causa:** `AUTH_SERVICE_URL` no configurado o Auth Service no está corriendo.

**Solución:**
1. Verifica que Auth Service esté corriendo en puerto 3000
2. Verifica `AUTH_SERVICE_URL=http://localhost:3000` en `.env` de Tournament y Player
3. Reinicia los microservicios

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
   - Copia los archivos `.env.example` a `.env` en cada servicio
   - Configura tus propias credenciales
   - **NO commitees los archivos `.env`**

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
- **Microservicios:** Mantener aislamiento de responsabilidades

### Reportar Issues

Antes de crear un issue:
1. Busca si ya existe un issue similar
2. Incluye información del sistema (OS, Node version, etc.)
3. Incluye pasos para reproducir el error
4. Incluye logs/screenshots si es posible
5. Indica qué microservicio presenta el problema

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
- [Microservices Pattern](https://microservices.io/)

### Tutoriales
- [OAuth 2.0 explicado](https://oauth.net/2/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Seguridad en Node.js](https://nodejs.org/en/docs/guides/security/)
- [Single Sign-On (SSO)](https://auth0.com/docs/authenticate/single-sign-on)

---

## 🎉 ¡Listo!

Si seguiste todos los pasos correctamente, deberías tener el sistema completo funcionando con:

- ✅ 4 Microservicios Backend corriendo (Auth, Tournament, Player, Message)
- ✅ 2 Aplicaciones Frontend corriendo (Portal Usuario, Panel Admin)
- ✅ SSO funcionando entre Portal Usuario y Panel Admin
- ✅ Logout sincronizado entre portales
- ✅ Gestión de Torneos y Jugadores
- ✅ Sistema de roles y permisos
- ✅ Mensajería encriptada End-to-End (E2EE)
- ✅ HashiCorp Vault como KMS externo

**Credenciales de prueba Keycloak:**
- Admin: `admin` / `Admin123!` (acceso a todo)
- User: `testuser` / `Test123!` (solo Portal Usuario)

Si encuentras algún problema, revisa la sección de [Troubleshooting](#-troubleshooting) o consulta [`docs/TROUBLESHOOTING-SSO.md`](docs/TROUBLESHOOTING-SSO.md).

**¡Gracias por usar este proyecto!** 🚀
