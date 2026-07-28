/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FaRobot, FaTimes, FaPaperPlane } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const [messages, setMessages] = useState([
        { text: "Hello! I am the SiteWatch AI assistant. Ask me about low stocks, active workers, or recent incidents.", isBot: true }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input.trim();
        setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage })
            });

            if (!res.ok) throw new Error("Failed to get response");
            
            const data = await res.json();
            setMessages(prev => [...prev, { text: data.response, isBot: true }]);
        } catch (error) {
            setMessages(prev => [...prev, { text: `Sorry, I am having trouble connecting to the server. (${error.message})`, isBot: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    const hiddenRoutes = ["/", "/login", "/register"];
    if (!isAuthenticated || hiddenRoutes.includes(location.pathname)) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4">
                    {/* Header */}
                    <div className="bg-[#1d1d1f] p-4 text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <FaRobot className="text-[#E8A33D]" />
                            <span className="font-semibold">SiteWatch Assistant</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                            <FaTimes />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.isBot ? 'bg-white border border-gray-200 text-gray-800 self-start rounded-tl-sm' : 'bg-[#0066CC] text-white self-end rounded-tr-sm'}`}>
                                {msg.text}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="bg-white border border-gray-200 text-gray-500 self-start p-3 rounded-2xl rounded-tl-sm text-sm italic">
                                Thinking...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            className="flex-1 bg-gray-100 text-gray-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                        />
                        <button type="submit" disabled={isLoading} className="bg-[#0066CC] text-white p-2.5 rounded-xl hover:bg-[#0055AA] disabled:opacity-50">
                            <FaPaperPlane size={14} />
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 ${isOpen ? 'bg-red-500 text-white' : 'bg-[#0066CC] text-white'}`}
            >
                {isOpen ? <FaTimes size={24} /> : <FaRobot size={24} />}
            </button>
        </div>
    );
};

export default ChatbotWidget;