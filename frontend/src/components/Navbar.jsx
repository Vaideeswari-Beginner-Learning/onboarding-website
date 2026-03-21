import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, FRONTEND_VERSION, ACTUAL_API_BASE } from '../context/AuthContext';
import { LogOut, User, Building2, Menu, X } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/logo.jpg" alt="Logo" className="h-10 w-auto object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                        <div className="bg-blue-600 p-1.5 rounded-lg hidden">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
                            Forge India Connect
                        </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {/* Desktop View */}
                        <div className="hidden md:flex items-center gap-4">
                            {user ? (
                                <>
                                    <div className="flex items-center space-x-4">
                                        <span onClick={() => navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard')} className="cursor-pointer text-slate-600 hover:text-blue-600 transition-colors font-medium">Dashboard</span>
                                        {user.role === 'admin' && (
                                            <span onClick={() => navigate('/admin/chat')} className="cursor-pointer text-slate-600 hover:text-blue-600 transition-colors font-medium">Messages</span>
                                        )}
                                        <div className="h-4 w-px bg-slate-300"></div>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200 shadow-inner">
                                            <User className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span className="font-medium text-slate-700">{user.name || (user.role === 'admin' ? 'Admin' : 'User')}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors font-medium ml-2 px-3 py-1.5 rounded-lg hover:bg-red-50"
                                        title="Logout"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Logout</span>
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link
                                        to="/login"
                                        className="text-slate-600 hover:text-blue-600 font-medium px-3 py-2 transition-colors"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5"
                                    >
                                        Get Started
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="p-2 -mr-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-slate-100 animate-in slide-in-from-top-4 duration-200">
                        {user ? (
                            <div className="flex flex-col space-y-3 px-2">
                                <div className="flex items-center gap-3 px-3 py-3 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200 shadow-inner">
                                        <User className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{user.name || (user.role === 'admin' ? 'Admin' : 'User')}</div>
                                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{user.role}</div>
                                    </div>
                                </div>
                                <span onClick={() => { setIsMobileMenuOpen(false); navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard'); }} className="cursor-pointer text-slate-700 hover:text-blue-600 hover:bg-blue-50 font-semibold px-4 py-3 rounded-xl transition-colors flex items-center">Dashboard</span>
                                {user.role === 'admin' && (
                                    <span onClick={() => { setIsMobileMenuOpen(false); navigate('/admin/chat'); }} className="cursor-pointer text-slate-700 hover:text-blue-600 hover:bg-blue-50 font-semibold px-4 py-3 rounded-xl transition-colors flex items-center">Messages</span>
                                )}
                                <button
                                    onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                                    className="flex items-center gap-2 text-red-600 hover:bg-red-50 font-semibold px-4 py-3 rounded-xl transition-colors w-full text-left"
                                >
                                    <LogOut className="w-5 h-5" />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col space-y-3 px-2">
                                <Link
                                    to="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-slate-700 hover:text-blue-600 hover:bg-blue-50 font-semibold px-4 py-3 rounded-xl transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-bold text-center shadow-md pb-1"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="absolute bottom-0 right-2 pointer-events-none hidden md:flex flex-col items-end">
                <span className="text-[8px] text-slate-300 font-mono">{FRONTEND_VERSION}</span>
                <span className="text-[6px] text-slate-200 font-mono opacity-30">{ACTUAL_API_BASE}</span>
            </div>
        </nav>
    );
}
