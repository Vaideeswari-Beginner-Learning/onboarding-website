import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { ArrowLeft, Download, CheckCircle, XCircle, FileText, User, Eye, PartyPopper } from 'lucide-react';
import { generateOfferLetter } from '../../utils/offerLetterGenerator';

export default function CandidateDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDonePopup, setShowDonePopup] = useState(false);

    // --- Chat Hooks (Moved to Top) ---
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef(null);

    const API_BASE = import.meta.env.VITE_API_URL || '';

    // Fetch Candidate Details
    useEffect(() => {
        const fetchCandidate = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/candidates/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setCandidate(data);
                } else {
                    console.error('Failed to fetch candidate details');
                }
            } catch (error) {
                console.error('Error fetching candidate:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchCandidate();
    }, [id]);

    // Chat Logic - Fetch Messages
    useEffect(() => {
        if (!showChat || !candidate) return;

        const fetchMessages = async () => {
            try {
                const normalizedEmail = candidate.email.trim().toLowerCase();
                const response = await fetch(`${API_BASE}/api/messages/${normalizedEmail}`);
                if (response.ok) {
                    const data = await response.json();
                    setMessages(data);
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [showChat, candidate]);

    // Chat Logic - Scroll to Bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, showChat]);

    // Chat Logic - Send Message
    const handleSendChat = async (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const newMessage = {
            sender: 'admin',
            senderName: 'HR Admin',
            receiver: candidate.email.trim().toLowerCase(),
            text: chatInput
        };

        // Optimistic update
        setMessages(prev => [...prev, { ...newMessage, timestamp: Date.now() }]);
        setChatInput('');

        try {
            await fetch(`${API_BASE}/api/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMessage)
            });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    // --- Offer Letter Modal State ---
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [offerForm, setOfferForm] = useState({
        employeeName: '',
        adminName: 'HR Manager',
        jobRole: '',
        ctc: '',
        companyName: 'Forge India Connect',
        location: 'Bangalore',
        joiningDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        responsibilities: '',
        companyAddress: '123 Tech Park, Innovation Street, Bangalore, Karnataka - 560001'
    });

    // Populate details when candidate loads
    useEffect(() => {
        if (candidate) {
            setOfferForm(prev => ({
                ...prev,
                employeeName: candidate.name,
                jobRole: candidate.personalDetails?.jobRole || prev.jobRole
            }));
        }
    }, [candidate]);

    const handleOfferChange = (e) => {
        const { name, value } = e.target;
        setOfferForm(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerateOffer = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE}/api/admin/generate-offer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateId: candidate._id,
                    offerDetails: offerForm
                })
            });

            if (response.ok) {
                alert("Offer Letter Generated Successfully!");
                setShowOfferModal(false);
                window.location.reload();
            } else {
                alert("Failed to generate offer letter.");
            }
        } catch (error) {
            console.error("Error generating offer:", error);
            alert("Error generating offer letter.");
        }
    };

    // --- Conditional Rendering Checks ---

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>;
    }

    if (!candidate) {
        return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
            <h2 className="text-xl font-bold mb-2">Candidate Not Found</h2>
            <button onClick={() => navigate('/admin/dashboard')} className="text-blue-600 hover:underline">Return to Dashboard</button>
        </div>;
    }

    const personal = candidate.personalDetails || {};
    const bank = candidate.bankDetails || {};
    const docs = candidate.documents || [];

    return (
        <div className="min-h-screen bg-slate-50 relative">
            <Navbar />

            <main className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-all ${showDonePopup || showChat || showOfferModal ? 'blur-sm brightness-50' : ''}`}>
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                </button>

                {/* Offer Letter Notification */}
                {candidate.offerLetterRequested && candidate.offerLetterStatus !== 'Generated' && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg flex justify-between items-center animate-in slide-in-from-top-2">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <FileText className="h-5 w-5 text-yellow-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    <span className="font-bold">Action Required:</span> Candidate has requested their Offer Letter.
                                    <span className="ml-2 text-xs bg-white px-2 py-0.5 rounded border border-yellow-200">Role: {personal.jobRole}</span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowOfferModal(true)}
                            className="text-sm bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-1 px-4 rounded shadow-sm transition-colors"
                        >
                            Generate & Approve
                        </button>
                    </div>
                )}

                {candidate.offerLetterStatus === 'Generated' && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-r-lg flex justify-between items-center">
                        <div className="flex items-center">
                            <FileText className="h-5 w-5 text-green-500 mr-2" />
                            <span className="text-green-700 font-medium">Offer Letter Generated</span>
                        </div>
                        <button
                            onClick={() => generateOfferLetter(candidate)}
                            className="text-sm bg-white border border-green-200 text-green-700 hover:bg-green-50 font-bold py-1 px-4 rounded shadow-sm transition-colors flex items-center"
                        >
                            <Download className="w-4 h-4 mr-1" /> Download Copy
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
                    <div className="md:flex justify-between items-start">
                        <div className="flex gap-4">
                            <div className="h-20 w-20 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold uppercase">
                                {candidate.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{candidate.name}</h1>
                                <p className="text-slate-500">{candidate.role || 'Role N/A'} • ID: {candidate._id?.slice(-6).toUpperCase()}</p>
                                <div className="mt-2 flex gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${candidate.status === 'Verified' ? 'bg-green-100 text-green-800' :
                                        candidate.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                        {candidate.status}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                        Joined {new Date(candidate.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4 md:mt-0">
                            {/* Actions mock for now */}
                            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700" onClick={() => setShowChat(true)}>
                                <User className="w-4 h-4 mr-2" /> Chat
                            </button>
                            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                                <XCircle className="w-4 h-4 mr-2" /> Reject
                            </button>
                            <button
                                onClick={() => setShowDonePopup(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                                <CheckCircle className="w-4 h-4 mr-2" /> Approve
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Personal Details */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                <User className="w-5 h-5 mr-2 text-slate-500" />
                                Personal Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
                                    <p className="text-sm text-slate-900 font-medium break-words">{candidate.email}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</label>
                                    <p className="text-sm text-slate-900 font-medium">{personal.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Address</label>
                                    <p className="text-sm text-slate-900 font-medium">{personal.address || 'N/A'}</p>
                                    {personal.city && <p className="text-sm text-slate-500">{personal.city}, {personal.state} {personal.zip}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Emergency Contact</label>
                                    <p className="text-sm text-slate-900 font-medium">{personal.emergencyName || 'N/A'}</p>
                                    <p className="text-xs text-slate-500">{personal.emergencyPhone}</p>
                                </div>
                            </div>
                        </div>

                        {/* Bank Details */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-slate-500" />
                                Bank Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Holder</label>
                                    <p className="text-sm text-slate-900 font-medium">{bank.accountName || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Designation / Role</label>
                                    <p className="text-sm text-slate-900 font-medium bg-blue-50 px-2 py-1 rounded inline-block text-blue-700">
                                        {personal.jobRole || 'Not Specified'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bank & Branch</label>
                                    <p className="text-sm text-slate-900 font-medium">{bank.bankName || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Number</label>
                                    <p className="text-sm text-slate-900 font-medium">{bank.accountNumber || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">IFSC / PAN</label>
                                    <p className="text-sm text-slate-900 font-medium">{bank.ifscCode} / {bank.panNumber}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Documents */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-slate-500" />
                                Submitted Documents
                            </h3>

                            <div className="space-y-4">
                                {docs.length === 0 ? (
                                    <p className="text-slate-500 text-center py-4">No documents submitted yet.</p>
                                ) : (
                                    docs.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                                            <div className="flex items-center">
                                                <div className="bg-white p-2 rounded-lg border border-slate-200">
                                                    <FileText className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                                                    <p className="text-xs text-slate-500">{doc.type} • {doc.size}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="View">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <div className="h-6 w-px bg-slate-300 mx-2"></div>
                                                <button className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors" title="Approve">
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                                <button className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Reject">
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={() => setShowDonePopup(true)}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all text-lg flex items-center"
                            >
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Verification Done
                            </button>
                        </div>
                    </div>
                </div>
            </main >

            {/* Offer Letter Modal */}
            {showOfferModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowOfferModal(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-slate-900">Generate Offer Letter</h2>
                            <button onClick={() => setShowOfferModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form id="offerForm" onSubmit={handleGenerateOffer} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Employee Name (To)</label>
                                        <input type="text" name="employeeName" value={offerForm.employeeName} onChange={handleOfferChange} required className="w-full rounded-lg border-slate-300 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                                        <input type="text" name="companyName" value={offerForm.companyName} onChange={handleOfferChange} required className="w-full rounded-lg border-slate-300 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Location</label>
                                        <input type="text" name="location" value={offerForm.location} onChange={handleOfferChange} required className="w-full rounded-lg border-slate-300 text-sm" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Address</label>
                                        <input type="text" name="companyAddress" value={offerForm.companyAddress} onChange={handleOfferChange} required className="w-full rounded-lg border-slate-300 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Admin Name / Sender</label>
                                        <input type="text" name="adminName" value={offerForm.adminName} onChange={handleOfferChange} required className="w-full rounded-lg border-slate-300 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Joining Date</label>
                                        <input type="date" name="joiningDate" value={offerForm.joiningDate} onChange={handleOfferChange} required className="w-full rounded-lg border-slate-300 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Candidate Role</label>
                                        <input type="text" name="jobRole" value={offerForm.jobRole} onChange={handleOfferChange} required className="w-full rounded-lg border-slate-300 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Annual CTC</label>
                                        <input type="text" name="ctc" value={offerForm.ctc} onChange={handleOfferChange} placeholder="e.g. 12 LPA" required className="w-full rounded-lg border-slate-300 text-sm" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Roles & Responsibilities</label>
                                        <textarea name="responsibilities" value={offerForm.responsibilities} onChange={handleOfferChange} rows={3} placeholder="Brief summary of duties..." className="w-full rounded-lg border-slate-300 text-sm" />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                            <button type="button" onClick={() => setShowOfferModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm">Cancel</button>
                            <button type="submit" form="offerForm" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-sm">Generate & Send</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Modal */}
            {showChat && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowChat(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Chat Header */}
                        <div className="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3 font-bold border border-blue-400">
                                    {candidate.name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">{candidate.name}</h3>
                                    <p className="text-xs text-blue-100">{candidate.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowChat(false)} className="hover:bg-blue-700 p-1.5 rounded-lg transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                            {messages.length === 0 ? (
                                <div className="text-center text-slate-400 mt-10">
                                    <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>Start a conversation with {candidate.name}</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`py-2 px-3 text-sm shadow-sm max-w-[80%] rounded-2xl ${msg.sender === 'admin'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                            }`}>
                                            <p>{msg.text}</p>
                                            <div className={`text-[10px] mt-1 opacity-70 ${msg.sender === 'admin' ? 'text-blue-100 text-right' : 'text-slate-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                                <ArrowLeft className="w-4 h-4 rotate-180" /> {/* Send icon hack if Send not imported, but wait, look at imports */}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Done Popup - kept as is */}
            {showDonePopup && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center relative overflow-hidden border border-slate-100">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                            <PartyPopper className="w-10 h-10" />
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h2>
                        <p className="text-slate-600 mb-8">The candidate's profile has been verified successfully.</p>

                        <button
                            onClick={() => {
                                setShowDonePopup(false);
                                navigate('/admin/dashboard');
                            }}
                            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div >
    );
}
