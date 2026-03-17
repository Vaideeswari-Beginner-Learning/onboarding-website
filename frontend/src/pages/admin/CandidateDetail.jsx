import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth, API_BASE } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { ArrowLeft, Download, CheckCircle, XCircle, FileText, User, Eye, PartyPopper, Mail, Loader2, AlertCircle, Settings, Key } from 'lucide-react';
import { generateOfferLetter, generateOfferLetterBase64 } from '../../utils/offerLetterGenerator';

export default function CandidateDetail() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { id } = useParams();
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDonePopup, setShowDonePopup] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
    const [targetEmail, setTargetEmail] = useState('');
    const [setupEmail, setSetupEmail] = useState('vaideeswari8@gmail.com');
    const [savingSetup, setSavingSetup] = useState(false);
    const [appBaseUrl, setAppBaseUrl] = useState(localStorage.getItem('appBaseUrl') || window.location.origin);

    // --- Chat Hooks ---
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [suggestedUrl, setSuggestedUrl] = useState('');
    const [mailerStatus, setMailerStatus] = useState({ configured: false, user: '', service: 'gmail' });
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [emailSettings, setEmailSettings] = useState({ email: '', password: '', service: 'gmail' });
    const [testingConnection, setTestingConnection] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const chatEndRef = useRef(null);


    // Fetch Candidate Details
    useEffect(() => {
        const fetchCandidate = async () => {
            try {
                const token = localStorage.getItem('onboarding_token');
                const response = await fetch(`${API_BASE}/api/candidates/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
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

        // Fetch suggested IP for mobile testing
        const fetchSystemInfo = async () => {
            try {
                const token = localStorage.getItem('onboarding_token');
                const response = await fetch(`${API_BASE}/api/system-info`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.suggestedUrl) {
                        setSuggestedUrl(data.suggestedUrl);
                        if (appBaseUrl.includes('localhost')) {
                            setAppBaseUrl(data.suggestedUrl);
                            localStorage.setItem('appBaseUrl', data.suggestedUrl);
                        }
                    }
                    if (data.mailerConfigured !== undefined) {
                        setMailerStatus({
                            configured: data.mailerConfigured,
                            user: data.mailerUser,
                            service: data.mailerService || 'gmail'
                        });
                        if (data.mailerUser && data.mailerUser !== 'Not Configured') {
                            setEmailSettings(prev => ({
                                ...prev,
                                email: data.mailerUser,
                                service: data.mailerService || 'gmail'
                            }));
                        }
                    }
                }
            } catch (err) { console.log("System info fetch failed"); }
        };
        fetchSystemInfo();
    }, [id]);

    // Chat Logic - Fetch Messages
    useEffect(() => {
        if (!showChat || !candidate) return;

        const fetchMessages = async () => {
            try {
                const normalizedEmail = candidate.email.trim().toLowerCase();
                const token = localStorage.getItem('onboarding_token');
                const response = await fetch(`${API_BASE}/api/messages/${normalizedEmail}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
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
            senderName: user?.name || 'HR Admin',
            receiver: candidate.email.trim().toLowerCase(),
            text: chatInput
        };

        setMessages(prev => [...prev, { ...newMessage, timestamp: Date.now() }]);
        setChatInput('');

        try {
            const token = localStorage.getItem('onboarding_token');
            await fetch(`${API_BASE}/api/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
        companyAddress: '123 Tech Park, Innovation Street, Bangalore, Karnataka - 560001',
        recipientEmail: ''
    });

    useEffect(() => {
        if (candidate) {
            setOfferForm(prev => ({
                ...prev,
                employeeName: candidate.name,
                recipientEmail: candidate.email,
                jobRole: candidate.personalDetails?.jobRole || prev.jobRole
            }));
            setTargetEmail(candidate.email);
        }
    }, [candidate]);

    const handleOfferChange = (e) => {
        const { name, value } = e.target;
        setOfferForm(prev => ({ ...prev, [name]: value }));
    };

    const getStableBaseUrl = (rawUrl) => {
        if (!rawUrl) return window.location.origin.replace(':5173', ':5000');
        let url = rawUrl.trim();
        if (url.includes(':5173')) {
            url = url.replace(':5173', ':5000');
        } else if (!url.includes(':5000') && !url.includes('localhost')) {
            const ipv4Regex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
            if (ipv4Regex.test(url) && !url.includes(':')) {
                url = `${url}:5000`;
            }
        }
        return url;
    };

    const handlePrepareOffer = async (e) => {
        if (e) e.preventDefault();
        try {
            const token = localStorage.getItem('onboarding_token');
            const response = await fetch(`${API_BASE}/api/admin/generate-offer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    candidateId: candidate._id,
                    offerDetails: offerForm
                })
            });

            if (response.ok) {
                setShowOfferModal(false);
                setShowEmailConfirmModal(true);
            } else {
                alert("❌ Failed to save offer details on server.");
            }
        } catch (error) {
            console.error("Error saving offer details:", error);
            alert("❌ System Error: Unable to save details.");
        }
    };

    const [emailAuthFailed, setEmailAuthFailed] = useState(false);

    const handleFinalSendEmail = async (e) => {
        if (e) e.preventDefault();
        setSendingEmail(true);
        setEmailAuthFailed(false);
        try {
            const pdfBase64 = await generateOfferLetterBase64({ ...candidate, offerDetails: offerForm });
            const token = localStorage.getItem('onboarding_token');
            const emailResponse = await fetch(`${API_BASE}/api/admin/send-offer-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    candidateId: candidate._id,
                    pdfBase64,
                    customEmail: offerForm.recipientEmail,
                    appBaseUrl: getStableBaseUrl(appBaseUrl)
                })
            });

            const emailData = await emailResponse.json();

            if (emailResponse.ok) {
                alert(`✅ Done! Offer Letter has been sent from HR to ${offerForm.recipientEmail} successfully.`);
                setShowEmailConfirmModal(false);
                setCandidate(prev => ({ ...prev, offerLetterStatus: 'Sent' }));
            } else if (emailData.error === 'AUTH_FAILED') {
                setEmailAuthFailed(true);
            } else {
                const detailedError = emailData.detail ? `\n\nDetail: ${emailData.detail}` : (emailData.message || 'Check connection');
                alert(`❌ Email failed: ${detailedError}`);
            }
        } catch (error) {
            console.error("Error in final send flow:", error);
            alert("❌ System Error: Unable to send email.");
        } finally {
            setSendingEmail(false);
        }
    };

    const handleManualSendFallback = async () => {
        setSendingEmail(true);
        try {
            const pdfBase64 = await generateOfferLetterBase64({ ...candidate, offerDetails: offerForm });
            const token = localStorage.getItem('onboarding_token');
            await fetch(`${API_BASE}/api/admin/save-offer-pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    candidateId: candidate._id,
                    pdfBase64
                })
            });

            const subject = encodeURIComponent(`Offer Letter - Forge India Connect`);
            let stableBaseUrl = appBaseUrl.replace(':5173', ':5000');
            if (stableBaseUrl.includes('localhost') && !stableBaseUrl.includes(':5000')) {
                stableBaseUrl = stableBaseUrl.replace(':5173', ':5000');
            }

            const downloadUrl = `${stableBaseUrl}/api/public/offer-pdf/${candidate._id}`;
            const body = encodeURIComponent(`Dear ${offerForm.employeeName},\n\nCongratulations! We are pleased to offer you the position of ${offerForm.jobRole}.\n\nYour official Offer Letter has been prepared and is ready for review.\n\nView/Download Offer Letter: ${downloadUrl}\n\n(Note: If you expected a PDF attachment, please ensure the HR System's Gmail SMTP is correctly configured with a 16-digit App Password).\n\nBest Regards,\nHR Administration Team\n${offerForm.companyName}`);
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${offerForm.recipientEmail}&su=${subject}&body=${body}`;
            window.open(gmailUrl, '_blank');

            setShowEmailConfirmModal(false);
            setCandidate(prev => ({ ...prev, offerLetterStatus: 'Sent (Manual)' }));
        } catch (error) {
            console.error("Error in manual send fallback:", error);
            alert("❌ Failed to prepare manual email. Please try again.");
        } finally {
            setSendingEmail(false);
        }
    };

    const handleTestConnection = async (e) => {
        e.preventDefault();
        setTestingConnection(true);
        setTestResult(null);
        try {
            const token = localStorage.getItem('onboarding_token');
            const response = await fetch(`${API_BASE}/api/admin/test-email-connection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(emailSettings)
            });
            const data = await response.json();
            setTestResult({ success: response.ok, message: data.message });
        } catch (error) {
            setTestResult({ success: false, message: 'Connection failed. Check your network.' });
        } finally {
            setTestingConnection(false);
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            const token = localStorage.getItem('onboarding_token');
            const response = await fetch(`${API_BASE}/api/admin/update-email-setup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(emailSettings)
            });
            const data = await response.json();
            if (response.ok) {
                alert('✅ Settings saved successfully!');
                setShowSettingsModal(false);
                setMailerStatus({ configured: true, user: emailSettings.email });
            } else {
                alert(`❌ Failed to save: ${data.message}`);
            }
        } catch (error) {
            alert('❌ System Error: Unable to save settings.');
        } finally {
            setSavingSettings(false);
        }
    };

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
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-6 mb-8 rounded-2xl flex justify-between items-center shadow-md animate-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-amber-900 font-bold text-lg leading-tight">Offer Letter Requested</h3>
                                <p className="text-amber-700 text-sm mt-0.5">
                                    Candidate is waiting for approval. <span className="ml-1 font-bold bg-amber-200/50 px-2 py-0.5 rounded text-amber-900 text-xs uppercase">Role: {personal.jobRole || 'N/A'}</span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowOfferModal(true)}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-2.5 px-6 rounded-xl shadow-lg shadow-amber-200 transition-all hover:scale-105 active:scale-95 text-sm"
                        >
                            Generate & Approve
                        </button>
                    </div>
                )}

                {(candidate.offerLetterStatus === 'Generated' || candidate.offerLetterStatus === 'Sent') && (
                    <div className={`${candidate.offerLetterStatus === 'Sent' ? 'bg-blue-50 border-blue-400' : 'bg-emerald-50 border-emerald-400'} border-l-4 p-4 mb-6 rounded-xl flex justify-between items-center shadow-sm`}>
                        <div className="flex items-center">
                            {candidate.offerLetterStatus === 'Sent' ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Mail className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <span className="text-blue-800 font-semibold text-sm">Offer Letter Sent to {candidate.email}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <FileText className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <span className="text-emerald-800 font-semibold text-sm">Offer Letter Generated</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => generateOfferLetter(candidate)}
                                className="inline-flex items-center px-4 py-2 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-xs rounded-lg shadow-sm transition-all hover:scale-105 active:scale-95"
                            >
                                <Download className="w-3.5 h-3.5 mr-2" /> Download Copy
                            </button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10 md:flex justify-between items-center">
                        <div className="flex gap-6 items-center">
                            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-200">
                                {candidate.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{candidate.name}</h1>
                                <p className="text-slate-500 font-medium mt-1">{candidate.role || 'Candidate'} • ID: {candidate._id?.slice(-6).toUpperCase()}</p>
                                <div className="mt-3 flex gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${candidate.status === 'Verified' ? 'bg-green-100 text-green-700' :
                                        candidate.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        } `}>
                                        ● {candidate.status}
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                                        Joined {new Date(candidate.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-6 md:mt-0 items-center">
                            {!mailerStatus.configured && (
                                <button
                                    onClick={() => setShowSettingsModal(true)}
                                    className="mr-2 flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 animate-pulse hover:bg-rose-100 transition-colors"
                                >
                                    <Settings className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase">Configure Mailer</span>
                                </button>
                            )}
                            <button
                                className="inline-flex items-center px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-200 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all hover:-translate-y-0.5"
                                onClick={() => setShowOfferModal(true)}
                            >
                                <Mail className="w-4 h-4 mr-2" /> Send Offer
                            </button>
                            <button className="inline-flex items-center px-5 py-2.5 rounded-xl shadow-lg shadow-blue-200 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all hover:-translate-y-0.5" onClick={() => setShowChat(true)}>
                                <User className="w-4 h-4 mr-2" /> Chat
                            </button>
                            <button className="inline-flex items-center px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all">
                                <XCircle className="w-4 h-4 mr-2 text-red-500" /> Reject
                            </button>
                            <button
                                onClick={() => setShowDonePopup(true)}
                                className="inline-flex items-center px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-200 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all hover:-translate-y-0.5">
                                <CheckCircle className="w-4 h-4 mr-2" /> Approve
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
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

                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-slate-500" />
                                Submitted Documents
                            </h3>
                            <div className="space-y-4">
                                {docs.length === 0 ? (
                                    <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500 font-medium">No documents submitted yet.</p>
                                    </div>
                                ) : (
                                    docs.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group">
                                            <div className="flex items-center">
                                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div className="ml-4">
                                                    <p className="text-sm font-bold text-slate-900">{doc.name}</p>
                                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">{doc.type} • {doc.size}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="View">
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <div className="h-6 w-px bg-slate-200 mx-1"></div>
                                                <button className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Approve">
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                                <button className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Reject">
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
            </main>

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
                            <form id="offerForm" onSubmit={handlePrepareOffer} className="space-y-4">
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
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Employee Email Address</label>
                                        <input type="email" name="recipientEmail" value={offerForm.recipientEmail} onChange={handleOfferChange} required className="w-full rounded-lg border-slate-300 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="employee@example.com" />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                            <button type="button" onClick={() => setShowOfferModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm">Cancel</button>
                            <button type="submit" form="offerForm" className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center">
                                Next Step <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Confirmation Email Modal */}
            {showEmailConfirmModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowEmailConfirmModal(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                                <Mail className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Confirm Email Address</h2>
                            <p className="text-sm text-slate-500 mb-6">Please verify the employee's email address before sending the Offer Letter.</p>

                            <div className="space-y-4 text-left">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Confirm Recipient Email:</label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                                        <input
                                            type="email"
                                            value={offerForm.recipientEmail}
                                            onChange={(e) => setOfferForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="Verify email address"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 italic">* You can edit this if the pre-filled email is incorrect.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-8">
                                <button
                                    onClick={() => {
                                        setShowEmailConfirmModal(false);
                                        setShowOfferModal(true);
                                    }}
                                    className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold text-sm transition-colors"
                                >
                                    Go Back
                                </button>
                                {emailAuthFailed ? (
                                    <button
                                        onClick={handleManualSendFallback}
                                        className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center animate-pulse"
                                    >
                                        Send Manually <ArrowLeft className="ml-2 w-4 h-4 rotate-180" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleFinalSendEmail}
                                        disabled={sendingEmail}
                                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center disabled:opacity-50"
                                    >
                                        {sendingEmail ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>Send Now <CheckCircle className="ml-2 w-4 h-4" /></>
                                        )}
                                    </button>
                                )}
                            </div>
                            {emailAuthFailed && (
                                <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl text-left">
                                    <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5 mb-1">
                                        <AlertCircle className="w-3.5 h-3.5" /> Email Delivery Failed
                                    </p>
                                    <p className="text-[10px] text-rose-600 leading-relaxed">
                                        The system couldn't send the PDF attachment automatically. This is usually due to an <strong>invalid Gmail App Password</strong> in your .env file.
                                    </p>
                                    <p className="text-[10px] text-rose-600 mt-2 italic font-medium">
                                        Offline Backup: Click "Send Manually" below to open Gmail with a download link instead.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Modal */}
            {showChat && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowChat(false)}></div>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
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

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                            {messages.length === 0 ? (
                                <div className="text-center text-slate-400 mt-10">
                                    <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>Start a conversation with {candidate.name}</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'} `}>
                                        <div className={`py-2 px-3 text-sm shadow-sm max-w-[80%] rounded-2xl ${msg.sender === 'admin'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                            } `}>
                                            <p>{msg.text}</p>
                                            <div className={`text-[10px] mt-1 opacity-70 ${msg.sender === 'admin' ? 'text-blue-100 text-right' : 'text-slate-400'} `}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                                <ArrowLeft className="w-4 h-4 rotate-180" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Done Popup */}
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

            {/* System Configuration - For Mobile Testing */}
            <div className="max-w-4xl mx-auto mt-12 mb-20 px-4">
                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">System Configuration</h3>
                                <p className="text-slate-400 text-sm">Required for mobile link testing</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Backend IP Address (Important!)</label>
                                    <input
                                        type="text"
                                        value={appBaseUrl}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setAppBaseUrl(val);
                                            localStorage.setItem('appBaseUrl', val);
                                        }}
                                        placeholder="http://192.168.1.5:5000"
                                        className="w-full bg-slate-800 border-slate-700 rounded-xl text-white py-3 px-4 focus:ring-2 focus:ring-blue-500 transition-all text-sm font-mono"
                                    />
                                </div>
                                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                                    <p className="text-xs text-orange-300 leading-relaxed mb-3">
                                        <strong>⚠️ Warning:</strong> Your current URL is <code>{appBaseUrl}</code>. If it says <b>localhost</b>, it will <strong>NOT</strong> work on your phone.
                                    </p>
                                    {suggestedUrl && suggestedUrl !== appBaseUrl && (
                                        <button
                                            onClick={() => {
                                                setAppBaseUrl(suggestedUrl);
                                                localStorage.setItem('appBaseUrl', suggestedUrl);
                                            }}
                                            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95 mb-2"
                                        >
                                            🚀 Auto-Fix for Mobile Testing
                                        </button>
                                    )}
                                    <p className="text-[10px] text-slate-400 leading-relaxed">
                                        Detecting server at: <code>{suggestedUrl || 'Counting...'}</code>.
                                        Enter <code>http://[DEVICE_IP]:5000</code> for mobile.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-500/20">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>All links updated instantly</span>
                                </div>
                                <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">Current Link Prefix: {appBaseUrl}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Email Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowSettingsModal(false)}></div>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-xl">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <h2 className="text-xl font-bold">Email Configuration</h2>
                                </div>
                                <button onClick={() => setShowSettingsModal(false)} className="hover:bg-white/10 p-1 rounded-lg transition-colors">
                                    <XCircle className="w-6 h-6 text-white" />
                                </button>
                            </div>
                        </div>

                        <div className="p-8">
                            <form className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Email Provider</label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setEmailSettings(prev => ({ ...prev, service: 'gmail' }))}
                                            className={`flex-1 py-3 px-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-bold text-sm ${emailSettings.service === 'gmail' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md shadow-blue-100' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${emailSettings.service === 'gmail' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                                                {emailSettings.service === 'gmail' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                            </div>
                                            Gmail
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEmailSettings(prev => ({ ...prev, service: 'brevo' }))}
                                            className={`flex-1 py-3 px-4 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 font-bold text-sm ${emailSettings.service === 'brevo' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${emailSettings.service === 'brevo' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                                                {emailSettings.service === 'brevo' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                            </div>
                                            Brevo
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                        {emailSettings.service === 'brevo' ? 'Brevo Login Email / User' : 'Gmail Address'}
                                    </label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="email"
                                            value={emailSettings.email}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder={emailSettings.service === 'brevo' ? 'brevo-user@example.com' : 'hr@example.com'}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                        {emailSettings.service === 'brevo' ? 'SMTP Key (v3)' : 'Gmail App Password (16 Letters)'}
                                    </label>
                                    <div className="relative">
                                        <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="password"
                                            value={emailSettings.password}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                                            placeholder={emailSettings.service === 'brevo' ? 'xkeysib-...' : 'xxxx xxxx xxxx xxxx'}
                                        />
                                    </div>
                                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[10px] text-slate-600 leading-relaxed">
                                            {emailSettings.service === 'brevo' ? (
                                                <><b>Note:</b> Get your SMTP Key from <b>Brevo &gt; SMTP & API &gt; SMTP</b>.</>
                                            ) : (
                                                <><b>Note:</b> Use a 16-digit Google <b>"App Password"</b>, not your login password.</>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {testResult && (
                                    <div className={`p-4 rounded-2xl border flex gap-3 items-center ${testResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                                        {testResult.success ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
                                        <span className="text-xs font-medium">{testResult.message}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleTestConnection}
                                        disabled={testingConnection || !emailSettings.email || !emailSettings.password}
                                        className="py-3 px-4 border-2 border-slate-100 rounded-2xl text-slate-600 hover:bg-slate-50 font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {testingConnection ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test Connection'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveSettings}
                                        disabled={savingSettings || !emailSettings.email || !emailSettings.password}
                                        className="py-3 px-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 font-bold text-sm shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Settings'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
