# 🚀 Instrucciones para Probar el Sistema de Autenticación

## ✅ Estado de los Servicios

Todos los servicios están activos y funcionando:

- ✅ **Frontend**: http://localhost:5173
- ✅ **Backend API**: http://localhost:3000
- ✅ **PostgreSQL**: localhost:5432 (Conectado)
- ✅ **Keycloak**: http://localhost:8090

---

## 🔐 Credenciales Disponibles

### 1. Google OAuth2

**Configuración ya lista** - Solo necesitas hacer clic en el botón de Google.

**Client ID**: `57306002614-0v1k04m5p50sgc7ksj6ahj3q2c8v5ehd.apps.googleusercontent.com`

**Cómo usar**:
1. Ve a http://localhost:5173
2. Haz clic en el botón **"Google"**
3. Selecciona tu cuenta de Google
4. Autoriza la aplicación
5. Serás redirigido automáticamente al Dashboard

---

### 2. Autenticación Local (Email/Password)

**Crear una cuenta nueva**:

1. Ve a http://localhost:5173
2. Haz clic en **"¿No tienes cuenta? Regístrate"**
3. Ingresa:
   - **Email**: cualquier email válido (ej: `usuario@test.com`)
   - **Password**: cualquier password (ej: `Password123!`)
   - **Username**: tu nombre de usuario (ej: `testuser`)
4. Haz clic en **"Registrarse"**
5. Luego haz clic en **"¿Ya tienes cuenta? Inicia sesión"**
6. Ingresa el email y password que registraste
7. Serás redirigido al Dashboard

**Ejemplo de credenciales para crear**:
```
Email: admin@test.com
Password: Admin123!
Username: admin
```

---

### 3. Keycloak (Requiere Configuración)

**Estado**: Keycloak está corriendo pero necesita configuración inicial.

**Para configurar Keycloak**:

#### Paso 1: Acceder a Keycloak Admin
1. Ve a: http://localhost:8090/admin
2. Login con:
   - **Usuario**: `admin`
   - **Password**: `admin123`

#### Paso 2: Crear Realm
1. En el menú superior izquierdo, haz clic en el dropdown del realm (dice "master")
2. Haz clic en **"Create Realm"**
3. Nombre: `tournament`
4. Haz clic en **"Create"**

#### Paso 3: Crear Cliente
1. En el menú lateral, haz clic en **"Clients"**
2. Haz clic en **"Create client"**
3. **Client ID**: `tournament-system`
4. Haz clic en **"Next"**
5. Activa **"Client authentication"** (ON)
6. Haz clic en **"Next"**
7. En **Valid redirect URIs** agrega:
   - `http://localhost:3000/auth/keycloak/callback`
8. Haz clic en **"Save"**
9. Ve a la pestaña **"Credentials"**
10. Copia el **Client Secret** que aparece
11. Actualiza el archivo `.env` del backend con ese secret

#### Paso 4: Crear Usuario en Keycloak
1. En el menú lateral, haz clic en **"Users"**
2. Haz clic en **"Add user"**
3. **Username**: `testuser`
4. **Email**: `testuser@tournament.com`
5. Haz clic en **"Create"**
6. Ve a la pestaña **"Credentials"**
7. Haz clic en **"Set password"**
8. **Password**: `Test123!`
9. **IMPORTANTE**: Desactiva **"Temporary"**
10. Haz clic en **"Save"**

**Credenciales para usar**:
```
Username: testuser
Password: Test123!
```

**Nota**: Keycloak requiere que actualices el backend para usar esta autenticación. Por ahora, usa Google OAuth o Autenticación Local.

---

## 📋 Pasos para Probar

### ✅ Opción 1: Google OAuth (MÁS RÁPIDO - RECOMENDADO)

1. **Abre tu navegador** en: http://localhost:5173
2. Verás la pantalla de login
3. Haz clic en el botón **"Google"** (con el icono de Google)
4. Se abrirá una ventana de Google
5. Selecciona tu cuenta de Google
6. Autoriza la aplicación
7. **¡Listo!** Serás redirigido al Dashboard

**Qué verás en el Dashboard**:
- Tu foto de perfil de Google
- Tu nombre completo
- Tu email
- Badge indicando "Autenticado con google"
- Tarjetas con información de seguridad
- Botón para cerrar sesión

---

### ✅ Opción 2: Registro Local

1. **Abre tu navegador** en: http://localhost:5173
2. Haz clic en **"¿No tienes cuenta? Regístrate"**
3. Completa el formulario:
   ```
   Nombre de Usuario: admin
   Email: admin@test.com
   Contraseña: Admin123!
   ```
4. Haz clic en **"Registrarse"**
5. Verás un alert: "Registro exitoso! Por favor inicia sesión."
6. Ahora haz clic en **"¿Ya tienes cuenta? Inicia sesión"**
7. Ingresa:
   ```
   Email: admin@test.com
   Contraseña: Admin123!
   ```
8. Haz clic en **"Iniciar Sesión"**
9. **¡Listo!** Serás redirigido al Dashboard

**Qué verás en el Dashboard**:
- Tu nombre de usuario
- Tu email
- Badge indicando "Autenticado con local"
- Tarjetas con información de seguridad
- Botón para cerrar sesión

---

## 🧪 Funcionalidades a Probar

### 1. Autenticación Exitosa
- ✅ Login con Google OAuth
- ✅ Registro de nuevo usuario local
- ✅ Login con credenciales locales

### 2. Manejo de Errores
- ❌ Intenta hacer login con email incorrecto
- ❌ Intenta hacer login con password incorrecta
- ✅ Verifica que los mensajes de error aparezcan

### 3. Sesión y Tokens
- ✅ Abre las DevTools (F12)
- ✅ Ve a Application → Local Storage → http://localhost:5173
- ✅ Verifica que existan `accessToken` y `refreshToken`

### 4. Logout
- ✅ Haz clic en **"Cerrar Sesión"**
- ✅ Verifica que te redirija a /login
- ✅ Verifica que los tokens se eliminen de Local Storage

### 5. Audit Logs (Backend)
- ✅ Después de hacer login, puedes ver los logs en la consola del backend
- ✅ Cada autenticación se registra en la base de datos

---

## 🔍 Verificación de la Base de Datos

Si quieres ver los datos en PostgreSQL:

```bash
# Conectar a PostgreSQL
docker exec -it security-postgres psql -U postgres -d security_db

# Ver usuarios registrados
SELECT id, email, username, provider, created_at, last_login FROM users;

# Ver logs de auditoría
SELECT id, provider, action, success, ip_address, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10;

# Ver tokens de refresh
SELECT user_id, expires_at, revoked FROM refresh_tokens WHERE revoked = FALSE;

# Salir
\q
```

---

## 🎯 URLs Importantes

| Servicio | URL |
|----------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:3000 |
| **API Health** | http://localhost:3000/health |
| **API Info** | http://localhost:3000 |
| **Keycloak Admin** | http://localhost:8090/admin |
| **Keycloak Realm** | http://localhost:8090/realms/tournament |

---

## 🐛 Solución de Problemas

### Error: "No se puede conectar al servidor"
```bash
# Verifica que el backend esté corriendo
curl http://localhost:3000/health

# Si no responde, reinicia el backend
cd backend
npm run dev
```

### Error: "CORS error"
- Verifica que el frontend esté en http://localhost:5173
- Verifica que el backend tenga `FRONTEND_URL=http://localhost:5173` en `.env`

### Error: "Cannot connect to database"
```bash
# Verifica que PostgreSQL esté corriendo
docker ps | findstr postgres

# Reinicia los contenedores
docker-compose restart
```

### Error en Google OAuth: "redirect_uri_mismatch"
- Ve a Google Cloud Console
- Verifica que `http://localhost:3000/auth/google/callback` esté en las URIs autorizadas

---

## ✅ Checklist de Pruebas

- [ ] Frontend accesible en http://localhost:5173
- [ ] Backend responde en http://localhost:3000/health
- [ ] Login con Google OAuth funciona
- [ ] Registro de usuario local funciona
- [ ] Login con credenciales locales funciona
- [ ] Dashboard muestra información del usuario
- [ ] Logout funciona correctamente
- [ ] Tokens se guardan en Local Storage
- [ ] Mensajes de error se muestran correctamente

---

## 📝 Notas Finales

- **Google OAuth** es la forma más rápida de probar el sistema
- **Autenticación Local** requiere crear una cuenta primero
- **Keycloak** requiere configuración adicional
- Los **tokens JWT** expiran en 1 hora
- Los **refresh tokens** expiran en 7 días
- Todos los eventos se registran en la tabla `audit_logs`

**¡El sistema está listo para usar! Empieza con Google OAuth para una prueba rápida.**
