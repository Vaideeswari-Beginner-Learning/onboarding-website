import { ArrowRight, ShieldCheck, Clock, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Home() {
    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            {/* Hero Section */}
            <div className="relative overflow-hidden pt-20 pb-40 lg:pt-32 lg:pb-48 bg-slate-900">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-indigo-900/90 to-slate-900/90 backdrop-blur-sm"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 font-medium text-sm mb-8 backdrop-blur-md">
                        <span className="flex h-2 w-2 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
                        Next Generation Onboarding
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
                        Welcome to the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">Future of Work</span>
                    </h1>

                    <p className="text-xl text-blue-100/80 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Experience a seamless, paperless, and intelligent onboarding journey designed for modern teams.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-5">
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl shadow-xl shadow-blue-600/20 transition-all hover:scale-105 hover:shadow-2xl"
                        >
                            Start Onboarding
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl backdrop-blur-md transition-all hover:scale-105"
                        >
                            Admin Portal
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="relative bg-slate-50 py-24">
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
                            color="from-blue-500 to-indigo-500"
                            shadow="shadow-blue-500/20"
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
        <div className={`p-8 rounded-3xl bg-white transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border border-slate-100 group ${shadow}`}>
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-600 leading-relaxed text-sm">{description}</p>
        </div>
    );
}
