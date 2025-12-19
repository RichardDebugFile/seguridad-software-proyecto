# 🏗️ Arquitectura de Microservicios

Documentación completa de la arquitectura de microservicios del sistema.

---

## 📊 Visión General

Este proyecto implementa una **arquitectura de microservicios** con 3 servicios backend independientes, 2 frontends, autenticación centralizada con Keycloak y SSO (Single Sign-On).

```
┌─────────────────────────────────────────────────────────────────┐
│                     ARQUITECTURA COMPLETA                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐                  ┌──────────────────────┐ │
│  │ Frontend Usuario│                  │   Frontend Admin     │ │
│  │  (Puerto 5173)  │                  │    (Puerto 5174)     │ │
│  │                 │                  │                      │ │
│  │  - Login/Reg    │                  │  - Dashboard Admin   │ │
│  │  - Ver Torneos  │                  │  - Gestión Torneos   │ │
│  │  - Ver Jugadores│                  │  - Gestión Jugadores │ │
│  │  - Perfil       │                  │  - Requiere rol admin│ │
│  └────────┬────────┘                  └──────────┬───────────┘ │
│           │                                      │             │
│           └──────────────────┬───────────────────┘             │
│                              │                                 │
│                              ↓                                 │
│                   ┌─────────────────────┐                      │
│                   │     KEYCLOAK        │                      │
│                   │   (Puerto 8090)     │                      │
│                   │                     │                      │
│                   │  - SSO Provider     │                      │
│                   │  - Role Management  │                      │
│                   │  - OAuth 2.0 / OIDC │                      │
│                   └─────────┬───────────┘                      │
│                             │                                  │
│          ┌──────────────────┼──────────────────┐               │
│          ↓                  ↓                  ↓               │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐   │
│  │ Auth Service  │  │   Tournament  │  │  Player Service  │   │
│  │ (Puerto 3000) │  │    Service    │  │  (Puerto 3002)   │   │
│  │               │  │ (Puerto 3001) │  │                  │   │
│  │ - Login       │  │ - CRUD Torneos│  │ - CRUD Jugadores │   │
│  │ - Register    │  │ - Matches     │  │ - Statistics     │   │
│  │ - JWT Tokens  │  │ - Requiere JWT│  │ - Requiere JWT   │   │
│  │ - Roles       │  │ - Admin: CRUD │  │ - Admin: CRUD    │   │
│  │               │  │ - User: Read  │  │ - User: Read     │   │
│  └───────┬───────┘  └───────┬───────┘  └────────┬─────────┘   │
│          │                  │                    │             │
│          ↓                  ↓                    ↓             │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐   │
│  │  security_db  │  │tournament_db  │  │   player_db      │   │
│  │               │  │               │  │                  │   │
│  │  PostgreSQL   │  │  PostgreSQL   │  │   PostgreSQL     │   │
│  └───────────────┘  └───────────────┘  └──────────────────┘   │
│                                                                 │
│            Todas en el mismo contenedor PostgreSQL             │
│                     (Puerto 5432)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Microservicios

### 1. Auth Service (Puerto 3000)

**Responsabilidad:** Autenticación y autorización centralizada

#### Tecnologías:
- Node.js + Express
- Passport.js (Google OAuth, Keycloak OAuth, Local)
- JWT (Access tokens: 1h, Refresh tokens: 7d)
- PostgreSQL (`security_db`)

#### Endpoints Principales:
```
POST   /auth/register          - Registro local
POST   /auth/login             - Login local
GET    /auth/google            - Login con Google
GET    /auth/keycloak          - Login con Keycloak (SSO)
GET    /auth/keycloak/switch-user  - Cambiar usuario (prompt=login)
POST   /auth/logout            - Logout (+ SSO logout para Keycloak)
GET    /auth/me                - Obtener usuario actual
POST   /auth/refresh           - Refrescar access token
```

#### Base de Datos (security_db):
```sql
users (
  id, email, username, password_hash, provider, provider_id,
  display_name, picture_url, roles[], created_at, last_login, is_active
)

audit_logs (
  id, user_id, provider, action, success, ip_address,
  user_agent, error_message, metadata, created_at
)

refresh_tokens (
  id, user_id, token, expires_at, created_at, revoked
)
```

#### Características Especiales:
- ✅ Extrae roles de Keycloak token
- ✅ Incluye roles en JWT payload
- ✅ Auditoría completa de autenticaciones
- ✅ Refresh token rotation

---

### 2. Tournament Service (Puerto 3001)

**Responsabilidad:** Gestión de torneos y partidas

#### Tecnologías:
- Node.js + Express
- JWT verification (no passport, solo middleware)
- PostgreSQL (`tournament_db`)

#### Endpoints Principales:
```
GET    /tournaments           - Listar torneos (requiere auth)
GET    /tournaments/:id       - Ver torneo específico (requiere auth)
POST   /tournaments           - Crear torneo (requiere admin)
PUT    /tournaments/:id       - Actualizar torneo (requiere admin)
DELETE /tournaments/:id       - Eliminar torneo (requiere admin)
```

#### Base de Datos (tournament_db):
```sql
tournaments (
  id, name, description, start_date, end_date,
  max_participants, status, created_by, created_at, updated_at
)

matches (
  id, tournament_id, round, player1_id, player2_id,
  winner_id, score, match_date, status, created_at
)
```

#### Control de Acceso:
- **Usuario normal:** Solo lectura (GET)
- **Admin:** CRUD completo

---

### 3. Player Service (Puerto 3002)

**Responsabilidad:** Gestión de jugadores y estadísticas

#### Tecnologías:
- Node.js + Express
- JWT verification
- PostgreSQL (`player_db`)

#### Endpoints Principales:
```
GET    /players              - Listar jugadores (requiere auth)
GET    /players/:id          - Ver jugador específico (requiere auth)
POST   /players              - Crear jugador (requiere admin)
PUT    /players/:id          - Actualizar jugador (requiere admin)
DELETE /players/:id          - Desactivar jugador (requiere admin)
```

#### Base de Datos (player_db):
```sql
players (
  id, name, email, country, ranking, wins, losses,
  bio, avatar_url, is_active, created_at, updated_at
)

player_statistics (
  id, player_id, tournament_id, matches_played,
  matches_won, points, created_at
)
```

#### Control de Acceso:
- **Usuario normal:** Solo lectura (GET)
- **Admin:** CRUD completo

---

## 🔐 Autenticación y Autorización

### Flujo de Autenticación

```
1. Usuario → Login con Keycloak
2. Keycloak → Verifica credenciales
3. Keycloak → Genera tokens con roles
4. Auth Service → Extrae roles del token Keycloak
5. Auth Service → Genera JWT propio con roles incluidos
6. Frontend → Guarda JWT en localStorage
7. Frontend → Incluye JWT en header Authorization
8. Microservicio → Verifica JWT
9. Microservicio → Extrae roles del JWT
10. Microservicio → Permite/Deniega según rol
```

### Middleware de Roles

**Cada microservicio tiene:**

```javascript
// middleware/auth.js

export function requireAuth(req, res, next) {
  // Verifica que el JWT sea válido
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded; // Incluye roles
  next();
}

export function requireAdmin(req, res, next) {
  // Verifica que el usuario tenga rol admin
  if (!req.user.roles || !req.user.roles.includes('admin')) {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Se requiere rol de administrador'
    });
  }
  next();
}
```

**Uso en rutas:**

```javascript
// Solo autenticados
router.get('/tournaments', requireAuth, handler);

// Solo admins
router.post('/tournaments', requireAuth, requireAdmin, handler);
```

---

## 🌐 Frontend

### Frontend Usuario (Puerto 5173)

**Propósito:** Interfaz principal para todos los usuarios

#### Características:
- Login con Google, Keycloak, Local
- Dashboard con información del usuario
- Visualización de torneos y jugadores
- Botón "Panel Admin" (solo visible para admins)
- Botón "Cambiar Usuario" (solo para Keycloak)

#### Rutas:
```
/             - Landing
/login        - Pantalla de login
/dashboard    - Dashboard (requiere auth)
```

---

### Frontend Admin (Puerto 5174)

**Propósito:** Panel de administración (solo admins)

#### Características:
- ⛔ **Verificación de rol admin** al cargar
- Redirige automáticamente si no es admin
- Dashboard con estadísticas
- Gestión de torneos (próximamente)
- Gestión de jugadores (próximamente)
- Enlace al Portal Usuario

#### Verificación de Acceso:
```javascript
useEffect(() => {
  const checkAdminAccess = async () => {
    const user = await authService.getCurrentUser();

    if (!user.roles || !user.roles.includes('admin')) {
      // Mostrar mensaje "Acceso Denegado"
      setIsAdmin(false);
    } else {
      setIsAdmin(true);
      loadData(); // Cargar torneos y jugadores
    }
  };

  checkAdminAccess();
}, []);
```

---

## 🔄 Single Sign-On (SSO)

### Demostración de SSO entre Portales

**Caso de uso:**

```
1. Admin hace login en Portal Usuario (5173) con Keycloak
   → Keycloak crea sesión SSO

2. Admin hace clic en "Panel Admin"
   → Abre http://localhost:5174
   → Frontend Admin detecta sesión SSO activa
   → AUTO-LOGIN ⚡ (sin pedir credenciales)
   → Verifica rol admin desde JWT
   → Muestra dashboard admin

3. Admin puede navegar entre ambos portales sin volver a autenticarse
```

**Usuario normal:**

```
1. Usuario normal hace login en Portal Usuario (5173)
   → No ve botón "Panel Admin" (no tiene rol)

2. Si intenta acceder manualmente a localhost:5174
   → Verifica JWT
   → Detecta que no tiene rol admin
   → Muestra mensaje "Acceso Denegado"
   → Botón "Volver al Portal de Usuario"
```

---

## 🗄️ Bases de Datos

### PostgreSQL (Puerto 5432)

**Contenedor:** `security-postgres`

**3 Bases de Datos:**

1. **security_db** (Auth Service)
   - users
   - audit_logs
   - refresh_tokens

2. **tournament_db** (Tournament Service)
   - tournaments
   - matches

3. **player_db** (Player Service)
   - players
   - player_statistics

**Crear bases de datos:**
```bash
# Conectarse al contenedor
docker exec security-postgres psql -U postgres -c "CREATE DATABASE tournament_db;"
docker exec security-postgres psql -U postgres -c "CREATE DATABASE player_db;"
```

**Las tablas se crean automáticamente** cuando cada microservicio inicia por primera vez (función `initializeDatabase()`).

---

## 🚀 Cómo Iniciar el Sistema

### 1. Iniciar Infraestructura

```bash
# PostgreSQL + Keycloak
docker-compose up -d
```

### 2. Iniciar Microservicios

```bash
# Auth Service
cd backend
npm run dev

# Tournament Service
cd backend-tournament
npm run dev

# Player Service
cd backend-player
npm run dev
```

### 3. Iniciar Frontends

```bash
# Frontend Usuario
cd frontend
npm run dev

# Frontend Admin
cd frontend-admin
npm run dev
```

### 4. Acceder a las Aplicaciones

- **Frontend Usuario:** http://localhost:5173
- **Frontend Admin:** http://localhost:5174
- **Keycloak Admin:** http://localhost:8090 (admin/admin123)

---

## 🧪 Probar SSO

### Escenario 1: Admin accede a ambos portales

```bash
1. Abre http://localhost:5173
2. Login con Keycloak (admin/Admin123!)
3. Verás botón "Panel Admin" (porque eres admin)
4. Click en "Panel Admin"
5. Se abre http://localhost:5174
6. AUTO-LOGIN ⚡ sin pedir credenciales
7. Ves el dashboard admin
```

### Escenario 2: Usuario normal intenta acceder al admin

```bash
1. Abre http://localhost:5173
2. Login con Keycloak (testuser/Test123!)
3. NO ves botón "Panel Admin"
4. Abre manualmente http://localhost:5174
5. Ves mensaje "Acceso Denegado"
6. Click "Volver al Portal de Usuario"
7. Redirige a http://localhost:5173
```

---

## 🔒 Seguridad

### Principios Implementados:

1. **Separación de Responsabilidades**
   - Cada servicio tiene su propia BD
   - Cada servicio es independiente

2. **Role-Based Access Control (RBAC)**
   - Roles definidos en Keycloak
   - Verificación en cada microservicio
   - Frontend adapta UI según roles

3. **JWT Stateless**
   - Tokens firmados con secret compartido
   - Roles incluidos en payload
   - Verificación local en cada servicio

4. **Least Privilege**
   - Usuarios normales: solo lectura
   - Admins: CRUD completo

5. **Auditoría**
   - Todos los logins registrados en audit_logs
   - IP, user agent, éxito/fallo

---

## 📈 Escalabilidad

### Ventajas de Microservicios:

✅ **Escalado Independiente**
- Si Tournament Service tiene mucha carga, escala solo ese servicio

✅ **Deploy Independiente**
- Actualiza Player Service sin afectar Auth o Tournament

✅ **Tecnología Heterogénea**
- Cada servicio puede usar diferentes tecnologías

✅ **Resiliencia**
- Si Player Service cae, Tournament sigue funcionando

✅ **Desarrollo en Paralelo**
- Equipos diferentes pueden trabajar en cada servicio

---

## 🛠️ Tecnologías Utilizadas

| Componente | Tecnología |
|------------|------------|
| **Frontend** | React 18, Vite 5, TailwindCSS 3, React Router 6 |
| **Backend** | Node.js 18, Express 4.18 |
| **Autenticación** | Passport.js, JWT |
| **SSO** | Keycloak 23.0 (OAuth 2.0 / OIDC) |
| **Base de Datos** | PostgreSQL 15 |
| **Infraestructura** | Docker, Docker Compose |

---

## 📚 Documentos Relacionados

- [Configuración de Keycloak](./KEYCLOAK-SETUP.md)
- [Configuración de Roles](./ROLES.md)
- [Single Sign-On (SSO)](./SSO.md)
- [API Documentation](./API.md)

---

## ✅ Checklist de Arquitectura

- [x] Auth Service (puerto 3000)
- [x] Tournament Service (puerto 3001)
- [x] Player Service (puerto 3002)
- [x] Frontend Usuario (puerto 5173)
- [x] Frontend Admin (puerto 5174)
- [x] 3 Bases de datos independientes
- [x] Keycloak configurado con roles
- [x] JWT con roles incluidos
- [x] Middleware requireAuth en cada servicio
- [x] Middleware requireAdmin en cada servicio
- [x] SSO funcionando entre portales
- [x] Verificación de roles en frontend admin
- [x] Control de acceso basado en roles

¡Arquitectura de microservicios completamente funcional! 🎉
