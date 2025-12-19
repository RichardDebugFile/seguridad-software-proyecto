# 👥 Configuración de Usuarios y Roles en Keycloak

Guía completa para crear y configurar usuarios con roles en Keycloak para el sistema de autenticación.

---

## 📋 Tabla de Contenidos

- [Prerequisitos](#prerequisitos)
- [Acceder a Keycloak Admin](#acceder-a-keycloak-admin)
- [Crear Roles](#crear-roles)
- [Crear Usuarios](#crear-usuarios)
- [Asignar Roles a Usuarios](#asignar-roles-a-usuarios)
- [Configurar Mapper de Roles](#configurar-mapper-de-roles)
- [Verificar Configuración](#verificar-configuración)
- [Usuarios de Prueba Recomendados](#usuarios-de-prueba-recomendados)

---

## Prerequisitos

Antes de comenzar, asegúrate de que:

1. **Keycloak esté corriendo** en http://localhost:8090
   ```bash
   docker ps | grep security-keycloak
   ```

2. **Tengas las credenciales de admin:**
   - Usuario: `admin`
   - Contraseña: `admin123`

3. **El realm `tournament` esté creado** (ver [KEYCLOAK-SETUP.md](KEYCLOAK-SETUP.md))

---

## Acceder a Keycloak Admin

1. Abre tu navegador en: **http://localhost:8090/admin**

2. Haz clic en **"Administration Console"**

3. Ingresa las credenciales:
   - **Username:** `admin`
   - **Password:** `admin123`

4. En el dropdown superior izquierdo, selecciona el realm **`tournament`**

---

## Crear Roles

Los roles determinan qué permisos tiene cada usuario en el sistema.

### Paso 1: Navegar a Roles

1. En el menú lateral izquierdo, haz clic en **"Realm roles"**
2. Verás la lista de roles existentes

### Paso 2: Crear Rol "admin"

1. Haz clic en el botón **"Create role"**

2. Completa el formulario:
   ```
   Role name: admin
   Description: Rol de administrador con acceso completo
   ```

3. Haz clic en **"Save"**

### Paso 3: Crear Rol "user"

1. Haz clic nuevamente en **"Create role"**

2. Completa el formulario:
   ```
   Role name: user
   Description: Rol de usuario estándar
   ```

3. Haz clic en **"Save"**

### Resultado

Deberías tener al menos estos dos roles:
- ✅ `admin` - Para administradores
- ✅ `user` - Para usuarios estándar

---

## Crear Usuarios

Ahora vamos a crear usuarios que puedan autenticarse en el sistema.

### Paso 1: Navegar a Users

1. En el menú lateral izquierdo, haz clic en **"Users"**
2. Verás la lista de usuarios (probablemente vacía)

### Paso 2: Crear Usuario Admin

1. Haz clic en el botón **"Create new user"** (o **"Add user"**)

2. Completa el formulario:
   ```
   Username: admin
   Email: admin@example.com
   Email verified: ON (marca el checkbox)
   First name: Admin
   Last name: User
   ```

3. Haz clic en **"Create"**

4. Serás redirigido a la página de detalles del usuario

### Paso 3: Establecer Contraseña del Admin

1. En la página de detalles del usuario, ve a la pestaña **"Credentials"**

2. Haz clic en **"Set password"**

3. Completa el formulario:
   ```
   Password: Admin123!
   Password confirmation: Admin123!
   Temporary: OFF (desmarca el checkbox para que no pida cambio)
   ```

4. Haz clic en **"Save"**

5. Confirma haciendo clic en **"Save password"** en el diálogo

### Paso 4: Crear Usuario Estándar

Repite los pasos 2 y 3 para crear un usuario estándar:

1. Haz clic en **"Users"** → **"Create new user"**

2. Completa:
   ```
   Username: testuser
   Email: testuser@example.com
   Email verified: ON
   First name: Test
   Last name: User
   ```

3. Haz clic en **"Create"**

4. Ve a la pestaña **"Credentials"** → **"Set password"**

5. Establece:
   ```
   Password: Test123!
   Password confirmation: Test123!
   Temporary: OFF
   ```

6. Haz clic en **"Save"** → **"Save password"**

---

## Asignar Roles a Usuarios

Ahora que tenemos usuarios y roles, vamos a asignarlos.

### Paso 1: Asignar Rol Admin

1. En **"Users"**, busca y haz clic en el usuario **"admin"**

2. Ve a la pestaña **"Role mapping"**

3. Haz clic en **"Assign role"**

4. En el diálogo que aparece:
   - Busca y selecciona el rol **"admin"**
   - También selecciona el rol **"user"** (para que tenga acceso completo)

5. Haz clic en **"Assign"**

6. Deberías ver ambos roles en la sección **"Assigned roles"**:
   - ✅ `admin`
   - ✅ `user`

### Paso 2: Asignar Rol User

1. En **"Users"**, busca y haz clic en el usuario **"testuser"**

2. Ve a la pestaña **"Role mapping"**

3. Haz clic en **"Assign role"**

4. En el diálogo:
   - Selecciona solo el rol **"user"**

5. Haz clic en **"Assign"**

6. Deberías ver:
   - ✅ `user`

---

## Configurar Mapper de Roles

Este paso es **CRÍTICO** para que los roles se incluyan en el JWT token.

### Paso 1: Navegar al Cliente

1. En el menú lateral, haz clic en **"Clients"**

2. Busca y haz clic en **"tournament-system"**

### Paso 2: Ir a Mappers

1. En la página del cliente, ve a la pestaña **"Client scopes"**

2. Haz clic en el client scope **"tournament-system-dedicated"** (o el que tenga el nombre del cliente)

### Paso 3: Crear Mapper de Roles

1. Ve a la pestaña **"Mappers"**

2. Haz clic en **"Add mapper"** → **"By configuration"**

3. Selecciona **"User Realm Role"**

4. Completa el formulario:
   ```
   Name: roles
   Token Claim Name: roles
   Claim JSON Type: String
   Add to ID token: ON
   Add to access token: ON
   Add to userinfo: ON
   Multivalued: ON
   ```

5. Haz clic en **"Save"**

### Resultado

Ahora cuando un usuario inicie sesión, el JWT token incluirá un claim `roles` con un array de los roles asignados:

```json
{
  "sub": "...",
  "email": "admin@example.com",
  "roles": ["admin", "user"],
  ...
}
```

---

## Verificar Configuración

### Verificación Manual

1. Ve a **"Users"** en Keycloak Admin

2. Para cada usuario, verifica en la pestaña **"Role mapping"** que tenga los roles correctos:
   - **admin**: debe tener `admin` y `user`
   - **testuser**: debe tener solo `user`

### Verificación con JWT Decoder

1. Inicia sesión en el Portal Usuario (http://localhost:5173) con el usuario **admin**

2. Abre las **DevTools del navegador** (F12)

3. Ve a la pestaña **"Console"**

4. Ejecuta este código:
   ```javascript
   const token = localStorage.getItem('accessToken');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('Roles:', payload.roles);
   ```

5. Deberías ver:
   ```
   Roles: ["admin", "user"]
   ```

6. Haz lo mismo con el usuario **testuser**, deberías ver:
   ```
   Roles: ["user"]
   ```

### Verificación Funcional

#### Test 1: Usuario Admin

1. Login en Portal Usuario con `admin` / `Admin123!`
2. ✅ Deberías ver el botón **"Panel Admin"** (morado)
3. Haz clic en **"Panel Admin"**
4. ✅ Deberías acceder sin problemas al Panel Admin

#### Test 2: Usuario Estándar

1. Logout y login con `testuser` / `Test123!`
2. ✅ **NO** deberías ver el botón "Panel Admin"
3. Si abres manualmente http://localhost:5174
4. ✅ Deberías ver el mensaje **"Acceso Denegado"**

---

## Usuarios de Prueba Recomendados

Para desarrollo y testing, te recomendamos tener estos usuarios:

### 1. Admin Principal
```
Username: admin
Email: admin@example.com
Password: Admin123!
Roles: admin, user
Descripción: Administrador con acceso completo
```

### 2. Usuario Estándar
```
Username: testuser
Email: testuser@example.com
Password: Test123!
Roles: user
Descripción: Usuario regular sin privilegios admin
```

### 3. Admin Secundario (Opcional)
```
Username: manager
Email: manager@example.com
Password: Manager123!
Roles: admin, user
Descripción: Segundo administrador para testing
```

### 4. Usuario de Testing (Opcional)
```
Username: demo
Email: demo@example.com
Password: Demo123!
Roles: user
Descripción: Usuario demo para presentaciones
```

---

## Crear Usuarios Adicionales (Script Rápido)

Si necesitas crear varios usuarios rápidamente, puedes usar la API REST de Keycloak:

### Prerequisito: Obtener Token de Admin

```bash
curl -X POST http://localhost:8090/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin123" \
  -d "grant_type=password" \
  -d "client_id=admin-cli"
```

Guarda el `access_token` de la respuesta.

### Crear Usuario via API

```bash
curl -X POST http://localhost:8090/admin/realms/tournament/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "firstName": "New",
    "lastName": "User",
    "enabled": true,
    "emailVerified": true,
    "credentials": [{
      "type": "password",
      "value": "NewUser123!",
      "temporary": false
    }]
  }'
```

---

## Troubleshooting

### Problema: Roles no aparecen en el JWT

**Causa:** El mapper de roles no está configurado correctamente.

**Solución:**
1. Ve a **Clients** → **tournament-system** → **Client scopes**
2. Verifica que el mapper de roles esté presente
3. Asegúrate que **"Add to access token"** esté marcado
4. Haz logout completo y vuelve a hacer login

### Problema: Usuario no puede iniciar sesión

**Causa:** Contraseña temporal o usuario deshabilitado.

**Solución:**
1. Ve a **Users** → selecciona el usuario
2. En **"Details"**, verifica que **"Enabled"** esté en ON
3. En **"Credentials"**, verifica que **"Temporary"** esté en OFF
4. Resetea la contraseña si es necesario

### Problema: Usuario admin no ve botón "Panel Admin"

**Causa:** El rol "admin" no está asignado o no se incluye en el token.

**Solución:**
1. Verifica en **"Role mapping"** que el usuario tenga el rol `admin`
2. Verifica el mapper de roles (ver sección anterior)
3. Haz logout y login de nuevo
4. Verifica el token en DevTools (ver sección de verificación)

### Problema: "Invalid user credentials"

**Causa:** Contraseña incorrecta o usuario no existe.

**Solución:**
1. Verifica que el usuario exista en **Users**
2. Resetea la contraseña en **Credentials**
3. Asegúrate de usar la contraseña correcta (distingue mayúsculas/minúsculas)

---

## Mejores Prácticas

### Seguridad

1. **Contraseñas Fuertes:**
   - Mínimo 8 caracteres
   - Al menos una mayúscula
   - Al menos un número
   - Al menos un carácter especial

2. **No usar contraseñas temporales** en desarrollo
   - Siempre desmarca "Temporary" al crear contraseñas de prueba

3. **Verificar Email:**
   - Marca "Email verified" para usuarios de desarrollo
   - En producción, configura SMTP para verificación real

### Organización

1. **Nomenclatura Clara:**
   - Usa nombres descriptivos para usuarios de prueba
   - Documenta el propósito de cada usuario

2. **Roles Mínimos:**
   - Solo asigna los roles necesarios
   - Un admin debería tener `admin` y `user`
   - Un user estándar solo `user`

3. **Documentación:**
   - Mantén una lista de usuarios de prueba actualizada
   - Documenta qué usuario se usa para qué escenario de testing

---

## Resumen de Configuración Completa

### Checklist Final

- [ ] Keycloak corriendo en puerto 8090
- [ ] Realm `tournament` creado
- [ ] Cliente `tournament-system` configurado
- [ ] Rol `admin` creado
- [ ] Rol `user` creado
- [ ] Usuario `admin` creado con contraseña `Admin123!`
- [ ] Usuario `testuser` creado con contraseña `Test123!`
- [ ] Usuario `admin` tiene roles: `admin`, `user`
- [ ] Usuario `testuser` tiene rol: `user`
- [ ] Mapper de roles configurado en el cliente
- [ ] Verificado que roles aparecen en JWT token
- [ ] Test funcional exitoso: admin puede acceder al Panel Admin
- [ ] Test funcional exitoso: testuser NO puede acceder al Panel Admin

---

## Recursos Adicionales

- [Keycloak User Management](https://www.keycloak.org/docs/latest/server_admin/#user-management)
- [Keycloak Role Mapping](https://www.keycloak.org/docs/latest/server_admin/#role-mappings)
- [Keycloak Client Scopes](https://www.keycloak.org/docs/latest/server_admin/#_client_scopes)

---

**¡Configuración completa!** Ahora tienes usuarios y roles funcionando correctamente en Keycloak. 🎉
