import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Headset } from 'lucide-react';
import { useAuth, API_BASE } from '../context/AuthContext';

export default function ChatSupport() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    // API_BASE is imported from AuthContext - correctly resolves to Render in production

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
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-xl shadow-indigo-600/30 transition-all hover:scale-110 active:scale-95 group"
                >
                    <div className="relative">
                        <MessageSquare className="w-7 h-7 group-hover:animate-pulse" />
                    </div>
                </button>
            )}

            {isOpen && (
                <div className="bg-white rounded-[24px] shadow-2xl border border-slate-200/60 w-80 sm:w-96 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col h-[500px]">
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex justify-between items-center text-white shrink-0 shadow-md">
                        <h3 className="font-bold flex items-center tracking-wide">
                            <Headset className="w-5 h-5 mr-2 opacity-90" /> HR Support
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-4">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center text-slate-400 text-sm mt-12 space-y-3">
                                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                                    <Headset className="w-8 h-8 text-indigo-400" />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-slate-600">👋 Hi {user.name}!</p>
                                    <p className="mt-1">Ask us anything about your onboarding.</p>
                                </div>
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === user.email ? 'justify-end' : 'justify-start'}`}>
                                <div className={`py-2.5 px-4 text-sm shadow-sm max-w-[80%] rounded-2xl ${msg.sender === user.email
                                    ? 'bg-indigo-600 text-white rounded-br-sm'
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-3 shrink-0 items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-slate-50 transition-all"
                        />
                        <button 
                            type="submit" 
                            disabled={!input.trim()}
                            className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors shrink-0 shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
