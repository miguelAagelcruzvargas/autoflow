import React, { useState } from 'react';
import { X, MessageCircle, Send, Globe, Server, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

interface ConnectivityGuideProps {
    isOpen: boolean;
    onClose: () => void;
    lang: 'en' | 'es-la' | 'pt-br' | 'fr' | 'de' | 'it' | 'ru' | 'zh' | 'ja' | 'ko' | 'ar' | 'hi' | 'nl';
}

export const ConnectivityGuide: React.FC<ConnectivityGuideProps> = ({ isOpen, onClose, lang }) => {
    const [activeTab, setActiveTab] = useState<'whatsapp' | 'telegram'>('whatsapp');

    if (!isOpen) return null;

    const isEs = lang === 'es-la';

    const content = {
        whatsapp: {
            title: 'Integración WhatsApp',
            methods: [
                {
                    name: 'Método Oficial (Meta Cloud API)',
                    rec: 'Recomendado para Negocios',
                    color: 'emerald',
                    icon: CheckCircle,
                    pros: ['Riesgo de Ban: 0%', '1,000 conversaciones gratis/mes', 'Estabilidad Total', 'Soporte Oficial'],
                    cons: ['Requiere verificación de negocio (Meta)', 'Costo por mensajes de marketing', 'Configuración más compleja'],
                    steps: [
                        '1. Ve a developers.facebook.com y crea una App.',
                        '2. Añade el producto "WhatsApp" a tu app.',
                        '3. Obtén tu Token de Acceso y Phone ID.',
                        '4. Pégalos en las credenciales de n8n.'
                    ]
                },
                {
                    name: 'Método "Bridge" (WAHA / WhiteCloud)',
                    rec: 'Uso Personal / Hacks',
                    color: 'amber',
                    icon: AlertTriangle,
                    pros: ['Usa tu número actual de teléfono', 'Gratis (si lo alojas tú mismo)', 'Funciona con grupos existente'],
                    cons: ['Riesgo de Ban ALTO si abusas', 'Requiere teléfono encendido o Docker 24/7', 'No oficial (inestable a veces)'],
                    steps: [
                        '1. Instala WAHA (Docker) o usa un servicio bridge.',
                        '2. Escanea el QR como "Dispositivo Vinculado".',
                        '3. Usa el nodo "HTTP Request" apuntando a tu API local.',
                        '4. NO uses el nodo oficial de WhatsApp.'
                    ]
                }
            ]
        },
        telegram: {
            title: 'Integración Telegram',
            methods: [
                {
                    name: 'Telegram Bot API',
                    rec: 'Mejor Opción General',
                    color: 'sky',
                    icon: Send,
                    pros: ['100% Gratis e Ilimitado', 'Cero riesgo de Ban', 'Configuración en 30 segundos', 'Muy rápido'],
                    cons: ['No es WhatsApp (Menos usuarios comunes)'],
                    steps: [
                        '1. Abre Telegram y busca @BotFather.',
                        '2. Envía /newbot y sigue las instrucciones.',
                        '3. Copia el TOKEN que te da.',
                        '4. (Opcional) Busca @userinfobot para saber tu ID.',
                        '5. ¡Listo! Úsalos en el nodo Telegram.'
                    ]
                }
            ]
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1A1E26] w-full max-w-4xl h-[80vh] rounded-2xl border border-slate-700 shadow-2xl flex overflow-hidden">

                {/* Sidebar */}
                <div className="w-64 bg-[#151921] border-r border-white/5 p-6 flex flex-col gap-2">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Globe size={20} className="text-indigo-400" />
                        <span>Connect Guides</span>
                    </h2>

                    <button
                        onClick={() => setActiveTab('whatsapp')}
                        className={`p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'whatsapp' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'text-slate-400 hover:bg-white/5'}`}
                    >
                        <MessageCircle size={20} />
                        <span className="font-bold">WhatsApp</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('telegram')}
                        className={`p-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'telegram' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50' : 'text-slate-400 hover:bg-white/5'}`}
                    >
                        <Send size={20} />
                        <span className="font-bold">Telegram</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col h-full bg-[#1A1E26] relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>

                    <div className="p-8 overflow-y-auto custom-scrollbar">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">{content[activeTab].title}</h1>
                            <p className="text-slate-400 text-lg">
                                {activeTab === 'whatsapp' ? 'El estándar de oro, pero con reglas.' : 'La alternativa robusta, libre y segura.'}
                            </p>
                        </div>

                        {/* Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {content[activeTab].methods.map((method, idx) => (
                                <div key={idx} className={`bg-[#13161c] rounded-2xl border border-white/5 overflow-hidden flex flex-col ${content[activeTab].methods.length === 1 ? 'lg:col-span-2 max-w-2xl' : ''}`}>
                                    <div className={`p-4 bg-${method.color}-900/20 border-b border-${method.color}-500/20 flex items-center justify-between`}>
                                        <div className="flex items-center gap-2">
                                            <method.icon size={20} className={`text-${method.color}-400`} />
                                            <h3 className={`text-lg font-bold text-${method.color}-100`}>{method.name}</h3>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded bg-${method.color}-500/20 text-${method.color}-300 border border-${method.color}-500/30`}>
                                            {method.rec}
                                        </span>
                                    </div>

                                    <div className="p-6 flex-1 flex flex-col gap-6">
                                        {/* Pros/Cons */}
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Pros</h4>
                                                <ul className="space-y-1">
                                                    {method.pros.map((pro, i) => (
                                                        <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                                            <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                                                            {pro}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Cons (Riesgos)</h4>
                                                <ul className="space-y-1">
                                                    {method.cons.map((con, i) => (
                                                        <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                                            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                                                            {con}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="w-full h-px bg-white/5" />

                                        {/* Setup Steps */}
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">Cómo Conectar</h4>
                                            <div className="bg-black/40 rounded-xl p-4 border border-white/5 space-y-3">
                                                {method.steps.map((step, i) => (
                                                    <div key={i} className="flex gap-3 text-sm text-slate-300">
                                                        <span className="text-indigo-400 font-mono font-bold">{i + 1}.</span>
                                                        <span className="leading-relaxed">{step}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
