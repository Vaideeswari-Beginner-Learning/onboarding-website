import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!formData.email || !formData.password) {
            alert('Please enter your Email and Password');
            return;
        }

        setIsLoading(true);
        const result = await login(formData.email, formData.password);
        setIsLoading(false);

        if (result.success) {
            // Route seamlessly based on role resolved from the backend
            if (result.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        } else {
            console.error('Login failed:', result);
            alert(result.message || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="min-h-screen bg-indigo-50/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8 fade-in">
            <div className="w-full px-4 sm:px-0 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6 slide-up">
                    <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-200">
                        <Building2 className="w-10 h-10 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-4xl font-extrabold text-slate-900 tracking-tight slide-up" style={{ animationDelay: '0.1s' }}>
                    Welcome Back
                </h2>
                <p className="mt-3 text-center text-sm text-slate-500 font-medium slide-up" style={{ animationDelay: '0.2s' }}>
                    Access your secure onboarding portal
                </p>
            </div>

            <div className="w-full px-4 sm:px-0 mt-10 sm:mx-auto sm:w-full sm:max-w-md slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="premium-card py-10 px-6 sm:px-12">
                    
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                Email Address
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                 <input
                                     id="email"
                                     name="email"
                                     type="email"
                                     required
                                     className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-slate-200 rounded-xl p-3.5 bg-slate-50/50"
                                     placeholder="you@example.com"
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
                                     className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-slate-200 rounded-xl p-3.5 bg-slate-50/50"
                                     placeholder="Enter your password"
                                     value={formData.password}
                                     onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                 />
                            </div>
                        </div>

                         <button
                             type="submit"
                             disabled={isLoading}
                             className={`w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-2xl shadow-xl text-base font-bold text-white transition-all transform hover:-translate-y-1 active:scale-95 ${
                                 isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                             }`}
                         >
                             {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
                             {!isLoading && <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                         </button>
                    </form>

                </div>
            </div>
        </div>
    );
}
