import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../utils/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      setUser(response.data.user);
    } catch (error) {
      console.error('Error loading user:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="spinner-gradient mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Cargando Sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 overflow-hidden relative">
      <nav className="glass-dark sticky top-0 z-50 shadow-2xl animate-fadeDown border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-24 items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(102,126,234,0.4)] transform hover:rotate-6 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <div>
                <span className="text-2xl font-black text-white tracking-tighter">UDLA <span className="text-blue-400">ARENA</span></span>
                <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">Tournament Management</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end text-sm">
                <span className="text-white font-bold">{user?.displayName || user?.username}</span>
                <span className="text-gray-400 text-xs">Administrador</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white/10 hover:bg-red-500 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all border border-white/10 hover:border-red-400"
              >
                CERRAR SESIÓN
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <header className="mb-16 animate-fadeIn">
          <h2 className="text-5xl font-black text-gray-900 mb-4 tracking-tighter">MENÚ <span className="text-indigo-600">PRINCIPAL</span></h2>
          <p className="text-gray-500 text-xl font-medium">Bienvenido al centro de mando de Torneos UDLA.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Module 1: Management (CRUDs) */}
          <div
            onClick={() => navigate('/management')}
            className="group relative h-[450px] rounded-[3rem] overflow-hidden cursor-pointer shadow-2xl animate-slideUp"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 to-blue-900 z-0 transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />

            <div className="relative z-10 h-full p-12 flex flex-col justify-between text-white">
              <div>
                <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center text-5xl mb-8 group-hover:bg-white group-hover:text-indigo-900 transition-all duration-500">
                  📁
                </div>
                <h3 className="text-5xl font-black mb-4 tracking-tighter">GESTIÓN <span className="block opacity-60">ADMINISTRATIVA</span></h3>
                <p className="text-indigo-100 text-lg font-medium max-w-xs leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  Control total sobre equipos, jugadores, encuentros y categorías del torneo.
                </p>
              </div>

              <div className="flex items-center gap-4 text-2xl font-black transform translate-y-20 group-hover:translate-y-0 transition-transform duration-500">
                ENTRAR AQUÍ <span>→</span>
              </div>
            </div>

            {/* Background design elements */}
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          </div>

          {/* Module 2: Reports */}
          <div
            onClick={() => navigate('/reports')}
            className="group relative h-[450px] rounded-[3rem] overflow-hidden cursor-pointer shadow-2xl animate-slideUp stagger-delay-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-800 z-0 transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />

            <div className="relative z-10 h-full p-12 flex flex-col justify-between text-white">
              <div>
                <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center text-5xl mb-8 group-hover:bg-white group-hover:text-emerald-900 transition-all duration-500">
                  📉
                </div>
                <h3 className="text-5xl font-black mb-4 tracking-tighter">ANÁLISIS <span className="block opacity-60">DE DATOS</span></h3>
                <p className="text-emerald-500 font-medium max-w-xs leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white px-4 py-2 rounded-xl">
                  Tablas de posiciones, goleadores y estadísticas en tiempo real.
                </p>
              </div>

              <div className="flex items-center gap-4 text-2xl font-black transform translate-y-20 group-hover:translate-y-0 transition-transform duration-500">
                CONSULTAR <span>→</span>
              </div>
            </div>

            {/* Background design elements */}
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          </div>
        </div>

        {/* User Card (Small Footer) */}
        <div className="mt-16 flex justify-center animate-fadeIn stagger-delay-3">
          <div className="bg-white rounded-3xl p-6 shadow-xl flex items-center gap-6 border border-gray-100 max-w-md w-full">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-3xl">
              👤
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Usuario Actual</p>
              <p className="text-xl font-black text-gray-900">{user?.displayName || user?.username}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-50/50 -skew-x-12 transform translate-x-1/2 -z-0" />
    </div>
  );
}
