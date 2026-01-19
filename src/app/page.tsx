import Link from 'next/link'
import { Mic, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-8">
      <main className="flex flex-col items-center gap-8 text-center max-w-2xl">
        <div className="bg-indigo-500/10 p-4 rounded-full text-indigo-400 mb-4 animate-pulse">
          <Mic size={48} />
        </div>

        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
          Asistente SDR <span className="text-indigo-500">AI</span>
        </h1>

        <p className="text-zinc-400 text-lg">
          Plataforma de inteligencia en tiempo real para Sales Development Representatives.
          Detecta objeciones, sugiere respuestas y aprende de tus mejores llamadas.
        </p>

        <div className="flex gap-4 mt-8">
          <Link
            href="/assistant"
            className="group bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-full font-medium transition-all flex items-center gap-2"
          >
            Abrir Asistente Live <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="https://github.com/JorgeSantilli/AsistenteSDR"
            target="_blank"
            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 px-8 py-3 rounded-full font-medium transition-all"
          >
            Ver Repositorio
          </a>
        </div>
      </main>

      <footer className="mt-20 text-sm text-zinc-600">
        &copy; 2026 AsistenteSDR System powered by Antigravity
      </footer>
    </div>
  )
}
