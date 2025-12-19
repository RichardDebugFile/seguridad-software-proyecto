import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ReportsHub() {
    const navigate = useNavigate();

    const reports = [
        { title: 'Tabla de Posiciones', icon: '📊', color: 'bg-indigo-600', desc: 'Puntos, goles a favor, en contra y diferencia de goles.' },
        { title: 'Goleadores pichichi', icon: '🎯', color: 'bg-red-500', desc: 'Ranking de los máximos anotadores del torneo.' },
        { title: 'Sanciones / Tarjetas', icon: '🟨', color: 'bg-yellow-500', desc: 'Detalle de amonestaciones y suspensiones vigentes.' },
        { title: 'Historial de Partidos', icon: '📜', color: 'bg-sky-500', desc: 'Resultados históricos y comparativas entre equipos.' },
    ];

    return (
        <div className="min-h-screen bg-neutral-900 flex flex-col text-white">
            <nav className="bg-black/50 backdrop-blur-md sticky top-0 z-50 p-4 flex items-center justify-between border-b border-white/10 shadow-2xl">
                <button onClick={() => navigate('/dashboard')} className="text-white flex items-center gap-2 hover:text-indigo-400 transition-colors font-bold">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Panel Principal
                </button>
                <h1 className="text-2xl font-bold tracking-tighter">ANÁLISIS <span className="text-red-500">& REPORTES</span></h1>
                <div className="w-24"></div>
            </nav>

            <main className="flex-1 max-w-7xl mx-auto p-8 w-full">
                <header className="mb-12 animate-fadeIn">
                    <h2 className="text-5xl font-black mb-4">Visualización de Datos</h2>
                    <p className="text-gray-400 text-xl font-light">Monitorea el progreso del campeonato con reportes en tiempo real.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {reports.map((r, i) => (
                        <div
                            key={i}
                            className="relative overflow-hidden bg-white/5 border border-white/10 rounded-[2rem] p-10 hover:bg-white/10 transition-all duration-500 group cursor-pointer animate-slideUp stagger-delay-1"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className={`${r.color} w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                                    {r.icon}
                                </div>
                                <div className="text-white/20 text-7xl font-black absolute top-0 right-0 p-4 transform translate-x-8 -translate-y-8 select-none">
                                    #{i + 1}
                                </div>
                            </div>

                            <h3 className="text-3xl font-bold mb-4">{r.title}</h3>
                            <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-md">{r.desc}</p>

                            <div className="flex items-center gap-3 text-red-500 font-bold group-hover:gap-5 transition-all">
                                Generar Reporte <span className="text-2xl">→</span>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
