import React, { useEffect, useState } from 'react';
import { Layout, Zap, Shield, Globe, ArrowRight, Play, Activity, CheckCircle, Smartphone, Cpu, Layers } from 'lucide-react';

interface LandingPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
    // Simple state for entry animation delay
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                @keyframes flow {
                    0% { background-position: 0% 50%; opacity: 0; }
                    50% { opacity: 1; }
                    100% { background-position: 100% 50%; opacity: 0; }
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(79, 70, 229, 0); }
                    100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
                }
                @keyframes data-travel {
                    0% { left: 10%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { left: 90%; opacity: 0; }
                }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-float-delayed { animation: float 6s ease-in-out 3s infinite; }
                .animate-pulse-ring { animation: pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>

            {/* Navbar */}
            <nav className={`fixed top-0 w-full border-b border-white/5 bg-[#0B0E14]/80 backdrop-blur-md z-50 transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                            <Layout size={24} className="text-white" />
                        </div>
                        <h1 className="font-bold text-2xl tracking-tight text-white">AutoFlow <span className="text-indigo-400">Pro</span></h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={onLogin} className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Sign In</button>
                        <button
                            onClick={onGetStarted}
                            className="bg-white text-black hover:bg-indigo-50 px-5 py-2.5 rounded-full text-sm font-bold transition-all transform hover:scale-105 shadow-lg shadow-white/10"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden min-h-screen flex flex-col justify-center">
                {/* Background Blobs & Grid */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>

                <div className="max-w-7xl mx-auto relative z-10 w-full grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left Column: Copy */}
                    <div className={`text-left space-y-8 transition-all duration-1000 transform ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'}`}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                            <Zap size={12} className="fill-indigo-400" /> The Future of Work is Here
                        </div>
                        <h1 className="text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
                            Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Automations</span> That Feel Like Magic.
                        </h1>
                        <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
                            Stop wasting time on repetitive tasks. Design powerful workflows visually, connect your favorite apps, and let AutoFlow Pro handle the rest. It's not just automation; it's your new superpower.
                        </p>

                        <div className="flex flex-col sm:flex-row items-start gap-4 pt-4">
                            <button
                                onClick={onGetStarted}
                                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-lg shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                                Start Building For Free <ArrowRight size={20} />
                            </button>
                            <button onClick={onLogin} className="w-full sm:w-auto px-8 py-4 bg-[#1A1F2E] hover:bg-[#232938] text-white rounded-xl font-bold text-lg border border-white/5 transition-all flex items-center justify-center gap-2">
                                <Play size={20} className="fill-white" /> Live Demo
                            </button>
                        </div>

                        <div className="pt-8 flex items-center gap-8 text-sm text-slate-500 font-medium">
                            <div className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500" /> No Card Required</div>
                            <div className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500" /> 14-Day Free Trial</div>
                            <div className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500" /> Cancel Anytime</div>
                        </div>
                    </div>

                    {/* Right Column: Dynamic Visual */}
                    <div className={`relative transition-all duration-1000 delay-300 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                        {/* Abstract Decor elements */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl rotate-12 opacity-20 blur-xl animate-pulse"></div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full opacity-20 blur-xl animate-pulse delay-700"></div>

                        <div className="relative bg-[#151921]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden group hover:border-indigo-500/30 transition-colors duration-500">
                            {/* Window Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0B0E14]/50">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                                </div>
                                <div className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 animate-pulse">
                                    ● SYSTEM ONLINE
                                </div>
                            </div>

                            {/* Dynamic Workflow Area */}
                            <div className="aspect-[4/3] relative bg-[#0B0E14] overflow-hidden p-6">
                                {/* Grid */}
                                <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                                {/* Nodes Container - Centered */}
                                <div className="absolute inset-0 flex items-center justify-center">

                                    {/* Connection Line 1 */}
                                    <div className="absolute top-1/2 left-[20%] right-[50%] h-0.5 bg-slate-700 overflow-hidden">
                                        <div className="absolute top-0 w-8 h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent" style={{ animation: 'data-travel 2s linear infinite' }}></div>
                                    </div>

                                    {/* Connection Line 2 */}
                                    <div className="absolute top-1/2 left-[50%] right-[20%] h-0.5 bg-slate-700 overflow-hidden">
                                        <div className="absolute top-0 w-8 h-full bg-gradient-to-r from-transparent via-indigo-400 to-transparent" style={{ animation: 'data-travel 2s linear infinite 1s' }}></div>
                                    </div>

                                    {/* Connection Line Down */}
                                    <div className="absolute top-1/2 left-[50%] h-[30%] w-0.5 bg-slate-700 overflow-hidden origin-top">
                                        <div className="absolute left-0 w-full h-8 bg-gradient-to-b from-transparent via-pink-400 to-transparent" style={{ animation: 'data-travel 2.5s linear infinite 0.5s' }}></div>
                                    </div>

                                    {/* Node 1: Trigger */}
                                    <div className="absolute left-[20%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-16 h-16 bg-[#1A1F2E] border border-emerald-500/50 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-float z-10">
                                        <div className="absolute inset-0 bg-emerald-500/10 rounded-xl animate-pulse-ring"></div>
                                        <Globe className="text-emerald-400" size={28} />
                                        <div className="absolute -bottom-8 text-xs font-mono text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded border border-emerald-500/20">Webhook</div>
                                    </div>

                                    {/* Node 2: Process */}
                                    <div className="absolute left-[50%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-20 h-20 bg-[#1A1F2E] border border-indigo-500/50 rounded-xl flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.3)] z-20">
                                        <Activity className="text-indigo-400 animate-spin-slow" size={32} />
                                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center text-[8px] font-bold">1</div>
                                        <div className="absolute -bottom-8 text-xs font-mono text-indigo-400 bg-indigo-950/50 px-2 py-1 rounded border border-indigo-500/20">AI Process</div>
                                    </div>

                                    {/* Node 3: Output */}
                                    <div className="absolute left-[80%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-16 h-16 bg-[#1A1F2E] border border-violet-500/50 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.2)] animate-float-delayed z-10">
                                        <div className="absolute inset-0 bg-violet-500/10 rounded-xl animate-pulse-ring"></div>
                                        <Shield className="text-violet-400" size={28} />
                                        <div className="absolute -bottom-8 text-xs font-mono text-violet-400 bg-violet-950/50 px-2 py-1 rounded border border-violet-500/20">Secure DB</div>
                                    </div>

                                    {/* Node 4: Mobile Notif (Bottom) */}
                                    <div className="absolute left-[50%] top-[80%] -translate-y-1/2 -translate-x-1/2 w-16 h-16 bg-[#1A1F2E] border border-pink-500/50 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.2)] z-10">
                                        <Smartphone className="text-pink-400" size={28} />
                                        <div className="absolute -right-12 text-xs font-mono text-pink-400 bg-pink-950/50 px-2 py-1 rounded border border-pink-500/20">Notify</div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-6 bg-[#0F1116] border-t border-white/5 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Powering the Next Gen of Automation</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg">Robust enough for enterprise, simple enough for everyone.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Cpu size={32} className="text-amber-400" />,
                                title: "AI-Driven Logic",
                                desc: "Let our AI agents optimize your workflows automatically. Smart config, smart execution."
                            },
                            {
                                icon: <Layers size={32} className="text-cyan-400" />,
                                title: "Infinite Scalability",
                                desc: "From simple tasks to complex, multi-branch orchestrations. Our canvas has no limits."
                            },
                            {
                                icon: <Shield size={32} className="text-emerald-400" />,
                                title: "Enterprise Security",
                                desc: "Bank-grade encryption for your credentials and data. Run automations with peace of mind."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="group p-8 rounded-2xl bg-[#151921] border border-white/5 hover:border-indigo-500/50 hover:bg-[#1A1F2E] transition-all duration-300 hover:-translate-y-2">
                                <div className="w-16 h-16 bg-[#0B0E14] rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:shadow-[0_0_20px_rgba(79,70,229,0.1)] transition-all">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-indigo-300 transition-colors">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed group-hover:text-slate-300">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-900/20"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-4xl font-bold mb-8">Ready to Automate?</h2>
                    <button
                        onClick={onGetStarted}
                        className="px-10 py-5 bg-white text-indigo-900 rounded-full font-bold text-xl hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-xl"
                    >
                        Get Started Now
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 border-t border-white/5 text-center text-slate-500 text-sm bg-[#0B0E14]">
                <p>© 2026 AutoFlow Pro. All rights reserved.</p>
            </footer>
        </div>
    );
};

