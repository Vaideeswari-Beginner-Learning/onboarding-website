import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, User, Lock, Mail, Phone, ArrowRight } from 'lucide-react';

export default function Login() {
    const [activeTab, setActiveTab] = useState('candidate'); // 'candidate' | 'admin'
    // Pre-fill valid admin credentials for convenience
    const [formData, setFormData] = useState({
        email: 'info@forgeindiaconnect.com',
        phone: '',
        password: 'Forgeindia@09' // Only used for admin
    });
    const { loginAdmin, loginCandidate } = useAuth();
    const navigate = useNavigate();

    const handleCandidateLogin = async (e) => {
        e.preventDefault();
        // Basic validation
        if (!formData.email) {
            alert('Please enter your Email or Mobile Number');
            return;
        }

        const result = await loginCandidate(formData.email);
        if (result.success) {
            navigate('/dashboard');
        } else {
            console.error('Login failed:', result);
            alert(result.message || 'Login failed. Please try again.');
        }
    };

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        const result = await loginAdmin(formData.email, formData.password);
        if (result.success) {
            navigate('/admin/dashboard');
        } else {
            console.error('Login failed:', result);
            alert(result.message || 'Login failed. Please check if the backend server is running.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-600 p-2 rounded-xl">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                    Sign in to your account
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Or{' '}
                    <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                        register as a new candidate
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200 sm:rounded-2xl sm:px-10 border border-slate-100">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 mb-6">
                        <button
                            className={`flex-1 pb-3 text-sm font-medium text-center transition-colors ${activeTab === 'candidate'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                            onClick={() => setActiveTab('candidate')}
                        >
                            Candidate Login
                        </button>
                        <button
                            className={`flex-1 pb-3 text-sm font-medium text-center transition-colors ${activeTab === 'admin'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                            onClick={() => setActiveTab('admin')}
                        >
                            HR Admin
                        </button>
                    </div>

                    {activeTab === 'candidate' ? (
                        <form className="space-y-6" onSubmit={handleCandidateLogin}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                    Email or Mobile Number
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="text"
                                        required
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                Login
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </button>
                        </form>
                    ) : (
                        <form className="space-y-6" onSubmit={handleAdminLogin}>
                            <div>
                                <label htmlFor="admin-email" className="block text-sm font-medium text-slate-700">
                                    Admin Email
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="admin-email"
                                        name="email"
                                        type="email"
                                        required
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5"
                                        placeholder="admin@gmail.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                    Password
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5"
                                        placeholder="admin"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-center text-slate-500">
                                    (Demo: admin@gmail.com / admin)
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                            >
                                Login as Admin
                            </button>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
}
