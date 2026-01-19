'use client'

import React from 'react'
import Link from 'next/link'
import {
  Mic,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  TrendingUp,
  CheckCircle2,
  Building2,
  LogIn
} from 'lucide-react'

/**
 * Landing Page (Home)
 * 
 * Re-diseñada para enfoque comercial premium.
 * Destaca las virtudes del Asistente SDR AI y facilita el acceso/onboarding.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Mic size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Asistente<span className="text-indigo-500">SDR</span></span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              <LogIn size={16} />
              Iniciar Sesión
            </Link>
            <Link
              href="/dashboard"
              className="bg-zinc-100 text-zinc-950 px-4 py-2 rounded-lg text-sm font-bold hover:bg-white transition-all shadow-lg shadow-white/5 flex items-center gap-2"
            >
              <Building2 size={16} />
              Crear Organización
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Abstract Background Blur */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-indigo-600/20 blur-[120px] rounded-full -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-6 animate-fade-in">
            <Zap size={14} />
            NUEVA ERA DE VENTAS ASISTIDAS POR IA
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Cierra más tratos con <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Inteligencia en Tiempo Real
            </span>
          </h1>

          <p className="text-zinc-400 text-xl md:text-2xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            El co-piloto definitivo para SDRs. Escucha, entiende y sugiere la respuesta ganadora mientras estás en la llamada.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/assistant"
              className="group w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20"
            >
              Comenzar Ahora <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
              <CheckCircle2 size={16} className="text-emerald-500" />
              Sin tarjetas de crédito
            </div>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-indigo-500/30 transition-all group">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <Mic size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Co-Piloto en Vivo</h3>
              <p className="text-zinc-500 leading-relaxed">
                Transcripción y análisis semántico al instante. Recibe sugerencias de manejo de objeciones mientras el prospecto habla.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-indigo-500/30 transition-all group">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Target size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">RAG Especializado</h3>
              <p className="text-zinc-500 leading-relaxed">
                La IA utiliza la base de conocimiento real de tu empresa (PDFs, scripts, webs) para dar respuestas precisas y veraces.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-indigo-500/30 transition-all group">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Aprendizaje por Éxito</h3>
              <p className="text-zinc-500 leading-relaxed">
                El sistema identifica patrones en tus llamadas exitosas y actualiza automáticamente el cerebro de la organización.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
              Diseñado para equipos que <br />
              <span className="text-indigo-500">no aceptan un "no"</span>
            </h2>
            <ul className="space-y-6">
              {[
                { title: 'Aumento de Conversión', desc: 'SDRs asitidos cierran hasta un 40% más de reuniones.' },
                { title: 'Onboarding Acelerado', desc: 'Reduce el tiempo de rampa de nuevos miembros a la mitad.' },
                { title: 'Seguridad Empresarial', desc: 'Datos aislados por organización con cifrado de grado bancario.' },
              ].map((benefit, i) => (
                <li key={i} className="flex gap-4">
                  <div className="mt-1">
                    <ShieldCheck size={20} className="text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{benefit.title}</h4>
                    <p className="text-zinc-500">{benefit.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-full blur-[80px] absolute inset-0 -z-10" />
            <div className="bg-zinc-900 border border-white/10 p-8 rounded-[40px] shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                </div>
                <div className="text-xs font-mono text-zinc-600">LIVE_ASSISTANT_V2_ACTIVE</div>
              </div>

              <div className="space-y-4">
                <div className="bg-zinc-800/50 p-4 rounded-2xl border border-white/5">
                  <p className="text-sm text-zinc-400 mb-1 font-medium">Prospecto dice:</p>
                  <p className="text-zinc-200 italic">"Entiendo, pero el presupuesto para este Q ya está cerrado..."</p>
                </div>
                <div className="flex justify-end">
                  <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg max-w-[80%] animate-bounce-slow">
                    <p className="text-xs text-indigo-200 mb-1 font-bold">CO-PILOTO SUGIERE:</p>
                    <p className="text-white text-sm">"Enfócate en el ahorro operativo a largo plazo. Pregúntales cuánto les cuesta hoy mantener la ineficiencia hasta el próximo Q."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto p-12 rounded-[40px] bg-gradient-to-b from-indigo-600/20 to-transparent border border-indigo-500/20">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">¿Listo para transformar tu pipeline?</h2>
          <p className="text-zinc-400 text-lg mb-10">
            Únete a las empresas que ya están escalando sus ventas con inteligencia artificial.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-4 rounded-2xl font-bold text-xl transition-all shadow-xl shadow-indigo-600/30"
          >
            Empezar Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
            <Mic size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm">AsistenteSDR AI</span>
        </div>
        <p className="text-xs text-zinc-600">
          &copy; 2026 AsistenteSDR System. Powered by Advanced AI Orchestration.
        </p>
      </footer>
    </div>
  )
}
