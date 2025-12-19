# 🔧 Troubleshooting - SSO Panel Admin

Guía rápida para solucionar problemas con el acceso al Panel Admin.

---

## ❌ Problema: "Acceso Denegado" y regresa automáticamente

### Síntomas:
- Abres `http://localhost:5174`
- Muestra "Acceso Denegado" brevemente
- Te regresa automáticamente sin poder hacer clic en nada

### Causa Principal:
El frontend admin no puede guardar el token de autenticación porque **Keycloak no permite el redirect URI** al puerto 5174.

---

## ✅ Solución: Configurar Valid Redirect URIs en Keycloak

### Paso 1: Verificar URIs actuales

1. Abre Keycloak Admin Console:
   ```
   http://localhost:8090
   Usuario: admin
   Contraseña: admin123
   ```

2. Selecciona tu realm: **`tournament`**

3. Ve a **Clients** → Click en **`tournament-system`**

4. Busca la sección **"Valid redirect URIs"**

5. Deberías ver:
   ```
   http://localhost:5173/*
   http://localhost:3000/auth/*
   ```

### Paso 2: Agregar URI del Panel Admin

1. Click en **"+ Add redirect URI"** (o el botón "+")

2. Agregar:
   ```
   http://localhost:5174/*
   ```

3. En **"Valid post logout redirect URIs"** también agregar:
   ```
   http://localhost:5174/*
   ```

4. **Muy Importante:** Click en **"Save"** al final de la página

### Paso 3: Verificar que se guardó

1. Refresca la página del cliente en Keycloak

2. Verifica que ahora tengas:
   ```
   Valid redirect URIs:
   - http://localhost:5173/*
   - http://localhost:3000/auth/*
   - http://localhost:5174/*  ← NUEVO

   Valid post logout redirect URIs:
   - http://localhost:5173/*
   - http://localhost:5174/*  ← NUEVO
   ```

---

## 🧪 Probar el SSO Después de Configurar

### Test 1: Acceso Directo al Panel Admin

```bash
1. Abre navegador en modo incógnito (para empezar limpio)
2. Ve a http://localhost:5174
3. Deberías ser redirigido a Keycloak
4. Login con: admin / Admin123!
5. Deberías volver a http://localhost:5174/auth/callback
6. Tokens se guardan en localStorage
7. Redirige automáticamente a dashboard admin (/)
8. ✅ Ves el panel con estadísticas
```

### Test 2: SSO desde Portal Usuario

```bash
1. Abre http://localhost:5173
2. Login con: admin / Admin123!
3. Verás botón "Panel Admin" (morado)
4. Click en "Panel Admin"
5. Abre http://localhost:5174
6. ✅ AUTO-LOGIN inmediato sin pedir credenciales
7. Muestra dashboard admin
```

### Test 3: Usuario sin permisos admin

```bash
1. Login en http://localhost:5173 con: testuser / Test123!
2. NO ves botón "Panel Admin"
3. Si abres manualmente http://localhost:5174
4. SSO login automático
5. ⛔ Mensaje "Acceso Denegado"
6. Mensaje: "No tienes permisos de administrador..."
7. Botón "Ir al Portal de Usuario"
```

---

## 🐛 Diagnóstico de Problemas

### Error: "Too many redirect attempts"

**Síntoma:** Consola del navegador muestra este error

**Causa:** Loop infinito de redirects

**Solución:**
```javascript
// Limpiar sessionStorage
sessionStorage.clear();
localStorage.clear();

// Refrescar página
location.reload();
```

---

### Error: "callback_failed"

**Síntoma:** URL muestra `?error=callback_failed`

**Causa:** Backend no pudo guardar refresh token

**Verificar logs del backend:**
```bash
# Buscar en la terminal del backend
# Debería mostrar:
✓ Connected to PostgreSQL database
GET /auth/keycloak/callback ... 302 ... ms
```

**Si ves error de duplicate key:**
```
Refresh token error: duplicate key value violates unique constraint
```

**Solución:** Ya está arreglado en el código. El backend ahora revoca tokens antiguos antes de insertar nuevos.

---

### Error: Token no se guarda

**Síntoma:** `localStorage.getItem('accessToken')` devuelve `null`

**Causa:** El callback no está recibiendo tokens

**Verificar en DevTools:**
```javascript
// Abrir consola del navegador (F12)
// En la pestaña Application → Local Storage → http://localhost:5174
// Debería mostrar:
accessToken: "eyJhbGc..."
refreshToken: "eyJhbGc..."
```

**Si no están:**
1. Verifica que `/auth/callback` funcione:
   - Abre: `http://localhost:5174/auth/callback?accessToken=test&refreshToken=test`
   - Debería redirigir a `/` y mostrar "Acceso Denegado"
   - Verifica en localStorage que se guardaron "test"

2. Si funciona, el problema es que el backend no está enviando los tokens

---

### Usuario admin ve "Acceso Denegado"

**Síntoma:** Usuario con rol admin no puede acceder

**Verificar roles en JWT:**
```javascript
// En DevTools Console (F12)
const token = localStorage.getItem('accessToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Roles:', payload.roles);
// Debería mostrar: ["admin", "user"]
```

**Si roles está vacío `[]`:**
1. Verificar que el mapper esté configurado en Keycloak
2. Verificar que el usuario tenga roles asignados
3. Hacer logout completo y volver a hacer login

---

### Backend muestra error de CORS

**Síntoma:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Verificar `.env` del backend:**
```bash
FRONTEND_URL=http://localhost:5173
FRONTEND_ADMIN_URL=http://localhost:5174
```

**Verificar `server.js`:**
```javascript
cors({
  origin: [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_ADMIN_URL || 'http://localhost:5174'
  ],
  credentials: true,
})
```

**Solución:** Reiniciar backend después de cambiar `.env`

---

## 📊 Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] Keycloak está corriendo en puerto 8090
- [ ] Backend (Auth Service) está corriendo en puerto 3000
- [ ] Frontend Usuario está corriendo en puerto 5173
- [ ] Frontend Admin está corriendo en puerto 5174
- [ ] Tournament Service está corriendo en puerto 3001
- [ ] Player Service está corriendo en puerto 3002
- [ ] PostgreSQL está corriendo en puerto 5432
- [ ] URIs de redirect configuradas en Keycloak (`http://localhost:5174/*`)
- [ ] Usuario tiene rol "admin" asignado en Keycloak
- [ ] Mapper de roles configurado en Keycloak
- [ ] Backend `.env` incluye `FRONTEND_ADMIN_URL`
- [ ] CORS permite ambos puertos (5173 y 5174)

---

## 🔍 Logs Útiles

### Backend (Auth Service)

**Login exitoso:**
```
GET /auth/keycloak 302 ... ms
GET /auth/keycloak/callback ... 302 ... ms
```

**Login fallido:**
```
Keycloak callback error: ...
GET /auth/keycloak/callback ... 302 .../login?error=callback_failed
```

### Frontend Admin (Consola del navegador F12)

**Flujo correcto:**
```
No token found, redirecting to Keycloak login...
(redirige a Keycloak)
(vuelve a /auth/callback)
Tokens guardados, redirigiendo al dashboard...
(redirige a /)
```

**Loop infinito:**
```
No token found, redirecting to Keycloak login...
No token found, redirecting to Keycloak login...
Too many redirect attempts, stopping loop
```

---

## 💡 Tips Rápidos

1. **Siempre usa modo incógnito** al probar SSO para evitar cachés

2. **Limpia storage antes de probar:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

3. **Verifica orden de inicio:**
   ```bash
   # Primero infraestructura
   docker-compose up -d

   # Luego backends
   cd backend && npm run dev
   cd backend-tournament && npm run dev
   cd backend-player && npm run dev

   # Finalmente frontends
   cd frontend && npm run dev
   cd frontend-admin && npm run dev
   ```

4. **Si todo falla, reinicia todo:**
   ```bash
   # Matar todos los procesos Node.js
   taskkill /F /IM node.exe

   # Reiniciar infraestructura
   docker-compose restart

   # Volver a iniciar servicios
   ```

---

## 📞 Soporte

Si después de seguir esta guía aún tienes problemas:

1. **Captura pantalla** del error
2. **Copia logs** del backend
3. **Copia consola** del navegador (F12)
4. **Verifica checklist** arriba

---

## ✅ Señales de que todo funciona

1. **Backend logs:**
   ```
   GET /auth/keycloak?redirect=http://localhost:5174 302
   GET /auth/keycloak/callback ... 302 .../auth/callback?accessToken=...
   ```

2. **Frontend Admin redirige correctamente:**
   ```
   http://localhost:5174
   → http://localhost:8090/realms/tournament/protocol/openid-connect/auth...
   → http://localhost:3000/auth/keycloak/callback
   → http://localhost:5174/auth/callback?accessToken=...&refreshToken=...
   → http://localhost:5174/
   ```

3. **Dashboard carga con datos:**
   - Muestra nombre del usuario
   - Muestra "Administrador" badge
   - Muestra estadísticas de torneos y jugadores

¡Listo! El SSO debería estar funcionando correctamente 🎉
