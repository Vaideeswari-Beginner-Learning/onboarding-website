import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import StatusTracker from '../../components/StatusTracker';
import { Save, ArrowLeft, Building, CreditCard } from 'lucide-react';

export default function BankDetails() {
    const navigate = useNavigate();
    const { user, updateCandidate } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        accountName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        panNumber: ''
    });

    const isSubmitted = !!(user?.bankDetails?.accountNumber);

    // Load saved data if available
    useEffect(() => {
        if (user?.bankDetails) {
            setFormData(prev => ({
                ...prev,
                ...user.bankDetails
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await updateCandidate({ bankDetails: formData });

        if (result.success) {
            localStorage.setItem('onboarding_bank_details', 'true');
            setIsEditing(false);
            alert('Bank details saved successfully!');
            if (!isSubmitted) {
                navigate('/onboarding/documents');
            }
        } else {
            alert('Failed to save details: ' + result.message);
        }
    };

    // Mask account number for summary
    const maskAccountNumber = (num) => {
        if (!num) return '';
        return '•••• •••• ' + num.slice(-4);
    };

    return (
        <div className="min-h-screen bg-indigo-50/30 fade-in">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors font-bold text-sm"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </button>

                <div className="mb-10 slide-up">
                    <StatusTracker currentStep={3} />
                </div>

                {isSubmitted && !isEditing ? (
                    /* Summary View */
                    <div className="premium-card overflow-hidden slide-up animate-in fade-in zoom-in-95 duration-500">
                        <div className="p-8 border-b border-rose-100 bg-gradient-to-r from-rose-50/50 to-white flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bank Details</h1>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-full uppercase tracking-wider border border-emerald-200 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                        Verified System
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="px-6 py-2.5 bg-white border-2 border-rose-100 text-rose-600 font-black rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm active:scale-95 text-sm"
                            >
                                EDIT BANK INFO
                            </button>
                        </div>

                        <div className="p-8 space-y-10">
                            {/* Bank Info Summary */}
                            <section>
                                <h3 className="text-sm font-black text-rose-500 mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
                                    Account Information
                                    <div className="h-px bg-rose-100 flex-1"></div>
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Holder Name</p>
                                        <p className="text-xl font-bold text-slate-900">{formData.accountName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PAN Number</p>
                                        <p className="text-xl font-bold text-slate-900 uppercase tracking-widest">{formData.panNumber}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Number</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                                                <CreditCard className="w-4 h-4" />
                                            </div>
                                            <p className="text-2xl font-black text-slate-900 font-mono tracking-wider">
                                                {maskAccountNumber(formData.accountNumber)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IFSC Code</p>
                                            <p className="text-lg font-black text-rose-600 tracking-widest uppercase">{formData.ifscCode}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank & Branch</p>
                                            <p className="text-lg font-bold text-slate-900">{formData.bankName}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-900">Payroll Verification Note</p>
                                    <p className="text-xs text-amber-700 mt-1 leading-relaxed font-medium">
                                        These details are securely encrypted and will be used for salary processing. Any changes may delay the next payroll cycle.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-rose-50/30 border-t border-rose-100 flex justify-end">
                            <button 
                                onClick={() => navigate('/onboarding/documents')}
                                className="px-10 py-4 bg-rose-500 text-white font-black rounded-2xl shadow-xl shadow-rose-200 hover:bg-rose-600 transition-all hover:scale-[1.02] active:scale-95 tracking-wider uppercase text-sm"
                            >
                                CONTINUE TO DOCUMENTS →
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Form View */
                    <div className="premium-card overflow-hidden slide-up animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-8 border-b border-indigo-100 bg-indigo-50/30">
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bank Details</h1>
                            <p className="text-slate-500 mt-2 font-medium">Please provide your salary account information.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                            <section>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">Account Holder Name</label>
                                        <input
                                            type="text"
                                            name="accountName"
                                            required
                                            className="w-full rounded-xl border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 shadow-sm p-3.5 bg-white transition-all font-medium"
                                            value={formData.accountName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">PAN Number</label>
                                        <input
                                            type="text"
                                            name="panNumber"
                                            required
                                            className="w-full rounded-xl border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 shadow-sm p-3.5 bg-white transition-all font-medium uppercase"
                                            value={formData.panNumber}
                                            onChange={handleChange}
                                            placeholder="ABCDE1234F"
                                            maxLength={10}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">Account Number</label>
                                        <div className="relative rounded-xl shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <CreditCard className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <input
                                                type="text"
                                                name="accountNumber"
                                                required
                                                className="block w-full pl-12 p-3.5 bg-white border-slate-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 font-mono"
                                                value={formData.accountNumber}
                                                onChange={handleChange}
                                                pattern="^[0-9]{9,18}$"
                                                title="Account number must be 9 to 18 digits. Only numbers allowed."
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">IFSC Code</label>
                                        <div className="relative rounded-xl shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Building className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <input
                                                type="text"
                                                name="ifscCode"
                                                required
                                                className="block w-full pl-12 p-3.5 bg-white border-slate-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 uppercase font-bold tracking-widest"
                                                value={formData.ifscCode}
                                                onChange={handleChange}
                                                placeholder="SBIN0001234"
                                                pattern="^[A-Za-z]{4}0[A-Za-z0-9]{6}$"
                                                title="IFSC code must be 11 characters: 4 letters, then 0, then 6 alphanumeric characters (e.g., SBIN0001234)."
                                            />
                                        </div>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">Bank Name & Branch</label>
                                        <input
                                            type="text"
                                            name="bankName"
                                            required
                                            className="w-full rounded-xl border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 shadow-sm p-3.5 bg-white transition-all font-medium"
                                            value={formData.bankName}
                                            onChange={handleChange}
                                            placeholder="e.g. State Bank of India, Main Branch"
                                        />
                                    </div>
                                </div>
                            </section>

                            <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                                {isSubmitted && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="w-full sm:w-1/3 bg-white border-2 border-rose-100 text-rose-600 font-black py-4 px-10 rounded-2xl shadow-lg transition-all hover:bg-rose-50 active:scale-95 text-lg tracking-wider"
                                    >
                                        CANCEL
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className={`w-full ${isSubmitted ? 'sm:w-1/3' : 'sm:w-2/3'} bg-rose-500 hover:bg-rose-600 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-rose-200 transition-all hover:scale-[1.02] active:scale-95 text-lg tracking-wider`}
                                >
                                    {isSubmitted ? 'UPDATE DETAILS' : 'SAVE AND CONTINUE'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
