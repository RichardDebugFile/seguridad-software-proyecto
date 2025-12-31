import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

/**
 * Componente para proteger rutas del Panel Admin - BALANCEADO
 * Protege contra botón retroceder SIN interferir con flujo normal de login
 */
function ProtectedRoute({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  const redirectToLogin = () => {
    console.log('🚫 [Admin] ACCESO DENEGADO - Redirigiendo a login');
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('http://localhost:5173/login');
  };

  const validateToken = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        return false;
      }

      // Verificar rol admin
      const roles = decoded.roles || [];
      if (!roles.includes('admin')) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  };

  // Validación con el backend para verificar que la sesión sigue activa
  const validateWithBackend = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;

    try {
      const response = await axios.get('http://localhost:3000/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    // Validación inicial - CRÍTICO: Valida con backend al cargar
    const initialValidation = async () => {
      const isValid = await validateWithBackend();
      if (isValid) {
        setIsAuthorized(true);
        setIsValidating(false);
      } else {
        redirectToLogin();
      }
    };

    initialValidation();

    // Bloquear navegación retroceder
    const preventBack = () => {
      window.history.pushState(null, '', window.location.href);
    };
    preventBack();

    // Handler para botón retroceder - CRÍTICO: valida con backend
    const handlePopState = async () => {
      console.log('🔙 [Admin] Navegación retroceder detectada');
      preventBack(); // Re-pushear estado

      // CRÍTICO: Validar con backend para verificar si la sesión sigue activa
      const isValid = await validateWithBackend();
      if (!isValid) {
        console.log('⚠️ [Admin] Sesión inválida al retroceder, redirigiendo...');
        redirectToLogin();
      }
    };

    // CRÍTICO: Validar cuando la página se vuelve visible (botón retroceder)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ [Admin] Página visible, validando sesión con backend...');
        const isValid = await validateWithBackend();
        if (!isValid) {
          console.log('⚠️ [Admin] Sesión inválida al volver, redirigiendo...');
          redirectToLogin();
        }
      }
    };

    // Listener para logout desde otro portal
    const handleStorageChange = (e) => {
      if (e.key === 'logout-event' && e.newValue) {
        console.log('🚪 [Admin] Logout detectado desde otro portal');
        redirectToLogin();
      }
    };

    // Validación periódica - SOLO cada 2 segundos (menos agresiva)
    const intervalId = setInterval(() => {
      if (!validateToken()) {
        console.log('⚠️ [Admin] Token inválido detectado en interval');
        redirectToLogin();
      }
    }, 2000);

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  if (isValidating || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
