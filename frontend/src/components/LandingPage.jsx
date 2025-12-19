import React from 'react';
import { useNavigate } from 'react-router-dom';
import soccerHero from '../assets/soccer_hero.png';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-inter">
            {/* Hero Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[2000ms] hover:scale-105"
                style={{ backgroundImage: `url(${soccerHero})` }}
            />

            {/* Overlay for readability */}
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/70 via-black/40 to-indigo-900/80" />

            {/* Content */}
            <div className="relative z-20 text-center px-4 max-w-4xl animate-fadeIn">
                <div className="mb-6 inline-block animate-float">
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-2xl">
                        <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </div>
                </div>

                <h1 className="text-6xl md:text-8xl font-extrabold text-white mb-6 tracking-tighter drop-shadow-2xl">
                    TORNEOS <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">UDLA</span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-200 mb-10 font-light tracking-wide max-w-2xl mx-auto drop-shadow-md">
                    La pasión del fútbol universitario elevada al siguiente nivel. Gestiona, compite y analiza cada jugada.
                </p>

                <div className="flex flex-col md:flex-row gap-4 justify-center items-center animate-slideUp stagger-delay-2">
                    <button
                        onClick={() => navigate('/login')}
                        className="group relative px-8 py-4 bg-white text-indigo-900 font-bold rounded-full overflow-hidden transition-all hover:bg-indigo-50 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] active:scale-95"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            🚀 Iniciar Sesión
                            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                    </button>

                    <button
                        onClick={() => navigate('/login?mode=register')}
                        className="px-8 py-4 bg-transparent border-2 border-white/30 text-white font-bold rounded-full backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/60 active:scale-95"
                    >
                        ✨ Registrarse
                    </button>
                </div>
            </div>

            {/* Decorative Blur Elements */}
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
    );
}
