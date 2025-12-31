import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, tournamentService, playerService } from '../utils/api';
import { clearAllStorage } from '../utils/cleanStorage';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [players, setPlayers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadUser();

    // Escuchar eventos de logout desde otros portales/pestañas
    const handleStorageChange = (e) => {
      if (e.key === 'logout-event' && e.newValue) {
        console.log('Logout detectado desde otro portal, cerrando sesión...');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = 'http://localhost:5173/login';
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadUser = async () => {
    try {
      // ProtectedRoute ya verificó que hay token válido y rol admin
      // Solo necesitamos cargar los datos del usuario
      console.log('✅ Cargando datos del usuario administrador...');

      const response = await authService.getCurrentUser();
      const userData = response.data.user;
      setUser(userData);

      // Verificar rol admin (doble verificación por seguridad)
      if (!userData.roles || !userData.roles.includes('admin')) {
        console.error('⚠️ Usuario sin rol admin detectado');
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
        loadData(); // Cargar torneos y jugadores
      }
    } catch (error) {
      console.error('❌ Error loading user:', error);

      // Si el error es 401 (no autorizado), limpiar tokens y redirigir a login
      if (error.response && error.response.status === 401) {
        console.log('🔄 Token inválido, limpiando y redirigiendo...');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = 'http://localhost:5173/login';
        return;
      }

      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [tournamentsRes, playersRes] = await Promise.all([
        tournamentService.getAll(),
        playerService.getAll()
      ]);
      setTournaments(tournamentsRes.data.tournaments || []);
      setPlayers(playersRes.data.players || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 [Admin] Iniciando proceso de logout...');

      // 1. Marcar logout en progreso (evita que el interceptor refresque el token)
      localStorage.setItem('logout_in_progress', 'true');

      // 2. Notificar a otros portales/pestañas sobre el logout
      localStorage.setItem('logout-event', Date.now().toString());

      // 3. Intentar revocar tokens en el backend
      const response = await authService.logout();

      // 4. Limpiar COMPLETAMENTE el almacenamiento (localStorage, sessionStorage, IndexedDB)
      await clearAllStorage();

      console.log('✅ [Admin] Logout completado, redirigiendo...');

      // 5. CRÍTICO: Limpiar historial del navegador para prevenir botón retroceder
      // Reemplazar todas las entradas del historial con la página de login
      const loginUrl = 'http://localhost:5173/login';
      window.history.pushState(null, '', window.location.href);
      window.history.pushState(null, '', window.location.href);
      window.history.pushState(null, '', window.location.href);
      window.history.replaceState(null, '', window.location.href);

      // 6. Redirigir a Keycloak logout si es usuario de Keycloak (cierra SSO)
      if (response.data.keycloakLogoutUrl) {
        console.log('🔑 [Admin] Redirigiendo a Keycloak logout para cerrar SSO...');
        window.location.replace(response.data.keycloakLogoutUrl);
      } else {
        // Redirigir al Portal Usuario si no es Keycloak
        window.location.replace(loginUrl);
      }
    } catch (error) {
      console.error('❌ [Admin] Error durante logout:', error);

      // Incluso si falla el backend, limpiar todo localmente
      localStorage.setItem('logout-event', Date.now().toString());
      await clearAllStorage();

      // Limpiar historial antes de redirigir
      const loginUrl = 'http://localhost:5173/login';
      window.history.pushState(null, '', window.location.href);
      window.history.pushState(null, '', window.location.href);
      window.history.pushState(null, '', window.location.href);
      window.history.replaceState(null, '', window.location.href);

      console.log('✅ [Admin] Almacenamiento limpiado, redirigiendo a login...');
      window.location.replace(loginUrl);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Si no es admin, mostrar mensaje de acceso denegado
  if (!isAdmin) {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    let errorMessage = 'No tienes permisos de administrador para acceder a este panel.';

    if (error === 'callback_failed') {
      errorMessage = 'Error al procesar la autenticación. Por favor, intenta nuevamente o contacta al administrador.';
    } else if (error === 'keycloak_auth_failed') {
      errorMessage = 'Error al autenticarse con Keycloak. Verifica tus credenciales.';
    } else if (!localStorage.getItem('accessToken')) {
      errorMessage = 'No se encontró una sesión activa. Por favor, inicia sesión primero en el Portal de Usuario.';
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-red-600 text-6xl mb-4 text-center">⛔</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            {errorMessage}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = 'http://localhost:5173'}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg w-full hover:bg-indigo-700 transition"
            >
              Ir al Portal de Usuario
            </button>
            {!error && (
              <button
                onClick={() => {
                  sessionStorage.removeItem('keycloak_redirect_attempt');
                  window.location.href = 'http://localhost:3000/auth/keycloak?redirect=http://localhost:5174';
                }}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg w-full hover:bg-purple-700 transition"
              >
                Intentar Login de Nuevo
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="ml-3 text-xl font-bold text-white">
                  Panel de Administración
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  console.log('🔄 Navegando a Portal Usuario vía Keycloak SSO...');
                  // Redirigir a autenticación de Keycloak
                  // Como ya hay sesión SSO activa en Keycloak, auto-autentica sin pedir credenciales
                  // Después del login, redirige al Portal Usuario con nuevos tokens
                  window.location.href = 'http://localhost:3000/auth/keycloak?redirect=http://localhost:5173';
                }}
                className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                Portal Usuario
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Bienvenido, {user?.displayName || user?.username} 👨‍💼
                </h2>
                <p className="text-gray-600 mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    🔑 Administrador
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-900">Torneos</p>
                  <p className="text-2xl font-bold text-purple-700">{tournaments.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-900">Jugadores</p>
                  <p className="text-2xl font-bold text-blue-700">{players.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-900">Microservicios</p>
                  <p className="text-2xl font-bold text-green-700">3</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`${
                    activeTab === 'overview'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Resumen
                </button>
                <button
                  onClick={() => setActiveTab('tournaments')}
                  className={`${
                    activeTab === 'tournaments'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Torneos
                </button>
                <button
                  onClick={() => setActiveTab('players')}
                  className={`${
                    activeTab === 'players'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Jugadores
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Arquitectura de Microservicios</h3>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <span className="flex-shrink-0 w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                        <span className="font-medium">Auth Service</span>
                        <span className="ml-auto text-gray-600">puerto 3000</span>
                      </li>
                      <li className="flex items-center">
                        <span className="flex-shrink-0 w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                        <span className="font-medium">Tournament Service</span>
                        <span className="ml-auto text-gray-600">puerto 3001</span>
                      </li>
                      <li className="flex items-center">
                        <span className="flex-shrink-0 w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                        <span className="font-medium">Player Service</span>
                        <span className="ml-auto text-gray-600">puerto 3002</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'tournaments' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Lista de Torneos</h3>
                  {tournaments.length === 0 ? (
                    <p className="text-gray-600">No hay torneos registrados aún.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participantes</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {tournaments.map((tournament) => (
                            <tr key={tournament.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tournament.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tournament.status}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tournament.max_participants}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'players' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Lista de Jugadores</h3>
                  {players.length === 0 ? (
                    <p className="text-gray-600">No hay jugadores registrados aún.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ranking</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {players.map((player) => (
                            <tr key={player.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{player.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{player.ranking}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
