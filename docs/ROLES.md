# 🎭 Configuración de Roles en Keycloak

Guía completa para configurar roles de usuario y administrador en Keycloak 23.0 e integrarlos con tu sistema de microservicios.

---

## 📋 Índice

1. [Roles del Sistema](#roles-del-sistema)
2. [Configuración en Keycloak](#configuración-en-keycloak)
3. [Asignación de Roles a Usuarios](#asignación-de-roles-a-usuarios)
4. [Configurar Client Mapper](#configurar-client-mapper)
5. [Verificar Tokens](#verificar-tokens)
6. [Integración con Backend](#integración-con-backend)
7. [Integración con Frontend](#integración-con-frontend)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Roles del Sistema

Este proyecto utiliza un modelo de **Role-Based Access Control (RBAC)** con dos roles principales:

### Rol: `user`
- **Permisos:** Solo lectura (GET)
- **Acceso:**
  - ✅ Ver torneos
  - ✅ Ver jugadores
  - ✅ Ver su propio perfil
  - ❌ Crear, editar o eliminar recursos
  - ❌ Acceso al Panel Admin

### Rol: `admin`
- **Permisos:** Lectura y escritura completa (CRUD)
- **Acceso:**
  - ✅ Todas las funciones de `user`
  - ✅ Crear torneos y jugadores
  - ✅ Editar torneos y jugadores
  - ✅ Eliminar (desactivar) torneos y jugadores
  - ✅ Acceso al Panel Admin (puerto 5174)

**Nota:** Un usuario puede tener ambos roles simultáneamente. El sistema verifica si el array de roles incluye `admin` para otorgar permisos administrativos.

---

## ⚙️ Configuración en Keycloak

### Paso 1: Acceder a Keycloak Admin Console

```bash
# Keycloak debe estar corriendo
docker-compose up -d

# Acceder a:
http://localhost:8090
```

**Credenciales:**
- Username: `admin`
- Password: `admin123`

---

### Paso 2: Crear Roles en el Realm

1. **Selecciona tu realm** (ejemplo: `myrealm`)

2. **Ir a Realm Roles:**
   - Menú lateral → **Realm roles**
   - Click en **"Create role"**

3. **Crear rol `user`:**
   - **Role name:** `user`
   - **Description:** Usuario regular con permisos de solo lectura
   - Click **Save**

4. **Crear rol `admin`:**
   - **Role name:** `admin`
   - **Description:** Administrador con permisos completos
   - Click **Save**

✅ **Resultado:** Deberías ver ambos roles en la lista.

---

## 👤 Asignación de Roles a Usuarios

### Paso 3: Asignar Roles

#### Usuario Normal (testuser)

1. **Ir a Users:**
   - Menú lateral → **Users**
   - Buscar: `testuser`
   - Click en el usuario

2. **Ir a Role Mappings:**
   - Tab **"Role mapping"**
   - Click **"Assign role"**

3. **Asignar rol `user`:**
   - Buscar `user` en la lista
   - ✅ Seleccionar `user`
   - Click **"Assign"**

#### Usuario Administrador (admin)

1. **Buscar usuario `admin`**

2. **Asignar ambos roles:**
   - Click **"Assign role"**
   - ✅ Seleccionar `user`
   - ✅ Seleccionar `admin`
   - Click **"Assign"**

**Nota:** Es buena práctica que los admins tengan también el rol `user` para simplificar la lógica de permisos.

---

## 🔌 Configurar Client Mapper

Para que los roles se incluyan en el token JWT, debes configurar un **mapper** en tu cliente OAuth.

### Paso 4: Configurar Client Scope Mapper

Existen **3 opciones** para incluir roles en el token. Aquí está la **opción recomendada** (Opción 2):

#### ✅ Opción 2: Crear Mapper Manualmente (Recomendada)

1. **Ir a Clients:**
   - Menú lateral → **Clients**
   - Click en tu cliente (ejemplo: `my-client`)

2. **Ir a Client Scopes:**
   - Tab **"Client scopes"**
   - Click en **"Dedicated"** (o `my-client-dedicated`)

3. **Añadir Mapper:**
   - Tab **"Mappers"**
   - Click **"Add mapper"** → **"By configuration"**

4. **Seleccionar "User Realm Role":**
   - Click en **"User Realm Role"**

5. **Configurar el Mapper:**
   ```
   Name:                realm-roles
   Token Claim Name:    roles
   Claim JSON Type:     String
   Add to ID token:     ON
   Add to access token: ON
   Add to userinfo:     ON
   ```

6. **Save**

✅ **Resultado:** Los roles se incluirán en el token bajo la propiedad `roles: ["user", "admin"]`

---

### Otras Opciones (Alternativas)

#### Opción 1: Usar Client Scope por Defecto

1. **Ir a Client Scopes:**
   - Menú lateral → **Client Scopes**
   - Click en **"roles"**

2. **Verificar Mappers:**
   - Tab **"Mappers"**
   - Deberías ver mappers preconfigurados como:
     - `realm roles`
     - `client roles`

3. **Añadir al Cliente:**
   - Volver a **Clients** → tu cliente
   - Tab **"Client scopes"**
   - **"Add client scope"**
   - Seleccionar **"roles"**
   - Tipo: **Default**

#### Opción 3: Verificar Token Inspector

Si ya configuraste roles y quieres verificar que estén en el token:

1. **Obtener un token:**
   - Hacer login en tu aplicación
   - Copiar el `access_token` desde DevTools

2. **Inspeccionar en Keycloak:**
   - Ir a **Realm Settings** → **Sessions**
   - Buscar tu sesión activa
   - Click en **"Show token"**
   - Verificar que aparezcan los roles

---

## 🔍 Verificar Tokens

### Paso 5: Probar que los Roles están en el Token

#### Método 1: Desde la Aplicación

1. **Hacer login** en tu frontend (puerto 5173)

2. **Abrir DevTools** (F12)

3. **Ir a Application → Local Storage**

4. **Copiar `accessToken`**

5. **Decodificar en [jwt.io](https://jwt.io)**

**Token esperado:**
```json
{
  "sub": "1234567890",
  "email": "admin@example.com",
  "provider": "keycloak",
  "roles": ["admin", "user"],
  "iat": 1766125306,
  "exp": 1766128906
}
```

✅ **Si ves el array `roles`**, la configuración es correcta.

#### Método 2: Endpoint `/auth/me`

```bash
# Obtener token
TOKEN="tu_access_token_aqui"

# Llamar al endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/auth/me
```

**Respuesta esperada:**
```json
{
  "user": {
    "id": 3,
    "email": "admin@example.com",
    "username": "admin",
    "provider": "keycloak",
    "displayName": "Admin User",
    "pictureUrl": null,
    "roles": ["admin", "user"]
  }
}
```

---

## 🔧 Integración con Backend

### Paso 6: Extraer Roles del Token de Keycloak

El backend ya está configurado para extraer roles automáticamente:

**Archivo: `backend/src/config/passport.js`**

```javascript
// Keycloak Strategy
passport.use('keycloak', new OAuth2Strategy({
  // ... config
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Decodificar token para extraer roles
    const base64Url = accessToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const tokenPayload = JSON.parse(Buffer.from(base64, 'base64').toString());

    // Extraer roles (soporta ambos formatos)
    let roles = [];
    if (tokenPayload.realm_access && tokenPayload.realm_access.roles) {
      roles = tokenPayload.realm_access.roles;
    } else if (tokenPayload.roles) {
      roles = tokenPayload.roles;
    }

    // Filtrar solo nuestros roles personalizados
    const customRoles = roles.filter(role => ['user', 'admin'].includes(role));

    // Guardar roles en la base de datos
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP, roles = $1 WHERE id = $2',
      [customRoles, userId]
    );
  }
}));
```

### Paso 7: Incluir Roles en JWT Propio

**Archivo: `backend/src/middleware/auth.js`**

```javascript
export function generateTokens(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    provider: user.provider,
    roles: user.roles || [], // ✅ Incluir roles en el payload
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });

  return { accessToken, refreshToken };
}
```

### Paso 8: Verificar Roles en Microservicios

**Archivo: `backend-tournament/src/middleware/auth.js`** (igual en player service)

```javascript
// Middleware para verificar autenticación
export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // ✅ Incluye roles
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Middleware para verificar rol admin
export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Se requiere rol de administrador'
    });
  }
  next();
}
```

### Paso 9: Usar Middleware en Rutas

**Archivo: `backend-tournament/src/routes/tournament.routes.js`**

```javascript
import { requireAuth, requireAdmin } from '../middleware/auth.js';

// ✅ Todos los usuarios autenticados
router.get('/tournaments', requireAuth, async (req, res) => {
  // Lógica para listar torneos
});

// ❌ Solo administradores
router.post('/tournaments', requireAuth, requireAdmin, async (req, res) => {
  // Lógica para crear torneo
});
```

---

## 🎨 Integración con Frontend

### Paso 10: Mostrar UI Según Roles

#### Frontend Usuario - Dashboard

**Archivo: `frontend/src/components/Dashboard.jsx`**

```javascript
// Botón visible solo para admins
{user?.roles?.includes('admin') && (
  <a href="http://localhost:5174" className="bg-purple-600...">
    <svg>...</svg>
    Panel Admin
  </a>
)}
```

#### Frontend Admin - Verificación de Acceso

**Archivo: `frontend-admin/src/components/AdminDashboard.jsx`**

```javascript
const loadUser = async () => {
  try {
    const response = await authService.getCurrentUser();
    const userData = response.data.user;
    setUser(userData);

    // ✅ Verificar rol admin
    if (!userData.roles || !userData.roles.includes('admin')) {
      setIsAdmin(false); // Mostrar "Acceso Denegado"
    } else {
      setIsAdmin(true);
      loadData(); // Cargar datos del dashboard
    }
  }
};

// Si no es admin
if (!isAdmin) {
  return (
    <div>
      <h2>⛔ Acceso Denegado</h2>
      <p>No tienes permisos de administrador</p>
      <button onClick={() => window.location.href = 'http://localhost:5173'}>
        Volver al Portal de Usuario
      </button>
    </div>
  );
}
```

---

## 🧪 Probar la Configuración

### Escenario 1: Usuario Normal

```bash
# Login como testuser (solo rol 'user')
1. http://localhost:5173
2. Login con Keycloak → testuser / Test123!
3. Dashboard carga correctamente
4. ❌ NO ve botón "Panel Admin"
5. Puede ver torneos y jugadores (GET)
6. ❌ NO puede crear/editar torneos (POST/PUT devuelve 403)
```

### Escenario 2: Usuario Admin

```bash
# Login como admin (roles 'user' y 'admin')
1. http://localhost:5173
2. Login con Keycloak → admin / Admin123!
3. Dashboard carga correctamente
4. ✅ VE botón "Panel Admin"
5. Click en "Panel Admin" → Abre http://localhost:5174
6. ✅ AUTO-LOGIN vía SSO (no pide credenciales)
7. ✅ Dashboard Admin carga con estadísticas
8. ✅ Puede crear/editar torneos y jugadores
```

### Escenario 3: Usuario Normal Intenta Acceder al Admin

```bash
# Intentar acceso directo sin permisos
1. Login como testuser en http://localhost:5173
2. Abrir manualmente http://localhost:5174
3. ✅ AUTO-LOGIN vía SSO
4. ⛔ Mensaje "Acceso Denegado"
5. Botón "Volver al Portal de Usuario"
```

---

## ❓ Troubleshooting

### Problema 1: No veo roles en el token

**Síntoma:**
```json
{
  "sub": "1234",
  "email": "admin@example.com",
  "roles": []
}
```

**Solución:**
1. Verificar que los roles estén asignados al usuario en Keycloak
2. Verificar que el mapper esté configurado en el client scope
3. Hacer logout completo y volver a hacer login
4. Limpiar localStorage del navegador

---

### Problema 2: Token tiene `realm_access.roles` en lugar de `roles`

**Síntoma:**
```json
{
  "realm_access": {
    "roles": ["admin", "user"]
  }
}
```

**Solución:**
El backend ya soporta ambos formatos. Si quieres el formato plano:
1. Ir al mapper en Keycloak
2. Cambiar **Token Claim Name** de `realm_access.roles` a `roles`
3. Save y volver a hacer login

---

### Problema 3: Frontend muestra botón admin pero backend devuelve 403

**Síntoma:**
- Ves el botón "Panel Admin"
- Al intentar crear un torneo → Error 403

**Solución:**
1. Verificar que el JWT tenga los roles:
   ```javascript
   // En DevTools Console
   const token = localStorage.getItem('accessToken');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log(payload.roles); // Debe mostrar ["admin", "user"]
   ```

2. Si no tiene roles, hacer refresh del token:
   ```javascript
   // Logout y volver a hacer login
   ```

---

### Problema 4: Roles no se guardan en base de datos

**Síntoma:**
- Keycloak devuelve roles
- Pero `users.roles` en PostgreSQL está vacío

**Solución:**
Verificar que la columna `roles` exista:
```bash
docker exec security-postgres psql -U postgres -d security_db -c "\d users"
```

Si no existe:
```bash
docker exec security-postgres psql -U postgres -d security_db -c "ALTER TABLE users ADD COLUMN roles TEXT[] DEFAULT '{}';"
```

---

### Problema 5: Usuario tiene rol admin pero no puede acceder

**Solución:**
Verificar el middleware:
```javascript
// backend-tournament/src/middleware/auth.js

// Debe ser exactamente así:
if (!req.user.roles.includes('admin')) {
  return res.status(403).json({ error: 'Acceso denegado' });
}
```

---

## 📊 Resumen del Flujo

```
┌──────────────────────────────────────────────────────────────┐
│                     FLUJO DE ROLES                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Usuario → Login con Keycloak                            │
│                                                              │
│  2. Keycloak → Verifica credenciales                         │
│                                                              │
│  3. Keycloak → Busca roles del usuario                       │
│                realm_access.roles = ["admin", "user"]        │
│                                                              │
│  4. Keycloak → Genera access_token con roles incluidos       │
│                                                              │
│  5. Auth Service → Recibe callback de Keycloak               │
│                  → Decodifica access_token                   │
│                  → Extrae roles del payload                  │
│                  → Guarda roles en PostgreSQL                │
│                                                              │
│  6. Auth Service → Genera JWT propio                         │
│                  → Incluye roles en payload                  │
│                  → Devuelve JWT al frontend                  │
│                                                              │
│  7. Frontend → Guarda JWT en localStorage                    │
│              → Envía JWT en header Authorization             │
│                                                              │
│  8. Microservicio → Recibe request con JWT                   │
│                   → Verifica firma del JWT                   │
│                   → Extrae payload (incluye roles)           │
│                   → req.user = { sub, email, roles }         │
│                                                              │
│  9. Middleware requireAuth → Verifica que JWT sea válido     │
│                                                              │
│  10. Middleware requireAdmin → Verifica 'admin' en roles     │
│                                                              │
│  11. Ruta → Ejecuta lógica solo si pasó todos los checks     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist Final

- [x] Roles `user` y `admin` creados en Keycloak
- [x] Roles asignados a usuarios (testuser: user, admin: user+admin)
- [x] Client mapper configurado para incluir roles en token
- [x] Backend extrae roles de Keycloak access token
- [x] Backend incluye roles en JWT propio
- [x] Middleware `requireAuth` verifica JWT
- [x] Middleware `requireAdmin` verifica rol admin
- [x] Frontend Usuario muestra botón admin solo si tiene rol
- [x] Frontend Admin verifica rol y muestra "Acceso Denegado" si no es admin
- [x] Microservicios verifican roles en cada endpoint protegido
- [x] SSO funciona entre portales manteniendo roles

---

## 📚 Documentos Relacionados

- [Arquitectura de Microservicios](./MICROSERVICES.md)
- [Configuración de Keycloak](./KEYCLOAK-SETUP.md)
- [Single Sign-On (SSO)](./SSO.md)
- [API Documentation](./API.md)

---

## 🎉 ¡Listo!

Tu sistema ahora tiene **Role-Based Access Control (RBAC)** completamente funcional con Keycloak, SSO entre portales, y verificación de roles en backend y frontend.

**Usuarios pueden:**
- Ver recursos (torneos, jugadores)

**Administradores pueden:**
- Todo lo que pueden los usuarios
- Crear, editar y eliminar recursos
- Acceder al Panel Admin (puerto 5174)

**Seguridad:**
- ✅ Roles verificados en backend (cada microservicio)
- ✅ Roles verificados en frontend (UI adaptada)
- ✅ JWT stateless con roles incluidos
- ✅ SSO mantiene roles entre portales
- ✅ Auditoría de todas las autenticaciones
