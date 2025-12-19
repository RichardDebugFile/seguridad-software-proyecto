# 📖 Documentación de API

Documentación completa de los endpoints del backend del Sistema de Autenticación Segura.

**Base URL**: `http://localhost:3000`

---

## 🔐 Autenticación

Todos los endpoints protegidos requieren un token JWT en el header:

```http
Authorization: Bearer <accessToken>
```

---

## 📋 Índice de Endpoints

### Autenticación
- [POST /auth/register](#post-authregister) - Registrar usuario local
- [POST /auth/login](#post-authlogin) - Login con email/contraseña
- [POST /auth/logout](#post-authlogout) - Cerrar sesión
- [POST /auth/refresh](#post-authrefresh) - Renovar access token
- [GET /auth/me](#get-authme) - Obtener usuario actual

### Google OAuth
- [GET /auth/google](#get-authgoogle) - Iniciar autenticación con Google
- [GET /auth/google/callback](#get-authgooglecallback) - Callback de Google

### Keycloak OAuth
- [GET /auth/keycloak](#get-authkeycloak) - Iniciar autenticación con Keycloak
- [GET /auth/keycloak/callback](#get-authkeycloakcallback) - Callback de Keycloak

### Health
- [GET /health](#get-health) - Estado del servidor

---

## Endpoints Detallados

### POST /auth/register

Registra un nuevo usuario con email y contraseña.

**Autenticación**: No requerida

**Request Body**:
```json
{
  "email": "usuario@example.com",
  "password": "Password123!",
  "username": "usuario123"
}
```

**Validaciones**:
- `email`: Formato de email válido, único en el sistema
- `password`: Mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número
- `username`: Mínimo 3 caracteres, opcional

**Response Success (201)**:
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "username": "usuario123",
    "provider": "local",
    "display_name": "usuario123",
    "created_at": "2025-12-18T10:30:00.000Z"
  }
}
```

**Response Error (400)**:
```json
{
  "error": "El email ya está registrado"
}
```

**Curl Example**:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "username": "testuser"
  }'
```

---

### POST /auth/login

Inicia sesión con email y contraseña.

**Autenticación**: No requerida

**Request Body**:
```json
{
  "email": "usuario@example.com",
  "password": "Password123!"
}
```

**Response Success (200)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "username": "usuario123",
    "provider": "local",
    "display_name": "usuario123"
  }
}
```

**Response Error (401)**:
```json
{
  "error": "Credenciales inválidas"
}
```

**Curl Example**:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

**Tokens**:
- `accessToken`: Válido por 1 hora, usar en header `Authorization: Bearer <token>`
- `refreshToken`: Válido por 7 días, usar para renovar el access token

---

### POST /auth/logout

Cierra sesión y revoca el refresh token.

**Autenticación**: Requerida (JWT)

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Success (200)**:
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

**Curl Example**:
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "refreshToken": "<refreshToken>"
  }'
```

---

### POST /auth/refresh

Renueva el access token usando un refresh token válido.

**Autenticación**: No requerida (usa refresh token)

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Success (200)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Error (401)**:
```json
{
  "error": "Refresh token inválido o expirado"
}
```

**Curl Example**:
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refreshToken>"
  }'
```

**Nota**: Este endpoint devuelve un nuevo par de tokens (access + refresh). El refresh token anterior queda revocado.

---

### GET /auth/me

Obtiene la información del usuario autenticado.

**Autenticación**: Requerida (JWT)

**Response Success (200)**:
```json
{
  "id": 1,
  "email": "usuario@example.com",
  "username": "usuario123",
  "provider": "local",
  "display_name": "usuario123",
  "picture_url": null,
  "created_at": "2025-12-18T10:30:00.000Z",
  "last_login": "2025-12-18T12:45:00.000Z",
  "is_active": true
}
```

**Response Error (401)**:
```json
{
  "error": "Token inválido o expirado"
}
```

**Curl Example**:
```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

---

### GET /auth/google

Inicia el flujo de autenticación con Google OAuth 2.0.

**Autenticación**: No requerida

**Response**: Redirección a la página de login de Google

**Uso desde el frontend**:
```javascript
// Redirigir al usuario a este endpoint
window.location.href = 'http://localhost:3000/auth/google';
```

**Flujo**:
1. Usuario hace clic en botón "Google"
2. Frontend redirige a `/auth/google`
3. Backend redirige a Google para autenticación
4. Usuario ingresa credenciales en Google
5. Google redirige a `/auth/google/callback`

---

### GET /auth/google/callback

Callback de Google OAuth. **No llamar directamente desde el frontend.**

**Autenticación**: No requerida (manejado por Google)

**Query Parameters** (automáticos de Google):
- `code`: Código de autorización de Google
- `state`: Token de estado (CSRF protection)

**Response**: Redirección al frontend con tokens

```
http://localhost:5173/auth/callback?accessToken=<token>&refreshToken=<token>
```

**Manejo de Errores**: Si falla, redirige a:
```
http://localhost:5173/login?error=google_auth_failed
```

---

### GET /auth/keycloak

Inicia el flujo de autenticación con Keycloak.

**Autenticación**: No requerida

**Response**: Redirección a la página de login de Keycloak

**Uso desde el frontend**:
```javascript
// Redirigir al usuario a este endpoint
window.location.href = 'http://localhost:3000/auth/keycloak';
```

**Flujo**:
1. Usuario hace clic en botón "Keycloak"
2. Frontend redirige a `/auth/keycloak`
3. Backend redirige a Keycloak para autenticación
4. Usuario ingresa credenciales en Keycloak
5. Keycloak redirige a `/auth/keycloak/callback`

---

### GET /auth/keycloak/callback

Callback de Keycloak OAuth. **No llamar directamente desde el frontend.**

**Autenticación**: No requerida (manejado por Keycloak)

**Query Parameters** (automáticos de Keycloak):
- `code`: Código de autorización de Keycloak
- `state`: Token de estado (CSRF protection)

**Response**: Redirección al frontend con tokens

```
http://localhost:5173/auth/callback?accessToken=<token>&refreshToken=<token>
```

**Manejo de Errores**: Si falla, redirige a:
```
http://localhost:5173/login?error=keycloak_auth_failed
```

---

### GET /health

Verifica el estado del servidor.

**Autenticación**: No requerida

**Response Success (200)**:
```json
{
  "status": "OK",
  "timestamp": "2025-12-18T12:45:00.000Z",
  "service": "security-backend"
}
```

**Curl Example**:
```bash
curl -X GET http://localhost:3000/health
```

---

## 🔒 Seguridad

### Rate Limiting

Todos los endpoints están protegidos con rate limiting:

- **Límite**: 100 requests por 15 minutos por IP
- **Header de respuesta**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`
- **Response cuando se excede (429)**:
  ```json
  {
    "error": "Too many requests, please try again later"
  }
  ```

### CORS

El backend solo acepta requests desde:
- `http://localhost:5173` (Frontend en desarrollo)

### Headers de Seguridad

Helmet.js aplica los siguientes headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (en producción con HTTPS)

---

## 📊 Códigos de Estado HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Operación exitosa |
| 201 | Created | Recurso creado (registro) |
| 400 | Bad Request | Datos inválidos o faltantes |
| 401 | Unauthorized | Token inválido o credenciales incorrectas |
| 403 | Forbidden | Sin permisos (no usado actualmente) |
| 404 | Not Found | Endpoint no existe |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Error del servidor |

---

## 🧪 Testing con curl

### Flujo Completo de Autenticación Local

```bash
# 1. Registrar usuario
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "username": "testuser"
  }'

# 2. Login
RESPONSE=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }')

# Extraer tokens (requiere jq)
ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.accessToken')
REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.refreshToken')

# 3. Obtener información del usuario
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 4. Renovar token
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}"

# 5. Logout
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}"
```

---

## 🔍 Testing con Postman

### Importar Colección

Crea una colección de Postman con estas variables de entorno:

```json
{
  "base_url": "http://localhost:3000",
  "access_token": "",
  "refresh_token": ""
}
```

### Configurar Autorización

Para endpoints protegidos:
1. Ve a Authorization
2. Type: Bearer Token
3. Token: `{{access_token}}`

---

## 🐛 Debugging

### Logs de Auditoría

Todos los eventos de autenticación se registran en la tabla `audit_logs`:

```sql
-- Ver logs recientes
SELECT
  u.email,
  a.provider,
  a.action,
  a.success,
  a.ip_address,
  a.created_at
FROM audit_logs a
LEFT JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC
LIMIT 20;
```

### Logs del Servidor

El servidor usa Morgan para logging HTTP:

```
POST /auth/login 200 145.234 ms - 512
GET /auth/me 401 12.456 ms - 45
```

---

## 📚 Recursos Adicionales

- [Documentación de Passport.js](http://www.passportjs.org/)
- [JWT.io - Decodificador de tokens](https://jwt.io/)
- [OAuth 2.0 RFC](https://oauth.net/2/)
- [OpenID Connect](https://openid.net/connect/)

---

## 🔄 Versionado

**Versión Actual**: v1.0.0

No hay versionado de API implementado actualmente. Todos los endpoints están en la raíz `/auth`.

En futuras versiones, considerar:
- `/api/v1/auth/*`
- `/api/v2/auth/*`

---

## 💡 Mejores Prácticas

### Para el Frontend

1. **Almacenar tokens de forma segura**:
   ```javascript
   // ✅ Bueno
   localStorage.setItem('accessToken', token);

   // ❌ Evitar
   document.cookie = `token=${token}`; // XSS vulnerable
   ```

2. **Manejar expiración de tokens**:
   ```javascript
   // Interceptor axios para renovar automáticamente
   axios.interceptors.response.use(
     response => response,
     async error => {
       if (error.response?.status === 401) {
         const newToken = await refreshAccessToken();
         error.config.headers['Authorization'] = `Bearer ${newToken}`;
         return axios(error.config);
       }
       return Promise.reject(error);
     }
   );
   ```

3. **Limpiar tokens al logout**:
   ```javascript
   const logout = async () => {
     await api.post('/auth/logout', { refreshToken });
     localStorage.removeItem('accessToken');
     localStorage.removeItem('refreshToken');
     navigate('/login');
   };
   ```

### Para el Backend

1. **Validar siempre los tokens**:
   - Los tokens JWT se verifican en cada request protegido
   - Los refresh tokens se validan contra la base de datos

2. **Revocar tokens al logout**:
   - Los refresh tokens se marcan como `revoked = true` en la base de datos

3. **Rotar refresh tokens**:
   - Cada vez que se renueva un access token, se genera un nuevo refresh token
   - El refresh token anterior se revoca

---

¡Documentación completa! 🎉

Para más información sobre configuración, ver:
- [README.md](../README.md) - Documentación principal
- [GOOGLE-OAUTH-SETUP.md](./GOOGLE-OAUTH-SETUP.md) - Configuración de Google OAuth
- [KEYCLOAK-SETUP.md](./KEYCLOAK-SETUP.md) - Configuración de Keycloak
