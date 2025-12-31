/**
 * Utilidad para limpiar completamente el almacenamiento del navegador
 * Incluye: localStorage, sessionStorage, IndexedDB
 */

/**
 * Limpia todas las bases de datos de IndexedDB
 * Esto elimina las claves de encriptación E2EE y otros datos sensibles
 */
export const clearIndexedDB = async () => {
  try {
    // Obtener todas las bases de datos de IndexedDB
    const databases = await window.indexedDB.databases();

    console.log('Limpiando IndexedDB, bases de datos encontradas:', databases.length);

    // Eliminar cada base de datos
    for (const db of databases) {
      if (db.name) {
        await new Promise((resolve, reject) => {
          const request = window.indexedDB.deleteDatabase(db.name);

          request.onsuccess = () => {
            console.log(`Base de datos "${db.name}" eliminada exitosamente`);
            resolve();
          };

          request.onerror = () => {
            console.error(`Error al eliminar base de datos "${db.name}":`, request.error);
            reject(request.error);
          };

          request.onblocked = () => {
            console.warn(`Eliminación de "${db.name}" bloqueada. Cerrando conexiones...`);
            // La eliminación está bloqueada, probablemente por una conexión abierta
            // Se intentará de nuevo cuando se cierre la conexión
          };
        });
      }
    }

    console.log('IndexedDB limpiado completamente');
    return true;
  } catch (error) {
    console.error('Error al limpiar IndexedDB:', error);
    // No fallar el logout si IndexedDB tiene problemas
    return false;
  }
};

/**
 * Limpia completamente el almacenamiento local
 * Elimina localStorage, sessionStorage y claves de encriptación
 */
export const clearLocalStorage = () => {
  try {
    console.log('Limpiando localStorage...');
    localStorage.clear();
    console.log('localStorage limpiado');
  } catch (error) {
    console.error('Error al limpiar localStorage:', error);
  }
};

/**
 * Limpia sessionStorage
 */
export const clearSessionStorage = () => {
  try {
    console.log('Limpiando sessionStorage...');
    sessionStorage.clear();
    console.log('sessionStorage limpiado');
  } catch (error) {
    console.error('Error al limpiar sessionStorage:', error);
  }
};

/**
 * Limpia TODO el almacenamiento del navegador
 * Debe usarse en logout para asegurar que no queden datos sensibles
 */
export const clearAllStorage = async () => {
  console.log('🧹 Iniciando limpieza completa de almacenamiento...');

  // 1. Limpiar localStorage
  clearLocalStorage();

  // 2. Limpiar sessionStorage
  clearSessionStorage();

  // 3. Limpiar IndexedDB (async)
  await clearIndexedDB();

  console.log('✅ Limpieza completa de almacenamiento finalizada');
};

/**
 * Limpia solo datos de autenticación
 * Usa esto si quieres mantener preferencias del usuario pero cerrar sesión
 */
export const clearAuthData = () => {
  console.log('Limpiando datos de autenticación...');

  // Eliminar tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');

  // Eliminar cualquier evento de logout pendiente
  localStorage.removeItem('logout-event');
  localStorage.removeItem('logout_in_progress');

  console.log('Datos de autenticación limpiados');
};
