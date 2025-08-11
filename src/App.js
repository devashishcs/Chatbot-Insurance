import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Shield, Heart, Car, User, Bot, X, Minimize2 } from 'lucide-react';
import './App.css';
const App = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatState, setChatState] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef(null);
  const [conversationId, setConversationId] = useState(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isChatOpen]);

  const startChat = async () => {
    if (hasStarted) return;
    
    setIsLoading(true);
    try {
      // Call start API endpoint
      const response = await fetch('http://127.0.0.1:5000/api/chat/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      setConversationId(data.conversation_id);
      const welcomeMessage = {
        id: 1,
        role: 'assistant',
        content: data.message || 'Hello! 👋 I\'m here to help you find the perfect insurance plan. What type of coverage are you looking for today?',
        timestamp: new Date()
      };

      setMessages([welcomeMessage]);
      setChatState(data.state);
      setHasStarted(true);
    } catch (error) {
      console.error('Error starting chat:', error);
      const errorMessage = {
        id: 1,
        role: 'assistant',
        content: 'Hello! 👋 I\'m here to help you find the perfect insurance plan. What type of coverage are you looking for today?',
        timestamp: new Date()
      };
      setMessages([errorMessage]);
      setHasStarted(true);
    } finally {
      setIsLoading(false);
    }
  };

  const openChat = () => {
    setIsChatOpen(true);
    if (!hasStarted) {
      startChat();
    }
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const newUserMessage = {
      id: messages.length + 1,
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`http://127.0.0.1:5000/api/chat/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          state: chatState
        })
      });

      const data = await response.json();
      
      const botMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setChatState(data.state);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { icon: Heart, label: 'Health Insurance', message: "I'm interested in health insurance" },
    { icon: Shield, label: 'Life Insurance', message: "I'm looking for life insurance" },
    { icon: Car, label: 'Auto Insurance', message: "I need auto insurance" }
  ];

  const handleQuickAction = (message) => {
    setInputMessage(message);
    setTimeout(() => sendMessage(), 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 relative">
      {/* Main Background Content */}
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Shield className="text-white" size={40} />
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4">
              InsuranceAI
            </h1>
            <p className="text-2xl text-amber-800 mb-8 font-medium">
              Your Smart Insurance Assistant
            </p>
            <p className="text-lg text-amber-700 max-w-2xl mx-auto leading-relaxed">
              Get personalized insurance recommendations in minutes. Our AI-powered assistant 
              helps you find the perfect coverage for health, life, and auto insurance.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-amber-200 hover:shadow-xl transition-all duration-300">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-amber-800 mb-2">Health Insurance</h3>
              <p className="text-amber-700">Comprehensive health coverage tailored to your needs and budget</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-amber-200 hover:shadow-xl transition-all duration-300">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-amber-800 mb-2">Life Insurance</h3>
              <p className="text-amber-700">Protect your loved ones with the right life insurance policy</p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-amber-200 hover:shadow-xl transition-all duration-300">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-amber-800 mb-2">Auto Insurance</h3>
              <p className="text-amber-700">Drive with confidence with affordable auto insurance options</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <p className="text-amber-700 mb-4 text-lg">Ready to get started?</p>
          <button
            onClick={openChat}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 hover:scale-105"
          >
            Start Chat Now →
          </button>
        </div>
      </div>

      {/* Floating Chat Button */}
      {!isChatOpen && (
        <button
          onClick={openChat}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 z-50 animate-pulse"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chat Container */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md h-[600px] flex flex-col border border-amber-200 overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">Insurance Assistant</h3>
                  <p className="text-amber-100 text-sm">Online now</p>
                </div>
              </div>
              <button
                onClick={closeChat}
                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-amber-50/30 to-white">
              {messages.length === 0 && isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bot className="text-white animate-pulse" size={20} />
                    </div>
                    <p className="text-amber-700">Starting conversation...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start gap-3 max-w-[85%] ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                          message.role === 'user' 
                            ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                            : 'bg-gradient-to-r from-amber-500 to-orange-500'
                        }`}>
                          {message.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        
                        {/* Message Bubble */}
                        <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                            : 'bg-white border border-amber-200 text-gray-800'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          <div className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-orange-100' : 'text-gray-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Quick Actions */}
                  {messages.length === 1 && messages[0].role === 'assistant' && (
                    <div className="space-y-2">
                      <p className="text-xs text-amber-700 text-center">Quick options:</p>
                      <div className="flex flex-col gap-2">
                        {quickActions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickAction(action.message)}
                            className="flex items-center gap-2 px-3 py-2 rounded-full bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 transition-colors text-sm"
                          >
                            <action.icon size={14} />
                            <span>{action.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white">
                          <Bot size={14} />
                        </div>
                        <div className="bg-white border border-amber-200 rounded-2xl px-4 py-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce delay-200"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className="w-full p-3 rounded-xl border border-amber-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 resize-none bg-white/80 backdrop-blur-sm transition-all duration-200 text-sm"
                    rows="2"
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-xl hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;