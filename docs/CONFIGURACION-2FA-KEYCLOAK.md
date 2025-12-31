# Configuración de 2FA (Autenticación de Dos Factores) con Keycloak

## Descripción General

Este documento describe cómo configurar la autenticación de dos factores (2FA) usando OTP (One-Time Password) en Keycloak. Los usuarios utilizarán apps móviles como Google Authenticator o Microsoft Authenticator para generar códigos de 6 dígitos.

## Requisitos Previos

- Keycloak corriendo en http://localhost:8090
- Acceso a Keycloak Admin Console
- App móvil de autenticación instalada (Google Authenticator, Microsoft Authenticator, o Authy)

## Paso 1: Acceder a Keycloak Admin Console

1. Abre tu navegador y ve a: http://localhost:8090
2. Click en "Administration Console"
3. Ingresa las credenciales de administrador:
   - Username: `admin`
   - Password: `admin` (o la que hayas configurado)

## Paso 2: Configurar OTP en el Realm "tournament"

### 2.1 Seleccionar el Realm

1. En el menú superior izquierdo, asegúrate de estar en el realm **"tournament"** (no en "master")
2. Si estás en "master", haz click en el dropdown y selecciona "tournament"

### 2.2 Configurar la Política de OTP

1. En el menú lateral izquierdo, ve a: **Authentication** → **Policies** → **OTP Policy**
2. Configura los siguientes parámetros:

   ```
   OTP Type: Time-Based
   OTP Hash Algorithm: SHA1
   Number of Digits: 6
   Look around window: 3   (⚠️ IMPORTANTE: En versiones antiguas se llamaba "Look Ahead Window")
   OTP Token Period: 30 Seconds
   Reusable token: Off
   ```

   **IMPORTANTE:** El campo "Look around window" es crítico. Este valor define la ventana de tolerancia para compensar pequeñas diferencias de tiempo entre tu servidor y el móvil.
   - Valor mínimo: `1` (muy estricto, puede causar errores)
   - **Valor recomendado: `3` o `5`** (mejor balance entre seguridad y usabilidad)

3. Click en **"Save"**

### 2.3 Configurar el Flujo de Autenticación

1. Ve a: **Authentication** → **Flows**
2. Selecciona el flujo **"Browser"** (este es el flujo que usa Keycloak para login web)
3. Busca la fila que dice **"Browser - Conditional OTP"** o **"OTP Form"**
4. Si no existe, sigue estos pasos para agregarlo:

   a. Click en el botón **"Add execution"** en la fila de "Browser Forms"

   b. Selecciona **"OTP Form"** de la lista

   c. Click en **"Add"**

   d. Cambia el Requirement de **"Disabled"** a **"Required"**

   e. Click en **"Save"**

5. El flujo debe verse así:

   ```
   Browser
     ├─ Cookie (Alternative)
     ├─ Identity Provider Redirector (Alternative)
     └─ Browser Forms (Alternative)
          ├─ Username Password Form (Required)
          └─ OTP Form (Required)  ← Este debe estar en "Required"
   ```

### 2.4 Hacer OTP Obligatorio

Opción A: Requerir OTP para todos los usuarios nuevos

1. Ve a: **Authentication** → **Required Actions**
2. Busca **"Configure OTP"** en la lista
3. Marca el checkbox **"Default Action"**
4. Esto fuerza a los usuarios a configurar OTP en su primer login

Opción B: Requerir OTP solo para usuarios específicos

1. Ve a: **Users** → Selecciona un usuario
2. Ve a la pestaña **"Credentials"**
3. En la sección **"Required User Actions"**, click en **"Add"**
4. Selecciona **"Configure OTP"**
5. Click en **"Save"**

## Paso 3: Probar el Flujo 2FA

### 3.1 Crear un Usuario de Prueba (si no tienes uno)

1. Ve a: **Users** → **Add user**
2. Completa los datos:
   ```
   Username: testuser
   Email: test@example.com
   First Name: Test
   Last Name: User
   Email Verified: ON
   ```
3. Click en **"Create"**
4. Ve a la pestaña **"Credentials"**
5. Click en **"Set Password"**
6. Ingresa una contraseña (ej: `test123`)
7. Desmarca **"Temporary"** si quieres que la contraseña sea permanente
8. Click en **"Save"**

### 3.2 Forzar Configuración de OTP

1. En el mismo usuario, ve a la pestaña **"Required Actions"**
2. Selecciona **"Configure OTP"** del dropdown
3. Click en **"Add"**

### 3.3 Probar el Login con 2FA

1. **Cierra sesión de Keycloak Admin Console** (o usa una ventana de incógnito)
2. Ve a tu aplicación: http://localhost:5173
3. Click en "Iniciar Sesión con Keycloak"
4. Ingresa las credenciales del usuario de prueba:
   - Username: `testuser`
   - Password: `test123`
5. **Primera vez:** Keycloak te mostrará un código QR
   - Abre tu app móvil de autenticación (Google Authenticator, Microsoft Authenticator, etc.)
   - Escanea el código QR
   - La app generará un código de 6 dígitos
   - Ingresa el código en Keycloak
   - Click en **"Submit"**
6. **Siguientes veces:** Después de ingresar usuario/contraseña, Keycloak pedirá el código OTP
   - Abre tu app móvil
   - Copia el código de 6 dígitos
   - Ingresa el código
   - Click en **"Submit"**

## Paso 4: Verificación de Funcionamiento

### Flujo Esperado:

```
1. Usuario va a http://localhost:5173
2. Click en "Iniciar Sesión con Keycloak"
3. Redirige a Keycloak → http://localhost:8090/realms/tournament/protocol/openid-connect/auth
4. Usuario ingresa username + password
5. Keycloak solicita código OTP de 6 dígitos
6. Usuario abre Google Authenticator en su móvil
7. Usuario ingresa el código
8. Keycloak valida el código
9. Redirige de vuelta a la app con tokens JWT
10. Usuario accede al dashboard
```

## Configuraciones Adicionales (Opcional)

### Permitir que usuarios configuren OTP opcionalmente

Si quieres que algunos usuarios puedan usar 2FA pero no sea obligatorio:

1. Ve a: **Authentication** → **Flows**
2. En el flujo "Browser", cambia "OTP Form" de **"Required"** a **"Optional"**
3. Los usuarios pueden configurar OTP desde su cuenta en: http://localhost:8090/realms/tournament/account

### Configurar Recovery Codes

Keycloak puede generar códigos de recuperación en caso de que el usuario pierda su teléfono:

1. Ve a: **Authentication** → **Required Actions**
2. Habilita **"Update OTP"** como acción disponible
3. Los usuarios pueden generar códigos de backup desde su cuenta

## Troubleshooting

### ⚠️ Problema Común: "Invalid authenticator code" (MÁS FRECUENTE)

**Síntoma:** Keycloak rechaza todos los códigos OTP aunque los estés ingresando correctamente.

**Causa:** Desincronización de tiempo entre el servidor Keycloak y tu dispositivo móvil. TOTP es muy sensible a diferencias de tiempo.

**Soluciones (en orden de prioridad):**

1. **SOLUCIÓN RÁPIDA - Aumentar Look around window (RECOMENDADO):**
   - Ve a: **Authentication** → **Policies** → **OTP Policy**
   - Cambia **"Look around window"** de `1` a `3` o `5`
   - Click en **"Save"**
   - Espera a que el código cambie en tu app móvil (30 segundos)
   - Intenta con el código nuevo
   - ✅ Esto resuelve el problema en el 95% de los casos

2. **Sincronizar tiempo de Windows (Si la solución anterior no funciona):**
   - Abre PowerShell como Administrador
   - Ejecuta: `w32tm /resync`
   - O ve a Configuración → Hora e idioma → Sincronizar ahora

3. **Sincronizar Google Authenticator:**
   - Abre la app Google Authenticator
   - Ve a Configuración (⚙️)
   - Selecciona "Corrección de hora para códigos"
   - Click en "Sincronizar ahora"

4. **Verificar hora del sistema:**
   - Asegúrate de que tu PC y móvil tengan la **misma hora exacta**
   - Activa sincronización automática en ambos dispositivos
   - Diferencias de más de 30 segundos causarán errores

5. **Último recurso - Regenerar secreto OTP:**
   - Keycloak Admin Console → Users → Tu usuario
   - Credentials → Delete OTP (si existe)
   - Required Actions → Add "Configure OTP"
   - Cierra sesión e inicia sesión nuevamente
   - Escanea el nuevo QR code

### Problema: "Invalid OTP code" (Otros casos)

**Solución para Linux:**
- En Linux: `sudo ntpdate -s time.nist.gov`

### Problema: No aparece la pantalla de configuración OTP

**Solución:**
- Verifica que el flujo "Browser" tenga "OTP Form" configurado
- Verifica que el usuario tenga "Configure OTP" en Required Actions
- Limpia caché del navegador e intenta de nuevo

### Problema: El código QR no se escanea

**Solución:**
- Puedes ingresar manualmente el secreto (secret key) que aparece debajo del QR
- En Google Authenticator: "+" → "Ingresar una clave de configuración"
- Ingresa el nombre de cuenta y la clave secreta

## Apps Móviles Recomendadas

- **Google Authenticator** (iOS/Android): Más simple, sin backup en la nube
- **Microsoft Authenticator** (iOS/Android): Con backup en la nube, más features
- **Authy** (iOS/Android): Con backup, sincronización multi-dispositivo
- **FreeOTP** (iOS/Android): Open source, sin anuncios

## Seguridad

### Mejores Prácticas:

1. **Backup Codes:** Genera códigos de recuperación para usuarios
2. **Educación:** Instruye a usuarios sobre la importancia del 2FA
3. **Recovery:** Ten un proceso para recuperación si pierden el móvil
4. **Monitoreo:** Revisa logs de intentos fallidos de OTP

### Notas de Seguridad:

- Los códigos OTP expiran cada 30 segundos
- Keycloak acepta códigos con una ventana de tolerancia configurable (Look around window)
  - Valor recomendado: 3 a 5 (balance entre seguridad y usabilidad)
  - Valor de 1 es muy estricto y puede causar problemas
- Los secretos OTP se almacenan encriptados en la base de datos de Keycloak
- No compartas el código QR o la clave secreta con nadie
- Cada código solo puede usarse una vez (Reusable token: Off)

## Estado de Implementación

### ✅ Completado

1. **2FA con Keycloak OTP funcionando correctamente**
   - Configuración de OTP Policy con Look around window = 3
   - Flujo de autenticación Browser configurado con OTP Form requerido
   - Probado con Google Authenticator
   - Códigos de 6 dígitos funcionando correctamente
   - Cumple con requisito de "2FA Móvil" (18% del puntaje)

### ⏳ Pendiente (Futuro)

2. **Configurar 2FA para usuarios de Google OAuth** (proceso más complejo)
   - Los usuarios de Google OAuth actualmente no pasan por 2FA de Keycloak
   - Se requiere configuración adicional para forzar 2FA también en Google OAuth

3. **Documentar el proceso para usuarios finales**
   - Guía de usuario para configurar Google Authenticator
   - Instrucciones de recuperación si pierden el móvil

## Referencias

- [Keycloak OTP Documentation](https://www.keycloak.org/docs/latest/server_admin/#otp-policies)
- [RFC 6238 - TOTP: Time-Based One-Time Password Algorithm](https://tools.ietf.org/html/rfc6238)
