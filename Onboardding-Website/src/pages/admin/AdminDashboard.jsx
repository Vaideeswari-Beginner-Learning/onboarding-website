import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/Navbar';
import { Users, Search, Filter, MoreVertical, Eye, FileText, CheckCircle, XCircle, Clock, MessageSquare, Send, X } from 'lucide-react';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [selectedChatCandidate, setSelectedChatCandidate] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [adminInput, setAdminInput] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                const response = await fetch('/api/candidates');
                if (response.ok) {
                    const data = await response.json();
                    // Reverse to show newest first, assuming backend returns chronological order
                    setCandidates(data.reverse());
                } else {
                    console.error('Failed to fetch candidates');
                }
            } catch (error) {
                console.error('Error fetching candidates:', error);
            }
        };

        fetchCandidates();
        // Optional: Polling or WebSocket for real-time updates could go here
    }, []);

    // Poll for chat messages when a chat is open
    useEffect(() => {
        if (!selectedChatCandidate) return;

        const loadChat = () => {
            // Chat history still local for now as per previous implementation pattern
            // or could be moved to backend later
            const history = localStorage.getItem(`chat_history_${selectedChatCandidate.email}`);
            if (history) {
                setChatMessages(JSON.parse(history));
            } else {
                if (chatMessages.length === 0) setChatMessages([]);
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

    const handleSendAdminMessage = (e) => {
        e.preventDefault();
        if (!adminInput.trim() || !selectedChatCandidate) return;

        const newMsg = {
            text: adminInput,
            sender: 'admin',
            timestamp: Date.now()
        };

        const updatedHistory = [...chatMessages, newMsg];
        setChatMessages(updatedHistory);
        localStorage.setItem(`chat_history_${selectedChatCandidate.email}`, JSON.stringify(updatedHistory));
        setAdminInput('');
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
                </div>

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
                                            {getStatusBadge(candidate.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => setSelectedChatCandidate(candidate)}
                                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md mr-2 transition-colors inline-flex items-center"
                                            >
                                                <MessageSquare className="w-4 h-4 mr-1" /> Chat
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
                                    <div key={idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`py-3 px-4 max-w-[80%] rounded-2xl shadow-sm text-sm ${msg.sender === 'admin'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                            }`}>
                                            {msg.text}
                                        </div>
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
        </div>
    );
}
