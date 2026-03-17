import { Link, useNavigate } from 'react-router-dom';
import { useAuth, FRONTEND_VERSION, ACTUAL_API_BASE } from '../context/AuthContext';
import { LogOut, User, Building2 } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="hidden sm:block font-medium">{user.name || (user.role === 'admin' ? 'Admin' : 'User')}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors font-medium"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="hidden sm:inline">Logout</span>
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
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-blue-600/20"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="absolute bottom-0 right-2 pointer-events-none flex flex-col items-end">
                <span className="text-[8px] text-slate-300 font-mono">{FRONTEND_VERSION}</span>
                <span className="text-[6px] text-slate-200 font-mono opacity-30">{ACTUAL_API_BASE}</span>
            </div>
        </nav>
    );
}
