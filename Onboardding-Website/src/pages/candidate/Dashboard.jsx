import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import StatusTracker from '../../components/StatusTracker';
import { FileText, Upload, CheckSquare, Clock } from 'lucide-react';
import { generateOfferLetter } from '../../utils/offerLetterGenerator';

export default function CandidateDashboard() {
    const { user, loginCandidate } = useAuth();

    const API_BASE = import.meta.env.VITE_API_URL || '';

    // Calculate current step based on completion
    const getStep = () => {
        if (localStorage.getItem('candidate_docs')) return 5; // All done
        if (localStorage.getItem('onboarding_bank_details')) return 4; // Documents
        if (localStorage.getItem('onboarding_personal_details')) return 3; // Bank Details
        return 2; // Personal Details
    };

    const currentStep = getStep();

    // Offer Letter Request Logic
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (user?.offerLetterStatus === 'Generated') {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
        }
    }, [user]);

    const handleRequestOfferLetter = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/candidates/request-offer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });
            if (response.ok) {
                alert('Offer Letter Requested Successfully!');
                // Refresh user data
                loginCandidate(user.email);
            } else {
                alert('Failed to request offer letter.');
            }
        } catch (error) {
            console.error('Error requesting offer:', error);
            alert('Error requesting offer letter.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Welcome, {user?.name}</h1>
                    <p className="mt-2 text-slate-600">Complete your onboarding tasks to get started.</p>
                </div>

                {/* Status Tracker */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Onboarding Progress</h2>
                    <StatusTracker currentStep={currentStep} />
                </div>

                {/* Action Cards */}
                {/* Action Cards */}
                {/* Action Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* Personal Details Card */}
                    <Link to="/onboarding/personal-details" className="group">
                        <div className={`p-1 rounded-3xl shadow-xl transition-all hover:-translate-y-1 h-full ${localStorage.getItem('onboarding_personal_details')
                            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 shadow-indigo-500/20 hover:shadow-indigo-500/30'
                            : 'bg-white border-2 border-blue-100 hover:border-blue-300 shadow-blue-200/20'
                            }`}>
                            <div className={`rounded-[22px] p-8 h-full relative overflow-hidden transition-colors ${localStorage.getItem('onboarding_personal_details') ? 'bg-white/10' : 'bg-white'
                                }`}>
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <FileText className={`w-32 h-32 ${localStorage.getItem('onboarding_personal_details') ? 'text-white' : 'text-blue-600'
                                        }`} />
                                </div>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-transform group-hover:scale-110 ${localStorage.getItem('onboarding_personal_details')
                                    ? 'bg-white text-indigo-600 shadow-indigo-900/20'
                                    : 'bg-blue-50 text-blue-600 shadow-blue-200/50'
                                    }`}>
                                    {localStorage.getItem('onboarding_personal_details') ? (
                                        <CheckSquare className="w-7 h-7" />
                                    ) : (
                                        <FileText className="w-7 h-7" />
                                    )}
                                </div>
                                <h3 className={`text-2xl font-bold mb-3 transition-colors ${localStorage.getItem('onboarding_personal_details') ? 'text-white' : 'text-slate-900 group-hover:text-blue-600'
                                    }`}>Personal Details</h3>
                                <p className={`mb-6 text-sm leading-relaxed ${localStorage.getItem('onboarding_personal_details') ? 'text-indigo-100' : 'text-slate-600'
                                    }`}>Provide your personal information, contact address, and emergency details.</p>
                                <span className={`inline-flex items-center text-sm font-bold group-hover:translate-x-1 transition-transform ${localStorage.getItem('onboarding_personal_details') ? 'text-white' : 'text-blue-600'
                                    }`}>
                                    {localStorage.getItem('onboarding_personal_details') ? 'Completed' : 'Start Now'} <span className="ml-2">→</span>
                                </span>
                            </div>
                        </div>
                    </Link>

                    {/* Bank Details Card */}
                    {localStorage.getItem('onboarding_personal_details') ? (
                        <Link to="/onboarding/bank-details" className="group">
                            <div className={`p-1 rounded-3xl shadow-xl transition-all hover:-translate-y-1 h-full ${localStorage.getItem('onboarding_bank_details')
                                ? 'bg-gradient-to-br from-pink-500 to-rose-500 shadow-pink-500/20 hover:shadow-pink-500/30'
                                : 'bg-white border-2 border-pink-100 hover:border-pink-300 shadow-pink-200/20'
                                }`}>
                                <div className={`rounded-[22px] p-8 h-full relative overflow-hidden transition-colors ${localStorage.getItem('onboarding_bank_details') ? 'bg-white/10' : 'bg-white'
                                    }`}>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <FileText className={`w-32 h-32 ${localStorage.getItem('onboarding_bank_details') ? 'text-white' : 'text-pink-500'
                                            }`} />
                                    </div>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-transform group-hover:scale-110 ${localStorage.getItem('onboarding_bank_details')
                                        ? 'bg-white text-rose-600 shadow-rose-900/20'
                                        : 'bg-pink-50 text-pink-500 shadow-pink-200/50'
                                        }`}>
                                        {localStorage.getItem('onboarding_bank_details') ? (
                                            <CheckSquare className="w-7 h-7" />
                                        ) : (
                                            <FileText className="w-7 h-7" />
                                        )}
                                    </div>
                                    <h3 className={`text-2xl font-bold mb-3 transition-colors ${localStorage.getItem('onboarding_bank_details') ? 'text-white' : 'text-slate-900 group-hover:text-pink-600'
                                        }`}>Bank Details</h3>
                                    <p className={`mb-6 text-sm leading-relaxed ${localStorage.getItem('onboarding_bank_details') ? 'text-pink-100' : 'text-slate-600'
                                        }`}>Provide your bank account information for salary processing.</p>
                                    <span className={`inline-flex items-center text-sm font-bold group-hover:translate-x-1 transition-transform ${localStorage.getItem('onboarding_bank_details') ? 'text-white' : 'text-pink-600'
                                        }`}>
                                        {localStorage.getItem('onboarding_bank_details') ? 'Completed' : 'Start Now'} <span className="ml-2">→</span>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ) : (
                        <div className="group h-full opacity-50 cursor-not-allowed">
                            <div className="bg-slate-200 p-1 rounded-3xl h-full">
                                <div className="bg-white rounded-[22px] p-8 h-full relative overflow-hidden">
                                    <div className="w-14 h-14 bg-slate-400 rounded-2xl flex items-center justify-center mb-6">
                                        <Clock className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-500 mb-3">Bank Details</h3>
                                    <p className="text-slate-400 mb-6 text-sm leading-relaxed">Complete Personal Details to unlock.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Document Upload Card */}
                    {localStorage.getItem('onboarding_bank_details') ? (
                        <Link to="/onboarding/documents" className="group">
                            <div className={`p-1 rounded-3xl shadow-xl transition-all hover:-translate-y-1 h-full ${localStorage.getItem('candidate_docs')
                                ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/20 hover:shadow-orange-500/30'
                                : 'bg-white border-2 border-orange-100 hover:border-orange-300 shadow-orange-200/20'
                                }`}>
                                <div className={`rounded-[22px] p-8 h-full relative overflow-hidden transition-colors ${localStorage.getItem('candidate_docs') ? 'bg-white/10' : 'bg-white'
                                    }`}>
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Upload className={`w-32 h-32 ${localStorage.getItem('candidate_docs') ? 'text-white' : 'text-orange-500'
                                            }`} />
                                    </div>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-transform group-hover:scale-110 ${localStorage.getItem('candidate_docs')
                                        ? 'bg-white text-orange-600 shadow-orange-900/20'
                                        : 'bg-orange-50 text-orange-500 shadow-orange-200/50'
                                        }`}>
                                        {localStorage.getItem('candidate_docs') ? (
                                            <CheckSquare className="w-7 h-7" />
                                        ) : (
                                            <Upload className="w-7 h-7" />
                                        )}
                                    </div>
                                    <h3 className={`text-2xl font-bold mb-3 transition-colors ${localStorage.getItem('candidate_docs') ? 'text-white' : 'text-slate-900 group-hover:text-orange-600'
                                        }`}>Upload Documents</h3>
                                    <p className={`mb-6 text-sm leading-relaxed ${localStorage.getItem('candidate_docs') ? 'text-orange-100' : 'text-slate-600'
                                        }`}>Submit your educational certificates, ID proofs, and previous employment records.</p>
                                    <div className="flex items-center gap-2">
                                        {localStorage.getItem('candidate_docs') ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white text-orange-600">
                                                Submitted
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                                Action Required
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ) : (
                        <div className="group h-full opacity-50 cursor-not-allowed">
                            <div className="bg-slate-200 p-1 rounded-3xl h-full">
                                <div className="bg-white rounded-[22px] p-8 h-full relative overflow-hidden">
                                    <div className="w-14 h-14 bg-slate-400 rounded-2xl flex items-center justify-center mb-6">
                                        <Clock className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-500 mb-3">Upload Documents</h3>
                                    <p className="text-slate-400 mb-6 text-sm leading-relaxed">Complete Bank Details to unlock.</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Offer Letter Section */}
                <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Offer Letter Status</h2>
                            <p className="text-slate-600 mt-1">
                                {user?.offerLetterStatus === 'Generated'
                                    ? "Your offer letter has been generated! Check your email or download it here."
                                    : user?.offerLetterRequested
                                        ? "You have requested your offer letter. Pending Admin approval."
                                        : "Once you complete all onboarding steps, you can request your offer letter."}
                            </p>
                        </div>
                        <div>
                            {user?.offerLetterStatus === 'Generated' ? (
                                <button
                                    onClick={() => generateOfferLetter(user)}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold shadow-lg shadow-green-500/30 hover:bg-green-700 transition-all flex items-center"
                                >
                                    <FileText className="w-5 h-5 mr-2" /> Download Offer
                                </button>
                            ) : user?.offerLetterRequested ? (
                                <span className="inline-flex items-center px-4 py-2 rounded-lg bg-yellow-100 text-yellow-700 font-bold border border-yellow-200">
                                    <Clock className="w-5 h-5 mr-2" /> Requested
                                </span>
                            ) : (
                                <button
                                    onClick={async () => {
                                        if (!localStorage.getItem('candidate_docs')) {
                                            alert("Please complete all steps first!");
                                            return;
                                        }
                                        try {
                                            const res = await fetch('/api/candidates/request-offer', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ email: user.email })
                                            });
                                            if (res.ok) {
                                                alert("Offer Letter Requested Successfully!");
                                                window.location.reload(); // Simple reload to refresh state
                                            }
                                        } catch (err) {
                                            alert("Error requesting offer letter");
                                        }
                                    }}
                                    disabled={!localStorage.getItem('candidate_docs')}
                                    className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center ${localStorage.getItem('candidate_docs')
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    <FileText className="w-5 h-5 mr-2" /> Request Offer Letter
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
