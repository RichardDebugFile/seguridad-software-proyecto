# Sistema de Autenticación Segura

Sistema completo de autenticación con múltiples proveedores OAuth2 (Google, Keycloak) y autenticación local con JWT.

## 🚀 Características

- ✅ Autenticación con Google OAuth2
- ✅ Autenticación con Keycloak (preparado)
- ✅ Autenticación local (usuario/contraseña)
- ✅ JWT con refresh tokens
- ✅ Audit logging completo
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Seguridad con Helmet
- ✅ UI moderna con React + TailwindCSS

## 📋 Prerequisitos

- Node.js 18+
- Docker y Docker Compose
- npm o yarn

## 🛠️ Instalación

### 1. Clonar e instalar dependencias

```bash
cd "G:\Documentos G\Ing. Sotware\Periodo 3\Desarrollo de Software Seguro\Proyecto\Referencias\seguridad-software"

# Instalar dependencias raíz
npm install

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

### 2. Iniciar servicios Docker

Desde la raíz del proyecto:

```bash
docker-compose up -d
```

Esto iniciará:
- PostgreSQL (puerto 5432) - Base de datos principal
- Keycloak PostgreSQL (puerto 5432 interno)
- Keycloak (puerto 8090)

### 3. Configurar Keycloak (Opcional)

Si quieres usar Keycloak:

1. Accede a: http://localhost:8090/admin
2. Login: `admin` / `admin123`
3. Crea el realm `tournament` (si no existe)
4. Crea el cliente `tournament-system` con:
   - Client ID: `tournament-system`
   - Client Secret: `EISy4zgMyGRjRqJXqrPe4NMHwJN7cdZ8`
   - Valid Redirect URIs: `http://localhost:3000/auth/keycloak/callback`
   - Client Authentication: ON

### 4. Iniciar la aplicación

#### Opción 1: Iniciar todo junto (recomendado)

Desde la raíz del proyecto:

```bash
npm start
```

#### Opción 2: Iniciar por separado

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

## 🌐 Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Keycloak**: http://localhost:8090/admin

## 🔐 Credenciales por Defecto

### Keycloak Admin
- Usuario: `admin`
- Contraseña: `admin123`

### Base de Datos PostgreSQL
- Host: `localhost`
- Puerto: `5432`
- Database: `security_db`
- Usuario: `postgres`
- Contraseña: `postgres123`

## 📚 Endpoints de la API

### Autenticación

- `GET /auth/google` - Iniciar OAuth con Google
- `GET /auth/google/callback` - Callback de Google
- `POST /auth/register` - Registro de usuario local
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "username": "username"
  }
  ```
- `POST /auth/login` - Login local
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- `POST /auth/refresh` - Renovar access token
  ```json
  {
    "refreshToken": "your-refresh-token"
  }
  ```
- `POST /auth/logout` - Cerrar sesión
- `GET /auth/me` - Obtener usuario actual (requiere token)

### Otros

- `GET /` - Info de la API
- `GET /health` - Health check

## 🗄️ Estructura de la Base de Datos

### Tabla `users`
- `id` - ID único
- `email` - Email único
- `username` - Nombre de usuario
- `password_hash` - Hash de contraseña (solo para usuarios locales)
- `provider` - Proveedor OAuth (google, keycloak, local)
- `provider_id` - ID del proveedor
- `display_name` - Nombre para mostrar
- `picture_url` - URL de la foto de perfil
- `created_at` - Fecha de creación
- `last_login` - Último login
- `is_active` - Usuario activo

### Tabla `audit_logs`
- Registro completo de eventos de autenticación
- IP, user agent, errores, etc.

### Tabla `refresh_tokens`
- Tokens de refresh
- Expiración y revocación

## 🔒 Seguridad

- **Passwords**: Hash con bcrypt (10 rounds)
- **JWT**: Tokens firmados con secret
- **Refresh Tokens**: Almacenados en DB, revocables
- **Rate Limiting**: 100 requests/15min por IP
- **CORS**: Solo frontend autorizado
- **Helmet**: Headers de seguridad
- **SQL Injection**: Protección con queries parametrizadas

## 🧪 Pruebas

### Probar autenticación local

1. Ir a http://localhost:5173
2. Hacer clic en "¿No tienes cuenta? Regístrate"
3. Registrarse con email/password
4. Iniciar sesión
5. Verificar dashboard

### Probar Google OAuth

1. Ir a http://localhost:5173
2. Hacer clic en botón "Google"
3. Autorizar con cuenta de Google
4. Verificar redirección al dashboard

## 🐛 Troubleshooting

### Error: Puerto 5432 en uso
```bash
# Ver procesos usando el puerto
netstat -ano | findstr :5432
# Detener contenedores
docker-compose down
```

### Error: No se puede conectar a la base de datos
```bash
# Verificar que los contenedores están corriendo
docker ps
# Ver logs
docker-compose logs postgres
```

### Error de CORS
- Verificar que `FRONTEND_URL` en `.env` sea `http://localhost:5173`
- Verificar que el backend esté corriendo en puerto 3000

## 📖 Documentación Adicional

- [Passport.js Documentation](http://www.passportjs.org/)
- [Express.js Guide](https://expressjs.com/)
- [React Router](https://reactrouter.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)

## 👥 Autores

- Proyecto de Desarrollo de Software Seguro
- Periodo 3 - Ingeniería de Software

## 📝 Licencia

Este proyecto es para fines educativos.
