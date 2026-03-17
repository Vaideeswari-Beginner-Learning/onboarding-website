import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { Users, Search, Filter, MoreVertical, Eye, FileText, CheckCircle, XCircle, Clock, MessageSquare, Send, X, Trash2, Settings, Key, Mail, Loader2, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [candidates, setCandidates] = useState([]);
    const [selectedChatCandidate, setSelectedChatCandidate] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [adminInput, setAdminInput] = useState('');
    const [retentionWarnings, setRetentionWarnings] = useState([]);
    const chatEndRef = useRef(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [emailSettings, setEmailSettings] = useState({ email: '', password: '' });
    const [testingConnection, setTestingConnection] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [mailerStatus, setMailerStatus] = useState({ configured: false, user: '' });


    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                const token = localStorage.getItem('onboarding_token');
                const response = await fetch(`${API_BASE}/api/candidates`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setCandidates(data.reverse());
                } else {
                    console.error('Failed to fetch candidates');
                }
            } catch (error) {
                console.error('Error fetching candidates:', error);
            }
        };

        const checkRetention = async () => {
            try {
                const token = localStorage.getItem('onboarding_token');
                const response = await fetch(`${API_BASE}/api/admin/check-retention`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.clearedCount > 0) {
                        alert(`Retention Policy: Documents for ${data.clearedCount} candidate(s) were older than 90 days and have been deleted.`);
                        fetchCandidates(); // Refresh list
                    }
                    if (data.warnings && data.warnings.length > 0) {
                        setRetentionWarnings(data.warnings);
                    }
                }
            } catch (error) {
                // Silently ignore retention check errors during polling
            }
        };

        const fetchMailerStatus = async () => {
            try {
                const token = localStorage.getItem('onboarding_token');
                const response = await fetch(`${API_BASE}/api/system-info`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.mailerConfigured !== undefined) {
                        setMailerStatus({ configured: data.mailerConfigured, user: data.mailerUser });
                        if (data.mailerUser && data.mailerUser !== 'Not Configured') {
                            setEmailSettings(prev => ({ ...prev, email: data.mailerUser }));
                        }
                    }
                }
            } catch (err) { console.log("System info fetch failed"); }
        };

        fetchCandidates();
        checkRetention();
        fetchMailerStatus();

        // POLL FOR UPDATES: Refresh candidate list and retention every 5 seconds for real-time notifications
        const pollInterval = setInterval(() => {
            fetchCandidates();
            checkRetention();
        }, 5000);

        return () => clearInterval(pollInterval);
    }, []);

    // ... (chat polling effect omitted, see next replace block if needed)

    // ... (handleSendAdminMessage omitted)

    // ... (handleDeleteMessage omitted)

    const handleDeleteCandidate = async (candidateId) => {
        if (window.confirm('Are you sure you want to permanently delete this candidate? This action cannot be undone.')) {
            try {
                const token = localStorage.getItem('onboarding_token');
                const response = await fetch(`${API_BASE}/api/candidates/${candidateId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    setCandidates(candidates.filter(c => c._id !== candidateId && c.id !== candidateId));
                    // Also close chat if it was open for this candidate
                    if (selectedChatCandidate && (selectedChatCandidate._id === candidateId || selectedChatCandidate.id === candidateId)) {
                        setSelectedChatCandidate(null);
                    }
                } else {
                    alert('Failed to delete candidate');
                }
            } catch (error) {
                console.error('Error deleting candidate:', error);
                alert('Error deleting candidate');
            }
        }
    };

    const handleResetCandidate = async (candidateId) => {
        if (window.confirm('Reset this candidate\'s onboarding? Documents will be cleared and status will return to "Pending".')) {
            try {
                const token = localStorage.getItem('onboarding_token');
                const response = await fetch(`${API_BASE}/api/admin/reset-candidate/${candidateId}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    alert('Candidate reset successfully!');
                    // Refresh localized data or list
                    window.location.reload();
                } else {
                    alert('Failed to reset candidate');
                }
            } catch (error) {
                console.error('Reset Error:', error);
                alert('Error resetting candidate');
            }
        }
    };

    // Poll for chat messages when a chat is open
    useEffect(() => {
        if (!selectedChatCandidate) return;

        const loadChat = async () => {
            // Load from backend
            try {
                const token = localStorage.getItem('onboarding_token');
                const response = await fetch(`${API_BASE}/api/messages/${selectedChatCandidate.email}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setChatMessages(data);
                    // Update local storage as backup
                    localStorage.setItem(`chat_history_${selectedChatCandidate.email}`, JSON.stringify(data));
                }
            } catch (error) {
                console.error('Error loading chat:', error);
                // Fallback to local
                const history = localStorage.getItem(`chat_history_${selectedChatCandidate.email}`);
                if (history) setChatMessages(JSON.parse(history));
            }
        };

        loadChat();
        const interval = setInterval(loadChat, 1000);
        return () => clearInterval(interval);
    }, [selectedChatCandidate]);

    // Scroll to bottom on new message
    useEffect(() => {
        if (selectedChatCandidate) {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages, selectedChatCandidate]);

    const handleSendAdminMessage = async (e) => {
        e.preventDefault();
        if (!adminInput.trim() || !selectedChatCandidate) return;

        const newMsg = {
            text: adminInput,
            sender: 'admin',
            timestamp: Date.now()
        };

        // Optimistic UI update
        const updatedHistory = [...chatMessages, newMsg];
        setChatMessages(updatedHistory);
        localStorage.setItem(`chat_history_${selectedChatCandidate.email}`, JSON.stringify(updatedHistory));
        setAdminInput('');

        // Send to backend
        try {
            const token = localStorage.getItem('onboarding_token');
            await fetch(`${API_BASE}/api/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sender: 'admin',
                    senderName: user?.name || 'Admin',
                    receiver: selectedChatCandidate.email,
                    text: newMsg.text
                })
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleDeleteMessage = (index) => {
        if (!selectedChatCandidate) return;
        const updatedHistory = chatMessages.filter((_, i) => i !== index);
        setChatMessages(updatedHistory);
        localStorage.setItem(`chat_history_${selectedChatCandidate.email}`, JSON.stringify(updatedHistory));
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

    // Removed duplicate handleDeleteCandidate from here

    const handleDownloadAll = async (candidate) => {
        if (!candidate.documents || candidate.documents.length === 0) {
            alert('No documents to download.');
            return;
        }

        const zip = new JSZip();
        let count = 0;

        candidate.documents.forEach((doc) => {
            if (doc.url && doc.url.startsWith('data:')) {
                // Remove header "data:application/pdf;base64,"
                const base64Data = doc.url.split(',')[1];
                zip.file(doc.name, base64Data, { base64: true });
                count++;
            }
        });

        if (count === 0) {
            alert('No valid documents found to download (documents might be from before the Base64 update).');
            return;
        }

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${candidate.name}_Documents.zip`);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Verified':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center md:w-fit"><CheckCircle className="w-3 h-3 mr-1" /> Verified</span>;
            case 'Rejected':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center md:w-fit"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
            case 'Submitted':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex items-center md:w-fit"><Clock className="w-3 h-3 mr-1" /> Submitted</span>;
            default:
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center md:w-fit"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 relative">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header and Stats code remains same, omitted for brevity but keeping structure */}
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                        <p className="mt-1 text-slate-500">Manage ongoing onboardings and verify documents.</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-3">
                        {!mailerStatus.configured && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 animate-pulse">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase">Mailer Not Configured</span>
                            </div>
                        )}
                        <button
                            onClick={() => setShowSettingsModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm rounded-xl shadow-sm transition-all"
                        >
                            <Settings className="w-4 h-4 mr-2" /> Settings
                        </button>
                    </div>
                </div>

                {/* Offer Request Alert */}
                {candidates.some(c => c.offerLetterStatus === 'Requested') && (
                    <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-4">
                        <div className="flex items-center">
                            <div className="bg-purple-100 p-2 rounded-lg mr-4 text-purple-600">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-purple-900">
                                    {candidates.filter(c => c.offerLetterStatus === 'Requested').length} Pending Offer Request(s)
                                </h3>
                                <p className="text-sm text-purple-700">Candidates have completed onboarding and are waiting for their offer letter.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Retention Warning Alert */}
                {retentionWarnings.length > 0 && (
                    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-4">
                        <div className="flex items-center">
                            <div className="bg-amber-100 p-2 rounded-lg mr-4 text-amber-600">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-amber-900">
                                    {retentionWarnings.length} Candidate(s) Approaching Document Deletion
                                </h3>
                                <p className="text-sm text-amber-700">
                                    Documents for {retentionWarnings.map(w => `${w.name} (${w.daysLeft} days left)`).join(', ')} will be permanently deleted soon. Please download them.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Candidates Table */}
                <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden mt-8">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Candidate</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {candidates.map((candidate) => (
                                    <tr key={candidate.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                        {candidate.name.charAt(0)}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900">{candidate.name}</div>
                                                    <div className="text-sm text-slate-500">{candidate.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900">{candidate.role}</div>
                                            <div className="text-xs text-slate-500">{candidate.date}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                {getStatusBadge(candidate.status)}
                                                {candidate.offerLetterStatus === 'Requested' && (
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 flex items-center md:w-fit animate-pulse">
                                                        <FileText className="w-3 h-3 mr-1" /> Offer Requested
                                                    </span>
                                                )}
                                                {candidate.offerLetterStatus === 'Generated' && (
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-600 flex items-center md:w-fit border border-green-200">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Offer Sent
                                                    </span>
                                                )}
                                                {candidate.offerLetterStatus === 'Sent' && (
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600 flex items-center md:w-fit border border-blue-200">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Emailed ✉️
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDownloadAll(candidate)}
                                                className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-md mr-2 transition-colors inline-flex items-center"
                                                title="Download All Documents"
                                            >
                                                <FileText className="w-4 h-4 mr-1" /> Zip
                                            </button>
                                            <button
                                                onClick={() => setSelectedChatCandidate(candidate)}
                                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md mr-2 transition-colors inline-flex items-center"
                                            >
                                                <MessageSquare className="w-4 h-4 mr-1" /> Chat
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCandidate(candidate._id || candidate.id)}
                                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md mr-2 transition-colors inline-flex items-center"
                                                title="Delete Candidate"
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" /> Remove
                                            </button>
                                            <button
                                                onClick={() => handleResetCandidate(candidate._id || candidate.id)}
                                                className="text-amber-600 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-md mr-2 transition-colors inline-flex items-center"
                                                title="Reset Onboarding"
                                            >
                                                <Clock className="w-4 h-4 mr-1" /> Reset
                                            </button>
                                            <button
                                                onClick={() => navigate(`/admin/candidate/${candidate._id || candidate.id}`)}
                                                className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-md transition-colors inline-flex items-center"
                                            >
                                                <Eye className="w-4 h-4 mr-1" /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Chat Modal */}
            {selectedChatCandidate && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[600px] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
                            <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold mr-3">
                                    {selectedChatCandidate.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold">{selectedChatCandidate.name}</h3>
                                    <p className="text-xs text-slate-400">{selectedChatCandidate.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedChatCandidate(null)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-4">
                            {chatMessages.length === 0 ? (
                                <div className="text-center text-slate-400 mt-10">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                chatMessages.map((msg, idx) => (
                                    <div key={idx} className={`flex items-center gap-2 ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'} group hover:bg-slate-100/50 rounded-lg p-1 transition-colors`}>
                                        {/* Admin Delete (Left) */}
                                        {msg.sender === 'admin' && (
                                            <button
                                                onClick={() => handleDeleteMessage(idx)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                                title="Delete Message"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}

                                        <div className={`py-3 px-4 max-w-[80%] rounded-2xl shadow-sm text-sm ${msg.sender === 'admin'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                            }`}>
                                            {msg.text}
                                        </div>

                                        {/* Candidate Delete (Right) - Admin can delete these too */}
                                        {msg.sender !== 'admin' && (
                                            <button
                                                onClick={() => handleDeleteMessage(idx)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                                title="Delete Message"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendAdminMessage} className="p-4 bg-white border-t border-slate-100 flex gap-3 shrink-0">
                            <input
                                type="text"
                                value={adminInput}
                                onChange={(e) => setAdminInput(e.target.value)}
                                placeholder="Type your reply..."
                                className="flex-1 border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50"
                            />
                            <button
                                type="submit"
                                disabled={!adminInput.trim()}
                                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

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
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <p className="text-blue-100 text-xs mt-4 leading-relaxed">
                                Used to send automated offer letters with PDF attachments to candidates.
                            </p>
                        </div>

                        <div className="p-8">
                            <form className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Gmail Address</label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="email"
                                            value={emailSettings.email}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="hr@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Gmail App Password (16 Letters)</label>
                                    <div className="relative">
                                        <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="password"
                                            value={emailSettings.password}
                                            onChange={(e) => setEmailSettings(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                                            placeholder="xxxx xxxx xxxx xxxx"
                                        />
                                    </div>
                                    <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                        <p className="text-[10px] text-amber-700 leading-relaxed">
                                            <b>Note:</b> Use a 16-digit Google "App Password", not your login password. Ensure 2-Step Verification is ON in your account.
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
