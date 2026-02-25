import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import StatusTracker from '../../components/StatusTracker';
import { Save, ArrowLeft, Building, CreditCard } from 'lucide-react';

export default function BankDetails() {
    const navigate = useNavigate();
    const { user, updateCandidate } = useAuth();
    const [formData, setFormData] = useState({
        accountName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        panNumber: ''
    });

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
            alert('Bank Details saved successfully!');
            navigate('/onboarding/documents');
        } else {
            alert('Failed to save details: ' + result.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                </button>

                <div className="mb-8">
                    <StatusTracker currentStep={3} />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h1 className="text-2xl font-bold text-slate-900">Bank Details</h1>
                        <p className="text-slate-600 mt-1">Provide your bank account information for salary processing.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
                        <section>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Holder Name</label>
                                    <input
                                        type="text"
                                        name="accountName"
                                        required
                                        className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                                        value={formData.accountName}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">PAN Number</label>
                                    <input
                                        type="text"
                                        name="panNumber"
                                        required
                                        className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm uppercase"
                                        value={formData.panNumber}
                                        onChange={handleChange}
                                        placeholder="ABCDE1234F"
                                        maxLength={10}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <CreditCard className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="accountNumber"
                                            required
                                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg"
                                            value={formData.accountNumber}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">IFSC Code</label>
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Building className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="ifscCode"
                                            required
                                            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-lg uppercase"
                                            value={formData.ifscCode}
                                            onChange={handleChange}
                                            placeholder="SBIN0001234"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name & Branch</label>
                                    <input
                                        type="text"
                                        name="bankName"
                                        required
                                        className="w-full rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                                        value={formData.bankName}
                                        onChange={handleChange}
                                        placeholder="e.g. State Bank of India, Main Branch"
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                Save & Continue
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
