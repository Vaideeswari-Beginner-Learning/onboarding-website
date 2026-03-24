import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';

export default function Register() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords don't match");
            return;
        }

        const userData = {
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password
        };

        const success = await register(userData);
        if (success) {
            navigate('/dashboard');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-indigo-50/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8 fade-in">
            <div className="w-full px-4 sm:px-0 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center mb-6 slide-up">
                    <Link to="/" className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-200 hover:scale-110 transition-transform">
                        <Building2 className="w-10 h-10 text-white" />
                    </Link>
                </div>
                <h2 className="mt-6 text-center text-4xl font-extrabold text-slate-900 tracking-tight slide-up" style={{ animationDelay: '0.1s' }}>
                    Join the Team
                </h2>
                <p className="mt-3 text-center text-sm text-slate-500 font-medium slide-up" style={{ animationDelay: '0.2s' }}>
                    Create your Account & Start your Journey
                </p>
            </div>

            <div className="w-full px-4 sm:px-0 mt-10 sm:mx-auto sm:w-full sm:max-w-md slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="premium-card py-10 px-6 sm:px-12">
                    <form className="space-y-4" onSubmit={handleSubmit}>

                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">Full Name</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    required
                                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5"
                                    placeholder="John Doe"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">Phone Number</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    required
                                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5"
                                    placeholder="+1 (555) 000-0000"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Password fields can be omitted for simple OTP flow, but added here for completeness if required */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
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
                                    placeholder="Create a password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">Confirm Password</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5"
                                    placeholder="Confirm password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                         <button
                             type="submit"
                             className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-2xl shadow-xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 transition-all transform hover:-translate-y-1 active:scale-95 mt-8"
                         >
                             Initialize Account
                             <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                         </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
