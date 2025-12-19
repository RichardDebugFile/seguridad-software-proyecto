# 🔄 Single Sign-On (SSO) con Keycloak

Guía completa sobre la implementación de Single Sign-On en el proyecto.

---

## 📖 ¿Qué es SSO?

**Single Sign-On (SSO)** es un mecanismo de autenticación que permite a los usuarios autenticarse UNA sola vez y obtener acceso a múltiples aplicaciones sin necesidad de volver a ingresar credenciales.

### Beneficios

✅ **Experiencia de Usuario Mejorada** - Login una vez, acceso a todas las apps
✅ **Seguridad Centralizada** - Un solo punto de autenticación y políticas
✅ **Gestión Simplificada** - Control centralizado de usuarios y permisos
✅ **Auditoría Mejorada** - Monitoreo desde un único lugar

---

## 🎯 SSO en Este Proyecto

### Implementación

Este proyecto implementa SSO utilizando **Keycloak** como proveedor de identidad (Identity Provider - IdP).

**Protocolo utilizado:** OpenID Connect (OIDC) sobre OAuth 2.0

### Tres Modos de Operación

#### 1️⃣ Login Normal (SSO Habilitado)

**Endpoint:** `GET /auth/keycloak`

**Comportamiento:**
- Si existe una sesión SSO activa en Keycloak → **Auto-login** ⚡
- Si NO existe sesión SSO → Muestra pantalla de login

**Flujo:**
```
Usuario → Click "Keycloak" en frontend
       → Backend redirige a Keycloak
       → Keycloak detecta sesión SSO activa
       → Keycloak auto-autentica sin pedir credenciales
       → Redirige a /auth/keycloak/callback con código
       → Backend intercambia código por tokens
       → Backend genera JWT tokens
       → Frontend guarda tokens en localStorage
       → Dashboard
```

**Código:**
```javascript
// backend/src/routes/auth.routes.js
router.get('/keycloak',
  passport.authenticate('keycloak', {
    scope: ['openid', 'profile', 'email']
  })
);
```

---

#### 2️⃣ Cambiar Usuario (Forzar Login)

**Endpoint:** `GET /auth/keycloak/switch-user`

**Comportamiento:**
- **SIEMPRE** muestra pantalla de login
- Ignora sesión SSO existente
- Permite autenticarse con otro usuario

**Parámetro clave:** `prompt=login`

**Flujo:**
```
Usuario → Click "Cambiar Usuario" (botón morado)
       → Frontend limpia tokens locales
       → Frontend redirige a /auth/keycloak/switch-user
       → Backend redirige a Keycloak con prompt=login
       → Keycloak IGNORA sesión SSO
       → Keycloak muestra pantalla de login
       → Usuario ingresa credenciales de otro usuario
       → Resto del flujo OAuth2 normal
       → Dashboard con nuevo usuario
```

**Código:**
```javascript
// backend/src/routes/auth.routes.js
router.get('/keycloak/switch-user',
  passport.authenticate('keycloak', {
    scope: ['openid', 'profile', 'email'],
    prompt: 'login' // ← Fuerza login
  })
);
```

**Frontend:**
```jsx
// frontend/src/components/Dashboard.jsx
const handleSwitchUser = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  authService.keycloakSwitchUser();
};

// Botón visible solo para usuarios Keycloak
{user?.provider === 'keycloak' && (
  <button onClick={handleSwitchUser}>
    Cambiar Usuario
  </button>
)}
```

---

#### 3️⃣ Logout Completo (Cierra SSO)

**Endpoint:** `POST /auth/logout`

**Comportamiento para Keycloak:**
1. Revoca refresh tokens en la base de datos
2. Devuelve URL de logout de Keycloak
3. Frontend redirige a Keycloak logout
4. Keycloak cierra sesión SSO
5. Keycloak redirige de vuelta al frontend

**Comportamiento para Google/Local:**
- Solo revoca tokens locales
- No hay SSO que cerrar

**URL de logout:**
```
http://localhost:8090/realms/tournament/protocol/openid-connect/logout
  ?post_logout_redirect_uri=http://localhost:5173
  &client_id=tournament-system
```

**Código Backend:**
```javascript
// backend/src/routes/auth.routes.js
router.post('/logout',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    const { refreshToken } = req.body;

    // Revoca token local
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    // Si es Keycloak, devuelve URL de logout SSO
    if (req.user && req.user.provider === 'keycloak') {
      const keycloakLogoutUrl = `${process.env.KEYCLOAK_AUTH_SERVER_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(process.env.FRONTEND_URL)}&client_id=${process.env.KEYCLOAK_CLIENT_ID}`;

      return res.json({
        message: 'Logout exitoso',
        keycloakLogoutUrl
      });
    }

    res.json({ message: 'Logout exitoso' });
  }
);
```

**Código Frontend:**
```javascript
// frontend/src/components/Dashboard.jsx
const handleLogout = async () => {
  try {
    const response = await authService.logout();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Si Keycloak, redirige a logout SSO
    if (response.data.keycloakLogoutUrl) {
      window.location.href = response.data.keycloakLogoutUrl;
    } else {
      navigate('/login');
    }
  } catch (error) {
    console.error('Error logging out:', error);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  }
};
```

---

## 🔧 Implementación Técnica

### Estrategia Passport.js Personalizada

Para soportar SSO dinámico, extendemos `OAuth2Strategy`:

```javascript
// backend/src/config/passport.js
import { Strategy as OAuth2Strategy } from 'passport-oauth2';

class KeycloakOAuth2Strategy extends OAuth2Strategy {
  authorizationParams(options) {
    const params = super.authorizationParams(options);

    // Permite pasar prompt dinámicamente
    if (options.prompt) {
      params.prompt = options.prompt;
    }

    return params;
  }
}

passport.use('keycloak', new KeycloakOAuth2Strategy({
  authorizationURL: `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth`,
  tokenURL: `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
  clientID: KEYCLOAK_CLIENT_ID,
  clientSecret: KEYCLOAK_CLIENT_SECRET,
  callbackURL: KEYCLOAK_CALLBACK_URL,
  scope: ['openid', 'profile', 'email'],
}, async (accessToken, refreshToken, profile, done) => {
  // Callback para procesar usuario
  // ... (ver passport.js completo)
}));
```

### Configuración de Keycloak

**En Keycloak Admin Console:**

1. **Clients** → **tournament-system**
2. **Valid redirect URIs:**
   ```
   http://localhost:3000/auth/keycloak/callback
   http://localhost:5173/*
   http://localhost:5173
   ```
3. **Save**

Esto permite que Keycloak redirija tanto al callback de auth como al frontend después del logout.

---

## 📊 Comparación de Flujos

### Sin SSO (Google/Local)

```
Login  → Ingresa credenciales → Dashboard
Logout → Limpia tokens → Login
Login  → Ingresa credenciales NUEVAMENTE → Dashboard
```

### Con SSO (Keycloak - SSO Activo)

```
Login  → Ingresa credenciales → Dashboard
Logout → Limpia tokens locales → Login
Login  → AUTO-LOGIN ⚡ (sin credenciales) → Dashboard
```

### Con SSO + Logout Completo

```
Login  → Ingresa credenciales → Dashboard
Logout → Cierra SSO en Keycloak → Login
Login  → Ingresa credenciales → Dashboard
```

---

## 🧪 Casos de Uso

### Caso 1: Usuario Cambia de Dispositivo

**Sin SSO:**
- Dispositivo A: Login → Logout
- Dispositivo B: Debe ingresar credenciales

**Con SSO:**
- Dispositivo A: Login (crea sesión SSO)
- Dispositivo B: Auto-login si usa mismo navegador/cuenta

### Caso 2: Múltiples Aplicaciones

Si tienes varias aplicaciones que usan Keycloak:

**Sin SSO:**
- App 1: Login con credenciales
- App 2: Login con credenciales NUEVAMENTE
- App 3: Login con credenciales NUEVAMENTE

**Con SSO:**
- App 1: Login con credenciales
- App 2: Auto-login ⚡
- App 3: Auto-login ⚡

### Caso 3: Cambiar de Cuenta

**Problema:** Usuario quiere usar otra cuenta

**Solución:**
1. Click en "Cambiar Usuario" (botón morado)
2. Keycloak muestra login (`prompt=login`)
3. Ingresa credenciales de otra cuenta
4. Dashboard actualizado con nueva cuenta

---

## 🔒 Seguridad

### Tokens en SSO

**Keycloak maneja DOS tipos de sesiones:**

1. **Sesión SSO en Keycloak** (servidor)
   - Duración: Configurable en Keycloak
   - Almacenada en: Base de datos de Keycloak
   - Scope: Todas las apps que usen ese Keycloak

2. **JWT Tokens en nuestra app** (cliente)
   - Access Token: 1 hora
   - Refresh Token: 7 días
   - Almacenados en: localStorage
   - Scope: Solo nuestra aplicación

**Importante:** Hacer logout de nuestra app NO cierra la sesión SSO automáticamente (a menos que uses el logout completo de Keycloak).

### Mejores Prácticas

1. **Configurar Timeouts**
   ```
   Keycloak Admin → Realm Settings → Tokens
   - SSO Session Idle: 30 minutos
   - SSO Session Max: 10 horas
   ```

2. **Habilitar Eventos de Login**
   ```
   Keycloak Admin → Realm Settings → Events
   - Save events: ON
   - Login events: ON
   ```

3. **Monitorear Sesiones Activas**
   ```
   Keycloak Admin → Sessions
   Ver sesiones activas y revocar si es necesario
   ```

4. **Logout Completo en Producción**
   - Siempre implementa logout de Keycloak
   - Evita confusión del usuario

---

## 🐛 Troubleshooting

### Problema: Auto-login no funciona

**Posibles causas:**
1. No hay sesión SSO activa en Keycloak
2. Sesión SSO expiró (timeout)
3. Navegador bloqueando cookies de terceros

**Solución:**
1. Verificar que hiciste login recientemente
2. Revisar timeouts en Keycloak
3. Permitir cookies de `localhost:8090`

### Problema: No puedo cambiar de usuario

**Posibles causas:**
1. El parámetro `prompt=login` no se está pasando
2. Problema con la estrategia de Passport

**Solución:**
1. Verificar que la ruta `/keycloak/switch-user` tenga `prompt: 'login'`
2. Revisar logs del backend

### Problema: Logout no cierra SSO

**Posibles causas:**
1. No estás usando el endpoint de logout de Keycloak
2. URL de post-logout no configurada

**Solución:**
1. Verificar que `keycloakLogoutUrl` se devuelve del backend
2. Agregar URLs en "Valid redirect URIs" de Keycloak

### Problema: "Invalid redirect URI" en logout

**Solución:**
Agregar a Keycloak:
```
http://localhost:5173/*
http://localhost:5173
```

---

## 📈 Monitoreo y Auditoría

### Ver Sesiones SSO Activas

**En Keycloak:**
```
Keycloak Admin → Sessions
```

Aquí verás:
- Usuarios con sesiones activas
- Timestamp de inicio
- IPs conectadas
- Aplicaciones autenticadas

### Ver Logs de Autenticación

**En nuestra base de datos:**
```sql
SELECT
  u.email,
  a.provider,
  a.action,
  a.success,
  a.ip_address,
  a.created_at
FROM audit_logs a
LEFT JOIN users u ON a.user_id = u.id
WHERE a.provider = 'keycloak'
ORDER BY a.created_at DESC
LIMIT 20;
```

**En Keycloak:**
```
Keycloak Admin → Realm Settings → Events → Login events
```

---

## 🚀 Testing

### Test 1: Verificar SSO Auto-Login

```bash
# 1. Login con Keycloak
curl -c cookies.txt http://localhost:3000/auth/keycloak

# 2. Logout local (NO cierra SSO)
curl -b cookies.txt -X POST http://localhost:3000/auth/logout

# 3. Intentar login nuevamente
curl -b cookies.txt http://localhost:3000/auth/keycloak
# Debería auto-loguear sin pedir credenciales
```

### Test 2: Verificar Cambiar Usuario

```bash
# Usar navegador para este test
1. Login con testuser
2. Click "Cambiar Usuario"
3. Debería mostrar pantalla de login
4. Ingresar credenciales de admin
5. Verificar que Dashboard muestra admin
```

### Test 3: Verificar Logout Completo

```bash
1. Login con Keycloak
2. Click "Cerrar Sesión"
3. Verificar redirección a Keycloak logout
4. Verificar redirección de vuelta a frontend
5. Click "Keycloak" nuevamente
6. Debería pedir credenciales (SSO cerrado)
```

---

## 🌐 Producción

### Configuración HTTPS

**En docker-compose.yml:**
```yaml
keycloak:
  environment:
    - KC_HOSTNAME=keycloak.tu-dominio.com
    - KC_HTTPS_ENABLED=true
    - KC_HOSTNAME_STRICT_HTTPS=true
```

**En backend/.env:**
```bash
KEYCLOAK_AUTH_SERVER_URL=https://keycloak.tu-dominio.com
KEYCLOAK_CALLBACK_URL=https://tu-app.com/auth/keycloak/callback
FRONTEND_URL=https://tu-app.com
```

### Configurar Dominio

**En Keycloak Admin:**
```
Clients → tournament-system → Valid redirect URIs:
  https://tu-app.com/auth/keycloak/callback
  https://tu-app.com/*
  https://tu-app.com
```

---

## 📚 Recursos

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OAuth 2.0 RFC](https://oauth.net/2/)
- [OpenID Connect Spec](https://openid.net/connect/)
- [Passport.js OAuth2](http://www.passportjs.org/packages/passport-oauth2/)

---

## ✅ Checklist de SSO

- [ ] Keycloak configurado con realm "tournament"
- [ ] Cliente "tournament-system" con client authentication ON
- [ ] Valid redirect URIs configuradas correctamente
- [ ] Ruta `/auth/keycloak` implementada (SSO normal)
- [ ] Ruta `/auth/keycloak/switch-user` implementada (prompt=login)
- [ ] Logout devuelve `keycloakLogoutUrl` para usuarios Keycloak
- [ ] Frontend maneja redirección a Keycloak logout
- [ ] Botón "Cambiar Usuario" visible solo para Keycloak
- [ ] Probado auto-login con SSO
- [ ] Probado cambiar usuario
- [ ] Probado logout completo

¡SSO completamente funcional! 🎉
