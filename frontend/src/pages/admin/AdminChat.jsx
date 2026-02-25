import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { MessageSquare, Send, Search, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function AdminChat() {
    const { user } = useAuth();
    const location = useLocation();
    const [conversations, setConversations] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const API_BASE = import.meta.env.VITE_API_URL || '';

    // Fetch active conversations
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const token = localStorage.getItem('onboarding_token');
                const response = await fetch(`${API_BASE}/api/admin/conversations`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log("AdminChat: Conversations list:", data);
                    setConversations(data);

                    // Check if we navigated here with a selected user
                    if (location.state?.selectedEmail) {
                        console.log("AdminChat: Navigated with selected user:", location.state.selectedEmail);
                        const preSelected = data.find(c => c.email === location.state.selectedEmail);
                        if (preSelected) {
                            console.log("AdminChat: Found pre-selected user in list");
                            setSelectedUser(preSelected);
                        } else {
                            console.log("AdminChat: User not in list, setting manually");
                            // If user not in conversation list yet (first message), manually set them
                            // We might need to fetch their details if not in list, but for now let's hope they are in list or minimal info
                            setSelectedUser({ email: location.state.selectedEmail, name: 'Candidate' });
                        }
                    }
                }
            } catch (error) {
                console.error("AdminChat: Error fetching conversations:", error);
            }
        };

        fetchConversations();
        const interval = setInterval(fetchConversations, 5000); // Poll for new users
        return () => clearInterval(interval);
    }, [location.state]);

    // Fetch messages for selected user
    useEffect(() => {
        if (!selectedUser) return;

        const fetchMessages = async () => {
            try {
                const normalizedEmail = selectedUser.email.trim().toLowerCase();
                console.log("AdminChat: Fetching messages for", normalizedEmail);
                const token = localStorage.getItem('onboarding_token');
                const response = await fetch(`${API_BASE}/api/messages/${normalizedEmail}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setMessages(data);
                }
            } catch (error) {
                console.error("AdminChat: Error fetching messages:", error);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 2000); // Poll faster for active chat
        return () => clearInterval(interval);
    }, [selectedUser]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !selectedUser) return;

        const newMessage = {
            sender: 'admin',
            senderName: user?.name || 'HR Admin',
            receiver: selectedUser.email.trim().toLowerCase(),
            text: input
        };

        // Optimistic UI
        setMessages(prev => [...prev, { ...newMessage, timestamp: Date.now() }]);
        setInput('');

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

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex gap-6 h-[calc(100vh-80px)]">

                {/* Sidebar: Conversation List */}
                <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center mb-4">
                            <MessageSquare className="w-5 h-5 mr-2 text-blue-600" /> Inbox
                        </h2>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search candidates..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                No active conversations.
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <button
                                    key={conv.email}
                                    onClick={() => setSelectedUser(conv)}
                                    className={`w-full p-4 flex items-center hover:bg-slate-50 transition-colors border-b border-slate-50 ${selectedUser?.email === conv.email ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                                >
                                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 mr-3">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="text-left overflow-hidden">
                                        <h3 className="font-bold text-slate-800 truncate">{conv.name || conv.email.split('@')[0]}</h3>
                                        <p className="text-sm text-slate-500 truncate">{conv.email}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="w-2/3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    {selectedUser ? (
                        <>
                            <div className="p-4 border-b border-slate-100 flex items-center bg-slate-50/50">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3 font-bold">
                                    {selectedUser.name ? selectedUser.name[0] : selectedUser.email[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{selectedUser.name || selectedUser.email}</h3>
                                    <p className="text-xs text-slate-500">Candidate • {selectedUser.email}</p>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`py-3 px-4 shadow-sm max-w-[70%] rounded-2xl ${msg.sender === 'admin'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                            }`}>
                                            <p>{msg.text}</p>
                                            <div className={`text-[10px] mt-1 opacity-70 ${msg.sender === 'admin' ? 'text-blue-100 text-right' : 'text-slate-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex gap-3">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="flex-1 border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    <Send className="w-4 h-4 mr-2" /> Send
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <MessageSquare className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-600">Select a conversation</h3>
                            <p>Choose a candidate from the list to view and reply to messages.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
