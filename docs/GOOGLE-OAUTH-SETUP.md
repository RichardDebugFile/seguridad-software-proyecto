# 🔐 Configuración de Google OAuth 2.0

Guía paso a paso para configurar Google OAuth 2.0 en el proyecto.

---

## 📋 Prerequisitos

- Cuenta de Google
- Acceso a [Google Cloud Console](https://console.cloud.google.com/)

---

## 🚀 Pasos de Configuración

### 1. Crear un Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. En la barra superior, haz clic en el selector de proyectos
3. Haz clic en **"Nuevo Proyecto"**
4. Completa:
   - **Nombre del Proyecto**: `Sistema Autenticación Segura` (o el nombre que prefieras)
   - **Organización**: Dejar por defecto o seleccionar si tienes
5. Haz clic en **"Crear"**
6. Espera a que se cree el proyecto (verás una notificación)
7. Selecciona el proyecto recién creado desde el selector de proyectos

### 2. Habilitar la API de Google+

1. En el menú lateral, ve a **"APIs y servicios" → "Biblioteca"**
2. En el buscador, escribe: `Google+ API`
3. Haz clic en **"Google+ API"**
4. Haz clic en **"Habilitar"**
5. Espera a que se habilite (puede tomar unos segundos)

**Nota:** Aunque Google+ ya no existe como red social, la API aún se usa para OAuth.

### 3. Configurar Pantalla de Consentimiento OAuth

1. En el menú lateral, ve a **"APIs y servicios" → "Pantalla de consentimiento de OAuth"**
2. Selecciona **"Externo"** (a menos que uses Google Workspace)
3. Haz clic en **"Crear"**

**Página 1: Información de la aplicación**
- **Nombre de la aplicación**: `Sistema de Autenticación Segura`
- **Correo de asistencia**: Tu email de Google
- **Logotipo de la aplicación**: Opcional
- **Dominios autorizados**: Dejar vacío para desarrollo local
- **Correo del desarrollador**: Tu email de Google
- Haz clic en **"Guardar y continuar"**

**Página 2: Permisos (Scopes)**
- No necesitas agregar permisos adicionales
- Haz clic en **"Guardar y continuar"**

**Página 3: Usuarios de prueba**
- Haz clic en **"Agregar usuarios"**
- Agrega tu email y el de cualquier persona que vaya a probar la app
- Haz clic en **"Agregar"**
- Haz clic en **"Guardar y continuar"**

**Página 4: Resumen**
- Revisa la información
- Haz clic en **"Volver al panel"**

### 4. Crear Credenciales OAuth 2.0

1. En el menú lateral, ve a **"APIs y servicios" → "Credenciales"**
2. Haz clic en **"Crear credenciales"** (botón arriba)
3. Selecciona **"ID de cliente de OAuth"**

**Configuración del ID de cliente:**
- **Tipo de aplicación**: `Aplicación web`
- **Nombre**: `Cliente Web - Desarrollo`

**Orígenes de JavaScript autorizados:**
- Haz clic en **"Agregar URI"**
- Agrega: `http://localhost:5173`
- Agrega: `http://localhost:3000`

**URIs de redireccionamiento autorizados:**
- Haz clic en **"Agregar URI"**
- Agrega: `http://localhost:3000/auth/google/callback`

**IMPORTANTE:** Asegúrate de que la URL sea exactamente:
```
http://localhost:3000/auth/google/callback
```

4. Haz clic en **"Crear"**

### 5. Copiar Credenciales

Después de crear el cliente OAuth, aparecerá un modal con:
- **ID de cliente**: Algo como `123456789-abcdefg.apps.googleusercontent.com`
- **Secreto del cliente**: Algo como `GOCSPX-abcdefg123456`

**¡IMPORTANTE! Copia estas credenciales ahora.**

Si cierras el modal, puedes obtenerlas de nuevo:
1. Ve a **"APIs y servicios" → "Credenciales"**
2. Encuentra tu cliente OAuth 2.0
3. Haz clic en el nombre
4. Verás el **ID de cliente** y puedes ver/copiar el **Secreto del cliente**

### 6. Configurar en el Proyecto

1. Abre el archivo `backend/.env`
2. Actualiza las siguientes variables:

```bash
GOOGLE_CLIENT_ID=tu-id-de-cliente-aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-tu-secreto-aqui
```

**Ejemplo:**
```bash
GOOGLE_CLIENT_ID=123456789-abc123def456ghi789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcDEF123ghiJKL456
```

3. Guarda el archivo

### 7. Reiniciar el Backend

Si el backend está corriendo, reinícialo para que tome las nuevas credenciales:

```bash
# Detener el backend (Ctrl+C si está corriendo)

# Iniciar de nuevo
cd backend
npm run dev
```

---

## ✅ Verificar Configuración

1. Abre http://localhost:5173
2. Haz clic en el botón **"Google"**
3. Deberías ver la pantalla de login de Google
4. Selecciona tu cuenta
5. Autoriza la aplicación
6. Deberías ser redirigido al Dashboard

Si todo funciona, ¡la configuración está completa! 🎉

---

## 🐛 Solución de Problemas

### Error: "redirect_uri_mismatch"

**Causa:** La URI de callback no está autorizada.

**Solución:**
1. Ve a Google Cloud Console → Credenciales
2. Haz clic en tu cliente OAuth
3. En **"URIs de redireccionamiento autorizados"**, verifica que exista exactamente:
   ```
   http://localhost:3000/auth/google/callback
   ```
4. Si no existe, agrégala
5. Haz clic en **"Guardar"**
6. Espera 1-2 minutos para que se propague
7. Intenta de nuevo

### Error: "Access blocked: Authorization Error"

**Causa:** El usuario que intenta autenticarse no está en la lista de usuarios de prueba.

**Solución:**
1. Ve a Google Cloud Console
2. **"APIs y servicios" → "Pantalla de consentimiento de OAuth"**
3. En **"Usuarios de prueba"**, haz clic en **"Agregar usuarios"**
4. Agrega el email que quieres usar para autenticarte
5. Haz clic en **"Guardar"**
6. Intenta de nuevo

### Error: "invalid_client"

**Causa:** El Client ID o Client Secret son incorrectos.

**Solución:**
1. Ve a Google Cloud Console → Credenciales
2. Copia de nuevo el Client ID y Client Secret
3. Verifica que no haya espacios al inicio o final
4. Actualiza `backend/.env`
5. Reinicia el backend

### Error: "API no habilitada"

**Causa:** No se habilitó Google+ API.

**Solución:**
1. Ve a Google Cloud Console
2. **"APIs y servicios" → "Biblioteca"**
3. Busca `Google+ API`
4. Haz clic en **"Habilitar"**
5. Espera 1-2 minutos
6. Intenta de nuevo

---

## 🔒 Seguridad en Producción

Cuando deploys a producción:

### 1. Actualizar URIs Autorizadas

Reemplaza las URIs de desarrollo con las de producción:

**Orígenes de JavaScript autorizados:**
```
https://tu-dominio.com
```

**URIs de redireccionamiento autorizados:**
```
https://tu-dominio.com/auth/google/callback
```

### 2. Publicar la App

1. Ve a **"Pantalla de consentimiento de OAuth"**
2. Haz clic en **"Publicar App"**
3. Sigue el proceso de verificación de Google (puede tomar días)

### 3. Usar Variables de Entorno Seguras

NO uses `.env` en producción. Usa:
- **AWS**: AWS Secrets Manager
- **Azure**: Azure Key Vault
- **GCP**: Secret Manager
- **Heroku**: Config Vars
- **Vercel**: Environment Variables

### 4. Rotar Secretos Regularmente

1. Crea un nuevo Client Secret
2. Actualiza la aplicación con el nuevo secret
3. Deploy
4. Elimina el Client Secret antiguo

---

## 📚 Recursos Adicionales

- [Documentación Oficial de Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Guía de Mejores Prácticas de OAuth](https://oauth.net/2/security-best-practices/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## ✅ Checklist Final

- [ ] Proyecto creado en Google Cloud Console
- [ ] Google+ API habilitada
- [ ] Pantalla de consentimiento configurada
- [ ] Usuario de prueba agregado
- [ ] Credenciales OAuth creadas
- [ ] URIs de callback configuradas correctamente
- [ ] Client ID y Secret copiados a `.env`
- [ ] Backend reiniciado
- [ ] Login con Google probado y funcionando

¡Listo! Google OAuth está configurado correctamente. 🚀
