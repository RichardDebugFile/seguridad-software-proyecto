# 🔐 Sistema de Mensajería con Encriptación End-to-End (E2EE)

## Tabla de Contenidos

- [Introducción](#introducción)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Flujo de Encriptación](#flujo-de-encriptación)
- [Configuración](#configuración)
- [Uso del Sistema](#uso-del-sistema)
- [Detalles Técnicos](#detalles-técnicos)
- [Seguridad](#seguridad)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Introducción

El sistema de mensajería implementa **encriptación End-to-End (E2EE)** completa, garantizando que:

- ✅ **Solo el remitente y destinatario** pueden leer los mensajes
- ✅ **El servidor NO puede leer** el contenido de los mensajes (zero-knowledge backend)
- ✅ **Las claves privadas nunca abandonan** el navegador del usuario
- ✅ **Un KMS externo profesional** (HashiCorp Vault) gestiona las claves públicas
- ✅ **Encriptación híbrida** (RSA-4096 + AES-256-GCM) para máxima seguridad y rendimiento

### Casos de Uso

- Mensajería privada entre usuarios del sistema
- Comunicaciones confidenciales que requieren privacidad absoluta
- Demostración de implementación de E2EE en aplicaciones web

---

## Arquitectura del Sistema

### Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Browser)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Chat.jsx                                                       │
│  ├─ Interfaz de usuario del chat                               │
│  └─ Gestión del flujo de mensajes                              │
│                                                                  │
│  encryption.js (WebCrypto API)                                  │
│  ├─ Generación de claves RSA-4096                              │
│  ├─ Almacenamiento de clave privada en IndexedDB               │
│  ├─ Encriptación híbrida (RSA + AES-256-GCM)                   │
│  └─ Desencriptación de mensajes recibidos                      │
│                                                                  │
│  messageApi.js                                                  │
│  └─ Cliente HTTP para Message Service                          │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ HTTPS
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    MESSAGE SERVICE (Backend)                     │
│                        Puerto 3003                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  message.routes.js                                              │
│  ├─ POST /api/keys - Subir clave pública a Vault               │
│  ├─ GET /api/keys/:userId - Obtener clave pública              │
│  ├─ POST /api/messages - Guardar mensaje encriptado            │
│  ├─ GET /api/messages - Recuperar mensajes encriptados         │
│  └─ ... (otros endpoints)                                       │
│                                                                  │
│  vault.js                                                       │
│  └─ Integración con HashiCorp Vault (KMS)                      │
│                                                                  │
│  database.js                                                    │
│  └─ PostgreSQL (almacena mensajes ENCRIPTADOS)                 │
│                                                                  │
└──────┬────────────────────────────────────┬─────────────────────┘
       │                                    │
       │                                    │
┌──────▼──────────────┐          ┌─────────▼──────────────┐
│  HashiCorp Vault    │          │   PostgreSQL           │
│  (KMS - Port 8200)  │          │   (message_db)         │
├─────────────────────┤          ├────────────────────────┤
│                     │          │                        │
│ KV v2 Engine:       │          │ messages table:        │
│ user-keys/          │          │ - id                   │
│   ├─ user-1         │          │ - sender_id            │
│   │  └─ publicKey   │          │ - receiver_id          │
│   ├─ user-2         │          │ - encrypted_content    │
│   │  └─ publicKey   │          │ - encrypted_key        │
│   └─ ...            │          │ - iv                   │
│                     │          │ - created_at           │
│ Almacena claves     │          │ - read_at              │
│ públicas RSA en     │          │                        │
│ formato JWK         │          │ Todo almacenado        │
│                     │          │ ENCRIPTADO             │
└─────────────────────┘          └────────────────────────┘
```

### Flujo de Datos

1. **Generación de Claves (Primera vez)**
   ```
   Usuario → Chat.jsx → encryption.js → Genera RSA-4096 keypair
                                       ↓
                            Clave Privada → IndexedDB (local)
                            Clave Pública → Message Service → Vault
   ```

2. **Envío de Mensaje**
   ```
   Usuario escribe mensaje → Chat.jsx
                            ↓
   Obtener clave pública del destinatario ← Vault ← Message Service
                            ↓
   encryption.js:
     - Generar clave AES-256 aleatoria
     - Encriptar mensaje con AES-GCM
     - Encriptar clave AES con RSA pública del destinatario
     - Generar IV aleatorio
                            ↓
   Enviar (encrypted_content, encrypted_key, iv) → Message Service → PostgreSQL
   ```

3. **Recepción de Mensaje**
   ```
   Message Service → Recuperar mensaje encriptado de PostgreSQL
                            ↓
   Chat.jsx ← {encrypted_content, encrypted_key, iv}
                            ↓
   encryption.js:
     - Cargar clave privada RSA desde IndexedDB
     - Desencriptar clave AES con RSA privada
     - Desencriptar mensaje con clave AES
                            ↓
   Mostrar mensaje en interfaz
   ```

---

## Flujo de Encriptación

### 1. Inicialización (Primera vez que el usuario accede al chat)

```javascript
// Paso 1: Verificar si el usuario ya tiene claves
const hasKeys = await hasPrivateKey(userId);

if (!hasKeys) {
  // Paso 2: Generar par de claves RSA-4096
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  // Paso 3: Guardar clave privada en IndexedDB (local)
  await savePrivateKey(userId, keyPair.privateKey);

  // Paso 4: Exportar clave pública a formato JWK
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);

  // Paso 5: Subir clave pública a HashiCorp Vault
  await messageService.uploadPublicKey(publicKeyJwk);
}
```

### 2. Encriptación de Mensajes (Hybrid Encryption)

El sistema utiliza **encriptación híbrida** combinando RSA y AES:

- **RSA-4096:** Para encriptar la clave AES (seguro pero lento)
- **AES-256-GCM:** Para encriptar el contenido del mensaje (rápido)

```javascript
// Paso 1: Generar clave AES-256 aleatoria (única por mensaje)
const aesKey = await crypto.subtle.generateKey(
  { name: 'AES-GCM', length: 256 },
  true,
  ['encrypt', 'decrypt']
);

// Paso 2: Generar IV (Initialization Vector) aleatorio de 12 bytes
const iv = crypto.getRandomValues(new Uint8Array(12));

// Paso 3: Encriptar el mensaje con AES-256-GCM
const encryptedContent = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv: iv },
  aesKey,
  new TextEncoder().encode(message)
);

// Paso 4: Exportar la clave AES a formato raw
const exportedAesKey = await crypto.subtle.exportKey('raw', aesKey);

// Paso 5: Obtener clave pública RSA del destinatario desde Vault
const recipientPublicKeyJwk = await messageService.getPublicKey(recipientId);
const recipientPublicKey = await crypto.subtle.importKey(
  'jwk',
  recipientPublicKeyJwk,
  { name: 'RSA-OAEP', hash: 'SHA-256' },
  true,
  ['encrypt']
);

// Paso 6: Encriptar la clave AES con RSA pública del destinatario
const encryptedAesKey = await crypto.subtle.encrypt(
  { name: 'RSA-OAEP' },
  recipientPublicKey,
  exportedAesKey
);

// Paso 7: Convertir a Base64 para transmisión
return {
  encryptedContent: arrayBufferToBase64(encryptedContent),
  encryptedKey: arrayBufferToBase64(encryptedAesKey),
  iv: arrayBufferToBase64(iv),
};
```

### 3. Desencriptación de Mensajes

```javascript
// Paso 1: Convertir de Base64 a ArrayBuffer
const encryptedContentBuffer = base64ToArrayBuffer(encryptedContent);
const encryptedKeyBuffer = base64ToArrayBuffer(encryptedKey);
const ivBuffer = base64ToArrayBuffer(iv);

// Paso 2: Cargar clave privada RSA desde IndexedDB
const privateKey = await loadPrivateKey(userId);

// Paso 3: Desencriptar la clave AES con RSA privada
const aesKeyBuffer = await crypto.subtle.decrypt(
  { name: 'RSA-OAEP' },
  privateKey,
  encryptedKeyBuffer
);

// Paso 4: Importar la clave AES
const aesKey = await crypto.subtle.importKey(
  'raw',
  aesKeyBuffer,
  { name: 'AES-GCM', length: 256 },
  false,
  ['decrypt']
);

// Paso 5: Desencriptar el mensaje con AES
const decryptedContent = await crypto.subtle.decrypt(
  { name: 'AES-GCM', iv: ivBuffer },
  aesKey,
  encryptedContentBuffer
);

// Paso 6: Convertir a texto
const message = new TextDecoder().decode(decryptedContent);
return message;
```

---

## Configuración

### Prerequisitos

1. **Docker y Docker Compose** instalados
2. **Node.js v18+** y npm
3. **PostgreSQL** (via Docker)
4. **HashiCorp Vault** (via Docker)

### Paso 1: Configurar Docker

El archivo `docker-compose.yml` ya incluye Vault:

```yaml
vault:
  image: hashicorp/vault:latest
  container_name: security-vault
  environment:
    - VAULT_DEV_ROOT_TOKEN_ID=dev-root-token
    - VAULT_DEV_LISTEN_ADDRESS=0.0.0.0:8200
  ports:
    - "8200:8200"
  cap_add:
    - IPC_LOCK
  networks:
    - security-network
  command: server -dev
```

Iniciar servicios Docker:

```bash
docker-compose up -d
```

### Paso 2: Crear la Base de Datos de Mensajes

Conectarse a PostgreSQL y crear la base de datos:

```bash
docker exec -it security-postgres psql -U postgres -c "CREATE DATABASE message_db;"
```

### Paso 3: Configurar Message Service

Crear archivo `.env` en `backend-message/`:

```bash
PORT=3003
DB_HOST=localhost
DB_PORT=5432
DB_NAME=message_db
DB_USER=postgres
DB_PASSWORD=postgres123
AUTH_SERVICE_URL=http://localhost:3000

# HashiCorp Vault Configuration
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=dev-root-token
```

### Paso 4: Instalar Dependencias

```bash
cd backend-message
npm install
```

### Paso 5: Iniciar Message Service

```bash
npm run dev
```

El servicio iniciará en `http://localhost:3003`

### Paso 6: Verificar Vault

Acceder a Vault UI:

```
URL: http://localhost:8200
Token: dev-root-token
```

---

## Uso del Sistema

### Para Usuarios

#### 1. Acceder al Chat

1. Inicia sesión en el Portal Usuario (http://localhost:5173)
2. Haz clic en el botón **"Chat Seguro"** 🔒
3. El sistema generará automáticamente tus claves de encriptación

#### 2. Enviar un Mensaje

1. Ingresa el **User ID** del destinatario en el campo "Recipient User ID"
2. Haz clic en **"Load Chat"** para cargar conversación existente (opcional)
3. Escribe tu mensaje en el campo de texto
4. Haz clic en **"Send 🔒"**
5. El mensaje se encriptará automáticamente y se enviará

#### 3. Leer Mensajes

1. Ingresa el User ID de la persona con quien quieres chatear
2. Haz clic en **"Load Chat"**
3. Los mensajes se desencriptarán automáticamente y se mostrarán

**Nota:** Solo puedes leer:
- Mensajes que **TE enviaron** (encriptados con tu clave pública)
- Mensajes que **TÚ enviaste** (guardados en caché local)

### Para Desarrolladores

#### Usar la API directamente

**1. Subir clave pública:**

```javascript
const response = await fetch('http://localhost:3003/api/keys', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    publicKey: publicKeyJwk, // JWK format
  }),
});
```

**2. Obtener clave pública de otro usuario:**

```javascript
const response = await fetch(`http://localhost:3003/api/keys/${recipientId}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
const { publicKey } = await response.json();
```

**3. Enviar mensaje encriptado:**

```javascript
const response = await fetch('http://localhost:3003/api/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    receiver_id: recipientId,
    encrypted_content: encryptedContent, // Base64
    encrypted_key: encryptedKey,         // Base64
    iv: iv,                              // Base64
  }),
});
```

**4. Obtener mensajes:**

```javascript
const response = await fetch('http://localhost:3003/api/messages?userId=' + recipientId, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
const { messages } = await response.json();
```

---

## Detalles Técnicos

### Algoritmos de Encriptación

| Componente | Algoritmo | Tamaño de Clave | Uso |
|------------|-----------|-----------------|-----|
| **Asimétrica** | RSA-OAEP | 4096 bits | Encriptar claves AES |
| **Simétrica** | AES-GCM | 256 bits | Encriptar contenido de mensajes |
| **Hash** | SHA-256 | 256 bits | Hash para RSA-OAEP |
| **IV** | Random | 12 bytes | Initialization Vector para AES-GCM |

### Formato de Almacenamiento

#### Clave Pública (en Vault)

```json
{
  "kty": "RSA",
  "n": "...", // Modulus (Base64URL)
  "e": "AQAB", // Exponent (65537)
  "alg": "RSA-OAEP-256",
  "ext": true
}
```

#### Mensaje Encriptado (en PostgreSQL)

```javascript
{
  id: 123,
  sender_id: 1,
  receiver_id: 2,
  encrypted_content: "base64-encoded-aes-encrypted-message",
  encrypted_key: "base64-encoded-rsa-encrypted-aes-key",
  iv: "base64-encoded-initialization-vector",
  created_at: "2025-01-15T10:30:00Z",
  read_at: null
}
```

### Base de Datos Schema

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  encrypted_content TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  CONSTRAINT messages_sender_receiver_check CHECK (sender_id != receiver_id)
);

CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id);
```

### Vault KV v2 Structure

```
user-keys/ (KV v2 secrets engine)
├── data/
│   ├── user-1
│   │   └── publicKey: {...}
│   │       createdAt: "2025-01-15T10:00:00Z"
│   ├── user-2
│   │   └── publicKey: {...}
│   │       createdAt: "2025-01-15T10:05:00Z"
│   └── ...
```

---

## Seguridad

### Medidas de Seguridad Implementadas

#### ✅ Encriptación

- **RSA-4096:** Considerado seguro hasta 2030+ según NIST
- **AES-256-GCM:** Estándar de cifrado aprobado por NSA para TOP SECRET
- **WebCrypto API:** Implementación nativa y auditada del navegador
- **IV aleatorio:** Cada mensaje tiene un IV único (previene ataques de patrón)
- **Clave AES única:** Cada mensaje usa una clave AES diferente

#### ✅ Gestión de Claves

- **Claves privadas locales:** Nunca salen del navegador (IndexedDB)
- **Vault como KMS:** Gestión profesional de claves públicas
- **Sin acceso del servidor:** Backend no puede acceder a claves privadas
- **Separación de responsabilidades:** KMS externo vs. servidor de mensajes

#### ✅ Autenticación y Autorización

- **JWT tokens:** Todos los endpoints requieren autenticación
- **Verificación de identidad:** El servidor verifica que solo accedas a tus mensajes
- **No hay trusted relay:** El servidor no puede leer ni modificar mensajes

#### ✅ Protección contra Ataques

| Ataque | Protección |
|--------|------------|
| **Man-in-the-Middle (MitM)** | HTTPS + Claves públicas en Vault |
| **Replay Attacks** | IV único por mensaje |
| **Padding Oracle** | AES-GCM (authenticated encryption) |
| **Key Compromise** | Claves privadas nunca transmitidas |
| **Database Breach** | Mensajes indescifrables sin clave privada |
| **Server Compromise** | Zero-knowledge backend |

### Limitaciones Conocidas

#### ⚠️ Mensajes Enviados

**Problema:** El remitente no puede leer sus propios mensajes enviados después de cerrar sesión.

**Causa:** Los mensajes se encriptan con la clave pública del **destinatario**, no del remitente.

**Solución actual:** Caché en `localStorage` (temporal)
```javascript
localStorage.setItem(`sent-msg-${messageId}`, message);
```

**Solución recomendada para producción:**
- **Dual encryption:** Encriptar el mensaje dos veces:
  1. Con clave pública del destinatario (para que pueda leerlo)
  2. Con clave pública del remitente (para que pueda releerlo)
- Almacenar ambas versiones en la base de datos

#### ⚠️ Recuperación de Claves

**Problema:** Si el usuario pierde su clave privada (borra IndexedDB), pierde acceso a sus mensajes.

**Impacto:** Los mensajes recibidos se vuelven permanentemente indescifrables.

**Mitigaciones posibles:**
- Exportación/backup de clave privada (cifrada con contraseña)
- Key escrow con recuperación multi-factor
- Split-key recovery con múltiples dispositivos

#### ⚠️ Modo Desarrollo de Vault

**Problema:** Vault está en modo `dev` (datos en memoria, no persistentes).

**Para producción:**
- Usar Vault en modo producción con backend persistente (Consul, etcd, etc.)
- Habilitar TLS/SSL para Vault
- Implementar políticas de acceso granulares
- Usar AppRole o Kubernetes auth en lugar de root token

#### ⚠️ Forward Secrecy

El sistema **NO** implementa Perfect Forward Secrecy (PFS).

**Consecuencia:** Si una clave privada se compromete en el futuro, todos los mensajes históricos pueden ser desencriptados.

**Solución:** Implementar protocolo con PFS como Signal Protocol o Double Ratchet Algorithm.

---

## Troubleshooting

### Error: "Encryption keys not found"

**Causa:** El usuario no ha generado claves de encriptación.

**Solución:**
1. Ir a http://localhost:5173/chat
2. Esperar a que se muestre "🔒 Encrypted" en la barra de navegación
3. Intentar enviar mensaje nuevamente

### Error: "Recipient has not registered encryption keys"

**Causa:** El destinatario nunca ha abierto el chat y no tiene claves públicas.

**Solución:**
1. Pedir al destinatario que acceda al chat al menos una vez
2. Esto generará sus claves automáticamente
3. Intentar enviar mensaje nuevamente

### Error: "Failed to decrypt message"

**Causa:** Posibles razones:
- Clave privada no encontrada en IndexedDB
- Mensaje encriptado corrupto
- Mensaje encriptado con clave pública diferente

**Solución:**
1. Verificar que tienes tu clave privada:
   ```javascript
   // En la consola del navegador
   const db = await indexedDB.open('SecureMessagingDB', 1);
   ```
2. Si no hay clave privada, se perdieron tus mensajes anteriores
3. Nuevos mensajes se encriptarán con nuevas claves

### Error: "Vault connection failed"

**Causa:** HashiCorp Vault no está corriendo o no es accesible.

**Solución:**
```bash
# Verificar que Vault está corriendo
docker ps | grep vault

# Reiniciar Vault si es necesario
docker-compose restart vault

# Verificar logs
docker-compose logs vault

# Probar acceso manual
curl http://localhost:8200/v1/sys/health
```

### Error: "Database 'message_db' does not exist"

**Causa:** La base de datos no fue creada.

**Solución:**
```bash
# Crear la base de datos manualmente
docker exec -it security-postgres psql -U postgres -c "CREATE DATABASE message_db;"

# Reiniciar Message Service
cd backend-message
npm run dev
```

### Error: "Cannot read messages after clearing browser data"

**Causa:** IndexedDB fue borrada, perdiste tu clave privada.

**Consecuencia:** Los mensajes antiguos son **permanentemente indescifrables**.

**Solución:**
- No hay recuperación posible para mensajes antiguos
- Genera nuevas claves para futuros mensajes
- Los nuevos mensajes usarán las nuevas claves

---

## FAQ

### ¿El servidor puede leer mis mensajes?

**No.** El servidor solo almacena mensajes encriptados. Solo tienes la clave privada necesaria para desencriptar los mensajes enviados a ti. Esto se llama "zero-knowledge backend".

### ¿Qué pasa si olvido mi contraseña?

Las claves de encriptación **NO** están protegidas por tu contraseña de usuario. Están almacenadas en IndexedDB del navegador. Si borras los datos del navegador, pierdes acceso a tus mensajes históricos.

### ¿Puedo usar el chat desde múltiples dispositivos?

Actualmente **NO**. Las claves están almacenadas localmente en cada navegador. Para soporte multi-dispositivo, necesitarías:

1. Sincronizar claves privadas entre dispositivos (riesgoso)
2. Implementar un sistema de dispositivos autorizados
3. Usar un protocolo como Signal Protocol que maneja múltiples dispositivos

### ¿Es realmente seguro?

**Sí, para el caso de uso previsto (educativo/demostración).** Usa algoritmos estándares de la industria:

- RSA-4096 (seguro hasta 2030+)
- AES-256-GCM (aprobado por NSA para TOP SECRET)
- WebCrypto API (implementación auditada)

**Limitaciones para uso en producción:**
- No tiene Perfect Forward Secrecy (PFS)
- Vault en modo desarrollo (no persistente)
- No tiene backup/recuperación de claves
- No tiene soporte multi-dispositivo
- Sent messages caching es temporal

### ¿Qué algoritmos de encriptación se usan?

- **RSA-OAEP con SHA-256:** Para encriptar claves AES (asimétrica)
- **AES-256-GCM:** Para encriptar el contenido de los mensajes (simétrica)
- **Hybrid encryption:** Combina lo mejor de ambos mundos

### ¿Por qué usar encriptación híbrida?

- **RSA es lento** para encriptar datos grandes
- **AES es rápido** pero requiere compartir una clave secreta
- **Híbrido:** Usa AES para el mensaje (rápido) y RSA para la clave AES (seguro)

### ¿Dónde se almacenan las claves?

- **Clave Privada:** IndexedDB del navegador (nunca sale del cliente)
- **Clave Pública:** HashiCorp Vault (KMS externo)
- **Mensajes Encriptados:** PostgreSQL (backend)

### ¿Puedo exportar mi clave privada?

Actualmente **NO** hay una función de exportación. La clave está en IndexedDB y podrías accederla manualmente con herramientas de desarrollo, pero:

- Es complejo extraerla
- Es riesgoso (podría filtrarse)
- No está diseñado para eso

### ¿Qué pasa si HashiCorp Vault se cae?

- **No podrás enviar nuevos mensajes** (necesitas la clave pública del destinatario)
- **Podrás leer mensajes existentes** (tu clave privada está en el navegador)
- **No pierdes tus claves** (están almacenadas localmente)

### ¿Es compatible con otros sistemas E2EE?

**No.** Usa un esquema personalizado. No es compatible con:
- Signal Protocol
- PGP/GPG
- OTR (Off-the-Record)
- Matrix/Olm

---

## Referencias

### Estándares y Especificaciones

- [Web Crypto API Specification](https://www.w3.org/TR/WebCryptoAPI/)
- [NIST SP 800-57: Key Management](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)
- [RFC 3447: RSA-OAEP](https://datatracker.ietf.org/doc/html/rfc3447)
- [NIST SP 800-38D: AES-GCM](https://csrc.nist.gov/publications/detail/sp/800-38d/final)

### HashiCorp Vault

- [Vault Documentation](https://www.vaultproject.io/docs)
- [KV Secrets Engine v2](https://www.vaultproject.io/docs/secrets/kv/kv-v2)
- [Vault Production Hardening](https://learn.hashicorp.com/tutorials/vault/production-hardening)

### Criptografía

- [Applied Cryptography by Bruce Schneier](https://www.schneier.com/books/applied-cryptography/)
- [Cryptography Engineering by Ferguson, Schneier, Kohno](https://www.schneier.com/books/cryptography-engineering/)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

---

## Licencia

Este proyecto es para fines **educativos**. Desarrollado como parte del curso de **Desarrollo de Software Seguro**.

**Periodo 3 - 2025**

---

## Contacto y Soporte

Para reportar problemas o preguntas sobre el sistema de mensajería E2EE, consulta el README principal o abre un issue en el repositorio del proyecto.
