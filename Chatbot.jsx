import React, { useState } from 'react';
import axios from 'axios';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ text: "Hello! I'm your Attendance AI Assistant. How can I help you today?", sender: "ai" }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const toggleChat = () => setIsOpen(!isOpen);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:5001/api/chat", { message: input });
      const aiMessage = { text: response.data.reply, sender: "ai" };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { text: "Sorry, I'm having trouble connecting right now.", sender: "ai" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 h-96 flex flex-col backdrop-blur-xl bg-black/60 border border-white/20 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 flex justify-between items-center text-white">
            <h3 className="font-bold">AI Assistant</h3>
            <button onClick={toggleChat} className="hover:text-gray-300">&times;</button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.sender === "user" ? "bg-indigo-500 text-white self-end rounded-br-none" : "bg-white/10 text-gray-200 border border-white/10 self-start rounded-bl-none"}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && <div className="text-gray-400 text-xs self-start">AI is typing...</div>}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-white/10 flex gap-2 bg-black/40">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask something..." 
              className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <button onClick={sendMessage} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm transition">
              Send
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        onClick={toggleChat}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/40 text-white flex items-center justify-center hover:scale-110 transition duration-300"
      >
        💬
      </button>
    </div>
  );
};

export default Chatbot;