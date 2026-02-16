import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, User, Lock, Mail, Phone, ArrowRight } from 'lucide-react';

export default function Login() {
    const [activeTab, setActiveTab] = useState('candidate'); // 'candidate' | 'admin'
    const [step, setStep] = useState(1); // 1: Input, 2: OTP (for candidate)
    // Pre-fill valid admin credentials for convenience
    const [formData, setFormData] = useState({
        email: 'admin@gmail.com',
        phone: '',
        otp: '',
        password: 'admin'
    });
    const { loginAdmin, sendOtp, verifyOtp } = useAuth();
    const navigate = useNavigate();

    const handleSendOtp = async (e) => {
        e.preventDefault();
        const success = await sendOtp(formData.email);
        if (success) {
            setStep(2);
        } else {
            alert('Failed to send OTP. Please try again.');
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (formData.otp.length === 4) {
            const success = await verifyOtp(formData.email, formData.otp);
            if (success) {
                navigate('/dashboard');
            } else {
                alert('Invalid OTP or verification failed');
            }
        } else {
            alert('Please enter a 4-digit OTP');
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
                            onClick={() => { setActiveTab('candidate'); setStep(1); }}
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
                        step === 1 ? (
                            <form className="space-y-6" onSubmit={handleSendOtp}>
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
                                    Send OTP
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </button>
                            </form>
                        ) : (
                            <form className="space-y-6" onSubmit={handleVerifyOtp}>
                                <div className="text-center mb-4">
                                    <p className="text-sm text-slate-600">Please enter the OTP sent to</p>
                                    <p className="font-medium text-slate-900">{formData.email}</p>
                                </div>

                                <div>
                                    <label htmlFor="otp" className="block text-sm font-medium text-slate-700">
                                        One Time Password
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            id="otp"
                                            name="otp"
                                            type="text"
                                            required
                                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg p-2.5 tracking-widest text-center text-lg"
                                            placeholder="XXXX"
                                            maxLength={4}
                                            value={formData.otp}
                                            onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-center text-slate-500">
                                        (Use any 4 digits for demo)
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    Verify & Login
                                </button>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-sm text-blue-600 hover:text-blue-500"
                                    >
                                        Change Number/Email
                                    </button>
                                </div>
                            </form>
                        )
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
