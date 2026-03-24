import { ArrowRight, ShieldCheck, Clock, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Home() {
    return (
        <div className="min-h-screen bg-indigo-50/30 fade-in">
            <Navbar />

            {/* Hero Section */}
            <div className="relative overflow-hidden pt-20 pb-40 sm:pt-24 sm:pb-52 lg:pt-36 lg:pb-64 bg-slate-950">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-30"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950 via-slate-950 to-indigo-900/90 backdrop-blur-[2px]"></div>
                
                {/* Floating Glows */}
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 font-bold text-sm mb-10 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-700">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-400 mr-3 animate-pulse shadow-[0_0_12px_rgba(129,140,248,0.8)]"></span>
                        Empowering Modern Workforces
                    </div>

                    <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 sm:mb-10 leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        Modernizing the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 drop-shadow-sm">Onboarding Experience</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-indigo-100/70 mb-16 max-w-3xl mx-auto leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000" style={{ animationDelay: '0.2s' }}>
                        A premium, intelligent portal for a seamless transition into your new role. Paperless, secure, and built for speed.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000" style={{ animationDelay: '0.4s' }}>
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center px-10 py-5 text-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-3xl shadow-2xl shadow-indigo-500/40 transition-all hover:scale-105 hover:-translate-y-1 active:scale-95 group"
                        >
                            Get Started
                            <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                        </Link>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-white/5 hover:bg-white/10 border border-white/20 rounded-3xl backdrop-blur-2xl transition-all hover:scale-105 hover:-translate-y-1 active:scale-95"
                        >
                            Portal Login
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="relative bg-indigo-50/20 py-32 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-indigo-200 to-transparent"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<ShieldCheck className="w-8 h-8 text-white" />}
                            title="Secure Storage"
                            description="Bank-grade encryption ensures your documents and personal data remained protected at all times."
                            color="from-emerald-500 to-teal-500"
                            shadow="shadow-emerald-500/20"
                        />
                        <FeatureCard
                            icon={<Clock className="w-8 h-8 text-white" />}
                            title="Fast Processing"
                            description="Automated workflows and real-time status updates make onboarding faster than ever."
                            color="bg-indigo-600"
                            shadow="shadow-indigo-500/20"
                        />
                        <FeatureCard
                            icon={<FileCheck className="w-8 h-8 text-white" />}
                            title="Paperless Experience"
                            description="Sign digitally and upload documents instantly. No more printers or scanners needed."
                            color="from-purple-500 to-pink-500"
                            shadow="shadow-purple-500/20"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, description, color, shadow }) {
    return (
        <div className={`p-10 rounded-[40px] bg-white transition-all duration-500 hover:-translate-y-4 hover:shadow-3xl border border-indigo-50 group ${shadow} premium-card`}>
            <div className={`w-20 h-20 rounded-3xl ${color} flex items-center justify-center shadow-2xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-600 leading-relaxed text-sm">{description}</p>
        </div>
    );
}
