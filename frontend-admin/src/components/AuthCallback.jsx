import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const errorParam = searchParams.get('error');

    // Si hay un error en la URL (ej: callback_failed)
    if (errorParam) {
      console.error('❌ Error en autenticación:', errorParam);
      setError('Error al procesar la autenticación. Por favor, inicia sesión nuevamente en el Portal Usuario.');
      return;
    }

    if (accessToken && refreshToken) {
      // Guardar tokens en localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      console.log('✅ Tokens guardados, redirigiendo al dashboard...');

      // CRÍTICO: Usar replace para evitar que el botón retroceder vuelva aquí
      window.location.replace('/');
    } else {
      console.error('⚠️ No se recibieron tokens en el callback');
      setError('No se pudo completar la autenticación. Por favor, inicia sesión en el Portal Usuario primero.');
    }
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-red-600 text-6xl mb-4 text-center">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Error de Autenticación
          </h2>
          <p className="text-gray-600 mb-6 text-center">{error}</p>
          <button
            onClick={() => window.location.href = 'http://localhost:5173/login'}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg w-full hover:bg-purple-700 transition"
          >
            Ir al Portal de Usuario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Procesando autenticación...</p>
      </div>
    </div>
  );
}
