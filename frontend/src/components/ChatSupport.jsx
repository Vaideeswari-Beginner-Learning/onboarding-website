import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ChatSupport() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const API_BASE = import.meta.env.VITE_API_URL || '';

    // Initial load and polling for new messages
    useEffect(() => {
        if (!user || user.role === 'admin') return; // Admin has their own chat page

        const loadMessages = async () => {
            try {
                const normalizedEmail = user.email.trim().toLowerCase();
                const token = localStorage.getItem('onboarding_token');
                const response = await fetch(`${API_BASE}/api/messages/${normalizedEmail}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setMessages(data);
                }
            } catch (error) {
                console.error("ChatSupport: Error loading messages:", error);
            }
        };

        loadMessages(); // Load immediately

        const interval = setInterval(loadMessages, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, [user, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !user) return;

        const newMessage = {
            sender: user.email.trim().toLowerCase(),
            senderName: user.name,
            receiver: 'admin',
            text: input
        };

        // Optimistic UI update
        const optimisticMsg = { ...newMessage, sender: user.email, timestamp: Date.now() };
        setMessages(prev => [...prev, optimisticMsg]);
        setInput('');

        try {
            console.log("ChatSupport: Sending message...");
            const token = localStorage.getItem('onboarding_token');
            const res = await fetch(`${API_BASE}/api/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newMessage)
            });
            if (res.ok) {
                console.log("ChatSupport: Message sent successfully");
            } else {
                console.error("ChatSupport: Message send failed");
            }
        } catch (error) {
            console.error("ChatSupport: Error sending message:", error);
        }
    };

    if (!user || user.role === 'admin') return null; // Don't show floating chat for admin

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg shadow-blue-600/30 transition-all hover:scale-110"
                >
                    <div className="relative">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                </button>
            )}

            {isOpen && (
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 sm:w-96 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 flex flex-col h-[500px]">
                    <div className="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0">
                        <h3 className="font-bold flex items-center">
                            <MessageSquare className="w-5 h-5 mr-2" /> HR Support
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-400 text-sm mt-10">
                                <p>👋 Hi {user.name}!</p>
                                <p>Ask us anything about your onboarding.</p>
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === user.email ? 'justify-end' : 'justify-start'}`}>
                                <div className={`py-2 px-3 text-sm shadow-sm max-w-[80%] rounded-2xl ${msg.sender === user.email
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
