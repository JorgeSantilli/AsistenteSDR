'use client'

import React from 'react'
import {
    HelpCircle,
    Book,
    MessageCircle,
    FileText,
    ExternalLink,
    Search,
    ChevronDown,
    ChevronRight,
    Mail
} from 'lucide-react'

export default function HelpPage() {
    return (
        <div className="min-h-full bg-zinc-50 pb-12">
            {/* Hero Header */}
            <div className="bg-indigo-600 text-white px-8 py-12 text-center">
                <h1 className="text-3xl font-bold mb-4">¿Cómo podemos ayudarte?</h1>
                <p className="text-indigo-100 max-w-2xl mx-auto mb-8">
                    Encuentra guías, tutoriales y respuestas a las preguntas más frecuentes sobre el Asistente SDR.
                </p>
                <div className="max-w-xl mx-auto relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar en la documentación..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white text-zinc-900 placeholder:text-zinc-400 shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
                    />
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-8 -mt-8">
                {/* Quick Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <QuickCard
                        icon={Book}
                        title="Documentación"
                        description="Explora nuestras guías detalladas sobre cada funcionalidad."
                        link="#"
                    />
                    <QuickCard
                        icon={FileText}
                        title="Base de Conocimiento"
                        description="Aprende a gestionar y optimizar la información de tus productos."
                        link="#"
                    />
                    <QuickCard
                        icon={MessageCircle}
                        title="Soporte Técnico"
                        description="¿Tienes un problema? Contacta con nuestro equipo de soporte."
                        link="#"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* FAQs */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                            <HelpCircle className="text-indigo-600" size={24} />
                            Preguntas Frecuentes
                        </h2>

                        <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100 shadow-sm overflow-hidden">
                            <FAQItem
                                question="¿Cómo agrego información a la base de conocimiento?"
                                answer="Ve a la sección 'Base de Conocimiento' en el menú lateral. Puedes cargar archivos PDF/TXT o agregar texto manualmente. El sistema procesará la información automáticamente para usarla en tus llamadas."
                            />
                            <FAQItem
                                question="¿La IA escucha mis llamadas en Zoom o Google Meet?"
                                answer="Sí, siempre y cuando selecciones la opción 'Micrófono + Sistema' al iniciar la llamada y compartas la pestaña o ventana donde se realiza la videollamada."
                            />
                            <FAQItem
                                question="¿Cómo exporto las transcripciones?"
                                answer="En el 'Historial de Llamadas', selecciona la llamada que deseas y haz clic en 'Exportar'. Puedes descargarla como archivo de texto o PDF."
                            />
                            <FAQItem
                                question="¿Qué hago si la transcripción no es precisa?"
                                answer="Asegúrate de tener un micrófono de buena calidad y de estar en un ambiente silencioso. Si usas 'Micrófono + Sistema', verifica que el volumen de la otra persona sea adecuado."
                            />
                            <FAQItem
                                question="¿Mis datos están seguros?"
                                answer="Absolutamente. Utilizamos encriptación de grado empresarial y seguimos estrictas políticas de privacidad. Tus grabaciones y datos solo son accesibles por ti y tu organización."
                            />
                        </div>
                    </div>

                    {/* Contact Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                            <h3 className="font-bold text-zinc-900 mb-4">¿Aún tienes dudas?</h3>
                            <p className="text-sm text-zinc-600 mb-6">
                                Nuestro equipo está disponible de Lunes a Viernes de 9:00 a 18:00 hs.
                            </p>
                            <button className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mb-3">
                                <Mail size={18} />
                                Enviar Email
                            </button>
                            <button className="w-full bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                                <MessageCircle size={18} />
                                Chat en Vivo
                            </button>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-xl p-6 text-white shadow-lg">
                            <h3 className="font-bold mb-2">Comunidad Discord</h3>
                            <p className="text-indigo-200 text-sm mb-4">
                                Únete a otros SDRs, comparte consejos y obtén trucos exclusivos.
                            </p>
                            <a href="#" className="inline-flex items-center text-sm font-medium text-white hover:text-indigo-200 transition-colors">
                                Unirse ahora <ExternalLink size={14} className="ml-1" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function QuickCard({ icon: Icon, title, description, link }: any) {
    return (
        <a href={link} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Icon size={24} />
            </div>
            <h3 className="font-bold text-zinc-900 mb-2">{title}</h3>
            <p className="text-sm text-zinc-500">{description}</p>
        </a>
    )
}

function FAQItem({ question, answer }: any) {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
        <div className="border-b last:border-0 border-zinc-100">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 transition-colors"
            >
                <span className="font-medium text-zinc-900">{question}</span>
                {isOpen ? <ChevronDown size={20} className="text-zinc-400" /> : <ChevronRight size={20} className="text-zinc-400" />}
            </button>
            {isOpen && (
                <div className="px-4 pb-4 text-sm text-zinc-600 leading-relaxed animate-in slide-in-from-top-1">
                    {answer}
                </div>
            )}
        </div>
    )
}
