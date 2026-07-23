import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Menu, Plus, MessageSquare, Send, Sun, Moon, LogOut, 
  Paperclip, AlertTriangle, ArrowLeft, Copy, Check, Sparkles, Shield, Stethoscope, FileText
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

// Lightweight inline formatter for markdown-like formatting (bold, headers, lists)
const FormattedMessage = ({ content }) => {
  if (!content) return null;

  // Split into lines
  const lines = content.split('\n');
  
  return (
    <div className="formatted-markdown space-y-1.5 leading-relaxed text-sm sm:text-base">
      {lines.map((line, lineIdx) => {
        let trimmed = line.trim();
        if (!trimmed) return <div key={lineIdx} className="h-1" />;

        // Header ###
        if (trimmed.startswith && trimmed.startsWith('#')) {
          const headerText = trimmed.replace(/^#+\s*/, '');
          return <h4 key={lineIdx} className="font-bold text-base sm:text-lg text-blue-600 dark:text-blue-400 mt-2 mb-1">{headerText}</h4>;
        }

        // Bullet point - or *
        const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ');
        if (isBullet) {
          trimmed = trimmed.replace(/^[*|-]\s*/, '');
        }

        // Parse **bold** inside text
        const parts = trimmed.split(/(\*\*.*?\*\*)/g);
        const renderedText = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pIdx} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-2">
              <span className="text-blue-500 font-bold">•</span>
              <span>{renderedText}</span>
            </div>
          );
        }

        return <p key={lineIdx}>{renderedText}</p>;
      })}
    </div>
  );
};

const SUGGESTIONS = [
  { icon: <Stethoscope className="w-4 h-4 text-blue-500" />, text: "I have a high fever and headache" },
  { icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, text: "What symptoms require emergency care?" },
  { icon: <FileText className="w-4 h-4 text-emerald-500" />, text: "How should I prepare for a blood test?" },
  { icon: <Sparkles className="w-4 h-4 text-purple-500" />, text: "Tips for managing stress and sleep" }
];

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { logout } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const welcomeMsg = { 
    role: 'assistant', 
    content: '👋 **Welcome to MediBot!** I am your AI assistant dedicated strictly to medical, health, and diagnostic guidance.\n\nHow can I help analyze your symptoms or address your health concerns today?' 
  };

  useEffect(() => {
    fetchConversations();
    if (id) {
      fetchMessages(id);
    } else {
      setMessages([welcomeMsg]);
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const res = await api.get(`/chat/conversations/${convId}`);
      setMessages([welcomeMsg, ...res.data.messages]);
    } catch (e) {
      console.error(e);
    }
  };

  const startNewChat = () => {
    navigate('/chat');
    setMessages([welcomeMsg]);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const sendMessageText = async (userMessage) => {
    if (!userMessage.trim() || loading) return;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      let activeId = id;
      if (!activeId) {
        const convRes = await api.post('/chat/conversations', { title: userMessage.substring(0, 30) + '...' });
        activeId = convRes.data.id;
      }

      const res = await api.post(`/chat/conversations/${activeId}/messages`, { content: userMessage });
      
      if (!id) {
        navigate(`/chat/${activeId}`, { replace: true });
        fetchConversations();
      } else {
        setMessages(prev => [...prev, res.data]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ Unable to connect to the medical assistant service. Please check your connection and try again.', 
        is_emergency: false 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessageText(input);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
       alert("Only PDF medical report files are supported.");
       return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await api.post('/documents/upload', formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `📄 **Medical Report Uploaded:** \`${file.name}\`\n\nI have securely logged your report. What specific values or findings would you like me to clarify for you?`, 
        is_emergency: false 
      }]);
    } catch (e) {
      console.error(e);
      alert("Failed to upload document. Please try again.");
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-20 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xl tracking-tight">
             MediBot
          </Link>
          <Link to="/dashboard" className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Back to Dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>

        <div className="p-4">
          <button 
            onClick={startNewChat} 
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-3 rounded-2xl transition font-semibold shadow-md hover:shadow-lg active:scale-98"
          >
            <Plus className="h-5 w-5" /> New Consultation
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-3 mt-2">Consultation History</div>
          {conversations.length === 0 ? (
            <div className="text-xs text-slate-400 px-3 py-4 text-center italic">No previous chats</div>
          ) : (
            conversations.slice().reverse().map(c => (
              <Link 
                key={c.id} 
                to={`/chat/${c.id}`} 
                onClick={() => window.innerWidth < 768 && setSidebarOpen(false)} 
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition text-sm group ${id == c.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                <MessageSquare className={`h-4 w-4 transition flex-shrink-0 ${id == c.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-blue-500'}`} />
                <span className="truncate">{c.title}</span>
              </Link>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm font-medium">
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-500" />}
            {isDarkMode ? 'Light Appearance' : 'Dark Appearance'}
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition text-sm font-medium text-red-500 hover:text-red-600">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 relative">
        {/* Top Header Bar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition md:hidden">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">MediBot AI</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-medium border border-blue-100 dark:border-blue-800">
                <Shield className="w-3 h-3" /> Medical Guidance Only
              </span>
            </div>
          </div>
          <Link to="/dashboard" className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition">
            Dashboard →
          </Link>
        </header>

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-44 space-y-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 sm:gap-4 animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-md ${msg.is_emergency ? 'bg-red-500 glow-effect' : 'bg-gradient-to-br from-blue-600 to-cyan-600'}`}>
                    {msg.is_emergency ? <AlertTriangle className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
                  </div>
                )}

                <div className={`group relative max-w-[85%] sm:max-w-[80%] rounded-3xl px-5 py-4 shadow-sm transition-all ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-tr-none' 
                    : msg.is_emergency 
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-100 rounded-tl-none border border-red-200 dark:border-red-800/60' 
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60'
                }`}>
                  {msg.is_emergency && (
                    <div className="font-extrabold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5 text-xs sm:text-sm tracking-wide uppercase">
                      <AlertTriangle className="w-4 h-4 animate-bounce" /> Emergency Warning Notice
                    </div>
                  )}

                  {msg.role === 'assistant' ? (
                    <FormattedMessage content={msg.content} />
                  ) : (
                    <div className="whitespace-pre-wrap text-sm sm:text-base">{msg.content}</div>
                  )}

                  {/* Copy Button for Assistant */}
                  {msg.role === 'assistant' && (
                    <button 
                      onClick={() => copyToClipboard(msg.content, idx)} 
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition"
                      title="Copy response"
                    >
                      {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-4 justify-start animate-fade-in">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                  <Stethoscope className="h-4 w-4 animate-spin" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-3xl rounded-tl-none px-5 py-4 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-xs text-slate-400 font-medium ml-2">Analyzing medical parameters...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar & Suggestion Chips */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-slate-900 dark:via-slate-900/95 pt-8 pb-4 px-4">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* Quick Suggestion Chips (when starting new conversation) */}
            {messages.length <= 1 && !loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 animate-fade-in">
                {SUGGESTIONS.map((s, idx) => (
                  <button 
                    key={idx}
                    onClick={() => sendMessageText(s.text)}
                    className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-slate-200 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-700 rounded-2xl text-left text-xs sm:text-sm transition-all group"
                  >
                    {s.icon}
                    <span className="truncate group-hover:text-blue-600 dark:group-hover:text-blue-300">{s.text}</span>
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="relative flex items-center gap-2 bg-slate-100 dark:bg-slate-800/90 rounded-3xl p-2 shadow-lg border border-slate-200 dark:border-slate-700/80 focus-within:ring-2 focus-within:ring-blue-500/50 transition">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className="p-3 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                title="Upload PDF Medical Report"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe symptoms or medical questions..."
                className="w-full max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-3 px-2 text-slate-800 dark:text-slate-100 text-sm sm:text-base placeholder:text-slate-400"
                rows="1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || loading} 
                className="p-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-40 text-white rounded-full transition shadow-md flex-shrink-0"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>

            <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              MediBot strictly addresses medical & health guidance. Always consult a licensed doctor for formal diagnoses.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
