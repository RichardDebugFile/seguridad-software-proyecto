# 🔑 Configuración de Keycloak

Guía completa para configurar Keycloak como proveedor de identidad (IdP) en el proyecto.

---

## 📋 Prerequisitos

- Docker y Docker Compose instalados
- Keycloak corriendo (iniciado con `docker-compose up -d`)

---

## 🚀 Configuración Inicial

### 1. Verificar que Keycloak esté Corriendo

```bash
# Verificar contenedores
docker ps

# Deberías ver:
# - security-keycloak (puerto 8090)
# - keycloak-db
```

Si no está corriendo:
```bash
docker-compose up -d
```

Espera 1-2 minutos para que Keycloak se inicie completamente.

### 2. Acceder a la Consola de Administración

1. Abre tu navegador en: http://localhost:8090/admin
2. Ingresa las credenciales de admin:
   - **Username**: `admin`
   - **Password**: `admin123`

Si no puedes acceder, verifica los logs:
```bash
docker-compose logs keycloak
```

---

## 🏗️ Configuración del Realm

### 1. Crear el Realm "tournament"

1. En la consola de Keycloak, haz clic en el dropdown **"master"** (esquina superior izquierda)
2. Haz clic en **"Create Realm"**
3. Completa:
   - **Realm name**: `tournament`
   - **Enabled**: ON (debe estar activado)
4. Haz clic en **"Create"**

**Resultado:** Ahora estás en el realm "tournament". El dropdown debería mostrar "tournament".

---

## 🔧 Configuración del Cliente

### 1. Crear el Cliente "tournament-system"

1. En el menú lateral, haz clic en **"Clients"**
2. Haz clic en **"Create client"**
3. **General Settings:**
   - **Client type**: `OpenID Connect` (por defecto)
   - **Client ID**: `tournament-system`
4. Haz clic en **"Next"**

### 2. Configurar Capacidades del Cliente

**Capability config:**
- **Client authentication**: **ON** ⚠️ MUY IMPORTANTE
- **Authorization**: OFF (déjalo apagado)
- **Authentication flow:**
  - ✅ **Standard flow**: ON (Enabled)
  - ✅ **Direct access grants**: ON (Enabled)
  - ❌ Implicit flow: OFF
  - ❌ OAuth 2.0 Device Authorization Grant: OFF
  - ❌ OIDC CIBA Grant: OFF

Haz clic en **"Next"**

### 3. Configurar URIs

**Login settings:**
- **Root URL**: Dejar vacío
- **Home URL**: Dejar vacío
- **Valid redirect URIs**:
  ```
  http://localhost:3000/auth/keycloak/callback
  ```
- **Valid post logout redirect URIs**:
  ```
  http://localhost:5173
  ```
- **Web origins**: `+` (esto permite todos los orígenes de redirect URIs)

**Haz clic en "Save"**

### 4. Obtener el Client Secret

1. Después de guardar, ve a la pestaña **"Credentials"**
2. Verás el **Client secret**
3. Haz clic en el icono de **copiar** (📋) al lado del secret
4. **Guárdalo temporalmente** - lo necesitarás en el siguiente paso

**Ejemplo de Client Secret:**
```
GAd1f9lOsvuPfC32N0bn1k6WuebeXzja
```

### 5. Configurar en el Proyecto

1. Abre `backend/.env`
2. Actualiza:
   ```bash
   KEYCLOAK_CLIENT_SECRET=tu-client-secret-aqui
   ```

3. Guarda el archivo
4. Reinicia el backend:
   ```bash
   cd backend
   # Detén el proceso actual (Ctrl+C)
   npm run dev
   ```

---

## 👤 Crear Usuarios

### 1. Crear un Usuario de Prueba

1. En el menú lateral, haz clic en **"Users"**
2. Haz clic en **"Add user"**
3. Completa el formulario:
   - **Username**: `testuser` (requerido)
   - **Email**: `testuser@tournament.com`
   - **Email verified**: **ON** ⚠️ IMPORTANTE (actívalo)
   - **First name**: `Test`
   - **Last name**: `User`
   - **Enabled**: ON (debe estar activado)
4. Haz clic en **"Create"**

### 2. Establecer Contraseña

1. Después de crear el usuario, ve a la pestaña **"Credentials"**
2. Haz clic en **"Set password"**
3. Completa:
   - **Password**: `Test123!` (o la que prefieras)
   - **Password confirmation**: `Test123!`
   - **Temporary**: **OFF** ⚠️ MUY IMPORTANTE (desactívalo)
     - Si dejas esto en ON, Keycloak pedirá cambiar la contraseña en el primer login
4. Haz clic en **"Save"**
5. Confirma en el diálogo que aparece

**Credenciales del usuario:**
```
Username: testuser
Password: Test123!
Email: testuser@tournament.com
```

### 3. Crear Más Usuarios (Opcional)

Repite los pasos anteriores para crear más usuarios de prueba:

**Usuario Administrador:**
```
Username: admin
Password: Admin123!
Email: admin@tournament.com
First name: Admin
Last name: User
```

**Usuario Regular:**
```
Username: user1
Password: User123!
Email: user1@tournament.com
First name: John
Last name: Doe
```

---

## ✅ Probar la Configuración

### 1. Verificar Backend

Asegúrate que el backend esté corriendo con el nuevo client secret:

```bash
cd backend
npm run dev

# Deberías ver:
# 🔑 Keycloak: Configurado
```

### 2. Probar Login con Keycloak

1. Abre http://localhost:5173
2. Haz clic en el botón **"Keycloak"** (botón morado)
3. Serás redirigido a Keycloak
4. Ingresa:
   - **Username or email**: `testuser`
   - **Password**: `Test123!`
5. Haz clic en **"Sign In"**
6. Si es la primera vez, puede pedir que actualices tu información de perfil
7. Deberías ser redirigido al Dashboard

**En el Dashboard verás:**
- Email: testuser@tournament.com
- Username: testuser
- Provider: keycloak (badge morado)
- Display Name: Test User

---

## 🔐 Configuración Avanzada (Opcional)

### Roles y Permisos

#### 1. Crear Roles

1. En el menú lateral, haz clic en **"Realm roles"**
2. Haz clic en **"Create role"**
3. Completa:
   - **Role name**: `admin` (o `user`, `moderator`, etc.)
   - **Description**: Descripción del rol
4. Haz clic en **"Save"**

#### 2. Asignar Roles a Usuarios

1. **Users** → Selecciona un usuario
2. Ve a la pestaña **"Role mapping"**
3. Haz clic en **"Assign role"**
4. Selecciona los roles que quieres asignar
5. Haz clic en **"Assign"**

### Personalizar Tema

1. En el menú lateral, haz clic en **"Realm settings"**
2. Ve a la pestaña **"Themes"**
3. Personaliza:
   - **Login theme**: Tema de la página de login
   - **Account theme**: Tema de la página de cuenta
   - **Email theme**: Tema de emails
4. Haz clic en **"Save"**

### Habilitar Registro de Usuarios

Si quieres permitir que usuarios se registren:

1. **Realm settings** → pestaña **"Login"**
2. Activa **"User registration"**
3. Haz clic en **"Save"**

Ahora en la página de login de Keycloak aparecerá un link "Register".

---

## 🐛 Solución de Problemas

### Error: "Invalid client credentials"

**Causa:** El Client Secret no coincide.

**Solución:**
1. Ve a Keycloak Admin → Clients → tournament-system → Credentials
2. Haz clic en **"Regenerate"** si es necesario
3. Copia el nuevo secret
4. Actualiza `KEYCLOAK_CLIENT_SECRET` en `backend/.env`
5. Reinicia el backend

### Error: "Invalid redirect URI"

**Causa:** La URI de callback no está configurada correctamente.

**Solución:**
1. Ve a Clients → tournament-system
2. Verifica que en **"Valid redirect URIs"** exista:
   ```
   http://localhost:3000/auth/keycloak/callback
   ```
3. Asegúrate de que no haya espacios extra
4. Haz clic en **"Save"**

### Error: "Account is disabled"

**Causa:** El usuario está deshabilitado.

**Solución:**
1. Ve a Users → Selecciona el usuario
2. Verifica que **"Enabled"** esté en ON
3. Haz clic en **"Save"**

### Error: "Invalid username or password"

**Causa:** Credenciales incorrectas o contraseña temporal.

**Solución:**
1. Verifica el username y password
2. Ve a Users → usuario → Credentials
3. Haz clic en **"Reset password"**
4. Establece nueva contraseña
5. **DESACTIVA "Temporary"**
6. Haz clic en **"Save"**

### Error: "Email not verified"

**Causa:** El email del usuario no está verificado.

**Solución:**
1. Ve a Users → Selecciona el usuario
2. Activa **"Email verified"**
3. Haz clic en **"Save"**

---

## 🔒 Seguridad en Producción

### 1. Cambiar Contraseña de Admin

**IMPORTANTE:** La contraseña `admin123` es solo para desarrollo.

```bash
# Entrar al contenedor de Keycloak
docker exec -it security-keycloak bash

# Dentro del contenedor
/opt/keycloak/bin/kc.sh set-admin-password --new-password 'tu-nueva-contraseña-segura'

# Salir
exit
```

### 2. Usar HTTPS

En producción, SIEMPRE usa HTTPS:

**En docker-compose.yml:**
```yaml
keycloak:
  environment:
    - KC_HTTPS_ENABLED=true
    - KC_HOSTNAME_STRICT_HTTPS=true
```

**En backend/.env:**
```bash
KEYCLOAK_AUTH_SERVER_URL=https://keycloak.tu-dominio.com
KEYCLOAK_CALLBACK_URL=https://tu-app.com/auth/keycloak/callback
```

### 3. Configurar Base de Datos Externa

En producción, usa PostgreSQL dedicado en lugar del contenedor:

**En docker-compose.yml:**
```yaml
keycloak:
  environment:
    - KC_DB=postgres
    - KC_DB_URL=jdbc:postgresql://tu-db-server:5432/keycloak
    - KC_DB_USERNAME=keycloak_user
    - KC_DB_PASSWORD=${DB_PASSWORD}  # Usar variable de entorno
```

### 4. Habilitar Logging y Monitoreo

1. **Realm settings** → **Events**
2. Activa **"Login events"** y **"Admin events"**
3. Configura listeners para enviar eventos a tu sistema de monitoreo

---

## 📊 Verificar Logs de Auditoría

### En Keycloak

1. **Realm settings** → pestaña **"Events"**
2. Activa **"Save events"**
3. Ve a **"Login events"** para ver intentos de login
4. Ve a **"Admin events"** para ver cambios de configuración

### En la Base de Datos

```bash
# Conectar a PostgreSQL
docker exec -it security-postgres psql -U postgres -d security_db

# Ver logs de autenticación de Keycloak
SELECT
  username,
  provider,
  action,
  success,
  ip_address,
  created_at
FROM audit_logs
WHERE provider = 'keycloak'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📚 Recursos Adicionales

- [Documentación Oficial de Keycloak](https://www.keycloak.org/documentation)
- [Keycloak Getting Started](https://www.keycloak.org/getting-started)
- [Keycloak Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/)
- [OAuth 2.0 y OpenID Connect](https://oauth.net/2/)

---

## ✅ Checklist Final

- [ ] Keycloak corriendo en puerto 8090
- [ ] Acceso a admin console con admin/admin123
- [ ] Realm "tournament" creado
- [ ] Cliente "tournament-system" configurado
- [ ] Client authentication: ON
- [ ] Redirect URI configurada correctamente
- [ ] Client Secret copiado a `.env`
- [ ] Usuario de prueba creado
- [ ] Contraseña establecida (Temporary: OFF)
- [ ] Email verified: ON
- [ ] Backend reiniciado
- [ ] Login con Keycloak probado y funcionando

¡Listo! Keycloak está configurado correctamente. 🎉

---

## 🔄 Single Sign-On (SSO)

### ¿Qué es SSO?

**Single Sign-On** permite que los usuarios se autentiquen UNA vez en Keycloak y luego accedan a múltiples aplicaciones sin tener que ingresar credenciales nuevamente.

### Cómo Funciona en Este Proyecto

Este proyecto implementa **SSO con Keycloak** con las siguientes características:

#### 1️⃣ Login Normal (SSO Habilitado)

**Ruta del backend:** `GET /auth/keycloak`

**Comportamiento:**
- Si el usuario **ya tiene una sesión SSO activa en Keycloak**, se autentica automáticamente **SIN pedir credenciales** ⚡
- Si NO hay sesión SSO, muestra la pantalla de login de Keycloak

**Ejemplo de uso:**
1. Usuario hace login con Keycloak (ingresa credenciales)
2. Usuario hace logout de nuestra app (pero NO cierra sesión en Keycloak)
3. Usuario hace clic en "Keycloak" nuevamente
4. **Auto-login** → No pide credenciales porque la sesión SSO está activa

#### 2️⃣ Cambiar Usuario (Forzar Login)

**Ruta del backend:** `GET /auth/keycloak/switch-user`

**Comportamiento:**
- **SIEMPRE** muestra la pantalla de login de Keycloak
- Permite cambiar a otro usuario
- Usa el parámetro `prompt=login` de OpenID Connect

**Uso en la interfaz:**
- Botón **"Cambiar Usuario"** (morado) en el Dashboard
- Solo visible cuando estás autenticado con Keycloak

**Ejemplo de uso:**
1. Usuario está logueado con `testuser`
2. Hace clic en "Cambiar Usuario"
3. Keycloak muestra pantalla de login
4. Usuario ingresa credenciales de `admin`
5. Dashboard ahora muestra datos de `admin`

#### 3️⃣ Logout Completo (Cierra SSO)

**Ruta del backend:** `POST /auth/logout`

**Comportamiento para usuarios de Keycloak:**
1. Backend revoca los tokens JWT locales
2. Backend devuelve `keycloakLogoutUrl`
3. Frontend redirige a Keycloak logout endpoint
4. Keycloak **cierra la sesión SSO**
5. Keycloak redirige de vuelta al frontend
6. Próximo login pedirá credenciales

**URL de logout de Keycloak:**
```
http://localhost:8090/realms/tournament/protocol/openid-connect/logout?post_logout_redirect_uri=http://localhost:5173&client_id=tournament-system
```

**Comportamiento para Google/Local:**
- Solo cierra sesión local (revoca tokens)
- No hay SSO que cerrar

---

### Configuración Necesaria para SSO Logout

Para que el logout de Keycloak funcione correctamente, asegúrate de tener configurado:

**En Keycloak Admin Console:**

1. Ve a **Clients** → **tournament-system**
2. En **"Valid redirect URIs"**, agrega:
   ```
   http://localhost:5173/*
   http://localhost:5173
   ```
3. Haz clic en **"Save"**

Esto permite que Keycloak redirija al frontend después del logout.

---

### Flujos Completos de SSO

#### Flujo 1: Primera Autenticación
```
Usuario → Click "Keycloak"
       → Keycloak muestra login
       → Usuario ingresa credenciales (testuser/Test123!)
       → Keycloak crea sesión SSO
       → Redirige a nuestra app con tokens
       → Dashboard
```

#### Flujo 2: SSO Auto-Login
```
Usuario → Logout de nuestra app (SSO sigue activo en Keycloak)
       → Click "Keycloak" nuevamente
       → Keycloak detecta sesión SSO activa
       → Auto-login ⚡ (sin pedir credenciales)
       → Dashboard
```

#### Flujo 3: Cambiar Usuario
```
Dashboard → Click "Cambiar Usuario" (botón morado)
         → Limpia tokens locales
         → Redirige a /auth/keycloak/switch-user
         → Keycloak muestra login (ignora SSO con prompt=login)
         → Usuario ingresa otras credenciales (admin/Admin123!)
         → Dashboard con nuevo usuario
```

#### Flujo 4: Logout Completo
```
Dashboard → Click "Cerrar Sesión" (botón rojo)
         → Backend revoca tokens
         → Backend devuelve keycloakLogoutUrl
         → Frontend redirige a Keycloak logout
         → Keycloak cierra sesión SSO
         → Keycloak redirige a http://localhost:5173
         → Pantalla de login
         → Próximo login pedirá credenciales
```

---

### Comparación: SSO vs Sin SSO

| Característica | Con SSO (Keycloak) | Sin SSO (Google/Local) |
|----------------|-------------------|----------------------|
| **Login después de logout local** | Auto-login ⚡ | Pide credenciales |
| **Cambiar usuario** | Botón "Cambiar Usuario" | Logout + Login con otro |
| **Logout completo** | Cierra SSO en Keycloak | Solo local |
| **Sesión compartida** | Sí (entre apps que usen Keycloak) | No |

---

### Probar SSO

#### Prueba 1: Auto-Login con SSO

1. Inicia sesión con Keycloak (`testuser/Test123!`)
2. Haz clic en **"Cerrar Sesión"**
   - **IMPORTANTE:** Esto NO cierra la sesión SSO si no completa el logout
3. Haz clic en **"Keycloak"** nuevamente
4. **Resultado:** Auto-login (no pide credenciales)

#### Prueba 2: Cambiar Usuario

1. Estás logueado con `testuser`
2. Haz clic en **"Cambiar Usuario"** (botón morado)
3. Keycloak muestra pantalla de login
4. Ingresa credenciales de otro usuario (`admin/Admin123!`)
5. **Resultado:** Dashboard muestra el nuevo usuario

#### Prueba 3: Logout Completo

1. Estás logueado con Keycloak
2. Haz clic en **"Cerrar Sesión"** (botón rojo)
3. Serás redirigido a Keycloak logout
4. Keycloak te redirige de vuelta a http://localhost:5173
5. Haz clic en **"Keycloak"** nuevamente
6. **Resultado:** Keycloak pide credenciales (SSO cerrado)

---

### Código de Implementación

#### Backend - Estrategia con Soporte SSO

```javascript
// backend/src/config/passport.js
class KeycloakOAuth2Strategy extends OAuth2Strategy {
  authorizationParams(options) {
    const params = super.authorizationParams(options);
    // Permite pasar prompt=login dinámicamente
    if (options.prompt) {
      params.prompt = options.prompt;
    }
    return params;
  }
}
```

#### Backend - Rutas SSO

```javascript
// backend/src/routes/auth.routes.js

// SSO Login (usa sesión existente)
router.get('/keycloak',
  passport.authenticate('keycloak', {
    scope: ['openid', 'profile', 'email']
  })
);

// Cambiar Usuario (fuerza login)
router.get('/keycloak/switch-user',
  passport.authenticate('keycloak', {
    scope: ['openid', 'profile', 'email'],
    prompt: 'login' // ← Fuerza pantalla de login
  })
);

// Logout con SSO
router.post('/logout',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    // Revoca tokens locales
    await revokeRefreshToken(req.body.refreshToken);

    // Si es usuario Keycloak, devuelve URL de logout SSO
    if (req.user.provider === 'keycloak') {
      const keycloakLogoutUrl = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/logout?post_logout_redirect_uri=${FRONTEND_URL}&client_id=${CLIENT_ID}`;
      return res.json({ keycloakLogoutUrl });
    }

    res.json({ message: 'Logout exitoso' });
  }
);
```

#### Frontend - Servicios SSO

```javascript
// frontend/src/utils/api.js

export const authService = {
  // SSO Login
  keycloakLogin: () => {
    window.location.href = `${API_URL}/auth/keycloak`;
  },

  // Cambiar Usuario
  keycloakSwitchUser: () => {
    window.location.href = `${API_URL}/auth/keycloak/switch-user`;
  },

  // Logout con SSO
  logout: () => {
    return api.post('/auth/logout', {
      refreshToken: localStorage.getItem('refreshToken')
    });
  }
};
```

#### Frontend - Dashboard con Botones SSO

```jsx
// frontend/src/components/Dashboard.jsx

const handleLogout = async () => {
  const response = await authService.logout();
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');

  // Si Keycloak, redirige a logout SSO
  if (response.data.keycloakLogoutUrl) {
    window.location.href = response.data.keycloakLogoutUrl;
  } else {
    navigate('/login');
  }
};

const handleSwitchUser = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  authService.keycloakSwitchUser();
};

// Botón Cambiar Usuario (solo para Keycloak)
{user?.provider === 'keycloak' && (
  <button onClick={handleSwitchUser} className="bg-purple-600">
    Cambiar Usuario
  </button>
)}
```

---

### Ventajas del SSO

✅ **Experiencia de Usuario Mejorada**
- Login rápido sin tener que ingresar credenciales repetidamente

✅ **Gestión Centralizada**
- Todas las sesiones se gestionan desde Keycloak
- Fácil de auditar y monitorear

✅ **Seguridad Mejorada**
- Un solo punto de autenticación
- Políticas de seguridad centralizadas
- Fácil de revocar acceso a todas las apps

✅ **Flexibilidad**
- Permite cambiar de usuario cuando sea necesario
- Logout completo cuando se requiere

---

### Desventajas del SSO

❌ **Dependencia del Servidor SSO**
- Si Keycloak cae, no se puede autenticar

❌ **Complejidad Inicial**
- Configuración más compleja que auth local

❌ **Sesiones Persistentes**
- Puede ser confuso para usuarios que esperan logout completo

---

### Mejores Prácticas

1. **Timeout de Sesión**
   - Configura timeouts razonables en Keycloak
   - Realm settings → Tokens → SSO Session Idle/Max

2. **Logging y Auditoría**
   - Activa eventos de login en Keycloak
   - Monitorea sesiones SSO activas

3. **Comunicar al Usuario**
   - Indica claramente cuando hay SSO activo
   - Muestra badge "Keycloak" en el Dashboard

4. **Testing**
   - Prueba todos los flujos (login, logout, cambiar usuario)
   - Verifica que el logout cierre SSO correctamente

---

¡SSO con Keycloak está completamente configurado! 🎉
