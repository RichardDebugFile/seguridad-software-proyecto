# 🚀 Guía de Instalación Completa del Proyecto

Guía paso a paso para instalar y configurar el sistema completo de autenticación segura desde cero.

---

## 📋 Tabla de Contenidos

1. [Prerequisitos](#prerequisitos)
2. [Levantar Infraestructura Docker](#levantar-infraestructura-docker)
3. [Instalar Dependencias](#instalar-dependencias)
4. [Configurar Keycloak](#configurar-keycloak)
5. [Configurar Variables de Entorno](#configurar-variables-de-entorno)
6. [Levantar Servicios Backend](#levantar-servicios-backend)
7. [Levantar Servicios Frontend](#levantar-servicios-frontend)
8. [Verificación del Sistema](#verificación-del-sistema)
9. [Solución de Problemas](#solución-de-problemas)

---

## 📦 Prerequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** v18.x o superior
- **npm** v9.x o superior
- **Docker** v20.x o superior
- **Docker Compose** v2.x o superior
- **Git** (para clonar el repositorio)

### Verificar Instalaciones

```bash
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar Docker
docker --version

# Verificar Docker Compose
docker-compose --version
```

---

## 🐳 Levantar Infraestructura Docker

### Paso 1: Limpiar Instalaciones Previas (Opcional)

Si ya tenías contenedores corriendo o hubo corrupción de datos, primero limpia todo:

```bash
# Detener y eliminar contenedores y volúmenes anteriores
docker-compose down -v
```

⚠️ **Advertencia:** El flag `-v` eliminará todos los volúmenes (datos persistentes). Úsalo solo si quieres empezar desde cero.

### Paso 2: Levantar Servicios Docker

```bash
# Desde la raíz del proyecto
docker-compose up -d
```

Esto levantará:
- **PostgreSQL** (puerto 5432) - 4 bases de datos
- **Keycloak DB** (PostgreSQL interno para Keycloak)
- **Keycloak** (puerto 8090)
- **HashiCorp Vault** (puerto 8200)

### Paso 3: Verificar Estado de Contenedores

```bash
# Ver estado de contenedores
docker-compose ps
```

Deberías ver:

```
NAME                IMAGE                            STATUS
keycloak-db         postgres:15-alpine               Up (healthy)
security-keycloak   quay.io/keycloak/keycloak:23.0   Up
security-postgres   postgres:15-alpine               Up (healthy)
security-vault      hashicorp/vault:latest           Up
```

### Paso 4: Verificar Bases de Datos

```bash
# Conectar a PostgreSQL y verificar bases de datos
docker exec -it security-postgres psql -U postgres -c "\l"
```

Deberías ver estas bases de datos creadas:
- ✅ `security_db`
- ✅ `tournament_db`
- ✅ `player_db`
- ✅ `message_db`

### Paso 5: Verificar Logs (Opcional)

```bash
# Ver logs de Keycloak
docker logs security-keycloak --tail 50

# Ver logs de Vault
docker logs security-vault --tail 20
```

**Keycloak está listo cuando veas:**
```
Keycloak 23.0.x on JVM started in XXXXms
KC-SERVICES0009: Added user 'admin' to realm 'master'
```

**Vault está listo cuando veas:**
```
Root Token: dev-root-token
Vault is unsealed
```

---

## 📥 Instalar Dependencias

### Instalar Dependencias de Backends

Ejecuta estos comandos en **paralelo** (abre 4 terminales o usa `&` en Linux/Mac):

```bash
# Terminal 1: Backend Auth
cd backend
npm install

# Terminal 2: Backend Tournament
cd backend-tournament
npm install

# Terminal 3: Backend Player
cd backend-player
npm install

# Terminal 4: Backend Message
cd backend-message
npm install
```

**O en Windows (secuencialmente):**

```bash
cd backend && npm install && cd ..
cd backend-tournament && npm install && cd ..
cd backend-player && npm install && cd ..
cd backend-message && npm install && cd ..
```

### Instalar Dependencias de Frontends

```bash
# Frontend Portal Usuario
cd frontend
npm install

# Frontend Panel Admin
cd frontend-admin
npm install
```

### Verificar Instalaciones

Cada `npm install` debería completarse sin errores. Si ves warnings de vulnerabilidades, puedes ignorarlos por ahora (son de desarrollo).

---

## 🔑 Configurar Keycloak

Esta es la parte **MÁS CRÍTICA** de la instalación. Sigue cada paso cuidadosamente.

### Paso 1: Acceder a Keycloak Admin Console

1. Abre tu navegador en: **http://localhost:8090/admin**
2. Ingresa credenciales de administrador:
   - **Username:** `admin`
   - **Password:** `admin123`

### Paso 2: Crear Realm "tournament"

1. Click en el dropdown **"master"** (esquina superior izquierda)
2. Click en **"Create Realm"**
3. Configuración:
   - **Realm name:** `tournament`
   - **Enabled:** ON (activado)
4. Click en **"Create"**

✅ **Verificación:** El dropdown ahora debería mostrar "tournament"

### Paso 3: Crear Cliente "tournament-system"

#### 3.1 General Settings

1. En el menú lateral: **"Clients"** → **"Create client"**
2. Configuración:
   - **Client type:** `OpenID Connect` (por defecto)
   - **Client ID:** `tournament-system`
3. Click **"Next"**

#### 3.2 Capability Config

⚠️ **MUY IMPORTANTE - No te saltes esto:**

- **Client authentication:** **ON** ✓ (CRÍTICO)
- **Authorization:** OFF
- **Authentication flow:**
  - ✅ **Standard flow:** ON
  - ✅ **Direct access grants:** ON
  - ❌ Implicit flow: OFF
  - ❌ OAuth 2.0 Device Authorization Grant: OFF
  - ❌ OIDC CIBA Grant: OFF

Click **"Next"**

#### 3.3 Login Settings

**⚠️ CRÍTICO - Copia estas URIs exactamente como se muestran:**

**Root URL:** (dejar vacío)

**Home URL:** (dejar vacío)

**Valid redirect URIs:** (una por línea)
```
http://localhost:3000/auth/keycloak/callback
http://localhost:5173/*
http://localhost:5173/auth/callback
http://localhost:5173/dashboard
http://localhost:5174/*
http://localhost:5174/auth/callback
http://localhost:5174/
```

**Valid post logout redirect URIs:** (una por línea)
```
http://localhost:5173/*
http://localhost:5173/login
http://localhost:5173/login?logout=true
http://localhost:5174/*
http://localhost:5174/
```

**Web origins:**
```
+
```
(Solo el símbolo `+` que permite todos los orígenes de las redirect URIs)

**Admin URL:** (dejar vacío)

Click **"Save"**

#### 3.4 Obtener Client Secret

⚠️ **IMPORTANTE - Guarda este valor:**

1. Después de guardar, ve a la pestaña **"Credentials"**
2. Verás el **Client secret**
3. Click en el icono **copiar** (📋) al lado del secret
4. **GUARDA ESTE VALOR** - lo necesitarás en el siguiente paso

**Ejemplo de Client Secret:**
```
IpQBtxehldD00MAgQcFQzGTxe2IXLGez
```

### Paso 4: Crear Roles

#### 4.1 Crear Rol "admin"

1. En el menú lateral: **"Realm roles"** → **"Create role"**
2. Configuración:
   - **Role name:** `admin`
   - **Description:** `Administrador con acceso completo`
3. Click **"Save"**

#### 4.2 Crear Rol "user"

1. Click **"Create role"**
2. Configuración:
   - **Role name:** `user`
   - **Description:** `Usuario estándar`
3. Click **"Save"**

✅ **Verificación:** Deberías tener 2 roles: `admin` y `user`

### Paso 5: Crear Usuarios

#### 5.1 Usuario Administrador

**Crear usuario:**

1. En el menú lateral: **"Users"** → **"Create new user"**
2. Configuración:
   - **Username:** `admin`
   - **Email:** `admin@example.com`
   - **Email verified:** **ON** ✓ (IMPORTANTE)
   - **First name:** `Admin`
   - **Last name:** `User`
   - **Enabled:** ON ✓
3. Click **"Create"**

**Establecer contraseña:**

1. Ve a la pestaña **"Credentials"**
2. Click **"Set password"**
3. Configuración:
   - **Password:** `Admin123!`
   - **Password confirmation:** `Admin123!`
   - **Temporary:** **OFF** ✓ (IMPORTANTE - desmarcar)
4. Click **"Save"** → Confirmar en el diálogo

**Asignar roles:**

1. Ve a la pestaña **"Role mapping"**
2. Click **"Assign role"**
3. Seleccionar ambos roles:
   - ✅ `admin`
   - ✅ `user`
4. Click **"Assign"**

✅ **Verificación:** El usuario admin debería tener 2 roles asignados

#### 5.2 Usuario Estándar

**Crear usuario:**

1. **"Users"** → **"Create new user"**
2. Configuración:
   - **Username:** `testuser`
   - **Email:** `testuser@example.com`
   - **Email verified:** **ON** ✓
   - **First name:** `Test`
   - **Last name:** `User`
   - **Enabled:** ON ✓
3. Click **"Create"**

**Establecer contraseña:**

1. Pestaña **"Credentials"** → **"Set password"**
2. Configuración:
   - **Password:** `Test123!`
   - **Password confirmation:** `Test123!`
   - **Temporary:** **OFF** ✓
3. Click **"Save"** → Confirmar

**Asignar roles:**

1. Pestaña **"Role mapping"** → **"Assign role"**
2. Seleccionar:
   - ✅ `user` (solo este)
3. Click **"Assign"**

✅ **Verificación:** El usuario testuser debería tener 1 rol: `user`

### Paso 6: Configurar Mapper de Roles

⚠️ **CRÍTICO - Sin esto, los roles NO se incluirán en el JWT token**

#### 6.1 Navegar a Client Scopes

1. **"Clients"** → Click en **"tournament-system"**
2. Ve a la pestaña **"Client scopes"**
3. Click en **"tournament-system-dedicated"**

#### 6.2 Crear Mapper

1. Ve a la pestaña **"Mappers"**
2. Click en **"Configure a new mapper"** (NO uses "Add predefined mapper")
3. En la lista, busca y selecciona **"User Realm Role"**
4. Configuración:
   ```
   Name: roles
   Token Claim Name: roles
   Claim JSON Type: String
   Add to ID token: ON ✓
   Add to access token: ON ✓
   Add to userinfo: ON ✓
   Multivalued: ON ✓
   ```
5. Click **"Save"**

✅ **Verificación:** En la pestaña Mappers de "tournament-system-dedicated" debería aparecer un mapper llamado "roles"

---

## 🔧 Configurar Variables de Entorno

### Actualizar Client Secret en backend/.env

1. Abre el archivo `backend/.env`
2. Localiza la línea `KEYCLOAK_CLIENT_SECRET`
3. Reemplaza el valor con el Client Secret que copiaste de Keycloak:

```bash
KEYCLOAK_CLIENT_SECRET=TU_CLIENT_SECRET_AQUI
```

**Ejemplo:**
```bash
KEYCLOAK_CLIENT_SECRET=IpQBtxehldD00MAgQcFQzGTxe2IXLGez
```

4. Guarda el archivo

### Verificar Otras Variables (Opcional)

El archivo `backend/.env` debería tener esta configuración:

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

# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=57306002614-0v1k04m5p50sgc7ksj6ahj3q2c8v5ehd.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Keycloak Configuration
KEYCLOAK_REALM=tournament
KEYCLOAK_AUTH_SERVER_URL=http://localhost:8090
KEYCLOAK_CLIENT_ID=tournament-system
KEYCLOAK_CLIENT_SECRET=TU_CLIENT_SECRET_AQUI
KEYCLOAK_CALLBACK_URL=http://localhost:3000/auth/keycloak/callback

# Frontend URLs (for CORS)
FRONTEND_URL=http://localhost:5173
FRONTEND_ADMIN_URL=http://localhost:5174

# Credenciales de Keycloak para pruebas locales
# User: testuser | Password: Test123!
# Admin: admin | Password: Admin123!
```

---

## ⚙️ Levantar Servicios Backend

Abre **4 terminales** y ejecuta cada comando en una terminal diferente:

### Terminal 1: Backend Auth Service

```bash
cd backend
npm run dev
```

✅ Deberías ver:
```
🚀 Servidor backend iniciado exitosamente
📍 URL: http://localhost:3000
🔐 Google OAuth: Configurado
🔑 Keycloak: Configurado
```

### Terminal 2: Backend Tournament Service

```bash
cd backend-tournament
npm run dev
```

✅ Deberías ver:
```
🏆 Tournament Service iniciado exitosamente
📍 URL: http://localhost:3001
```

### Terminal 3: Backend Player Service

```bash
cd backend-player
npm run dev
```

✅ Deberías ver:
```
👤 Player Service iniciado exitosamente
📍 URL: http://localhost:3002
```

### Terminal 4: Backend Message Service

```bash
cd backend-message
npm run dev
```

✅ Deberías ver:
```
🚀 Message Service running on port 3003
✓ Connected to HashiCorp Vault
✓ Connected to PostgreSQL database (Message DB)
```

⚠️ **Nota:** Mantén estas 4 terminales abiertas. Si cierras una, ese servicio se detendrá.

---

## 🎨 Levantar Servicios Frontend

Abre **2 terminales adicionales** y ejecuta:

### Terminal 5: Frontend Portal Usuario

```bash
cd frontend
npm run dev
```

✅ Deberías ver:
```
VITE v5.4.21  ready in XXXms
➜  Local:   http://localhost:5173/
```

### Terminal 6: Frontend Panel Admin

```bash
cd frontend-admin
npm run dev
```

✅ Deberías ver:
```
VITE v5.4.21  ready in XXXms
➜  Local:   http://localhost:5174/
```

---

## ✅ Verificación del Sistema

### Resumen de Servicios Corriendo

Si todo está correcto, deberías tener estos servicios corriendo:

| Tipo | Servicio | Puerto | URL |
|------|----------|--------|-----|
| **Docker** | PostgreSQL | 5432 | - |
| **Docker** | Keycloak | 8090 | http://localhost:8090 |
| **Docker** | Vault | 8200 | http://localhost:8200 |
| **Backend** | Auth Service | 3000 | http://localhost:3000 |
| **Backend** | Tournament Service | 3001 | http://localhost:3001 |
| **Backend** | Player Service | 3002 | http://localhost:3002 |
| **Backend** | Message Service | 3003 | http://localhost:3003 |
| **Frontend** | Portal Usuario | 5173 | http://localhost:5173 |
| **Frontend** | Panel Admin | 5174 | http://localhost:5174 |

### Pruebas Funcionales

#### Prueba 1: Login con Usuario Regular

1. Abre http://localhost:5173
2. Click en **"Keycloak"** (botón morado)
3. Ingresa credenciales:
   - Username: `testuser`
   - Password: `Test123!`
4. ✅ Deberías entrar al Dashboard
5. ✅ NO deberías ver el botón "Panel Admin"

#### Prueba 2: Login con Usuario Admin

1. Logout del usuario anterior
2. Click en **"Keycloak"**
3. Ingresa credenciales:
   - Username: `admin`
   - Password: `Admin123!`
4. ✅ Deberías entrar al Dashboard
5. ✅ SÍ deberías ver el botón **"Panel Admin"**

#### Prueba 3: SSO entre Portales

1. Estando como admin, click en **"Panel Admin"**
2. ✅ Deberías entrar **sin volver a pedir credenciales** (SSO)
3. ✅ Deberías ver el dashboard administrativo
4. Click en **"Portal Usuario"**
5. ✅ Deberías regresar **sin volver a pedir credenciales**

#### Prueba 4: Verificar Roles en JWT

1. Estando logueado como admin
2. Abre DevTools del navegador (F12)
3. Ve a la pestaña **Console**
4. Ejecuta:
   ```javascript
   const token = localStorage.getItem('accessToken');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('Roles:', payload.roles);
   ```
5. ✅ Deberías ver: `Roles: ["admin", "user"]`

Si ves los roles correctamente, ¡la configuración es exitosa! 🎉

---

## 🐛 Solución de Problemas

### Problema: Keycloak no arranca

**Síntomas:** El contenedor security-keycloak se reinicia constantemente

**Solución:**
```bash
# Revisar logs
docker logs security-keycloak

# Si hay problemas con la BD, recrear todo
docker-compose down -v
docker-compose up -d
```

### Problema: "Invalid client credentials"

**Causa:** El Client Secret no coincide

**Solución:**
1. Ve a Keycloak Admin → Clients → tournament-system → Credentials
2. Copia el Client Secret actual
3. Actualiza `backend/.env`
4. Reinicia el backend (Ctrl+C y `npm run dev`)

### Problema: "Invalid redirect URI"

**Causa:** Las URIs no están configuradas correctamente en Keycloak

**Solución:**
1. Ve a Clients → tournament-system
2. Revisa que todas las URIs estén exactamente como se muestran en la sección de configuración
3. **No debe haber espacios extra**
4. Guarda y prueba de nuevo

### Problema: Roles no aparecen en el token

**Causa:** El mapper de roles no está configurado

**Solución:**
1. Ve a Clients → tournament-system → Client scopes → tournament-system-dedicated
2. Pestaña Mappers
3. Verifica que existe un mapper de roles con "Add to access token: ON"
4. Si no existe, créalo siguiendo el Paso 6 de configuración de Keycloak
5. Haz logout completo y vuelve a hacer login

### Problema: "Panel Admin" no aparece para usuario admin

**Causa:** El usuario no tiene el rol "admin" o los roles no están en el token

**Solución:**
1. Verifica en Keycloak: Users → admin → Role mapping
2. Asegúrate que tenga el rol "admin" asignado
3. Verifica el mapper de roles (ver problema anterior)
4. Haz logout y login de nuevo
5. Verifica el token con DevTools (ver Prueba 4)

### Problema: CORS errors en la consola

**Causa:** Web Origins no configurados correctamente

**Solución:**
1. Ve a Clients → tournament-system
2. En "Web origins" debe estar el símbolo `+`
3. Si no funciona, agrega explícitamente:
   ```
   http://localhost:5173
   http://localhost:5174
   http://localhost:3000
   ```
4. Guarda y recarga la página

### Problema: Backend no se conecta a PostgreSQL

**Síntomas:** Error "ECONNREFUSED" o "Connection refused"

**Solución:**
```bash
# Verificar que PostgreSQL esté corriendo
docker ps | grep security-postgres

# Si no está corriendo
docker-compose up -d postgres

# Verificar conexión
docker exec -it security-postgres psql -U postgres -c "SELECT 1"
```

### Problema: npm install falla

**Síntomas:** Error durante instalación de dependencias

**Solución:**
```bash
# Limpiar caché de npm
npm cache clean --force

# Eliminar node_modules y package-lock.json
rm -rf node_modules package-lock.json

# Reinstalar
npm install
```

### Problema: Puerto ya en uso

**Síntomas:** "Error: listen EADDRINUSE: address already in use"

**Solución:**

**Windows:**
```bash
# Ver qué proceso usa el puerto (ejemplo: 3000)
netstat -ano | findstr :3000

# Matar el proceso (reemplaza PID con el número que aparece)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Ver qué proceso usa el puerto
lsof -i :3000

# Matar el proceso
kill -9 <PID>
```

---

## 📚 Archivos de Configuración Importantes

### Estructura de Archivos de Configuración

```
.
├── docker-compose.yml          # Configuración de Docker
├── init-databases.sql          # Script de inicialización de BDs
├── backend/
│   ├── .env                    # Variables de entorno del backend
│   └── src/config/
│       ├── database.js         # Configuración de PostgreSQL
│       └── passport.js         # Configuración de autenticación
├── backend-tournament/.env
├── backend-player/.env
├── backend-message/.env
├── frontend/
│   └── src/utils/api.js        # Configuración de API
└── frontend-admin/
    └── src/utils/api.js
```

### Variables de Entorno por Servicio

**backend/.env** - Auth Service (PRINCIPAL)
- Todas las configuraciones de autenticación
- Keycloak, Google OAuth, JWT
- URLs de frontends para CORS

**backend-tournament/.env** - Tournament Service
- Solo configuración de base de datos tournament_db
- URL del Auth Service

**backend-player/.env** - Player Service
- Solo configuración de base de datos player_db
- URL del Auth Service

**backend-message/.env** - Message Service
- Configuración de base de datos message_db
- Configuración de HashiCorp Vault
- URL del Auth Service

---

## 🔒 Credenciales por Defecto

### Keycloak Admin Console

- **URL:** http://localhost:8090/admin
- **Usuario:** `admin`
- **Contraseña:** `admin123`

### PostgreSQL

- **Host:** localhost
- **Puerto:** 5432
- **Usuario:** `postgres`
- **Contraseña:** `postgres123`
- **Bases de datos:** security_db, tournament_db, player_db, message_db

### HashiCorp Vault

- **URL:** http://localhost:8200
- **Root Token:** `dev-root-token`

### Usuarios de la Aplicación (Keycloak)

**Usuario Admin:**
- **Username:** `admin`
- **Password:** `Admin123!`
- **Roles:** admin, user

**Usuario Regular:**
- **Username:** `testuser`
- **Password:** `Test123!`
- **Roles:** user

---

## 📖 Documentación Adicional

Para más información, consulta estos documentos en la carpeta `docs/`:

- **README.md** - Documentación principal del proyecto
- **KEYCLOAK-SETUP.md** - Configuración detallada de Keycloak
- **KEYCLOAK-USERS-ROLES.md** - Gestión de usuarios y roles
- **SSO.md** - Documentación del Single Sign-On
- **MESSAGING-E2EE.md** - Sistema de mensajería encriptada
- **MICROSERVICES.md** - Arquitectura de microservicios
- **API.md** - Documentación de endpoints
- **TROUBLESHOOTING-SSO.md** - Solución de problemas de SSO

---

## ✅ Checklist Final de Instalación

Usa este checklist para verificar que completaste todos los pasos:

### Docker
- [ ] Docker y Docker Compose instalados
- [ ] Contenedores levantados con `docker-compose up -d`
- [ ] PostgreSQL corriendo y saludable
- [ ] Keycloak corriendo en puerto 8090
- [ ] Vault corriendo en puerto 8200
- [ ] 4 bases de datos creadas (security_db, tournament_db, player_db, message_db)

### Keycloak
- [ ] Acceso a admin console (admin/admin123)
- [ ] Realm "tournament" creado
- [ ] Cliente "tournament-system" creado
- [ ] Client authentication: ON
- [ ] Todas las redirect URIs configuradas
- [ ] Todas las post logout URIs configuradas
- [ ] Web origins configurados (+)
- [ ] Client Secret copiado y guardado
- [ ] Rol "admin" creado
- [ ] Rol "user" creado
- [ ] Usuario "admin" creado con password Admin123!
- [ ] Usuario "testuser" creado con password Test123!
- [ ] Roles asignados correctamente
- [ ] Mapper de roles configurado
- [ ] Mapper con "Add to access token: ON"

### Backend
- [ ] Dependencias instaladas en los 4 backends
- [ ] Client Secret actualizado en backend/.env
- [ ] Backend Auth corriendo en puerto 3000
- [ ] Backend Tournament corriendo en puerto 3001
- [ ] Backend Player corriendo en puerto 3002
- [ ] Backend Message corriendo en puerto 3003
- [ ] Sin errores en los logs de backend

### Frontend
- [ ] Dependencias instaladas en ambos frontends
- [ ] Frontend Usuario corriendo en puerto 5173
- [ ] Frontend Admin corriendo en puerto 5174
- [ ] Sin errores en la consola del navegador

### Verificación Funcional
- [ ] Login con testuser funciona
- [ ] Login con admin funciona
- [ ] Usuario admin ve botón "Panel Admin"
- [ ] Usuario testuser NO ve botón "Panel Admin"
- [ ] SSO entre Portal Usuario ↔ Panel Admin funciona
- [ ] Logout cierra sesión correctamente
- [ ] Roles aparecen en el JWT token (verificado con DevTools)

---

## 🎉 ¡Instalación Completa!

Si completaste todos los pasos del checklist, ¡tu sistema está completamente instalado y funcionando!

**Próximos pasos:**
1. Explora las funcionalidades del sistema
2. Crea torneos y jugadores desde el Panel Admin
3. Prueba el sistema de mensajería encriptada
4. Revisa la documentación adicional en `docs/`

**¿Necesitas ayuda?**
- Revisa la sección de [Solución de Problemas](#solución-de-problemas)
- Consulta la documentación en la carpeta `docs/`
- Revisa los logs de cada servicio para identificar errores

---

**Fecha de creación:** 2025-12-30
**Versión del documento:** 1.0
**Última actualización:** 2025-12-30
