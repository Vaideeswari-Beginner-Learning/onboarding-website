import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { CheckCircle, Home, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function OnboardingComplete() {
    const [showConfetti, setShowConfetti] = useState(true);

    useEffect(() => {
        // Simple CSS-based confetti effect could be added here, 
        // but for now we'll stick to the UI animations to verify the fix first.
        const timer = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center text-center">
                <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                    <div className="relative bg-white p-6 rounded-full shadow-2xl shadow-green-200">
                        <CheckCircle className="w-24 h-24 text-green-500" />
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                    Onboarding <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">Completed!</span>
                </h1>

                <p className="text-xl text-slate-600 max-w-2xl mb-12 leading-relaxed">
                    Thank you for submitting all your details and documents. Our HR team has been notified and will verify your information shortly.
                </p>

                <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 max-w-lg w-full mb-12 transform hover:scale-105 transition-transform duration-300">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">What happens next?</h3>
                    <ul className="space-y-4 text-left">
                        <li className="flex items-start">
                            <div className="bg-blue-100 p-1.5 rounded-full mr-3 mt-0.5">
                                <span className="text-blue-600 text-xs font-bold">1</span>
                            </div>
                            <span className="text-slate-600">HR Verification (24-48 hours)</span>
                        </li>
                        <li className="flex items-start">
                            <div className="bg-blue-100 p-1.5 rounded-full mr-3 mt-0.5">
                                <span className="text-blue-600 text-xs font-bold">2</span>
                            </div>
                            <span className="text-slate-600">Offer Letter Generation</span>
                        </li>
                        <li className="flex items-start">
                            <div className="bg-blue-100 p-1.5 rounded-full mr-3 mt-0.5">
                                <span className="text-blue-600 text-xs font-bold">3</span>
                            </div>
                            <span className="text-slate-600">Welcome Kit Dispatch</span>
                        </li>
                    </ul>
                </div>

                <Link
                    to="/dashboard"
                    className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-blue-600 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 hover:bg-blue-700 hover:scale-105 shadow-xl shadow-blue-600/30"
                >
                    <Home className="w-5 h-5 mr-2" />
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
            </main>
        </div>
    );
}
