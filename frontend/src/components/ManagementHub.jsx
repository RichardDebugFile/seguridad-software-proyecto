import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ManagementHub() {
    const navigate = useNavigate();

    const modules = [
        { title: 'Equipos', icon: '⚽', color: 'bg-blue-500', desc: 'Gestionar equipos participantes y sus sedes.' },
        { title: 'Jugadores', icon: '🏃', color: 'bg-green-500', desc: 'Registro de jugadores, fichajes y estadísticas base.' },
        { title: 'Partidos', icon: '🗓️', color: 'bg-orange-500', desc: 'Programación de encuentros y asignación de arbitraje.' },
        { title: 'Categorías', icon: '🏆', color: 'bg-purple-500', desc: 'Definición de categorías y niveles de competencia.' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="glass-dark sticky top-0 z-50 p-4 flex items-center justify-between shadow-lg">
                <button onClick={() => navigate('/dashboard')} className="text-white flex items-center gap-2 hover:text-blue-300 transition-colors font-bold">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver al Menú
                </button>
                <h1 className="text-2xl font-bold text-white tracking-tight">GESTIÓN <span className="text-blue-400">CRUD</span></h1>
                <div className="w-24"></div>
            </nav>

            <main className="flex-1 max-w-7xl mx-auto p-8 w-full">
                <header className="mb-12 animate-slideDown">
                    <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Módulos de Registro</h2>
                    <p className="text-gray-600 text-lg">Selecciona un área para comenzar a registrar o modificar información del torneo.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {modules.map((m, i) => (
                        <div
                            key={i}
                            className="group bg-white rounded-3xl p-8 shadow-xl border border-gray-100 card-hover animate-fadeIn stagger-delay-1 cursor-pointer"
                        >
                            <div className={`${m.color} w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner transform group-hover:rotate-12 transition-transform`}>
                                {m.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">{m.title}</h3>
                            <p className="text-gray-500 leading-relaxed mb-6">{m.desc}</p>
                            <button className="w-full py-3 bg-gray-50 text-gray-900 font-bold rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                Ingresar →
                            </button>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
