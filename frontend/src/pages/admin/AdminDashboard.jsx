import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth, API_BASE } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { Users, Search, Filter, MoreVertical, Eye, FileText, CheckCircle, XCircle, Clock, MessageSquare, Send, X, Trash2 } from 'lucide-react';
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



        fetchCandidates();
        checkRetention();

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
        <div className="min-h-screen bg-indigo-50/30 relative">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header and Stats code remains same, omitted for brevity but keeping structure */}
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
                        <p className="mt-2 text-slate-500 font-medium">Manage employee onboardings and documents.</p>
                    </div>

                </div>



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
                                     <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Employee</th>
                                     <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest text-indigo-600">Employee ID</th>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {candidates.map((candidate) => (
                                    <tr key={candidate._id || candidate.id} className="hover:bg-slate-50 transition-colors">
                                         <td className="px-6 py-4 whitespace-nowrap">
                                             <div className="flex items-center">
                                                 <div className="flex-shrink-0 h-10 w-10">
                                                     <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold shadow-sm">
                                                         {(candidate.name || candidate.email || '?').toUpperCase().charAt(0)}
                                                     </div>
                                                 </div>
                                                 <div className="ml-4">
                                                     <div className="text-sm font-medium text-slate-900">{candidate.name}</div>
                                                     <div className="text-sm text-slate-500">{candidate.email}</div>
                                                 </div>
                                             </div>
                                         </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                                             <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 w-fit">
                                                 {candidate.personalDetails?.employeeId || 'N/A'}
                                             </span>
                                         </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                                             <div className="text-sm font-bold text-slate-900 flex items-center gap-1">
                                                 <Clock className="w-3 h-3 text-emerald-500" />
                                                 {candidate.personalDetails?.joiningDate || 'Pending'}
                                             </div>
                                         </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                {getStatusBadge(candidate.status)}

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
                                                onClick={() => navigate(`/admin/candidate/${candidate._id || candidate.id}`)}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition-all inline-flex items-center font-bold"
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
                                    {(selectedChatCandidate.name || selectedChatCandidate.email || '?').toUpperCase().charAt(0)}
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

                                        <div className={`py-3 px-4 max-w-[80%] rounded-2xl shadow-sm text-sm font-medium ${msg.sender === 'admin'
                                            ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100'
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
                                 className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95"
                             >
                                 <Send className="w-5 h-5" />
                             </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
