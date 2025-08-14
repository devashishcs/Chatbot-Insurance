import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Shield, Heart, Car, User, Bot, X, Users, Baby, UserCheck } from 'lucide-react';
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
  
  // Insurance selection state
  const [currentStep, setCurrentStep] = useState(1); // 1: who, 2: age, 3: type
  const [insuranceData, setInsuranceData] = useState({
    forWhom: '',
    age: '',
    type: ''
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isChatOpen]);

  const startChat = async () => {
    if (hasStarted) return;
    
    setIsLoading(true);
    try {
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
        content: 'Hello! 👋 I\'m here to help you find the perfect insurance plan. Let\'s start by knowing who needs insurance coverage.',
        timestamp: new Date()
      };

      setMessages([welcomeMessage]);
      setChatState(data.state);
      setHasStarted(true);
      setCurrentStep(1);
    } catch (error) {
      console.error('Error starting chat:', error);
      const errorMessage = {
        id: 1,
        role: 'assistant',
        content: 'Hello! 👋 I\'m here to help you find the perfect insurance plan. Let\'s start by knowing who needs insurance coverage.',
        timestamp: new Date()
      };
      setMessages([errorMessage]);
      setHasStarted(true);
      setCurrentStep(1);
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

  const handleStepSelection = async (selection, step) => {
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: selection,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Update insurance data
    const updatedData = { ...insuranceData };
    if (step === 1) updatedData.forWhom = selection;
    else if (step === 2) updatedData.age = selection;
    else if (step === 3) updatedData.type = selection;
    
    setInsuranceData(updatedData);
    setIsLoading(true);

    // Determine next step and bot response
    let botResponse = '';
    let nextStep = step + 1;

    if (step === 1) {
      botResponse = `Great! You've selected insurance for ${selection}. Now, please let me know the age range.`;
    } else if (step === 2) {
      botResponse = `Perfect! Age range: ${selection}. Now, what type of insurance are you looking for?`;
    } else if (step === 3) {
      botResponse = `Excellent! Let me process your request:\n\n• For: ${updatedData.forWhom}\n• Age: ${updatedData.age}\n• Type: ${selection}\n\nI'm now finding the best insurance options for you...`;
      nextStep = 4; // Complete
      
      // Send complete data to backend
      // Send complete data to backend as natural language
    try {
      // Convert selections to natural language for LLM extraction
      let naturalMessage = '';
      const ageNumber = updatedData.age.split('-')[0]; // Get first number from age range
      
      if (updatedData.forWhom === 'Myself') {
        naturalMessage = `I'm ${ageNumber} years old and need ${selection.toLowerCase()}`;
      } else if (updatedData.forWhom === 'My Spouse') {
        naturalMessage = `My spouse is ${ageNumber} years old and needs ${selection.toLowerCase()}`;
      } else if (updatedData.forWhom === 'My Child') {
        naturalMessage = `My child is ${ageNumber} years old and needs ${selection.toLowerCase()}`;
      } else if (updatedData.forWhom === 'My Family') {
        naturalMessage = `My family needs ${selection.toLowerCase()}, age range ${updatedData.age}`;
      } else if (updatedData.forWhom === 'My Parents') {
        naturalMessage = `My parents need ${selection.toLowerCase()}, they are ${ageNumber}+ years old`;
      }

      const response = await fetch(`http://127.0.0.1:5000/api/chat/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: naturalMessage,
          state: chatState
        })
      });

        const data = await response.json();
        botResponse = data.response || botResponse;
        setChatState(data.state);
      } catch (error) {
        console.error('Error sending data to backend:', error);
        botResponse += '\n\nI\'ll help you find suitable options based on your requirements.';
      }
    }

    // Add bot response
    const botMessage = {
      id: messages.length + 2,
      role: 'assistant',
      content: botResponse,
      timestamp: new Date()
    };

    setTimeout(() => {
      setMessages(prev => [...prev, botMessage]);
      setCurrentStep(nextStep);
      setIsLoading(false);
    }, 1000);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || currentStep <= 3) return;

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
          state: chatState,
          insuranceData: insuranceData
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

  // Step 1: Who needs insurance
  const whoOptions = [
    { icon: User, label: 'Myself', value: 'Myself' },
    { icon: Heart, label: 'My Spouse', value: 'My Spouse' },
    { icon: Baby, label: 'My Child', value: 'My Child' },
    { icon: Users, label: 'My Family', value: 'My Family' },
    { icon: UserCheck, label: 'My Parents', value: 'My Parents' }
  ];

  // Step 2: Age ranges
  const ageOptions = [
    { label: '0-18 years', value: '0-18 years' },
    { label: '19-30 years', value: '19-30 years' },
    { label: '31-45 years', value: '31-45 years' },
    { label: '46-60 years', value: '46-60 years' },
    { label: '60+ years', value: '60+ years' }
  ];

  // Step 3: Insurance types
  const insuranceTypes = [
    { icon: Heart, label: 'Health Insurance', value: 'Health Insurance' },
    { icon: Shield, label: 'Life Insurance', value: 'Life Insurance' },
    { icon: Car, label: 'Auto Insurance', value: 'Auto Insurance' }
  ];

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

                  {/* Step-based Options */}
                  {messages.length > 0 && currentStep <= 3 && (
                    <div className="space-y-3">
                      <p className="text-xs text-amber-700 text-center font-medium">
                        {currentStep === 1 && 'Step 1/3: Select who needs insurance'}
                        {currentStep === 2 && 'Step 2/3: Select age range'}
                        {currentStep === 3 && 'Step 3/3: Select insurance type'}
                      </p>
                      
                      {/* Step 1: Who needs insurance */}
                      {currentStep === 1 && (
                        <div className="space-y-2">
                          {whoOptions.map((option, index) => (
                            <button
                              key={index}
                              onClick={() => handleStepSelection(option.value, 1)}
                              disabled={isLoading}
                              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors text-sm disabled:opacity-50"
                            >
                              <option.icon size={16} />
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Step 2: Age range */}
                      {currentStep === 2 && (
                        <div className="space-y-2">
                          {ageOptions.map((option, index) => (
                            <button
                              key={index}
                              onClick={() => handleStepSelection(option.value, 2)}
                              disabled={isLoading}
                              className="flex items-center justify-center w-full px-4 py-3 rounded-xl bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100 transition-colors text-sm disabled:opacity-50"
                            >
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Step 3: Insurance type */}
                      {currentStep === 3 && (
                        <div className="space-y-2">
                          {insuranceTypes.map((option, index) => (
                            <button
                              key={index}
                              onClick={() => handleStepSelection(option.value, 3)}
                              disabled={isLoading}
                              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 transition-colors text-sm disabled:opacity-50"
                            >
                              <option.icon size={16} />
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
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

            {/* Input Area - Only show after step 3 is complete */}
            {currentStep > 3 && (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;